import { TRPCError } from "@trpc/server";
import { vouchersRouter } from "./routers/vouchers";
import { plansRouter, companiesRouter, subscriptionsRouter as saasSubscriptionsRouter } from "./routers/saas";
import { subscriptionsRouter } from "./routers/subscriptions";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import { notifyOwner } from "./_core/notification";
import { nanoid } from "nanoid";
import {
  upsertUser, getUserByOpenId,
  getOwners, getOwnerById, getOwnerByUserId, createOwner, updateOwner, deleteOwner,
  getBrokers, getBrokerById, getBrokerByUserId, createBroker, updateBroker,
  getProperties, getPropertyById, createProperty, updateProperty, deleteProperty, incrementPropertyView,
  getVacantProperties, getPendingApprovalProperties,
  getUnitsByProperty, getAllUnits, getUnitById, createUnit, updateUnit, deleteUnit, getVacantUnits,
  getTenants, getTenantById, createTenant, updateTenant, rateTenant, deleteTenant,
  getContracts, getContractById, createContract, updateContract, getExpiringContracts, renewContract, deleteContract,
  getPayments, getPaymentById, createPayment, updatePayment, getOverduePayments,
  getMonthlyCollectionSchedule, generateReceiptNumber, deletePayment,
  getExpenses, createExpense, updateExpense, deleteExpense,
  getMaintenanceRequests, getMaintenanceById, createMaintenanceRequest, updateMaintenanceRequest, deleteMaintenance,
  getPropertyMaintenanceHistory,
  getScheduledMaintenance, createScheduledMaintenance, updateScheduledMaintenance, getDueScheduledMaintenance,
  getDeposits, createDeposit, updateDeposit,
  getHandovers, createHandover, getHandoverById,
  logActivity, getActivityLog,
  getNotes, createNote, updateNote, deleteNote,
  getMessageTemplates, getMessageTemplateById, createMessageTemplate, updateMessageTemplate, deleteMessageTemplate,
  createSentMessage, getSentMessages,
  getDailyTasks, createDailyTask, updateDailyTask, getTodayTasks,
  getDocuments, createDocument, deleteDocument,
  getOwnerStatements, getAllOwnerStatements, createOwnerStatement, updateOwnerStatement,
  getBrokerCommissions, createBrokerCommission, updateBrokerCommission,
  getFinancialSummary, getMonthlyRevenue, getMonthlyExpenses, getDashboardStats,
  globalSearch,
  getLeads, getLeadsCount, createLead, updateLead, getLeadBySession, updateLeadBySession, linkSessionToLead,
  getOrCreateChatSession, saveChatMessage, getChatHistory,
  getNotifications, markNotificationRead, markAllNotificationsRead,
  getContractors, getContractorById, createContractor, updateContractor, rateContractor,
  getOwnerTransfers, createOwnerTransfer, updateOwnerTransfer,
  getBrokerReferrals, createBrokerReferral, updateBrokerReferral,
  getSystemSettings, getSystemSetting, upsertSystemSetting,
  getKPIs, getRevenueByProperty, getCollectionRate, getMaintenanceCostByProperty,
  getBrokerPerformance, getOwnerROI,
  getPropertyROI, getSmartAlerts, getAllPropertiesROI,
  getPropertyImages, addPropertyImage, deletePropertyImage, setPrimaryImage,
  getTenantRatings, addTenantRating,
  getClientNotes, addClientNote, getUpcomingFollowUps,
  getMarketPrices, getPropertiesWithMarketComparison,
  getAnnualReport,
  generatePaymentSchedule,
  processOverdueEscalation,
} from "./db";
import { createHash, randomBytes } from "crypto";
import { getDb } from "./db";
import {
  tenantDocuments, apiKeys, propertyListings, accountingExports,
  staff, rolePermissions, loginLog, internalMessages, webhooks, apiUsageLog, listingViews, contractRenewalRequests,
  properties, contracts, payments,
  units, expenses, maintenanceRequests, tenants,
  falLicenses, approvals,
  invoices, unitReservations, emailNotificationSettings, emailNotificationLog
} from "../drizzle/schema";
import { eq, desc, and, gte, sql } from "drizzle-orm";

