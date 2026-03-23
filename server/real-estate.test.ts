import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db module
vi.mock("./db", () => ({
  getProperties: vi.fn().mockResolvedValue([]),
  getPropertyById: vi.fn().mockResolvedValue(null),
  incrementPropertyView: vi.fn().mockResolvedValue(undefined),
  getLeads: vi.fn().mockResolvedValue([]),
  getLeadsCount: vi.fn().mockResolvedValue(0),
  updateLead: vi.fn().mockResolvedValue(undefined),
  getChatHistory: vi.fn().mockResolvedValue([]),
  getOrCreateChatSession: vi.fn().mockResolvedValue({ id: "test-session" }),
  saveChatMessage: vi.fn().mockResolvedValue(undefined),
  createLead: vi.fn().mockResolvedValue(undefined),
  updateLeadBySession: vi.fn().mockResolvedValue(undefined),
  getLeadBySession: vi.fn().mockResolvedValue(null),
  linkSessionToLead: vi.fn().mockResolvedValue(undefined),
  createProperty: vi.fn().mockResolvedValue(undefined),
  updateProperty: vi.fn().mockResolvedValue(undefined),
  deleteProperty: vi.fn().mockResolvedValue(undefined),
  getOwners: vi.fn().mockResolvedValue([]),
  createOwner: vi.fn().mockResolvedValue(undefined),
  getTenants: vi.fn().mockResolvedValue([]),
  createTenant: vi.fn().mockResolvedValue(undefined),
  getContracts: vi.fn().mockResolvedValue([]),
  createContract: vi.fn().mockResolvedValue(undefined),
  getPayments: vi.fn().mockResolvedValue([]),
  createPayment: vi.fn().mockResolvedValue(undefined),
  getOverduePayments: vi.fn().mockResolvedValue([]),
  getPaymentSchedule: vi.fn().mockResolvedValue([]),
  getExpenses: vi.fn().mockResolvedValue([]),
  createExpense: vi.fn().mockResolvedValue(undefined),
  getMaintenanceRequests: vi.fn().mockResolvedValue([]),
  createMaintenanceRequest: vi.fn().mockResolvedValue(undefined),
  updateMaintenanceRequest: vi.fn().mockResolvedValue(undefined),
  getBrokers: vi.fn().mockResolvedValue([]),
  createBroker: vi.fn().mockResolvedValue(undefined),
  getBrokerCommissions: vi.fn().mockResolvedValue([]),
  createBrokerCommission: vi.fn().mockResolvedValue(undefined),
  getBrokerByUserId: vi.fn().mockResolvedValue(null),
  getFinancialSummary: vi.fn().mockResolvedValue({ totalRevenue: 0, totalExpenses: 0, netProfit: 0, pendingPayments: 0, overduePayments: 0 }),
  getOwnerFinancialReport: vi.fn().mockResolvedValue({ totalRevenue: 0, totalExpenses: 0, netProfit: 0, pendingPayments: 0, overduePayments: 0 }),
  getOwnerFinancials: vi.fn().mockResolvedValue({ totalRevenue: 0, totalExpenses: 0, netProfit: 0, pendingPayments: 0, overduePayments: 0 }),
  getTasks: vi.fn().mockResolvedValue([]),
  createTask: vi.fn().mockResolvedValue(undefined),
  updateTask: vi.fn().mockResolvedValue(undefined),
  getActivityLog: vi.fn().mockResolvedValue([]),
  logActivity: vi.fn().mockResolvedValue(undefined),
  globalSearch: vi.fn().mockResolvedValue({ properties: [], owners: [], tenants: [], leads: [] }),
  getMonthlyReport: vi.fn().mockResolvedValue({ revenue: 0, expenses: 0, newContracts: 0, newLeads: 0 }),
  getPerformanceReport: vi.fn().mockResolvedValue({ occupancyRate: 0, collectionRate: 0, maintenanceRate: 0 }),
  getNotifications: vi.fn().mockResolvedValue([]),
  markNotificationRead: vi.fn().mockResolvedValue(undefined),
  getUnits: vi.fn().mockResolvedValue([]),
  createUnit: vi.fn().mockResolvedValue(undefined),
  getDocuments: vi.fn().mockResolvedValue([]),
  createDocument: vi.fn().mockResolvedValue(undefined),
  getHandoverRecords: vi.fn().mockResolvedValue([]),
  createHandoverRecord: vi.fn().mockResolvedValue(undefined),
  getComplianceRecords: vi.fn().mockResolvedValue([]),
  createComplianceRecord: vi.fn().mockResolvedValue(undefined),
  getMessageTemplates: vi.fn().mockResolvedValue([]),
  createMessageTemplate: vi.fn().mockResolvedValue(undefined),
  getScheduledMaintenance: vi.fn().mockResolvedValue([]),
  createScheduledMaintenance: vi.fn().mockResolvedValue(undefined),
  getCollectionSchedule: vi.fn().mockResolvedValue([]),
  getOwnerByUserId: vi.fn().mockResolvedValue(null),
  getDb: vi.fn().mockResolvedValue(null),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "مرحباً! كيف يمكنني مساعدتك؟" } }],
  }),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://cdn.example.com/test.jpg", key: "test.jpg" }),
}));

function createPublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createAdminCtx(): TrpcContext {
  return {
    user: {
      id: 1, openId: "admin-user", email: "admin@takamol.com", name: "Admin",
      loginMethod: "manus", role: "admin",
      createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

// ─── Auth ───
describe("auth.me", () => {
  it("returns null for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const user = await caller.auth.me();
    expect(user).toBeNull();
  });
  it("returns user for authenticated user", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const user = await caller.auth.me();
    expect(user).not.toBeNull();
    expect(user?.role).toBe("admin");
  });
});

// ─── Properties ───
describe("properties", () => {
  it("list returns empty array", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.properties.list({});
    expect(Array.isArray(result)).toBe(true);
  });
  it("list accepts listingType filter", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.properties.list({ listingType: "sale" });
    expect(Array.isArray(result)).toBe(true);
  });
  it("getById throws NOT_FOUND", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.properties.getById({ id: 9999 })).rejects.toThrow();
  });
});

// ─── Leads ───
describe("leads", () => {
  it("list requires admin", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.leads.list({})).rejects.toThrow();
  });
  it("list returns array for admin", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const result = await caller.leads.list({});
    expect(Array.isArray(result)).toBe(true);
  });
  it("count returns number", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const count = await caller.leads.count();
    expect(typeof count).toBe("number");
  });
});

// ─── Chat ───
describe("chat.sendMessage", () => {
  it("returns AI reply", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.chat.sendMessage({ sessionId: "test-123", message: "مرحباً" });
    expect(result).toHaveProperty("reply");
    expect(result.reply.length).toBeGreaterThan(0);
  });
  it("rejects empty messages", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(caller.chat.sendMessage({ sessionId: "test", message: "" })).rejects.toThrow();
  });
});

// ─── Router Structure ───
describe("Router Structure", () => {
  it("has all main routers registered", () => {
    expect(appRouter.properties).toBeDefined();
    expect(appRouter.owners).toBeDefined();
    expect(appRouter.tenants).toBeDefined();
    expect(appRouter.contracts).toBeDefined();
    expect(appRouter.payments).toBeDefined();
    expect(appRouter.expenses).toBeDefined();
    expect(appRouter.maintenance).toBeDefined();
    expect(appRouter.financial).toBeDefined();
    expect(appRouter.brokers).toBeDefined();
    expect(appRouter.leads).toBeDefined();
    expect(appRouter.chat).toBeDefined();
    expect(appRouter.notifications).toBeDefined();
    expect(appRouter.units).toBeDefined();
    expect(appRouter.tasks).toBeDefined();
    expect(appRouter.activity).toBeDefined();
    expect(appRouter.search).toBeDefined();
    expect(appRouter.documents).toBeDefined();
    expect(appRouter.handovers).toBeDefined();
    expect(appRouter.messageTemplates).toBeDefined();
    expect(appRouter.deposits).toBeDefined();
    expect(appRouter.notes).toBeDefined();
    expect(appRouter.ownerStatements).toBeDefined();
  });

  it("has CRUD operations on all entity routers", () => {
    // Properties
    expect(appRouter.properties.list).toBeDefined();
    expect(appRouter.properties.create).toBeDefined();
    expect(appRouter.properties.update).toBeDefined();
    // Owners
    expect(appRouter.owners.list).toBeDefined();
    expect(appRouter.owners.create).toBeDefined();
    // owners report integrated into financial
    // Tenants
    expect(appRouter.tenants.list).toBeDefined();
    expect(appRouter.tenants.create).toBeDefined();
    // Contracts
    expect(appRouter.contracts.list).toBeDefined();
    expect(appRouter.contracts.create).toBeDefined();
    // Payments
    expect(appRouter.payments.list).toBeDefined();
    expect(appRouter.payments.create).toBeDefined();
    expect(appRouter.payments.monthlySchedule).toBeDefined();
    // Expenses
    expect(appRouter.expenses.list).toBeDefined();
    expect(appRouter.expenses.create).toBeDefined();
    // Maintenance
    expect(appRouter.maintenance.list).toBeDefined();
    expect(appRouter.maintenance.create).toBeDefined();
    expect(appRouter.maintenance.update).toBeDefined();
    // Brokers
    expect(appRouter.brokers.list).toBeDefined();
    expect(appRouter.brokers.create).toBeDefined();
    expect(appRouter.brokers.commissions).toBeDefined();
    // Tasks
    expect(appRouter.tasks.list).toBeDefined();
    expect(appRouter.tasks.create).toBeDefined();
    expect(appRouter.tasks.update).toBeDefined();
    // Documents
    expect(appRouter.documents.list).toBeDefined();
    expect(appRouter.documents.upload).toBeDefined();
    // Handover
    expect(appRouter.handovers).toBeDefined();
    // Message Templates
    expect(appRouter.messageTemplates.list).toBeDefined();
    expect(appRouter.messageTemplates.create).toBeDefined();
    // Scheduled Maintenance
    expect(appRouter.maintenance.scheduled).toBeDefined();
  });

  it("has financial and reporting routers", () => {
    expect(appRouter.financial.summary).toBeDefined();
    expect(appRouter.financial.myFinancials).toBeDefined();
    expect(appRouter.financial.monthlyRevenue).toBeDefined();
    expect(appRouter.financial.monthlyExpenses).toBeDefined();
  });

  it("has search and activity routers", () => {
    expect(appRouter.search).toBeDefined();
    expect(appRouter.activity).toBeDefined();
  });
});
