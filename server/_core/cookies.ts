import type { CookieOptions, Request } from "express";
import { ENV } from "./env";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isIpAddress(host: string | undefined) {
  if (!host) return false;
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(":");
}

function isSecureRequest(req: Request): boolean {
  if (req.protocol === "https") return true;
  const forwardedProto = req.headers["x-forwarded-proto"];
  if (!forwardedProto) return false;
  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : forwardedProto.split(",");
  return protoList.some(proto => proto.trim().toLowerCase() === "https");
}

/**
 * Production-ready session cookie options.
 *
 * Behavior by environment:
 * - Development (localhost, HTTP): sameSite=lax, secure=false
 * - Production (custom domain, HTTPS): sameSite=strict, secure=true, domain=.yourdomain.com
 * - Cross-origin (Manus platform, embedded): sameSite=none, secure=true
 */
export function getSessionCookieOptions(
  req: Request
): Pick<CookieOptions, "domain" | "httpOnly" | "path" | "sameSite" | "secure"> {
  const hostname = req.hostname;
  const secure = isSecureRequest(req);
  const isLocal = LOCAL_HOSTS.has(hostname) || isIpAddress(hostname);

  // Detect cross-origin requests (Manus platform or embedded iframes)
  const origin = req.headers.origin ?? "";
  const appUrl = ENV.appUrl?.trim() ?? "";
  const isCrossOrigin = Boolean(origin && appUrl && !origin.startsWith(appUrl));

  if (isCrossOrigin && secure) {
    return { httpOnly: true, path: "/", sameSite: "none", secure: true };
  }

  if (isLocal || !secure) {
    return { httpOnly: true, path: "/", sameSite: "lax", secure: false };
  }

  // Production same-origin HTTPS: use strict + domain for subdomain support
  let domain: string | undefined;
  if (appUrl) {
    try {
      const parsed = new URL(appUrl);
      const host = parsed.hostname;
      if (!isIpAddress(host) && !LOCAL_HOSTS.has(host)) {
        const rootHost = host.startsWith("www.") ? host.slice(4) : host;
        domain = "." + rootHost;
      }
    } catch {
      // ignore invalid URL
    }
  }

  return {
    httpOnly: true,
    path: "/",
    sameSite: "strict",
    secure: true,
    ...(domain ? { domain } : {}),
  };
}
