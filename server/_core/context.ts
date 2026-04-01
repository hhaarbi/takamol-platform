import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { verifyAccessToken } from "./auth";
import * as db from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // ─── 1. Try Manus OAuth (app_session_id cookie) ───────────────────────
  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch {
    // OAuth session not found — try standalone JWT next
  }

  // ─── 2. Fallback: Standalone JWT (access_token cookie) ─────────────────
  if (!user) {
    try {
      const accessToken = opts.req.cookies?.access_token as string | undefined;
      if (accessToken) {
        const payload = verifyAccessToken(accessToken);
        if (payload?.openId) {
          user = (await db.getUserByOpenId(payload.openId)) ?? null;
        }
      }
    } catch {
      // Standalone token invalid — user stays null
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
