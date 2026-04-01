import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { mergedRouter as appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { initTelegramBot } from "../telegram";
import { initScheduler } from "../scheduler";
import rateLimit from "express-rate-limit";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { ENV } from "./env";
import { handleStripeWebhook } from "../stripe-webhook";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Trust proxy for rate limiting behind reverse proxy (Nginx)
  app.set("trust proxy", 1);

  // ─── Security Headers (Helmet) ────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: ENV.isProduction
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
              styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
              fontSrc: ["'self'", "https://fonts.gstatic.com"],
              imgSrc: ["'self'", "data:", "https:", "blob:"],
              connectSrc: ["'self'", ENV.appUrl || "*"],
              frameSrc: ["'none'"],
              objectSrc: ["'none'"],
            },
          }
        : false, // Disable CSP in development (Vite HMR needs it)
      crossOriginEmbedderPolicy: false, // Required for some map/media embeds
    })
  );

  // ─── Request Logging (Morgan) ─────────────────────────────────────────────
  // Production: combined format (Apache-style, good for log parsers)
  // Development: dev format (colorized, concise)
  app.use(morgan(ENV.isProduction ? "combined" : "dev"));

  // ─── CORS ─────────────────────────────────────────────────────────────────
  const corsBase = ENV.corsOrigin || ENV.appUrl;
  const allowedOrigins: string[] | boolean = corsBase && ENV.isProduction
    ? [
        corsBase.replace(/\/$/, ""),
        corsBase.replace(/\/$/, "").replace("://", "://www."),
      ]
    : true;

  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
      maxAge: 86400,
    })
  );

  // ─── Stripe Webhook (MUST be before express.json() to preserve raw body) ──
  app.post(
    "/api/webhooks/stripe",
    express.raw({ type: "application/json" }),
    handleStripeWebhook
  );

  // ─── Body Parser ─────────────────────────────────────────────────────────
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // ─── Rate Limiting ────────────────────────────────────────────────────────
  // General API: 500 req / 15 min
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
  });
  // Auth endpoints: 20 req / 1 min (brute force protection)
  const authLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many auth attempts, please wait." },
  });
  // Login specifically: 5 req / 15 min (strict brute force)
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many login attempts. Try again in 15 minutes." },
    skipSuccessfulRequests: true, // Only count failed requests
  });
  // Bot endpoints: 30 req / 1 min
  const botLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Rate limit exceeded." },
  });

  app.use("/api/trpc", generalLimiter);
  app.use("/api/trpc/auth.login", loginLimiter);
  app.use("/api/trpc/auth.sendOTP", authLimiter);
  app.use("/api/trpc/auth.verifyOTP", authLimiter);
  app.use("/api/trpc/auth.forgotPassword", authLimiter);
  app.use("/api/trpc/bot", botLimiter);

  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Development: Vite dev server | Production: static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer()
  .then(() => initTelegramBot())
  .then(() => initScheduler())
  .catch(console.error);
