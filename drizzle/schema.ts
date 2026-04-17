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
} from "drizzle-orm/mysql-core";

// ============================================================
// USERS TABLE (core auth)
// ============================================================
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["admin", "manager", "employee", "freelancer"]).default("employee").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================================
// INTERNAL ACCOUNTS (username/password login)
// ============================================================
export const internalAccounts = mysqlTable("internal_accounts", {
  id: int("id").autoincrement().primaryKey(),
  username: varchar("username", { length: 64 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 256 }).notNull(),
  role: mysqlEnum("role", ["admin", "manager", "employee", "freelancer"]).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  employeeId: int("employeeId"),
  freelancerId: int("freelancerId"),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn"),
});

export type InternalAccount = typeof internalAccounts.$inferSelect;
export type InsertInternalAccount = typeof internalAccounts.$inferInsert;

// ============================================================
// DEPARTMENTS
// ============================================================
export const departments = mysqlTable("departments", {
  id: int("id").autoincrement().primaryKey(),
  nameAr: varchar("nameAr", { length: 128 }).notNull(),
  nameEn: varchar("nameEn", { length: 128 }),
  description: text("description"),
  managerId: int("managerId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = typeof departments.$inferInsert;

// ============================================================
// EMPLOYEES
// ============================================================
export const employees = mysqlTable("employees", {
  id: int("id").autoincrement().primaryKey(),
  accountId: int("accountId"),
  fullName: varchar("fullName", { length: 128 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  departmentId: int("departmentId"),
  jobTitle: varchar("jobTitle", { length: 128 }),
  salary: decimal("salary", { precision: 12, scale: 2 }),
  hireDate: timestamp("hireDate"),
  skills: json("skills").$type<string[]>(),
  avatar: text("avatar"),
  isActive: boolean("isActive").default(true).notNull(),
  performanceScore: decimal("performanceScore", { precision: 5, scale: 2 }).default("0"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;

// ============================================================
// FREELANCERS
// ============================================================
export const freelancers = mysqlTable("freelancers", {
  id: int("id").autoincrement().primaryKey(),
  accountId: int("accountId"),
  fullName: varchar("fullName", { length: 128 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 32 }),
  specialty: varchar("specialty", { length: 128 }),
  skills: json("skills").$type<string[]>(),
  hourlyRate: decimal("hourlyRate", { precision: 10, scale: 2 }),
  portfolio: text("portfolio"),
  rating: decimal("rating", { precision: 3, scale: 2 }).default("0"),
  totalProjects: int("totalProjects").default(0),
  isActive: boolean("isActive").default(true).notNull(),
  inviteToken: varchar("inviteToken", { length: 128 }),
  inviteStatus: mysqlEnum("inviteStatus", ["pending", "accepted", "rejected"]).default("pending"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Freelancer = typeof freelancers.$inferSelect;
export type InsertFreelancer = typeof freelancers.$inferInsert;

// ============================================================
// CLIENTS
// ============================================================
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  companyName: varchar("companyName", { length: 256 }).notNull(),
  contactName: varchar("contactName", { length: 128 }),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 32 }),
  address: text("address"),
  industry: varchar("industry", { length: 128 }),
  logo: text("logo"),
  notes: text("notes"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

// ============================================================
// CONTRACTS
// ============================================================
export const contracts = mysqlTable("contracts", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  value: decimal("value", { precision: 14, scale: 2 }),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  status: mysqlEnum("status", ["draft", "active", "completed", "cancelled"]).default("draft").notNull(),
  fileUrl: text("fileUrl"),
  notes: text("notes"),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Contract = typeof contracts.$inferSelect;
export type InsertContract = typeof contracts.$inferInsert;

// ============================================================
// PROJECTS
// ============================================================
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  clientId: int("clientId"),
  contractId: int("contractId"),
  serviceType: mysqlEnum("serviceType", [
    "brand_identity",
    "visual_production",
    "advertising_campaigns",
    "events",
    "influencer_marketing",
    "digital_presence",
    "website_design",
  ]).notNull(),
  status: mysqlEnum("status", ["draft", "active", "on_hold", "under_review", "completed", "cancelled"]).default("draft").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  budget: decimal("budget", { precision: 14, scale: 2 }),
  actualCost: decimal("actualCost", { precision: 14, scale: 2 }).default("0"),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  managerId: int("managerId"),
  progress: int("progress").default(0),
  tags: json("tags").$type<string[]>(),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

// ============================================================
// PROJECT MEMBERS (team assigned to project)
// ============================================================
export const projectMembers = mysqlTable("project_members", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  memberType: mysqlEnum("memberType", ["employee", "freelancer"]).notNull(),
  employeeId: int("employeeId"),
  freelancerId: int("freelancerId"),
  role: varchar("role", { length: 128 }),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type ProjectMember = typeof projectMembers.$inferSelect;
export type InsertProjectMember = typeof projectMembers.$inferInsert;

// ============================================================
// TASKS
// ============================================================
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "in_progress", "under_review", "completed", "cancelled"]).default("pending").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  assigneeType: mysqlEnum("assigneeType", ["employee", "freelancer"]),
  assigneeEmployeeId: int("assigneeEmployeeId"),
  assigneeFreelancerId: int("assigneeFreelancerId"),
  assignedBy: int("assignedBy"),
  dueDate: timestamp("dueDate"),
  completedAt: timestamp("completedAt"),
  estimatedHours: decimal("estimatedHours", { precision: 8, scale: 2 }),
  actualHours: decimal("actualHours", { precision: 8, scale: 2 }),
  tags: json("tags").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

// ============================================================
// TASK COMMENTS
// ============================================================
export const taskComments = mysqlTable("task_comments", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId").notNull(),
  authorType: mysqlEnum("authorType", ["internal", "employee", "freelancer"]).notNull(),
  authorId: int("authorId").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TaskComment = typeof taskComments.$inferSelect;
export type InsertTaskComment = typeof taskComments.$inferInsert;

// ============================================================
// TASK ATTACHMENTS
// ============================================================
export const taskAttachments = mysqlTable("task_attachments", {
  id: int("id").autoincrement().primaryKey(),
  taskId: int("taskId").notNull(),
  fileName: varchar("fileName", { length: 256 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileSize: int("fileSize"),
  mimeType: varchar("mimeType", { length: 128 }),
  uploadedBy: int("uploadedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TaskAttachment = typeof taskAttachments.$inferSelect;
export type InsertTaskAttachment = typeof taskAttachments.$inferInsert;

// ============================================================
// NOTIFICATIONS
// ============================================================
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  recipientType: mysqlEnum("recipientType", ["internal", "employee", "freelancer"]).notNull(),
  recipientId: int("recipientId").notNull(),
  type: mysqlEnum("type", [
    "task_assigned",
    "task_updated",
    "task_completed",
    "project_created",
    "project_updated",
    "deadline_reminder",
    "comment_added",
    "general",
  ]).notNull(),
  title: varchar("title", { length: 256 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  relatedType: varchar("relatedType", { length: 64 }),
  relatedId: int("relatedId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

// ============================================================
// ACTIVITY LOG
// ============================================================
export const activityLog = mysqlTable("activity_log", {
  id: int("id").autoincrement().primaryKey(),
  actorType: mysqlEnum("actorType", ["internal", "employee", "freelancer"]).notNull(),
  actorId: int("actorId").notNull(),
  actorName: varchar("actorName", { length: 128 }),
  action: varchar("action", { length: 256 }).notNull(),
  entityType: varchar("entityType", { length: 64 }),
  entityId: int("entityId"),
  entityTitle: varchar("entityTitle", { length: 256 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLog.$inferSelect;
export type InsertActivityLog = typeof activityLog.$inferInsert;
