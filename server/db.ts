import { and, desc, eq, like, lte, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  propertyOwners, InsertPropertyOwner,
  brokers, InsertBroker,
  properties, InsertProperty,
  units, InsertUnit,
  tenants, InsertTenant,
  contracts, InsertContract,
  payments, InsertPayment,
  expenses, InsertExpense,
  maintenanceRequests, InsertMaintenanceRequest,
  ownerStatements,
  brokerCommissions,
  leads, InsertLead,
  chatSessions, chatMessages,
  notifications,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── USERS ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  for (const field of textFields) {
    const value = user[field];
    if (value === undefined) continue;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  }
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// ─── PROPERTY OWNERS ──────────────────────────────────────────────────────────
export async function getOwners(filters?: { isActive?: boolean }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.isActive !== undefined) conditions.push(eq(propertyOwners.isActive, filters.isActive));
  const q = db.select().from(propertyOwners).orderBy(desc(propertyOwners.createdAt));
  return conditions.length ? q.where(and(...conditions)) : q;
}

export async function getOwnerById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(propertyOwners).where(eq(propertyOwners.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getOwnerByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(propertyOwners).where(eq(propertyOwners.userId, userId)).limit(1);
  return result[0] ?? null;
}

export async function createOwner(data: InsertPropertyOwner) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(propertyOwners).values(data);
  return result;
}

export async function updateOwner(id: number, data: Partial<InsertPropertyOwner>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(propertyOwners).set(data).where(eq(propertyOwners.id, id));
}

// ─── BROKERS ──────────────────────────────────────────────────────────────────
export async function getBrokers(filters?: { isActive?: boolean }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.isActive !== undefined) conditions.push(eq(brokers.isActive, filters.isActive));
  const q = db.select().from(brokers).orderBy(desc(brokers.createdAt));
  return conditions.length ? q.where(and(...conditions)) : q;
}

export async function getBrokerById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(brokers).where(eq(brokers.id, id)).limit(1);
  return result[0] ?? null;
}

export async function getBrokerByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(brokers).where(eq(brokers.userId, userId)).limit(1);
  return result[0] ?? null;
}

export async function createBroker(data: InsertBroker) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(brokers).values(data);
  return result;
}

export async function updateBroker(id: number, data: Partial<InsertBroker>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(brokers).set(data).where(eq(brokers.id, id));
}

// ─── PROPERTIES ───────────────────────────────────────────────────────────────
export async function getProperties(filters?: {
  listingType?: string; status?: string; type?: string; ownerId?: number;
  brokerId?: number; source?: string; search?: string; limit?: number; offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.listingType) conditions.push(eq(properties.listingType, filters.listingType as any));
  if (filters?.status) conditions.push(eq(properties.status, filters.status as any));
  if (filters?.type) conditions.push(eq(properties.type, filters.type as any));
  if (filters?.ownerId) conditions.push(eq(properties.ownerId, filters.ownerId));
  if (filters?.brokerId) conditions.push(eq(properties.brokerId, filters.brokerId));
  if (filters?.source) conditions.push(eq(properties.source, filters.source as any));
  if (filters?.search) {
    conditions.push(or(
      like(properties.titleAr, `%${filters.search}%`),
      like(properties.city, `%${filters.search}%`),
      like(properties.district, `%${filters.search}%`)
    ));
  }
  const q = db.select().from(properties)
    .orderBy(desc(properties.isFeatured), desc(properties.createdAt))
    .limit(filters?.limit ?? 50)
    .offset(filters?.offset ?? 0);
  return conditions.length ? q.where(and(...conditions)) : q;
}

export async function getPropertyById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(properties).where(eq(properties.id, id)).limit(1);
  return result[0];
}

export async function createProperty(data: InsertProperty) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(properties).values(data);
}

export async function updateProperty(id: number, data: Partial<InsertProperty>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(properties).set(data).where(eq(properties.id, id));
}

export async function deleteProperty(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(properties).where(eq(properties.id, id));
}

export async function incrementPropertyView(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(properties).set({ viewCount: sql`${properties.viewCount} + 1` }).where(eq(properties.id, id));
}

