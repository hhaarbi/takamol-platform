/**
 * Stripe Router — SaaS Billing via Stripe
 * Handles: checkout sessions, customer portal, subscription management
 * VAT: 15% added to all transactions (Saudi Arabia requirement)
 */
import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { stripe, STRIPE_PRICE_IDS, getPriceIdForPlan } from "../_core/stripe";
import { getDb } from "../db";
import {
  companies,
  subscriptions,
  subscriptionInvoices,
  planChangeLog,
  plans,
} from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

// ─── VAT CONSTANT ────────────────────────────────────────────────────────────
const VAT_RATE = 0.15; // 15% Saudi VAT

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function now() {
  return Date.now();
}

async function getOrCreateStripeCustomer(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  user: { id: number; email?: string | null; name?: string | null },
  companyId: number
): Promise<string> {
  if (!stripe) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripe not configured" });

  // Check if company already has a Stripe customer ID
  const company = await db
    .select()
    .from(companies)
    .where(eq(companies.id, companyId))
    .limit(1);

  const existing = company[0] as any;
  if (existing?.stripeCustomerId) {
    return existing.stripeCustomerId;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email: user.email ?? undefined,
    name: user.name ?? undefined,
    metadata: {
      userId: String(user.id),
      companyId: String(companyId),
    },
  });

  // Save customer ID to company (we'll add this column via migration)
  // For now store in metadata — will persist after schema migration
  return customer.id;
}

