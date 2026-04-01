/**
 * Takamul Platform — WhatsApp Business API Service Layer
 *
 * This module provides a typed interface for sending WhatsApp messages
 * via the Meta WhatsApp Business Cloud API.
 *
 * Status: STUB — Integration points are defined but not yet active.
 *         Enable by setting WHATSAPP_API_KEY and WHATSAPP_PHONE_NUMBER_ID
 *         in your environment variables.
 *
 * Documentation: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export type WhatsAppTextMessage = {
  type: "text";
  to: string; // E.164 format: +966501234567
  body: string;
  previewUrl?: boolean;
};

export type WhatsAppTemplateMessage = {
  type: "template";
  to: string;
  templateName: string;
  languageCode: string; // e.g. "ar" or "en_US"
  components?: WhatsAppTemplateComponent[];
};

export type WhatsAppTemplateComponent = {
  type: "body" | "header" | "button";
  parameters: Array<{
    type: "text" | "currency" | "date_time" | "image";
    text?: string;
    currency?: { fallback_value: string; code: string; amount_1000: number };
  }>;
};

export type WhatsAppMessage = WhatsAppTextMessage | WhatsAppTemplateMessage;

export type WhatsAppSendResult = {
  success: boolean;
  messageId?: string;
  error?: string;
  timestamp: string;
};

// ─── Pre-defined Templates (Saudi Real Estate Context) ────────────────────────

export const WHATSAPP_TEMPLATES = {
  /** Sent when a payment is due */
  PAYMENT_REMINDER: "takamol_payment_reminder",
  /** Sent when a payment is overdue */
  PAYMENT_OVERDUE: "takamol_payment_overdue",
  /** Sent when a maintenance request is submitted */
  MAINTENANCE_SUBMITTED: "takamol_maintenance_submitted",
  /** Sent when a maintenance request is resolved */
  MAINTENANCE_RESOLVED: "takamol_maintenance_resolved",
  /** Sent when a contract is about to expire */
  CONTRACT_EXPIRY: "takamol_contract_expiry",
  /** Sent to welcome a new tenant */
  TENANT_WELCOME: "takamol_tenant_welcome",
  /** Sent when a new invoice is generated */
  INVOICE_READY: "takamol_invoice_ready",
} as const;

// ─── Configuration ────────────────────────────────────────────────────────────

function getWhatsAppConfig() {
  const apiKey = process.env.WHATSAPP_API_KEY;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiVersion = process.env.WHATSAPP_API_VERSION ?? "v19.0";
  const enabled = Boolean(apiKey && phoneNumberId);

  return { apiKey, phoneNumberId, apiVersion, enabled };
}

// ─── Core Send Function ───────────────────────────────────────────────────────

/**
 * Sends a WhatsApp message via Meta Cloud API.
 * Returns a result object — never throws — to allow graceful degradation.
 */
