import { eq, and, or, like, desc, lte, gte, sql, asc, between, count as drizzleCount, isNull, ne, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
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
  scheduledMaintenance, InsertScheduledMaintenance,
  ownerStatements,
  brokerCommissions,
  deposits, InsertDeposit,
  unitHandovers, InsertUnitHandover,
  activityLog, InsertActivityLog,
  internalNotes, InsertInternalNote,
  messageTemplates, InsertMessageTemplate,
  sentMessages, InsertSentMessage,
  dailyTasks, InsertDailyTask,
  documents, InsertDocument,
  leads, InsertLead,
  chatSessions, chatMessages,
  notifications,
  contractors, InsertContractor,
  ownerTransfers, InsertOwnerTransfer,
  brokerReferrals, InsertBrokerReferral,
  systemSettings,
  propertyImages, InsertPropertyImage,
  tenantRatings, InsertTenantRating,
  clientNotes, InsertClientNote,
  marketPrices,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export function resetDb() { _db = null; }

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { 
      // Use mysql2 connection pool to avoid stale prepared statements after ALTER TABLE
      const pool = mysql.createPool({ uri: process.env.DATABASE_URL, waitForConnections: true, connectionLimit: 5 });
      _db = drizzle(pool as any);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error); _db = null;
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
  else if (user.openId === ENV.ownerOpenId) { values.role = "super_admin"; updateSet.role = "super_admin"; }
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
  return db.insert(propertyOwners).values(data);
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
  return db.insert(brokers).values(data);
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
  approvalStatus?: string; companyId?: number | null;
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
  if (filters?.approvalStatus) conditions.push(eq(properties.approvalStatus, filters.approvalStatus as any));
  if (filters?.companyId != null) conditions.push(eq(properties.companyId, filters.companyId));
  if (filters?.search) {
    conditions.push(or(
      like(properties.titleAr, `%${filters.search}%`),
      like(properties.city, `%${filters.search}%`),
      like(properties.district, `%${filters.search}%`)
    ));
  }
  const q = db.select().from(properties)
    .orderBy(desc(properties.isFeatured), desc(properties.createdAt))
    .limit(filters?.limit ?? 50).offset(filters?.offset ?? 0);
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

export async function getVacantProperties() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(properties)
    .where(or(eq(properties.status, "available"), eq(properties.status, "under_management")))
    .orderBy(properties.vacantSince);
}

export async function getPendingApprovalProperties() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(properties)
    .where(eq(properties.approvalStatus, "pending"))
    .orderBy(desc(properties.createdAt));
}

// ─── UNITS ────────────────────────────────────────────────────────────────────
export async function getUnitsByProperty(propertyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(units).where(eq(units.propertyId, propertyId)).orderBy(units.unitNumber);
}

export async function getAllUnits(filters?: { status?: string; propertyId?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.status) conditions.push(eq(units.status, filters.status as any));
  if (filters?.propertyId) conditions.push(eq(units.propertyId, filters.propertyId));
  const q = db.select().from(units).orderBy(units.propertyId, units.unitNumber);
  return conditions.length ? q.where(and(...conditions)) : q;
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

export async function getVacantUnits() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(units).where(eq(units.status, "vacant")).orderBy(units.vacantSince);
}

// ─── TENANTS ───────────────────────────────────────────────────────────────────
export async function getTenants(filters?: { isActive?: boolean; search?: string; limit?: number; offset?: number; companyId?: number | null }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.isActive !== undefined) conditions.push(eq(tenants.isActive, filters.isActive));
  if (filters?.companyId != null) conditions.push(eq(tenants.companyId, filters.companyId));
  if (filters?.search) {
    conditions.push(or(
      like(tenants.name, `%${filters.search}%`),
      like(tenants.phone, `%${filters.search}%`),
      like(tenants.nationalId, `%${filters.search}%`)
    ));
  }
  const q = db.select().from(tenants).orderBy(desc(tenants.createdAt))
    .limit(filters?.limit ?? 50).offset(filters?.offset ?? 0);
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

export async function rateTenant(id: number, ratings: { paymentRating: number; propertyRating: number; cooperationRating: number; ratingNotes?: string }) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const overall = ((ratings.paymentRating + ratings.propertyRating + ratings.cooperationRating) / 3).toFixed(2);
  await db.update(tenants).set({
    paymentRating: ratings.paymentRating,
    propertyRating: ratings.propertyRating,
    cooperationRating: ratings.cooperationRating,
    overallRating: overall,
    ratingNotes: ratings.ratingNotes ?? null,
  }).where(eq(tenants.id, id));
}

// ─── CONTRACTS ────────────────────────────────────────────────────────────────
export async function getContracts(filters?: {
  type?: string; status?: string; ownerId?: number; tenantId?: number; propertyId?: number;
  limit?: number; offset?: number; companyId?: number | null;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.type) conditions.push(eq(contracts.type, filters.type as any));
  if (filters?.status) conditions.push(eq(contracts.status, filters.status as any));
  if (filters?.ownerId) conditions.push(eq(contracts.ownerId, filters.ownerId));
  if (filters?.tenantId) conditions.push(eq(contracts.tenantId, filters.tenantId));
  if (filters?.propertyId) conditions.push(eq(contracts.propertyId, filters.propertyId));
  if (filters?.companyId != null) conditions.push(eq(contracts.companyId, filters.companyId));
  const q = db.select().from(contracts).orderBy(desc(contracts.createdAt))
    .limit(filters?.limit ?? 50).offset(filters?.offset ?? 0);
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

export async function getExpiringContracts(daysAhead: number) {
  const db = await getDb();
  if (!db) return [];
  const today = new Date();
  const futureDate = new Date(today);
  futureDate.setDate(futureDate.getDate() + daysAhead);
  const todayStr = today.toISOString().split("T")[0];
  const futureStr = futureDate.toISOString().split("T")[0];
  return db.select().from(contracts)
    .where(and(
      eq(contracts.status, "active"),
      gte(contracts.endDate, todayStr as any),
      lte(contracts.endDate, futureStr as any)
    ))
    .orderBy(contracts.endDate);
}

export async function renewContract(oldId: number, newData: InsertContract) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(contracts).set({ status: "renewed", renewalStatus: "accepted" }).where(eq(contracts.id, oldId));
  return db.insert(contracts).values({ ...newData, renewedFromId: oldId });
}

