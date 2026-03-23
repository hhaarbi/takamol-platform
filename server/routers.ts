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
  getUnitsByProperty, getUnitById, createUnit, updateUnit, deleteUnit,
  getTenants, getTenantById, createTenant, updateTenant,
  getContracts, getContractById, createContract, updateContract,
  getPayments, getPaymentById, createPayment, updatePayment, getOverduePayments,
  getExpenses, createExpense, updateExpense,
  getMaintenanceRequests, createMaintenanceRequest, updateMaintenanceRequest,
  getOwnerStatements, getAllOwnerStatements,
  getBrokerCommissions, createBrokerCommission, updateBrokerCommission,
  getFinancialSummary, getDashboardStats,
  getLeads, getLeadsCount, createLead, updateLead, getLeadBySession, updateLeadBySession, linkSessionToLead,
  getOrCreateChatSession, saveChatMessage, getChatHistory,
  getNotifications, markNotificationRead,
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

  // ─── AUTH ──────────────────────────────────────────────────────────────────
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
      name: z.string().min(2),
      phone: z.string().min(9),
      phone2: z.string().optional(),
      email: z.string().email().optional(),
      nationalId: z.string().optional(),
      bankName: z.string().optional(),
      bankIban: z.string().optional(),
      address: z.string().optional(),
      notes: z.string().optional(),
      managementFeeType: z.enum(["percentage", "fixed"]).default("percentage"),
      managementFeeValue: z.string().default("5.00"),
      hasPortalAccess: z.boolean().default(false),
    })).mutation(async ({ input }) => { await createOwner(input as any); return { success: true }; }),
    update: adminProcedure.input(z.object({
      id: z.number(),
      data: z.object({
        name: z.string().optional(), phone: z.string().optional(), phone2: z.string().optional(),
        email: z.string().optional(), nationalId: z.string().optional(), bankName: z.string().optional(),
        bankIban: z.string().optional(), address: z.string().optional(), notes: z.string().optional(),
        managementFeeType: z.enum(["percentage", "fixed"]).optional(),
        managementFeeValue: z.string().optional(), hasPortalAccess: z.boolean().optional(),
        isActive: z.boolean().optional(),
      }),
    })).mutation(async ({ input }) => { await updateOwner(input.id, input.data as any); return { success: true }; }),
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
      email: z.string().email().optional(), licenseNumber: z.string().optional(),
      commissionRates: z.record(z.string(), z.number()).optional(), notes: z.string().optional(),
      hasPortalAccess: z.boolean().default(false),
    })).mutation(async ({ input }) => { await createBroker(input as any); return { success: true }; }),
    update: adminProcedure.input(z.object({
      id: z.number(),
      data: z.object({
        name: z.string().optional(), phone: z.string().optional(), email: z.string().optional(),
        licenseNumber: z.string().optional(), commissionRates: z.record(z.string(), z.number()).optional(),
        notes: z.string().optional(), hasPortalAccess: z.boolean().optional(), isActive: z.boolean().optional(),
      }),
    })).mutation(async ({ input }) => { await updateBroker(input.id, input.data as any); return { success: true }; }),
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
    }).optional()).query(({ input }) => getProperties(input ?? {})),

    getById: publicProcedure.input(z.number()).query(async ({ input }) => {
      await incrementPropertyView(input);
      return getPropertyById(input);
    }),

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
    })).mutation(async ({ input }) => { await createProperty(input as any); return { success: true }; }),

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
      await createProperty({ ...input as any, brokerId: broker.id, source: "broker", status: "available", brokerCommissionRate: String(rate) });
      await notifyOwner({ title: `وسيط أضاف عقاراً جديداً`, content: `${broker.name} أضاف: ${input.titleAr} - العمولة: ${rate}%` });
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
      }),
    })).mutation(async ({ input }) => { await updateProperty(input.id, input.data as any); return { success: true }; }),

    delete: adminProcedure.input(z.number()).mutation(async ({ input }) => { await deleteProperty(input); return { success: true }; }),

    uploadImage: adminProcedure.input(z.object({
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
    })).mutation(async ({ input }) => { await createTenant(input as any); return { success: true }; }),
    update: adminProcedure.input(z.object({
      id: z.number(),
      data: z.object({
        name: z.string().optional(), phone: z.string().optional(), phone2: z.string().optional(),
        email: z.string().optional(), nationalId: z.string().optional(),
        nationality: z.string().optional(), occupation: z.string().optional(),
        emergencyContact: z.string().optional(), notes: z.string().optional(), isActive: z.boolean().optional(),
      }),
    })).mutation(async ({ input }) => { await updateTenant(input.id, input.data as any); return { success: true }; }),
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
    create: adminProcedure.input(z.object({
      contractNumber: z.string(), type: z.enum(["rent", "sale", "management"]),
      propertyId: z.number().optional(), unitId: z.number().optional(),
      tenantId: z.number().optional(), ownerId: z.number().optional(),
      rentAmount: z.string().optional(), rentPeriod: z.enum(["monthly", "quarterly", "semi_annual", "annual"]).optional(),
      startDate: z.string().optional(), endDate: z.string().optional(),
      depositAmount: z.string().optional(), salePrice: z.string().optional(),
      managementFeeType: z.enum(["percentage", "fixed"]).optional(),
      managementFeeValue: z.string().optional(), notes: z.string().optional(),
    })).mutation(async ({ input }) => { await createContract(input as any); return { success: true }; }),
    update: adminProcedure.input(z.object({
      id: z.number(),
      data: z.object({
        status: z.string().optional(), rentAmount: z.string().optional(),
        startDate: z.string().optional(), endDate: z.string().optional(), notes: z.string().optional(),
      }),
    })).mutation(async ({ input }) => { await updateContract(input.id, input.data as any); return { success: true }; }),
  }),

  // ─── PAYMENTS ──────────────────────────────────────────────────────────────
  payments: router({
    list: adminProcedure.input(z.object({
      status: z.string().optional(), ownerId: z.number().optional(), tenantId: z.number().optional(),
      propertyId: z.number().optional(), contractId: z.number().optional(), type: z.string().optional(),
    }).optional()).query(({ input }) => getPayments(input ?? {})),
    get: adminProcedure.input(z.number()).query(({ input }) => getPaymentById(input)),
    overdue: adminProcedure.query(() => getOverduePayments()),
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
      notes: z.string().optional(),
    })).mutation(async ({ input }) => { await createPayment(input as any); return { success: true }; }),
    update: adminProcedure.input(z.object({
      id: z.number(),
      data: z.object({
        status: z.string().optional(), paidDate: z.string().optional(),
        paymentMethod: z.string().optional(), referenceNumber: z.string().optional(),
        notes: z.string().optional(), receiptUrl: z.string().optional(),
      }),
    })).mutation(async ({ input }) => { await updatePayment(input.id, input.data as any); return { success: true }; }),
    markPaid: adminProcedure.input(z.object({
      id: z.number(), paymentMethod: z.enum(["bank_transfer", "cash", "check", "online"]),
      referenceNumber: z.string().optional(), paidDate: z.string().optional(),
    })).mutation(async ({ input }) => {
      await updatePayment(input.id, {
        status: "paid",
        paidDate: (input.paidDate ?? new Date().toISOString().split("T")[0]) as any,
        paymentMethod: input.paymentMethod,
        referenceNumber: input.referenceNumber,
      });
      return { success: true };
    }),
  }),

  // ─── EXPENSES ──────────────────────────────────────────────────────────────
  expenses: router({
    list: adminProcedure.input(z.object({
      propertyId: z.number().optional(), ownerId: z.number().optional(), category: z.string().optional(),
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
    })).mutation(async ({ input }) => { await createExpense(input as any); return { success: true }; }),
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
      propertyId: z.number().optional(), status: z.string().optional(), priority: z.string().optional(),
    }).optional()).query(({ input }) => getMaintenanceRequests(input ?? {})),
    create: adminProcedure.input(z.object({
      propertyId: z.number().optional(), unitId: z.number().optional(), tenantId: z.number().optional(),
      title: z.string(), description: z.string().optional(),
      priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
      assignedTo: z.string().optional(), cost: z.string().optional(), notes: z.string().optional(),
    })).mutation(async ({ input }) => { await createMaintenanceRequest(input as any); return { success: true }; }),
    update: adminProcedure.input(z.object({
      id: z.number(),
      data: z.object({
        status: z.string().optional(), assignedTo: z.string().optional(),
        cost: z.string().optional(), completedDate: z.string().optional(), notes: z.string().optional(),
      }),
    })).mutation(async ({ input }) => { await updateMaintenanceRequest(input.id, input.data as any); return { success: true }; }),
  }),

  // ─── FINANCIAL ─────────────────────────────────────────────────────────────
  financial: router({
    summary: adminProcedure.input(z.number().optional()).query(({ input }) => getFinancialSummary(input)),
    dashboardStats: adminProcedure.query(() => getDashboardStats()),
    allStatements: adminProcedure.query(() => getAllOwnerStatements()),
    ownerStatements: adminProcedure.input(z.number()).query(({ input }) => getOwnerStatements(input)),
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
            await notifyOwner({ title: "عميل جديد من الموقع", content: `👤 ${extracted.name || "غير محدد"} | 📱 ${extracted.phone || "غير محدد"} | 🎯 ${extracted.serviceType || "غير محدد"}` });
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
  }),
});

export type AppRouter = typeof appRouter;