export async function sendWhatsAppMessage(
  message: WhatsAppMessage
): Promise<WhatsAppSendResult> {
  const config = getWhatsAppConfig();
  const timestamp = new Date().toISOString();

  if (!config.enabled) {
    console.warn(
      "[WhatsApp] Service not configured. Set WHATSAPP_API_KEY and WHATSAPP_PHONE_NUMBER_ID to enable."
    );
    return {
      success: false,
      error: "WhatsApp service not configured",
      timestamp,
    };
  }

  try {
    const url = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`;

    let body: Record<string, unknown>;

    if (message.type === "text") {
      body = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: message.to,
        type: "text",
        text: {
          preview_url: message.previewUrl ?? false,
          body: message.body,
        },
      };
    } else {
      body = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: message.to,
        type: "template",
        template: {
          name: message.templateName,
          language: { code: message.languageCode },
          components: message.components ?? [],
        },
      };
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = (errorData as any)?.error?.message ?? `HTTP ${response.status}`;
      console.error("[WhatsApp] Send failed:", errorMsg);
      return { success: false, error: errorMsg, timestamp };
    }

    const data = (await response.json()) as { messages?: Array<{ id: string }> };
    const messageId = data.messages?.[0]?.id;

    console.log(`[WhatsApp] Message sent to ${message.to} — ID: ${messageId}`);
    return { success: true, messageId, timestamp };
  } catch (err) {
    const error = err instanceof Error ? err.message : "Unknown error";
    console.error("[WhatsApp] Exception:", error);
    return { success: false, error, timestamp };
  }
}

// ─── High-Level Helpers ───────────────────────────────────────────────────────

/**
 * Sends a payment reminder to a tenant.
 * @param phone - Tenant phone in E.164 format (+966...)
 * @param tenantName - Tenant's full name
 * @param amount - Payment amount in SAR
 * @param dueDate - Due date string (e.g. "2026-04-15")
 */
export async function sendPaymentReminder(
  phone: string,
  tenantName: string,
  amount: number,
  dueDate: string
): Promise<WhatsAppSendResult> {
  // When templates are approved in Meta Business Manager, switch to template type
  return sendWhatsAppMessage({
    type: "text",
    to: phone,
    body:
      `مرحباً ${tenantName}،\n\n` +
      `نود تذكيركم بموعد سداد الإيجار المستحق بتاريخ ${dueDate}.\n` +
      `المبلغ المستحق: ${amount.toLocaleString("ar-SA")} ريال سعودي.\n\n` +
      `للاستفسار، يرجى التواصل مع مكتب تكامل لإدارة الأملاك.\n` +
      `شكراً لتعاملكم معنا 🏠`,
  });
}

/**
 * Sends an overdue payment alert to a tenant.
 */
export async function sendOverdueAlert(
  phone: string,
  tenantName: string,
  amount: number,
  daysOverdue: number
): Promise<WhatsAppSendResult> {
  return sendWhatsAppMessage({
    type: "text",
    to: phone,
    body:
      `عزيزنا ${tenantName}،\n\n` +
      `نود إحاطتكم علماً بأن الإيجار المستحق قد تأخر ${daysOverdue} يوم/أيام.\n` +
      `المبلغ المستحق: ${amount.toLocaleString("ar-SA")} ريال سعودي.\n\n` +
      `يرجى التواصل معنا فوراً لتسوية المبلغ وتجنب أي إجراءات قانونية.\n` +
      `تكامل لإدارة الأملاك 🏠`,
  });
}

/**
 * Sends a contract expiry notice to a tenant.
 */
export async function sendContractExpiryNotice(
  phone: string,
  tenantName: string,
  expiryDate: string,
  daysRemaining: number
): Promise<WhatsAppSendResult> {
  return sendWhatsAppMessage({
    type: "text",
    to: phone,
    body:
      `عزيزنا ${tenantName}،\n\n` +
      `نود إشعاركم بأن عقد الإيجار الخاص بكم سينتهي بتاريخ ${expiryDate} ` +
      `(بعد ${daysRemaining} يوم).\n\n` +
      `للتجديد أو الاستفسار، يرجى التواصل مع مكتب تكامل لإدارة الأملاك.\n` +
      `تكامل لإدارة الأملاك 🏠`,
  });
}

/**
 * Sends a maintenance request confirmation to a tenant.
 */
export async function sendMaintenanceConfirmation(
  phone: string,
  tenantName: string,
  requestId: number,
  description: string
): Promise<WhatsAppSendResult> {
  return sendWhatsAppMessage({
    type: "text",
    to: phone,
    body:
      `مرحباً ${tenantName}،\n\n` +
      `تم استلام طلب الصيانة رقم #${requestId} بنجاح.\n` +
      `التفاصيل: ${description}\n\n` +
      `سيتم التواصل معكم قريباً لتحديد موعد الصيانة.\n` +
      `تكامل لإدارة الأملاك 🏠`,
  });
}

// ─── Status Check ─────────────────────────────────────────────────────────────

/**
 * Returns the current configuration status of the WhatsApp service.
 * Safe to expose in admin dashboards.
 */
export function getWhatsAppStatus(): {
  enabled: boolean;
  phoneNumberId: string | undefined;
  apiVersion: string;
} {
  const config = getWhatsAppConfig();
  return {
    enabled: config.enabled,
    phoneNumberId: config.phoneNumberId,
    apiVersion: config.apiVersion,
  };
}