// ─── PAYMENTS ────────────────────────────────────────────────────────────────
export async function getPayments(filters?: {
  status?: string; ownerId?: number; tenantId?: number; propertyId?: number;
  contractId?: number; type?: string; fromDate?: string; toDate?: string;
  limit?: number; offset?: number; companyId?: number | null;
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
  if (filters?.fromDate) conditions.push(gte(payments.dueDate, filters.fromDate as any));
  if (filters?.toDate) conditions.push(lte(payments.dueDate, filters.toDate as any));
  if (filters?.companyId != null) conditions.push(eq(payments.companyId, filters.companyId));
  const q = db.select().from(payments).orderBy(desc(payments.dueDate))
    .limit(filters?.limit ?? 50).offset(filters?.offset ?? 0);
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
    .where(and(
      or(eq(payments.status, "pending"), eq(payments.status, "partial")),
      lte(payments.dueDate, today as any)
    ))
    .orderBy(payments.dueDate);
}

export async function getMonthlyCollectionSchedule(yearMonth: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(payments)
    .where(like(payments.dueDate, `${yearMonth}%` as any))
    .orderBy(payments.dueDate);
}

export async function generateReceiptNumber() {
  const db = await getDb();
  if (!db) return `REC-${Date.now()}`;
  const [result] = await db.select({ count: sql<number>`COUNT(*)` }).from(payments)
    .where(sql`receiptNumber IS NOT NULL`);
  const num = (Number(result?.count ?? 0) + 1).toString().padStart(6, "0");
  return `REC-${num}`;
}

// ─── EXPENSES ─────────────────────────────────────────────────────────────────
export async function getExpenses(filters?: {
  propertyId?: number; ownerId?: number; category?: string; fromDate?: string; toDate?: string; companyId?: number | null;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.propertyId) conditions.push(eq(expenses.propertyId, filters.propertyId));
  if (filters?.ownerId) conditions.push(eq(expenses.ownerId, filters.ownerId));
  if (filters?.category) conditions.push(eq(expenses.category, filters.category as any));
  if (filters?.fromDate) conditions.push(gte(expenses.expenseDate, filters.fromDate as any));
  if (filters?.toDate) conditions.push(lte(expenses.expenseDate, filters.toDate as any));
  if (filters?.companyId != null) conditions.push(eq(expenses.companyId, filters.companyId));
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
  propertyId?: number; unitId?: number; status?: string; priority?: string; tenantId?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.propertyId) conditions.push(eq(maintenanceRequests.propertyId, filters.propertyId));
  if (filters?.unitId) conditions.push(eq(maintenanceRequests.unitId, filters.unitId));
  if (filters?.status) conditions.push(eq(maintenanceRequests.status, filters.status as any));
  if (filters?.priority) conditions.push(eq(maintenanceRequests.priority, filters.priority as any));
  if (filters?.tenantId) conditions.push(eq(maintenanceRequests.tenantId, filters.tenantId));
  const q = db.select().from(maintenanceRequests).orderBy(desc(maintenanceRequests.createdAt));
  return conditions.length ? q.where(and(...conditions)) : q;
}

export async function getMaintenanceById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(maintenanceRequests).where(eq(maintenanceRequests.id, id)).limit(1);
  return result[0] ?? null;
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

export async function getPropertyMaintenanceHistory(propertyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(maintenanceRequests)
    .where(eq(maintenanceRequests.propertyId, propertyId))
    .orderBy(desc(maintenanceRequests.createdAt));
}

// ─── SCHEDULED MAINTENANCE ───────────────────────────────────────────────────
export async function getScheduledMaintenance(filters?: { propertyId?: number; isActive?: boolean }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.propertyId) conditions.push(eq(scheduledMaintenance.propertyId, filters.propertyId));
  if (filters?.isActive !== undefined) conditions.push(eq(scheduledMaintenance.isActive, filters.isActive));
  const q = db.select().from(scheduledMaintenance).orderBy(scheduledMaintenance.nextDue);
  return conditions.length ? q.where(and(...conditions)) : q;
}

export async function createScheduledMaintenance(data: InsertScheduledMaintenance) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(scheduledMaintenance).values(data);
}

export async function updateScheduledMaintenance(id: number, data: Partial<InsertScheduledMaintenance>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(scheduledMaintenance).set(data).where(eq(scheduledMaintenance.id, id));
}

export async function getDueScheduledMaintenance() {
  const db = await getDb();
  if (!db) return [];
  const today = new Date().toISOString().split("T")[0];
  return db.select().from(scheduledMaintenance)
    .where(and(eq(scheduledMaintenance.isActive, true), lte(scheduledMaintenance.nextDue, today as any)))
    .orderBy(scheduledMaintenance.nextDue);
}

// ─── DEPOSITS / GUARANTEES ───────────────────────────────────────────────────
export async function getDeposits(filters?: { contractId?: number; tenantId?: number; status?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.contractId) conditions.push(eq(deposits.contractId, filters.contractId));
  if (filters?.tenantId) conditions.push(eq(deposits.tenantId, filters.tenantId));
  if (filters?.status) conditions.push(eq(deposits.status, filters.status as any));
  const q = db.select().from(deposits).orderBy(desc(deposits.createdAt));
  return conditions.length ? q.where(and(...conditions)) : q;
}

export async function createDeposit(data: InsertDeposit) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(deposits).values(data);
}

export async function updateDeposit(id: number, data: Partial<InsertDeposit>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(deposits).set(data).where(eq(deposits.id, id));
}

// ─── UNIT HANDOVERS ──────────────────────────────────────────────────────────
export async function getHandovers(filters?: { unitId?: number; propertyId?: number; type?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.unitId) conditions.push(eq(unitHandovers.unitId, filters.unitId));
  if (filters?.propertyId) conditions.push(eq(unitHandovers.propertyId, filters.propertyId));
  if (filters?.type) conditions.push(eq(unitHandovers.type, filters.type as any));
  const q = db.select().from(unitHandovers).orderBy(desc(unitHandovers.handoverDate));
  return conditions.length ? q.where(and(...conditions)) : q;
}

