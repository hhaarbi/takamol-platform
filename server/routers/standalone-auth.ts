/**
 * Standalone Auth Router — Email + Password + OTP
 * No Manus OAuth dependency.
 */
import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { users, userPasswords, otpCodes, refreshTokens } from "../../drizzle/schema";
import { eq, and, gt } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import {
  hashPassword,
  verifyPassword,
  generateTokens,
  verifyRefreshToken,
  generateOTP,
  otpExpiresAt,
  recordFailedLogin,
  clearLoginAttempts,
  isLoginLocked,
} from "../_core/auth";
import { sendOTPEmail, sendWelcomeEmail, sendResetPasswordEmail } from "../_core/email";
import { ENV } from "../_core/env";
import crypto from "crypto";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function setCookies(
  res: import("express").Response,
  accessToken: string,
  refreshToken: string
) {
  const isProduction = ENV.isProduction;
  const cookieOpts = {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? "strict" : "lax") as "strict" | "lax",
    path: "/",
  };
  res.cookie("access_token", accessToken, { ...cookieOpts, maxAge: 15 * 60 * 1000 });
  res.cookie("refresh_token", refreshToken, { ...cookieOpts, maxAge: 30 * 24 * 60 * 60 * 1000 });
}

function clearCookies(res: import("express").Response) {
  res.clearCookie("access_token", { path: "/" });
  res.clearCookie("refresh_token", { path: "/" });
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  return db;
}