// ─── UNITS ────────────────────────────────────────────────────────────────────
export async function getUnitsByProperty(propertyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(units).where(eq(units.propertyId, propertyId)).orderBy(units.unitNumber);
}

export async function getUnitById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(units).where(eq(units.id, id)).limit(1);
  return result[0] ?? null;
}

export async function createUnit(data: InsertUnit) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(units).values(data);
}

export async function updateUnit(id: number, data: Partial<InsertUnit>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(units).set(data).where(eq(units.id, id));
}

export async function deleteUnit(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(units).where(eq(units.id, id));
}

// ─── TENANTS ──────────────────────────────────────────────────────────────────
export async function getTenants(filters?: { isActive?: boolean; search?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.isActive !== undefined) conditions.push(eq(tenants.isActive, filters.isActive));
  if (filters?.search) {
    conditions.push(or(
      like(tenants.name, `%${filters.search}%`),
      like(tenants.phone, `%${filters.search}%`),
      like(tenants.nationalId, `%${filters.search}%`)
    ));
  }
  const q = db.select().from(tenants).orderBy(desc(tenants.createdAt));
  return conditions.length ? q.where(and(...conditions)) : q;
}

export async function getTenantById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
  return result[0] ?? null;
}

export async function createTenant(data: InsertTenant) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(tenants).values(data);
}

export async function updateTenant(id: number, data: Partial<InsertTenant>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(tenants).set(data).where(eq(tenants.id, id));
}

// ─── CONTRACTS ────────────────────────────────────────────────────────────────
export async function getContracts(filters?: {
  type?: string; status?: string; ownerId?: number; tenantId?: number; propertyId?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.type) conditions.push(eq(contracts.type, filters.type as any));
  if (filters?.status) conditions.push(eq(contracts.status, filters.status as any));
  if (filters?.ownerId) conditions.push(eq(contracts.ownerId, filters.ownerId));
  if (filters?.tenantId) conditions.push(eq(contracts.tenantId, filters.tenantId));
  if (filters?.propertyId) conditions.push(eq(contracts.propertyId, filters.propertyId));
  const q = db.select().from(contracts).orderBy(desc(contracts.createdAt));
  return conditions.length ? q.where(and(...conditions)) : q;
}

export async function getContractById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(contracts).where(eq(contracts.id, id)).limit(1);
  return result[0] ?? null;
}

export async function createContract(data: InsertContract) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(contracts).values(data);
}

export async function updateContract(id: number, data: Partial<InsertContract>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(contracts).set(data).where(eq(contracts.id, id));
}

// ─── PAYMENTS ─────────────────────────────────────────────────────────────────
export async function getPayments(filters?: {
  status?: string; ownerId?: number; tenantId?: number; propertyId?: number;
  contractId?: number; type?: string;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.status) conditions.push(eq(payments.status, filters.status as any));
  if (filters?.ownerId) conditions.push(eq(payments.ownerId, filters.ownerId));
  if (filters?.tenantId) conditions.push(eq(payments.tenantId, filters.tenantId));
  if (filters?.propertyId) conditions.push(eq(payments.propertyId, filters.propertyId));
  if (filters?.contractId) conditions.push(eq(payments.contractId, filters.contractId));
  if (filters?.type) conditions.push(eq(payments.type, filters.type as any));
  const q = db.select().from(payments).orderBy(desc(payments.dueDate));
  return conditions.length ? q.where(and(...conditions)) : q;
}

export async function getPaymentById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
  return result[0] ?? null;
}

export async function createPayment(data: InsertPayment) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(payments).values(data);
}

export async function updatePayment(id: number, data: Partial<InsertPayment>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(payments).set(data).where(eq(payments.id, id));
}

export async function getOverduePayments() {
  const db = await getDb();
  if (!db) return [];
  const today = new Date().toISOString().split("T")[0];
  return db.select().from(payments)
    .where(and(eq(payments.status, "pending"), lte(payments.dueDate, today as any)))
    .orderBy(payments.dueDate);
}