export async function createHandover(data: InsertUnitHandover) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(unitHandovers).values(data);
}

export async function getHandoverById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(unitHandovers).where(eq(unitHandovers.id, id)).limit(1);
  return result[0] ?? null;
}

// ─── ACTIVITY LOG ─────────────────────────────────────────────────────────────
export async function logActivity(data: InsertActivityLog) {
  const db = await getDb();
  if (!db) return;
  await db.insert(activityLog).values(data);
}

export async function getActivityLog(filters?: {
  entityType?: string; entityId?: number; userId?: number; limit?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.entityType) conditions.push(eq(activityLog.entityType, filters.entityType));
  if (filters?.entityId) conditions.push(eq(activityLog.entityId, filters.entityId));
  if (filters?.userId) conditions.push(eq(activityLog.userId, filters.userId));
  const q = db.select().from(activityLog)
    .orderBy(desc(activityLog.createdAt))
    .limit(filters?.limit ?? 100);
  return conditions.length ? q.where(and(...conditions)) : q;
}

// ─── INTERNAL NOTES ──────────────────────────────────────────────────────────
export async function getNotes(entityType: string, entityId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(internalNotes)
    .where(and(eq(internalNotes.entityType, entityType as any), eq(internalNotes.entityId, entityId)))
    .orderBy(desc(internalNotes.isPinned), desc(internalNotes.createdAt));
}

export async function createNote(data: InsertInternalNote) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(internalNotes).values(data);
}

export async function updateNote(id: number, data: Partial<InsertInternalNote>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(internalNotes).set(data).where(eq(internalNotes.id, id));
}

export async function deleteNote(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(internalNotes).where(eq(internalNotes.id, id));
}

// ─── MESSAGE TEMPLATES ───────────────────────────────────────────────────────
export async function getMessageTemplates(category?: string) {
  const db = await getDb();
  if (!db) return [];
  const q = db.select().from(messageTemplates).orderBy(messageTemplates.category, messageTemplates.name);
  return category ? q.where(eq(messageTemplates.category, category as any)) : q;
}

export async function getMessageTemplateById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(messageTemplates).where(eq(messageTemplates.id, id)).limit(1);
  return result[0] ?? null;
}

export async function createMessageTemplate(data: InsertMessageTemplate) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(messageTemplates).values(data);
}

export async function updateMessageTemplate(id: number, data: Partial<InsertMessageTemplate>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(messageTemplates).set(data).where(eq(messageTemplates.id, id));
}

export async function deleteMessageTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(messageTemplates).where(eq(messageTemplates.id, id));
}

// ─── SENT MESSAGES ───────────────────────────────────────────────────────────
export async function createSentMessage(data: InsertSentMessage) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(sentMessages).values(data);
}

export async function getSentMessages(filters?: { recipientType?: string; recipientId?: number; limit?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.recipientType) conditions.push(eq(sentMessages.recipientType, filters.recipientType as any));
  if (filters?.recipientId) conditions.push(eq(sentMessages.recipientId, filters.recipientId));
  const q = db.select().from(sentMessages)
    .orderBy(desc(sentMessages.createdAt))
    .limit(filters?.limit ?? 100);
  return conditions.length ? q.where(and(...conditions)) : q;
}

// ─── DAILY TASKS ─────────────────────────────────────────────────────────────
export async function getDailyTasks(filters?: { status?: string; dueDate?: string; type?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.status) conditions.push(eq(dailyTasks.status, filters.status as any));
  if (filters?.dueDate) conditions.push(eq(dailyTasks.dueDate, filters.dueDate as any));
  if (filters?.type) conditions.push(eq(dailyTasks.type, filters.type as any));
  const q = db.select().from(dailyTasks).orderBy(
    sql`FIELD(priority, 'urgent', 'high', 'medium', 'low')`,
    dailyTasks.dueDate
  );
  return conditions.length ? q.where(and(...conditions)) : q;
}

export async function createDailyTask(data: InsertDailyTask) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(dailyTasks).values(data);
}

export async function updateDailyTask(id: number, data: Partial<InsertDailyTask>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(dailyTasks).set(data).where(eq(dailyTasks.id, id));
}

export async function getTodayTasks() {
  const db = await getDb();
  if (!db) return [];
  const today = new Date().toISOString().split("T")[0];
  return db.select().from(dailyTasks)
    .where(and(
      lte(dailyTasks.dueDate, today as any),
      ne(dailyTasks.status, "completed"),
      ne(dailyTasks.status, "dismissed")
    ))
    .orderBy(sql`FIELD(priority, 'urgent', 'high', 'medium', 'low')`, dailyTasks.dueDate);
}

// ─── DOCUMENTS ───────────────────────────────────────────────────────────────
export async function getDocuments(entityType: string, entityId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(documents)
    .where(and(eq(documents.entityType, entityType as any), eq(documents.entityId, entityId)))
    .orderBy(desc(documents.createdAt));
}

export async function createDocument(data: InsertDocument) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(documents).values(data);
}

export async function deleteDocument(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(documents).where(eq(documents.id, id));
}

// ─── OWNER STATEMENTS ────────────────────────────────────────────────────────
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

export async function createOwnerStatement(data: {
  ownerId: number; period: string; totalRentCollected: string;
  totalExpenses: string; managementFee: string; netAmount: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  return db.insert(ownerStatements).values(data);
}

export async function updateOwnerStatement(id: number, data: { status: "draft" | "sent" | "paid"; notes?: string }) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(ownerStatements).set(data as any).where(eq(ownerStatements.id, id));
}

// ─── BROKER COMMISSIONS ──────────────────────────────────────────────────────
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

