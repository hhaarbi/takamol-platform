/**
 * Subscription Engine — Full SaaS Billing & Feature Gating
 * Handles: plans, subscriptions, usage tracking, feature access, billing history
 */
import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import type { MySql2Database } from "drizzle-orm/mysql2";
import {
  plans,
  subscriptions,
  subscriptionFeatures,
  companyUsage,
  planChangeLog,
  subscriptionInvoices,
  companies,
} from "../../drizzle/schema";
import { eq, and, desc, sql, isNull, lt } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// ─── HELPERS ────────────────────────────────────────────────────────────────

function now() {
  return Date.now();
}

function addDays(ms: number, days: number) {
  return ms + days * 24 * 60 * 60 * 1000;
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

function generateInvoiceNumber() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `INV-${y}${m}-${rand}`;
}

async function getCompanySubscription(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, companyId: number) {
  const rows = await db
    .select({
      sub: subscriptions,
      plan: plans,
    })
    .from(subscriptions)
    .leftJoin(plans, eq(subscriptions.planId, plans.id))
    .where(eq(subscriptions.companyId, companyId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);
  return rows[0] ?? null;
}

async function computeSubscriptionStatus(
  sub: typeof subscriptions.$inferSelect
): Promise<"active" | "trialing" | "past_due" | "cancelled" | "expired" | "suspended"> {
  const n = now();
  if ((sub as any).suspended_at) return "suspended";
  if (sub.status === "cancelled") return "cancelled";
  if (sub.trialEndDate && n < sub.trialEndDate && sub.status === "trialing") return "trialing";
  if (sub.endDate && n > sub.endDate) {
    const graceDays = (sub as any).grace_period_days ?? 7;
    if (n > sub.endDate + graceDays * 24 * 60 * 60 * 1000) return "expired";
    return "past_due";
  }
  return "active";
}

// ─── ROUTER ─────────────────────────────────────────────────────────────────

export const subscriptionsRouter = router({
  // ── Get all available plans ──────────────────────────────────────────────
  getPlans: publicProcedure
    .input(z.object({ billingCycle: z.enum(["monthly", "yearly"]).default("monthly") }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      const allPlans = await db
        .select()
        .from(plans)
        .where(eq(plans.isActive, 1))
        .orderBy(plans.sortOrder);

      const features = await db.select().from(subscriptionFeatures);

      return allPlans.map((p) => {
        const planFeatures = features.filter((f) => f.planId === p.id);
        return {
          ...p,
          features: planFeatures,
          price: input?.billingCycle === "yearly" ? p.priceYearly : p.priceMonthly,
          billingCycle: input?.billingCycle ?? "monthly",
        };
      });
    }),

  // ── Get plan comparison ──────────────────────────────────────────────────
  getPlanComparison: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { plans: [], featureKeys: [], matrix: [] };
    const allPlans = await db
      .select()
      .from(plans)
      .where(eq(plans.isActive, 1))
      .orderBy(plans.sortOrder);
    const features = await db.select().from(subscriptionFeatures);

    const featureKeys = [
      { key: "properties", label: "إدارة العقارات" },
      { key: "units", label: "إدارة الوحدات" },
      { key: "contracts", label: "إدارة العقود" },
      { key: "payments", label: "إدارة المدفوعات" },
      { key: "maintenance", label: "طلبات الصيانة" },
      { key: "invoices", label: "الفواتير الإلكترونية" },
      { key: "reports_basic", label: "التقارير الأساسية" },
      { key: "reports_advanced", label: "التقارير المتقدمة" },
      { key: "tenant_portal", label: "بوابة المستأجر" },
      { key: "owner_portal", label: "بوابة المالك" },
      { key: "smart_alerts", label: "التنبيهات الذكية" },
      { key: "accounting_basic", label: "التكامل المحاسبي الأساسي" },
      { key: "accounting_full", label: "التكامل المحاسبي الكامل" },
      { key: "vouchers", label: "سندات القبض والصرف" },
      { key: "api_limited", label: "API محدود" },
      { key: "api_full", label: "API كامل" },
      { key: "analytics_advanced", label: "التحليلات المتقدمة" },
      { key: "staff_management", label: "إدارة الموظفين" },
    ];

    return {
      plans: allPlans,
      featureKeys,
      matrix: featureKeys.map((fk) => ({
        ...fk,
        planAccess: allPlans.map((p) => {
          const f = features.find((x) => x.planId === p.id && x.featureKey === fk.key);
          return {
            planId: p.id,
            enabled: f?.enabled === 1,
            limitValue: f?.limitValue ?? null,
          };
        }),
      })),
    };
  }),

  // ── Get current subscription ─────────────────────────────────────────────
  getCurrentSubscription: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const companyId = ctx.user.companyId;
    if (!companyId || !db) return null;

    const result = await getCompanySubscription(db, companyId);
    if (!result) return null;

    const status = await computeSubscriptionStatus(result.sub);
    const daysLeft = result.sub.endDate
      ? Math.max(0, Math.ceil((result.sub.endDate - now()) / (24 * 60 * 60 * 1000)))
      : null;

    const trialDaysLeft = result.sub.trialEndDate
      ? Math.max(0, Math.ceil((result.sub.trialEndDate - now()) / (24 * 60 * 60 * 1000)))
      : null;

    return {
      subscription: { ...result.sub, computedStatus: status },
      plan: result.plan,
      daysLeft,
      trialDaysLeft,
      isExpiringSoon: daysLeft !== null && daysLeft <= 7,
      isTrialing: status === "trialing",
    };
  }),

  // ── Subscribe to a plan ──────────────────────────────────────────────────
  subscribeToPlan: protectedProcedure
    .input(
      z.object({
        planId: z.number(),
        billingCycle: z.enum(["monthly", "yearly"]).default("monthly"),
        startTrial: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const companyId = ctx.user.companyId;
      if (!companyId || !db) throw new TRPCError({ code: "BAD_REQUEST", message: "لا توجد شركة مرتبطة بحسابك" });

      const plan = await db.select().from(plans).where(eq(plans.id, input.planId)).limit(1);
      if (!plan[0]) throw new TRPCError({ code: "NOT_FOUND", message: "الباقة غير موجودة" });

      const p = plan[0];
      const startDate = now();
      const trialDays = p.trialDays ?? 14;
      const trialEndDate = input.startTrial ? addDays(startDate, trialDays) : null;
      const endDate = input.billingCycle === "yearly"
        ? addYears(startDate, 1)
        : addMonths(startDate, 1);

      const amount = input.billingCycle === "yearly"
        ? Number(p.priceYearly ?? p.priceMonthly)
        : Number(p.priceMonthly);

      // Cancel existing subscription
      const existing = await getCompanySubscription(db!, companyId);
      if (existing) {
        await db
          .update(subscriptions)
          .set({ status: "cancelled", cancelledAt: now(), updatedAt: now() })
          .where(eq(subscriptions.id, existing.sub.id));
      }

      // Create new subscription
      await db.insert(subscriptions).values({
        companyId,
        planId: input.planId,
        status: input.startTrial ? "trialing" : "active",
        startDate,
        endDate,
        trialEndDate,
        billingCycle: input.billingCycle,
        amount: String(amount),
        currency: "SAR",
        createdAt: now(),
        updatedAt: now(),
      });

      // Log change
      await db.insert(planChangeLog).values({
        companyId,
        fromPlanId: existing?.plan?.id ?? null,
        toPlanId: input.planId,
        changeType: input.startTrial ? "trial_start" : "renew",
        changedBy: ctx.user.id,
        changedAt: now(),
      });

      // Create invoice (if not trial)
      if (!input.startTrial) {
        await db.insert(subscriptionInvoices).values({
          companyId,
          subscriptionId: 0, // will update
          planId: input.planId,
          amount: String(amount),
          currency: "SAR",
          status: "paid",
          billingCycle: input.billingCycle,
          periodStart: startDate,
          periodEnd: endDate,
          paidAt: now(),
          invoiceNumber: generateInvoiceNumber(),
          createdAt: now(),
        });
      }

      return { success: true };
    }),

  // ── Upgrade plan ─────────────────────────────────────────────────────────
  upgradePlan: protectedProcedure
    .input(z.object({ newPlanId: z.number(), billingCycle: z.enum(["monthly", "yearly"]).default("monthly") }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const companyId = ctx.user.companyId;
      if (!companyId || !db) throw new TRPCError({ code: "BAD_REQUEST", message: "لا توجد شركة" });

      const existing = await getCompanySubscription(db, companyId);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "لا يوجد اشتراك حالي" });

      const newPlan = await db.select().from(plans).where(eq(plans.id, input.newPlanId)).limit(1);
      if (!newPlan[0]) throw new TRPCError({ code: "NOT_FOUND", message: "الباقة غير موجودة" });

      const isUpgrade = (newPlan[0].sortOrder ?? 0) > (existing.plan?.sortOrder ?? 0);
      const startDate = now();
      const endDate = input.billingCycle === "yearly" ? addYears(startDate, 1) : addMonths(startDate, 1);
      const amount = input.billingCycle === "yearly"
        ? Number(newPlan[0].priceYearly ?? newPlan[0].priceMonthly)
        : Number(newPlan[0].priceMonthly);

      await db
        .update(subscriptions)
        .set({ status: "cancelled", cancelledAt: now(), updatedAt: now() })
        .where(eq(subscriptions.id, existing.sub.id));

      await db.insert(subscriptions).values({
        companyId,
        planId: input.newPlanId,
        status: "active",
        startDate,
        endDate,
        billingCycle: input.billingCycle,
        amount: String(amount),
        currency: "SAR",
        createdAt: now(),
        updatedAt: now(),
      });

      await db.insert(planChangeLog).values({
        companyId,
        fromPlanId: existing.plan?.id ?? null,
        toPlanId: input.newPlanId,
        changeType: isUpgrade ? "upgrade" : "downgrade",
        changedBy: ctx.user.id,
        changedAt: now(),
      });

      await db.insert(subscriptionInvoices).values({
        companyId,
        subscriptionId: 0,
        planId: input.newPlanId,
        amount: String(amount),
        currency: "SAR",
        status: "paid",
        billingCycle: input.billingCycle,
        periodStart: startDate,
        periodEnd: endDate,
        paidAt: now(),
        invoiceNumber: generateInvoiceNumber(),
        createdAt: now(),
      });

      return { success: true, changeType: isUpgrade ? "upgrade" : "downgrade" };
    }),

  // ── Cancel subscription ───────────────────────────────────────────────────
  cancelSubscription: protectedProcedure
    .input(z.object({ reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const companyId = ctx.user.companyId;
      if (!companyId || !db) throw new TRPCError({ code: "BAD_REQUEST", message: "لا توجد شركة" });

      const existing = await getCompanySubscription(db, companyId);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "لا يوجد اشتراك" });

      await db
        .update(subscriptions)
        .set({ status: "cancelled", cancelledAt: now(), cancelReason: input.reason ?? null, updatedAt: now() })
        .where(eq(subscriptions.id, existing.sub.id));

      await db.insert(planChangeLog).values({
        companyId,
        fromPlanId: existing.plan?.id ?? null,
        toPlanId: existing.plan?.id ?? 0,
        changeType: "cancel",
        reason: input.reason ?? null,
        changedBy: ctx.user.id,
        changedAt: now(),
      });

      return { success: true };
    }),

  // ── Renew subscription ────────────────────────────────────────────────────
  renewSubscription: protectedProcedure
    .input(z.object({ billingCycle: z.enum(["monthly", "yearly"]).default("monthly") }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      const companyId = ctx.user.companyId;
      if (!companyId || !db) throw new TRPCError({ code: "BAD_REQUEST", message: "لا توجد شركة" });

      const existing = await getCompanySubscription(db, companyId);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "لا يوجد اشتراك" });

      const startDate = now();
      const endDate = input.billingCycle === "yearly" ? addYears(startDate, 1) : addMonths(startDate, 1);
      const amount = input.billingCycle === "yearly"
        ? Number(existing.plan?.priceYearly ?? existing.plan?.priceMonthly ?? 0)
        : Number(existing.plan?.priceMonthly ?? 0);

      await db
        .update(subscriptions)
        .set({ status: "active", startDate, endDate, billingCycle: input.billingCycle, updatedAt: now() })
        .where(eq(subscriptions.id, existing.sub.id));

      await db.insert(planChangeLog).values({
        companyId,
        fromPlanId: existing.plan?.id ?? null,
        toPlanId: existing.plan?.id ?? 0,
        changeType: "renew",
        changedBy: ctx.user.id,
        changedAt: now(),
      });

      await db.insert(subscriptionInvoices).values({
        companyId,
        subscriptionId: existing.sub.id,
        planId: existing.plan?.id ?? 0,
        amount: String(amount),
        currency: "SAR",
        status: "paid",
        billingCycle: input.billingCycle,
        periodStart: startDate,
        periodEnd: endDate,
        paidAt: now(),
        invoiceNumber: generateInvoiceNumber(),
        createdAt: now(),
      });

      return { success: true };
    }),

  // ── Check feature access ──────────────────────────────────────────────────
  checkFeatureAccess: protectedProcedure
    .input(z.object({ featureKey: z.string() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const companyId = ctx.user.companyId;
      if (!companyId || !db) return { allowed: false, reason: "no_company" };

      const result = await getCompanySubscription(db, companyId);
      if (!result) return { allowed: false, reason: "no_subscription" };

      const status = await computeSubscriptionStatus(result.sub);
      if (!["active", "trialing"].includes(status)) {
        return { allowed: false, reason: "subscription_inactive", status };
      }

      const feature = await db
        .select()
        .from(subscriptionFeatures)
        .where(
          and(
            eq(subscriptionFeatures.planId, result.sub.planId),
            eq(subscriptionFeatures.featureKey, input.featureKey)
          )
        )
        .limit(1);

      if (!feature[0] || feature[0].enabled !== 1) {
        return { allowed: false, reason: "feature_not_in_plan", planId: result.sub.planId };
      }

      // Check usage limit
      if (feature[0].limitValue !== null) {
        const period = new Date().toISOString().slice(0, 7);
        const usage = await db
          .select()
          .from(companyUsage)
          .where(
            and(
              eq(companyUsage.companyId, companyId),
              eq(companyUsage.featureKey, input.featureKey),
              eq(companyUsage.period, period)
            )
          )
          .limit(1);

        const current = usage[0]?.currentUsage ?? 0;
        if (current >= feature[0].limitValue) {
          return {
            allowed: false,
            reason: "limit_reached",
            current,
            limit: feature[0].limitValue,
          };
        }
      }

      return { allowed: true, limitValue: feature[0].limitValue };
    }),

  // ── Get usage stats ───────────────────────────────────────────────────────
  getUsageStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const companyId = ctx.user.companyId;
    if (!companyId || !db) return null;

    const result = await getCompanySubscription(db, companyId);
    if (!result || !result.plan) return null;

    // Get actual counts from DB
    const propCountRes = await db.execute(
      sql`SELECT COUNT(*) as cnt FROM properties WHERE companyId = ${companyId}`
    );
    const unitCountRes = await db.execute(
      sql`SELECT COUNT(*) as cnt FROM units u JOIN properties p ON u.propertyId = p.id WHERE p.companyId = ${companyId}`
    );
    const contractCountRes = await db.execute(
      sql`SELECT COUNT(*) as cnt FROM contracts WHERE companyId = ${companyId} AND status = 'active'`
    );
    const userCountRes = await db.execute(
      sql`SELECT COUNT(*) as cnt FROM users WHERE companyId = ${companyId}`
    );
    const propCount = propCountRes as any;
    const unitCount = unitCountRes as any;
    const contractCount = contractCountRes as any;
    const userCount = userCountRes as any;

    const limits = result.plan.limitsJson as any ?? {};

    return {
      properties: { current: Number((propCount as any)?.[0]?.[0]?.cnt ?? 0), limit: limits.max_properties ?? result.plan.maxProperties },
      units: { current: Number((unitCount as any)?.[0]?.[0]?.cnt ?? 0), limit: limits.max_units ?? result.plan.maxUnits },
      contracts: { current: Number((contractCount as any)?.[0]?.[0]?.cnt ?? 0), limit: limits.max_contracts ?? (result.plan as any).maxContracts },
      users: { current: Number((userCount as any)?.[0]?.[0]?.cnt ?? 0), limit: limits.max_users ?? result.plan.maxUsers },
    };
  }),

  // ── Get billing history ───────────────────────────────────────────────────
  getBillingHistory: protectedProcedure
    .input(z.object({ page: z.number().default(1), limit: z.number().default(10) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      const companyId = ctx.user.companyId;
      if (!companyId || !db) return { items: [], total: 0 };

      const offset = (input.page - 1) * input.limit;
      const items = await db
        .select({ inv: subscriptionInvoices, plan: plans })
        .from(subscriptionInvoices)
        .leftJoin(plans, eq(subscriptionInvoices.planId, plans.id))
        .where(eq(subscriptionInvoices.companyId, companyId))
        .orderBy(desc(subscriptionInvoices.createdAt))
        .limit(input.limit)
        .offset(offset);

      const [countResult] = await db.execute(
        sql`SELECT COUNT(*) as cnt FROM subscription_invoices WHERE company_id_si = ${companyId}`
      ) as any;

      return {
        items,
        total: Number((countResult as any[])[0]?.cnt ?? 0),
      };
    }),

  // ── Get change log ────────────────────────────────────────────────────────
  getChangeLog: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    const companyId = ctx.user.companyId;
    if (!companyId || !db) return [];

    return db
      .select()
      .from(planChangeLog)
      .where(eq(planChangeLog.companyId, companyId))
      .orderBy(desc(planChangeLog.changedAt))
      .limit(20);
  }),

  // ── Super Admin: list all subscriptions ──────────────────────────────────
  listAll: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "super_admin" && ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Super Admin access required" });
    }
    const db = await getDb();
    if (!db) return [];
    return db.select().from(subscriptions).orderBy(desc(subscriptions.createdAt));
  }),
});

