import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  getDashboardStats, getProjectsByServiceType, getProjectsByStatus,
  getRecentActivity, listProjects, getProjectById, createProject, updateProject, deleteProject,
  getProjectMembers, addProjectMember, removeProjectMember,
  listTasks, getTaskById, createTask, updateTask, deleteTask,
  getTaskComments, createTaskComment, getTaskAttachments, createTaskAttachment,
  listEmployees, getEmployeeById, createEmployee, updateEmployee, deleteEmployee,
  listFreelancers, getFreelancerById, createFreelancer, updateFreelancer,
  listClients, getClientById, createClient, updateClient, deleteClient,
  listContracts, createContract, updateContract,
  listDepartments, createDepartment, updateDepartment,
  listAccounts, getAccountById, createAccount, updateAccount, deleteAccount,
  getNotifications, createNotification, markNotificationRead, markAllNotificationsRead, getUnreadCount,
  logActivity,
} from "./db";
import {
  loginWithCredentials, hashPassword, createSessionToken, verifySessionToken,
  INTERNAL_COOKIE_NAME,
} from "./internalAuth";

// ============================================================
// INTERNAL AUTH CONTEXT HELPER
// ============================================================
async function getInternalSession(req: any) {
  const token = req.cookies?.[INTERNAL_COOKIE_NAME];
  if (!token) return null;
  return verifySessionToken(token);
}

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN', message: 'غير مصرح' });
  return next({ ctx });
});