// ─── Role guards ──────────────────────────────────────────────────────────────
const isAdmin = (role: string) => role === "admin" || role === "super_admin";
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!isAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  return next({ ctx });
});
const superAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "super_admin") throw new TRPCError({ code: "FORBIDDEN", message: "Super Admin access required" });
  return next({ ctx });
});
const ownerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "owner" && !isAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx });
});
const brokerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "broker" && !isAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx });
});
const tenantProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "tenant" && !isAdmin(ctx.user.role)) throw new TRPCError({ code: "FORBIDDEN", message: "Tenant access required" });
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── PROPERTY OWNERS ───────────────────────────────────────────────────────
  owners: router({
    list: adminProcedure.input(z.object({ isActive: z.boolean().optional() }).optional())
      .query(({ ctx, input }) => getOwners({ ...(input ?? {}), companyId: ctx.user?.companyId ?? null })),
    get: adminProcedure.input(z.number()).query(({ input }) => getOwnerById(input)),
    myProfile: ownerProcedure.query(({ ctx }) => getOwnerByUserId(ctx.user.id)),
    create: adminProcedure.input(z.object({
      name: z.string().min(2), phone: z.string().min(9), phone2: z.string().optional(),
      email: z.string().email().optional(), nationalId: z.string().optional(),
      bankName: z.string().optional(), bankIban: z.string().optional(),
      address: z.string().optional(), notes: z.string().optional(),
      managementFeeType: z.enum(["percentage", "fixed"]).default("percentage"),
      managementFeeValue: z.string().default("5.00"),
      hasPortalAccess: z.boolean().default(false),
      commercialRegNo: z.string().optional(), nationalAddress: z.string().optional(),
    })).mutation(async ({ input }) => {
      await createOwner(input as any);
      await logActivity({ action: "owner_created", entityType: "owner", description: `تم إنشاء مالك: ${input.name}` });
      return { success: true };
    }),
    update: adminProcedure.input(z.object({
      id: z.number(),
      data: z.object({
        name: z.string().optional(), phone: z.string().optional(), phone2: z.string().optional(),
        email: z.string().optional(), nationalId: z.string().optional(),
        bankName: z.string().optional(), bankIban: z.string().optional(),
        address: z.string().optional(), notes: z.string().optional(),
        managementFeeType: z.enum(["percentage", "fixed"]).optional(),
        managementFeeValue: z.string().optional(), hasPortalAccess: z.boolean().optional(),
        isActive: z.boolean().optional(),
        commercialRegNo: z.string().optional(), nationalAddress: z.string().optional(),
      }),
    })).mutation(async ({ input }) => {
      await updateOwner(input.id, input.data as any);
      await logActivity({ action: "owner_updated", entityType: "owner", entityId: input.id, description: `تم تحديث بيانات المالك` });
      return { success: true };
    }),
    linkUser: adminProcedure.input(z.object({ ownerId: z.number(), openId: z.string() }))
      .mutation(async ({ input }) => {
        const user = await getUserByOpenId(input.openId);
        if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        await updateOwner(input.ownerId, { userId: user.id });
        await upsertUser({ openId: input.openId, role: "owner" } as any);
        return { success: true };
      }),
    delete: adminProcedure.input(z.number()).mutation(async ({ input }) => {
      await deleteOwner(input);
      await logActivity({ action: "owner_deleted", entityType: "owner", entityId: input, description: `تم حذف مالك #${input}` });
      return { success: true };
    }),
  }),

  // ─── BROKERS ───────────────────────────────────────────────────────────────
  brokers: router({
    list: adminProcedure.input(z.object({ isActive: z.boolean().optional() }).optional())
      .query(({ ctx, input }) => getBrokers({ ...(input ?? {}), companyId: ctx.user?.companyId ?? null })),
    get: adminProcedure.input(z.number()).query(({ input }) => getBrokerById(input)),
    myProfile: brokerProcedure.query(({ ctx }) => getBrokerByUserId(ctx.user.id)),
    create: adminProcedure.input(z.object({
      name: z.string().min(2), phone: z.string().min(9),
      email: z.string().email().optional(),
      falLicenseNumber: z.string().optional(),
      falLicenseType: z.enum(["brokerage", "property_management", "marketing"]).optional(),
      falLicenseExpiry: z.string().optional(),
      commissionRates: z.record(z.string(), z.number()).optional(),
      notes: z.string().optional(), hasPortalAccess: z.boolean().default(false),
    })).mutation(async ({ input }) => {
      await createBroker(input as any);
      await logActivity({ action: "broker_created", entityType: "broker", description: `تم إنشاء وسيط: ${input.name}` });
      return { success: true };
    }),
    update: adminProcedure.input(z.object({
      id: z.number(),
      data: z.object({
        name: z.string().optional(), phone: z.string().optional(), email: z.string().optional(),
        falLicenseNumber: z.string().optional(),
        falLicenseType: z.enum(["brokerage", "property_management", "marketing"]).optional(),
        falLicenseExpiry: z.string().optional(),
        commissionRates: z.record(z.string(), z.number()).optional(),
        notes: z.string().optional(), hasPortalAccess: z.boolean().optional(), isActive: z.boolean().optional(),
      }),
    })).mutation(async ({ input }) => {
      await updateBroker(input.id, input.data as any);
      await logActivity({ action: "broker_updated", entityType: "broker", entityId: input.id, description: `تم تحديث بيانات الوسيط` });
      return { success: true };
    }),
    linkUser: adminProcedure.input(z.object({ brokerId: z.number(), openId: z.string() }))
      .mutation(async ({ input }) => {
        const user = await getUserByOpenId(input.openId);
        if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
        await updateBroker(input.brokerId, { userId: user.id });
        await upsertUser({ openId: input.openId, role: "broker" } as any);
        return { success: true };
      }),
    commissions: router({
      list: adminProcedure.input(z.number().optional()).query(({ input }) => getBrokerCommissions(input)),
      myCommissions: brokerProcedure.query(async ({ ctx }) => {
        const broker = await getBrokerByUserId(ctx.user.id);
        if (!broker) return [];
        return getBrokerCommissions(broker.id);
      }),
      create: adminProcedure.input(z.object({
        brokerId: z.number(), propertyId: z.number().optional(), contractId: z.number().optional(),
        transactionType: z.enum(["sale", "rent"]), transactionAmount: z.string(),
        commissionRate: z.string(), commissionAmount: z.string(),
      })).mutation(async ({ input }) => { await createBrokerCommission(input); return { success: true }; }),
      updateStatus: adminProcedure.input(z.object({
        id: z.number(), status: z.enum(["pending", "paid", "cancelled"]), paidDate: z.string().optional(),
      })).mutation(async ({ input }) => {
        await updateBrokerCommission(input.id, { status: input.status, paidDate: input.paidDate });
        return { success: true };
      }),
    }),
  }),

  // ─── PROPERTIES ────────────────────────────────────────────────────────────
  properties: router({
    list: publicProcedure.input(z.object({
      listingType: z.string().optional(), status: z.string().optional(), type: z.string().optional(),
      ownerId: z.number().optional(), brokerId: z.number().optional(), source: z.string().optional(),
      search: z.string().optional(), limit: z.number().optional(), offset: z.number().optional(),
      approvalStatus: z.string().optional(),
    }).optional()).query(({ ctx, input }) => getProperties({ ...(input ?? {}), companyId: ctx.user?.companyId ?? null })),
    getById: publicProcedure.input(z.number()).query(async ({ input }) => {
      await incrementPropertyView(input);
      return getPropertyById(input);
    }),
    vacant: adminProcedure.query(() => getVacantProperties()),
    pendingApproval: adminProcedure.query(() => getPendingApprovalProperties()),
    myListings: brokerProcedure.query(async ({ ctx }) => {
      const broker = await getBrokerByUserId(ctx.user.id);
      if (!broker) return [];
      return getProperties({ brokerId: broker.id });
    }),
    create: adminProcedure.input(z.object({
      titleAr: z.string().min(2), descriptionAr: z.string().optional(),
      type: z.enum(["apartment", "villa", "land", "commercial", "office", "warehouse", "building", "farm"]),
      listingType: z.enum(["sale", "rent", "managed"]),
      price: z.string(), priceUnit: z.enum(["total", "per_month", "per_year"]).default("total"),
      negotiable: z.boolean().default(true), minPrice: z.string().optional(),
      area: z.string().optional(), bedrooms: z.number().optional(), bathrooms: z.number().optional(),
      floor: z.number().optional(), totalFloors: z.number().optional(),
      city: z.string().default("المدينة المنورة"), district: z.string().optional(), address: z.string().optional(),
      images: z.array(z.string()).default([]), features: z.array(z.string()).default([]),
      isFeatured: z.boolean().default(false), ownerId: z.number().optional(), brokerId: z.number().optional(),
      source: z.enum(["company", "broker", "owner"]).default("company"),
      brokerCommissionRate: z.string().optional(), brokerCommissionAmount: z.string().optional(),
      deedNumber: z.string().optional(), buildingPermitNumber: z.string().optional(),
      yearBuilt: z.number().optional(), lastRenovation: z.string().optional(),
    })).mutation(async ({ input }) => {
      await createProperty(input as any);
      await logActivity({ action: "property_created", entityType: "property", description: `تم إضافة عقار: ${input.titleAr}` });
      return { success: true };
    }),
    brokerCreate: brokerProcedure.input(z.object({
      titleAr: z.string().min(2), descriptionAr: z.string().optional(),
      type: z.enum(["apartment", "villa", "land", "commercial", "office", "warehouse", "building", "farm"]),
      listingType: z.enum(["sale", "rent"]),
      price: z.string(), priceUnit: z.enum(["total", "per_month", "per_year"]).default("total"),
      negotiable: z.boolean().default(true), minPrice: z.string().optional(),
      area: z.string().optional(), bedrooms: z.number().optional(), bathrooms: z.number().optional(),
      city: z.string().default("المدينة المنورة"), district: z.string().optional(), address: z.string().optional(),
      images: z.array(z.string()).default([]), features: z.array(z.string()).default([]),
    })).mutation(async ({ ctx, input }) => {
      const broker = await getBrokerByUserId(ctx.user.id);
      if (!broker) throw new TRPCError({ code: "NOT_FOUND", message: "Broker profile not found" });
      const rates = (broker.commissionRates as Record<string, number>) ?? {};
      const rate = rates[input.type] ?? rates["default"] ?? 2.5;
      await createProperty({ ...input as any, brokerId: broker.id, source: "broker", status: "available", approvalStatus: "pending", brokerCommissionRate: String(rate) });
      await notifyOwner({ title: `وسيط أضاف عقاراً جديداً`, content: `${broker.name} أضاف: ${input.titleAr} - العمولة: ${rate}%` });
      return { success: true };
    }),
    approve: adminProcedure.input(z.object({
      id: z.number(), status: z.enum(["approved", "rejected"]), notes: z.string().optional(),
    })).mutation(async ({ input }) => {
      await updateProperty(input.id, { approvalStatus: input.status } as any);
      await logActivity({ action: "property_approval", entityType: "property", entityId: input.id, description: `تم ${input.status === "approved" ? "قبول" : "رفض"} العقار` });
      return { success: true };
    }),
    update: adminProcedure.input(z.object({
      id: z.number(),
      data: z.object({
        titleAr: z.string().optional(), descriptionAr: z.string().optional(),
        type: z.string().optional(), listingType: z.string().optional(), status: z.string().optional(),
        price: z.string().optional(), priceUnit: z.string().optional(),
        negotiable: z.boolean().optional(), minPrice: z.string().optional(),
        area: z.string().optional(), bedrooms: z.number().optional(), bathrooms: z.number().optional(),
        floor: z.number().optional(), totalFloors: z.number().optional(),
        city: z.string().optional(), district: z.string().optional(), address: z.string().optional(),
        images: z.array(z.string()).optional(), features: z.array(z.string()).optional(),
        isFeatured: z.boolean().optional(), ownerId: z.number().optional(), brokerId: z.number().optional(),
        brokerCommissionRate: z.string().optional(),
        deedNumber: z.string().optional(), buildingPermitNumber: z.string().optional(),
        yearBuilt: z.number().optional(), lastRenovation: z.string().optional(),
      }),
    })).mutation(async ({ input }) => {
      await updateProperty(input.id, input.data as any);
      await logActivity({ action: "property_updated", entityType: "property", entityId: input.id, description: `تم تحديث بيانات العقار` });
      return { success: true };
    }),
    delete: adminProcedure.input(z.number()).mutation(async ({ input }) => { await deleteProperty(input); return { success: true }; }),
    images: router({
      list: publicProcedure.input(z.number()).query(({ input }) => getPropertyImages(input)),
      add: adminProcedure.input(z.object({
        propertyId: z.number(), url: z.string(), fileKey: z.string(),
        caption: z.string().optional(), isPrimary: z.boolean().default(false), sortOrder: z.number().default(0),
      })).mutation(async ({ input }) => { await addPropertyImage(input as any); return { success: true }; }),
      delete: adminProcedure.input(z.number()).mutation(async ({ input }) => { await deletePropertyImage(input); return { success: true }; }),
      setPrimary: adminProcedure.input(z.object({ id: z.number(), propertyId: z.number() }))
        .mutation(async ({ input }) => { await setPrimaryImage(input.id, input.propertyId); return { success: true }; }),
      upload: protectedProcedure.input(z.object({
        propertyId: z.number(), base64: z.string(), filename: z.string(),
        mimeType: z.string().default("image/jpeg"), caption: z.string().optional(), isPrimary: z.boolean().default(false),
      })).mutation(async ({ input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const key = `properties/${input.propertyId}/${nanoid()}-${input.filename}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        await addPropertyImage({ propertyId: input.propertyId, url, fileKey: key, caption: input.caption, isPrimary: input.isPrimary, sortOrder: 0 });
        return { url, key };
      }),
    }),
    uploadImage: protectedProcedure.input(z.object({
      base64: z.string(), filename: z.string(), mimeType: z.string().default("image/jpeg"),
    })).mutation(async ({ input }) => {
      const buffer = Buffer.from(input.base64, "base64");
      const key = `properties/${nanoid()}-${input.filename}`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      return { url };
    }),
  }),

  // ─── UNITS ─────────────────────────────────────────────────────────────────
  units: router({
    listByProperty: protectedProcedure.input(z.number()).query(({ input }) => getUnitsByProperty(input)),
    listAll: adminProcedure.input(z.object({ status: z.string().optional(), propertyId: z.number().optional() }).optional())
      .query(({ input }) => getAllUnits(input ?? {})),
    vacant: adminProcedure.query(() => getVacantUnits()),
    get: protectedProcedure.input(z.number()).query(({ input }) => getUnitById(input)),
    create: adminProcedure.input(z.object({
      propertyId: z.number(), unitNumber: z.string(), floor: z.number().optional(),
      type: z.enum(["apartment", "room", "shop", "office", "warehouse", "studio"]),
      area: z.string().optional(), bedrooms: z.number().optional(), bathrooms: z.number().optional(),
      rentPrice: z.string().optional(), notes: z.string().optional(),
    })).mutation(async ({ input }) => { await createUnit(input as any); return { success: true }; }),
    update: adminProcedure.input(z.object({
      id: z.number(),
      data: z.object({
        unitNumber: z.string().optional(), floor: z.number().optional(), type: z.string().optional(),
        area: z.string().optional(), bedrooms: z.number().optional(), bathrooms: z.number().optional(),
        rentPrice: z.string().optional(), status: z.string().optional(), notes: z.string().optional(),
      }),
    })).mutation(async ({ input }) => { await updateUnit(input.id, input.data as any); return { success: true }; }),
    delete: adminProcedure.input(z.number()).mutation(async ({ input }) => { await deleteUnit(input); return { success: true }; }),
  }),

  // ─── TENANTS ───────────────────────────────────────────────────────────────
  tenants: router({
    list: adminProcedure.input(z.object({ isActive: z.boolean().optional(), search: z.string().optional() }).optional())
      .query(({ ctx, input }) => getTenants({ ...(input ?? {}), companyId: ctx.user?.companyId ?? null })),
    get: adminProcedure.input(z.number()).query(({ input }) => getTenantById(input)),
    create: adminProcedure.input(z.object({
      name: z.string().min(2), phone: z.string().min(9), phone2: z.string().optional(),
      email: z.string().email().optional(), nationalId: z.string().optional(),
      nationality: z.string().optional(), occupation: z.string().optional(),
      emergencyContact: z.string().optional(), notes: z.string().optional(),
    })).mutation(async ({ input }) => {
      await createTenant(input as any);
      await logActivity({ action: "tenant_created", entityType: "tenant", description: `تم إضافة مستأجر: ${input.name}` });
      return { success: true };
    }),
    update: adminProcedure.input(z.object({
      id: z.number(),
      data: z.object({
        name: z.string().optional(), phone: z.string().optional(), phone2: z.string().optional(),
        email: z.string().optional(), nationalId: z.string().optional(),
        nationality: z.string().optional(), occupation: z.string().optional(),
        emergencyContact: z.string().optional(), notes: z.string().optional(), isActive: z.boolean().optional(),
      }),
    })).mutation(async ({ input }) => { await updateTenant(input.id, input.data as any); return { success: true }; }),
    rate: adminProcedure.input(z.object({
      id: z.number(),
      paymentRating: z.number().min(1).max(5),
      propertyRating: z.number().min(1).max(5),
      cooperationRating: z.number().min(1).max(5),
      ratingNotes: z.string().optional(),
    })).mutation(async ({ input }) => {
      await rateTenant(input.id, input);
      return { success: true };
    }),
    delete: adminProcedure.input(z.number()).mutation(async ({ input }) => {
      await deleteTenant(input);
      await logActivity({ action: "tenant_deleted", entityType: "tenant", entityId: input, description: `تم حذف مستأجر #${input}` });
      return { success: true };
    }),
  }),

  // ─── CONTRACTS ─────────────────────────────────────────────────────────────
  contracts: router({
    list: adminProcedure.input(z.object({
      type: z.string().optional(), status: z.string().optional(),
      ownerId: z.number().optional(), tenantId: z.number().optional(), propertyId: z.number().optional(),
    }).optional()).query(({ ctx, input }) => getContracts({ ...(input ?? {}), companyId: ctx.user?.companyId ?? null })),
    get: adminProcedure.input(z.number()).query(({ input }) => getContractById(input)),
    myContracts: ownerProcedure.query(async ({ ctx }) => {
      const owner = await getOwnerByUserId(ctx.user.id);
      if (!owner) return [];
      return getContracts({ ownerId: owner.id });
    }),
    expiring: adminProcedure.input(z.number().default(30)).query(({ input }) => getExpiringContracts(input)),
    create: adminProcedure.input(z.object({
      contractNumber: z.string(), type: z.enum(["rent", "sale", "management"]),
      propertyId: z.number().optional(), unitId: z.number().optional(),
      tenantId: z.number().optional(), ownerId: z.number().optional(),
      rentAmount: z.string().optional(), rentPeriod: z.enum(["monthly", "quarterly", "semi_annual", "annual"]).optional(),
      startDate: z.string().optional(), endDate: z.string().optional(),
      depositAmount: z.string().optional(), salePrice: z.string().optional(),
      managementFeeType: z.enum(["percentage", "fixed"]).optional(),
      managementFeeValue: z.string().optional(), notes: z.string().optional(),
      paymentDay: z.number().optional(), autoRenew: z.boolean().optional(),
    })).mutation(async ({ input }) => {
      const result = await createContract(input as any);
      // توليد جدول الدفعات تلقائياً لعقود الإيجار
      try {
        const db = await getDb();
        if (db && input.type === "rent") {
          const [newContract] = await db.select({ id: contracts.id })
            .from(contracts)
            .where(eq(contracts.contractNumber, input.contractNumber))
            .limit(1);
          if (newContract) await generatePaymentSchedule(newContract.id);
        }
      } catch (e) { console.warn("[PaymentSchedule] Failed to generate:", e); }
      await logActivity({ action: "contract_created", entityType: "contract", description: `تم إنشاء عقد: ${input.contractNumber}` });
      return { success: true };
    }),
    update: adminProcedure.input(z.object({
      id: z.number(),
      data: z.object({
        status: z.string().optional(), rentAmount: z.string().optional(),
        startDate: z.string().optional(), endDate: z.string().optional(), notes: z.string().optional(),
        autoRenew: z.boolean().optional(), paymentDay: z.number().optional(),
      }),
    })).mutation(async ({ input }) => { await updateContract(input.id, input.data as any); return { success: true }; }),
    renew: adminProcedure.input(z.object({
      oldContractId: z.number(),
      newContract: z.object({
        contractNumber: z.string(), type: z.enum(["rent", "sale", "management"]),
        propertyId: z.number().optional(), unitId: z.number().optional(),
        tenantId: z.number().optional(), ownerId: z.number().optional(),
        rentAmount: z.string().optional(), rentPeriod: z.enum(["monthly", "quarterly", "semi_annual", "annual"]).optional(),
        startDate: z.string().optional(), endDate: z.string().optional(),
        notes: z.string().optional(),
      }),
    })).mutation(async ({ input }) => {
      await renewContract(input.oldContractId, input.newContract as any);
      await logActivity({ action: "contract_renewed", entityType: "contract", entityId: input.oldContractId, description: `تم تجديد العقد` });
      return { success: true };
    }),
    delete: adminProcedure.input(z.number()).mutation(async ({ input }) => {
      await deleteContract(input);
      await logActivity({ action: "contract_deleted", entityType: "contract", entityId: input, description: `تم حذف عقد #${input}` });
      return { success: true };
    }),
  }),

  // ─── PAYMENTS ──────────────────────────────────────────────────────────────
  payments: router({
    list: adminProcedure.input(z.object({
      status: z.string().optional(), ownerId: z.number().optional(), tenantId: z.number().optional(),
      propertyId: z.number().optional(), contractId: z.number().optional(), type: z.string().optional(),
      fromDate: z.string().optional(), toDate: z.string().optional(),
    }).optional()).query(({ ctx, input }) => getPayments({ ...(input ?? {}), companyId: ctx.user?.companyId ?? null })),
    get: adminProcedure.input(z.number()).query(({ input }) => getPaymentById(input)),
    overdue: adminProcedure.query(() => getOverduePayments()),
    monthlySchedule: adminProcedure.input(z.string()).query(({ input }) => getMonthlyCollectionSchedule(input)),
    myPayments: ownerProcedure.query(async ({ ctx }) => {
      const owner = await getOwnerByUserId(ctx.user.id);
      if (!owner) return [];
      return getPayments({ ownerId: owner.id });
    }),
    create: adminProcedure.input(z.object({
      contractId: z.number().optional(), tenantId: z.number().optional(),
      propertyId: z.number().optional(), unitId: z.number().optional(), ownerId: z.number().optional(),
      type: z.enum(["rent", "deposit", "maintenance_fee", "management_fee", "commission", "other"]),
      amount: z.string(), dueDate: z.string(), paidDate: z.string().optional(),
      paymentMethod: z.enum(["bank_transfer", "cash", "check", "online"]).optional(),
      referenceNumber: z.string().optional(),
      status: z.enum(["pending", "paid", "overdue", "partial", "cancelled"]).default("pending"),
      notes: z.string().optional(), installmentNumber: z.number().optional(), totalInstallments: z.number().optional(),
    })).mutation(async ({ input }) => {
      await createPayment(input as any);
      await logActivity({ action: "payment_created", entityType: "payment", description: `تم إنشاء دفعة: ${input.amount} ريال` });
      return { success: true };
    }),
    update: adminProcedure.input(z.object({
      id: z.number(),
      data: z.object({
        status: z.string().optional(), paidDate: z.string().optional(),
        paymentMethod: z.string().optional(), referenceNumber: z.string().optional(),
        notes: z.string().optional(), receiptUrl: z.string().optional(), receiptNumber: z.string().optional(),
        paidAmount: z.string().optional(), escalationLevel: z.number().optional(),
      }),
    })).mutation(async ({ input }) => { await updatePayment(input.id, input.data as any); return { success: true }; }),
    markPaid: adminProcedure.input(z.object({
      id: z.number(), paymentMethod: z.enum(["bank_transfer", "cash", "check", "online"]),
      referenceNumber: z.string().optional(), paidDate: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const receiptNumber = await generateReceiptNumber();
      const paidDateStr = (input.paidDate ?? new Date().toISOString().split("T")[0]) as any;
      await updatePayment(input.id, {
        status: "paid",
        paidDate: paidDateStr,
        paymentMethod: input.paymentMethod,
        referenceNumber: input.referenceNumber,
        receiptNumber,
      });

      // أتمتة التحويل للمالك تلقائياً عند تسجيل دفعة إيجار مدفوعة
      try {
        const payment = await getPaymentById(input.id);
        if (payment && payment.type === "rent" && payment.contractId && payment.ownerId) {
          const contract = await getContractById(payment.contractId);
          if (contract) {
            const rentAmount = parseFloat(payment.amount ?? "0");
            // حساب رسوم الإدارة
            let managementFee = 0;
            if (contract.managementFeeType === "percentage") {
              managementFee = rentAmount * (parseFloat(contract.managementFeeValue ?? "5") / 100);
            } else if (contract.managementFeeType === "fixed") {
              managementFee = parseFloat(contract.managementFeeValue ?? "0");
            }
            const netAmount = rentAmount - managementFee;
            if (netAmount > 0 && payment.ownerId) {
              await createOwnerTransfer({
                ownerId: payment.ownerId,
                amount: netAmount.toFixed(2),
                transferDate: paidDateStr,
                status: "pending",
                notes: `تحويل تلقائي - إيجار عقد ${contract.contractNumber} - إيصال: ${receiptNumber} - رسوم إدارة: ${managementFee.toFixed(2)} ريال`,
              });
            }
          }
        }
      } catch (e) {
        // عدم إيقاف عملية التحصيل بسبب خطأ في التحويل
        console.warn("[Owner Transfer] Failed to auto-create transfer:", e);
      }

      await logActivity({ action: "payment_collected", entityType: "payment", entityId: input.id, description: `تم تحصيل دفعة - إيصال: ${receiptNumber}` });
      return { success: true, receiptNumber };
    }),
    escalate: adminProcedure.input(z.object({ id: z.number(), level: z.number() }))
      .mutation(async ({ input }) => {
        await updatePayment(input.id, { escalationLevel: input.level } as any);
        await logActivity({ action: "payment_escalated", entityType: "payment", entityId: input.id, description: `تم تصعيد المتأخرة لمستوى ${input.level}` });
        return { success: true };
      }),
    delete: adminProcedure.input(z.number()).mutation(async ({ input }) => {
      await deletePayment(input);
      await logActivity({ action: "payment_deleted", entityType: "payment", entityId: input, description: `تم حذف دفعة #${input}` });
      return { success: true };
    }),
  }),

  // ─── EXPENSES ──────────────────────────────────────────────────────────────
  expenses: router({
    list: adminProcedure.input(z.object({
      propertyId: z.number().optional(), ownerId: z.number().optional(), category: z.string().optional(),
      fromDate: z.string().optional(), toDate: z.string().optional(),
    }).optional()).query(({ ctx, input }) => getExpenses({ ...(input ?? {}), companyId: ctx.user?.companyId ?? null })),
    myExpenses: ownerProcedure.query(async ({ ctx }) => {
      const owner = await getOwnerByUserId(ctx.user.id);
      if (!owner) return [];
      return getExpenses({ ownerId: owner.id });
    }),
    create: adminProcedure.input(z.object({
      propertyId: z.number().optional(), unitId: z.number().optional(), ownerId: z.number().optional(),
      category: z.enum(["maintenance", "utilities", "insurance", "tax", "management", "cleaning", "security", "other"]),
      description: z.string(), amount: z.string(), expenseDate: z.string(),
      paidBy: z.enum(["company", "owner", "tenant"]).default("company"),
      deductFromOwner: z.boolean().default(true), notes: z.string().optional(),
      receiptUrl: z.string().optional(), vendor: z.string().optional(),
    })).mutation(async ({ input }) => {
      await createExpense(input as any);
      await logActivity({ action: "expense_created", entityType: "expense", description: `تم تسجيل مصروف: ${input.amount} ريال - ${input.description}` });
      return { success: true };
    }),
    update: adminProcedure.input(z.object({
      id: z.number(),
      data: z.object({
        description: z.string().optional(), amount: z.string().optional(),
        category: z.string().optional(), notes: z.string().optional(),
      }),
    })).mutation(async ({ input }) => { await updateExpense(input.id, input.data as any); return { success: true }; }),
    delete: adminProcedure.input(z.number()).mutation(async ({ input }) => {
      await deleteExpense(input);
      await logActivity({ action: "expense_deleted", entityType: "expense", entityId: input, description: `تم حذف مصروف #${input}` });
      return { success: true };
    }),
  }),

  // ─── MAINTENANCE ────────────────────────────────────────────────────────────────────
  maintenance: router({
    list: adminProcedure.input(z.object({
      propertyId: z.number().optional(), unitId: z.number().optional(),
      status: z.string().optional(), priority: z.string().optional(), tenantId: z.number().optional(),
    }).optional()).query(({ ctx, input }) => getMaintenanceRequests({ ...(input ?? {}), companyId: ctx.user?.companyId ?? null })),
    get: adminProcedure.input(z.number()).query(({ input }) => getMaintenanceById(input)),
    propertyHistory: adminProcedure.input(z.number()).query(({ input }) => getPropertyMaintenanceHistory(input)),
    create: adminProcedure.input(z.object({
      propertyId: z.number().optional(), unitId: z.number().optional(), tenantId: z.number().optional(),
      title: z.string(), description: z.string().optional(),
      priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
      assignedTo: z.string().optional(), cost: z.string().optional(), notes: z.string().optional(),
      vendor: z.string().optional(), vendorPhone: z.string().optional(),
    })).mutation(async ({ input }) => {
      await createMaintenanceRequest(input as any);
      await logActivity({ action: "maintenance_created", entityType: "maintenance", description: `طلب صيانة: ${input.title}` });
      return { success: true };
    }),
    update: adminProcedure.input(z.object({
      id: z.number(),
      data: z.object({
        status: z.string().optional(), assignedTo: z.string().optional(),
        cost: z.string().optional(), completedDate: z.string().optional(), notes: z.string().optional(),
        vendor: z.string().optional(), vendorPhone: z.string().optional(),
        actualCost: z.string().optional(),
      }),
    })).mutation(async ({ input }) => {
      await updateMaintenanceRequest(input.id, input.data as any);
      await logActivity({ action: "maintenance_updated", entityType: "maintenance", entityId: input.id, description: `تم تحديث طلب صيانة` });
      return { success: true };
    }),
    delete: adminProcedure.input(z.number()).mutation(async ({ input }) => {
      await deleteMaintenance(input);
      await logActivity({ action: "maintenance_deleted", entityType: "maintenance", entityId: input, description: `تم حذف طلب صيانة #${input}` });
      return { success: true };
    }),
    scheduled: router({
      list: adminProcedure.input(z.object({ propertyId: z.number().optional(), isActive: z.boolean().optional() }).optional())
        .query(({ input }) => getScheduledMaintenance(input ?? {})),
      due: adminProcedure.query(() => getDueScheduledMaintenance()),
      create: adminProcedure.input(z.object({
        propertyId: z.number(), unitId: z.number().optional(),
        title: z.string(), description: z.string().optional(),
        frequency: z.enum(["weekly", "monthly", "quarterly", "semi_annual", "annual"]),
        nextDue: z.string(), estimatedCost: z.string().optional(),
        vendor: z.string().optional(), vendorPhone: z.string().optional(),
      })).mutation(async ({ input }) => { await createScheduledMaintenance(input as any); return { success: true }; }),
      update: adminProcedure.input(z.object({
        id: z.number(),
        data: z.object({
          nextDue: z.string().optional(), estimatedCost: z.string().optional(),
          isActive: z.boolean().optional(), vendor: z.string().optional(),
        }),
      })).mutation(async ({ input }) => { await updateScheduledMaintenance(input.id, input.data as any); return { success: true }; }),
    }),
  }),

  // ─── DEPOSITS / GUARANTEES ─────────────────────────────────────────────────
  deposits: router({
    list: adminProcedure.input(z.object({
      contractId: z.number().optional(), tenantId: z.number().optional(), status: z.string().optional(),
    }).optional()).query(({ input }) => getDeposits(input ?? {})),
    create: adminProcedure.input(z.object({
      contractId: z.number(), tenantId: z.number(), propertyId: z.number().optional(), unitId: z.number().optional(),
      type: z.enum(["security_deposit", "key_deposit", "guarantee_check"]),
      amount: z.string(), receivedDate: z.string(), checkNumber: z.string().optional(),
      bankName: z.string().optional(), notes: z.string().optional(),
    })).mutation(async ({ input }) => { await createDeposit(input as any); return { success: true }; }),
    update: adminProcedure.input(z.object({
      id: z.number(),
      data: z.object({
        status: z.enum(["held", "returned", "deducted", "forfeited"]).optional(),
        returnedDate: z.string().optional(), deductionAmount: z.string().optional(),
        deductionReason: z.string().optional(),
      }),
    })).mutation(async ({ input }) => { await updateDeposit(input.id, input.data as any); return { success: true }; }),
  }),

  // ─── UNIT HANDOVERS ────────────────────────────────────────────────────────
  handovers: router({
    list: adminProcedure.input(z.object({
      unitId: z.number().optional(), propertyId: z.number().optional(), type: z.string().optional(),
    }).optional()).query(({ input }) => getHandovers(input ?? {})),
    get: adminProcedure.input(z.number()).query(({ input }) => getHandoverById(input)),
    create: adminProcedure.input(z.object({
      propertyId: z.number(), unitId: z.number().optional(), contractId: z.number().optional(),
      tenantId: z.number().optional(), type: z.enum(["check_in", "check_out"]),
      handoverDate: z.string(), condition: z.string().optional(),
      meterReadingElectricity: z.string().optional(), meterReadingWater: z.string().optional(),
      meterReadingGas: z.string().optional(), photos: z.array(z.string()).default([]),
      notes: z.string().optional(), damages: z.string().optional(), damagesCost: z.string().optional(),
    })).mutation(async ({ input }) => {
      await createHandover(input as any);
      await logActivity({ action: "handover_created", entityType: "handover", description: `محضر ${input.type === "check_in" ? "تسليم" : "استلام"} وحدة` });
      return { success: true };
    }),
  }),

  // ─── ACTIVITY LOG ──────────────────────────────────────────────────────────
  activity: router({
    list: adminProcedure.input(z.object({
      entityType: z.string().optional(), entityId: z.number().optional(),
      userId: z.number().optional(), limit: z.number().optional(),
    }).optional()).query(({ input }) => getActivityLog(input ?? {})),
  }),

  // ─── INTERNAL NOTES ────────────────────────────────────────────────────────
  notes: router({
    list: adminProcedure.input(z.object({ entityType: z.string(), entityId: z.number() }))
      .query(({ input }) => getNotes(input.entityType, input.entityId)),
    create: adminProcedure.input(z.object({
      entityType: z.enum(["owner", "tenant", "property", "contract", "lead"]),
      entityId: z.number(), content: z.string().min(1), isPinned: z.boolean().default(false),
    })).mutation(async ({ ctx, input }) => {
      await createNote({ ...input, userId: ctx.user.id } as any);
      return { success: true };
    }),
    update: adminProcedure.input(z.object({
      id: z.number(), data: z.object({ content: z.string().optional(), isPinned: z.boolean().optional() }),
    })).mutation(async ({ input }) => { await updateNote(input.id, input.data as any); return { success: true }; }),
    delete: adminProcedure.input(z.number()).mutation(async ({ input }) => { await deleteNote(input); return { success: true }; }),
  }),

  // ─── MESSAGE TEMPLATES ─────────────────────────────────────────────────────
  messageTemplates: router({
    list: adminProcedure.input(z.string().optional()).query(({ input }) => getMessageTemplates(input)),
    get: adminProcedure.input(z.number()).query(({ input }) => getMessageTemplateById(input)),
    create: adminProcedure.input(z.object({
      name: z.string(), category: z.enum(["payment_reminder", "contract_renewal", "maintenance_update", "welcome", "overdue_notice", "general"]),
      content: z.string(), variables: z.array(z.string()).default([]),
    })).mutation(async ({ input }) => { await createMessageTemplate(input as any); return { success: true }; }),
    update: adminProcedure.input(z.object({
      id: z.number(), data: z.object({ name: z.string().optional(), content: z.string().optional(), variables: z.array(z.string()).optional() }),
    })).mutation(async ({ input }) => { await updateMessageTemplate(input.id, input.data as any); return { success: true }; }),
    delete: adminProcedure.input(z.number()).mutation(async ({ input }) => { await deleteMessageTemplate(input); return { success: true }; }),
    send: adminProcedure.input(z.object({
      templateId: z.number().optional(), recipientType: z.enum(["tenant", "owner", "broker"]),
      recipientId: z.number(), channel: z.enum(["sms", "whatsapp", "email"]),
      content: z.string(),
    })).mutation(async ({ ctx, input }) => {
      await createSentMessage({ ...input, sentBy: ctx.user.id } as any);
      await logActivity({ action: "message_sent", entityType: input.recipientType, entityId: input.recipientId, description: `تم إرسال رسالة عبر ${input.channel}` });
      return { success: true };
    }),
    sentMessages: adminProcedure.input(z.object({
      recipientType: z.string().optional(), recipientId: z.number().optional(), limit: z.number().optional(),
    }).optional()).query(({ input }) => getSentMessages(input ?? {})),
  }),

  // ─── DAILY TASKS ───────────────────────────────────────────────────────────
  tasks: router({
    list: adminProcedure.input(z.object({
      status: z.string().optional(), dueDate: z.string().optional(), type: z.string().optional(),
    }).optional()).query(({ input }) => getDailyTasks(input ?? {})),
    today: adminProcedure.query(() => getTodayTasks()),
    create: adminProcedure.input(z.object({
      title: z.string(), description: z.string().optional(),
      type: z.enum(["collection", "maintenance", "inspection", "contract", "follow_up", "other"]),
      priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
      dueDate: z.string(), assignedTo: z.string().optional(),
      relatedEntityType: z.string().optional(), relatedEntityId: z.number().optional(),
    })).mutation(async ({ input }) => { await createDailyTask(input as any); return { success: true }; }),
    update: adminProcedure.input(z.object({
      id: z.number(),
      data: z.object({
        status: z.enum(["pending", "in_progress", "completed", "dismissed"]).optional(),
        completedAt: z.string().optional(), notes: z.string().optional(),
      }),
    })).mutation(async ({ input }) => { await updateDailyTask(input.id, input.data as any); return { success: true }; }),
  }),

  // ─── DOCUMENTS ─────────────────────────────────────────────────────────────
  documents: router({
    list: adminProcedure.input(z.object({ entityType: z.string(), entityId: z.number() }))
      .query(({ input }) => getDocuments(input.entityType, input.entityId)),
    upload: adminProcedure.input(z.object({
      entityType: z.enum(["owner", "tenant", "property", "contract", "unit"]),
      entityId: z.number(), name: z.string(), type: z.string().optional(),
      base64: z.string(), mimeType: z.string().default("application/pdf"),
    })).mutation(async ({ ctx, input }) => {
      const buffer = Buffer.from(input.base64, "base64");
      const key = `documents/${input.entityType}/${input.entityId}/${nanoid()}-${input.name}`;
      const { url } = await storagePut(key, buffer, input.mimeType);
      await createDocument({
        entityType: input.entityType, entityId: input.entityId,
        name: input.name, type: input.type ?? "other",
        url, fileKey: key, mimeType: input.mimeType,
        uploadedBy: ctx.user.id, fileSize: buffer.length,
      } as any);
      return { success: true, url };
    }),
    delete: adminProcedure.input(z.number()).mutation(async ({ input }) => { await deleteDocument(input); return { success: true }; }),
  }),

  // ─── OWNER STATEMENTS ─────────────────────────────────────────────────────
  ownerStatements: router({
    listAll: adminProcedure.query(() => getAllOwnerStatements()),
    byOwner: adminProcedure.input(z.number()).query(({ input }) => getOwnerStatements(input)),
    myStatements: ownerProcedure.query(async ({ ctx }) => {
      const owner = await getOwnerByUserId(ctx.user.id);
      if (!owner) return [];
      return getOwnerStatements(owner.id);
    }),
    generate: adminProcedure.input(z.object({
      ownerId: z.number(), period: z.string(),
      totalRentCollected: z.string(), totalExpenses: z.string(),
      managementFee: z.string(), netAmount: z.string(),
    })).mutation(async ({ input }) => {
      await createOwnerStatement(input);
      await logActivity({ action: "statement_generated", entityType: "owner", entityId: input.ownerId, description: `تم إنشاء كشف حساب: ${input.period}` });
      return { success: true };
    }),
    updateStatus: adminProcedure.input(z.object({
      id: z.number(), status: z.enum(["draft", "sent", "paid"]), notes: z.string().optional(),
    })).mutation(async ({ input }) => { await updateOwnerStatement(input.id, { status: input.status, notes: input.notes }); return { success: true }; }),
  }),

  // ─── FINANCIAL ─────────────────────────────────────────────────────────────
  financial: router({
    summary: adminProcedure.input(z.number().optional()).query(({ ctx, input }) => getFinancialSummary(input, ctx.user?.companyId ?? null)),
    dashboardStats: adminProcedure.query(({ ctx }) => getDashboardStats(ctx.user?.companyId ?? null)),
    monthlyRevenue: adminProcedure.input(z.number().default(12)).query(({ input }) => getMonthlyRevenue(input)),
    monthlyExpenses: adminProcedure.input(z.number().default(12)).query(({ input }) => getMonthlyExpenses(input)),
    myFinancials: ownerProcedure.query(async ({ ctx }) => {
      const owner = await getOwnerByUserId(ctx.user.id);
      if (!owner) return null;
      const [summary, statements] = await Promise.all([
        getFinancialSummary(owner.id),
        getOwnerStatements(owner.id),
      ]);
      return { owner, summary, statements };
    }),
  }),

  // ─── GLOBAL SEARCH ─────────────────────────────────────────────────────────
  search: router({
    global: adminProcedure.input(z.string().min(2)).query(({ input }) => globalSearch(input)),
  }),

  // ─── LEADS ─────────────────────────────────────────────────────────────────
  leads: router({
    list: adminProcedure.input(z.object({
      status: z.string().optional(), serviceType: z.string().optional(),
      source: z.string().optional(), search: z.string().optional(),
      limit: z.number().optional(), offset: z.number().optional(),
    }).optional()).query(({ input }) => getLeads(input ?? {})),
    count: adminProcedure.query(() => getLeadsCount()),
    update: adminProcedure.input(z.object({
      id: z.number(),
      data: z.object({
        status: z.string().optional(), assignedTo: z.string().optional(),
        notes: z.string().optional(), name: z.string().optional(),
        phone: z.string().optional(), email: z.string().optional(),
      }),
    })).mutation(async ({ input }) => { await updateLead(input.id, input.data as any); return { success: true }; }),
    createFromChat: publicProcedure.input(z.object({
      name: z.string().optional(), phone: z.string().optional(), email: z.string().optional(),
      serviceType: z.enum(["buy", "sell", "rent_looking", "rent_listing", "property_management", "unknown"]).optional(),
      budget: z.string().optional(), notes: z.string().optional(), sessionId: z.string().optional(),
      source: z.enum(["telegram", "website", "whatsapp", "phone", "referral"]).default("website"),
    })).mutation(async ({ input }) => {
      await createLead(input as any);
      await notifyOwner({ title: `عميل جديد من الموقع`, content: `${input.name ?? "غير معروف"} - ${input.phone ?? ""} - ${input.serviceType ?? ""}` });
      return { success: true };
    }),
  }),

  // ─── CHAT (website widget) ─────────────────────────────────────────────────
  chat: router({
    sendMessage: publicProcedure.input(z.object({
      sessionId: z.string(), message: z.string().min(1).max(2000),
    })).mutation(async ({ input }) => {
      const { sessionId, message } = input;
      await getOrCreateChatSession(sessionId);
      await saveChatMessage(sessionId, "user", message);
      const history = await getChatHistory(sessionId, 20);
      let propertiesContext = "";
      try {
        const props = await getProperties({ status: "available", limit: 8 });
        if (props.length > 0) {
          propertiesContext = "\n\nالعقارات المتاحة:\n" + props.map(p =>
            `- ${p.titleAr} | ${p.listingType === "sale" ? "للبيع" : "للإيجار"} | ${Number(p.price).toLocaleString("ar-SA")} ريال | ${p.city}`
          ).join("\n");
        }
      } catch (e) {}
      const SYSTEM = `أنت مساعد عقاري ذكي لشركة "تكامل لإدارة الأملاك" في المدينة المنورة.
تحدث بالعربية دائماً. كن ودوداً ومحترفاً. اجمع: الاسم، الجوال، نوع الخدمة.
خدماتنا: بيع، شراء، إيجار، إدارة أملاك. واتساب: wa.me/966558018151${propertiesContext}`;
      const messages = [
        { role: "system" as const, content: SYSTEM },
        ...history.map(m => ({ role: m.role as "user" | "assistant", content: m.content as string })),
      ];
      const response = await invokeLLM({ messages });
      const rawReply = response.choices?.[0]?.message?.content;
      const reply = (typeof rawReply === "string" ? rawReply : "") || "عذراً، حدث خطأ مؤقت.";
      await saveChatMessage(sessionId, "assistant", reply);
      try {
        const extractResponse = await invokeLLM({
          messages: [
            { role: "system", content: "استخرج بيانات العميل. أعد JSON فقط." },
            { role: "user", content: `${history.map(m => `${m.role}: ${m.content}`).join("\n")}\nuser: ${message}` },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "lead_data", strict: true,
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" }, phone: { type: "string" },
                  serviceType: { type: "string", enum: ["buy", "sell", "rent_looking", "rent_listing", "property_management", "unknown"] },
                  budget: { type: "string" }, preferredCity: { type: "string" },
                },
                required: ["name", "phone", "serviceType", "budget", "preferredCity"],
                additionalProperties: false,
              },
            },
          },
        });
        const rawExtract = extractResponse.choices?.[0]?.message?.content;
        const extracted = JSON.parse((typeof rawExtract === "string" ? rawExtract : "") || "{}");
        const existingLead = await getLeadBySession(sessionId);
        if (!existingLead) {
          await createLead({ name: extracted.name || null, phone: extracted.phone || null, serviceType: extracted.serviceType || "unknown", budget: extracted.budget || null, preferredCity: extracted.preferredCity || null, sessionId, source: "website", status: "new" });
          const newLead = await getLeadBySession(sessionId);
          if (newLead) await linkSessionToLead(sessionId, newLead.id);
          if (extracted.name || extracted.phone) {
            await notifyOwner({ title: "عميل جديد من الموقع", content: `${extracted.name || "غير محدد"} | ${extracted.phone || "غير محدد"} | ${extracted.serviceType || "غير محدد"}` });
          }
        } else {
          const updates: Record<string, unknown> = {};
          if (extracted.name && !existingLead.name) updates.name = extracted.name;
          if (extracted.phone && !existingLead.phone) updates.phone = extracted.phone;
          if (extracted.serviceType !== "unknown" && existingLead.serviceType === "unknown") updates.serviceType = extracted.serviceType;
          if (extracted.budget && !existingLead.budget) updates.budget = extracted.budget;
          if (Object.keys(updates).length > 0) await updateLeadBySession(sessionId, updates as any);
        }
      } catch (e) {}
      return { reply };
    }),
    getHistory: publicProcedure.input(z.string()).query(({ input }) => getChatHistory(input, 50)),
  }),

  // ─── NOTIFICATIONS ─────────────────────────────────────────────────────────
  notifications: router({
    list: protectedProcedure.input(z.boolean().optional()).query(({ ctx, input }) =>
      getNotifications(ctx.user.id, input ?? false)
    ),
    markRead: protectedProcedure.input(z.number()).mutation(async ({ input }) => {
      await markNotificationRead(input);
      return { success: true };
    }),
    markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
      await markAllNotificationsRead(ctx.user.id);
      return { success: true };
    }),
  }),

  // ─── CONTRACTORS (المقاولون) ────────────────────────────────────────────────
  contractors: router({
    list: protectedProcedure.input(z.object({ specialty: z.string().optional(), isActive: z.boolean().optional() }).optional()).query(({ input }) =>
      getContractors(input ?? {})
    ),
    byId: protectedProcedure.input(z.number()).query(({ input }) => getContractorById(input)),
    create: adminProcedure.input(z.object({
      name: z.string(),
      specialty: z.enum(["plumbing","electrical","hvac","painting","carpentry","cleaning","security","general","other"]).default("general"),
      phone: z.string(),
      phone2: z.string().optional(),
      email: z.string().optional(),
      company: z.string().optional(),
      notes: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const result = await createContractor(input);
      await logActivity({ userId: ctx.user.id, userName: ctx.user.name ?? "", action: "create", entityType: "contractor", entityId: result?.id, entityName: input.name });
      return result;
    }),
    update: adminProcedure.input(z.object({ id: z.number(), data: z.object({
      name: z.string().optional(),
      specialty: z.enum(["plumbing","electrical","hvac","painting","carpentry","cleaning","security","general","other"]).optional(),
      phone: z.string().optional(),
      phone2: z.string().optional(), email: z.string().optional(), company: z.string().optional(),
      notes: z.string().optional(), isActive: z.boolean().optional(),
    }) })).mutation(({ input }) => updateContractor(input.id, input.data)),
    rate: adminProcedure.input(z.object({ id: z.number(), rating: z.number().min(1).max(5) })).mutation(({ input }) =>
      rateContractor(input.id, input.rating)
    ),
  }),

  // ─── OWNER TRANSFERS (تحويلات الملاك) ─────────────────────────────────────
  ownerTransfers: router({
    list: protectedProcedure.input(z.number().optional()).query(({ input, ctx }) => {
      if (ctx.user.role === "owner") return getOwnerTransfers(ctx.user.id);
      return getOwnerTransfers(input);
    }),
    create: adminProcedure.input(z.object({
      ownerId: z.number(),
      statementId: z.number().optional(),
      amount: z.string(),
      transferDate: z.string().transform(s => new Date(s)),
      bankName: z.string().optional(),
      ibanLast4: z.string().optional(),
      referenceNumber: z.string().optional(),
      receiptUrl: z.string().optional(),
      status: z.enum(["pending","completed","failed"]).default("pending"),
      notes: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const result = await createOwnerTransfer(input);
      await logActivity({ userId: ctx.user.id, userName: ctx.user.name ?? "", action: "create", entityType: "owner_transfer", entityId: result?.id, entityName: `تحويل ${input.amount} ريال` });
      return result;
    }),
    updateStatus: adminProcedure.input(z.object({ id: z.number(), status: z.enum(["pending","completed","failed"]) })).mutation(({ input }) =>
      updateOwnerTransfer(input.id, { status: input.status })
    ),
  }),

  // ─── BROKER REFERRALS (إحالات الوسطاء) ────────────────────────────────────
  brokerReferrals: router({
    list: protectedProcedure.query(({ ctx }) => {
      if (ctx.user.role === "broker") return getBrokerReferrals(ctx.user.id);
      return getBrokerReferrals();
    }),
    create: protectedProcedure.input(z.object({
      referringBrokerId: z.number(),
      receivingBrokerId: z.number().optional(),
      propertyId: z.number().optional(),
      clientName: z.string(),
      clientPhone: z.string(),
      serviceType: z.enum(["buy","sell","rent","management"]),
      referralCommission: z.string().optional(),
      notes: z.string().optional(),
    })).mutation(({ input }) => createBrokerReferral(input)),
    update: protectedProcedure.input(z.object({ id: z.number(), data: z.object({
      status: z.enum(["pending","contacted","deal_closed","cancelled"]).optional(),
      notes: z.string().optional(),
      referralCommission: z.string().optional(),
    }) })).mutation(({ input }) => updateBrokerReferral(input.id, input.data)),
  }),

  // ─── SYSTEM SETTINGS (إعدادات النظام) ─────────────────────────────────────
  settings: router({
    list: adminProcedure.query(() => getSystemSettings()),
    get: protectedProcedure.input(z.string()).query(({ input }) => getSystemSetting(input)),
    set: adminProcedure.input(z.object({ key: z.string(), value: z.string(), description: z.string().optional() })).mutation(({ input }) =>
      upsertSystemSetting(input.key, input.value, input.description)
    ),
  }),

  // ─── ADVANCED ANALYTICS (التحليلات المتقدمة) ──────────────────────────────
  analytics: router({
    kpis: protectedProcedure.query(({ ctx }) => getKPIs(ctx.user?.companyId ?? null)),
    revenueByProperty: protectedProcedure.input(z.number().optional()).query(({ input, ctx }) => {
      const ownerId = ctx.user.role === "owner" ? ctx.user.id : input;
      return getRevenueByProperty(ownerId);
    }),
    collectionRate: adminProcedure.input(z.number().optional()).query(({ input }) =>
      getCollectionRate(input ?? 6)
    ),
    maintenanceCost: adminProcedure.query(() => getMaintenanceCostByProperty()),
    brokerPerformance: adminProcedure.query(() => getBrokerPerformance()),
    ownerROI: protectedProcedure.input(z.number()).query(({ input }) => getOwnerROI(input)),
    propertyROI: adminProcedure.input(z.number()).query(({ input }) => getPropertyROI(input)),
    allPropertiesROI: adminProcedure.query(() => getAllPropertiesROI()),
  }),

  // ─── BACKUP & EXPORT (نسخ احتياطي وتصدير) ────────────────────────────────────────────────
  backup: router({
    exportData: adminProcedure.input(z.object({
      tables: z.array(z.enum(["properties", "tenants", "contracts", "payments", "owners", "brokers", "maintenance"])),
    })).query(async ({ input }) => {
      const result: Record<string, unknown[]> = {};
      const db = await import("./db");
      if (input.tables.includes("properties")) result.properties = await db.getProperties({});
      if (input.tables.includes("tenants")) result.tenants = await db.getTenants({});
      if (input.tables.includes("contracts")) result.contracts = await db.getContracts({});
      if (input.tables.includes("payments")) result.payments = await db.getPayments({});
      if (input.tables.includes("owners")) result.owners = await db.getOwners({});
      if (input.tables.includes("brokers")) result.brokers = await db.getBrokers({});
      if (input.tables.includes("maintenance")) result.maintenance = await db.getMaintenanceRequests({});
      return { data: result, exportedAt: new Date().toISOString(), version: "1.0" };
    }),
  }),

  // ─── ACCOUNTING EXPORT (تصدير محاسبي) ────────────────────────────────────────────────
  accounting: router({
    journalEntries: adminProcedure.input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    })).query(async ({ input }) => {
      const payments = await import("./db").then(db => db.getPayments({ status: "paid" }));
      const expenses = await import("./db").then(db => db.getExpenses({}));
      const entries: Array<{
        date: string; ref: string; description: string;
        debit: number; credit: number; account: string; type: string;
      }> = [];
      payments.forEach((p: any) => {
        if (input.startDate && p.paidDate < input.startDate) return;
        if (input.endDate && p.paidDate > input.endDate) return;
        entries.push({
          date: p.paidDate ?? p.dueDate, ref: `INV-${p.id}`,
          description: `إيجار - ${p.tenantName ?? "مستأجر"}`,
          debit: Number(p.paidAmount ?? p.amount), credit: 0,
          account: "1100 - النقدية", type: "revenue",
        });
      });
      expenses.forEach((e: any) => {
        if (input.startDate && e.expenseDate < input.startDate) return;
        if (input.endDate && e.expenseDate > input.endDate) return;
        entries.push({
          date: e.expenseDate, ref: `EXP-${e.id}`,
          description: e.description ?? "مصروف",
          debit: 0, credit: Number(e.amount),
          account: "5000 - المصاريف", type: "expense",
        });
      });
      return entries.sort((a, b) => a.date.localeCompare(b.date));
    }),
    summary: adminProcedure.input(z.object({
      year: z.number().default(new Date().getFullYear()),
    })).query(async ({ input }) => {
      const db = await import("./db");
      const payments = await db.getPayments({ status: "paid" });
      const expenses = await db.getExpenses({});
      const months: Record<number, { revenue: number; expenses: number; net: number }> = {};
      for (let m = 1; m <= 12; m++) months[m] = { revenue: 0, expenses: 0, net: 0 };
      payments.forEach((p: any) => {
        const d = new Date(p.paidDate ?? p.dueDate);
        if (d.getFullYear() !== input.year) return;
        months[d.getMonth() + 1].revenue += Number(p.paidAmount ?? p.amount);
      });
      expenses.forEach((e: any) => {
        const d = new Date(e.expenseDate);
        if (d.getFullYear() !== input.year) return;
        months[d.getMonth() + 1].expenses += Number(e.amount);
      });
      Object.values(months).forEach(m => { m.net = m.revenue - m.expenses; });
      return { year: input.year, months };
    }),
  }),

  // ─── SMART ALERTS (التنبيهات الذكية) ────────────────────────────────────────────────────────
  smartAlerts: router({
    get: adminProcedure.query(({ ctx }) => getSmartAlerts(ctx.user?.companyId ?? null)),
    getEnriched: adminProcedure.query(async ({ ctx }) => {
      const raw = await getSmartAlerts(ctx.user?.companyId ?? null);
      // تحويل كل تنبيه إلى كائن موحد مع priority وaction وstatus
      const alerts: Array<{ id: string; type: string; priority: "critical" | "high" | "medium" | "low"; title: string; description: string; action: string; actionUrl: string; status: "open" | "acknowledged"; entityId: number }> = [];
      raw.overduePayments.forEach(p => {
        const days = Number(p.daysOverdue ?? 0);
        alerts.push({
          id: `overdue-${p.id}`,
          type: "overdue_payment",
          priority: days > 30 ? "critical" : days > 14 ? "high" : "medium",
          title: `دفعة متأخرة — ${p.tenantName ?? "مستأجر"}`,
          description: `متأخر ${days} يوم | المبلغ: ${Number(p.amount).toLocaleString("ar-SA")} ر.س | ${p.propertyTitle ?? ""}`,
          action: "تحصيل الدفعة",
          actionUrl: `/payments`,
          status: "open",
          entityId: p.id,
        });
      });
      raw.expiringContracts.forEach(c => {
        const days = Number(c.daysLeft ?? 0);
        alerts.push({
          id: `expiring-${c.id}`,
          type: "expiring_contract",
          priority: days <= 14 ? "high" : "medium",
          title: `عقد ينتهي قريباً — ${c.tenantName ?? "مستأجر"}`,
          description: `ينتهي خلال ${days} يوم | ${c.propertyTitle ?? ""}`,
          action: "تجديد العقد",
          actionUrl: `/contracts`,
          status: "open",
          entityId: c.id,
        });
      });
      raw.pendingMaintenance.forEach(m => {
        alerts.push({
          id: `maint-${m.id}`,
          type: "pending_maintenance",
          priority: m.priority === "urgent" ? "critical" : "high",
          title: `صيانة عاجلة — ${m.title}`,
          description: `منذ ${Number(m.daysPending ?? 0)} يوم | ${m.propertyTitle ?? ""}`,
          action: "متابعة الصيانة",
          actionUrl: `/maintenance`,
          status: "open",
          entityId: m.id,
        });
      });
      raw.vacantUnits.forEach(u => {
        const days = Number(u.daysVacant ?? 0);
        alerts.push({
          id: `vacant-${u.id}`,
          type: "vacant_unit",
          priority: days > 60 ? "high" : "low",
          title: `وحدة شاغرة — ${u.unitNumber}`,
          description: `شاغرة منذ ${days} يوم | إيجار: ${Number(u.rentPrice ?? 0).toLocaleString("ar-SA")} ر.س | ${u.propertyTitle ?? ""}`,
          action: "نشر إعلان",
          actionUrl: `/units`,
          status: "open",
          entityId: u.id,
        });
      });
      // ترتيب حسب الأولوية
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      alerts.sort((a, b) => order[a.priority] - order[b.priority]);
      return alerts;
    }),
    sendDailyReport: adminProcedure.mutation(async () => {
      const alerts = await getSmartAlerts();
      const kpisData = await getKPIs();
      const kpis = kpisData ?? { totalProperties: 0, occupancyRate: 0, thisMonthRevenue: 0, overduePayments: 0, overdueAmount: 0, openMaintenance: 0, expiringContracts: 0 };
      const msg = [
        `📊 *تقرير تكامل اليومي - ${new Date().toLocaleDateString("ar-SA")}*`,
        ``,
        `🏠 العقارات: ${kpis.totalProperties} | الإشغال: ${kpis.occupancyRate.toFixed(1)}%`,
        `💰 إيرادات الشهر: ${Number(kpis.thisMonthRevenue).toLocaleString("ar-SA")} ر.س`,
        `⚠️ متأخرات: ${kpis.overduePayments} دفعة (مبلغ: ${Number(kpis.overdueAmount).toLocaleString("ar-SA")} ر.س)`,
        `🔧 صيانة مفتوحة: ${kpis.openMaintenance}`,
        `📄 عقود تنتهي قريباً: ${kpis.expiringContracts}`,
        ``,
        alerts.overduePayments.length > 0 ? `🚨 *متأخرون عن الدفع:*\n${alerts.overduePayments.slice(0, 3).map(p => `• ${p.tenantName} - ${Number(p.amount).toLocaleString("ar-SA")} ر.س (تأخر ${p.daysOverdue} يوم)`).join("\n")}` : "",
        alerts.expiringContracts.length > 0 ? `📅 *عقود تنتهي قريباً:*\n${alerts.expiringContracts.slice(0, 3).map(c => `• ${c.tenantName} - ${c.propertyTitle} (${c.daysLeft} يوم)`).join("\n")}` : "",
      ].filter(Boolean).join("\n");
      await notifyOwner({ title: "تقرير تكامل اليومي", content: msg });
      return { success: true, message: msg };
    }),
  }),

  // ─── TENANT RATINGS ──────────────────────────────────────────────────────────
  tenantRatings: router({
    getByTenant: adminProcedure.input(z.object({ tenantId: z.number() })).query(async ({ input }) => {
      return getTenantRatings(input.tenantId);
    }),
    add: adminProcedure.input(z.object({
      tenantId: z.number(),
      contractId: z.number(),
      paymentScore: z.number().min(1).max(5).default(5),
      cleanlinessScore: z.number().min(1).max(5).default(5),
      complianceScore: z.number().min(1).max(5).default(5),
      notes: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      await addTenantRating({ ...input, ratedBy: ctx.user.id });
      return { success: true };
    }),
  }),

  // ─── CLIENT NOTES ─────────────────────────────────────────────────────────────
  clientNotes: router({
    get: adminProcedure.input(z.object({
      leadId: z.number().optional(),
      ownerId: z.number().optional(),
      tenantId: z.number().optional(),
    })).query(async ({ input }) => {
      return getClientNotes(input);
    }),
    add: adminProcedure.input(z.object({
      leadId: z.number().optional(),
      ownerId: z.number().optional(),
      tenantId: z.number().optional(),
      note: z.string().min(1),
      noteType: z.enum(["call", "meeting", "email", "whatsapp", "other"]).default("other"),
      followUpDate: z.number().optional(),
    })).mutation(async ({ input, ctx }) => {
      await addClientNote({ ...input, createdBy: ctx.user.id });
      return { success: true };
    }),
    getFollowUps: adminProcedure.query(async () => {
      return getUpcomingFollowUps();
    }),
  }),

  // ─── MARKET COMPARISON ────────────────────────────────────────────────────────
  market: router({
    getPrices: adminProcedure.query(async () => {
      return getMarketPrices();
    }),
    getComparison: adminProcedure.query(async () => {
      return getPropertiesWithMarketComparison();
    }),
  }),

  // ─── ANNUAL REPORT ────────────────────────────────────────────────────────────
  annualReport: router({
    get: adminProcedure.input(z.object({ year: z.number().default(new Date().getFullYear()) })).query(async ({ input }) => {
      return getAnnualReport(input.year);
    }),
  }),

  // ─── TENANT PORTAL (بوابة المستأجر) ──────────────────────────────────────────
  tenantPortal: router({
    getByContract: publicProcedure.input(z.object({ contractCode: z.string() })).query(async ({ input }) => {
      const db = await import("./db");
      const contracts = await db.getContracts();
      const contract = contracts.find(c => c.contractNumber === input.contractCode);
      if (!contract) throw new TRPCError({ code: "NOT_FOUND", message: "رقم العقد غير صحيح" });
      const tenant = contract.tenantId ? await db.getTenantById(contract.tenantId) : null;
      const payments_ = await db.getPayments({ contractId: contract.id });
      const maintenance = contract.propertyId ? await db.getMaintenanceRequests({ propertyId: contract.propertyId }) : [];
      return { contract, tenant, payments: payments_, maintenance };
    }),
    submitMaintenance: publicProcedure.input(z.object({
      contractCode: z.string(),
      title: z.string().min(3),
      description: z.string().optional(),
      priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
    })).mutation(async ({ input }) => {
      const db = await import("./db");
      const contracts = await db.getContracts();
      const contract = contracts.find(c => c.contractNumber === input.contractCode);
      if (!contract) throw new TRPCError({ code: "NOT_FOUND", message: "رقم العقد غير صحيح" });
      await db.createMaintenanceRequest({
        propertyId: contract.propertyId ?? undefined,
        unitId: contract.unitId ?? undefined,
        tenantId: contract.tenantId ?? undefined,
        title: input.title,
        description: input.description,
        priority: input.priority,
        status: "open",
      });
      return { success: true };
    }),
    uploadDocument: publicProcedure.input(z.object({
      contractCode: z.string(),
      base64: z.string(),
      filename: z.string(),
      mimeType: z.string(),
      docType: z.string().default("other"),
    })).mutation(async ({ input }) => {
      const db2 = await import("./db");
      const contracts = await db2.getContracts();
      const contract = contracts.find(c => c.contractNumber === input.contractCode);
      if (!contract) throw new TRPCError({ code: "NOT_FOUND", message: "رقم العقد غير صحيح" });
      const buffer = Buffer.from(input.base64, "base64");
      const fileKey = `tenant-docs/${contract.tenantId}-${Date.now()}-${input.filename}`;
      const { url } = await storagePut(fileKey, buffer, input.mimeType);
      const drizzle = await getDb();
      if (!drizzle) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await drizzle.insert(tenantDocuments).values({
        tenantId: contract.tenantId ?? 0,
        contractId: contract.id,
        fileName: input.filename,
        fileUrl: url,
        fileKey,
        docType: input.docType,
        uploadedAt: Date.now(),
      });
      return { success: true, url };
    }),
    getDocuments: publicProcedure.input(z.object({ contractCode: z.string() })).query(async ({ input }) => {
      const db2 = await import("./db");
      const contracts = await db2.getContracts();
      const contract = contracts.find(c => c.contractNumber === input.contractCode);
      if (!contract) throw new TRPCError({ code: "NOT_FOUND" });
      const drizzle = await getDb();
      if (!drizzle) return [];
      return drizzle.select().from(tenantDocuments)
        .where(eq(tenantDocuments.contractId, contract.id))
        .orderBy(desc(tenantDocuments.uploadedAt));
    }),
  }),

  // ─── API KEYS MANAGEMENT ──────────────────────────────────────────────────────
  openApiKeys: router({
    list: adminProcedure.query(async () => {
      const drizzle = await getDb();
      if (!drizzle) return [];
      return drizzle.select().from(apiKeys).orderBy(desc(apiKeys.createdAt));
    }),
    create: adminProcedure.input(z.object({
      name: z.string().min(3),
      permissions: z.array(z.string()).default(["read"]),
    })).mutation(async ({ input }) => {
      const rawKey = `tk_${randomBytes(32).toString("hex")}`;
      const keyHash = createHash("sha256").update(rawKey).digest("hex");
      const keyPrefix = rawKey.substring(0, 12);
      const drizzle = await getDb();
      if (!drizzle) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await drizzle.insert(apiKeys).values({
        name: input.name,
        keyHash,
        keyPrefix,
        permissions: input.permissions,
        isActive: true,
        createdAt: Date.now(),
      });
      return { success: true, apiKey: rawKey, prefix: keyPrefix };
    }),
    revoke: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const drizzle = await getDb();
      if (!drizzle) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await drizzle.update(apiKeys).set({ isActive: false, revokedAt: Date.now() }).where(eq(apiKeys.id, input.id));
      return { success: true };
    }),
  }),

  // ─── PROPERTY LISTINGS (الإعلانات) ────────────────────────────────────────────
  listings: router({
    list: publicProcedure.input(z.object({
      status: z.enum(["active", "paused", "rented", "sold"]).optional(),
      listingType: z.enum(["rent", "sale"]).optional(),
    }).optional()).query(async ({ input }) => {
      const drizzle = await getDb();
      if (!drizzle) return [];
      const rows = await drizzle.select().from(propertyListings).orderBy(desc(propertyListings.createdAt));
      if (!input) return rows;
      return rows.filter((r: typeof rows[0]) => {
        if (input.status && r.status !== input.status) return false;
        if (input.listingType && r.listingType !== input.listingType) return false;
        return true;
      });
    }),
    create: adminProcedure.input(z.object({
      propertyId: z.number(),
      unitId: z.number().optional(),
      title: z.string().min(5),
      description: z.string().optional(),
      listingType: z.enum(["rent", "sale"]).default("rent"),
      price: z.number().positive(),
      contactPhone: z.string().optional(),
      contactWhatsapp: z.string().optional(),
      expiresAt: z.number().optional(),
    })).mutation(async ({ input }) => {
      const drizzle = await getDb();
      if (!drizzle) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const now = Date.now();
      await drizzle.insert(propertyListings).values({
        ...input,
        price: String(input.price),
        status: "active",
        autoPublished: false,
        viewsCount: 0,
        inquiriesCount: 0,
        publishedAt: now,
        createdAt: now,
        updatedAt: now,
      });
      return { success: true };
    }),
    update: adminProcedure.input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      price: z.number().optional(),
      status: z.enum(["active", "paused", "rented", "sold"]).optional(),
      contactPhone: z.string().optional(),
      contactWhatsapp: z.string().optional(),
    })).mutation(async ({ input }) => {
      const { id, price, ...rest } = input;
      const drizzle = await getDb();
      if (!drizzle) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await drizzle.update(propertyListings).set({
        ...rest,
        ...(price ? { price: String(price) } : {}),
        updatedAt: Date.now(),
      }).where(eq(propertyListings.id, id));
      return { success: true };
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const drizzle = await getDb();
      if (!drizzle) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await drizzle.delete(propertyListings).where(eq(propertyListings.id, input.id));
      return { success: true };
    }),
    incrementView: publicProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const drizzle = await getDb();
      if (!drizzle) return { success: false };
      const [row] = await drizzle.select().from(propertyListings).where(eq(propertyListings.id, input.id));
      if (row) await drizzle.update(propertyListings).set({ viewsCount: (row.viewsCount ?? 0) + 1 }).where(eq(propertyListings.id, input.id));
      return { success: true };
    }),
  }),

  // ─── ACCOUNTING DIRECT EXPORT (QuickBooks / Odoo) ──────────────────────────────
  accountingDirect: router({
    exportQuickBooks: adminProcedure.input(z.object({
      dateFrom: z.number(),
      dateTo: z.number(),
    })).mutation(async ({ input }) => {
      const db2 = await import("./db");
      const payments_ = await db2.getPayments({});
      const filtered = payments_.filter((p: any) => {
        const d = (p.paidDate ?? p.dueDate) as string | null;
        if (!d) return false;
        const ts = new Date(d).getTime();
        return ts >= input.dateFrom && ts <= input.dateTo;
      });
      const lines = [
        "!TRNS\tTRNSTYPE\tDATE\tACCNT\tNAME\tAMOUNT\tMEMO",
        "!SPL\tTRNSTYPE\tDATE\tACCNT\tAMOUNT\tMEMO",
        "!ENDTRNS",
        ...filtered.map((p: any) => {
          const date = p.paidDate ? new Date(p.paidDate as string).toLocaleDateString("en-US") : new Date().toLocaleDateString("en-US");
          return [
            `TRNS\tINVOICE\t${date}\tAccounts Receivable\tMustajir\t${p.amount}\tإيجار`,
            `SPL\tINVOICE\t${date}\tRental Income\t-${p.amount}\tإيجار`,
            "ENDTRNS",
          ].join("\n");
        }),
      ];
      const content = lines.join("\n");
      const drizzle = await getDb();
      if (drizzle) {
        await drizzle.insert(accountingExports).values({
          exportType: "quickbooks",
          dateFrom: input.dateFrom,
          dateTo: input.dateTo,
          recordsCount: filtered.length,
          status: "completed",
          createdAt: Date.now(),
        });
      }
      return { success: true, content, recordsCount: filtered.length, format: "IIF" };
    }),
    exportOdoo: adminProcedure.input(z.object({
      dateFrom: z.number(),
      dateTo: z.number(),
    })).mutation(async ({ input }) => {
      const db2 = await import("./db");
      const payments_ = await db2.getPayments({});
      const filtered = payments_.filter((p: any) => {
        const d = (p.paidDate ?? p.dueDate) as string | null;
        if (!d) return false;
        const ts = new Date(d).getTime();
        return ts >= input.dateFrom && ts <= input.dateTo;
      });
      const headers = ["date", "journal_id", "partner_id", "name", "debit", "credit", "account_id"];
      const rows2 = filtered.map((p: any) => {
        const date = p.paidDate ? new Date(p.paidDate as string).toISOString().split("T")[0] : new Date().toISOString().split("T")[0];
        return [date, "BNK1", `tenant-${p.tenantId}`, `إيجار - عقار ${p.propertyId}`, p.amount, "0", "411000"].join(",");
      });
      const content = [headers.join(","), ...rows2].join("\n");
      const drizzle = await getDb();
      if (drizzle) {
        await drizzle.insert(accountingExports).values({
          exportType: "odoo",
          dateFrom: input.dateFrom,
          dateTo: input.dateTo,
          recordsCount: filtered.length,
          status: "completed",
          createdAt: Date.now(),
        });
      }
      return { success: true, content, recordsCount: filtered.length, format: "CSV" };
    }),
    getHistory: adminProcedure.query(async () => {
      const drizzle = await getDb();
      if (!drizzle) return [];
      return drizzle.select().from(accountingExports).orderBy(desc(accountingExports.createdAt)).limit(50);
    }),
  }),
});