// ─── EXPENSES ─────────────────────────────────────────────────────────────────
export async function getExpenses(filters?: {
  propertyId?: number; ownerId?: number; category?: string;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.propertyId) conditions.push(eq(expenses.propertyId, filters.propertyId));
  if (filters?.ownerId) conditions.push(eq(expenses.ownerId, filters.ownerId));
  if (filters?.category) conditions.push(eq(expenses.category, filters.category as any));
  const q = db.select().from(expenses).orderBy(desc(expenses.expenseDate));
  return conditions.length ? q.where(and(...conditions)) : q;
}

export async function createExpense(data: InsertExpense) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(expenses).values(data);
}

export async function updateExpense(id: number, data: Partial<InsertExpense>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(expenses).set(data).where(eq(expenses.id, id));
}

// ─── MAINTENANCE ──────────────────────────────────────────────────────────────
export async function getMaintenanceRequests(filters?: {
  propertyId?: number; status?: string; priority?: string;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.propertyId) conditions.push(eq(maintenanceRequests.propertyId, filters.propertyId));
  if (filters?.status) conditions.push(eq(maintenanceRequests.status, filters.status as any));
  if (filters?.priority) conditions.push(eq(maintenanceRequests.priority, filters.priority as any));
  const q = db.select().from(maintenanceRequests).orderBy(desc(maintenanceRequests.createdAt));
  return conditions.length ? q.where(and(...conditions)) : q;
}

export async function createMaintenanceRequest(data: InsertMaintenanceRequest) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(maintenanceRequests).values(data);
}

export async function updateMaintenanceRequest(id: number, data: Partial<InsertMaintenanceRequest>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(maintenanceRequests).set(data).where(eq(maintenanceRequests.id, id));
}

// ─── OWNER STATEMENTS ─────────────────────────────────────────────────────────
export async function getOwnerStatements(ownerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ownerStatements)
    .where(eq(ownerStatements.ownerId, ownerId))
    .orderBy(desc(ownerStatements.period));
}

export async function getAllOwnerStatements() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ownerStatements).orderBy(desc(ownerStatements.period));
}

// ─── BROKER COMMISSIONS ───────────────────────────────────────────────────────
export async function getBrokerCommissions(brokerId?: number) {
  const db = await getDb();
  if (!db) return [];
  const q = db.select().from(brokerCommissions).orderBy(desc(brokerCommissions.createdAt));
  return brokerId ? q.where(eq(brokerCommissions.brokerId, brokerId)) : q;
}

export async function createBrokerCommission(data: {
  brokerId: number; propertyId?: number; contractId?: number;
  transactionType: "sale" | "rent"; transactionAmount: string;
  commissionRate: string; commissionAmount: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(brokerCommissions).values(data);
}

export async function updateBrokerCommission(id: number, data: { status: "pending" | "paid" | "cancelled"; paidDate?: string }) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(brokerCommissions).set(data as any).where(eq(brokerCommissions.id, id));
}

// ─── FINANCIAL SUMMARY ────────────────────────────────────────────────────────
export async function getFinancialSummary(ownerId?: number) {
  const db = await getDb();
  if (!db) return { totalRevenue: 0, totalExpenses: 0, netProfit: 0, pendingPayments: 0 };
  const paymentCond = [eq(payments.status, "paid")];
  if (ownerId) paymentCond.push(eq(payments.ownerId, ownerId));
  const [paidResult] = await db.select({ total: sql<number>`COALESCE(SUM(CAST(amount AS DECIMAL(15,2))),0)` })
    .from(payments).where(and(...paymentCond));
  const expCond = [];
  if (ownerId) expCond.push(eq(expenses.ownerId, ownerId));
  const expQ = db.select({ total: sql<number>`COALESCE(SUM(CAST(amount AS DECIMAL(15,2))),0)` }).from(expenses);
  const [expResult] = expCond.length ? await expQ.where(and(...expCond)) : await expQ;
  const pendCond = [eq(payments.status, "pending")];
  if (ownerId) pendCond.push(eq(payments.ownerId, ownerId));
  const [pendResult] = await db.select({ total: sql<number>`COALESCE(SUM(CAST(amount AS DECIMAL(15,2))),0)` })
    .from(payments).where(and(...pendCond));
  const totalRevenue = Number(paidResult?.total ?? 0);
  const totalExp = Number(expResult?.total ?? 0);
  return { totalRevenue, totalExpenses: totalExp, netProfit: totalRevenue - totalExp, pendingPayments: Number(pendResult?.total ?? 0) };
}

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return { owners: 0, properties: 0, tenants: 0, activeContracts: 0, leads: 0, brokers: 0 };
  const [ownersC] = await db.select({ count: sql<number>`COUNT(*)` }).from(propertyOwners).where(eq(propertyOwners.isActive, true));
  const [propsC] = await db.select({ count: sql<number>`COUNT(*)` }).from(properties);
  const [tenantsC] = await db.select({ count: sql<number>`COUNT(*)` }).from(tenants).where(eq(tenants.isActive, true));
  const [contractsC] = await db.select({ count: sql<number>`COUNT(*)` }).from(contracts).where(eq(contracts.status, "active"));
  const [leadsC] = await db.select({ count: sql<number>`COUNT(*)` }).from(leads);
  const [brokersC] = await db.select({ count: sql<number>`COUNT(*)` }).from(brokers).where(eq(brokers.isActive, true));
  return {
    owners: Number(ownersC?.count ?? 0),
    properties: Number(propsC?.count ?? 0),
    tenants: Number(tenantsC?.count ?? 0),
    activeContracts: Number(contractsC?.count ?? 0),
    leads: Number(leadsC?.count ?? 0),
    brokers: Number(brokersC?.count ?? 0),
  };
}