// ─── FINANCIAL SUMMARY ───────────────────────────────────────────────────────
export async function getFinancialSummary(ownerId?: number) {
  const db = await getDb();
  if (!db) return { totalRevenue: 0, totalExpenses: 0, netProfit: 0, pendingPayments: 0, overduePayments: 0 };
  const paymentCond = [eq(payments.status, "paid")];
  if (ownerId) paymentCond.push(eq(payments.ownerId, ownerId));
  const [paidResult] = await db.select({ total: sql<number>`COALESCE(SUM(CAST(amount AS DECIMAL(15,2))),0)` })
    .from(payments).where(and(...paymentCond));
  const expCond: any[] = [];
  if (ownerId) expCond.push(eq(expenses.ownerId, ownerId));
  const expQ = db.select({ total: sql<number>`COALESCE(SUM(CAST(amount AS DECIMAL(15,2))),0)` }).from(expenses);
  const [expResult] = expCond.length ? await expQ.where(and(...expCond)) : await expQ;
  const pendCond = [eq(payments.status, "pending")];
  if (ownerId) pendCond.push(eq(payments.ownerId, ownerId));
  const [pendResult] = await db.select({ total: sql<number>`COALESCE(SUM(CAST(amount AS DECIMAL(15,2))),0)` })
    .from(payments).where(and(...pendCond));
  const today = new Date().toISOString().split("T")[0];
  const overdueCond = [or(eq(payments.status, "pending"), eq(payments.status, "partial")), lte(payments.dueDate, today as any)];
  if (ownerId) overdueCond.push(eq(payments.ownerId, ownerId));
  const [overdueResult] = await db.select({ total: sql<number>`COALESCE(SUM(CAST(amount AS DECIMAL(15,2))),0)` })
    .from(payments).where(and(...(overdueCond.filter(Boolean) as any)));
  const totalRevenue = Number(paidResult?.total ?? 0);
  const totalExp = Number(expResult?.total ?? 0);
  return {
    totalRevenue, totalExpenses: totalExp,
    netProfit: totalRevenue - totalExp,
    pendingPayments: Number(pendResult?.total ?? 0),
    overduePayments: Number(overdueResult?.total ?? 0),
  };
}

export async function getMonthlyRevenue(months: number = 12) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    month: sql<string>`DATE_FORMAT(paidDate, '%Y-%m')`,
    total: sql<number>`COALESCE(SUM(CAST(amount AS DECIMAL(15,2))),0)`,
  }).from(payments)
    .where(and(eq(payments.status, "paid"), sql`paidDate IS NOT NULL`))
    .groupBy(sql`DATE_FORMAT(paidDate, '%Y-%m')`)
    .orderBy(sql`DATE_FORMAT(paidDate, '%Y-%m')`)
    .limit(months);
}

export async function getMonthlyExpenses(months: number = 12) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    month: sql<string>`DATE_FORMAT(expenseDate, '%Y-%m')`,
    total: sql<number>`COALESCE(SUM(CAST(amount AS DECIMAL(15,2))),0)`,
    category: expenses.category,
  }).from(expenses)
    .groupBy(sql`DATE_FORMAT(expenseDate, '%Y-%m')`, expenses.category)
    .orderBy(sql`DATE_FORMAT(expenseDate, '%Y-%m')`)
    .limit(months * 8);
}

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return { owners: 0, properties: 0, tenants: 0, activeContracts: 0, leads: 0, brokers: 0, vacantUnits: 0, overduePayments: 0, pendingMaintenance: 0 };
  const [ownersC] = await db.select({ count: sql<number>`COUNT(*)` }).from(propertyOwners).where(eq(propertyOwners.isActive, true));
  const [propsC] = await db.select({ count: sql<number>`COUNT(*)` }).from(properties);
  const [tenantsC] = await db.select({ count: sql<number>`COUNT(*)` }).from(tenants).where(eq(tenants.isActive, true));
  const [contractsC] = await db.select({ count: sql<number>`COUNT(*)` }).from(contracts).where(eq(contracts.status, "active"));
  const [leadsC] = await db.select({ count: sql<number>`COUNT(*)` }).from(leads);
  const [brokersC] = await db.select({ count: sql<number>`COUNT(*)` }).from(brokers).where(eq(brokers.isActive, true));
  const [vacantC] = await db.select({ count: sql<number>`COUNT(*)` }).from(units).where(eq(units.status, "vacant"));
  const today = new Date().toISOString().split("T")[0];
  const [overdueC] = await db.select({ count: sql<number>`COUNT(*)` }).from(payments)
    .where(and(eq(payments.status, "pending"), lte(payments.dueDate, today as any)));
  const [maintC] = await db.select({ count: sql<number>`COUNT(*)` }).from(maintenanceRequests)
    .where(or(eq(maintenanceRequests.status, "open"), eq(maintenanceRequests.status, "in_progress")));
  return {
    owners: Number(ownersC?.count ?? 0),
    properties: Number(propsC?.count ?? 0),
    tenants: Number(tenantsC?.count ?? 0),
    activeContracts: Number(contractsC?.count ?? 0),
    leads: Number(leadsC?.count ?? 0),
    brokers: Number(brokersC?.count ?? 0),
    vacantUnits: Number(vacantC?.count ?? 0),
    overduePayments: Number(overdueC?.count ?? 0),
    pendingMaintenance: Number(maintC?.count ?? 0),
  };
}

// ─── GLOBAL SEARCH ───────────────────────────────────────────────────────────
export async function globalSearch(query: string) {
  const db = await getDb();
  if (!db) return { properties: [], tenants: [], owners: [], contracts: [], leads: [] };
  const term = `%${query}%`;
  const [propsR, tenantsR, ownersR, leadsR] = await Promise.all([
    db.select({ id: properties.id, titleAr: properties.titleAr, type: properties.type, city: properties.city })
      .from(properties).where(or(like(properties.titleAr, term), like(properties.district, term), like(properties.city, term))).limit(10),
    db.select({ id: tenants.id, name: tenants.name, phone: tenants.phone })
      .from(tenants).where(or(like(tenants.name, term), like(tenants.phone, term), like(tenants.nationalId, term))).limit(10),
    db.select({ id: propertyOwners.id, name: propertyOwners.name, phone: propertyOwners.phone })
      .from(propertyOwners).where(or(like(propertyOwners.name, term), like(propertyOwners.phone, term))).limit(10),
    db.select({ id: leads.id, name: leads.name, phone: leads.phone })
      .from(leads).where(or(like(leads.name, term), like(leads.phone, term))).limit(10),
  ]);
  return { properties: propsR, tenants: tenantsR, owners: ownersR, contracts: [], leads: leadsR };
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
    conditions.push(or(like(leads.name, `%${filters.search}%`), like(leads.phone, `%${filters.search}%`), like(leads.email, `%${filters.search}%`)));
  }
  const q = db.select().from(leads).orderBy(desc(leads.createdAt)).limit(filters?.limit ?? 100).offset(filters?.offset ?? 0);
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
  return db.select().from(chatMessages).where(eq(chatMessages.sessionId, sessionId)).orderBy(chatMessages.createdAt).limit(limit);
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

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
}