// ─── Extend appRouter with batch-10 routers ───────────────────────────────────
// Note: We extend by re-exporting a merged router
export const batch10Router = router({

  // ─── STAFF MANAGEMENT (إدارة الموظفين) ─────────────────────────────────────
  staff: router({
    list: adminProcedure.query(async () => {
      const drizzle = await getDb();
      if (!drizzle) return [];
      return drizzle.select().from(staff).orderBy(desc(staff.createdAt));
    }),
    get: adminProcedure.input(z.number()).query(async ({ input }) => {
      const drizzle = await getDb();
      if (!drizzle) return null;
      const [row] = await drizzle.select().from(staff).where(eq(staff.id, input));
      return row ?? null;
    }),
    create: adminProcedure.input(z.object({
      name: z.string().min(2),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      role: z.enum(["admin","accountant","property_manager","maintenance_supervisor","leasing_agent","receptionist"]),
      department: z.string().optional(),
      notes: z.string().optional(),
    })).mutation(async ({ input }) => {
      const drizzle = await getDb();
      if (!drizzle) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await drizzle.insert(staff).values({ ...input, createdAt: Date.now(), updatedAt: Date.now() });
      return { success: true };
    }),
    update: adminProcedure.input(z.object({
      id: z.number(),
      data: z.object({
        name: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        role: z.enum(["admin","accountant","property_manager","maintenance_supervisor","leasing_agent","receptionist"]).optional(),
        department: z.string().optional(),
        isActive: z.boolean().optional(),
        notes: z.string().optional(),
      }),
    })).mutation(async ({ input }) => {
      const drizzle = await getDb();
      if (!drizzle) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await drizzle.update(staff).set({ ...input.data, updatedAt: Date.now() }).where(eq(staff.id, input.id));
      return { success: true };
    }),
    delete: adminProcedure.input(z.number()).mutation(async ({ input }) => {
      const drizzle = await getDb();
      if (!drizzle) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await drizzle.delete(staff).where(eq(staff.id, input));
      return { success: true };
    }),
  }),

  // ─── ROLE PERMISSIONS (صلاحيات الأدوار) ────────────────────────────────────
  permissions: router({
    getByRole: adminProcedure.input(z.string()).query(async ({ input }) => {
      const drizzle = await getDb();
      if (!drizzle) return [];
      return drizzle.select().from(rolePermissions).where(eq(rolePermissions.role, input));
    }),
    getAll: adminProcedure.query(async () => {
      const drizzle = await getDb();
      if (!drizzle) return [];
      return drizzle.select().from(rolePermissions);
    }),
    upsert: adminProcedure.input(z.object({
      role: z.string(),
      module: z.string(),
      canView: z.boolean().default(false),
      canCreate: z.boolean().default(false),
      canEdit: z.boolean().default(false),
      canDelete: z.boolean().default(false),
      canExport: z.boolean().default(false),
    })).mutation(async ({ input }) => {
      const drizzle = await getDb();
      if (!drizzle) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const existing = await drizzle.select().from(rolePermissions)
        .where(and(eq(rolePermissions.role, input.role), eq(rolePermissions.module, input.module)));
      if (existing.length > 0) {
        await drizzle.update(rolePermissions).set({
          canView: input.canView, canCreate: input.canCreate, canEdit: input.canEdit,
          canDelete: input.canDelete, canExport: input.canExport,
        }).where(and(eq(rolePermissions.role, input.role), eq(rolePermissions.module, input.module)));
      } else {
        await drizzle.insert(rolePermissions).values({ ...input, createdAt: Date.now() });
      }
      return { success: true };
    }),
    seedDefaults: adminProcedure.mutation(async () => {
      const drizzle = await getDb();
      if (!drizzle) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const defaults = [
        // admin - full access
        ...(["properties","tenants","contracts","payments","maintenance","reports","staff","owners","brokers","settings","export"]).map(m => ({
          role: "admin", module: m, canView: true, canCreate: true, canEdit: true, canDelete: true, canExport: true, createdAt: Date.now()
        })),
        // accountant - finance only
        ...(["payments","reports","export"]).map(m => ({
          role: "accountant", module: m, canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: true, createdAt: Date.now()
        })),
        ...(["properties","tenants","contracts"]).map(m => ({
          role: "accountant", module: m, canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: false, createdAt: Date.now()
        })),
        // property_manager - properties & tenants
        ...(["properties","tenants","contracts","payments","owners"]).map(m => ({
          role: "property_manager", module: m, canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: true, createdAt: Date.now()
        })),
        ...(["maintenance","reports"]).map(m => ({
          role: "property_manager", module: m, canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: false, createdAt: Date.now()
        })),
        // maintenance_supervisor - maintenance only
        ...(["maintenance","properties"]).map(m => ({
          role: "maintenance_supervisor", module: m, canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: false, createdAt: Date.now()
        })),
        // leasing_agent - listings & leads
        ...(["properties","tenants","contracts"]).map(m => ({
          role: "leasing_agent", module: m, canView: true, canCreate: true, canEdit: true, canDelete: false, canExport: false, createdAt: Date.now()
        })),
        // receptionist - view only
        ...(["properties","tenants","maintenance"]).map(m => ({
          role: "receptionist", module: m, canView: true, canCreate: false, canEdit: false, canDelete: false, canExport: false, createdAt: Date.now()
        })),
      ];
      // Clear existing and re-seed
      await drizzle.delete(rolePermissions);
      await drizzle.insert(rolePermissions).values(defaults);
      return { success: true, count: defaults.length };
    }),
  }),

  // ─── LOGIN LOG (سجل الدخول) ─────────────────────────────────────────────────
  loginLog: router({
    list: adminProcedure.input(z.object({
      limit: z.number().default(50),
      userId: z.number().optional(),
    }).optional()).query(async ({ input }) => {
      const drizzle = await getDb();
      if (!drizzle) return [];
      return drizzle.select().from(loginLog).orderBy(desc(loginLog.createdAt)).limit(input?.limit ?? 50);
    }),
  }),

  // ─── INTERNAL MESSAGES (الرسائل الداخلية) ──────────────────────────────────
  messages: router({
    inbox: protectedProcedure.query(async ({ ctx }) => {
      const drizzle = await getDb();
      if (!drizzle) return [];
      return drizzle.select().from(internalMessages)
        .where(eq(internalMessages.toUserId, ctx.user.id))
        .orderBy(desc(internalMessages.createdAt)).limit(50);
    }),
    sent: protectedProcedure.query(async ({ ctx }) => {
      const drizzle = await getDb();
      if (!drizzle) return [];
      return drizzle.select().from(internalMessages)
        .where(eq(internalMessages.fromUserId, ctx.user.id))
        .orderBy(desc(internalMessages.createdAt)).limit(50);
    }),
    send: protectedProcedure.input(z.object({
      toUserId: z.number(),
      subject: z.string().optional(),
      body: z.string().min(1),
    })).mutation(async ({ ctx, input }) => {
      const drizzle = await getDb();
      if (!drizzle) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await drizzle.insert(internalMessages).values({
        fromUserId: ctx.user.id,
        toUserId: input.toUserId,
        subject: input.subject,
        body: input.body,
        createdAt: Date.now(),
      });
      return { success: true };
    }),
    markRead: protectedProcedure.input(z.number()).mutation(async ({ input }) => {
      const drizzle = await getDb();
      if (!drizzle) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await drizzle.update(internalMessages).set({ isRead: true }).where(eq(internalMessages.id, input));
      return { success: true };
    }),
    unreadCount: protectedProcedure.query(async ({ ctx }) => {
      const drizzle = await getDb();
      if (!drizzle) return 0;
      const rows = await drizzle.select({ count: sql<number>`count(*)` }).from(internalMessages)
        .where(and(eq(internalMessages.toUserId, ctx.user.id), eq(internalMessages.isRead, false)));
      return Number(rows[0]?.count ?? 0);
    }),
  }),

  // ─── WEBHOOKS (نقاط Webhook) ────────────────────────────────────────────────
  webhooks: router({
    list: adminProcedure.query(async () => {
      const drizzle = await getDb();
      if (!drizzle) return [];
      return drizzle.select().from(webhooks).orderBy(desc(webhooks.createdAt));
    }),
    create: adminProcedure.input(z.object({
      name: z.string().min(2),
      url: z.string().url(),
      secret: z.string().optional(),
      events: z.array(z.string()).min(1),
    })).mutation(async ({ input }) => {
      const drizzle = await getDb();
      if (!drizzle) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await drizzle.insert(webhooks).values({
        name: input.name,
        url: input.url,
        secret: input.secret,
        events: JSON.stringify(input.events),
        createdAt: Date.now(),
      });
      return { success: true };
    }),
    update: adminProcedure.input(z.object({
      id: z.number(),
      isActive: z.boolean().optional(),
      name: z.string().optional(),
      url: z.string().optional(),
      events: z.array(z.string()).optional(),
    })).mutation(async ({ input }) => {
      const drizzle = await getDb();
      if (!drizzle) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const updateData: Record<string, unknown> = {};
      if (input.isActive !== undefined) updateData.isActive = input.isActive;
      if (input.name) updateData.name = input.name;
      if (input.url) updateData.url = input.url;
      if (input.events) updateData.events = JSON.stringify(input.events);
      await drizzle.update(webhooks).set(updateData).where(eq(webhooks.id, input.id));
      return { success: true };
    }),
    delete: adminProcedure.input(z.number()).mutation(async ({ input }) => {
      const drizzle = await getDb();
      if (!drizzle) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await drizzle.delete(webhooks).where(eq(webhooks.id, input));
      return { success: true };
    }),
  }),

  // ─── API USAGE STATS (إحصائيات API) ────────────────────────────────────────
  apiStats: router({
    getUsage: adminProcedure.input(z.object({
      apiKeyId: z.number().optional(),
      days: z.number().default(30),
    }).optional()).query(async ({ input }) => {
      const drizzle = await getDb();
      if (!drizzle) return { total: 0, byDay: [], byEndpoint: [] };
      const since = Date.now() - (input?.days ?? 30) * 24 * 60 * 60 * 1000;
      let query = drizzle.select().from(apiUsageLog).where(gte(apiUsageLog.createdAt, since));
      const rows = await query.orderBy(desc(apiUsageLog.createdAt)).limit(1000);
      // Group by day
      const byDayMap = new Map<string, number>();
      const byEndpointMap = new Map<string, number>();
      for (const row of rows) {
        const day = new Date(row.createdAt).toISOString().split("T")[0];
        byDayMap.set(day, (byDayMap.get(day) ?? 0) + 1);
        byEndpointMap.set(row.endpoint, (byEndpointMap.get(row.endpoint) ?? 0) + 1);
      }
      return {
        total: rows.length,
        byDay: Array.from(byDayMap.entries()).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date)),
        byEndpoint: Array.from(byEndpointMap.entries()).map(([endpoint, count]) => ({ endpoint, count })).sort((a, b) => b.count - a.count).slice(0, 10),
      };
    }),
  }),

  // ─── LISTING VIEWS (مشاهدات الإعلانات) ─────────────────────────────────────
  listingViews: router({
    track: publicProcedure.input(z.object({
      listingId: z.number(),
      source: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const drizzle = await getDb();
      if (!drizzle) return { success: false };
      const ip = (ctx.req as any).ip ?? (ctx.req as any).socket?.remoteAddress ?? "unknown";
      await drizzle.insert(listingViews).values({
        listingId: input.listingId,
        ipAddress: ip,
        source: input.source,
        createdAt: Date.now(),
      });
      // Update counter in property_listings
      await drizzle.update(propertyListings)
        .set({ viewsCount: sql`${propertyListings.viewsCount} + 1` })
        .where(eq(propertyListings.id, input.listingId));
      return { success: true };
    }),
    getStats: adminProcedure.input(z.number()).query(async ({ input }) => {
      const drizzle = await getDb();
      if (!drizzle) return { total: 0, byDay: [] };
      const rows = await drizzle.select().from(listingViews)
        .where(eq(listingViews.listingId, input))
        .orderBy(desc(listingViews.createdAt)).limit(500);
      const byDayMap = new Map<string, number>();
      for (const row of rows) {
        const day = new Date(row.createdAt).toISOString().split("T")[0];
        byDayMap.set(day, (byDayMap.get(day) ?? 0) + 1);
      }
      return {
        total: rows.length,
        byDay: Array.from(byDayMap.entries()).map(([date, count]) => ({ date, count })).sort((a, b) => a.date.localeCompare(b.date)),
      };
    }),
  }),

  // ─── CONTRACT RENEWAL REQUESTS (طلبات تجديد العقود) ────────────────────────
  renewalRequests: router({
    list: adminProcedure.query(async () => {
      const drizzle = await getDb();
      if (!drizzle) return [];
      return drizzle.select().from(contractRenewalRequests).orderBy(desc(contractRenewalRequests.createdAt));
    }),
    submit: publicProcedure.input(z.object({
      contractNumber: z.string(),
      phone: z.string(),
      requestedRentAmount: z.string().optional(),
      notes: z.string().optional(),
    })).mutation(async ({ input }) => {
      const drizzle = await getDb();
      if (!drizzle) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      // Find contract by number
      const { contracts, tenants } = await import("../drizzle/schema");
      const [contract] = await drizzle.select().from(contracts).where(eq(contracts.contractNumber, input.contractNumber));
      if (!contract) throw new TRPCError({ code: "NOT_FOUND", message: "رقم العقد غير صحيح" });
      // Verify phone matches tenant
      if (contract.tenantId) {
        const [tenant] = await drizzle.select().from(tenants).where(eq(tenants.id, contract.tenantId));
        if (tenant && tenant.phone !== input.phone) throw new TRPCError({ code: "UNAUTHORIZED", message: "رقم الهاتف غير مطابق" });
      }
      await drizzle.insert(contractRenewalRequests).values({
        contractId: contract.id,
        tenantId: contract.tenantId!,
        requestedRentAmount: input.requestedRentAmount,
        notes: input.notes,
        createdAt: Date.now(),
      });
      // Notify admin
      await notifyOwner({ title: "طلب تجديد عقد جديد", content: `العقد رقم ${input.contractNumber} - طلب تجديد من المستأجر` });
      return { success: true };
    }),
    review: adminProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["approved","rejected"]),
    })).mutation(async ({ ctx, input }) => {
      const drizzle = await getDb();
      if (!drizzle) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await drizzle.update(contractRenewalRequests).set({
        status: input.status,
        reviewedBy: ctx.user.id,
        reviewedAt: Date.now(),
      }).where(eq(contractRenewalRequests.id, input.id));
      return { success: true };
    }),
  }),
});

