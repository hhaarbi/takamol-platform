import { TRPCError } from "@trpc/server";
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
  getOwners, getOwnerById, getOwnerByUserId, createOwner, updateOwner,
  getBrokers, getBrokerById, getBrokerByUserId, createBroker, updateBroker,
  getProperties, getPropertyById, createProperty, updateProperty, deleteProperty, incrementPropertyView,
  getVacantProperties, getPendingApprovalProperties,
  getUnitsByProperty, getAllUnits, getUnitById, createUnit, updateUnit, deleteUnit, getVacantUnits,
  getTenants, getTenantById, createTenant, updateTenant, rateTenant,
  getContracts, getContractById, createContract, updateContract, getExpiringContracts, renewContract,
  getPayments, getPaymentById, createPayment, updatePayment, getOverduePayments,
  getMonthlyCollectionSchedule, generateReceiptNumber,
  getExpenses, createExpense, updateExpense,
  getMaintenanceRequests, getMaintenanceById, createMaintenanceRequest, updateMaintenanceRequest,
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
  getPropertyROI, getSmartAlerts,
} from "./db";

// ─── Role guards ──────────────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  return next({ ctx });
});
const ownerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "owner" && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
  return next({ ctx });
});
const brokerProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "broker" && ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN" });
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
      .query(({ input }) => getOwners(input ?? {})),
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
  }),

  // ─── BROKERS ───────────────────────────────────────────────────────────────
  brokers: router({
    list: adminProcedure.input(z.object({ isActive: z.boolean().optional() }).optional())
      .query(({ input }) => getBrokers(input ?? {})),
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
    }).optional()).query(({ input }) => getProperties(input ?? {})),
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
      .query(({ input }) => getTenants(input ?? {})),
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
  }),

  // ─── CONTRACTS ─────────────────────────────────────────────────────────────
  contracts: router({
    list: adminProcedure.input(z.object({
      type: z.string().optional(), status: z.string().optional(),
      ownerId: z.number().optional(), tenantId: z.number().optional(), propertyId: z.number().optional(),
    }).optional()).query(({ input }) => getContracts(input ?? {})),
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
      await createContract(input as any);
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
  }),

  // ─── PAYMENTS ──────────────────────────────────────────────────────────────
  payments: router({
    list: adminProcedure.input(z.object({
      status: z.string().optional(), ownerId: z.number().optional(), tenantId: z.number().optional(),
      propertyId: z.number().optional(), contractId: z.number().optional(), type: z.string().optional(),
      fromDate: z.string().optional(), toDate: z.string().optional(),
    }).optional()).query(({ input }) => getPayments(input ?? {})),
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
    })).mutation(async ({ input }) => {
      const receiptNumber = await generateReceiptNumber();
      await updatePayment(input.id, {
        status: "paid",
        paidDate: (input.paidDate ?? new Date().toISOString().split("T")[0]) as any,
        paymentMethod: input.paymentMethod,
        referenceNumber: input.referenceNumber,
        receiptNumber,
      });
      await logActivity({ action: "payment_collected", entityType: "payment", entityId: input.id, description: `تم تحصيل دفعة - إيصال: ${receiptNumber}` });
      return { success: true, receiptNumber };
    }),
    escalate: adminProcedure.input(z.object({ id: z.number(), level: z.number() }))
      .mutation(async ({ input }) => {
        await updatePayment(input.id, { escalationLevel: input.level } as any);
        await logActivity({ action: "payment_escalated", entityType: "payment", entityId: input.id, description: `تم تصعيد المتأخرة لمستوى ${input.level}` });
        return { success: true };
      }),
  }),

  // ─── EXPENSES ──────────────────────────────────────────────────────────────
  expenses: router({
    list: adminProcedure.input(z.object({
      propertyId: z.number().optional(), ownerId: z.number().optional(), category: z.string().optional(),
      fromDate: z.string().optional(), toDate: z.string().optional(),
    }).optional()).query(({ input }) => getExpenses(input ?? {})),
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
  }),

  // ─── MAINTENANCE ───────────────────────────────────────────────────────────
  maintenance: router({
    list: adminProcedure.input(z.object({
      propertyId: z.number().optional(), unitId: z.number().optional(),
      status: z.string().optional(), priority: z.string().optional(), tenantId: z.number().optional(),
    }).optional()).query(({ input }) => getMaintenanceRequests(input ?? {})),
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
    summary: adminProcedure.input(z.number().optional()).query(({ input }) => getFinancialSummary(input)),
    dashboardStats: adminProcedure.query(() => getDashboardStats()),
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
    kpis: protectedProcedure.query(() => getKPIs()),
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
  }),

  // ─── SMART ALERTS (التنبيهات الذكية) ──────────────────────────────────────────────
  smartAlerts: router({
    get: adminProcedure.query(() => getSmartAlerts()),
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
});

export type AppRouter = typeof appRouter;
