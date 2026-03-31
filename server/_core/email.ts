/**
 * Email System — Resend (primary) + SMTP (fallback)
 * Supports: OTP, Welcome, Reset Password
 * Branding: تكامل لإدارة الأملاك
 */
import { ENV } from "./env";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ─── HTML Templates ───────────────────────────────────────────────────────────
function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>تكامل لإدارة الأملاك</title>
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Tahoma,Arial,sans-serif;direction:rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#1e293b;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a5f 0%,#0f172a 100%);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#f59e0b;font-size:28px;font-weight:700;letter-spacing:1px;">تكامل</h1>
              <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">منصة إدارة الأملاك الذكية</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#0f172a;padding:24px 40px;text-align:center;border-top:1px solid #334155;">
              <p style="margin:0;color:#475569;font-size:12px;">هذا البريد أُرسل تلقائياً من منصة تكامل · لا تردّ على هذا البريد</p>
              <p style="margin:8px 0 0;color:#475569;font-size:12px;">© ${new Date().getFullYear()} تكامل لإدارة الأملاك — المدينة المنورة، المملكة العربية السعودية</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function otpEmailTemplate(opts: { otp: string; name?: string; purpose?: string }): string {
  const purpose = opts.purpose ?? "التحقق من هويتك";
  const name = opts.name ?? "عزيزي المستخدم";
  return baseTemplate(`
    <h2 style="margin:0 0 8px;color:#f1f5f9;font-size:22px;">رمز التحقق</h2>
    <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;">مرحباً ${name}، استخدم الرمز التالي لـ ${purpose}:</p>
    <div style="background:#0f172a;border:2px solid #f59e0b;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
      <span style="font-size:40px;font-weight:700;color:#f59e0b;letter-spacing:12px;font-family:monospace;">${opts.otp}</span>
    </div>
    <p style="margin:0 0 8px;color:#94a3b8;font-size:14px;">⏱ صالح لمدة <strong style="color:#f1f5f9;">${ENV.otpExpiryMinutes} دقائق</strong> فقط.</p>
    <p style="margin:0;color:#64748b;font-size:13px;">إذا لم تطلب هذا الرمز، تجاهل هذا البريد.</p>
  `);
}

export function welcomeEmailTemplate(opts: { name: string; email: string; loginUrl?: string }): string {
  const loginUrl = opts.loginUrl ?? (ENV.appUrl || "https://takamol.sa");
  return baseTemplate(`
    <h2 style="margin:0 0 8px;color:#f1f5f9;font-size:22px;">مرحباً بك في تكامل 🎉</h2>
    <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;">أهلاً <strong style="color:#f1f5f9;">${opts.name}</strong>، تم إنشاء حسابك بنجاح.</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="background:#0f172a;border-radius:8px;padding:16px;">
          <p style="margin:0 0 8px;color:#94a3b8;font-size:13px;">البريد الإلكتروني:</p>
          <p style="margin:0;color:#f1f5f9;font-size:15px;font-weight:600;">${opts.email}</p>
        </td>
      </tr>
    </table>
    <a href="${loginUrl}" style="display:inline-block;background:#f59e0b;color:#0f172a;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none;">تسجيل الدخول الآن</a>
    <p style="margin:24px 0 0;color:#64748b;font-size:13px;">إذا لم تنشئ هذا الحساب، يرجى التواصل معنا فوراً.</p>
  `);
}

export function resetPasswordEmailTemplate(opts: { name: string; resetUrl: string }): string {
  return baseTemplate(`
    <h2 style="margin:0 0 8px;color:#f1f5f9;font-size:22px;">إعادة تعيين كلمة المرور</h2>
    <p style="margin:0 0 24px;color:#94a3b8;font-size:15px;">مرحباً <strong style="color:#f1f5f9;">${opts.name}</strong>، تلقينا طلباً لإعادة تعيين كلمة مرورك.</p>
    <a href="${opts.resetUrl}" style="display:inline-block;background:#ef4444;color:#fff;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none;">إعادة تعيين كلمة المرور</a>
    <p style="margin:24px 0 8px;color:#94a3b8;font-size:14px;">⏱ هذا الرابط صالح لمدة <strong style="color:#f1f5f9;">30 دقيقة</strong> فقط.</p>
    <p style="margin:0;color:#64748b;font-size:13px;">إذا لم تطلب هذا، تجاهل هذا البريد — كلمة مرورك لم تتغير.</p>
  `);
}

// ─── Send via Resend ──────────────────────────────────────────────────────────
async function sendViaResend(opts: SendEmailOptions): Promise<SendEmailResult> {
  const { Resend } = await import("resend");
  const resend = new Resend(ENV.resendApiKey);
  const result = await resend.emails.send({
    from: `${ENV.emailFromName} <${ENV.emailFrom}>`,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });
  if (result.error) {
    return { success: false, error: result.error.message };
  }
  return { success: true, messageId: result.data?.id };
}

// ─── Send via SMTP (nodemailer) ───────────────────────────────────────────────
async function sendViaSMTP(opts: SendEmailOptions): Promise<SendEmailResult> {
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    host: ENV.smtpHost,
    port: ENV.smtpPort,
    secure: ENV.smtpSecure,
    auth: { user: ENV.smtpUser, pass: ENV.smtpPass },
  });
  const info = await transporter.sendMail({
    from: `"${ENV.emailFromName}" <${ENV.emailFrom}>`,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  });
  return { success: true, messageId: info.messageId };
}

// ─── Main Send Function ───────────────────────────────────────────────────────
export async function sendEmail(opts: SendEmailOptions): Promise<SendEmailResult> {
  try {
    if (ENV.emailProvider === "resend" && ENV.resendApiKey) {
      return await sendViaResend(opts);
    }
    if (ENV.emailProvider === "smtp" && ENV.smtpHost) {
      return await sendViaSMTP(opts);
    }
    // Development: log to console
    console.log(`[Email] To: ${opts.to} | Subject: ${opts.subject}`);
    console.log(`[Email] (No provider configured — set EMAIL_PROVIDER=resend or smtp)`);
    return { success: true, messageId: "dev-console" };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[Email] Send failed:`, message);
    return { success: false, error: message };
  }
}

// ─── Convenience Senders ─────────────────────────────────────────────────────
export async function sendOTPEmail(opts: {
  to: string;
  otp: string;
  name?: string;
  purpose?: string;
}): Promise<SendEmailResult> {
  return sendEmail({
    to: opts.to,
    subject: `${opts.otp} — رمز التحقق من تكامل`,
    html: otpEmailTemplate(opts),
    text: `رمز التحقق: ${opts.otp} — صالح لمدة ${ENV.otpExpiryMinutes} دقائق.`,
  });
}

export async function sendWelcomeEmail(opts: {
  to: string;
  name: string;
  loginUrl?: string;
}): Promise<SendEmailResult> {
  return sendEmail({
    to: opts.to,
    subject: "مرحباً بك في تكامل لإدارة الأملاك",
    html: welcomeEmailTemplate({ ...opts, email: opts.to }),
    text: `مرحباً ${opts.name}، تم إنشاء حسابك بنجاح في منصة تكامل.`,
  });
}

export async function sendResetPasswordEmail(opts: {
  to: string;
  name: string;
  resetUrl: string;
}): Promise<SendEmailResult> {
  return sendEmail({
    to: opts.to,
    subject: "إعادة تعيين كلمة المرور — تكامل",
    html: resetPasswordEmailTemplate(opts),
    text: `رابط إعادة تعيين كلمة المرور: ${opts.resetUrl}`,
  });
}