// ─── LEADS ────────────────────────────────────────────────────────────────────
export async function createLead(data: InsertLead) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(leads).values(data);
}

export async function updateLead(id: number, data: Partial<InsertLead>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(leads).set(data).where(eq(leads.id, id));
}

export async function updateLeadBySession(sessionId: string, data: Partial<InsertLead>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(leads).set(data).where(eq(leads.sessionId, sessionId));
}

export async function getLeadBySession(sessionId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(leads).where(eq(leads.sessionId, sessionId)).limit(1);
  return result[0];
}

export async function getLeads(filters?: {
  status?: string; serviceType?: string; source?: string; search?: string; limit?: number; offset?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.status) conditions.push(eq(leads.status, filters.status as any));
  if (filters?.serviceType) conditions.push(eq(leads.serviceType, filters.serviceType as any));
  if (filters?.source) conditions.push(eq(leads.source, filters.source as any));
  if (filters?.search) {
    conditions.push(or(
      like(leads.name, `%${filters.search}%`),
      like(leads.phone, `%${filters.search}%`),
      like(leads.email, `%${filters.search}%`)
    ));
  }
  const q = db.select().from(leads).orderBy(desc(leads.createdAt))
    .limit(filters?.limit ?? 100).offset(filters?.offset ?? 0);
  return conditions.length ? q.where(and(...conditions)) : q;
}

export async function getLeadsCount() {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ count: sql<number>`count(*)` }).from(leads);
  return result[0]?.count ?? 0;
}

// ─── CHAT ─────────────────────────────────────────────────────────────────────
export async function getOrCreateChatSession(sessionId: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await db.select().from(chatSessions).where(eq(chatSessions.sessionId, sessionId)).limit(1);
  if (existing[0]) return existing[0];
  await db.insert(chatSessions).values({ sessionId });
  const created = await db.select().from(chatSessions).where(eq(chatSessions.sessionId, sessionId)).limit(1);
  return created[0];
}

export async function saveChatMessage(sessionId: string, role: "user" | "assistant", content: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(chatMessages).values({ sessionId, role, content });
}

export async function getChatHistory(sessionId: string, limit = 30) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(chatMessages.createdAt).limit(limit);
}

export async function getChatSessionsByLead(leadId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatSessions).where(eq(chatSessions.leadId, leadId));
}

export async function linkSessionToLead(sessionId: string, leadId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(chatSessions).set({ leadId }).where(eq(chatSessions.sessionId, sessionId));
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
export async function createNotification(data: {
  userId?: number; type: string; title: string; message: string; metadata?: Record<string, unknown>;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values(data);
}

export async function getNotifications(userId: number, unreadOnly = false) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(notifications.userId, userId)];
  if (unreadOnly) conditions.push(eq(notifications.isRead, false));
  return db.select().from(notifications).where(and(...conditions)).orderBy(desc(notifications.createdAt)).limit(50);
}

export async function markNotificationRead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}
