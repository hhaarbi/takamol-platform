import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  boolean,
  json,
  date,
  bigint,
} from "drizzle-orm/mysql-core";

// ─── USERS (Auth) ─────────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "owner", "broker"]).default("user").notNull(),
  // For owners/brokers: link to their profile
  profileId: int("profileId"),
  profileType: mysqlEnum("profileType", ["owner", "broker"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── PROPERTY OWNERS (الملاك) ─────────────────────────────────────────────────
export const propertyOwners = mysqlTable("property_owners", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // linked user account (if has portal access)
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 30 }).notNull(),
  phone2: varchar("phone2", { length: 30 }),
  email: varchar("email", { length: 320 }),
  nationalId: varchar("nationalId", { length: 20 }),
  bankName: varchar("bankName", { length: 100 }),
  bankIban: varchar("bankIban", { length: 50 }),
  address: text("address"),
  notes: text("notes"),
  managementFeeType: mysqlEnum("managementFeeType", ["percentage", "fixed"]).default("percentage").notNull(),
  managementFeeValue: decimal("managementFeeValue", { precision: 8, scale: 2 }).default("5.00").notNull(),
  hasPortalAccess: boolean("hasPortalAccess").default(false).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PropertyOwner = typeof propertyOwners.$inferSelect;
export type InsertPropertyOwner = typeof propertyOwners.$inferInsert;

// ─── BROKERS (الوسطاء) ───────────────────────────────────────────────────────
export const brokers = mysqlTable("brokers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // linked user account
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 30 }).notNull(),
  email: varchar("email", { length: 320 }),
  licenseNumber: varchar("licenseNumber", { length: 50 }),
  // Commission rates per property type (JSON: { apartment: 2.5, villa: 3, land: 2, ... })
  commissionRates: json("commissionRates").$type<Record<string, number>>().default({}),
  notes: text("notes"),
  isActive: boolean("isActive").default(true).notNull(),
  hasPortalAccess: boolean("hasPortalAccess").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Broker = typeof brokers.$inferSelect;
export type InsertBroker = typeof brokers.$inferInsert;

