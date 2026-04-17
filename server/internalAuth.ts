import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { ENV } from './_core/env';
import { getAccountByUsername, updateAccountLastSignIn } from './db';

const JWT_SECRET = new TextEncoder().encode(ENV.cookieSecret || 'msark-internal-secret-2024');
const COOKIE_NAME = 'msark_session';

export { COOKIE_NAME as INTERNAL_COOKIE_NAME };

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(accountId: number, role: string): Promise<string> {
  return new SignJWT({ accountId, role, type: 'internal' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { accountId: number; role: string; type: string };
  } catch {
    return null;
  }
}

export async function loginWithCredentials(username: string, password: string) {
  const account = await getAccountByUsername(username);
  if (!account) return null;

  const valid = await verifyPassword(password, account.passwordHash);
  if (!valid) return null;

  await updateAccountLastSignIn(account.id);
  const token = await createSessionToken(account.id, account.role);
  return { account, token };
}
