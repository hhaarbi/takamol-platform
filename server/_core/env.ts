export const ENV = {
  // ─── Core ──────────────────────────────────────────────────────────────────
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  port: parseInt(process.env.PORT ?? "3000", 10),
  isProduction: process.env.NODE_ENV === "production",

  // ─── App URL (used for CORS + cookie domain + redirects) ───────────────────
  // In production: set APP_URL=https://your-actual-domain.com
  // In development: leave empty (all origins allowed, lax cookies)
  appUrl: process.env.APP_URL ?? "",

  // ─── CORS Origin (optional, defaults to APP_URL if not set) ───────────────
  // Set CORS_ORIGIN if your frontend is on a different domain than APP_URL
  corsOrigin: process.env.CORS_ORIGIN ?? "",

  // ─── Owner info (used for Telegram notifications) ─────────────────────────
  ownerName: process.env.OWNER_NAME ?? "Admin",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",

  // ─── Manus OAuth (optional — only needed when running on Manus platform) ───
  // On standalone VPS: leave these empty. JWT_SECRET is used for sessions.
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",

  // ─── Manus platform built-ins (optional — only on Manus platform) ─────────
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",

  // ─── Standalone LLM (production, compatible with OpenAI API) ──────────────
  // Set OPENAI_BASE_URL to any OpenAI-compatible endpoint (OpenAI, Azure, etc.)
  openAiBaseUrl: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
  openAiApiKey: process.env.OPENAI_API_KEY ?? "",

  // ─── Standalone Storage: AWS S3 / Cloudflare R2 ────────────────────────────
  // STORAGE_PROVIDER: "s3" | "r2" | "local" (default: local for dev, s3 for prod)
  storageProvider: process.env.STORAGE_PROVIDER ?? "local",
  // S3_ENDPOINT: for Cloudflare R2 use https://<account>.r2.cloudflarestorage.com
  //              for AWS S3 leave empty (auto-constructed from region)
  s3Endpoint: process.env.S3_ENDPOINT ?? "",
  s3AccessKey: process.env.AWS_ACCESS_KEY_ID ?? process.env.S3_ACCESS_KEY ?? "",
  s3SecretKey: process.env.AWS_SECRET_ACCESS_KEY ?? process.env.S3_SECRET_KEY ?? "",
  s3Bucket: process.env.AWS_BUCKET ?? process.env.S3_BUCKET ?? "",
  s3Region: process.env.AWS_REGION ?? process.env.S3_REGION ?? "us-east-1",
};