// ─── BATCH 11: SAP/VAT Export + Cashflow Forecast + Arrears Heatmap ─────────────
const batch11Router = router({
  sapExport: adminProcedure.input(z.object({
    dateFrom: z.number(),
    dateTo: z.number(),
  })).mutation(async ({ input }) => {
    const drizzle = await getDb();
    if (!drizzle) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const rows = await drizzle.select().from(payments)
      .where(and(
        eq(payments.status, "paid"),
        sql`UNIX_TIMESTAMP(paidDate)*1000 >= ${input.dateFrom}`,
        sql`UNIX_TIMESTAMP(paidDate)*1000 <= ${input.dateTo}`
      ));
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g,'');
    const timeStr = today.toTimeString().slice(0,8).replace(/:/g,'');
    const lines = rows.map((p, i) => `\n    <E1BPFIITEM>\n      <ITEMNO_ACC>${String(i + 1).padStart(6, '0')}</ITEMNO_ACC>\n      <GL_ACCOUNT>0000400000</GL_ACCOUNT>\n      <AMOUNT>${Number(p.amount).toFixed(2)}</AMOUNT>\n      <CURRENCY>SAR</CURRENCY>\n      <BLINE_DATE>${p.paidDate ?? ''}</BLINE_DATE>\n      <ITEM_TEXT>${p.type} - ${p.receiptNumber ?? p.id}</ITEM_TEXT>\n    </E1BPFIITEM>`).join('');
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<IDOC BEGIN="1">\n  <EDI_DC40 SEGMENT="1">\n    <TABNAM>EDI_DC40</TABNAM>\n    <MANDT>100</MANDT>\n    <IDOCTYP>FIDCCP02</IDOCTYP>\n    <MESTYP>FIDCC2</MESTYP>\n    <SNDPRT>LS</SNDPRT>\n    <SNDPRN>TAKAMOL</SNDPRN>\n    <RCVPRT>LS</RCVPRT>\n    <RCVPRN>SAP_ERP</RCVPRN>\n    <CREDAT>${dateStr}</CREDAT>\n    <CRETIM>${timeStr}</CRETIM>\n  </EDI_DC40>\n  <E1BPFIHDR SEGMENT="1">\n    <COMP_CODE>1000</COMP_CODE>\n    <DOC_DATE>${today.toISOString().split('T')[0]}</DOC_DATE>\n    <PSTNG_DATE>${today.toISOString().split('T')[0]}</PSTNG_DATE>\n    <DOC_TYPE>RV</DOC_TYPE>\n    <CURRENCY>SAR</CURRENCY>\n    <HEADER_TXT>\u062a\u0643\u0627\u0645\u0644 - \u062a\u0635\u062f\u064a\u0631 \u0625\u064a\u0631\u0627\u062f\u0627\u062a</HEADER_TXT>\n  </E1BPFIHDR>${lines}\n</IDOC>`;
    const key = `accounting/sap-${Date.now()}.xml`;
    const { url } = await storagePut(key, Buffer.from(xml, 'utf-8'), 'application/xml');
    await drizzle.insert(accountingExports).values({
      exportType: 'sap_xml', dateFrom: input.dateFrom, dateTo: input.dateTo,
      recordsCount: rows.length, fileUrl: url, fileKey: key, status: 'completed',
    });
    return { url, recordsCount: rows.length };
  }),

  vatReport: adminProcedure.input(z.object({
    year: z.number(),
    quarter: z.number().min(1).max(4),
  })).mutation(async ({ input }) => {
    const drizzle = await getDb();
    if (!drizzle) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const startMonth = (input.quarter - 1) * 3 + 1;
    const endMonth = startMonth + 2;
    const startDate = `${input.year}-${String(startMonth).padStart(2,'0')}-01`;
    const endDate = `${input.year}-${String(endMonth).padStart(2,'0')}-31`;
    const rows = await drizzle.select().from(payments)
      .where(and(eq(payments.status, 'paid'), sql`paidDate >= ${startDate}`, sql`paidDate <= ${endDate}`));
    const totalRevenue = rows.reduce((s, r) => s + Number(r.amount), 0);
    const vatRate = 0.15;
    const vatAmount = totalRevenue * vatRate;
    const netRevenue = totalRevenue - vatAmount;
    const header = '\u0631\u0642\u0645 \u0627\u0644\u0625\u064a\u0635\u0627\u0644,\u0646\u0648\u0639 \u0627\u0644\u062f\u0641\u0639,\u062a\u0627\u0631\u064a\u062e \u0627\u0644\u062f\u0641\u0639,\u0627\u0644\u0645\u0628\u0644\u063a \u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a,\u0636\u0631\u064a\u0628\u0629 \u0627\u0644\u0642\u064a\u0645\u0629 \u0627\u0644\u0645\u0636\u0627\u0641\u0629 (15%),\u0627\u0644\u0645\u0628\u0644\u063a \u0627\u0644\u0635\u0627\u0641\u064a';
    const csvRows = rows.map(r => [r.receiptNumber ?? r.id, r.type, r.paidDate ?? '', Number(r.amount).toFixed(2), (Number(r.amount)*vatRate).toFixed(2), (Number(r.amount)*(1-vatRate)).toFixed(2)].join(','));
    const summary = `\n\n\u0625\u062c\u0645\u0627\u0644\u064a \u0627\u0644\u0625\u064a\u0631\u0627\u062f\u0627\u062a,${totalRevenue.toFixed(2)}\n\u0636\u0631\u064a\u0628\u0629 \u0627\u0644\u0642\u064a\u0645\u0629 \u0627\u0644\u0645\u0636\u0627\u0641\u0629 \u0627\u0644\u0625\u062c\u0645\u0627\u0644\u064a\u0629,${vatAmount.toFixed(2)}\n\u0635\u0627\u0641\u064a \u0627\u0644\u0625\u064a\u0631\u0627\u062f\u0627\u062a,${netRevenue.toFixed(2)}`;
    const csv = '\uFEFF' + [header, ...csvRows, summary].join('\n');
    const key = `accounting/vat-${input.year}-Q${input.quarter}-${Date.now()}.csv`;
    const { url } = await storagePut(key, Buffer.from(csv, 'utf-8'), 'text/csv; charset=utf-8');
    await drizzle.insert(accountingExports).values({
      exportType: `vat_q${input.quarter}_${input.year}`, dateFrom: new Date(startDate).getTime(),
      dateTo: new Date(endDate).getTime(), recordsCount: rows.length, fileUrl: url, fileKey: key, status: 'completed',
    });
    return { url, recordsCount: rows.length, totalRevenue, vatAmount, netRevenue };
  }),

  arrearsHeatmap: adminProcedure.query(async () => {
    const drizzle = await getDb();
    if (!drizzle) return { matrix: [], months: [] };
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }
    const props = await drizzle.select({ id: properties.id, title: properties.titleAr }).from(properties);
    const overdueRows = await drizzle.select({
      propertyId: payments.propertyId,
      month: sql<string>`DATE_FORMAT(dueDate, '%Y-%m')`,
      count: sql<number>`COUNT(*)`,
      totalAmount: sql<number>`COALESCE(SUM(CAST(amount AS DECIMAL(15,2))),0)`,
    }).from(payments)
      .where(and(
        sql`status IN ('pending','overdue')`,
        sql`DATE_FORMAT(dueDate, '%Y-%m') >= ${months[0]}`,
        sql`DATE_FORMAT(dueDate, '%Y-%m') <= ${months[months.length - 1]}`
      ))
      .groupBy(payments.propertyId, sql`DATE_FORMAT(dueDate, '%Y-%m')`);
    const matrixMap: Record<number, Record<string, { count: number; amount: number }>> = {};
    for (const row of overdueRows) {
      if (!row.propertyId) continue;
      if (!matrixMap[row.propertyId]) matrixMap[row.propertyId] = {};
      matrixMap[row.propertyId][row.month] = { count: row.count, amount: Number(row.totalAmount) };
    }
    const matrix = props.map(p => ({
      propertyId: p.id, propertyTitle: p.title,
      months: months.map(m => matrixMap[p.id]?.[m] ?? { count: 0, amount: 0 }),
    }));
    return { matrix, months };
  }),

  cashflowForecast: adminProcedure.query(async () => {
    const drizzle = await getDb();
    if (!drizzle) return { forecast: [], historical: [] };
    const historical = await drizzle.select({
      month: sql<string>`DATE_FORMAT(paidDate, '%Y-%m')`,
      revenue: sql<number>`COALESCE(SUM(CAST(amount AS DECIMAL(15,2))),0)`,
    }).from(payments)
      .where(and(eq(payments.status, 'paid'), sql`paidDate IS NOT NULL`))
      .groupBy(sql`DATE_FORMAT(paidDate, '%Y-%m')`)
      .orderBy(sql`DATE_FORMAT(paidDate, '%Y-%m') DESC`)
      .limit(6);
    const activeContracts = await drizzle.select({
      rentAmount: contracts.rentAmount,
      rentPeriod: contracts.rentPeriod,
      endDate: contracts.endDate,
    }).from(contracts).where(eq(contracts.status, 'active' as any));
    const monthlyExpected = activeContracts.reduce((sum, c) => {
      const rent = Number(c.rentAmount ?? 0);
      const period = c.rentPeriod ?? 'annual';
      let monthly = 0;
      if (period === 'monthly') monthly = rent;
      else if (period === 'quarterly') monthly = rent / 3;
      else if (period === 'semi_annual') monthly = rent / 6;
      else monthly = rent / 12;
      return sum + monthly;
    }, 0);
    const forecast = [];
    for (let i = 1; i <= 3; i++) {
      const d = new Date(); d.setMonth(d.getMonth() + i);
      const monthStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const endingCount = activeContracts.filter(c => {
        if (!c.endDate) return false;
        return String(c.endDate) < `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
      }).length;
      const adjustedExpected = monthlyExpected * (1 - (endingCount / Math.max(activeContracts.length, 1)) * 0.1);
      forecast.push({ month: monthStr, expected: Math.round(adjustedExpected), contractsCount: activeContracts.length, endingContracts: endingCount });
    }
    return { forecast, historical: [...historical].reverse() };
  }),
});

