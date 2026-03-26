import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import {
  companies, plans, subscriptions, users,
  type Company, type Plan, type Subscription
} from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";

// ─── PLANS ────────────────────────────────────────────────────────────────────
export const plansRouter = router({
  list: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(plans)
      .where(eq(plans.isActive, 1 as any))
      .orderBy(plans.sortOrder);
  }),

  getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return null;
    const result = await db.select().from(plans).where(eq(plans.id, input.id)).limit(1);
    return result[0] ?? null;
  }),
});

// ─── COMPANIES ────────────────────────────────────────────────────────────────
export const companiesRouter = router({
  // Get current user's company
  myCompany: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    if (!ctx.user.companyId) return null;
    const result = await db.select().from(companies)
      .where(eq(companies.id, ctx.user.companyId)).limit(1);
    return result[0] ?? null;
  }),

  // Create new company (onboarding)
  create: protectedProcedure.input(z.object({
    name: z.string().min(2).max(300),
    nameEn: z.string().optional(),
    crNumber: z.string().optional(),
    vatNumber: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    website: z.string().optional(),
    planId: z.number().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

    // Check if user already has a company
    if (ctx.user.companyId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "لديك شركة مسجلة بالفعل" });
    }

    const now = Date.now();
    const [result] = await db.insert(companies).values({
      name: input.name,
      nameEn: input.nameEn,
      crNumber: input.crNumber,
      vatNumber: input.vatNumber,
      phone: input.phone,
      email: input.email,
      address: input.address,
      city: input.city ?? "المدينة المنورة",
      website: input.website,
      status: "trial",
      ownerId: ctx.user.id,
      createdAt: now,
      updatedAt: now,
    });

    const companyId = (result as any).insertId as number;

    // Link user to company and promote to admin
    await db.update(users).set({
      companyId,
      role: "admin",
    }).where(eq(users.id, ctx.user.id));

    // Create trial subscription if planId provided
    if (input.planId) {
      const trialEnd = now + 2 * 24 * 60 * 60 * 1000; // 2 days trial
      await db.insert(subscriptions).values({
        companyId,
        planId: input.planId,
        status: "trialing",
        startDate: now,
        trialEndDate: trialEnd,
        billingCycle: "monthly",
        createdAt: now,
        updatedAt: now,
      });
    }

    return { companyId, message: "تم إنشاء الشركة بنجاح" };
  }),

  // Alias for myCompany
  getMine: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    if (!ctx.user.companyId) return null;
    const result = await db.select().from(companies)
      .where(eq(companies.id, ctx.user.companyId)).limit(1);
    return result[0] ?? null;
  }),

  // Update company info
  update: protectedProcedure.input(z.object({
    name: z.string().min(2).max(300).optional(),
    nameEn: z.string().optional(),
    crNumber: z.string().optional(),
    vatNumber: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    logoUrl: z.string().optional(),
    website: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    if (!ctx.user.companyId) throw new TRPCError({ code: "NOT_FOUND", message: "لا توجد شركة مرتبطة بحسابك" });

    await db.update(companies).set({
      ...input,
      updatedAt: Date.now(),
    }).where(eq(companies.id, ctx.user.companyId));

    return { success: true };
  }),

  // List all companies (super_admin only)
  listAll: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "super_admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    const db = await getDb();
    if (!db) return [];
    return db.select().from(companies).orderBy(desc(companies.createdAt));
  }),
});