// ─── CONTRACTORS (المقاولون) ──────────────────────────────────────────────────
export async function getContractors(filters?: { specialty?: string; isActive?: boolean }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.isActive !== undefined) conditions.push(eq(contractors.isActive, filters.isActive));
  if (filters?.specialty) conditions.push(eq(contractors.specialty, filters.specialty as typeof contractors.specialty._.data));
  const q = db.select().from(contractors).orderBy(desc(contractors.rating));
  return conditions.length ? q.where(and(...conditions)) : q;
}

export async function getContractorById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(contractors).where(eq(contractors.id, id)).limit(1);
  return result[0];
}

export async function createContractor(data: InsertContractor) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(contractors).values(data);
  const id = (result as unknown as { insertId: number }).insertId;
  const created = await db.select().from(contractors).where(eq(contractors.id, id)).limit(1);
  return created[0];
}

export async function updateContractor(id: number, data: Partial<InsertContractor>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(contractors).set(data).where(eq(contractors.id, id));
  const updated = await db.select().from(contractors).where(eq(contractors.id, id)).limit(1);
  return updated[0];
}

export async function rateContractor(id: number, rating: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const contractor = await getContractorById(id);
  if (!contractor) throw new Error("Contractor not found");
  const newRating = ((Number(contractor.rating) * contractor.totalJobs) + rating) / (contractor.totalJobs + 1);
  await db.update(contractors).set({
    rating: String(Math.min(5, Math.max(1, newRating)).toFixed(2)),
    totalJobs: contractor.totalJobs + 1,
  }).where(eq(contractors.id, id));
}

// ─── OWNER TRANSFERS (تحويلات الملاك) ────────────────────────────────────────
export async function getOwnerTransfers(ownerId?: number) {
  const db = await getDb();
  if (!db) return [];
  const q = db.select().from(ownerTransfers).orderBy(desc(ownerTransfers.createdAt));
  return ownerId ? q.where(eq(ownerTransfers.ownerId, ownerId)) : q;
}

export async function createOwnerTransfer(data: InsertOwnerTransfer) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(ownerTransfers).values(data);
  const id = (result as unknown as { insertId: number }).insertId;
  const created = await db.select().from(ownerTransfers).where(eq(ownerTransfers.id, id)).limit(1);
  return created[0];
}

export async function updateOwnerTransfer(id: number, data: Partial<InsertOwnerTransfer>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(ownerTransfers).set(data).where(eq(ownerTransfers.id, id));
}

// ─── BROKER REFERRALS (إحالات الوسطاء) ───────────────────────────────────────
export async function getBrokerReferrals(brokerId?: number) {
  const db = await getDb();
  if (!db) return [];
  const q = db.select().from(brokerReferrals).orderBy(desc(brokerReferrals.createdAt));
  return brokerId ? q.where(eq(brokerReferrals.referringBrokerId, brokerId)) : q;
}

export async function createBrokerReferral(data: InsertBrokerReferral) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(brokerReferrals).values(data);
  const id = (result as unknown as { insertId: number }).insertId;
  const created = await db.select().from(brokerReferrals).where(eq(brokerReferrals.id, id)).limit(1);
  return created[0];
}

export async function updateBrokerReferral(id: number, data: Partial<InsertBrokerReferral>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(brokerReferrals).set(data).where(eq(brokerReferrals.id, id));
}

// ─── SYSTEM SETTINGS (إعدادات النظام) ────────────────────────────────────────
export async function getSystemSettings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(systemSettings).orderBy(systemSettings.settingKey);
}

export async function getSystemSetting(key: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(systemSettings).where(eq(systemSettings.settingKey, key)).limit(1);
  return result[0]?.settingValue ?? null;
}

export async function upsertSystemSetting(key: string, value: string, description?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(systemSettings).values({ settingKey: key, settingValue: value, description })
    .onDuplicateKeyUpdate({ set: { settingValue: value } });
}

// ─── ADVANCED ANALYTICS ───────────────────────────────────────────────────────
export async function getKPIs() {
  const db = await getDb();
  if (!db) return null;

  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [totalProps] = await db.select({ count: sql<number>`count(*)` }).from(properties);
  const [vacantUnitsCount] = await db.select({ count: sql<number>`count(*)` }).from(units).where(eq(units.status, "vacant"));
  const [totalUnitsCount] = await db.select({ count: sql<number>`count(*)` }).from(units);
  const [overduePaymentsCount] = await db.select({ count: sql<number>`count(*)` }).from(payments).where(eq(payments.status, "overdue"));
  const [overdueAmount] = await db.select({ total: sql<number>`coalesce(sum(amount - coalesce(paidAmount, 0)), 0)` }).from(payments).where(eq(payments.status, "overdue"));
  const [thisMonthRevenue] = await db.select({ total: sql<number>`coalesce(sum(paidAmount), 0)` }).from(payments).where(and(eq(payments.status, "paid"), gte(payments.paidDate, firstOfMonth)));
  const [lastMonthRevenue] = await db.select({ total: sql<number>`coalesce(sum(paidAmount), 0)` }).from(payments).where(and(eq(payments.status, "paid"), gte(payments.paidDate, lastMonth), lte(payments.paidDate, endLastMonth)));
  const [openMaintenance] = await db.select({ count: sql<number>`count(*)` }).from(maintenanceRequests).where(inArray(maintenanceRequests.status, ["open", "in_progress"]));
  const [activeContracts] = await db.select({ count: sql<number>`count(*)` }).from(contracts).where(eq(contracts.status, "active"));
  const [expiringContracts] = await db.select({ count: sql<number>`count(*)` }).from(contracts).where(and(eq(contracts.status, "active"), lte(contracts.endDate, new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000))));

  const occupancyRate = totalUnitsCount.count > 0
    ? Math.round(((totalUnitsCount.count - vacantUnitsCount.count) / totalUnitsCount.count) * 100)
    : 0;

  const revenueGrowth = lastMonthRevenue.total > 0
    ? Math.round(((thisMonthRevenue.total - lastMonthRevenue.total) / lastMonthRevenue.total) * 100)
    : 0;

  return {
    totalProperties: totalProps.count,
    vacantUnits: vacantUnitsCount.count,
    totalUnits: totalUnitsCount.count,
    occupancyRate,
    overduePayments: overduePaymentsCount.count,
    overdueAmount: Number(overdueAmount.total),
    thisMonthRevenue: Number(thisMonthRevenue.total),
    lastMonthRevenue: Number(lastMonthRevenue.total),
    revenueGrowth,
    openMaintenance: openMaintenance.count,
    activeContracts: activeContracts.count,
    expiringContracts: expiringContracts.count,
  };
}