// ─── BATCH 12: أرشفة العقود + الوحدات الشاغرة + النسخ الاحتياطي ─────────────
const batch12Router = router({

  // ─── أرشفة العقود ─────────────────────────────────────────────────────────
  archiveContract: adminProcedure
    .input(z.object({ contractId: z.number(), reason: z.string().optional() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      await db.update(contracts)
        .set({ archived: true, archivedAt: new Date(), archivedReason: input.reason ?? null })
        .where(eq(contracts.id, input.contractId));
      return { success: true };
    }),

  unarchiveContract: adminProcedure
    .input(z.object({ contractId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      await db.update(contracts)
        .set({ archived: false, archivedAt: null, archivedReason: null })
        .where(eq(contracts.id, input.contractId));
      return { success: true };
    }),

  getArchivedContracts: protectedProcedure
    .input(z.object({ page: z.number().default(1), limit: z.number().default(20) }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 20;
      const offset = (page - 1) * limit;
      const rows = await db
        .select({
          id: contracts.id,
          contractNumber: contracts.contractNumber,
          type: contracts.type,
          status: contracts.status,
          startDate: contracts.startDate,
          endDate: contracts.endDate,
          rentAmount: contracts.rentAmount,
          archivedAt: contracts.archivedAt,
          archivedReason: contracts.archivedReason,
          propertyId: contracts.propertyId,
          tenantId: contracts.tenantId,
        })
        .from(contracts)
        .where(eq(contracts.archived, true))
        .orderBy(desc(contracts.archivedAt))
        .limit(limit)
        .offset(offset);
      return { contracts: rows, page, limit };
    }),

  // ─── تقرير الوحدات الشاغرة ────────────────────────────────────────────────
  vacantUnitsReport: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
    const today = new Date();
    const vacantRows = await db
      .select({
        id: units.id,
        unitNumber: units.unitNumber,
        type: units.type,
        floor: units.floor,
        area: units.area,
        rentPrice: units.rentPrice,
        vacantSince: units.vacantSince,
        vacancyReason: units.vacancyReason,
        propertyId: units.propertyId,
        propertyTitle: properties.titleAr,
        propertyType: properties.type,
        district: properties.district,
      })
      .from(units)
      .leftJoin(properties, eq(units.propertyId, properties.id))
      .where(eq(units.status, 'vacant'))
      .orderBy(units.vacantSince);

    const enriched = vacantRows.map(u => {
      const vacantSince = u.vacantSince ? new Date(String(u.vacantSince)) : null;
      const vacancyDays = vacantSince
        ? Math.floor((today.getTime() - vacantSince.getTime()) / (1000 * 60 * 60 * 24))
        : null;
      const dailyLoss = u.rentPrice ? Number(u.rentPrice) / 365 : 0;
      const totalLoss = vacancyDays !== null ? Math.round(dailyLoss * vacancyDays) : 0;
      return { ...u, vacancyDays, dailyLoss: Math.round(dailyLoss), totalLoss };
    });

    const totalLoss = enriched.reduce((s, u) => s + u.totalLoss, 0);
    const avgDays = enriched.length
      ? Math.round(enriched.reduce((s, u) => s + (u.vacancyDays ?? 0), 0) / enriched.length)
      : 0;
    const byReason = enriched.reduce((acc, u) => {
      const r = u.vacancyReason ?? 'other';
      acc[r] = (acc[r] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { units: enriched, totalLoss, avgDays, byReason, count: enriched.length };
  }),

  // ─── النسخ الاحتياطي ──────────────────────────────────────────────────────
  exportBackup: adminProcedure.mutation(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
    const [allProperties, allContracts, allTenants, allPayments, allExpenses, allMaintenance] = await Promise.all([
      db.select().from(properties).limit(5000),
      db.select().from(contracts).limit(5000),
      db.select().from(tenants).limit(5000),
      db.select().from(payments).limit(10000),
      db.select({ id: expenses.id, amount: expenses.amount, category: expenses.category, expenseDate: expenses.expenseDate, propertyId: expenses.propertyId }).from(expenses).limit(5000),
      db.select({ id: maintenanceRequests.id, status: maintenanceRequests.status, priority: maintenanceRequests.priority, cost: maintenanceRequests.cost, propertyId: maintenanceRequests.propertyId }).from(maintenanceRequests).limit(5000),
    ]);
    const backup = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      counts: {
        properties: allProperties.length,
        contracts: allContracts.length,
        tenants: allTenants.length,
        payments: allPayments.length,
        expenses: allExpenses.length,
        maintenance: allMaintenance.length,
      },
      data: { properties: allProperties, contracts: allContracts, tenants: allTenants, payments: allPayments, expenses: allExpenses, maintenance: allMaintenance },
    };
    const json = JSON.stringify(backup, null, 2);
    const { url } = await storagePut(`backups/backup-${Date.now()}.json`, Buffer.from(json), 'application/json');
    await notifyOwner({
      title: '💾 نسخة احتياطية جديدة',
      content: `تم إنشاء نسخة احتياطية بتاريخ ${new Date().toLocaleDateString('ar-SA')}\n📊 الإحصائيات:\n- العقارات: ${allProperties.length}\n- العقود: ${allContracts.length}\n- المستأجرون: ${allTenants.length}\n- المدفوعات: ${allPayments.length}`,
    });
    return { url, counts: backup.counts, exportedAt: backup.exportedAt };
  }),

});

// ─── BATCH 13 ROUTER ─────────────────────────────────────────────────────────
export const batch13Router = router({

  // ─── FAL COMPLIANCE (تراخيص فال) ─────────────────────────────────────────
  falCompliance: router({
    list: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      return db.select().from(falLicenses).orderBy(desc(falLicenses.expiryDate));
    }),
    create: adminProcedure.input(z.object({
      licenseNumber: z.string().min(1),
      holderName: z.string().min(2),
      holderType: z.enum(['broker', 'company', 'agent']).default('broker'),
      brokerId: z.number().optional(),
      licenseType: z.string().default('وسيط عقاري'),
      issueDate: z.string().optional(),
      expiryDate: z.string(),
      notes: z.string().optional(),
    })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(falLicenses).values({
        ...input,
        issueDate: input.issueDate ? new Date(input.issueDate) : undefined,
        expiryDate: new Date(input.expiryDate),
        status: 'active',
      } as any);
      return { success: true };
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      data: z.object({
        licenseNumber: z.string().optional(),
        holderName: z.string().optional(),
        holderType: z.enum(['broker', 'company', 'agent']).optional(),
        licenseType: z.string().optional(),
        issueDate: z.string().optional(),
        expiryDate: z.string().optional(),
        status: z.enum(['active', 'expired', 'suspended', 'pending_renewal']).optional(),
        notes: z.string().optional(),
      }),
    })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const updateData: any = { ...input.data, updatedAt: new Date() };
      if (input.data.expiryDate) updateData.expiryDate = new Date(input.data.expiryDate);
      if (input.data.issueDate) updateData.issueDate = new Date(input.data.issueDate);
      await db.update(falLicenses).set(updateData).where(eq(falLicenses.id, input.id));
      return { success: true };
    }),
    delete: protectedProcedure.input(z.number()).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(falLicenses).where(eq(falLicenses.id, input));
      return { success: true };
    }),
    checkExpiring: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const all = await db.select().from(falLicenses);
      const now = new Date();
      const expiring30: typeof all = [];
      const expiring7: typeof all = [];
      const expired: typeof all = [];
      for (const lic of all) {
        const expiry = new Date(String(lic.expiryDate));
        const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLeft < 0) expired.push(lic);
        else if (daysLeft <= 7) expiring7.push(lic);
        else if (daysLeft <= 30) expiring30.push(lic);
      }
      return { expiring30, expiring7, expired };
    }),
  }),

  // ─── APPROVALS (الموافقات الداخلية) ────────────────────────────────────────
  approvals: router({
    list: protectedProcedure.input(z.object({
      status: z.enum(['pending', 'approved', 'rejected', 'cancelled', 'all']).default('all'),
      requestType: z.enum(['maintenance', 'expense', 'contract', 'transfer', 'other', 'all']).default('all'),
    }).optional()).query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db.select().from(approvals).orderBy(desc(approvals.createdAt));
      return rows.filter(r => {
        if (input?.status && input.status !== 'all' && r.status !== input.status) return false;
        if (input?.requestType && input.requestType !== 'all' && r.requestType !== input.requestType) return false;
        return true;
      });
    }),
    create: protectedProcedure.input(z.object({
      requestType: z.enum(['maintenance', 'expense', 'contract', 'transfer', 'other']),
      referenceId: z.number().optional(),
      referenceType: z.string().optional(),
      title: z.string().min(2),
      description: z.string().optional(),
      amount: z.string().optional(),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
    })).mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(approvals).values({
        ...input,
        requestedBy: ctx.user.name ?? ctx.user.email ?? 'مستخدم',
        status: 'pending',
      } as any);
      await notifyOwner({
        title: `⚠️ طلب موافقة جديد: ${input.title}`,
        content: `النوع: ${input.requestType}\nالأولوية: ${input.priority}\nالمبلغ: ${input.amount ?? 'غير محدد'}\n${input.description ?? ''}`,
      });
      return { success: true };
    }),
    approve: protectedProcedure.input(z.number()).mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(approvals).set({
        status: 'approved',
        approvedBy: ctx.user.name ?? ctx.user.email ?? 'مدير',
        approvedAt: new Date(),
        updatedAt: new Date(),
      } as any).where(eq(approvals.id, input));
      return { success: true };
    }),
    reject: protectedProcedure.input(z.object({
      id: z.number(),
      reason: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.update(approvals).set({
        status: 'rejected',
        rejectedBy: ctx.user.name ?? ctx.user.email ?? 'مدير',
        rejectedAt: new Date(),
        rejectionReason: input.reason,
        updatedAt: new Date(),
      } as any).where(eq(approvals.id, input.id));
      return { success: true };
    }),
    stats: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const all = await db.select().from(approvals);
      return {
        total: all.length,
        pending: all.filter(a => a.status === 'pending').length,
        approved: all.filter(a => a.status === 'approved').length,
        rejected: all.filter(a => a.status === 'rejected').length,
        urgent: all.filter(a => a.priority === 'urgent' && a.status === 'pending').length,
      };
    }),
  }),

  // ─── YEARLY COMPARISON (مقارنة سنوية) ────────────────────────────────────
  yearlyComparison: protectedProcedure.input(z.object({
    year: z.number().optional(),
  }).optional()).query(async ({ input }) => {
    const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const currentYear = input?.year ?? new Date().getFullYear();
    const prevYear = currentYear - 1;
    // جلب المدفوعات للسنتين
    const allPayments = await db.select().from(payments);
    const currentYearPayments = allPayments.filter(p => {
      const d = p.createdAt ? new Date(p.createdAt) : null;
      return d && d.getFullYear() === currentYear && p.status === 'paid';
    });
    const prevYearPayments = allPayments.filter(p => {
      const d = p.createdAt ? new Date(p.createdAt) : null;
      return d && d.getFullYear() === prevYear && p.status === 'paid';
    });
    // تجميع شهري
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const monthlyData = months.map(month => {
      const curMonthPayments = currentYearPayments.filter(p => new Date(p.createdAt!).getMonth() + 1 === month);
      const prevMonthPayments = prevYearPayments.filter(p => new Date(p.createdAt!).getMonth() + 1 === month);
      const curRevenue = curMonthPayments.reduce((s, p) => s + Number(p.amount ?? 0), 0);
      const prevRevenue = prevMonthPayments.reduce((s, p) => s + Number(p.amount ?? 0), 0);
      return { month, curRevenue, prevRevenue, change: curRevenue - prevRevenue, changePercent: prevRevenue > 0 ? ((curRevenue - prevRevenue) / prevRevenue * 100).toFixed(1) : null };
    });
    // إجماليات
    const curTotal = currentYearPayments.reduce((s, p) => s + Number(p.amount ?? 0), 0);
    const prevTotal = prevYearPayments.reduce((s, p) => s + Number(p.amount ?? 0), 0);
    // جلب العقارات مع إيراداتها
    const allProperties = await db.select().from(properties);
    const propertyStats = allProperties.map(prop => {
      const curPropPayments = currentYearPayments.filter(p => p.propertyId === prop.id);
      const prevPropPayments = prevYearPayments.filter(p => p.propertyId === prop.id);
      const curRev = curPropPayments.reduce((s, p) => s + Number(p.amount ?? 0), 0);
      const prevRev = prevPropPayments.reduce((s, p) => s + Number(p.amount ?? 0), 0);
      return { id: prop.id, title: prop.titleAr, curRevenue: curRev, prevRevenue: prevRev, change: curRev - prevRev };
    }).filter(p => p.curRevenue > 0 || p.prevRevenue > 0);
    return { currentYear, prevYear, monthlyData, curTotal, prevTotal, totalChange: curTotal - prevTotal, totalChangePercent: prevTotal > 0 ? ((curTotal - prevTotal) / prevTotal * 100).toFixed(1) : null, propertyStats };
  }),

  // ─── GEO STATS (إحصائيات جغرافية) ────────────────────────────────────────
  geoStats: protectedProcedure.query(async () => {
    const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const allProperties = await db.select().from(properties);
    const allPayments = await db.select().from(payments);
    // تجميع حسب الحي
    const districtMap: Record<string, { count: number; revenue: number; vacant: number; rented: number; lat: number | null; lng: number | null }> = {};
    for (const prop of allProperties) {
      const district = prop.district ?? 'غير محدد';
      if (!districtMap[district]) districtMap[district] = { count: 0, revenue: 0, vacant: 0, rented: 0, lat: null, lng: null };
      districtMap[district].count++;
      if (prop.status === 'available') districtMap[district].vacant++;
      if (prop.status === 'rented') districtMap[district].rented++;
      if (prop.latitude && !districtMap[district].lat) {
        districtMap[district].lat = Number(prop.latitude);
        districtMap[district].lng = Number(prop.longitude);
      }
    }
    // إضافة الإيرادات
    for (const payment of allPayments) {
      if (payment.status !== 'paid' || !payment.propertyId) continue;
      const prop = allProperties.find(p => p.id === payment.propertyId);
      if (!prop) continue;
      const district = prop.district ?? 'غير محدد';
      if (districtMap[district]) districtMap[district].revenue += Number(payment.amount ?? 0);
    }
    // تحويل لمصفوفة
    const districts = Object.entries(districtMap).map(([name, stats]) => ({ name, ...stats })).sort((a, b) => b.revenue - a.revenue);
    // العقارات مع إحداثيات
    const propertiesWithCoords = allProperties
      .filter(p => p.latitude && p.longitude)
      .map(p => ({
        id: p.id, title: p.titleAr, district: p.district, status: p.status, type: p.type,
        lat: Number(p.latitude), lng: Number(p.longitude),
        price: Number(p.price ?? 0),
      }));
    return { districts, propertiesWithCoords, totalProperties: allProperties.length };
  }),

  // ─── OWNER MONTHLY REPORT (تقرير المالك الشهري) ──────────────────────────
  ownerMonthlyReport: protectedProcedure.input(z.object({
    ownerId: z.number().optional(),
    month: z.number().min(1).max(12).optional(),
    year: z.number().optional(),
  }).optional()).query(async ({ input }) => {
    const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const now = new Date();
    const targetMonth = input?.month ?? now.getMonth() + 1;
    const targetYear = input?.year ?? now.getFullYear();
    // جلب العقارات
    const allProperties = await db.select().from(properties);
    const ownerProperties = input?.ownerId ? allProperties.filter(p => p.ownerId === input.ownerId) : allProperties;
    const propIds = ownerProperties.map(p => p.id);
    // جلب المدفوعات للشهر
    const allPayments = await db.select().from(payments);
    const monthPayments = allPayments.filter(p => {
      const d = p.createdAt ? new Date(p.createdAt) : null;
      return d && d.getFullYear() === targetYear && d.getMonth() + 1 === targetMonth && p.status === 'paid' && propIds.includes(p.propertyId ?? 0);
    });
    // جلب المصروفات
    const allExpenses = await db.select().from(expenses);
    const monthExpenses = allExpenses.filter(e => {
      const d = e.createdAt ? new Date(e.createdAt) : null;
      return d && d.getFullYear() === targetYear && d.getMonth() + 1 === targetMonth && propIds.includes(e.propertyId ?? 0);
    });
    const totalRevenue = monthPayments.reduce((s, p) => s + Number(p.amount ?? 0), 0);
    const totalExpenses = monthExpenses.reduce((s, e) => s + Number(e.amount ?? 0), 0);
    const netIncome = totalRevenue - totalExpenses;
    const vacantCount = ownerProperties.filter(p => p.status === 'available').length;
    const rentedCount = ownerProperties.filter(p => p.status === 'rented').length;
    return {
      month: targetMonth, year: targetYear,
      totalProperties: ownerProperties.length, rentedCount, vacantCount,
      totalRevenue, totalExpenses, netIncome,
      paymentsCount: monthPayments.length,
      expensesCount: monthExpenses.length,
      propertyBreakdown: ownerProperties.map(prop => ({
        id: prop.id, title: prop.titleAr, status: prop.status,
        revenue: monthPayments.filter(p => p.propertyId === prop.id).reduce((s, p) => s + Number(p.amount ?? 0), 0),
        expenses: monthExpenses.filter(e => e.propertyId === prop.id).reduce((s, e) => s + Number(e.amount ?? 0), 0),
      })),
    };
  }),

  sendOwnerMonthlyReport: protectedProcedure.input(z.object({
    ownerId: z.number().optional(),
    month: z.number().min(1).max(12).optional(),
    year: z.number().optional(),
  }).optional()).mutation(async ({ input }) => {
    const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const now = new Date();
    const targetMonth = input?.month ?? now.getMonth() + 1;
    const targetYear = input?.year ?? now.getFullYear();
    const allProperties = await db.select().from(properties);
    const ownerProperties = input?.ownerId ? allProperties.filter(p => p.ownerId === input.ownerId) : allProperties;
    const propIds = ownerProperties.map(p => p.id);
    const allPayments = await db.select().from(payments);
    const monthPayments = allPayments.filter(p => {
      const d = p.createdAt ? new Date(p.createdAt) : null;
      return d && d.getFullYear() === targetYear && d.getMonth() + 1 === targetMonth && p.status === 'paid' && propIds.includes(p.propertyId ?? 0);
    });
    const allExpenses = await db.select().from(expenses);
    const monthExpenses = allExpenses.filter(e => {
      const d = e.createdAt ? new Date(e.createdAt) : null;
      return d && d.getFullYear() === targetYear && d.getMonth() + 1 === targetMonth && propIds.includes(e.propertyId ?? 0);
    });
    const totalRevenue = monthPayments.reduce((s, p) => s + Number(p.amount ?? 0), 0);
    const totalExpenses = monthExpenses.reduce((s, e) => s + Number(e.amount ?? 0), 0);
    const netIncome = totalRevenue - totalExpenses;
    const vacantCount = ownerProperties.filter(p => p.status === 'available').length;
    const monthNames = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
    await notifyOwner({
      title: `📊 تقرير شهر ${monthNames[targetMonth - 1]} ${targetYear}`,
      content: `🏢 إجمالي العقارات: ${ownerProperties.length}\n✅ مؤجرة: ${ownerProperties.length - vacantCount} | 🔴 شاغرة: ${vacantCount}\n\n💰 الإيرادات: ${totalRevenue.toLocaleString('ar-SA')} ر.س\n💸 المصروفات: ${totalExpenses.toLocaleString('ar-SA')} ر.س\n📊 الصافي: ${netIncome.toLocaleString('ar-SA')} ر.س`,
    });
    return { success: true, totalRevenue, totalExpenses, netIncome };
  }),

});

