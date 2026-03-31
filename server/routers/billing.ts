/**
 * Billing Router — Feature Gating + Expiration Logic + Usage Limits
 * Works standalone without any Manus dependency.
 *
 * Procedures:
 *   billing.getStatus       — Current subscription status + feature access
 *   billing.checkFeature    — Check if a specific feature is available
 *   billing.getUsage        — Current usage vs plan limits
 *   billing.checkLimit      — Check if a resource limit is reached
 *   billing.getPlans        — List all available plans
 *   billing.activate        — Activate a subscription (after payment confirmation)
 *   billing.expire          — Mark subscription as expired (cron job)
 */
import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { plans, subscriptions, companies, properties, units, users } from "../../drizzle/schema";
import { eq, and, count, lte } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// ─── Plan Feature Definitions ─────────────────────────────────────────────────
export interface PlanFeatures {
  maxProperties: number;        // -1 = unlimited
  maxUnits: number;             // -1 = unlimited
  maxUsers: number;             // -1 = unlimited
  hasAIAssistant: boolean;
  hasOwnerPortal: boolean;
  hasTenantPortal: boolean;
  hasAPIAccess: boolean;
  hasAdvancedReports: boolean;
  hasWhatsAppIntegration: boolean;
  hasAccountingExport: boolean;
  hasBrokerManagement: boolean;
  hasMultiCompany: boolean;
  supportLevel: "community" | "email" | "priority" | "dedicated";
}