export async function getRevenueByProperty(ownerId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(payments.status, "paid")];
  if (ownerId) conditions.push(eq(payments.ownerId, ownerId));
  return db.select({
    propertyId: payments.propertyId,
    total: sql<number>`sum(paidAmount)`,
    count: sql<number>`count(*)`,
  }).from(payments).where(and(...conditions)).groupBy(payments.propertyId).orderBy(desc(sql`sum(paidAmount)`)).limit(10);
}

export async function getCollectionRate(months = 6) {
  const db = await getDb();
  if (!db) return [];
  const results = [];
  for (let i = 0; i < months; i++) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const [total] = await db.select({ count: sql<number>`count(*)`, amount: sql<number>`sum(amount)` })
      .from(payments)
      .where(sql`YEAR(dueDate) = ${year} AND MONTH(dueDate) = ${month}`);
    const [paid] = await db.select({ count: sql<number>`count(*)`, amount: sql<number>`sum(paidAmount)` })
      .from(payments)
      .where(and(eq(payments.status, "paid"), sql`YEAR(dueDate) = ${year} AND MONTH(dueDate) = ${month}`));
    results.push({
      month: `${year}-${String(month).padStart(2, "0")}`,
      totalCount: total.count,
      totalAmount: Number(total.amount ?? 0),
      paidCount: paid.count,
      paidAmount: Number(paid.amount ?? 0),
      rate: total.count > 0 ? Math.round((paid.count / total.count) * 100) : 0,
    });
  }
  return results.reverse();
}

export async function getMaintenanceCostByProperty() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    propertyId: maintenanceRequests.propertyId,
    totalCost: sql<number>`coalesce(sum(cost), 0)`,
    count: sql<number>`count(*)`,
  }).from(maintenanceRequests).where(eq(maintenanceRequests.status, "completed")).groupBy(maintenanceRequests.propertyId).orderBy(desc(sql`sum(cost)`)).limit(10);
}

export async function getBrokerPerformance() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    brokerId: brokerCommissions.brokerId,
    totalDeals: sql<number>`count(*)`,
    totalRevenue: sql<number>`sum(commissionAmount)`,
    avgDealSize: sql<number>`avg(transactionAmount)`,
  }).from(brokerCommissions).where(eq(brokerCommissions.status, "paid")).groupBy(brokerCommissions.brokerId).orderBy(desc(sql`sum(commissionAmount)`));
}

export async function getOwnerROI(ownerId: number) {
  const db = await getDb();
  if (!db) return null;
  const [revenue] = await db.select({ total: sql<number>`coalesce(sum(paidAmount), 0)` })
    .from(payments).where(and(eq(payments.ownerId, ownerId), eq(payments.status, "paid")));
  const [expensesTotal] = await db.select({ total: sql<number>`coalesce(sum(amount), 0)` })
    .from(expenses).where(eq(expenses.ownerId, ownerId));
  const [managementFees] = await db.select({ total: sql<number>`coalesce(sum(amount), 0)` })
    .from(payments).where(and(eq(payments.ownerId, ownerId), eq(payments.type, "management_fee")));
  const net = Number(revenue.total) - Number(expensesTotal.total) - Number(managementFees.total);
  return {
    totalRevenue: Number(revenue.total),
    totalExpenses: Number(expensesTotal.total),
    managementFees: Number(managementFees.total),
    netProfit: net,
  };
}

// ─── PROPERTY ROI ANALYSIS (تحليل العائد لكل عقار) ────────────────────────────
export async function getPropertyROI(propertyId: number) {
  const db = await getDb();
  if (!db) return null;

  const property = await getPropertyById(propertyId);
  if (!property) return null;

  const [revenue] = await db.select({ total: sql<number>`coalesce(sum(paidAmount), 0)` })
    .from(payments).where(and(eq(payments.propertyId, propertyId), eq(payments.status, "paid")));

  const [expensesTotal] = await db.select({ total: sql<number>`coalesce(sum(amount), 0)` })
    .from(expenses).where(eq(expenses.propertyId, propertyId));

  const [maintenanceCosts] = await db.select({ total: sql<number>`coalesce(sum(cost), 0)` })
    .from(maintenanceRequests).where(and(eq(maintenanceRequests.propertyId, propertyId), eq(maintenanceRequests.status, "completed")));

  const monthlyData: Array<{ month: string; revenue: number; expenses: number }> = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const [rev] = await db.select({ total: sql<number>`coalesce(sum(paidAmount), 0)` })
      .from(payments).where(and(eq(payments.propertyId, propertyId), eq(payments.status, "paid"), sql`YEAR(paidDate) = ${year} AND MONTH(paidDate) = ${month}`));
    const [exp] = await db.select({ total: sql<number>`coalesce(sum(amount), 0)` })
      .from(expenses).where(and(eq(expenses.propertyId, propertyId), sql`YEAR(date) = ${year} AND MONTH(date) = ${month}`));
    monthlyData.push({ month: `${year}-${String(month).padStart(2, "0")}`, revenue: Number(rev.total), expenses: Number(exp.total) });
  }

  const totalRevenue = Number(revenue.total);
  const totalExpenses = Number(expensesTotal.total) + Number(maintenanceCosts.total);
  const netProfit = totalRevenue - totalExpenses;
  const propertyPrice = Number(property.price);
  const roi = propertyPrice > 0 ? (netProfit / propertyPrice) * 100 : 0;

  return {
    propertyId,
    propertyTitle: property.titleAr,
    propertyPrice,
    totalRevenue,
    totalExpenses,
    maintenanceCosts: Number(maintenanceCosts.total),
    netProfit,
    roi: Math.round(roi * 100) / 100,
    monthlyData,
  };
}