// ─── BATCH 14: Invoices, Reservations, Email, Backup, Tenant Analysis ──────
export const batch14Router = router({

  // ─── INVOICES (ZATCA) ────────────────────────────────────────────────────
  invoices: router({
    list: protectedProcedure.input(z.object({
      status: z.string().optional(),
      tenantId: z.number().optional(),
      propertyId: z.number().optional(),
      limit: z.number().default(50),
    }).optional()).query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const conditions = [];
      if (input?.status) conditions.push(eq(invoices.status, input.status as any));
      if (input?.tenantId) conditions.push(eq(invoices.tenantId, input.tenantId));
      if (input?.propertyId) conditions.push(eq(invoices.propertyId, input.propertyId));
      const query = conditions.length > 0 ? db.select().from(invoices).where(and(...conditions)).orderBy(desc(invoices.createdAt)).limit(input?.limit ?? 50) : db.select().from(invoices).orderBy(desc(invoices.createdAt)).limit(input?.limit ?? 50);
      return query;
    }),

    create: protectedProcedure.input(z.object({
      contractId: z.number().optional(),
      tenantId: z.number().optional(),
      propertyId: z.number().optional(),
      amount: z.string(),
      vatRate: z.number().default(15),
      issueDate: z.number(),
      dueDate: z.number(),
      description: z.string().optional(),
      notes: z.string().optional(),
    })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const amount = parseFloat(input.amount);
      const vatAmount = (amount * input.vatRate) / 100;
      const totalAmount = amount + vatAmount;
      // Generate ZATCA QR code (TLV encoded base64)
      const sellerName = 'تكامل لإدارة الأملاك';
      const vatNumber = '300000000000003';
      const invoiceDate = new Date(input.issueDate).toISOString();
      const tlv = Buffer.from(`\x01${String.fromCharCode(sellerName.length)}${sellerName}\x02${String.fromCharCode(vatNumber.length)}${vatNumber}\x03${String.fromCharCode(invoiceDate.length)}${invoiceDate}\x04${String.fromCharCode(totalAmount.toFixed(2).length)}${totalAmount.toFixed(2)}\x05${String.fromCharCode(vatAmount.toFixed(2).length)}${vatAmount.toFixed(2)}`).toString('base64');
      const invoiceNumber = `INV-${Date.now()}`;
      const now = Date.now();
      await db.insert(invoices).values({
        invoiceNumber,
        contractId: input.contractId,
        tenantId: input.tenantId,
        propertyId: input.propertyId,
        amount: input.amount,
        vatAmount: vatAmount.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        issueDate: input.issueDate,
        dueDate: input.dueDate,
        status: 'issued',
        description: input.description,
        qrCode: tlv,
        zatcaUuid: nanoid(),
        notes: input.notes,
        createdAt: now,
        updatedAt: now,
      });
      return { success: true, invoiceNumber, qrCode: tlv };
    }),

    updateStatus: protectedProcedure.input(z.object({
      id: z.number(),
      status: z.enum(['draft','issued','paid','cancelled','overdue']),
      paidDate: z.number().optional(),
    })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      await db.update(invoices).set({ status: input.status, paidDate: input.paidDate, updatedAt: Date.now() }).where(eq(invoices.id, input.id));
      return { success: true };
    }),

    delete: protectedProcedure.input(z.number()).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      await db.delete(invoices).where(eq(invoices.id, input));
      return { success: true };
    }),

    stats: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const all = await db.select().from(invoices);
      const total = all.length;
      const paid = all.filter(i => i.status === 'paid').length;
      const overdue = all.filter(i => i.status === 'overdue').length;
      const totalAmount = all.reduce((s, i) => s + parseFloat(i.totalAmount || '0'), 0);
      const paidAmount = all.filter(i => i.status === 'paid').reduce((s, i) => s + parseFloat(i.totalAmount || '0'), 0);
      return { total, paid, overdue, pending: total - paid - overdue, totalAmount, paidAmount, unpaidAmount: totalAmount - paidAmount };
    }),
  }),

  // ─── UNIT RESERVATIONS ────────────────────────────────────────────────────
  reservations: router({
    list: protectedProcedure.input(z.object({
      status: z.string().optional(),
      propertyId: z.number().optional(),
    }).optional()).query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const conditions = [];
      if (input?.status) conditions.push(eq(unitReservations.status, input.status as any));
      if (input?.propertyId) conditions.push(eq(unitReservations.propertyId, input.propertyId));
      const query = conditions.length > 0 ? db.select().from(unitReservations).where(and(...conditions)).orderBy(desc(unitReservations.createdAt)) : db.select().from(unitReservations).orderBy(desc(unitReservations.createdAt));
      return query;
    }),

    create: protectedProcedure.input(z.object({
      unitId: z.number(),
      propertyId: z.number(),
      applicantName: z.string().min(2),
      applicantPhone: z.string().min(9),
      applicantEmail: z.string().email().optional(),
      applicantIdNumber: z.string().optional(),
      desiredStartDate: z.number(),
      desiredDurationMonths: z.number().default(12),
      depositAmount: z.string().default('0'),
      notes: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const now = Date.now();
      await db.insert(unitReservations).values({
        ...input,
        handledBy: ctx.user.id,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      });
      await notifyOwner({
        title: '🏠 حجز مسبق جديد',
        content: `طلب حجز جديد من: ${input.applicantName}\nالهاتف: ${input.applicantPhone}\nتاريخ البدء المطلوب: ${new Date(input.desiredStartDate).toLocaleDateString('ar-SA')}\nالمدة: ${input.desiredDurationMonths} شهر`,
      });
      return { success: true };
    }),

    updateStatus: protectedProcedure.input(z.object({
      id: z.number(),
      status: z.enum(['pending','confirmed','cancelled','converted']),
      cancellationReason: z.string().optional(),
    })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const now = Date.now();
      const updates: Record<string, unknown> = { status: input.status, updatedAt: now };
      if (input.status === 'confirmed') updates.confirmedAt = now;
      if (input.status === 'cancelled') { updates.cancelledAt = now; updates.cancellationReason = input.cancellationReason; }
      await db.update(unitReservations).set(updates as any).where(eq(unitReservations.id, input.id));
      return { success: true };
    }),

    markDepositPaid: protectedProcedure.input(z.number()).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      await db.update(unitReservations).set({ depositPaid: true, depositPaidDate: Date.now(), updatedAt: Date.now() }).where(eq(unitReservations.id, input));
      return { success: true };
    }),

    stats: protectedProcedure.query(async () => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const all = await db.select().from(unitReservations);
      return {
        total: all.length,
        pending: all.filter(r => r.status === 'pending').length,
        confirmed: all.filter(r => r.status === 'confirmed').length,
        cancelled: all.filter(r => r.status === 'cancelled').length,
        converted: all.filter(r => r.status === 'converted').length,
        depositsPaid: all.filter(r => r.depositPaid).length,
      };
    }),
  }),

  // ─── EMAIL NOTIFICATIONS ──────────────────────────────────────────────────
  emailSettings: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const [settings] = await db.select().from(emailNotificationSettings).where(eq(emailNotificationSettings.userId, ctx.user.id));
      return settings || null;
    }),

    upsert: protectedProcedure.input(z.object({
      notifyContractExpiry: z.boolean().optional(),
      notifyPaymentReminder: z.boolean().optional(),
      notifyPaymentReceived: z.boolean().optional(),
      notifyMaintenanceUpdate: z.boolean().optional(),
      notifyNewReservation: z.boolean().optional(),
      expiryDaysBefore: z.number().optional(),
      paymentReminderDaysBefore: z.number().optional(),
      emailAddress: z.string().email().optional(),
    })).mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const now = Date.now();
      const existing = await db.select().from(emailNotificationSettings).where(eq(emailNotificationSettings.userId, ctx.user.id));
      if (existing.length > 0) {
        await db.update(emailNotificationSettings).set({ ...input, updatedAt: now }).where(eq(emailNotificationSettings.userId, ctx.user.id));
      } else {
        await db.insert(emailNotificationSettings).values({ ...input, userId: ctx.user.id, createdAt: now, updatedAt: now });
      }
      return { success: true };
    }),

    log: protectedProcedure.input(z.object({ limit: z.number().default(50) }).optional()).query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      return db.select().from(emailNotificationLog).orderBy(desc(emailNotificationLog.createdAt)).limit(input?.limit ?? 50);
    }),

    sendTest: protectedProcedure.input(z.object({ email: z.string().email(), type: z.string() })).mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });
      const now = Date.now();
      const subjects: Record<string, string> = {
        contract_expiry: '⚠️ تنبيه: اقتراب انتهاء عقد إيجار',
        payment_reminder: '💰 تذكير: موعد سداد الإيجار',
        payment_received: '✅ تأكيد: تم استلام الدفعة',
        maintenance_update: '🔧 تحديث: طلب صيانة',
        new_reservation: '🏠 جديد: طلب حجز مسبق',
      };
      const subject = subjects[input.type] || 'إشعار من تكامل';
      await db.insert(emailNotificationLog).values({
        recipientEmail: input.email,
        subject,
        body: `هذا إشعار تجريبي من منصة تكامل لإدارة الأملاك. النوع: ${input.type}`,
        notificationType: input.type,
        status: 'sent',
        sentAt: now,
        createdAt: now,
      });
      return { success: true, message: `تم تسجيل الإشعار التجريبي لـ ${input.email}` };
    }),
  }),

  // ─── TENANT ANALYSIS ──────────────────────────────────────────────────────
  tenantAnalysis: router({
    list: protectedProcedure.query(async () => {
      const allTenants = await getTenants({});
      const allPayments = await getPayments({});
      const allContracts = await getContracts({});
      return allTenants.map(tenant => {
        const tenantPayments = allPayments.filter((p: any) => p.tenantId === tenant.id || allContracts.find((c: any) => c.tenantId === tenant.id && c.id === p.contractId));
        const totalPayments = tenantPayments.length;
        const onTimePayments = tenantPayments.filter((p: any) => !p.lateDays || p.lateDays === 0).length;
        const latePayments = tenantPayments.filter((p: any) => p.lateDays && p.lateDays > 0);
        const avgDelay = latePayments.length > 0 ? Math.round(latePayments.reduce((s: number, p: any) => s + (p.lateDays || 0), 0) / latePayments.length) : 0;
        const commitmentRate = totalPayments > 0 ? Math.round((onTimePayments / totalPayments) * 100) : 100;
        const reliabilityScore = Math.min(100, Math.max(0, commitmentRate - (avgDelay * 2)));
        const grade = reliabilityScore >= 90 ? 'ممتاز' : reliabilityScore >= 75 ? 'جيد جداً' : reliabilityScore >= 60 ? 'جيد' : reliabilityScore >= 40 ? 'مقبول' : 'ضعيف';
        return {
          id: tenant.id,
          name: tenant.name,
          phone: tenant.phone,
          totalPayments,
          onTimePayments,
          latePayments: latePayments.length,
          avgDelay,
          commitmentRate,
          reliabilityScore,
          grade,
          overallRating: tenant.overallRating,
        };
      });
    }),
  }),

  // ─── PROPERTY TAX ─────────────────────────────────────────────────────────
  propertyTax: router({
    report: protectedProcedure.input(z.object({ year: z.number().default(new Date().getFullYear()) })).query(async ({ input }) => {
      const allProperties = await getProperties({});
      const allContracts = await getContracts({ status: 'active' });
      const taxRate = 0.025; // 2.5% ضريبة عقارية سنوية
      return allProperties.map(property => {
        const activeContracts = allContracts.filter((c: any) => c.propertyId === property.id);
        const annualRent = activeContracts.reduce((s: number, c: any) => {
          const rent = parseFloat(c.rentAmount || '0');
          const multiplier = c.rentPeriod === 'monthly' ? 12 : c.rentPeriod === 'quarterly' ? 4 : c.rentPeriod === 'semi_annual' ? 2 : 1;
          return s + (rent * multiplier);
        }, 0);
        const propertyValue = parseFloat(property.price || '0');
        const taxableValue = Math.max(annualRent * 10, propertyValue);
        const annualTax = taxableValue * taxRate;
        const quarterlyTax = annualTax / 4;
        return {
          propertyId: property.id,
          propertyTitle: property.titleAr,
          district: property.district,
          propertyValue,
          annualRent,
          taxableValue,
          annualTax,
          quarterlyTax,
          year: input.year,
          status: annualTax > 0 ? 'مستحق' : 'معفى',
        };
      });
    }),

    exportCSV: protectedProcedure.input(z.number().default(new Date().getFullYear())).mutation(async ({ input }) => {
      const allProperties = await getProperties({});
      const allContracts = await getContracts({ status: 'active' });
      const taxRate = 0.025;
      const rows = allProperties.map(property => {
        const activeContracts = allContracts.filter((c: any) => c.propertyId === property.id);
        const annualRent = activeContracts.reduce((s: number, c: any) => s + parseFloat(c.rentAmount || '0') * (c.rentPeriod === 'monthly' ? 12 : 1), 0);
        const propertyValue = parseFloat(property.price || '0');
        const taxableValue = Math.max(annualRent * 10, propertyValue);
        const annualTax = taxableValue * taxRate;
        return `${property.titleAr},${property.district || ''},${propertyValue},${annualRent},${taxableValue},${annualTax.toFixed(2)}`;
      });
      const csv = `العقار,الحي,قيمة العقار,الإيجار السنوي,الوعاء الضريبي,الضريبة السنوية (2.5%)\n${rows.join('\n')}`;
      return { csv, year: input };
    }),
  }),

  // ─── BACKUP ───────────────────────────────────────────────────────────────
  backup: router({
    exportNow: adminProcedure.mutation(async ({ ctx }) => {
      const [allProperties, allTenants, allContracts, allPayments, allExpenses] = await Promise.all([
        getProperties({}),
        getTenants({}),
        getContracts({}),
        getPayments({}),
        getExpenses({}),
      ]);
      const backupData = {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        properties: allProperties,
        tenants: allTenants,
        contracts: allContracts,
        payments: allPayments,
        expenses: allExpenses,
      };
      const jsonStr = JSON.stringify(backupData, null, 2);
      const buffer = Buffer.from(jsonStr, 'utf-8');
      const fileName = `backup-${new Date().toISOString().split('T')[0]}.json`;
      const { url } = await storagePut(`backups/${fileName}`, buffer, 'application/json');
      await notifyOwner({
        title: '💾 نسخة احتياطية جديدة',
        content: `تم إنشاء نسخة احتياطية بتاريخ ${new Date().toLocaleDateString('ar-SA')}\nالحجم: ${Math.round(buffer.length / 1024)} KB\nرابط التنزيل: ${url}`,
      });
      return { success: true, url, fileName, size: buffer.length, recordCount: { properties: allProperties.length, tenants: allTenants.length, contracts: allContracts.length, payments: allPayments.length } };
    }),
  }),

});

