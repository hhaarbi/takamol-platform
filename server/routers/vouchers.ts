import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { eq, desc, and, like, or, gte, lte, sql } from "drizzle-orm";
import { getDb } from "../db";

export const vouchersRouter = router({
  // ─── قائمة السندات مع pagination ─────────────────────────────────────────
  list: protectedProcedure.input(z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(20),
    type: z.enum(["receipt", "payment", "all"]).default("all"),
    search: z.string().optional(),
    fromDate: z.number().optional(),
    toDate: z.number().optional(),
    status: z.enum(["draft", "issued", "cancelled", "all"]).default("all"),
  })).query(async ({ input }) => {
    const db = await getDb();
    if (!db) return { items: [], total: 0, page: input.page, totalPages: 0 };
    const { vouchers } = await import("../../drizzle/schema");
    const offset = (input.page - 1) * input.limit;
    const conditions = [];
    if (input.type !== "all") conditions.push(eq(vouchers.type, input.type));
    if (input.status !== "all") conditions.push(eq(vouchers.status, input.status));
    if (input.search) {
      conditions.push(or(
        like(vouchers.voucherNumber, `%${input.search}%`),
        like(vouchers.payerName, `%${input.search}%`),
        like(vouchers.receiverName, `%${input.search}%`),
        like(vouchers.description, `%${input.search}%`)
      ));
    }
    if (input.fromDate) conditions.push(gte(vouchers.issuedAt, input.fromDate));
    if (input.toDate) conditions.push(lte(vouchers.issuedAt, input.toDate));
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const [items, countResult] = await Promise.all([
      db.select().from(vouchers).where(where).orderBy(desc(vouchers.issuedAt)).limit(input.limit).offset(offset),
      db.select({ count: sql<number>`COUNT(*)` }).from(vouchers).where(where),
    ]);
    const total = Number(countResult[0]?.count ?? 0);
    return { items, total, page: input.page, totalPages: Math.ceil(total / input.limit) };
  }),

  // ─── تفاصيل سند واحد ─────────────────────────────────────────────────────
  getById: protectedProcedure.input(z.number()).query(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "NOT_FOUND" });
    const { vouchers } = await import("../../drizzle/schema");
    const result = await db.select().from(vouchers).where(eq(vouchers.id, input)).limit(1);
    if (!result[0]) throw new TRPCError({ code: "NOT_FOUND", message: "السند غير موجود" });
    return result[0];
  }),

  // ─── إنشاء سند جديد ──────────────────────────────────────────────────────
  create: protectedProcedure.input(z.object({
    type: z.enum(["receipt", "payment"]),
    amount: z.number().positive(),
    description: z.string().optional(),
    payerName: z.string().optional(),
    payerPhone: z.string().optional(),
    receiverName: z.string().optional(),
    paymentMethod: z.enum(["cash", "bank_transfer", "check", "online"]).default("cash"),
    bankName: z.string().optional(),
    checkNumber: z.string().optional(),
    relatedContractId: z.number().optional(),
    relatedPaymentId: z.number().optional(),
    relatedPropertyId: z.number().optional(),
    notes: z.string().optional(),
    issuedAt: z.number().optional(),
  })).mutation(async ({ input, ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const { vouchers } = await import("../../drizzle/schema");
    const now = Date.now();
    // توليد رقم سند تلقائي
    const prefix = input.type === "receipt" ? "RCV" : "PAY";
    const seq = Math.floor(Math.random() * 90000) + 10000;
    const voucherNumber = `${prefix}-${new Date().getFullYear()}-${seq}`;
    await db.insert(vouchers).values({
      voucherNumber,
      type: input.type,
      amount: String(input.amount),
      description: input.description,
      payerName: input.payerName,
      payerPhone: input.payerPhone,
      receiverName: input.receiverName,
      paymentMethod: input.paymentMethod,
      bankName: input.bankName,
      checkNumber: input.checkNumber,
      relatedContractId: input.relatedContractId,
      relatedPaymentId: input.relatedPaymentId,
      relatedPropertyId: input.relatedPropertyId,
      status: "issued",
      notes: input.notes,
      createdBy: ctx.user.id,
      issuedAt: input.issuedAt ?? now,
      createdAt: now,
      updatedAt: now,
    });
    const created = await db.select().from(vouchers).where(eq(vouchers.voucherNumber, voucherNumber)).limit(1);
    return created[0];
  }),

  // ─── تحديث سند ───────────────────────────────────────────────────────────
  update: protectedProcedure.input(z.object({
    id: z.number(),
    description: z.string().optional(),
    payerName: z.string().optional(),
    payerPhone: z.string().optional(),
    receiverName: z.string().optional(),
    paymentMethod: z.enum(["cash", "bank_transfer", "check", "online"]).optional(),
    bankName: z.string().optional(),
    checkNumber: z.string().optional(),
    notes: z.string().optional(),
    status: z.enum(["draft", "issued", "cancelled"]).optional(),
  })).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const { vouchers } = await import("../../drizzle/schema");
    const { id, ...rest } = input;
    await db.update(vouchers).set({ ...rest, updatedAt: Date.now() }).where(eq(vouchers.id, id));
    return { success: true };
  }),

  // ─── إلغاء سند ───────────────────────────────────────────────────────────
  cancel: protectedProcedure.input(z.number()).mutation(async ({ input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const { vouchers } = await import("../../drizzle/schema");
    await db.update(vouchers).set({ status: "cancelled", updatedAt: Date.now() }).where(eq(vouchers.id, input));
    return { success: true };
  }),

  // ─── إحصائيات السندات ────────────────────────────────────────────────────
  stats: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { totalReceipts: 0, totalPayments: 0, receiptAmount: 0, paymentAmount: 0, balance: 0 };
    const { vouchers } = await import("../../drizzle/schema");
    const all = await db.select().from(vouchers).where(eq(vouchers.status, "issued"));
    let receiptAmount = 0, paymentAmount = 0;
    for (const v of all) {
      const amt = parseFloat(String(v.amount)) || 0;
      if (v.type === "receipt") receiptAmount += amt;
      else paymentAmount += amt;
    }
    const receipts = all.filter(v => v.type === "receipt");
    const payments = all.filter(v => v.type === "payment");
    return {
      totalReceipts: receipts.length,
      totalPayments: payments.length,
      receiptAmount,
      paymentAmount,
      balance: receiptAmount - paymentAmount,
    };
  }),
});