// ─── SMART ALERTS (التنبيهات الذكية) ──────────────────────────────────────────
export async function getSmartAlerts() {
  const db = await getDb();
  if (!db) return { expiringContracts: [], overduePayments: [], pendingMaintenance: [], vacantUnits: [] };

  const in60Days = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const expiringContracts = await db.select({
    id: contracts.id,
    tenantName: tenants.name,
    propertyTitle: properties.titleAr,
    endDate: contracts.endDate,
    daysLeft: sql<number>`DATEDIFF(endDate, NOW())`,
  }).from(contracts)
    .leftJoin(tenants, eq(contracts.tenantId, tenants.id))
    .leftJoin(properties, eq(contracts.propertyId, properties.id))
    .where(and(eq(contracts.status, "active"), sql`endDate BETWEEN NOW() AND ${in60Days}`))
    .orderBy(contracts.endDate).limit(20);

  const overduePayments = await db.select({
    id: payments.id,
    tenantName: tenants.name,
    propertyTitle: properties.titleAr,
    amount: payments.amount,
    dueDate: payments.dueDate,
    daysOverdue: sql<number>`DATEDIFF(NOW(), dueDate)`,
  }).from(payments)
    .leftJoin(tenants, eq(payments.tenantId, tenants.id))
    .leftJoin(properties, eq(payments.propertyId, properties.id))
    .where(and(eq(payments.status, "pending"), sql`dueDate < NOW()`))
    .orderBy(sql`dueDate ASC`).limit(20);

  const pendingMaintenance = await db.select({
    id: maintenanceRequests.id,
    title: maintenanceRequests.title,
    propertyTitle: properties.titleAr,
    priority: maintenanceRequests.priority,
    createdAt: maintenanceRequests.createdAt,
    daysPending: sql<number>`DATEDIFF(NOW(), createdAt)`,
  }).from(maintenanceRequests)
    .leftJoin(properties, eq(maintenanceRequests.propertyId, properties.id))
    .where(sql`status IN ('pending','in_progress') AND priority IN ('high','urgent')`)
    .orderBy(sql`FIELD(priority,'urgent','high'), createdAt ASC`).limit(10);

  const vacantUnits = await db.select({
    id: units.id,
    unitNumber: units.unitNumber,
    propertyTitle: properties.titleAr,
    vacantSince: units.vacantSince,
    daysVacant: sql<number>`DATEDIFF(NOW(), vacantSince)`,
    rentPrice: units.rentPrice,
  }).from(units)
    .leftJoin(properties, eq(units.propertyId, properties.id))
    .where(and(eq(units.status, "vacant"), sql`vacantSince IS NOT NULL`))
    .orderBy(sql`vacantSince ASC`).limit(10);

  return { expiringContracts, overduePayments, pendingMaintenance, vacantUnits };
}

// ─── ALL PROPERTIES ROI COMPARISON ────────────────────────────────────────────
export async function getAllPropertiesROI() {
  const db = await getDb();
  if (!db) return [];
  const allProperties = await db.select({
    id: properties.id,
    titleAr: properties.titleAr,
    price: properties.price,
    type: properties.type,
    status: properties.status,
    city: properties.city,
    district: properties.district,
  }).from(properties).limit(100);

  const results = await Promise.all(allProperties.map(async (prop) => {
    const [revenue] = await db.select({ total: sql<number>`coalesce(sum(paidAmount), 0)` })
      .from(payments).where(and(eq(payments.propertyId, prop.id), eq(payments.status, "paid")));
    const [expensesTotal] = await db.select({ total: sql<number>`coalesce(sum(amount), 0)` })
      .from(expenses).where(eq(expenses.propertyId, prop.id));
    const [maintenanceCosts] = await db.select({ total: sql<number>`coalesce(sum(cost), 0)` })
      .from(maintenanceRequests).where(and(eq(maintenanceRequests.propertyId, prop.id), eq(maintenanceRequests.status, "completed")));
    const totalRevenue = Number(revenue.total);
    const totalExpenses = Number(expensesTotal.total) + Number(maintenanceCosts.total);
    const netProfit = totalRevenue - totalExpenses;
    const propertyPrice = Number(prop.price);
    const roi = propertyPrice > 0 ? (netProfit / propertyPrice) * 100 : 0;
    return {
      id: prop.id,
      titleAr: prop.titleAr,
      price: propertyPrice,
      type: prop.type,
      status: prop.status ?? "available",
      city: prop.city,
      district: prop.district,
      totalRevenue,
      totalExpenses,
      netProfit,
      roi: Math.round(roi * 100) / 100,
    };
  }));

  return results.sort((a, b) => b.roi - a.roi);
}

// ─── PROPERTY IMAGES (صور العقارات) ──────────────────────────────────────────
export async function getPropertyImages(propertyId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(propertyImages)
    .where(eq(propertyImages.propertyId, propertyId))
    .orderBy(asc(propertyImages.sortOrder), asc(propertyImages.id));
}

export async function addPropertyImage(data: InsertPropertyImage) {
  const db = await getDb();
  if (!db) return;
  // If isPrimary, unset others first
  if (data.isPrimary) {
    await db.update(propertyImages)
      .set({ isPrimary: false })
      .where(eq(propertyImages.propertyId, data.propertyId));
  }
  await db.insert(propertyImages).values(data);
}

export async function deletePropertyImage(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(propertyImages).where(eq(propertyImages.id, id));
}

export async function setPrimaryImage(id: number, propertyId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(propertyImages).set({ isPrimary: false }).where(eq(propertyImages.propertyId, propertyId));
  await db.update(propertyImages).set({ isPrimary: true }).where(eq(propertyImages.id, id));
}

