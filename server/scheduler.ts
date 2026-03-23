import cron from "node-cron";
import TelegramBot from "node-telegram-bot-api";
import { getSmartAlerts, getKPIs } from "./db";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const OWNER_CHAT_ID = process.env.TELEGRAM_OWNER_CHAT_ID;

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

    const tempBot = new TelegramBot(TOKEN, { polling: false });
    await tempBot.sendMessage(OWNER_CHAT_ID, msg, { parse_mode: "Markdown" });
    console.log("[Scheduler] Daily report sent successfully");
    return true;
  } catch (err) {
    console.error("[Scheduler] Failed to send daily report:", err);
    return false;
  }
}

export function initScheduler() {
  // Run every day at 8:00 AM Saudi Arabia time (UTC+3 = 05:00 UTC)
  cron.schedule("0 5 * * *", async () => {
    console.log("[Scheduler] Sending daily report...");
    await sendDailyReportToTelegram();
  }, {
    timezone: "Asia/Riyadh",
  });
  console.log("[Scheduler] Daily report scheduled at 08:00 AM (Riyadh time)");
}

export { sendDailyReportToTelegram };
