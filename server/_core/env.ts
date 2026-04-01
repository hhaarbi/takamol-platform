export const ENV = {
  // ─── Core ──────────────────────────────────────────────────────────────────
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "change-me-in-production",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? "change-refresh-in-production",
  databaseUrl: process.env.DATABASE_URL ?? "",
  port: parseInt(process.env.PORT ?? "3000", 10),
  isProduction: process.env.NODE_ENV === "production",

  // ─── App URL (used for CORS + cookie domain + redirects) ───────────────────
  // In production: set APP_URL=https://your-actual-domain.com
  appUrl: process.env.APP_URL ?? "",

  // ─── CORS Origin (optional, defaults to APP_URL if not set) ───────────────
  corsOrigin: process.env.CORS_ORIGIN ?? "",

  // ─── Owner info ────────────────────────────────────────────────────────────
  ownerName: process.env.OWNER_NAME ?? "Admin",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",

  // ─── Email System ──────────────────────────────────────────────────────────
  // Provider: "resend" | "smtp" | "none"
  emailProvider: process.env.EMAIL_PROVIDER ?? "none",
  // Resend (recommended for production)
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  // SMTP (alternative)
  smtpHost: process.env.SMTP_HOST ?? "",
  smtpPort: parseInt(process.env.SMTP_PORT ?? "587", 10),
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPass: process.env.SMTP_PASS ?? "",
  smtpSecure: process.env.SMTP_SECURE === "true",
  // Sender identity
  emailFrom: process.env.EMAIL_FROM ?? "noreply@takamol.sa",
  emailFromName: process.env.EMAIL_FROM_NAME ?? "تكامل لإدارة الأملاك",

  // ─── OTP Settings ──────────────────────────────────────────────────────────
  otpExpiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES ?? "5", 10),
  otpMaxAttempts: parseInt(process.env.OTP_MAX_ATTEMPTS ?? "3", 10),
  otpRateLimitWindow: parseInt(process.env.OTP_RATE_LIMIT_WINDOW ?? "15", 10), // minutes

  // ─── Manus OAuth (optional — only needed when running on Manus platform) ───
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",

  // ─── Manus platform built-ins (optional — only on Manus platform) ─────────
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",

  // ─── Standalone LLM (OpenAI-compatible) ────────────────────────────────────
  openAiBaseUrl: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
  openAiApiKey: process.env.OPENAI_API_KEY ?? "",

  // ─── Standalone Storage: AWS S3 / Cloudflare R2 ────────────────────────────
  storageProvider: process.env.STORAGE_PROVIDER ?? "local",
  s3Endpoint: process.env.S3_ENDPOINT ?? "",
  s3AccessKey: process.env.AWS_ACCESS_KEY_ID ?? process.env.S3_ACCESS_KEY ?? "",
  s3SecretKey: process.env.AWS_SECRET_ACCESS_KEY ?? process.env.S3_SECRET_KEY ?? "",
  s3Bucket: process.env.AWS_BUCKET ?? process.env.S3_BUCKET ?? "",
  s3Region: process.env.AWS_REGION ?? process.env.S3_REGION ?? "us-east-1",

  // ─── Telegram ──────────────────────────────────────────────────────────────
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? "",
  telegramOwnerChatId: process.env.TELEGRAM_OWNER_CHAT_ID ?? "",

  // ─── Stripe ──────────────────────────────────────────────────────────────────
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  stripePriceIdStarter: process.env.STRIPE_PRICE_ID_STARTER ?? "price_1THKYAHf1Olb1MIWTuDzSsC9",
  stripePriceIdPro: process.env.STRIPE_PRICE_ID_PRO ?? "price_1THKYBHf1Olb1MIWoNnejnOY",
  stripePriceIdEnterprise: process.env.STRIPE_PRICE_ID_ENTERPRISE ?? "price_1THKYDHf1Olb1MIWNPiwqag3",

  // ─── WhatsApp Business API (Meta Cloud API) ────────────────────────────────
  // Setup: https://developers.facebook.com/docs/whatsapp/cloud-api/get-started
  // WHATSAPP_API_KEY: Permanent token from Meta Business Manager
  // WHATSAPP_PHONE_NUMBER_ID: Phone Number ID from WhatsApp Business Account
  whatsappApiKey: process.env.WHATSAPP_API_KEY ?? "",
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? "",
  whatsappApiVersion: process.env.WHATSAPP_API_VERSION ?? "v19.0",
};