// ─── TENANT RATINGS ───────────────────────────────────────────────────────────
export async function getTenantRatings(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tenantRatings).where(eq(tenantRatings.tenantId, tenantId)).orderBy(desc(tenantRatings.createdAt));
}
export async function addTenantRating(data: InsertTenantRating) {
  const db = await getDb();
  if (!db) return;
  const overall = (((data.paymentScore ?? 5) + (data.cleanlinessScore ?? 5) + (data.complianceScore ?? 5)) / 3).toFixed(2);
  await db.insert(tenantRatings).values({ ...data, overallScore: overall });
  // Update tenant overall rating
  await db.update(tenants).set({
    paymentRating: data.paymentScore ?? 5,
    propertyRating: data.cleanlinessScore ?? 5,
    cooperationRating: data.complianceScore ?? 5,
    overallRating: overall,
  }).where(eq(tenants.id, data.tenantId));
}

// ─── CLIENT NOTES ─────────────────────────────────────────────────────────────
export async function getClientNotes(filter: { leadId?: number; ownerId?: number; tenantId?: number }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filter.leadId) conditions.push(eq(clientNotes.leadId, filter.leadId));
  if (filter.ownerId) conditions.push(eq(clientNotes.ownerId, filter.ownerId));
  if (filter.tenantId) conditions.push(eq(clientNotes.tenantId, filter.tenantId));
  if (conditions.length === 0) return [];
  return db.select().from(clientNotes).where(or(...conditions)).orderBy(desc(clientNotes.createdAt));
}
export async function addClientNote(data: InsertClientNote) {
  const db = await getDb();
  if (!db) return;
  await db.insert(clientNotes).values(data);
}
export async function getUpcomingFollowUps() {
  const db = await getDb();
  if (!db) return [];
  const threeDaysFromNow = Date.now() + 3 * 24 * 60 * 60 * 1000;
  return db.select().from(clientNotes)
    .where(and(
      sql`${clientNotes.followUpDate} IS NOT NULL`,
      lte(clientNotes.followUpDate, threeDaysFromNow),
      gte(clientNotes.followUpDate, Date.now())
    ))
    .orderBy(asc(clientNotes.followUpDate));
}

// ─── MARKET PRICES ────────────────────────────────────────────────────────────
export async function getMarketPrices() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(marketPrices).orderBy(asc(marketPrices.propertyType));
}
export async function getMarketPriceByType(propertyType: string, district?: string) {
  const db = await getDb();
  if (!db) return null;
  const conditions: ReturnType<typeof eq>[] = [eq(marketPrices.propertyType, propertyType as "apartment" | "villa" | "land" | "commercial" | "office" | "warehouse" | "building" | "farm")];
  if (district) conditions.push(eq(marketPrices.district, district));
  const results = await db.select().from(marketPrices).where(and(...conditions)).limit(1);
  return results[0] || null;
}
export async function getPropertiesWithMarketComparison() {
  const db = await getDb();
  if (!db) return [];
  const props = await db.select().from(properties).where(eq(properties.listingType, "rent")).orderBy(desc(properties.price));
  const result = [];
  for (const prop of props) {
    const market = await getMarketPriceByType(prop.type, prop.district || undefined);
    result.push({
      ...prop,
      marketAvgRent: market ? Number(market.avgAnnualRent) : null,
      marketMinRent: market ? Number(market.minRent) : null,
      marketMaxRent: market ? Number(market.maxRent) : null,
      priceDiff: market ? Number(prop.price) - Number(market.avgAnnualRent) : null,
      pricingOpportunity: market ? Number(prop.price) < Number(market.avgAnnualRent) * 0.9 ? "raise" : Number(prop.price) > Number(market.maxRent) ? "lower" : "optimal" : "unknown",
    });
  }
  return result;
}

// ─── ANNUAL REPORT ────────────────────────────────────────────────────────────
export async function getAnnualReport(year: number) {
  const db = await getDb();
  if (!db) return null;
  const startMs = new Date(`${year}-01-01`).getTime();
  const endMs = new Date(`${year}-12-31T23:59:59`).getTime();
  const [totalRevenue] = await db.select({ total: sql<number>`COALESCE(SUM(${payments.amount}), 0)` })
    .from(payments).where(and(eq(payments.status, "paid"), sql`${payments.paidDate} IS NOT NULL`));
  const [totalExpenses] = await db.select({ total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)` })
    .from(expenses).where(between(expenses.expenseDate, new Date(`${year}-01-01`), new Date(`${year}-12-31`)));
  const [totalMaintenance] = await db.select({ total: sql<number>`COALESCE(SUM(${maintenanceRequests.cost}), 0)` })
    .from(maintenanceRequests).where(and(
      sql`YEAR(${maintenanceRequests.createdAt}) = ${year}`,
      eq(maintenanceRequests.status, "completed")
    ));
  const [activeContracts] = await db.select({ count: drizzleCount() }).from(contracts).where(eq(contracts.status, "active"));
  const [totalProperties] = await db.select({ count: drizzleCount() }).from(properties);
  const [vacantUnits] = await db.select({ count: drizzleCount() }).from(units).where(eq(units.status, "vacant"));
  const [totalUnits] = await db.select({ count: drizzleCount() }).from(units);
  const revenue = Number(totalRevenue?.total || 0);
  const expenses_ = Number(totalExpenses?.total || 0) + Number(totalMaintenance?.total || 0);
  const netProfit = revenue - expenses_;
  const occupancyRate = totalUnits?.count > 0 ? ((totalUnits.count - (vacantUnits?.count || 0)) / totalUnits.count * 100).toFixed(1) : "0";
  return {
    year,
    totalRevenue: revenue,
    totalExpenses: expenses_,
    netProfit,
    profitMargin: revenue > 0 ? ((netProfit / revenue) * 100).toFixed(1) : "0",
    activeContracts: activeContracts?.count || 0,
    totalProperties: totalProperties?.count || 0,
    occupancyRate,
  };
}

// ─── DELETE HELPERS ───────────────────────────────────────────────────────────

export async function deleteTenant(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(tenants).where(eq(tenants.id, id));
}

export async function deleteContract(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(contracts).where(eq(contracts.id, id));
}

export async function deletePayment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(payments).where(eq(payments.id, id));
}

export async function deleteOwner(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(propertyOwners).where(eq(propertyOwners.id, id));
}

export async function deleteExpense(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(expenses).where(eq(expenses.id, id));
}

export async function deleteMaintenance(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(maintenanceRequests).where(eq(maintenanceRequests.id, id));
}
