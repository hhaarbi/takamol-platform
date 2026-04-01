/**
 * Stripe Webhook Handler
 * Route: POST /api/webhooks/stripe
 * MUST be registered BEFORE express.json() middleware to preserve raw body for signature verification
 *
 * Supported events:
 * - checkout.session.completed
 * - invoice.payment_succeeded
 * - invoice.payment_failed
 * - customer.subscription.updated
 * - customer.subscription.deleted
 */
import type { Request, Response } from "express";
import Stripe from "stripe";
import { stripe } from "./_core/stripe";
import { getDb } from "./db";
import {
  subscriptions,
  subscriptionInvoices,
  planChangeLog,
  plans,
  companies,
} from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";
const VAT_RATE = 0.15;

function now() {
  return Date.now();
}

function generateInvoiceNumber() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `INV-${y}${m}-${rand}`;
}

function addMonths(ms: number, months: number) {
  const d = new Date(ms);
  d.setMonth(d.getMonth() + months);
  return d.getTime();
}

function addYears(ms: number, years: number) {
  const d = new Date(ms);
  d.setFullYear(d.getFullYear() + years);
  return d.getTime();
}

// ─── MAIN WEBHOOK HANDLER ────────────────────────────────────────────────────
export async function handleStripeWebhook(req: Request, res: Response) {
  if (!stripe) {
    console.error("[Stripe Webhook] Stripe not configured");
    return res.status(500).json({ error: "Stripe not configured" });
  }

  // Test event detection (for webhook verification)
  const rawBody = req.body as Buffer;
  const signature = req.headers["stripe-signature"] as string;

  let event: Stripe.Event;

  try {
    if (WEBHOOK_SECRET) {
      event = stripe.webhooks.constructEvent(rawBody, signature, WEBHOOK_SECRET);
    } else {
      // Dev mode: parse without verification
      event = JSON.parse(rawBody.toString()) as Stripe.Event;
      console.warn("[Stripe Webhook] No WEBHOOK_SECRET — skipping signature verification (dev mode)");
    }
  } catch (err: any) {
    console.error("[Stripe Webhook] Signature verification failed:", err.message);
    return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
  }

  // Handle test events
  if (event.id.startsWith("evt_test_")) {
    console.log("[Stripe Webhook] Test event detected, returning verification response");
    return res.json({ verified: true });
  }

  console.log(`[Stripe Webhook] Processing event: ${event.type} (${event.id})`);

  try {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    switch (event.type) {
      // ─── CHECKOUT COMPLETED ──────────────────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(db, session);
        break;
      }

      // ─── INVOICE PAID ────────────────────────────────────────────────────
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(db, invoice);
        break;
      }

      // ─── INVOICE FAILED ──────────────────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoiceFailed(db, invoice);
        break;
      }

      // ─── SUBSCRIPTION UPDATED ────────────────────────────────────────────
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(db, sub);
        break;
      }

      // ─── SUBSCRIPTION DELETED ────────────────────────────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(db, sub);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true, eventType: event.type });
  } catch (err: any) {
    console.error(`[Stripe Webhook] Error processing ${event.type}:`, err);
    res.status(500).json({ error: "Webhook processing failed" });
  }
}

// ─── EVENT HANDLERS ──────────────────────────────────────────────────────────

async function handleCheckoutCompleted(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  session: Stripe.Checkout.Session
) {
  const companyId = parseInt(session.metadata?.companyId ?? "0");
  const planId = parseInt(session.metadata?.planId ?? "0");
  const billingCycle = (session.metadata?.billingCycle ?? "monthly") as "monthly" | "yearly";

  if (!companyId || !planId) {
    console.error("[Stripe Webhook] Missing companyId or planId in session metadata");
    return;
  }

  // Get plan details
  const planRows = await db.select().from(plans).where(eq(plans.id, planId)).limit(1);
  const plan = planRows[0];
  if (!plan) {
    console.error(`[Stripe Webhook] Plan ${planId} not found`);
    return;
  }

  const startDate = now();
  const endDate = billingCycle === "yearly" ? addYears(startDate, 1) : addMonths(startDate, 1);
  const amount = billingCycle === "yearly" ? plan.priceYearly : plan.priceMonthly;

  // Check for existing subscription
  const existingSubs = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.companyId, companyId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  const existingSub = existingSubs[0];

  if (existingSub) {
    // Update existing subscription
    await db
      .update(subscriptions)
      .set({
        planId,
        status: "active",
        startDate,
        endDate,
        billingCycle,
        amount: amount ?? "0",
        currency: "SAR",
        cancelledAt: null,
        cancelReason: null,
        updatedAt: now(),
      })
      .where(eq(subscriptions.id, existingSub.id));

    // Log plan change if different plan
    if (existingSub.planId !== planId) {
      await db.insert(planChangeLog).values({
        companyId,
        fromPlanId: existingSub.planId,
        toPlanId: planId,
        changeType: "upgrade",
        reason: "Stripe checkout completed",
        changedBy: null,
        changedAt: now(),
      });
    }
  } else {
    // Create new subscription
    await db.insert(subscriptions).values({
      companyId,
      planId,
      status: "active",
      startDate,
      endDate,
      billingCycle,
      amount: amount ?? "0",
      currency: "SAR",
      createdAt: now(),
      updatedAt: now(),
    });

    // Log trial start
    await db.insert(planChangeLog).values({
      companyId,
      fromPlanId: null,
      toPlanId: planId,
      changeType: "trial_start",
      reason: "New subscription via Stripe checkout",
      changedBy: null,
      changedAt: now(),
    });
  }

  // Update company status to active
  await db
    .update(companies)
    .set({ status: "active", updatedAt: now() })
    .where(eq(companies.id, companyId));

  // Create invoice record
  const subRows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.companyId, companyId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  const sub = subRows[0];
  if (sub && amount) {
    const amountNum = Number(amount);
    await db.insert(subscriptionInvoices).values({
      companyId,
      subscriptionId: sub.id,
      planId,
      amount: String(amountNum),
      currency: "SAR",
      status: "paid",
      billingCycle,
      periodStart: startDate,
      periodEnd: endDate,
      paidAt: now(),
      invoiceNumber: generateInvoiceNumber(),
      notes: `VAT 15%: ${(amountNum * VAT_RATE).toFixed(2)} SAR | Total: ${(amountNum * (1 + VAT_RATE)).toFixed(2)} SAR`,
      createdAt: now(),
    });
  }

  console.log(`[Stripe Webhook] ✅ Subscription activated for company ${companyId}, plan ${planId}`);
}

