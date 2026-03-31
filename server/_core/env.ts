export const ENV = {
  // ─── Core ──────────────────────────────────────────────────────────────────
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",

  // ─── App URL (used for CORS + cookie domain + redirects) ───────────────────
  // In production: set to https://yourdomain.com
  // In development: leave empty (all origins allowed, lax cookies)
  appUrl: process.env.APP_URL ?? "",

  // ─── Manus platform built-ins (auto-injected on Manus) ────────────────────
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",

  // ─── Standalone LLM (production, replaces Manus Forge LLM) ───────────────
  // Compatible with OpenAI API — set OPENAI_BASE_URL to any OpenAI-compatible endpoint
  openAiBaseUrl: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
  openAiApiKey: process.env.OPENAI_API_KEY ?? "",

  // ─── Standalone Storage: AWS S3 / Cloudflare R2 ────────────────────────────
  // S3_ENDPOINT: for Cloudflare R2 use https://<account>.r2.cloudflarestorage.com
  //              for AWS S3 leave empty (auto-constructed from region)
  s3Endpoint: process.env.S3_ENDPOINT ?? "",
  s3AccessKey: process.env.S3_ACCESS_KEY ?? "",
  s3SecretKey: process.env.S3_SECRET_KEY ?? "",
  s3Bucket: process.env.S3_BUCKET ?? "",
  s3Region: process.env.S3_REGION ?? "us-east-1",
};
