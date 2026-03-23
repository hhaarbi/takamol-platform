import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  incrementPropertyView,
  getLeads,
  getLeadsCount,
  updateLead,
  getChatHistory,
  getOrCreateChatSession,
  saveChatMessage,
  createLead,
  updateLeadBySession,
  getLeadBySession,
  linkSessionToLead,
} from "./db";
import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import { notifyOwner } from "./_core/notification";
import { nanoid } from "nanoid";

// Admin guard
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin only" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Properties ────────────────────────────────────────────────────────────
  properties: router({
    list: publicProcedure
      .input(
        z.object({
          listingType: z.enum(["sale", "rent"]).optional(),
          type: z.string().optional(),
          city: z.string().optional(),
          featured: z.boolean().optional(),
          search: z.string().optional(),
          limit: z.number().min(1).max(100).default(20),
          offset: z.number().min(0).default(0),
        })
      )
      .query(({ input }) => getProperties({ ...input, available: true })),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const prop = await getPropertyById(input.id);
        if (!prop) throw new TRPCError({ code: "NOT_FOUND" });
        await incrementPropertyView(input.id);
        return prop;
      }),

    create: adminProcedure
      .input(
        z.object({
          title: z.string(),
          titleAr: z.string(),
          description: z.string().optional(),
          descriptionAr: z.string().optional(),
          type: z.enum(["apartment", "villa", "land", "commercial", "office", "warehouse"]),
          listingType: z.enum(["sale", "rent"]),
          price: z.string(),
          priceUnit: z.enum(["total", "per_month", "per_year"]).default("total"),
          area: z.string().optional(),
          bedrooms: z.number().optional(),
          bathrooms: z.number().optional(),
          floor: z.number().optional(),
          totalFloors: z.number().optional(),
          city: z.string().optional(),
          district: z.string().optional(),
          address: z.string().optional(),
          images: z.array(z.string()).default([]),
          features: z.array(z.string()).default([]),
          featuresAr: z.array(z.string()).default([]),
          isAvailable: z.boolean().default(true),
          isFeatured: z.boolean().default(false),
          negotiable: z.boolean().default(true),
          minPrice: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        await createProperty(input as any);
        return { success: true };
      }),

    update: adminProcedure
      .input(
        z.object({
          id: z.number(),
          data: z.object({
            title: z.string().optional(),
            titleAr: z.string().optional(),
            description: z.string().optional(),
            descriptionAr: z.string().optional(),
            price: z.string().optional(),
            isAvailable: z.boolean().optional(),
            isFeatured: z.boolean().optional(),
            images: z.array(z.string()).optional(),
            featuresAr: z.array(z.string()).optional(),
          }),
        })
      )
      .mutation(async ({ input }) => {
        await updateProperty(input.id, input.data as any);
        return { success: true };
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteProperty(input.id);
        return { success: true };
      }),

    uploadImage: adminProcedure
      .input(
        z.object({
          base64: z.string(),
          filename: z.string(),
          mimeType: z.string().default("image/jpeg"),
        })
      )
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.base64, "base64");
        const key = `properties/${nanoid()}-${input.filename}`;
        const { url } = await storagePut(key, buffer, input.mimeType);
        return { url };
      }),
  }),

  // ─── Leads ─────────────────────────────────────────────────────────────────
  leads: router({
    list: adminProcedure
      .input(
        z.object({
          status: z.string().optional(),
          serviceType: z.string().optional(),
          search: z.string().optional(),
          limit: z.number().default(100),
          offset: z.number().default(0),
        })
      )
      .query(({ input }) => getLeads(input)),

    count: adminProcedure.query(() => getLeadsCount()),

    updateStatus: adminProcedure
      .input(
        z.object({
          id: z.number(),
          status: z.enum(["new", "contacted", "qualified", "closed", "lost"]),
        })
      )
      .mutation(async ({ input }) => {
        await updateLead(input.id, { status: input.status });
        return { success: true };
      }),

    getChatHistory: adminProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(({ input }) => getChatHistory(input.sessionId, 100)),
  }),

  // ─── Chat (public) ─────────────────────────────────────────────────────────
  chat: router({
    sendMessage: publicProcedure
      .input(
        z.object({
          sessionId: z.string(),
          message: z.string().min(1).max(2000),
        })
      )
      .mutation(async ({ input }) => {
        const { sessionId, message } = input;

        await getOrCreateChatSession(sessionId);
        await saveChatMessage(sessionId, "user", message);

        const history = await getChatHistory(sessionId, 20);

        let propertiesContext = "";
        try {
          const props = await getProperties({ available: true, limit: 8 });
          if (props.length > 0) {
            propertiesContext =
              "\n\nالعقارات المتاحة:\n" +
              props
                .map(
                  (p) =>
                    `- ${p.titleAr} | ${p.listingType === "sale" ? "للبيع" : "للإيجار"} | ${Number(p.price).toLocaleString("ar-SA")} ريال | ${p.city}`
                )
                .join("\n");
          }
        } catch (e) {}

        const SYSTEM = `أنت مساعد عقاري ذكي لشركة "تكامل لإدارة الأملاك" في المدينة المنورة.
تحدث بالعربية دائماً. كن ودوداً ومحترفاً. اجمع: الاسم، الجوال، نوع الخدمة.
خدماتنا: بيع، شراء، إيجار، إدارة أملاك. واتساب: wa.me/966558018151${propertiesContext}`;

        const messages = [
          { role: "system" as const, content: SYSTEM },
          ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content as string })),
        ];

        const response = await invokeLLM({ messages });
        const rawReply = response.choices?.[0]?.message?.content;
        const reply = (typeof rawReply === "string" ? rawReply : "") || "عذراً، حدث خطأ مؤقت.";

        await saveChatMessage(sessionId, "assistant", reply);

        try {
          const extractResponse = await invokeLLM({
            messages: [
              { role: "system", content: "استخرج بيانات العميل. أعد JSON فقط." },
              {
                role: "user",
                content: `${history.map((m) => `${m.role}: ${m.content}`).join("\n")}\nuser: ${message}`,
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "lead_data",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    phone: { type: "string" },
                    serviceType: {
                      type: "string",
                      enum: ["buy", "sell", "rent_looking", "rent_listing", "property_management", "unknown"],
                    },
                    budget: { type: "string" },
                    preferredCity: { type: "string" },
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
            await createLead({
              name: extracted.name || null,
              phone: extracted.phone || null,
              serviceType: extracted.serviceType || "unknown",
              budget: extracted.budget || null,
              preferredCity: extracted.preferredCity || null,
              sessionId,
              source: "chat",
              status: "new",
            });
            const newLead = await getLeadBySession(sessionId);
            if (newLead) await linkSessionToLead(sessionId, newLead.id);

            if (extracted.name || extracted.phone) {
              await notifyOwner({
                title: "عميل جديد من الموقع",
                content: `👤 ${extracted.name || "غير محدد"} | 📱 ${extracted.phone || "غير محدد"} | 🎯 ${extracted.serviceType || "غير محدد"}`,
              });
            }
          } else {
            const updates: Record<string, unknown> = {};
            if (extracted.name && !existingLead.name) updates.name = extracted.name;
            if (extracted.phone && !existingLead.phone) updates.phone = extracted.phone;
            if (extracted.serviceType !== "unknown" && existingLead.serviceType === "unknown")
              updates.serviceType = extracted.serviceType;
            if (extracted.budget && !existingLead.budget) updates.budget = extracted.budget;
            if (Object.keys(updates).length > 0) await updateLeadBySession(sessionId, updates as any);
          }
        } catch (e) {}

        return { reply };
      }),

    getHistory: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(({ input }) => getChatHistory(input.sessionId, 50)),
  }),
});

export type AppRouter = typeof appRouter;
