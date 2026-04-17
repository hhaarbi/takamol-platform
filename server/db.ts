import { and, desc, eq, like, or, sql, count, sum, ne } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  internalAccounts, InsertInternalAccount,
  departments, InsertDepartment,
  employees, InsertEmployee,
  freelancers, InsertFreelancer,
  clients, InsertClient,
  contracts, InsertContract,
  projects, InsertProject,
  projectMembers, InsertProjectMember,
  tasks, InsertTask,
  taskComments, InsertTaskComment,
  taskAttachments, InsertTaskAttachment,
  notifications, InsertNotification,
  activityLog, InsertActivityLog,
} from "../drizzle/schema";
import { ENV } from './_core/env';

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

// ============================================================
// USERS (OAuth)
// ============================================================
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach((field) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  });

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = 'admin';
    updateSet.role = 'admin';
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============================================================
// INTERNAL ACCOUNTS (username/password)
// ============================================================
export async function getAccountByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(internalAccounts)
    .where(and(eq(internalAccounts.username, username), eq(internalAccounts.isActive, true)))
    .limit(1);
  return result[0] ?? undefined;
}

export async function getAccountById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(internalAccounts).where(eq(internalAccounts.id, id)).limit(1);
  return result[0] ?? undefined;
}

export async function createAccount(data: InsertInternalAccount) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(internalAccounts).values(data);
  return result[0];
}

export async function updateAccountLastSignIn(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(internalAccounts).set({ lastSignedIn: new Date() }).where(eq(internalAccounts.id, id));
}

export async function listAccounts(filters?: { role?: string; isActive?: boolean }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.role) conditions.push(eq(internalAccounts.role, filters.role as any));
  if (filters?.isActive !== undefined) conditions.push(eq(internalAccounts.isActive, filters.isActive));
  return db.select().from(internalAccounts)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(internalAccounts.createdAt));
}

export async function updateAccount(id: number, data: Partial<InsertInternalAccount>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(internalAccounts).set(data).where(eq(internalAccounts.id, id));
}

export async function deleteAccount(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(internalAccounts).set({ isActive: false }).where(eq(internalAccounts.id, id));
}

// ============================================================
// DEPARTMENTS
// ============================================================
export async function listDepartments() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(departments).orderBy(departments.nameAr);
}

export async function createDepartment(data: InsertDepartment) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(departments).values(data);
  return result[0];
}

export async function updateDepartment(id: number, data: Partial<InsertDepartment>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(departments).set(data).where(eq(departments.id, id));
}

// ============================================================
// EMPLOYEES
// ============================================================
export async function listEmployees(filters?: { departmentId?: number; isActive?: boolean; search?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.departmentId) conditions.push(eq(employees.departmentId, filters.departmentId));
  if (filters?.isActive !== undefined) conditions.push(eq(employees.isActive, filters.isActive));
  if (filters?.search) conditions.push(like(employees.fullName, `%${filters.search}%`));
  return db.select().from(employees)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(employees.fullName);
}

export async function getEmployeeById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(employees).where(eq(employees.id, id)).limit(1);
  return result[0] ?? undefined;
}

export async function createEmployee(data: InsertEmployee) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(employees).values(data);
  return result[0];
}

export async function updateEmployee(id: number, data: Partial<InsertEmployee>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(employees).set(data).where(eq(employees.id, id));
}

export async function deleteEmployee(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(employees).set({ isActive: false }).where(eq(employees.id, id));
}

// ============================================================
// FREELANCERS
// ============================================================
export async function listFreelancers(filters?: { isActive?: boolean; search?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.isActive !== undefined) conditions.push(eq(freelancers.isActive, filters.isActive));
  if (filters?.search) conditions.push(
    or(like(freelancers.fullName, `%${filters.search}%`), like(freelancers.specialty, `%${filters.search}%`))
  );
  return db.select().from(freelancers)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(freelancers.fullName);
}

export async function getFreelancerById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(freelancers).where(eq(freelancers.id, id)).limit(1);
  return result[0] ?? undefined;
}

export async function createFreelancer(data: InsertFreelancer) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(freelancers).values(data);
  return result[0];
}