// ─── FEATURE GATING HELPERS ──────────────────────────────────────────────────

export async function checkFeatureAccessServer(
  companyId: number,
  featureKey: string
): Promise<{ allowed: boolean; reason?: string }> {
  const db = await getDb();
  if (!db) return { allowed: false, reason: "db_unavailable" };
  const result = await getCompanySubscription(db, companyId);
  if (!result) return { allowed: false, reason: "no_subscription" };

  const status = await computeSubscriptionStatus(result.sub);
  if (!["active", "trialing"].includes(status)) {
    return { allowed: false, reason: "subscription_inactive" };
  }

  const feature = await db
    .select()
    .from(subscriptionFeatures)
    .where(
      and(
        eq(subscriptionFeatures.planId, result.sub.planId),
        eq(subscriptionFeatures.featureKey, featureKey)
      )
    )
    .limit(1);

  if (!feature[0] || feature[0].enabled !== 1) {
    return { allowed: false, reason: "feature_not_in_plan" };
  }

  return { allowed: true };
}

export async function requireFeatureAccess(companyId: number | null | undefined, featureKey: string) {
  if (!companyId) throw new TRPCError({ code: "FORBIDDEN", message: "لا توجد شركة مرتبطة بحسابك" });
  const result = await checkFeatureAccessServer(companyId, featureKey);
  if (!result.allowed) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: result.reason === "subscription_inactive"
        ? "اشتراكك غير نشط. يرجى تجديد الاشتراك للوصول لهذه الميزة"
        : "هذه الميزة غير متاحة في باقتك الحالية. يرجى الترقية للوصول إليها",
    });
  }
}