// ============================================================
// ROUTERS
// ============================================================
export const appRouter = router({
  system: systemRouter,

  // ---- OAuth Auth (Manus) ----
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      ctx.res.clearCookie(INTERNAL_COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ---- Internal Auth (username/password) ----
  internalAuth: router({
    login: publicProcedure
      .input(z.object({ username: z.string(), password: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const result = await loginWithCredentials(input.username, input.password);
        if (!result) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'اسم المستخدم أو كلمة المرور غير صحيحة' });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(INTERNAL_COOKIE_NAME, result.token, {
          ...cookieOptions,
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        return {
          id: result.account.id,
          username: result.account.username,
          role: result.account.role,
          employeeId: result.account.employeeId,
          freelancerId: result.account.freelancerId,
        };
      }),

    me: publicProcedure.query(async ({ ctx }) => {
      const session = await getInternalSession(ctx.req);
      if (!session) return null;
      const account = await getAccountById(session.accountId);
      if (!account || !account.isActive) return null;
      return {
        id: account.id,
        username: account.username,
        role: account.role,
        employeeId: account.employeeId,
        freelancerId: account.freelancerId,
      };
    }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(INTERNAL_COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true };
    }),

    // Admin creates accounts
    createAccount: protectedProcedure
      .input(z.object({
        username: z.string().min(3),
        password: z.string().min(6),
        role: z.enum(['admin', 'manager', 'employee', 'freelancer']),
        employeeId: z.number().optional(),
        freelancerId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const session = await getInternalSession(ctx.req);
        if (!session || session.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        const passwordHash = await hashPassword(input.password);
        await createAccount({
          username: input.username,
          passwordHash,
          role: input.role,
          employeeId: input.employeeId,
          freelancerId: input.freelancerId,
          createdBy: session.accountId,
        });
        return { success: true };
      }),

    listAccounts: protectedProcedure.query(async ({ ctx }) => {
      const session = await getInternalSession(ctx.req);
      if (!session || session.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
      return listAccounts();
    }),

    updateAccount: protectedProcedure
      .input(z.object({
        id: z.number(),
        role: z.enum(['admin', 'manager', 'employee', 'freelancer']).optional(),
        isActive: z.boolean().optional(),
        password: z.string().min(6).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const session = await getInternalSession(ctx.req);
        if (!session || session.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        const { id, password, ...rest } = input;
        const data: any = { ...rest };
        if (password) data.passwordHash = await hashPassword(password);
        await updateAccount(id, data);
        return { success: true };
      }),

    deleteAccount: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const session = await getInternalSession(ctx.req);
        if (!session || session.role !== 'admin') throw new TRPCError({ code: 'FORBIDDEN' });
        await deleteAccount(input.id);
        return { success: true };
      }),
  }),

  // ---- Dashboard ----
  dashboard: router({
    stats: publicProcedure.query(async () => {
      return getDashboardStats();
    }),
    projectsByServiceType: publicProcedure.query(async () => {
      return getProjectsByServiceType();
    }),
    projectsByStatus: publicProcedure.query(async () => {
      return getProjectsByStatus();
    }),
    recentActivity: publicProcedure.query(async () => {
      return getRecentActivity(15);
    }),
  }),

  // ---- Departments ----
  departments: router({
    list: publicProcedure.query(async () => listDepartments()),
    create: publicProcedure
      .input(z.object({ nameAr: z.string(), nameEn: z.string().optional(), description: z.string().optional() }))
      .mutation(async ({ input }) => {
        await createDepartment(input);
        return { success: true };
      }),
    update: publicProcedure
      .input(z.object({ id: z.number(), nameAr: z.string().optional(), nameEn: z.string().optional() }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateDepartment(id, data);
        return { success: true };
      }),
  }),

  // ---- Employees ----
  employees: router({
    list: publicProcedure
      .input(z.object({
        departmentId: z.number().optional(),
        isActive: z.boolean().optional(),
        search: z.string().optional(),
      }).optional())
      .query(async ({ input }) => listEmployees(input ?? {})),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => getEmployeeById(input.id)),

    create: publicProcedure
      .input(z.object({
        fullName: z.string(),
        email: z.string().optional(),
        phone: z.string().optional(),
        departmentId: z.number().optional(),
        jobTitle: z.string().optional(),
        salary: z.string().optional(),
        hireDate: z.date().optional(),
        skills: z.array(z.string()).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await createEmployee(input as any);
        return { success: true };
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        fullName: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        departmentId: z.number().optional(),
        jobTitle: z.string().optional(),
        salary: z.string().optional(),
        skills: z.array(z.string()).optional(),
        performanceScore: z.string().optional(),
        isActive: z.boolean().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateEmployee(id, data as any);
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteEmployee(input.id);
        return { success: true };
      }),
  }),

  // ---- Freelancers ----
  freelancers: router({
    list: publicProcedure
      .input(z.object({ isActive: z.boolean().optional(), search: z.string().optional() }).optional())
      .query(async ({ input }) => listFreelancers(input ?? {})),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => getFreelancerById(input.id)),

    create: publicProcedure
      .input(z.object({
        fullName: z.string(),
        email: z.string(),
        phone: z.string().optional(),
        specialty: z.string().optional(),
        skills: z.array(z.string()).optional(),
        hourlyRate: z.string().optional(),
        portfolio: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await createFreelancer(input as any);
        return { success: true };
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        fullName: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        specialty: z.string().optional(),
        skills: z.array(z.string()).optional(),
        hourlyRate: z.string().optional(),
        portfolio: z.string().optional(),
        rating: z.string().optional(),
        isActive: z.boolean().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateFreelancer(id, data as any);
        return { success: true };
      }),
  }),

  // ---- Clients ----
  clients: router({
    list: publicProcedure
      .input(z.object({ isActive: z.boolean().optional(), search: z.string().optional() }).optional())
      .query(async ({ input }) => listClients(input ?? {})),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => getClientById(input.id)),

    create: publicProcedure
      .input(z.object({
        companyName: z.string(),
        contactName: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        industry: z.string().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await createClient(input);
        return { success: true };
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        companyName: z.string().optional(),
        contactName: z.string().optional(),
        email: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        industry: z.string().optional(),
        isActive: z.boolean().optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateClient(id, data);
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteClient(input.id);
        return { success: true };
      }),
  }),

  // ---- Contracts ----
  contracts: router({
    list: publicProcedure
      .input(z.object({ clientId: z.number().optional() }).optional())
      .query(async ({ input }) => listContracts(input?.clientId)),

    create: publicProcedure
      .input(z.object({
        clientId: z.number(),
        title: z.string(),
        value: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        status: z.enum(['draft', 'active', 'completed', 'cancelled']).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await createContract(input as any);
        return { success: true };
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        value: z.string().optional(),
        status: z.enum(['draft', 'active', 'completed', 'cancelled']).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateContract(id, data as any);
        return { success: true };
      }),
  }),

  // ---- Projects ----
  projects: router({
    list: publicProcedure
      .input(z.object({
        status: z.string().optional(),
        serviceType: z.string().optional(),
        clientId: z.number().optional(),
        search: z.string().optional(),
      }).optional())
      .query(async ({ input }) => listProjects(input ?? {})),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => getProjectById(input.id)),

    create: publicProcedure
      .input(z.object({
        title: z.string(),
        description: z.string().optional(),
        clientId: z.number().optional(),
        contractId: z.number().optional(),
        serviceType: z.enum(['brand_identity', 'visual_production', 'advertising_campaigns', 'events', 'influencer_marketing', 'digital_presence', 'website_design']),
        status: z.enum(['draft', 'active', 'on_hold', 'under_review', 'completed', 'cancelled']).optional(),
        priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
        budget: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        managerId: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        await createProject(input as any);
        await logActivity({
          actorType: 'internal',
          actorId: 1,
          actorName: 'النظام',
          action: `تم إنشاء مشروع جديد: ${input.title}`,
          entityType: 'project',
          entityTitle: input.title,
        });
        return { success: true };
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(['draft', 'active', 'on_hold', 'under_review', 'completed', 'cancelled']).optional(),
        priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
        budget: z.string().optional(),
        progress: z.number().min(0).max(100).optional(),
        managerId: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await updateProject(id, data as any);
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteProject(input.id);
        return { success: true };
      }),

    getMembers: publicProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => getProjectMembers(input.projectId)),

    addMember: publicProcedure
      .input(z.object({
        projectId: z.number(),
        memberType: z.enum(['employee', 'freelancer']),
        employeeId: z.number().optional(),
        freelancerId: z.number().optional(),
        role: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await addProjectMember(input as any);
        return { success: true };
      }),

    removeMember: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await removeProjectMember(input.id);
        return { success: true };
      }),
  }),

  // ---- Tasks ----
  tasks: router({
    list: publicProcedure
      .input(z.object({
        projectId: z.number().optional(),
        status: z.string().optional(),
        assigneeEmployeeId: z.number().optional(),
        assigneeFreelancerId: z.number().optional(),
        search: z.string().optional(),
      }).optional())
      .query(async ({ input }) => listTasks(input ?? {})),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => getTaskById(input.id)),

    create: publicProcedure
      .input(z.object({
        projectId: z.number(),
        title: z.string(),
        description: z.string().optional(),
        status: z.enum(['pending', 'in_progress', 'under_review', 'completed', 'cancelled']).optional(),
        priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
        assigneeType: z.enum(['employee', 'freelancer']).optional(),
        assigneeEmployeeId: z.number().optional(),
        assigneeFreelancerId: z.number().optional(),
        assignedBy: z.number().optional(),
        dueDate: z.date().optional(),
        estimatedHours: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await createTask(input as any);
        // Create notification if assigned
        if (input.assigneeEmployeeId) {
          await createNotification({
            recipientType: 'employee',
            recipientId: input.assigneeEmployeeId,
            type: 'task_assigned',
            title: 'تم تعيين مهمة جديدة لك',
            message: `تم تعيين المهمة "${input.title}" لك`,
            relatedType: 'task',
          });
        }
        if (input.assigneeFreelancerId) {
          await createNotification({
            recipientType: 'freelancer',
            recipientId: input.assigneeFreelancerId,
            type: 'task_assigned',
            title: 'تم تعيين مهمة جديدة لك',
            message: `تم تعيين المهمة "${input.title}" لك`,
            relatedType: 'task',
          });
        }
        await logActivity({
          actorType: 'internal',
          actorId: 1,
          actorName: 'النظام',
          action: `تم إنشاء مهمة: ${input.title}`,
          entityType: 'task',
          entityTitle: input.title,
        });
        return { success: true };
      }),

    update: publicProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(['pending', 'in_progress', 'under_review', 'completed', 'cancelled']).optional(),
        priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
        assigneeType: z.enum(['employee', 'freelancer']).optional(),
        assigneeEmployeeId: z.number().optional(),
        assigneeFreelancerId: z.number().optional(),
        dueDate: z.date().optional(),
        actualHours: z.string().optional(),
        completedAt: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        if (data.status === 'completed') {
          (data as any).completedAt = new Date();
        }
        await updateTask(id, data as any);
        return { success: true };
      }),

    delete: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteTask(input.id);
        return { success: true };
      }),

    getComments: publicProcedure
      .input(z.object({ taskId: z.number() }))
      .query(async ({ input }) => getTaskComments(input.taskId)),

    addComment: publicProcedure
      .input(z.object({
        taskId: z.number(),
        authorType: z.enum(['internal', 'employee', 'freelancer']),
        authorId: z.number(),
        content: z.string(),
      }))
      .mutation(async ({ input }) => {
        await createTaskComment(input);
        return { success: true };
      }),

    getAttachments: publicProcedure
      .input(z.object({ taskId: z.number() }))
      .query(async ({ input }) => getTaskAttachments(input.taskId)),

    addAttachment: publicProcedure
      .input(z.object({
        taskId: z.number(),
        fileName: z.string(),
        fileUrl: z.string(),
        fileSize: z.number().optional(),
        mimeType: z.string().optional(),
        uploadedBy: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        await createTaskAttachment(input);
        return { success: true };
      }),
  }),

  // ---- Notifications ----
  notifications: router({
    list: publicProcedure
      .input(z.object({
        recipientId: z.number(),
        recipientType: z.enum(['internal', 'employee', 'freelancer']),
        unreadOnly: z.boolean().optional(),
      }))
      .query(async ({ input }) => getNotifications(input.recipientId, input.recipientType, input.unreadOnly)),

    unreadCount: publicProcedure
      .input(z.object({
        recipientId: z.number(),
        recipientType: z.enum(['internal', 'employee', 'freelancer']),
      }))
      .query(async ({ input }) => getUnreadCount(input.recipientId, input.recipientType)),

    markRead: publicProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await markNotificationRead(input.id);
        return { success: true };
      }),

    markAllRead: publicProcedure
      .input(z.object({
        recipientId: z.number(),
        recipientType: z.enum(['internal', 'employee', 'freelancer']),
      }))
      .mutation(async ({ input }) => {
        await markAllNotificationsRead(input.recipientId, input.recipientType);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