export async function updateFreelancer(id: number, data: Partial<InsertFreelancer>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(freelancers).set(data).where(eq(freelancers.id, id));
}

// ============================================================
// CLIENTS
// ============================================================
export async function listClients(filters?: { isActive?: boolean; search?: string }) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.isActive !== undefined) conditions.push(eq(clients.isActive, filters.isActive));
  if (filters?.search) conditions.push(
    or(like(clients.companyName, `%${filters.search}%`), like(clients.contactName, `%${filters.search}%`))
  );
  return db.select().from(clients)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(clients.companyName);
}

export async function getClientById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return result[0] ?? undefined;
}

export async function createClient(data: InsertClient) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(clients).values(data);
  return result[0];
}

export async function updateClient(id: number, data: Partial<InsertClient>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(clients).set(data).where(eq(clients.id, id));
}

export async function deleteClient(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(clients).set({ isActive: false }).where(eq(clients.id, id));
}

// ============================================================
// CONTRACTS
// ============================================================
export async function listContracts(clientId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = clientId ? [eq(contracts.clientId, clientId)] : [];
  return db.select().from(contracts)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(contracts.createdAt));
}

export async function createContract(data: InsertContract) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(contracts).values(data);
  return result[0];
}

export async function updateContract(id: number, data: Partial<InsertContract>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(contracts).set(data).where(eq(contracts.id, id));
}

// ============================================================
// PROJECTS
// ============================================================
export async function listProjects(filters?: {
  status?: string; serviceType?: string; clientId?: number;
  managerId?: number; search?: string;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.status) conditions.push(eq(projects.status, filters.status as any));
  if (filters?.serviceType) conditions.push(eq(projects.serviceType, filters.serviceType as any));
  if (filters?.clientId) conditions.push(eq(projects.clientId, filters.clientId));
  if (filters?.managerId) conditions.push(eq(projects.managerId, filters.managerId));
  if (filters?.search) conditions.push(like(projects.title, `%${filters.search}%`));
  return db.select().from(projects)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(projects.createdAt));
}

export async function getProjectById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return result[0] ?? undefined;
}

export async function createProject(data: InsertProject) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(projects).values(data);
  return result[0];
}

export async function updateProject(id: number, data: Partial<InsertProject>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(projects).set(data).where(eq(projects.id, id));
}

export async function deleteProject(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(projects).set({ status: 'cancelled' }).where(eq(projects.id, id));
}

// ============================================================
// PROJECT MEMBERS
// ============================================================
export async function getProjectMembers(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projectMembers).where(eq(projectMembers.projectId, projectId));
}

export async function addProjectMember(data: InsertProjectMember) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.insert(projectMembers).values(data);
}

export async function removeProjectMember(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(projectMembers).where(eq(projectMembers.id, id));
}

// ============================================================
// TASKS
// ============================================================
export async function listTasks(filters?: {
  projectId?: number; status?: string; assigneeEmployeeId?: number;
  assigneeFreelancerId?: number; search?: string;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.projectId) conditions.push(eq(tasks.projectId, filters.projectId));
  if (filters?.status) conditions.push(eq(tasks.status, filters.status as any));
  if (filters?.assigneeEmployeeId) conditions.push(eq(tasks.assigneeEmployeeId, filters.assigneeEmployeeId));
  if (filters?.assigneeFreelancerId) conditions.push(eq(tasks.assigneeFreelancerId, filters.assigneeFreelancerId));
  if (filters?.search) conditions.push(like(tasks.title, `%${filters.search}%`));
  return db.select().from(tasks)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(tasks.createdAt));
}

export async function getTaskById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  return result[0] ?? undefined;
}

export async function createTask(data: InsertTask) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(tasks).values(data);
  return result[0];
}

export async function updateTask(id: number, data: Partial<InsertTask>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(tasks).set(data).where(eq(tasks.id, id));
}

export async function deleteTask(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(tasks).set({ status: 'cancelled' }).where(eq(tasks.id, id));
}

// ============================================================
// TASK COMMENTS
// ============================================================
export async function getTaskComments(taskId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(taskComments)
    .where(eq(taskComments.taskId, taskId))
    .orderBy(taskComments.createdAt);
}

export async function createTaskComment(data: InsertTaskComment) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(taskComments).values(data);
  return result[0];
}