// ─── SUBSCRIPTIONS ────────────────────────────────────────────────────────────
export const subscriptionsRouter = router({
  // Get current company's subscription
  current: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    if (!ctx.user.companyId) return null;
    const result = await db.select().from(subscriptions)
      .where(and(
        eq(subscriptions.companyId, ctx.user.companyId),
        eq(subscriptions.status, "active" as any)
      ))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    if (!result[0]) {
      // Check for trialing
      const trial = await db.select().from(subscriptions)
        .where(and(
          eq(subscriptions.companyId, ctx.user.companyId),
          eq(subscriptions.status, "trialing" as any)
        ))
        .orderBy(desc(subscriptions.createdAt))
        .limit(1);
      return trial[0] ?? null;
    }
    return result[0];
  }),

  // Subscribe to a plan
  subscribe: protectedProcedure.input(z.object({
    planId: z.number(),
    billingCycle: z.enum(["monthly", "yearly"]).default("monthly"),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    if (!ctx.user.companyId) throw new TRPCError({ code: "BAD_REQUEST", message: "يجب تسجيل شركة أولاً" });

    const plan = await db.select().from(plans).where(eq(plans.id, input.planId)).limit(1);
    if (!plan[0]) throw new TRPCError({ code: "NOT_FOUND", message: "الباقة غير موجودة" });

    const now = Date.now();
    const endDate = input.billingCycle === "yearly"
      ? now + 365 * 24 * 60 * 60 * 1000
      : now + 30 * 24 * 60 * 60 * 1000;

    const amount = input.billingCycle === "yearly"
      ? plan[0].priceYearly ?? plan[0].priceMonthly
      : plan[0].priceMonthly;

    await db.insert(subscriptions).values({
      companyId: ctx.user.companyId,
      planId: input.planId,
      status: "active",
      startDate: now,
      endDate,
      billingCycle: input.billingCycle,
      amount: amount,
      currency: "SAR",
      createdAt: now,
      updatedAt: now,
    });

    // Update company status
    await db.update(companies).set({
      status: "active",
      updatedAt: now,
    }).where(eq(companies.id, ctx.user.companyId));

    return { success: true, message: "تم الاشتراك بنجاح" };
  }),

  // Cancel subscription
  cancel: protectedProcedure.input(z.object({
    reason: z.string().optional(),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    if (!ctx.user.companyId) throw new TRPCError({ code: "BAD_REQUEST" });

    const now = Date.now();
    await db.update(subscriptions).set({
      status: "cancelled",
      cancelledAt: now,
      cancelReason: input.reason,
      updatedAt: now,
    }).where(and(
      eq(subscriptions.companyId, ctx.user.companyId),
      eq(subscriptions.status, "active" as any)
    ));

    return { success: true };
  }),

  // Get my subscription (alias for current)
  getMine: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    if (!ctx.user.companyId) return null;
    const result = await db.select().from(subscriptions)
      .where(eq(subscriptions.companyId, ctx.user.companyId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);
    return result[0] ?? null;
  }),

  // Upgrade/downgrade plan
  upgrade: protectedProcedure.input(z.object({
    planId: z.number(),
    billingCycle: z.enum(["monthly", "yearly"]).default("monthly"),
  })).mutation(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    if (!ctx.user.companyId) throw new TRPCError({ code: "BAD_REQUEST", message: "يجب تسجيل شركة أولاً" });
    const plan = await db.select().from(plans).where(eq(plans.id, input.planId)).limit(1);
    if (!plan[0]) throw new TRPCError({ code: "NOT_FOUND", message: "الباقة غير موجودة" });
    const now = Date.now();
    const endDate = input.billingCycle === "yearly"
      ? now + 365 * 24 * 60 * 60 * 1000
      : now + 30 * 24 * 60 * 60 * 1000;
    const amount = input.billingCycle === "yearly"
      ? plan[0].priceYearly ?? plan[0].priceMonthly
      : plan[0].priceMonthly;
    // Cancel existing active subscriptions
    await db.update(subscriptions).set({ status: "cancelled", updatedAt: now })
      .where(and(
        eq(subscriptions.companyId, ctx.user.companyId),
        eq(subscriptions.status, "active" as any)
      ));
    // Create new subscription
    await db.insert(subscriptions).values({
      companyId: ctx.user.companyId,
      planId: input.planId,
      status: "active",
      startDate: now,
      endDate,
      billingCycle: input.billingCycle,
      amount,
      currency: "SAR",
      createdAt: now,
      updatedAt: now,
    });
    await db.update(companies).set({ status: "active", updatedAt: now })
      .where(eq(companies.id, ctx.user.companyId));
    return { success: true, message: "تم تحديث الاشتراك بنجاح" };
  }),

  // List all subscriptions (super_admin only)
  listAll: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "super_admin") throw new TRPCError({ code: "FORBIDDEN" });
    const db = await getDb();
    if (!db) return [];
    return db.select().from(subscriptions).orderBy(desc(subscriptions.createdAt));
  }),
});