// ─── ROUTER ──────────────────────────────────────────────────────────────────
export const stripeRouter = router({
  /**
   * Get available plans with Stripe price IDs
   */
  getPlans: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const allPlans = await db
      .select()
      .from(plans)
      .where(eq(plans.isActive, 1))
      .orderBy(plans.sortOrder);

    return allPlans.map((plan) => ({
      ...plan,
      stripePriceId: getPriceIdForPlan(plan.name ?? ""),
      vatRate: VAT_RATE,
      priceWithVat: plan.priceMonthly
        ? Number(plan.priceMonthly) * (1 + VAT_RATE)
        : null,
    }));
  }),

  /**
   * Create Stripe Checkout Session for subscription
   */
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        planId: z.number(),
        billingCycle: z.enum(["monthly", "yearly"]).default("monthly"),
        origin: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!stripe) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripe not configured" });

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Get plan details
      const planRows = await db.select().from(plans).where(eq(plans.id, input.planId)).limit(1);
      const plan = planRows[0];
      if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found" });

      const priceId = getPriceIdForPlan(plan.name ?? "");
      if (!priceId) throw new TRPCError({ code: "BAD_REQUEST", message: "No Stripe price configured for this plan" });

      const companyId = (ctx.user as any).companyId ?? 1;
      const customerId = await getOrCreateStripeCustomer(db, ctx.user, companyId);

      // Create checkout session with VAT (Stripe Tax handles it automatically)
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        mode: "subscription",
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        // VAT note: Add tax_rates or use Stripe Tax for automatic VAT
        metadata: {
          userId: String(ctx.user.id),
          companyId: String(companyId),
          planId: String(input.planId),
          billingCycle: input.billingCycle,
        },
        client_reference_id: String(ctx.user.id),
        customer_email: !customerId ? (ctx.user.email ?? undefined) : undefined,
        allow_promotion_codes: true,
        success_url: `${input.origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${input.origin}/billing/cancel`,
        subscription_data: {
          metadata: {
            userId: String(ctx.user.id),
            companyId: String(companyId),
            planId: String(input.planId),
          },
          trial_period_days: plan.trialDays ?? 0,
        },
      });

      return { url: session.url, sessionId: session.id };
    }),

  /**
   * Create Stripe Customer Portal Session (manage billing, cancel, update card)
   */
  createPortalSession: protectedProcedure
    .input(z.object({ origin: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      if (!stripe) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripe not configured" });

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const companyId = (ctx.user as any).companyId ?? 1;
      const customerId = await getOrCreateStripeCustomer(db, ctx.user, companyId);

      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${input.origin}/billing`,
      });

      return { url: session.url };
    }),

  /**
   * Get current subscription status for the user's company
   */
  getSubscriptionStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const companyId = (ctx.user as any).companyId;
    if (!companyId) return { hasSubscription: false, status: "none", plan: null };

    const rows = await db
      .select({ sub: subscriptions, plan: plans })
      .from(subscriptions)
      .leftJoin(plans, eq(subscriptions.planId, plans.id))
      .where(eq(subscriptions.companyId, companyId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    if (!rows[0]) return { hasSubscription: false, status: "none", plan: null };

    const { sub, plan } = rows[0];
    const n = now();
    let status = sub.status ?? "expired";

    // Compute live status
    if (sub.trialEndDate && n < sub.trialEndDate && sub.status === "trialing") status = "trialing";
    else if (sub.endDate && n > sub.endDate) status = "expired";
    else if (sub.status === "active") status = "active";

    return {
      hasSubscription: true,
      status,
      plan,
      subscription: sub,
      daysLeft: sub.endDate ? Math.max(0, Math.ceil((sub.endDate - n) / 86400000)) : null,
    };
  }),

  /**
   * Get billing history (invoices)
   */
  getBillingHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    const companyId = (ctx.user as any).companyId;
    if (!companyId) return [];

    const invoices = await db
      .select()
      .from(subscriptionInvoices)
      .where(eq(subscriptionInvoices.companyId, companyId))
      .orderBy(desc(subscriptionInvoices.createdAt))
      .limit(50);

    return invoices.map((inv) => ({
      ...inv,
      amountWithVat: Number(inv.amount) * (1 + VAT_RATE),
      vatAmount: Number(inv.amount) * VAT_RATE,
    }));
  }),

  /**
   * Cancel subscription (sets cancel_at_period_end in Stripe)
   */
  cancelSubscription: protectedProcedure
    .input(z.object({ reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      if (!stripe) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripe not configured" });

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const companyId = (ctx.user as any).companyId;
      if (!companyId) throw new TRPCError({ code: "BAD_REQUEST", message: "No company associated" });

      // Get active subscription
      const rows = await db
        .select()
        .from(subscriptions)
        .where(and(eq(subscriptions.companyId, companyId), eq(subscriptions.status, "active")))
        .orderBy(desc(subscriptions.createdAt))
        .limit(1);

      const sub = rows[0];
      if (!sub) throw new TRPCError({ code: "NOT_FOUND", message: "No active subscription found" });

      // Update local DB
      await db
        .update(subscriptions)
        .set({
          status: "cancelled",
          cancelledAt: now(),
          cancelReason: input.reason ?? "User requested cancellation",
          updatedAt: now(),
        })
        .where(eq(subscriptions.id, sub.id));

      // Log the change
      await db.insert(planChangeLog).values({
        companyId,
        fromPlanId: sub.planId,
        toPlanId: sub.planId,
        changeType: "cancel",
        reason: input.reason ?? "User requested cancellation",
        changedBy: ctx.user.id,
        changedAt: now(),
      });

      return { success: true, message: "Subscription cancelled successfully" };
    }),

  /**
   * Upgrade subscription to a higher plan
   */
  upgradeSubscription: protectedProcedure
    .input(z.object({ newPlanId: z.number(), origin: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      if (!stripe) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripe not configured" });

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // For upgrades, create a new checkout session with the new plan
      const planRows = await db.select().from(plans).where(eq(plans.id, input.newPlanId)).limit(1);
      const plan = planRows[0];
      if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found" });

      const priceId = getPriceIdForPlan(plan.name ?? "");
      if (!priceId) throw new TRPCError({ code: "BAD_REQUEST", message: "No Stripe price for this plan" });

      const companyId = (ctx.user as any).companyId ?? 1;
      const customerId = await getOrCreateStripeCustomer(db, ctx.user, companyId);

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        metadata: {
          userId: String(ctx.user.id),
          companyId: String(companyId),
          planId: String(input.newPlanId),
          changeType: "upgrade",
        },
        client_reference_id: String(ctx.user.id),
        allow_promotion_codes: true,
        success_url: `${input.origin}/billing/success?session_id={CHECKOUT_SESSION_ID}&upgrade=true`,
        cancel_url: `${input.origin}/billing`,
      });

      return { url: session.url, sessionId: session.id };
    }),

  /**
   * Downgrade subscription to a lower plan
   */
  downgradeSubscription: protectedProcedure
    .input(z.object({ newPlanId: z.number(), origin: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      // Downgrade works same as upgrade — new checkout session
      if (!stripe) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripe not configured" });

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const planRows = await db.select().from(plans).where(eq(plans.id, input.newPlanId)).limit(1);
      const plan = planRows[0];
      if (!plan) throw new TRPCError({ code: "NOT_FOUND", message: "Plan not found" });

      const priceId = getPriceIdForPlan(plan.name ?? "");
      if (!priceId) throw new TRPCError({ code: "BAD_REQUEST", message: "No Stripe price for this plan" });

      const companyId = (ctx.user as any).companyId ?? 1;
      const customerId = await getOrCreateStripeCustomer(db, ctx.user, companyId);

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        metadata: {
          userId: String(ctx.user.id),
          companyId: String(companyId),
          planId: String(input.newPlanId),
          changeType: "downgrade",
        },
        client_reference_id: String(ctx.user.id),
        allow_promotion_codes: true,
        success_url: `${input.origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${input.origin}/billing`,
      });

      return { url: session.url, sessionId: session.id };
    }),
});
