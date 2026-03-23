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
  userId: int("userId"),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 30 }).notNull(),
  phone2: varchar("phone2", { length: 30 }),
  email: varchar("email", { length: 320 }),
  nationalId: varchar("nationalId", { length: 20 }),
  commercialRegNo: varchar("commercialRegNo", { length: 30 }),
  bankName: varchar("bankName", { length: 100 }),
  bankIban: varchar("bankIban", { length: 50 }),
  address: text("address"),
  nationalAddress: varchar("nationalAddress", { length: 255 }),
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
  userId: int("userId"),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 30 }).notNull(),
  email: varchar("email", { length: 320 }),
  nationalId: varchar("nationalId", { length: 20 }),
  // رخصة فال
  falLicenseNumber: varchar("falLicenseNumber", { length: 50 }),
  falLicenseType: mysqlEnum("falLicenseType", ["brokerage", "property_management", "marketing"]),
  falLicenseIssueDate: date("falLicenseIssueDate"),
  falLicenseExpiryDate: date("falLicenseExpiryDate"),
  // Commission rates per property type
  commissionRates: json("commissionRates").$type<Record<string, number>>().default({}),
  notes: text("notes"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  totalDeals: int("totalDeals").default(0),
  isActive: boolean("isActive").default(true).notNull(),
  hasPortalAccess: boolean("hasPortalAccess").default(false).notNull(),
  approvalRequired: boolean("approvalRequired").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Broker = typeof brokers.$inferSelect;
export type InsertBroker = typeof brokers.$inferInsert;

// ─── PROPERTIES (العقارات) ────────────────────────────────────────────────────
export const properties = mysqlTable("properties", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId"),
  brokerId: int("brokerId"),
  source: mysqlEnum("source", ["company", "broker", "owner"]).default("company").notNull(),
  approvalStatus: mysqlEnum("approvalStatus", ["pending", "approved", "rejected"]).default("approved").notNull(),
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
  nationalAddress: varchar("nationalAddress", { length: 255 }),
  deedNumber: varchar("deedNumber", { length: 50 }),
  buildingPermitNo: varchar("buildingPermitNo", { length: 50 }),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  images: json("images").$type<string[]>().default([]),
  features: json("features").$type<string[]>().default([]),
  isFeatured: boolean("isFeatured").default(false).notNull(),
  brokerCommissionRate: decimal("brokerCommissionRate", { precision: 5, scale: 2 }),
  brokerCommissionAmount: decimal("brokerCommissionAmount", { precision: 15, scale: 2 }),
  maintenanceBudget: decimal("maintenanceBudget", { precision: 15, scale: 2 }).default("0"),
  maintenanceSpent: decimal("maintenanceSpent", { precision: 15, scale: 2 }).default("0"),
  vacantSince: timestamp("vacantSince"),
  vacancyReason: mysqlEnum("vacancyReason", ["new", "eviction", "maintenance", "end_of_contract", "other"]),
  viewCount: int("viewCount").default(0),
  // أعمدة إضافية
  yearBuilt: int("yearBuilt"),
  lastRenovation: date("lastRenovation"),
  floorNumber: int("floorNumber"),
  parkingSpaces: int("parkingSpaces").default(0),
  furnished: mysqlEnum("furnished", ["furnished", "semi_furnished", "unfurnished"]).default("unfurnished"),
  electricityAccount: varchar("electricityAccount", { length: 50 }),
  waterAccount: varchar("waterAccount", { length: 50 }),
  roi: decimal("roi", { precision: 5, scale: 2 }),
  vacancyLoss: decimal("vacancyLoss", { precision: 15, scale: 2 }),
  marketRent: decimal("marketRent", { precision: 15, scale: 2 }),
  lastInspectionDate: date("lastInspectionDate"),
  nextInspectionDate: date("nextInspectionDate"),
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
  vacantSince: date("vacantSince"),
  vacancyReason: mysqlEnum("vacancyReason", ["new", "eviction", "maintenance", "end_of_contract", "other"]),
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
  // تقييم المستأجر
  paymentRating: int("paymentRating").default(5), // 1-5
  propertyRating: int("propertyRating").default(5), // 1-5
  cooperationRating: int("cooperationRating").default(5), // 1-5
  overallRating: decimal("overallRating", { precision: 3, scale: 2 }).default("5.00"),
  ratingNotes: text("ratingNotes"),
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
  rentAmount: decimal("rentAmount", { precision: 15, scale: 2 }),
  rentPeriod: mysqlEnum("rentPeriod", ["monthly", "quarterly", "semi_annual", "annual"]).default("annual"),
  startDate: date("startDate"),
  endDate: date("endDate"),
  depositAmount: decimal("depositAmount", { precision: 15, scale: 2 }),
  salePrice: decimal("salePrice", { precision: 15, scale: 2 }),
  managementFeeType: mysqlEnum("managementFeeType", ["percentage", "fixed"]),
  managementFeeValue: decimal("managementFeeValue", { precision: 8, scale: 2 }),
  // Renewal tracking
  renewalStatus: mysqlEnum("renewalStatus", ["none", "pending", "sent", "accepted", "rejected"]).default("none"),
  renewedFromId: int("renewedFromId"),
  newRentAmount: decimal("newRentAmount", { precision: 15, scale: 2 }),
  alert90Sent: boolean("alert90Sent").default(false),
  alert60Sent: boolean("alert60Sent").default(false),
  alert30Sent: boolean("alert30Sent").default(false),
  status: mysqlEnum("status", ["active", "expired", "terminated", "pending", "renewed"]).default("active").notNull(),
  archived: boolean("archived").default(false).notNull(),
  archivedAt: timestamp("archivedAt"),
  archivedReason: varchar("archivedReason", { length: 255 }),
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
  receiptNumber: varchar("receiptNumber", { length: 50 }),
  contractId: int("contractId"),
  tenantId: int("tenantId"),
  propertyId: int("propertyId"),
  unitId: int("unitId"),
  ownerId: int("ownerId"),
  type: mysqlEnum("type", ["rent", "deposit", "maintenance_fee", "management_fee", "commission", "other"]).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  dueDate: date("dueDate").notNull(),
  paidDate: date("paidDate"),
  paidAmount: decimal("paidAmount", { precision: 15, scale: 2 }),
  paymentMethod: mysqlEnum("paymentMethod", ["bank_transfer", "cash", "check", "online"]),
  referenceNumber: varchar("referenceNumber", { length: 100 }),
  status: mysqlEnum("status", ["pending", "paid", "overdue", "partial", "cancelled"]).default("pending").notNull(),
  // Escalation tracking
  escalationLevel: int("escalationLevel").default(0),
  lastReminderSent: timestamp("lastReminderSent"),
  daysOverdue: int("daysOverdue").default(0),
  notes: text("notes"),
  receiptUrl: varchar("receiptUrl", { length: 500 }),
  periodCovered: varchar("periodCovered", { length: 100 }),
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
  status: mysqlEnum("status", ["open", "in_progress", "completed", "cancelled", "awaiting_approval"]).default("open").notNull(),
  assignedTo: varchar("assignedTo", { length: 255 }),
  assignedPhone: varchar("assignedPhone", { length: 30 }),
  cost: decimal("cost", { precision: 15, scale: 2 }),
  estimatedCost: decimal("estimatedCost", { precision: 15, scale: 2 }),
  ownerApprovalRequired: boolean("ownerApprovalRequired").default(false),
  ownerApproved: boolean("ownerApproved"),
  completedDate: date("completedDate"),
  scheduledDate: date("scheduledDate"),
  images: json("images").$type<string[]>().default([]),
  completionImages: json("completionImages").$type<string[]>().default([]),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MaintenanceRequest = typeof maintenanceRequests.$inferSelect;
export type InsertMaintenanceRequest = typeof maintenanceRequests.$inferInsert;

// ─── SCHEDULED MAINTENANCE (الصيانة الدورية) ─────────────────────────────────
export const scheduledMaintenance = mysqlTable("scheduled_maintenance", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull(),
  unitId: int("unitId"),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  frequency: mysqlEnum("frequency", ["monthly", "quarterly", "semi_annual", "annual"]).notNull(),
  lastPerformed: date("lastPerformed"),
  nextDue: date("nextDue").notNull(),
  estimatedCost: decimal("estimatedCost", { precision: 15, scale: 2 }),
  assignedTo: varchar("assignedTo", { length: 255 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ScheduledMaintenance = typeof scheduledMaintenance.$inferSelect;
export type InsertScheduledMaintenance = typeof scheduledMaintenance.$inferInsert;

// ─── OWNER STATEMENTS (كشف حساب المالك) ──────────────────────────────────────
export const ownerStatements = mysqlTable("owner_statements", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  period: varchar("period", { length: 7 }).notNull(),
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

// ─── DEPOSITS / GUARANTEES (الضمانات / التأمينات) ────────────────────────────
export const deposits = mysqlTable("deposits", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").notNull(),
  tenantId: int("tenantId").notNull(),
  propertyId: int("propertyId"),
  unitId: int("unitId"),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  paidDate: date("paidDate"),
  status: mysqlEnum("status", ["held", "partially_returned", "fully_returned", "forfeited"]).default("held").notNull(),
  deductions: json("deductions").$type<Array<{ reason: string; amount: number }>>().default([]),
  totalDeducted: decimal("totalDeducted", { precision: 15, scale: 2 }).default("0"),
  returnedAmount: decimal("returnedAmount", { precision: 15, scale: 2 }).default("0"),
  returnedDate: date("returnedDate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Deposit = typeof deposits.$inferSelect;
export type InsertDeposit = typeof deposits.$inferInsert;

// ─── UNIT HANDOVER (محضر تسليم واستلام الوحدات) ─────────────────────────────
export const unitHandovers = mysqlTable("unit_handovers", {
  id: int("id").autoincrement().primaryKey(),
  unitId: int("unitId").notNull(),
  propertyId: int("propertyId").notNull(),
  tenantId: int("tenantId"),
  contractId: int("contractId"),
  type: mysqlEnum("type", ["check_in", "check_out"]).notNull(),
  handoverDate: date("handoverDate").notNull(),
  // Condition assessment
  wallsCondition: mysqlEnum("wallsCondition", ["excellent", "good", "fair", "poor"]).default("good"),
  floorsCondition: mysqlEnum("floorsCondition", ["excellent", "good", "fair", "poor"]).default("good"),
  plumbingCondition: mysqlEnum("plumbingCondition", ["excellent", "good", "fair", "poor"]).default("good"),
  electricalCondition: mysqlEnum("electricalCondition", ["excellent", "good", "fair", "poor"]).default("good"),
  acCondition: mysqlEnum("acCondition", ["excellent", "good", "fair", "poor"]).default("good"),
  kitchenCondition: mysqlEnum("kitchenCondition", ["excellent", "good", "fair", "poor"]).default("good"),
  bathroomCondition: mysqlEnum("bathroomCondition", ["excellent", "good", "fair", "poor"]).default("good"),
  overallCondition: mysqlEnum("overallCondition", ["excellent", "good", "fair", "poor"]).default("good"),
  meterReadingElectricity: varchar("meterReadingElectricity", { length: 50 }),
  meterReadingWater: varchar("meterReadingWater", { length: 50 }),
  keysCount: int("keysCount"),
  images: json("images").$type<string[]>().default([]),
  notes: text("notes"),
  signedByTenant: boolean("signedByTenant").default(false),
  signedByCompany: boolean("signedByCompany").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UnitHandover = typeof unitHandovers.$inferSelect;
export type InsertUnitHandover = typeof unitHandovers.$inferInsert;

// ─── ACTIVITY LOG (سجل النشاطات) ─────────────────────────────────────────────
export const activityLog = mysqlTable("activity_log", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  userName: varchar("userName", { length: 255 }),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entityType", { length: 50 }).notNull(),
  entityId: int("entityId"),
  entityName: varchar("entityName", { length: 255 }),
  oldValues: json("oldValues").$type<Record<string, unknown>>(),
  newValues: json("newValues").$type<Record<string, unknown>>(),
  description: text("description"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ActivityLog = typeof activityLog.$inferSelect;
export type InsertActivityLog = typeof activityLog.$inferInsert;

// ─── INTERNAL NOTES (الملاحظات الداخلية) ─────────────────────────────────────
export const internalNotes = mysqlTable("internal_notes", {
  id: int("id").autoincrement().primaryKey(),
  entityType: mysqlEnum("entityType", ["owner", "tenant", "property", "unit", "broker", "contract", "lead"]).notNull(),
  entityId: int("entityId").notNull(),
  authorId: int("authorId"),
  authorName: varchar("authorName", { length: 255 }),
  content: text("content").notNull(),
  isPinned: boolean("isPinned").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type InternalNote = typeof internalNotes.$inferSelect;
export type InsertInternalNote = typeof internalNotes.$inferInsert;

// ─── MESSAGE TEMPLATES (قوالب الرسائل) ───────────────────────────────────────
export const messageTemplates = mysqlTable("message_templates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  category: mysqlEnum("category", ["payment_reminder", "contract_renewal", "rent_increase", "eviction_notice", "welcome", "receipt", "maintenance", "general"]).notNull(),
  subject: varchar("subject", { length: 255 }),
  bodyAr: text("bodyAr").notNull(),
  variables: json("variables").$type<string[]>().default([]),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MessageTemplate = typeof messageTemplates.$inferSelect;
export type InsertMessageTemplate = typeof messageTemplates.$inferInsert;

// ─── SENT MESSAGES (الرسائل المرسلة) ─────────────────────────────────────────
export const sentMessages = mysqlTable("sent_messages", {
  id: int("id").autoincrement().primaryKey(),
  templateId: int("templateId"),
  recipientType: mysqlEnum("recipientType", ["tenant", "owner", "broker"]).notNull(),
  recipientId: int("recipientId").notNull(),
  recipientName: varchar("recipientName", { length: 255 }),
  recipientPhone: varchar("recipientPhone", { length: 30 }),
  channel: mysqlEnum("channel", ["sms", "telegram", "whatsapp", "email"]).notNull(),
  subject: varchar("subject", { length: 255 }),
  body: text("body").notNull(),
  status: mysqlEnum("status", ["sent", "delivered", "failed"]).default("sent").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SentMessage = typeof sentMessages.$inferSelect;
export type InsertSentMessage = typeof sentMessages.$inferInsert;

// ─── DAILY TASKS (المهام اليومية) ────────────────────────────────────────────
export const dailyTasks = mysqlTable("daily_tasks", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", [
    "payment_due", "contract_expiring", "maintenance_pending",
    "lead_followup", "payment_overdue", "inspection_due",
    "scheduled_maintenance", "fal_license_expiring", "custom"
  ]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  entityType: varchar("entityType", { length: 50 }),
  entityId: int("entityId"),
  dueDate: date("dueDate").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  status: mysqlEnum("status", ["pending", "completed", "dismissed"]).default("pending").notNull(),
  assignedTo: int("assignedTo"),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DailyTask = typeof dailyTasks.$inferSelect;
export type InsertDailyTask = typeof dailyTasks.$inferInsert;

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

// ─── DOCUMENTS (الوثائق والأرشيف) ────────────────────────────────────────────
export const documents = mysqlTable("documents", {
  id: int("id").autoincrement().primaryKey(),
  entityType: mysqlEnum("entityType", ["owner", "tenant", "property", "unit", "contract", "broker"]).notNull(),
  entityId: int("entityId").notNull(),
  category: mysqlEnum("category", ["deed", "contract", "id_copy", "receipt", "maintenance_report", "inspection", "license", "other"]).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 500 }).notNull(),
  fileKey: varchar("fileKey", { length: 500 }),
  mimeType: varchar("mimeType", { length: 100 }),
  fileSize: int("fileSize"),
  uploadedBy: int("uploadedBy"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;

// ─── CONTRACTORS (المقاولون والموردون) ────────────────────────────────────────
export const contractors = mysqlTable("contractors", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  specialty: mysqlEnum("specialty", ["plumbing", "electrical", "hvac", "painting", "carpentry", "cleaning", "security", "general", "other"]).default("general").notNull(),
  phone: varchar("phone", { length: 30 }).notNull(),
  phone2: varchar("phone2", { length: 30 }),
  email: varchar("email", { length: 320 }),
  company: varchar("company", { length: 255 }),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("5.00"),
  totalJobs: int("totalJobs").default(0).notNull(),
  totalCost: decimal("totalCost", { precision: 15, scale: 2 }).default("0").notNull(),
  notes: text("notes"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Contractor = typeof contractors.$inferSelect;
export type InsertContractor = typeof contractors.$inferInsert;

// ─── OWNER TRANSFERS (تحويلات الملاك) ────────────────────────────────────────
export const ownerTransfers = mysqlTable("owner_transfers", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  statementId: int("statementId"),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  transferDate: date("transferDate").notNull(),
  bankName: varchar("bankName", { length: 100 }),
  ibanLast4: varchar("ibanLast4", { length: 10 }),
  referenceNumber: varchar("referenceNumber", { length: 100 }),
  receiptUrl: varchar("receiptUrl", { length: 500 }),
  status: mysqlEnum("status", ["pending", "completed", "failed"]).default("pending").notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type OwnerTransfer = typeof ownerTransfers.$inferSelect;
export type InsertOwnerTransfer = typeof ownerTransfers.$inferInsert;

// ─── BROKER REFERRALS (إحالات الوسطاء) ───────────────────────────────────────
export const brokerReferrals = mysqlTable("broker_referrals", {
  id: int("id").autoincrement().primaryKey(),
  referringBrokerId: int("referringBrokerId").notNull(),
  receivingBrokerId: int("receivingBrokerId"),
  propertyId: int("propertyId"),
  clientName: varchar("clientName", { length: 255 }).notNull(),
  clientPhone: varchar("clientPhone", { length: 30 }).notNull(),
  serviceType: mysqlEnum("serviceType", ["buy", "sell", "rent", "management"]).notNull(),
  status: mysqlEnum("status", ["pending", "contacted", "deal_closed", "cancelled"]).default("pending").notNull(),
  referralCommission: decimal("referralCommission", { precision: 8, scale: 2 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type BrokerReferral = typeof brokerReferrals.$inferSelect;
export type InsertBrokerReferral = typeof brokerReferrals.$inferInsert;

// ─── SYSTEM SETTINGS (إعدادات النظام) ────────────────────────────────────────
export const systemSettings = mysqlTable("system_settings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 100 }).notNull().unique(),
  settingValue: text("settingValue").notNull(),
  description: text("description"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = typeof systemSettings.$inferInsert;

// ─── PROPERTY IMAGES (صور العقارات) ──────────────────────────────────────────
export const propertyImages = mysqlTable("property_images", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull(),
  url: text("url").notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  caption: varchar("caption", { length: 255 }),
  isPrimary: boolean("isPrimary").default(false).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PropertyImage = typeof propertyImages.$inferSelect;
export type InsertPropertyImage = typeof propertyImages.$inferInsert;

// ─── TENANT RATINGS (تقييمات المستأجرين) ─────────────────────────────────────
export const tenantRatings = mysqlTable("tenant_ratings", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  contractId: int("contractId").notNull(),
  paymentScore: int("paymentScore").default(5).notNull(),
  cleanlinessScore: int("cleanlinessScore").default(5).notNull(),
  complianceScore: int("complianceScore").default(5).notNull(),
  overallScore: decimal("overallScore", { precision: 3, scale: 2 }).default("5.00").notNull(),
  notes: text("notes"),
  ratedBy: int("ratedBy"),
  createdAt: bigint("createdAt", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
export type TenantRating = typeof tenantRatings.$inferSelect;
export type InsertTenantRating = typeof tenantRatings.$inferInsert;

// ─── CLIENT NOTES (ملاحظات العملاء) ──────────────────────────────────────────
export const clientNotes = mysqlTable("client_notes", {
  id: int("id").autoincrement().primaryKey(),
  leadId: int("leadId"),
  ownerId: int("ownerId"),
  tenantId: int("tenantId"),
  note: text("note").notNull(),
  noteType: mysqlEnum("noteType", ["call", "meeting", "email", "whatsapp", "other"]).default("other").notNull(),
  followUpDate: bigint("followUpDate", { mode: "number" }),
  createdBy: int("createdBy"),
  createdAt: bigint("createdAt", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
export type ClientNote = typeof clientNotes.$inferSelect;
export type InsertClientNote = typeof clientNotes.$inferInsert;

// ─── MARKET PRICES (أسعار السوق) ─────────────────────────────────────────────
export const marketPrices = mysqlTable("market_prices", {
  id: int("id").autoincrement().primaryKey(),
  propertyType: mysqlEnum("propertyType", ["apartment", "villa", "land", "commercial", "office", "warehouse", "building", "farm"]).notNull(),
  district: varchar("district", { length: 200 }),
  city: varchar("city", { length: 200 }).default("المدينة المنورة").notNull(),
  avgPricePerSqm: decimal("avgPricePerSqm", { precision: 10, scale: 2 }),
  avgAnnualRent: decimal("avgAnnualRent", { precision: 12, scale: 2 }),
  minRent: decimal("minRent", { precision: 12, scale: 2 }),
  maxRent: decimal("maxRent", { precision: 12, scale: 2 }),
  source: varchar("source", { length: 200 }).default("تقدير السوق").notNull(),
  updatedAt: bigint("updatedAt", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
export type MarketPrice = typeof marketPrices.$inferSelect;
export type InsertMarketPrice = typeof marketPrices.$inferInsert;

// ─── TENANT SESSIONS (جلسات بوابة المستأجر) ──────────────────────────────────
export const tenantSessions = mysqlTable("tenant_sessions", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull(),
  contractId: int("contract_id").notNull(),
  accessToken: varchar("access_token", { length: 255 }).notNull().unique(),
  expiresAt: bigint("expires_at", { mode: "number" }).notNull(),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
export type TenantSession = typeof tenantSessions.$inferSelect;

// ─── TENANT DOCUMENTS (وثائق المستأجر) ───────────────────────────────────────
export const tenantDocuments = mysqlTable("tenant_documents", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenant_id").notNull(),
  contractId: int("contract_id").notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileUrl: text("file_url").notNull(),
  fileKey: varchar("file_key", { length: 500 }).notNull(),
  docType: varchar("doc_type", { length: 100 }).default("other"),
  uploadedAt: bigint("uploaded_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
export type TenantDocument = typeof tenantDocuments.$inferSelect;

// ─── API KEYS (مفاتيح API) ────────────────────────────────────────────────────
export const apiKeys = mysqlTable("api_keys", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  keyHash: varchar("key_hash", { length: 255 }).notNull().unique(),
  keyPrefix: varchar("key_prefix", { length: 20 }).notNull(),
  permissions: json("permissions").$type<string[]>().default([]),
  isActive: boolean("is_active").notNull().default(true),
  lastUsedAt: bigint("last_used_at", { mode: "number" }),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
  revokedAt: bigint("revoked_at", { mode: "number" }),
});
export type ApiKey = typeof apiKeys.$inferSelect;

// ─── PROPERTY LISTINGS (الإعلانات العقارية) ───────────────────────────────────
export const propertyListings = mysqlTable("property_listings", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("property_id").notNull(),
  unitId: int("unit_id"),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  listingType: mysqlEnum("listing_type", ["rent", "sale"]).notNull().default("rent"),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["active", "paused", "rented", "sold"]).notNull().default("active"),
  autoPublished: boolean("auto_published").notNull().default(false),
  contactPhone: varchar("contact_phone", { length: 50 }),
  contactWhatsapp: varchar("contact_whatsapp", { length: 50 }),
  viewsCount: int("views_count").notNull().default(0),
  inquiriesCount: int("inquiries_count").notNull().default(0),
  publishedAt: bigint("published_at", { mode: "number" }),
  expiresAt: bigint("expires_at", { mode: "number" }),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
export type PropertyListing = typeof propertyListings.$inferSelect;

// ─── ACCOUNTING EXPORTS (سجل التصدير المحاسبي) ───────────────────────────────
export const accountingExports = mysqlTable("accounting_exports", {
  id: int("id").autoincrement().primaryKey(),
  exportType: varchar("export_type", { length: 50 }).notNull(),
  dateFrom: bigint("date_from", { mode: "number" }).notNull(),
  dateTo: bigint("date_to", { mode: "number" }).notNull(),
  recordsCount: int("records_count").notNull().default(0),
  fileUrl: text("file_url"),
  fileKey: varchar("file_key", { length: 500 }),
  status: varchar("status", { length: 20 }).notNull().default("completed"),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
export type AccountingExport = typeof accountingExports.$inferSelect;

// ─── STAFF & ROLES (الموظفون والأدوار) ────────────────────────────────────────
export const staff = mysqlTable("staff", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id"),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 200 }),
  phone: varchar("phone", { length: 50 }),
  role: mysqlEnum("role", ["admin", "accountant", "property_manager", "maintenance_supervisor", "leasing_agent", "receptionist"]).notNull().default("receptionist"),
  department: varchar("department", { length: 100 }),
  isActive: boolean("is_active").notNull().default(true),
  notes: text("notes"),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
export type Staff = typeof staff.$inferSelect;

// ─── ROLE PERMISSIONS (صلاحيات الأدوار) ──────────────────────────────────────
export const rolePermissions = mysqlTable("role_permissions", {
  id: int("id").autoincrement().primaryKey(),
  role: varchar("role", { length: 50 }).notNull(),
  module: varchar("module", { length: 100 }).notNull(),
  canView: boolean("can_view").notNull().default(false),
  canCreate: boolean("can_create").notNull().default(false),
  canEdit: boolean("can_edit").notNull().default(false),
  canDelete: boolean("can_delete").notNull().default(false),
  canExport: boolean("can_export").notNull().default(false),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
export type RolePermission = typeof rolePermissions.$inferSelect;

// ─── LOGIN LOG (سجل الدخول) ───────────────────────────────────────────────────
export const loginLog = mysqlTable("login_log", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id"),
  email: varchar("email", { length: 200 }),
  ipAddress: varchar("ip_address", { length: 100 }),
  userAgent: text("user_agent"),
  status: mysqlEnum("status", ["success", "failed"]).notNull().default("success"),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
export type LoginLog = typeof loginLog.$inferSelect;

// ─── INTERNAL MESSAGES (الرسائل الداخلية) ────────────────────────────────────
export const internalMessages = mysqlTable("internal_messages", {
  id: int("id").autoincrement().primaryKey(),
  fromUserId: int("from_user_id").notNull(),
  toUserId: int("to_user_id").notNull(),
  subject: varchar("subject", { length: 300 }),
  body: text("body").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  parentId: int("parent_id"),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
export type InternalMessage = typeof internalMessages.$inferSelect;

// ─── WEBHOOKS (نقاط Webhook) ──────────────────────────────────────────────────
export const webhooks = mysqlTable("webhooks", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  url: text("url").notNull(),
  secret: varchar("secret", { length: 200 }),
  events: text("events").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  lastTriggeredAt: bigint("last_triggered_at", { mode: "number" }),
  failureCount: int("failure_count").notNull().default(0),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
export type Webhook = typeof webhooks.$inferSelect;

// ─── API USAGE LOG (سجل استخدام API) ─────────────────────────────────────────
export const apiUsageLog = mysqlTable("api_usage_log", {
  id: int("id").autoincrement().primaryKey(),
  apiKeyId: int("api_key_id").notNull(),
  endpoint: varchar("endpoint", { length: 300 }).notNull(),
  method: varchar("method", { length: 10 }).notNull(),
  statusCode: int("status_code"),
  ipAddress: varchar("ip_address", { length: 100 }),
  responseTimeMs: int("response_time_ms"),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
export type ApiUsageLog = typeof apiUsageLog.$inferSelect;

// ─── LISTING VIEWS (مشاهدات الإعلانات) ───────────────────────────────────────
export const listingViews = mysqlTable("listing_views", {
  id: int("id").autoincrement().primaryKey(),
  listingId: int("listing_id").notNull(),
  ipAddress: varchar("ip_address", { length: 100 }),
  source: varchar("source", { length: 100 }),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
export type ListingView = typeof listingViews.$inferSelect;

// ─── CONTRACT RENEWAL REQUESTS (طلبات تجديد العقود) ──────────────────────────
export const contractRenewalRequests = mysqlTable("contract_renewal_requests", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contract_id").notNull(),
  tenantId: int("tenant_id").notNull(),
  requestedRentAmount: decimal("requested_rent_amount", { precision: 12, scale: 2 }),
  notes: text("notes"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).notNull().default("pending"),
  reviewedBy: int("reviewed_by"),
  reviewedAt: bigint("reviewed_at", { mode: "number" }),
  createdAt: bigint("created_at", { mode: "number" }).notNull().$defaultFn(() => Date.now()),
});
export type ContractRenewalRequest = typeof contractRenewalRequests.$inferSelect;

// ─── FAL LICENSES (تراخيص فال) ───────────────────────────────────────────────
export const falLicenses = mysqlTable("fal_licenses", {
  id: int("id").autoincrement().primaryKey(),
  licenseNumber: varchar("licenseNumber", { length: 100 }).notNull(),
  holderName: varchar("holderName", { length: 255 }).notNull(),
  holderType: mysqlEnum("holderType", ["broker", "company", "agent"]).default("broker").notNull(),
  brokerId: int("brokerId"),
  licenseType: varchar("licenseType", { length: 100 }).default("وسيط عقاري"),
  issueDate: date("issueDate"),
  expiryDate: date("expiryDate").notNull(),
  status: mysqlEnum("status", ["active", "expired", "suspended", "pending_renewal"]).default("active").notNull(),
  reminderSent30: boolean("reminderSent30").default(false).notNull(),
  reminderSent7: boolean("reminderSent7").default(false).notNull(),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type FalLicense = typeof falLicenses.$inferSelect;
export type InsertFalLicense = typeof falLicenses.$inferInsert;

// ─── APPROVALS (الموافقات الداخلية) ──────────────────────────────────────────
export const approvals = mysqlTable("approvals", {
  id: int("id").autoincrement().primaryKey(),
  requestType: mysqlEnum("requestType", ["maintenance", "expense", "contract", "transfer", "other"]).default("maintenance").notNull(),
  referenceId: int("referenceId"),
  referenceType: varchar("referenceType", { length: 50 }),
  requestedBy: varchar("requestedBy", { length: 255 }),
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  amount: decimal("amount", { precision: 15, scale: 2 }),
  status: mysqlEnum("status", ["pending", "approved", "rejected", "cancelled"]).default("pending").notNull(),
  approvedBy: varchar("approvedBy", { length: 255 }),
  approvedAt: timestamp("approvedAt"),
  rejectedBy: varchar("rejectedBy", { length: 255 }),
  rejectedAt: timestamp("rejectedAt"),
  rejectionReason: text("rejectionReason"),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Approval = typeof approvals.$inferSelect;
export type InsertApproval = typeof approvals.$inferInsert;

// ─── INVOICES (الفواتير الإلكترونية - ZATCA) ──────────────────────────────
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull(),
  contractId: int("contract_id"),
  tenantId: int("tenant_id"),
  propertyId: int("property_id"),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  vatAmount: decimal("vat_amount", { precision: 12, scale: 2 }).default("0"),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  issueDate: bigint("issue_date", { mode: "number" }).notNull(),
  dueDate: bigint("due_date", { mode: "number" }).notNull(),
  paidDate: bigint("paid_date", { mode: "number" }),
  status: mysqlEnum("inv_status", ["draft","issued","paid","cancelled","overdue"]).default("draft"),
  description: text("description"),
  qrCode: text("qr_code"),
  zatcaUuid: varchar("zatca_uuid", { length: 100 }),
  notes: text("notes"),
  createdAt: bigint("created_at", { mode: "number" }).notNull(),
  updatedAt: bigint("updated_at", { mode: "number" }).notNull(),
});
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

// ─── UNIT RESERVATIONS (الحجوزات المسبقة) ─────────────────────────────────
export const unitReservations = mysqlTable("unit_reservations", {
  id: int("id").autoincrement().primaryKey(),
  unitId: int("unit_id").notNull(),
  propertyId: int("property_id").notNull(),
  applicantName: varchar("applicant_name", { length: 200 }).notNull(),
  applicantPhone: varchar("applicant_phone", { length: 50 }).notNull(),
  applicantEmail: varchar("applicant_email", { length: 200 }),
  applicantIdNumber: varchar("applicant_id_number", { length: 50 }),
  desiredStartDate: bigint("desired_start_date", { mode: "number" }).notNull(),
  desiredDurationMonths: int("desired_duration_months").default(12),
  depositAmount: decimal("deposit_amount", { precision: 12, scale: 2 }).default("0"),
  depositPaid: boolean("deposit_paid").default(false),
  depositPaidDate: bigint("deposit_paid_date", { mode: "number" }),
  status: mysqlEnum("res_status", ["pending","confirmed","cancelled","converted"]).default("pending"),
  notes: text("notes"),
  handledBy: int("handled_by"),
  confirmedAt: bigint("confirmed_at", { mode: "number" }),
  cancelledAt: bigint("cancelled_at", { mode: "number" }),
  cancellationReason: text("cancellation_reason"),
  createdAt: bigint("created_at_res", { mode: "number" }).notNull(),
  updatedAt: bigint("updated_at_res", { mode: "number" }).notNull(),
});
export type UnitReservation = typeof unitReservations.$inferSelect;
export type InsertUnitReservation = typeof unitReservations.$inferInsert;

// ─── EMAIL NOTIFICATION SETTINGS ──────────────────────────────────────────
export const emailNotificationSettings = mysqlTable("email_notification_settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  notifyContractExpiry: boolean("notify_contract_expiry").default(true),
  notifyPaymentReminder: boolean("notify_payment_reminder").default(true),
  notifyPaymentReceived: boolean("notify_payment_received").default(true),
  notifyMaintenanceUpdate: boolean("notify_maintenance_update").default(true),
  notifyNewReservation: boolean("notify_new_reservation").default(true),
  expiryDaysBefore: int("expiry_days_before").default(30),
  paymentReminderDaysBefore: int("payment_reminder_days_before").default(7),
  emailAddress: varchar("email_address", { length: 200 }),
  createdAt: bigint("created_at_ens", { mode: "number" }).notNull(),
  updatedAt: bigint("updated_at_ens", { mode: "number" }).notNull(),
});
export type EmailNotificationSetting = typeof emailNotificationSettings.$inferSelect;

// ─── EMAIL NOTIFICATION LOG ────────────────────────────────────────────────
export const emailNotificationLog = mysqlTable("email_notification_log", {
  id: int("id").autoincrement().primaryKey(),
  recipientEmail: varchar("recipient_email", { length: 200 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  body: text("body"),
  notificationType: varchar("notification_type", { length: 100 }),
  referenceId: int("reference_id"),
  status: mysqlEnum("enl_status", ["sent","failed","pending"]).default("pending"),
  sentAt: bigint("sent_at", { mode: "number" }),
  errorMessage: text("error_message"),
  createdAt: bigint("created_at_enl", { mode: "number" }).notNull(),
});
export type EmailNotificationLog = typeof emailNotificationLog.$inferSelect;