async function handleInvoicePaid(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  invoice: Stripe.Invoice
) {
  const companyId = parseInt((invoice as any).subscription_details?.metadata?.companyId ?? "0");
  if (!companyId) return;

  // Extend subscription end date
  const subRows = await db
    .select()
    .from(subscriptions)
    .where(and(eq(subscriptions.companyId, companyId), eq(subscriptions.status, "active")))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  const sub = subRows[0];
  if (!sub) return;

  const billingCycle = sub.billingCycle ?? "monthly";
  const newEndDate = billingCycle === "yearly"
    ? addYears(sub.endDate ?? now(), 1)
    : addMonths(sub.endDate ?? now(), 1);

  await db
    .update(subscriptions)
    .set({ endDate: newEndDate, status: "active", updatedAt: now() })
    .where(eq(subscriptions.id, sub.id));

  // Create invoice record
  const amount = (invoice.amount_paid / 100).toFixed(2);
  await db.insert(subscriptionInvoices).values({
    companyId,
    subscriptionId: sub.id,
    planId: sub.planId,
    amount,
    currency: "SAR",
    status: "paid",
    billingCycle: sub.billingCycle ?? "monthly",
    periodStart: (invoice.period_start ?? 0) * 1000,
    periodEnd: (invoice.period_end ?? 0) * 1000,
    paidAt: now(),
    invoiceNumber: generateInvoiceNumber(),
    notes: `Stripe Invoice: ${invoice.id}`,
    createdAt: now(),
  });

  console.log(`[Stripe Webhook] ✅ Invoice paid for company ${companyId}`);
}

async function handleInvoiceFailed(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  invoice: Stripe.Invoice
) {
  const companyId = parseInt((invoice as any).subscription_details?.metadata?.companyId ?? "0");
  if (!companyId) return;

  // Mark subscription as past_due
  await db
    .update(subscriptions)
    .set({ status: "past_due", updatedAt: now() })
    .where(and(eq(subscriptions.companyId, companyId), eq(subscriptions.status, "active")));

  // Create failed invoice record
  const amount = (invoice.amount_due / 100).toFixed(2);
  const subRows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.companyId, companyId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  const sub = subRows[0];
  if (sub) {
    await db.insert(subscriptionInvoices).values({
      companyId,
      subscriptionId: sub.id,
      planId: sub.planId,
      amount,
      currency: "SAR",
      status: "failed",
      billingCycle: sub.billingCycle ?? "monthly",
      periodStart: (invoice.period_start ?? 0) * 1000,
      periodEnd: (invoice.period_end ?? 0) * 1000,
      paidAt: null,
      invoiceNumber: generateInvoiceNumber(),
      notes: `Failed Stripe Invoice: ${invoice.id}`,
      createdAt: now(),
    });
  }

  console.log(`[Stripe Webhook] ⚠️ Invoice payment failed for company ${companyId}`);
}

async function handleSubscriptionUpdated(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  stripeSub: Stripe.Subscription
) {
  const companyId = parseInt(stripeSub.metadata?.companyId ?? "0");
  if (!companyId) return;

  const stripeStatus = stripeSub.status;
  let localStatus: "active" | "trialing" | "past_due" | "cancelled" | "expired" = "active";

  if (stripeStatus === "trialing") localStatus = "trialing";
  else if (stripeStatus === "past_due") localStatus = "past_due";
  else if (stripeStatus === "canceled") localStatus = "cancelled";
  else if (stripeStatus === "active") localStatus = "active";

  await db
    .update(subscriptions)
    .set({
      status: localStatus,
      endDate: ((stripeSub as any).current_period_end ?? 0) * 1000,
      updatedAt: now(),
    })
    .where(eq(subscriptions.companyId, companyId));

  console.log(`[Stripe Webhook] ✅ Subscription updated for company ${companyId}: ${localStatus}`);
}

async function handleSubscriptionDeleted(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  stripeSub: Stripe.Subscription
) {
  const companyId = parseInt(stripeSub.metadata?.companyId ?? "0");
  if (!companyId) return;

  await db
    .update(subscriptions)
    .set({
      status: "cancelled",
      cancelledAt: now(),
      cancelReason: "Stripe subscription deleted",
      updatedAt: now(),
    })
    .where(eq(subscriptions.companyId, companyId));

  // Update company status
  await db
    .update(companies)
    .set({ status: "cancelled", updatedAt: now() })
    .where(eq(companies.id, companyId));

  console.log(`[Stripe Webhook] ✅ Subscription deleted for company ${companyId}`);
}
