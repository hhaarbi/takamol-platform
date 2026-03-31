import cron from "node-cron";
import TelegramBot from "node-telegram-bot-api";
import { getSmartAlerts, getKPIs, getDb, processOverdueEscalation } from "./db";
import { payments, contracts, tenants, units, properties } from "../drizzle/schema";
import { eq, and, isNull, sql } from "drizzle-orm";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OWNER_CHAT_ID = process.env.TELEGRAM_OWNER_CHAT_ID;

async function sendTelegramMessage(msg: string): Promise<boolean> {
  if (!TOKEN || !OWNER_CHAT_ID) return false;
  try {
    const tempBot = new TelegramBot(TOKEN, { polling: false });
    await tempBot.sendMessage(OWNER_CHAT_ID, msg, { parse_mode: "Markdown" });
    return true;
  } catch (err) {
    console.error("[Scheduler] Telegram send error:", err);
    return false;
  }
}

async function sendDailyReportToTelegram(): Promise<boolean> {
  if (!TOKEN || !OWNER_CHAT_ID) {
    console.warn("[Scheduler] TELEGRAM_BOT_TOKEN or TELEGRAM_OWNER_CHAT_ID not set, skipping daily report");
    return false;
  }
  try {
    const [kpis, alerts] = await Promise.all([getKPIs(), getSmartAlerts()]);
    const now = new Date().toLocaleDateString("ar-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const totalAlerts = alerts.expiringContracts.length + alerts.overduePayments.length + alerts.pendingMaintenance.length + alerts.vacantUnits.length;
    const urgentAlerts = alerts.overduePayments.length + alerts.pendingMaintenance.filter((m: any) => m.priority === "urgent").length;

    let msg = `📊 *تقرير تكامل اليومي*\n`;
    msg += `📅 ${now}\n`;
    msg += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    msg += `🏠 *مؤشرات الأداء*\n`;
    msg += `• معدل الإشغال: *${(kpis?.occupancyRate ?? 0).toFixed(1)}%*\n`;
    msg += `• إيرادات الشهر: *${Number(kpis?.thisMonthRevenue ?? 0).toLocaleString("ar-SA")} ر.س*\n`;
    msg += `• إجمالي العقارات: *${kpis?.totalProperties ?? 0}*\n`;
    msg += `• عقود تنتهي قريباً: *${kpis?.expiringContracts ?? 0}*\n\n`;

    msg += `🔔 *التنبيهات* (${totalAlerts} تنبيه)\n`;
    if (urgentAlerts > 0) msg += `🚨 عاجل: *${urgentAlerts}* تنبيه يتطلب تدخلاً فورياً\n`;
    if (alerts.overduePayments.length > 0) msg += `💰 دفعات متأخرة: *${alerts.overduePayments.length}*\n`;
    if (alerts.expiringContracts.length > 0) msg += `📋 عقود تنتهي خلال 60 يوم: *${alerts.expiringContracts.length}*\n`;
    if (alerts.pendingMaintenance.length > 0) msg += `🔧 صيانة عاجلة/عالية: *${alerts.pendingMaintenance.length}*\n`;
    if (alerts.vacantUnits.length > 0) msg += `🏚️ وحدات شاغرة: *${alerts.vacantUnits.length}*\n`;

    if (totalAlerts === 0) msg += `✅ لا توجد تنبيهات عاجلة اليوم\n`;

    msg += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    msg += `🔗 لوحة التحكم: /dashboard`;

    const sent = await sendTelegramMessage(msg);
    if (sent) console.log("[Scheduler] Daily report sent successfully");
    return sent;
  } catch (err) {
    console.error("[Scheduler] Failed to send daily report:", err);
    return false;
  }
}

// ─── إشعارات المدفوعات القادمة ────────────────────────────────────────────────
async function checkUpcomingPayments(): Promise<void> {
  const db = await getDb();
  if (!db || !TOKEN || !OWNER_CHAT_ID) return;
  try {
    const today = new Date();
    const in7Days = new Date(today);
    in7Days.setDate(today.getDate() + 7);
    const todayStr = today.toISOString().split("T")[0];
    const in7DaysStr = in7Days.toISOString().split("T")[0];

    // المدفوعات القادمة خلال 7 أيام
    const upcoming = await db
      .select({
        id: payments.id,
        amount: payments.amount,
        dueDate: payments.dueDate,
        tenantName: tenants.name,
        tenantPhone: tenants.phone,
        propertyTitle: properties.titleAr,
      })
      .from(payments)
      .leftJoin(contracts, eq(payments.contractId, contracts.id))
      .leftJoin(tenants, eq(contracts.tenantId, tenants.id))
      .leftJoin(units, eq(contracts.unitId, units.id))
      .leftJoin(properties, eq(units.propertyId, properties.id))
      .where(and(
        eq(payments.status, "pending"),
        sql`${payments.dueDate} >= ${todayStr}`,
        sql`${payments.dueDate} <= ${in7DaysStr}`,
        isNull(payments.lastReminderSent),
      ))
      .limit(20);

    if (upcoming.length > 0) {
      let msg = `⏰ *تنبيه: مدفوعات قادمة خلال 7 أيام*\n\n`;
      upcoming.forEach(p => {
        const dueDate = new Date(p.dueDate ?? "").toLocaleDateString("ar-SA");
        msg += `• ${p.tenantName ?? "مستأجر"} - ${Number(p.amount).toLocaleString("ar-SA")} ر.س\n`;
        msg += `  📅 موعد الاستحقاق: ${dueDate}\n`;
        if (p.propertyTitle) msg += `  🏠 ${p.propertyTitle}\n`;
        msg += `\n`;
      });
      await sendTelegramMessage(msg);
      console.log(`[Scheduler] Sent upcoming payment alerts for ${upcoming.length} payments`);
    }

    // المدفوعات المتأخرة الجديدة (تأخرت اليوم)
    const newOverdue = await db
      .select({
        id: payments.id,
        amount: payments.amount,
        dueDate: payments.dueDate,
        tenantName: tenants.name,
        propertyTitle: properties.titleAr,
      })
      .from(payments)
      .leftJoin(contracts, eq(payments.contractId, contracts.id))
      .leftJoin(tenants, eq(contracts.tenantId, tenants.id))
      .leftJoin(units, eq(contracts.unitId, units.id))
      .leftJoin(properties, eq(units.propertyId, properties.id))
      .where(and(
        eq(payments.status, "pending"),
        sql`${payments.dueDate} < ${todayStr}`,
        isNull(payments.lastReminderSent),
      ))
      .limit(10);

    if (newOverdue.length > 0) {
      let msg = `🚨 *تنبيه: مدفوعات متأخرة جديدة*\n\n`;
      newOverdue.forEach(p => {
        const dueDate = new Date(p.dueDate ?? "").toLocaleDateString("ar-SA");
        const daysLate = Math.floor((today.getTime() - new Date(p.dueDate ?? "").getTime()) / (1000 * 60 * 60 * 24));
        msg += `• ${p.tenantName ?? "مستأجر"} - ${Number(p.amount).toLocaleString("ar-SA")} ر.س\n`;
        msg += `  ⚠️ متأخر ${daysLate} يوم (منذ ${dueDate})\n`;
        if (p.propertyTitle) msg += `  🏠 ${p.propertyTitle}\n`;
        msg += `\n`;
      });
      await sendTelegramMessage(msg);
      console.log(`[Scheduler] Sent overdue payment alerts for ${newOverdue.length} payments`);
    }
  } catch (err) {
    console.error("[Scheduler] Error checking upcoming payments:", err);
  }
}

export function initScheduler() {
  // Daily report at 8:00 AM Riyadh time
  cron.schedule("0 8 * * *", async () => {
    console.log("[Scheduler] Sending daily report...");
    await sendDailyReportToTelegram();
  }, { timezone: "Asia/Riyadh" });

  // Payment reminders at 9:00 AM Riyadh time
  cron.schedule("0 9 * * *", async () => {
    console.log("[Scheduler] Checking upcoming payments...");
    await checkUpcomingPayments();
  }, { timezone: "Asia/Riyadh" });

  // Overdue escalation at 7:00 AM Riyadh time — يُحدّث daysOverdue وescalationLevel تلقائياً
  cron.schedule("0 7 * * *", async () => {
    try {
      const result = await processOverdueEscalation();
      if (result.updated > 0) console.log(`[Scheduler] Escalation: updated ${result.updated} overdue payments`);
    } catch (err) { console.error("[Scheduler] Escalation error:", err); }
  }, { timezone: "Asia/Riyadh" });

  console.log("[Scheduler] Daily report scheduled at 08:00 AM (Riyadh time)");
  console.log("[Scheduler] Payment reminders scheduled at 09:00 AM (Riyadh time)");
  console.log("[Scheduler] Overdue escalation scheduled at 07:00 AM (Riyadh time)");
}

export { sendDailyReportToTelegram, checkUpcomingPayments };