// ─── User Management Router (Super Admin only) ───────────────────────────────
const userManagementRouter = router({
  list: superAdminProcedure.input(z.object({
    role: z.string().optional(),
    search: z.string().optional(),
    limit: z.number().optional(),
    offset: z.number().optional(),
  }).optional()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return [];
    const { eq: eqFn, like: likeFn, and: andFn, or: orFn, desc: descFn } = await import("drizzle-orm");
    const { users: usersTable } = await import("../drizzle/schema");
    const conditions = [];
    if (input?.role) conditions.push(eqFn(usersTable.role, input.role as any));
    if (input?.search) conditions.push(orFn(
      likeFn(usersTable.name, `%${input.search}%`),
      likeFn(usersTable.email, `%${input.search}%`)
    ));
    const q = db.select().from(usersTable).orderBy(descFn(usersTable.createdAt))
      .limit(input?.limit ?? 50).offset(input?.offset ?? 0);
    return conditions.length ? q.where(andFn(...conditions)) : q;
  }),
  updateRole: superAdminProcedure.input(z.object({
    userId: z.number(),
    role: z.enum(["user", "admin", "super_admin", "owner", "broker"]),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const { users: usersTable } = await import("../drizzle/schema");
    await db.update(usersTable).set({ role: input.role }).where(eq(usersTable.id, input.userId));
    return { success: true };
  }),
  delete: superAdminProcedure.input(z.number()).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const { users: usersTable } = await import("../drizzle/schema");
    await db.delete(usersTable).where(eq(usersTable.id, input));
    return { success: true };
  }),
  stats: superAdminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { total: 0, byRole: {} };
    const { users: usersTable } = await import("../drizzle/schema");
    const all = await db.select().from(usersTable);
    const byRole: Record<string, number> = {};
    for (const u of all) { byRole[u.role] = (byRole[u.role] ?? 0) + 1; }
    return { total: all.length, byRole };
  }),
});

// Merge all routers
export const mergedRouter = router({
  ...appRouter._def.record,
  ...batch10Router._def.record,
  ...batch11Router._def.record,
  ...batch12Router._def.record,
  ...batch13Router._def.record,
  ...batch14Router._def.record,
  userManagement: userManagementRouter,
  vouchers: vouchersRouter,
  plans: plansRouter,
  companies: companiesRouter,
  subscriptions: subscriptionsRouter,
});
export type AppRouter = typeof mergedRouter;
export type Batch10Router = typeof batch10Router;
