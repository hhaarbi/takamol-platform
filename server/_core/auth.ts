/**
 * Standalone Auth System — JWT + bcrypt + Refresh Token
 * No dependency on Manus OAuth.
 * Works on any VPS with DATABASE_URL + JWT_SECRET + JWT_REFRESH_SECRET.
 */
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { ENV } from "./env";

// ─── Constants ────────────────────────────────────────────────────────────────
const BCRYPT_ROUNDS = 12;
const ACCESS_TOKEN_TTL = "15m";
const REFRESH_TOKEN_TTL = "30d";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface JwtPayload {
  userId: number;
  openId: string;
  role: string;
  companyId?: number | null;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// ─── Password Hashing ─────────────────────────────────────────────────────────
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

// ─── Token Generation ─────────────────────────────────────────────────────────
export function generateTokens(payload: JwtPayload): TokenPair {
  const accessToken = jwt.sign(payload, ENV.jwtSecret, {
    expiresIn: ACCESS_TOKEN_TTL,
  });
  const refreshToken = jwt.sign(
    { userId: payload.userId, openId: payload.openId },
    ENV.jwtRefreshSecret,
    { expiresIn: REFRESH_TOKEN_TTL }
  );
  return { accessToken, refreshToken };
}

// ─── Token Verification ───────────────────────────────────────────────────────
export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, ENV.jwtSecret) as JwtPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): { userId: number; openId: string } | null {
  try {
    return jwt.verify(token, ENV.jwtRefreshSecret) as { userId: number; openId: string };
  } catch {
    return null;
  }
}

// ─── OTP Generation ───────────────────────────────────────────────────────────
export function generateOTP(): string {
  // 6-digit numeric OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function otpExpiresAt(): Date {
  const d = new Date();
  d.setMinutes(d.getMinutes() + ENV.otpExpiryMinutes);
  return d;
}

// ─── Brute Force In-Memory Store ─────────────────────────────────────────────
// For production, replace with Redis. This is sufficient for single-instance VPS.
interface LoginAttempt {
  count: number;
  lockedUntil?: Date;
}

const loginAttempts = new Map<string, LoginAttempt>();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export function recordFailedLogin(identifier: string): { locked: boolean; remaining: number } {
  const now = new Date();
  const entry = loginAttempts.get(identifier) ?? { count: 0 };

  // Clear lockout if expired
  if (entry.lockedUntil && entry.lockedUntil < now) {
    loginAttempts.delete(identifier);
    return { locked: false, remaining: MAX_LOGIN_ATTEMPTS };
  }

  // Already locked
  if (entry.lockedUntil && entry.lockedUntil >= now) {
    return { locked: true, remaining: 0 };
  }

  entry.count += 1;

  if (entry.count >= MAX_LOGIN_ATTEMPTS) {
    const lockedUntil = new Date();
    lockedUntil.setMinutes(lockedUntil.getMinutes() + LOCKOUT_MINUTES);
    entry.lockedUntil = lockedUntil;
    loginAttempts.set(identifier, entry);
    return { locked: true, remaining: 0 };
  }

  loginAttempts.set(identifier, entry);
  return { locked: false, remaining: MAX_LOGIN_ATTEMPTS - entry.count };
}

export function clearLoginAttempts(identifier: string): void {
  loginAttempts.delete(identifier);
}

export function isLoginLocked(identifier: string): boolean {
  const entry = loginAttempts.get(identifier);
  if (!entry?.lockedUntil) return false;
  if (entry.lockedUntil < new Date()) {
    loginAttempts.delete(identifier);
    return false;
  }
  return true;
}