// ─── PROPERTIES (العقارات) ────────────────────────────────────────────────────
export const properties = mysqlTable("properties", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId"), // property owner (if managed)
  brokerId: int("brokerId"), // broker listing (if broker-submitted)
  source: mysqlEnum("source", ["company", "broker", "owner"]).default("company").notNull(),
  titleAr: varchar("titleAr", { length: 255 }).notNull(),
  descriptionAr: text("descriptionAr"),
  type: mysqlEnum("type", ["apartment", "villa", "land", "commercial", "office", "warehouse", "building", "farm"]).notNull(),
  listingType: mysqlEnum("listingType", ["sale", "rent", "managed"]).notNull(),
  status: mysqlEnum("status", ["available", "rented", "sold", "under_management", "reserved", "inactive"]).default("available").notNull(),
  price: decimal("price", { precision: 15, scale: 2 }).notNull(),
  priceUnit: mysqlEnum("priceUnit", ["total", "per_month", "per_year"]).default("total").notNull(),
  negotiable: boolean("negotiable").default(true).notNull(),
  minPrice: decimal("minPrice", { precision: 15, scale: 2 }),
  area: decimal("area", { precision: 10, scale: 2 }),
  bedrooms: int("bedrooms"),
  bathrooms: int("bathrooms"),
  floor: int("floor"),
  totalFloors: int("totalFloors"),
  city: varchar("city", { length: 100 }).default("المدينة المنورة"),
  district: varchar("district", { length: 100 }),
  address: text("address"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  images: json("images").$type<string[]>().default([]),
  features: json("features").$type<string[]>().default([]),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  // Broker commission for this specific listing
  brokerCommissionRate: decimal("brokerCommissionRate", { precision: 5, scale: 2 }),
  brokerCommissionAmount: decimal("brokerCommissionAmount", { precision: 15, scale: 2 }),
  viewCount: int("viewCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Property = typeof properties.$inferSelect;
export type InsertProperty = typeof properties.$inferInsert;

// ─── UNITS (الوحدات) ──────────────────────────────────────────────────────────
export const units = mysqlTable("units", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull(),
  unitNumber: varchar("unitNumber", { length: 50 }).notNull(),
  floor: int("floor"),
  type: mysqlEnum("type", ["apartment", "room", "shop", "office", "warehouse", "studio"]).notNull(),
  area: decimal("area", { precision: 10, scale: 2 }),
  bedrooms: int("bedrooms"),
  bathrooms: int("bathrooms"),
  rentPrice: decimal("rentPrice", { precision: 15, scale: 2 }),
  status: mysqlEnum("status", ["vacant", "occupied", "maintenance", "reserved"]).default("vacant").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Unit = typeof units.$inferSelect;
export type InsertUnit = typeof units.$inferInsert;

// ─── TENANTS (المستأجرون) ─────────────────────────────────────────────────────
export const tenants = mysqlTable("tenants", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 30 }).notNull(),
  phone2: varchar("phone2", { length: 30 }),
  email: varchar("email", { length: 320 }),
  nationalId: varchar("nationalId", { length: 20 }),
  nationality: varchar("nationality", { length: 50 }),
  occupation: varchar("occupation", { length: 100 }),
  emergencyContact: varchar("emergencyContact", { length: 30 }),
  notes: text("notes"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = typeof tenants.$inferInsert;

// ─── CONTRACTS (العقود) ───────────────────────────────────────────────────────
export const contracts = mysqlTable("contracts", {
  id: int("id").autoincrement().primaryKey(),
  contractNumber: varchar("contractNumber", { length: 50 }).notNull().unique(),
  type: mysqlEnum("type", ["rent", "sale", "management"]).notNull(),
  propertyId: int("propertyId"),
  unitId: int("unitId"),
  tenantId: int("tenantId"),
  ownerId: int("ownerId"),
  // Rent contract fields
  rentAmount: decimal("rentAmount", { precision: 15, scale: 2 }),
  rentPeriod: mysqlEnum("rentPeriod", ["monthly", "quarterly", "semi_annual", "annual"]).default("annual"),
  startDate: date("startDate"),
  endDate: date("endDate"),
  depositAmount: decimal("depositAmount", { precision: 15, scale: 2 }),
  // Sale contract fields
  salePrice: decimal("salePrice", { precision: 15, scale: 2 }),
  // Management contract fields
  managementFeeType: mysqlEnum("managementFeeType", ["percentage", "fixed"]),
  managementFeeValue: decimal("managementFeeValue", { precision: 8, scale: 2 }),
  status: mysqlEnum("status", ["active", "expired", "terminated", "pending", "renewed"]).default("active").notNull(),
  notes: text("notes"),
  documents: json("documents").$type<string[]>().default([]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Contract = typeof contracts.$inferSelect;
export type InsertContract = typeof contracts.$inferInsert;

// ─── PAYMENTS (المدفوعات / التحصيل) ──────────────────────────────────────────
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId"),
  tenantId: int("tenantId"),
  propertyId: int("propertyId"),
  unitId: int("unitId"),
  ownerId: int("ownerId"),
  type: mysqlEnum("type", ["rent", "deposit", "maintenance_fee", "management_fee", "commission", "other"]).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  dueDate: date("dueDate").notNull(),
  paidDate: date("paidDate"),
  paymentMethod: mysqlEnum("paymentMethod", ["bank_transfer", "cash", "check", "online"]),
  referenceNumber: varchar("referenceNumber", { length: 100 }),
  status: mysqlEnum("status", ["pending", "paid", "overdue", "partial", "cancelled"]).default("pending").notNull(),
  notes: text("notes"),
  receiptUrl: varchar("receiptUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;

// ─── EXPENSES (المصاريف) ──────────────────────────────────────────────────────
export const expenses = mysqlTable("expenses", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId"),
  unitId: int("unitId"),
  ownerId: int("ownerId"),
  category: mysqlEnum("category", ["maintenance", "utilities", "insurance", "tax", "management", "cleaning", "security", "other"]).notNull(),
  description: text("description").notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  expenseDate: date("expenseDate").notNull(),
  paidBy: mysqlEnum("paidBy", ["company", "owner", "tenant"]).default("company").notNull(),
  deductFromOwner: boolean("deductFromOwner").default(true).notNull(),
  receiptUrl: varchar("receiptUrl", { length: 500 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = typeof expenses.$inferInsert;

// ─── MAINTENANCE REQUESTS (طلبات الصيانة) ────────────────────────────────────
export const maintenanceRequests = mysqlTable("maintenance_requests", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId"),
  unitId: int("unitId"),
  tenantId: int("tenantId"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  status: mysqlEnum("status", ["open", "in_progress", "completed", "cancelled"]).default("open").notNull(),
  assignedTo: varchar("assignedTo", { length: 255 }),
  cost: decimal("cost", { precision: 15, scale: 2 }),
  completedDate: date("completedDate"),
  images: json("images").$type<string[]>().default([]),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MaintenanceRequest = typeof maintenanceRequests.$inferSelect;
export type InsertMaintenanceRequest = typeof maintenanceRequests.$inferInsert;

// ─── OWNER STATEMENTS (كشف حساب المالك) ──────────────────────────────────────
export const ownerStatements = mysqlTable("owner_statements", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  period: varchar("period", { length: 7 }).notNull(), // YYYY-MM
  totalRentCollected: decimal("totalRentCollected", { precision: 15, scale: 2 }).default("0"),
  totalExpenses: decimal("totalExpenses", { precision: 15, scale: 2 }).default("0"),
  managementFee: decimal("managementFee", { precision: 15, scale: 2 }).default("0"),
  netAmount: decimal("netAmount", { precision: 15, scale: 2 }).default("0"),
  status: mysqlEnum("status", ["draft", "sent", "paid"]).default("draft").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type OwnerStatement = typeof ownerStatements.$inferSelect;

// ─── BROKER COMMISSIONS (عمولات الوسطاء) ─────────────────────────────────────
export const brokerCommissions = mysqlTable("broker_commissions", {
  id: int("id").autoincrement().primaryKey(),
  brokerId: int("brokerId").notNull(),
  propertyId: int("propertyId"),
  contractId: int("contractId"),
  transactionType: mysqlEnum("transactionType", ["sale", "rent"]).notNull(),
  transactionAmount: decimal("transactionAmount", { precision: 15, scale: 2 }).notNull(),
  commissionRate: decimal("commissionRate", { precision: 5, scale: 2 }).notNull(),
  commissionAmount: decimal("commissionAmount", { precision: 15, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "paid", "cancelled"]).default("pending").notNull(),
  paidDate: date("paidDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type BrokerCommission = typeof brokerCommissions.$inferSelect;

// ─── LEADS / CUSTOMERS (العملاء المحتملون) ────────────────────────────────────
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }),
  phone: varchar("phone", { length: 30 }),
  email: varchar("email", { length: 320 }),
  serviceType: mysqlEnum("serviceType", [
    "buy", "sell", "rent_looking", "rent_listing", "property_management", "unknown",
  ]).default("unknown"),
  budget: varchar("budget", { length: 100 }),
  preferredCity: varchar("preferredCity", { length: 100 }),
  notes: text("notes"),
  status: mysqlEnum("status", ["new", "contacted", "qualified", "closed", "lost"]).default("new").notNull(),
  source: mysqlEnum("source", ["telegram", "website", "whatsapp", "phone", "referral"]).default("telegram").notNull(),
  sessionId: varchar("sessionId", { length: 128 }),
  assignedTo: varchar("assignedTo", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

// ─── CHAT SESSIONS ────────────────────────────────────────────────────────────
export const chatSessions = mysqlTable("chat_sessions", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 128 }).notNull().unique(),
  leadId: int("leadId"),
  metadata: json("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ChatSession = typeof chatSessions.$inferSelect;

// ─── CHAT MESSAGES ────────────────────────────────────────────────────────────
export const chatMessages = mysqlTable("chat_messages", {
  id: int("id").autoincrement().primaryKey(),
  sessionId: varchar("sessionId", { length: 128 }).notNull(),
  role: mysqlEnum("role", ["user", "assistant"]).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ChatMessage = typeof chatMessages.$inferSelect;

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  type: varchar("type", { length: 50 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  metadata: json("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Notification = typeof notifications.$inferSelect;