// ============================================================
// TASK ATTACHMENTS
// ============================================================
export async function getTaskAttachments(taskId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(taskAttachments).where(eq(taskAttachments.taskId, taskId));
}

export async function createTaskAttachment(data: InsertTaskAttachment) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(taskAttachments).values(data);
  return result[0];
}

// ============================================================
// NOTIFICATIONS
// ============================================================
export async function getNotifications(recipientId: number, recipientType: string, unreadOnly = false) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [
    eq(notifications.recipientId, recipientId),
    eq(notifications.recipientType, recipientType as any),
  ];
  if (unreadOnly) conditions.push(eq(notifications.isRead, false));
  return db.select().from(notifications)
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
}

export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values(data);
}

export async function markNotificationRead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}

export async function markAllNotificationsRead(recipientId: number, recipientType: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications)
    .set({ isRead: true })
    .where(and(
      eq(notifications.recipientId, recipientId),
      eq(notifications.recipientType, recipientType as any),
    ));
}

export async function getUnreadCount(recipientId: number, recipientType: string) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.select({ cnt: count() }).from(notifications)
    .where(and(
      eq(notifications.recipientId, recipientId),
      eq(notifications.recipientType, recipientType as any),
      eq(notifications.isRead, false),
    ));
  return Number(result[0]?.cnt ?? 0);
}

// ============================================================
// ACTIVITY LOG
// ============================================================
export async function logActivity(data: InsertActivityLog) {
  const db = await getDb();
  if (!db) return;
  await db.insert(activityLog).values(data);
}

export async function getRecentActivity(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(activityLog).orderBy(desc(activityLog.createdAt)).limit(limit);
}

// ============================================================
// DASHBOARD STATS
// ============================================================
export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return null;

  const [
    totalProjects,
    activeProjects,
    completedProjects,
    totalTasks,
    pendingTasks,
    inProgressTasks,
    completedTasks,
    totalEmployees,
    totalFreelancers,
    totalClients,
    totalRevenue,
  ] = await Promise.all([
    db.select({ cnt: count() }).from(projects),
    db.select({ cnt: count() }).from(projects).where(eq(projects.status, 'active')),
    db.select({ cnt: count() }).from(projects).where(eq(projects.status, 'completed')),
    db.select({ cnt: count() }).from(tasks),
    db.select({ cnt: count() }).from(tasks).where(eq(tasks.status, 'pending')),
    db.select({ cnt: count() }).from(tasks).where(eq(tasks.status, 'in_progress')),
    db.select({ cnt: count() }).from(tasks).where(eq(tasks.status, 'completed')),
    db.select({ cnt: count() }).from(employees).where(eq(employees.isActive, true)),
    db.select({ cnt: count() }).from(freelancers).where(eq(freelancers.isActive, true)),
    db.select({ cnt: count() }).from(clients).where(eq(clients.isActive, true)),
    db.select({ total: sum(contracts.value) }).from(contracts).where(eq(contracts.status, 'active')),
  ]);

  return {
    totalProjects: Number(totalProjects[0]?.cnt ?? 0),
    activeProjects: Number(activeProjects[0]?.cnt ?? 0),
    completedProjects: Number(completedProjects[0]?.cnt ?? 0),
    totalTasks: Number(totalTasks[0]?.cnt ?? 0),
    pendingTasks: Number(pendingTasks[0]?.cnt ?? 0),
    inProgressTasks: Number(inProgressTasks[0]?.cnt ?? 0),
    completedTasks: Number(completedTasks[0]?.cnt ?? 0),
    totalEmployees: Number(totalEmployees[0]?.cnt ?? 0),
    totalFreelancers: Number(totalFreelancers[0]?.cnt ?? 0),
    totalClients: Number(totalClients[0]?.cnt ?? 0),
    totalRevenue: Number(totalRevenue[0]?.total ?? 0),
  };
}

export async function getProjectsByServiceType() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    serviceType: projects.serviceType,
    cnt: count(),
  }).from(projects).groupBy(projects.serviceType);
}

export async function getProjectsByStatus() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    status: projects.status,
    cnt: count(),
  }).from(projects).groupBy(projects.status);
}