export const DEFAULT_PLAN_FEATURES: Record<string, PlanFeatures> = {
  basic: {
    maxProperties: 10,
    maxUnits: 50,
    maxUsers: 3,
    hasAIAssistant: false,
    hasOwnerPortal: false,
    hasTenantPortal: false,
    hasAPIAccess: false,
    hasAdvancedReports: false,
    hasWhatsAppIntegration: false,
    hasAccountingExport: false,
    hasBrokerManagement: false,
    hasMultiCompany: false,
    supportLevel: "community",
  },
  pro: {
    maxProperties: 50,
    maxUnits: 300,
    maxUsers: 10,
    hasAIAssistant: true,
    hasOwnerPortal: true,
    hasTenantPortal: true,
    hasAPIAccess: false,
    hasAdvancedReports: true,
    hasWhatsAppIntegration: true,
    hasAccountingExport: true,
    hasBrokerManagement: true,
    hasMultiCompany: false,
    supportLevel: "email",
  },
  enterprise: {
    maxProperties: -1,
    maxUnits: -1,
    maxUsers: -1,
    hasAIAssistant: true,
    hasOwnerPortal: true,
    hasTenantPortal: true,
    hasAPIAccess: true,
    hasAdvancedReports: true,
    hasWhatsAppIntegration: true,
    hasAccountingExport: true,
    hasBrokerManagement: true,
    hasMultiCompany: true,
    supportLevel: "dedicated",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function getActiveSubscription(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, companyId: number) {
  const now = Date.now();

  // Check active subscription
  const [active] = await db.select().from(subscriptions)
    .where(and(
      eq(subscriptions.companyId, companyId),
      eq(subscriptions.status, "active" as any)
    ))
    .limit(1);

  if (active) return { subscription: active, type: "active" as const };

  // Check trial
  const [trial] = await db.select().from(subscriptions)
    .where(and(
      eq(subscriptions.companyId, companyId),
      eq(subscriptions.status, "trialing" as any)
    ))
    .limit(1);

  if (trial) {
    const trialEnd = trial.trialEndDate ? Number(trial.trialEndDate) : 0;
    if (trialEnd > now) return { subscription: trial, type: "trial" as const };
    // Trial expired
    return { subscription: null, type: "expired" as const };
  }

  return { subscription: null, type: "none" as const };
}
function getPlanFeatures(planSlug: string): PlanFeatures {
  const slug = planSlug?.toLowerCase() ?? "basic";
  return DEFAULT_PLAN_FEATURES[slug] ?? DEFAULT_PLAN_FEATURES.basic;
}

// ─── Router ───────────────────────────────────────────────────────────────────
export const billingRouter = router({
  // ─── Get Status ───────────────────────────────────────────────────────────
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db || !ctx.user.companyId) {
      return {
        isActive: false,
        isTrial: false,
        isExpired: true,
        planSlug: "none",
        planName: "لا يوجد اشتراك",
        features: DEFAULT_PLAN_FEATURES.basic,
        expiresAt: null,
        trialEndsAt: null,
        daysRemaining: 0,
      };
    }

    const { subscription, type } = await getActiveSubscription(db, ctx.user.companyId);

    if (!subscription) {
      return {
        isActive: false,
        isTrial: false,
        isExpired: type === "expired",
        planSlug: "none",
        planName: "لا يوجد اشتراك",
        features: DEFAULT_PLAN_FEATURES.basic,
        expiresAt: null,
        trialEndsAt: null,
        daysRemaining: 0,
      };
    }

    // Get plan details
    const [plan] = await db.select().from(plans).where(eq(plans.id, subscription.planId)).limit(1);
    const planSlug = (plan?.name ?? "basic").toLowerCase();
    const features = getPlanFeatures(planSlug);

    const now = Date.now();
    const expiresAt = subscription.endDate ? Number(subscription.endDate) : null;
    const trialEndsAt = subscription.trialEndDate ? Number(subscription.trialEndDate) : null;
    const endTime = expiresAt ?? trialEndsAt ?? 0;
    const daysRemaining = endTime > now ? Math.ceil((endTime - now) / (1000 * 60 * 60 * 24)) : 0;

    return {
      isActive: type === "active",
      isTrial: type === "trial",
      isExpired: false,
      planSlug: (plan?.name ?? "basic").toLowerCase(),
      planName: plan?.nameAr ?? plan?.name ?? "الباقة الأساسية",
      features,
      expiresAt,
      trialEndsAt,
      daysRemaining,
    };
  }),

  // ─── Check Feature ────────────────────────────────────────────────────────
  checkFeature: protectedProcedure
    .input(z.object({ feature: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db || !ctx.user.companyId) return { allowed: false, reason: "No subscription" };

      const { subscription, type } = await getActiveSubscription(db, ctx.user.companyId);
      if (!subscription) return { allowed: false, reason: type === "expired" ? "Subscription expired" : "No subscription" };

      const [plan] = await db.select().from(plans).where(eq(plans.id, subscription.planId)).limit(1);
       const features = getPlanFeatures((plan?.name ?? "basic").toLowerCase());
      const featuresMap = features as unknown as Record<string, unknown>;
      const allowed = featuresMap[input.feature] === true;
      return {
        allowed,
        reason: allowed ? null : `This feature requires a higher plan`,
        currentPlan: (plan?.name ?? "basic").toLowerCase(),
      };
    }),

  // ─── Get Usage ────────────────────────────────────────────────────────────
  getUsage: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db || !ctx.user.companyId) {
      return { properties: 0, units: 0, users: 0, limits: DEFAULT_PLAN_FEATURES.basic };
    }

    const companyId = ctx.user.companyId;

    const [propCount] = await db.select({ count: count() }).from(properties)
      .where(eq(properties.companyId, companyId));
    const [unitCount] = await db.select({ count: count() }).from(units)
      .where(eq(units.companyId, companyId));
    const [userCount] = await db.select({ count: count() }).from(users)
      .where(eq(users.companyId, companyId));

    const { subscription } = await getActiveSubscription(db, companyId);
    const [plan] = subscription
      ? await db.select().from(plans).where(eq(plans.id, subscription.planId)).limit(1)
      : [null];
    const features = getPlanFeatures((plan?.name ?? "basic").toLowerCase());

    return {
      properties: propCount?.count ?? 0,
      units: unitCount?.count ?? 0,
      users: userCount?.count ?? 0,
      limits: features,
      percentages: {
        properties: features.maxProperties === -1 ? 0 : Math.round(((propCount?.count ?? 0) / features.maxProperties) * 100),
        units: features.maxUnits === -1 ? 0 : Math.round(((unitCount?.count ?? 0) / features.maxUnits) * 100),
        users: features.maxUsers === -1 ? 0 : Math.round(((userCount?.count ?? 0) / features.maxUsers) * 100),
      },
    };
  }),

  // ─── Check Limit ──────────────────────────────────────────────────────────
  checkLimit: protectedProcedure
    .input(z.object({ resource: z.enum(["properties", "units", "users"]) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db || !ctx.user.companyId) return { allowed: false, current: 0, limit: 0 };

      const companyId = ctx.user.companyId;
      const { subscription } = await getActiveSubscription(db, companyId);
      const [plan] = subscription
        ? await db.select().from(plans).where(eq(plans.id, subscription.planId)).limit(1)
        : [null];
      const features = getPlanFeatures((plan?.name ?? "basic").toLowerCase());

      let current = 0;
      let limit = 0;

      if (input.resource === "properties") {
        const [r] = await db.select({ count: count() }).from(properties).where(eq(properties.companyId, companyId));
        current = r?.count ?? 0;
        limit = features.maxProperties;
      } else if (input.resource === "units") {
        const [r] = await db.select({ count: count() }).from(units).where(eq(units.companyId, companyId));
        current = r?.count ?? 0;
        limit = features.maxUnits;
      } else {
        const [r] = await db.select({ count: count() }).from(users).where(eq(users.companyId, companyId));
        current = r?.count ?? 0;
        limit = features.maxUsers;
      }

      const allowed = limit === -1 || current < limit;
      return { allowed, current, limit, unlimited: limit === -1 };
    }),

  // ─── Get Plans ────────────────────────────────────────────────────────────
  getPlans: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    const allPlans = await db.select().from(plans).where(eq(plans.isActive, 1 as any));
    return allPlans.map(p => ({
      ...p,
      features: getPlanFeatures((p.name ?? "basic").toLowerCase()),
    }));
  }),

  // ─── Expire Subscriptions (cron) ──────────────────────────────────────────
  expireSubscriptions: publicProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) return { expired: 0 };

    const now = Date.now();

    // Expire active subscriptions past endDate
    const result = await db.update(subscriptions)
      .set({ status: "expired" as any })
      .where(and(
        eq(subscriptions.status, "active" as any),
        lte(subscriptions.endDate, now as any)
      ));

    // Expire trials past trialEndDate
    const trialResult = await db.update(subscriptions)
      .set({ status: "expired" as any })
      .where(and(
        eq(subscriptions.status, "trialing" as any),
        lte(subscriptions.trialEndDate, now as any)
      ));

    const expired = ((result as any).affectedRows ?? 0) + ((trialResult as any).affectedRows ?? 0);
    return { expired, timestamp: new Date().toISOString() };
  }),
});