export const standaloneAuthRouter = router({
  // ─── Register ─────────────────────────────────────────────────────────────
  register: publicProcedure
    .input(z.object({
      name: z.string().min(2).max(100),
      email: z.string().email().toLowerCase(),
      password: z.string().min(8).max(128),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await requireDb();

      const existing = await db.select({ id: users.id }).from(users)
        .where(eq(users.email, input.email)).limit(1);
      if (existing.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "البريد الإلكتروني مسجل مسبقاً" });
      }

      const openId = `local_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const [result] = await db.insert(users).values({
        openId,
        name: input.name,
        email: input.email,
        loginMethod: "email_password",
        role: "user",
      });

      const userId = (result as { insertId: number }).insertId;
      const passwordHash = await hashPassword(input.password);
      await db.insert(userPasswords).values({ userId, passwordHash, updatedAt: Date.now() });

      sendWelcomeEmail({ to: input.email, name: input.name }).catch(console.error);

      const tokens = generateTokens({ userId, openId, role: "user", companyId: null });
      await db.insert(refreshTokens).values({
        userId,
        tokenHash: hashToken(tokens.refreshToken),
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
        createdAt: Date.now(),
        ipAddress: ctx.req?.ip ?? null,
        userAgent: ctx.req?.headers["user-agent"] ?? null,
      });

      setCookies(ctx.res!, tokens.accessToken, tokens.refreshToken);
      return { success: true, userId, name: input.name, email: input.email };
    }),

  // ─── Login ────────────────────────────────────────────────────────────────
  login: publicProcedure
    .input(z.object({
      email: z.string().email().toLowerCase(),
      password: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      const identifier = input.email;

      if (isLoginLocked(identifier)) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "تم تجاوز عدد المحاولات. حاول بعد 15 دقيقة." });
      }

      const [user] = await db.select().from(users).where(eq(users.email, identifier)).limit(1);
      if (!user) {
        recordFailedLogin(identifier);
        throw new TRPCError({ code: "UNAUTHORIZED", message: "بيانات الدخول غير صحيحة" });
      }

      const [pwRecord] = await db.select().from(userPasswords)
        .where(eq(userPasswords.userId, user.id)).limit(1);
      if (!pwRecord) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "هذا الحساب لا يدعم تسجيل الدخول بكلمة المرور" });
      }

      const valid = await verifyPassword(input.password, pwRecord.passwordHash);
      if (!valid) {
        const { locked, remaining } = recordFailedLogin(identifier);
        if (locked) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "تم قفل الحساب مؤقتاً. حاول بعد 15 دقيقة." });
        }
        throw new TRPCError({ code: "UNAUTHORIZED", message: `بيانات الدخول غير صحيحة. المحاولات المتبقية: ${remaining}` });
      }

      clearLoginAttempts(identifier);

      const tokens = generateTokens({ userId: user.id, openId: user.openId, role: user.role, companyId: user.companyId });
      await db.insert(refreshTokens).values({
        userId: user.id,
        tokenHash: hashToken(tokens.refreshToken),
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
        createdAt: Date.now(),
        ipAddress: ctx.req?.ip ?? null,
        userAgent: ctx.req?.headers["user-agent"] ?? null,
      });

      setCookies(ctx.res!, tokens.accessToken, tokens.refreshToken);
      return { success: true, user: { id: user.id, name: user.name, email: user.email, role: user.role, companyId: user.companyId } };
    }),

  // ─── Refresh Token ────────────────────────────────────────────────────────
  refresh: publicProcedure.mutation(async ({ ctx }) => {
    const db = await requireDb();
    const refreshToken = ctx.req?.cookies?.refresh_token;
    if (!refreshToken) throw new TRPCError({ code: "UNAUTHORIZED", message: "No refresh token" });

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      clearCookies(ctx.res!);
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid refresh token" });
    }

    const tokenHash = hashToken(refreshToken);
    const [storedToken] = await db.select().from(refreshTokens)
      .where(and(eq(refreshTokens.tokenHash, tokenHash), gt(refreshTokens.expiresAt, Date.now())))
      .limit(1);

    if (!storedToken || storedToken.revokedAt) {
      clearCookies(ctx.res!);
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Refresh token revoked" });
    }

    const [user] = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
    if (!user) throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found" });

    await db.update(refreshTokens).set({ revokedAt: Date.now() }).where(eq(refreshTokens.id, storedToken.id));

    const tokens = generateTokens({ userId: user.id, openId: user.openId, role: user.role, companyId: user.companyId });
    await db.insert(refreshTokens).values({
      userId: user.id,
      tokenHash: hashToken(tokens.refreshToken),
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
      createdAt: Date.now(),
      ipAddress: ctx.req?.ip ?? null,
      userAgent: ctx.req?.headers["user-agent"] ?? null,
    });

    setCookies(ctx.res!, tokens.accessToken, tokens.refreshToken);
    return { success: true };
  }),

  // ─── Logout ───────────────────────────────────────────────────────────────
  logoutStandalone: publicProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    const refreshToken = ctx.req?.cookies?.refresh_token;
    if (refreshToken && db) {
      const tokenHash = hashToken(refreshToken);
      await db.update(refreshTokens).set({ revokedAt: Date.now() }).where(eq(refreshTokens.tokenHash, tokenHash));
    }
    clearCookies(ctx.res!);
    return { success: true };
  }),

  // ─── Send OTP ─────────────────────────────────────────────────────────────
  sendOTP: publicProcedure
    .input(z.object({
      email: z.string().email().toLowerCase(),
      purpose: z.enum(["verify_email", "reset_password", "login_2fa"]),
      name: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await requireDb();
      const windowStart = Date.now() - ENV.otpRateLimitWindow * 60 * 1000;

      const recentOTPs = await db.select({ id: otpCodes.id }).from(otpCodes)
        .where(and(eq(otpCodes.email, input.email), eq(otpCodes.purpose, input.purpose), gt(otpCodes.createdAt, windowStart)));

      if (recentOTPs.length >= 3) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: `تم إرسال الحد الأقصى من الرموز. حاول بعد ${ENV.otpRateLimitWindow} دقيقة.` });
      }

      const code = generateOTP();
      const expiresAt = otpExpiresAt().getTime();
      await db.insert(otpCodes).values({ email: input.email, code, purpose: input.purpose, attempts: 0, expiresAt, createdAt: Date.now() });

      const purposeLabel = input.purpose === "verify_email" ? "تأكيد البريد الإلكتروني"
        : input.purpose === "reset_password" ? "إعادة تعيين كلمة المرور" : "تسجيل الدخول";

      await sendOTPEmail({ to: input.email, otp: code, name: input.name, purpose: purposeLabel });
      return { success: true, expiresInMinutes: ENV.otpExpiryMinutes };
    }),

  // ─── Verify OTP ───────────────────────────────────────────────────────────
  verifyOTP: publicProcedure
    .input(z.object({
      email: z.string().email().toLowerCase(),
      code: z.string().length(6),
      purpose: z.enum(["verify_email", "reset_password", "login_2fa"]),
    }))
    .mutation(async ({ input }) => {
      const db = await requireDb();
      const now = Date.now();

      const [otp] = await db.select().from(otpCodes)
        .where(and(eq(otpCodes.email, input.email), eq(otpCodes.purpose, input.purpose), gt(otpCodes.expiresAt, now)))
        .orderBy(otpCodes.createdAt).limit(1);

      if (!otp) throw new TRPCError({ code: "NOT_FOUND", message: "الرمز غير موجود أو منتهي الصلاحية" });
      if (otp.usedAt) throw new TRPCError({ code: "BAD_REQUEST", message: "تم استخدام هذا الرمز مسبقاً" });
      if (otp.attempts >= ENV.otpMaxAttempts) throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "تم تجاوز عدد المحاولات" });

      if (otp.code !== input.code) {
        await db.update(otpCodes).set({ attempts: otp.attempts + 1 }).where(eq(otpCodes.id, otp.id));
        throw new TRPCError({ code: "UNAUTHORIZED", message: `الرمز غير صحيح. المحاولات المتبقية: ${ENV.otpMaxAttempts - otp.attempts - 1}` });
      }

      await db.update(otpCodes).set({ usedAt: now }).where(eq(otpCodes.id, otp.id));
      return { success: true, verified: true };
    }),

  // ─── Forgot Password ──────────────────────────────────────────────────────
  forgotPassword: publicProcedure
    .input(z.object({ email: z.string().email().toLowerCase() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (db) {
        const [user] = await db.select({ id: users.id, name: users.name }).from(users)
          .where(eq(users.email, input.email)).limit(1);

        if (user) {
          const code = generateOTP();
          const expiresAt = otpExpiresAt().getTime();
          await db.insert(otpCodes).values({ email: input.email, code, purpose: "reset_password", attempts: 0, expiresAt, createdAt: Date.now() });
          const resetUrl = `${ENV.appUrl || ""}/reset-password?email=${encodeURIComponent(input.email)}&code=${code}`;
          await sendResetPasswordEmail({ to: input.email, name: user.name ?? "المستخدم", resetUrl });
        }
      }
      return { success: true, message: "إذا كان البريد مسجلاً، ستصلك رسالة خلال دقائق." };
    }),

  // ─── Reset Password ───────────────────────────────────────────────────────
  resetPassword: publicProcedure
    .input(z.object({
      email: z.string().email().toLowerCase(),
      code: z.string().length(6),
      newPassword: z.string().min(8).max(128),
    }))
    .mutation(async ({ input }) => {
      const db = await requireDb();
      const now = Date.now();

      const [otp] = await db.select().from(otpCodes)
        .where(and(eq(otpCodes.email, input.email), eq(otpCodes.purpose, "reset_password"), gt(otpCodes.expiresAt, now)))
        .orderBy(otpCodes.createdAt).limit(1);

      if (!otp || otp.usedAt || otp.code !== input.code) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "الرمز غير صحيح أو منتهي الصلاحية" });
      }

      const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, input.email)).limit(1);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "المستخدم غير موجود" });

      const passwordHash = await hashPassword(input.newPassword);
      const existing = await db.select({ id: userPasswords.id }).from(userPasswords).where(eq(userPasswords.userId, user.id)).limit(1);

      if (existing.length > 0) {
        await db.update(userPasswords).set({ passwordHash, updatedAt: now }).where(eq(userPasswords.userId, user.id));
      } else {
        await db.insert(userPasswords).values({ userId: user.id, passwordHash, updatedAt: now });
      }

      await db.update(otpCodes).set({ usedAt: now }).where(eq(otpCodes.id, otp.id));
      await db.update(refreshTokens).set({ revokedAt: now }).where(eq(refreshTokens.userId, user.id));

      return { success: true, message: "تم تغيير كلمة المرور بنجاح" };
    }),

  // ─── Change Password (authenticated) ─────────────────────────────────────
  changePassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string().min(1),
      newPassword: z.string().min(8).max(128),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await requireDb();
      const [pwRecord] = await db.select().from(userPasswords).where(eq(userPasswords.userId, ctx.user.id)).limit(1);

      if (!pwRecord) throw new TRPCError({ code: "BAD_REQUEST", message: "لا توجد كلمة مرور مسجلة" });

      const valid = await verifyPassword(input.currentPassword, pwRecord.passwordHash);
      if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "كلمة المرور الحالية غير صحيحة" });

      const passwordHash = await hashPassword(input.newPassword);
      await db.update(userPasswords).set({ passwordHash, updatedAt: Date.now() }).where(eq(userPasswords.userId, ctx.user.id));
      return { success: true };
    }),
});
