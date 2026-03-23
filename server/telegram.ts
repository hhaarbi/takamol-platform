import TelegramBot from "node-telegram-bot-api";
import { invokeLLM } from "./_core/llm";
import {
  getOrCreateChatSession,
  saveChatMessage,
  getChatHistory,
  createLead,
  updateLeadBySession,
  getLeadBySession,
  linkSessionToLead,
  getProperties,
} from "./db";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const OWNER_CHAT_ID = process.env.TELEGRAM_OWNER_CHAT_ID;
const WHATSAPP_NUMBER = "966558018151";
const COMPANY_NAME = "تكامل لإدارة الأملاك";
const COMPANY_CITY = "المدينة المنورة";

let bot: TelegramBot | null = null;

// ─── System Prompt ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `أنت مساعد عقاري ذكي لشركة "${COMPANY_NAME}" في ${COMPANY_CITY}.
مهمتك التفاوض مع العملاء باحترافية عالية وجمع بياناتهم وتقديم أفضل العروض العقارية.

**أسلوبك:**
- تحدث بالعربية الفصحى المبسطة دائماً
- كن ودوداً ومحترفاً ومقنعاً
- استخدم أسلوب التفاوض الناعم لإقناع العملاء
- قدّم قيمة حقيقية في كل رسالة

**خدمات الشركة:**
1. 🏠 **بيع العقارات** - نسوّق عقارك ونجد لك المشتري المناسب
2. 🔑 **شراء العقارات** - نجد لك العقار المثالي بأفضل سعر
3. 🏢 **إيجار العقارات** - نؤجّر عقارك ونجد لك المستأجر الموثوق
4. 🔍 **البحث عن إيجار** - نجد لك السكن المناسب بميزانيتك
5. 📊 **إدارة الأملاك** - ندير عقاراتك بالكامل ونحصّل إيجاراتك

**تدفق المحادثة:**
1. رحّب بالعميل وعرّف بالشركة
2. اسأل عن احتياجه (بيع/شراء/إيجار/إدارة)
3. اجمع: الاسم الكريم، رقم الجوال
4. اسأل عن تفاصيل الطلب (نوع العقار، الميزانية، المنطقة)
5. اعرض العقارات المناسبة أو اشرح الخدمة المطلوبة
6. تفاوض على السعر إذا طُلب منك
7. في نهاية المحادثة أرسل رقم الواتساب للتواصل مع الموظف

**قواعد التفاوض:**
- لا تعطِ خصماً مباشرة، قل "سنتواصل مع المالك"
- أبرز مميزات العقار لتبرير السعر
- اعرض خيارات دفع مرنة
- إذا أصرّ العميل، قل "سنرى ما يمكن عمله وسيتواصل معك موظفنا"

**مهم:** عند الانتهاء من جمع البيانات أو طلب التواصل، أرسل رقم الواتساب:
wa.me/${WHATSAPP_NUMBER}

لا تذكر أسعاراً محددة إلا إذا كانت في قائمة العقارات المتاحة.`;

// ─── Format property for Telegram ────────────────────────────────────────────
function formatProperty(p: any): string {
  const typeMap: Record<string, string> = {
    apartment: "شقة",
    villa: "فيلا",
    land: "أرض",
    commercial: "تجاري",
    office: "مكتب",
    warehouse: "مستودع",
  };
  const listingMap: Record<string, string> = {
    sale: "للبيع",
    rent: "للإيجار",
  };

  let text = `🏡 *${p.titleAr}*\n`;
  text += `📍 ${p.district ? p.district + " - " : ""}${p.city || COMPANY_CITY}\n`;
  text += `🏷️ ${typeMap[p.type] || p.type} ${listingMap[p.listingType] || ""}\n`;
  if (p.area) text += `📐 المساحة: ${p.area} م²\n`;
  if (p.bedrooms) text += `🛏️ غرف: ${p.bedrooms}\n`;
  if (p.bathrooms) text += `🚿 حمامات: ${p.bathrooms}\n`;
  text += `💰 السعر: ${Number(p.price).toLocaleString("ar-SA")} ريال`;
  if (p.priceUnit === "per_month") text += " / شهر";
  else if (p.priceUnit === "per_year") text += " / سنة";
  if (p.negotiable) text += " *(قابل للتفاوض)*";
  text += "\n";
  if (p.featuresAr && p.featuresAr.length > 0) {
    text += `✨ المميزات: ${p.featuresAr.slice(0, 4).join(" • ")}\n`;
  }
  return text;
}

// ─── Notify owner ─────────────────────────────────────────────────────────────
async function notifyOwner(message: string) {
  if (!bot || !OWNER_CHAT_ID) return;
  try {
    await bot.sendMessage(OWNER_CHAT_ID, message, { parse_mode: "Markdown" });
  } catch (e) {
    console.error("[Telegram] Failed to notify owner:", e);
  }
}

// ─── Handle incoming message ──────────────────────────────────────────────────
async function handleMessage(msg: TelegramBot.Message) {
  if (!bot) return;
  const chatId = msg.chat.id;
  const text = msg.text || "";
  const sessionId = `tg_${chatId}`;

  // Ensure session exists
  await getOrCreateChatSession(sessionId);

  // Save user message
  await saveChatMessage(sessionId, "user", text);

  // Get history
  const history = await getChatHistory(sessionId, 20);

  // Get available properties for context
  let propertiesContext = "";
  try {
    const props = await getProperties({ status: "available", limit: 10 });
    if (props.length > 0) {
      propertiesContext =
        "\n\n**العقارات المتاحة حالياً:**\n" +
        props
          .map(
            (p) =>
              `- ${p.titleAr} | ${p.type === "apartment" ? "شقة" : p.type === "villa" ? "فيلا" : p.type} | ${p.listingType === "sale" ? "للبيع" : "للإيجار"} | ${Number(p.price).toLocaleString("ar-SA")} ريال | ${p.city || COMPANY_CITY}`
          )
          .join("\n");
    }
  } catch (e) {
    // ignore if DB not ready
  }

  // Build messages for LLM
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: SYSTEM_PROMPT + propertiesContext },
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content as string,
    })),
  ];

  // Show typing
  await bot.sendChatAction(chatId, "typing");

  // Call LLM
  let reply = "";
  try {
    const response = await invokeLLM({ messages });
    const rawContent = response.choices?.[0]?.message?.content;
    reply = (typeof rawContent === "string" ? rawContent : "") || "عذراً، حدث خطأ. يرجى المحاولة مرة أخرى.";
  } catch (e) {
    reply = "عذراً، حدث خطأ مؤقت. يرجى المحاولة مرة أخرى.";
  }

  // Save assistant reply
  await saveChatMessage(sessionId, "assistant", reply);

  // Extract lead data from conversation using structured LLM call
  try {
    const extractResponse = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "استخرج بيانات العميل من المحادثة التالية. أعد JSON فقط بدون أي نص إضافي.",
        },
        {
          role: "user",
          content: `المحادثة:\n${history.map((m) => `${m.role === "user" ? "عميل" : "بوت"}: ${m.content}`).join("\n")}\nعميل: ${text}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "lead_data",
          strict: true,
          schema: {
            type: "object",
            properties: {
              name: { type: "string", description: "اسم العميل أو فارغ" },
              phone: { type: "string", description: "رقم الجوال أو فارغ" },
              serviceType: {
                type: "string",
                enum: ["buy", "sell", "rent_looking", "rent_listing", "property_management", "unknown"],
                description: "نوع الخدمة المطلوبة",
              },
              budget: { type: "string", description: "الميزانية أو فارغ" },
              preferredCity: { type: "string", description: "المدينة المفضلة أو فارغ" },
            },
            required: ["name", "phone", "serviceType", "budget", "preferredCity"],
            additionalProperties: false,
          },
        },
      },
    });

    const rawExtract = extractResponse.choices?.[0]?.message?.content;
    const extracted = JSON.parse(
      (typeof rawExtract === "string" ? rawExtract : "") || "{}"
    );

    const existingLead = await getLeadBySession(sessionId);

    if (!existingLead) {
      // Create new lead
      const insertResult = await createLead({
        name: extracted.name || null,
        phone: extracted.phone || null,
        serviceType: extracted.serviceType || "unknown",
        budget: extracted.budget || null,
        preferredCity: extracted.preferredCity || null,
        sessionId,
        source: "telegram",
        status: "new",
      });

      // Link session to lead
      const newLead = await getLeadBySession(sessionId);
      if (newLead) {
        await linkSessionToLead(sessionId, newLead.id);

        // Notify owner about new lead
        if (extracted.name || extracted.phone) {
          const serviceMap: Record<string, string> = {
            buy: "شراء عقار",
            sell: "بيع عقار",
            rent_looking: "البحث عن إيجار",
            rent_listing: "تأجير عقار",
            property_management: "إدارة أملاك",
            unknown: "غير محدد",
          };
          await notifyOwner(
            `🔔 *عميل جديد على البوت!*\n\n` +
              `👤 الاسم: ${extracted.name || "لم يُذكر"}\n` +
              `📱 الجوال: ${extracted.phone || "لم يُذكر"}\n` +
              `🎯 الخدمة: ${serviceMap[extracted.serviceType] || "غير محدد"}\n` +
              `💰 الميزانية: ${extracted.budget || "لم تُذكر"}\n` +
              `📍 المنطقة: ${extracted.preferredCity || "لم تُذكر"}\n` +
              `⏰ الوقت: ${new Date().toLocaleString("ar-SA", { timeZone: "Asia/Riyadh" })}`
          );
        }
      }
    } else {
      // Update existing lead with new data
      const updates: Record<string, unknown> = {};
      if (extracted.name && !existingLead.name) updates.name = extracted.name;
      if (extracted.phone && !existingLead.phone) updates.phone = extracted.phone;
      if (extracted.serviceType !== "unknown" && existingLead.serviceType === "unknown")
        updates.serviceType = extracted.serviceType;
      if (extracted.budget && !existingLead.budget) updates.budget = extracted.budget;
      if (extracted.preferredCity && !existingLead.preferredCity)
        updates.preferredCity = extracted.preferredCity;

      if (Object.keys(updates).length > 0) {
        await updateLeadBySession(sessionId, updates as any);

        // Notify owner when phone is newly captured
        if (updates.phone) {
          await notifyOwner(
            `📱 *تم الحصول على رقم عميل!*\n\n` +
              `👤 الاسم: ${extracted.name || existingLead.name || "لم يُذكر"}\n` +
              `📱 الجوال: ${updates.phone}\n` +
              `🎯 الخدمة: ${extracted.serviceType || existingLead.serviceType || "غير محدد"}`
          );
        }
      }
    }
  } catch (e) {
    // Lead extraction failed silently
    console.error("[Telegram] Lead extraction error:", e);
  }

  // Send reply with property images if properties are mentioned
  await bot.sendMessage(chatId, reply, {
    parse_mode: "Markdown",
    reply_markup: {
      keyboard: [
        [{ text: "🏠 عقارات للبيع" }, { text: "🔑 عقارات للإيجار" }],
        [{ text: "📊 إدارة الأملاك" }, { text: "📞 تواصل مع موظف" }],
        [{ text: "ℹ️ خدماتنا" }],
      ],
      resize_keyboard: true,
    },
  });

  // If user asks for properties, send them
  const lowerText = text.toLowerCase();
  if (
    text.includes("عقارات للبيع") ||
    text.includes("عقار للبيع") ||
    text.includes("أريد شراء") ||
    text.includes("ابي اشتري")
  ) {
    await sendProperties(chatId, "sale");
  } else if (
    text.includes("عقارات للإيجار") ||
    text.includes("عقار للإيجار") ||
    text.includes("أريد إيجار") ||
    text.includes("ابي ايجار")
  ) {
    await sendProperties(chatId, "rent");
  } else if (text.includes("تواصل مع موظف") || text.includes("موظف")) {
    await bot.sendMessage(
      chatId,
      `📞 *تواصل مع فريق تكامل مباشرة:*\n\n` +
        `واتساب: [اضغط هنا للتواصل](https://wa.me/${WHATSAPP_NUMBER})\n\n` +
        `سيرد عليك أحد موظفينا في أقرب وقت ممكن 🙏`,
      { parse_mode: "Markdown" }
    );
  }
}

// ─── Send properties list ─────────────────────────────────────────────────────
async function sendProperties(chatId: number, listingType: "sale" | "rent") {
  if (!bot) return;
  try {
    const props = await getProperties({ listingType, status: "available", limit: 5 });
    if (props.length === 0) {
      await bot.sendMessage(
        chatId,
        `لا توجد عقارات ${listingType === "sale" ? "للبيع" : "للإيجار"} متاحة حالياً.\nسيتواصل معك موظفنا لعرض أحدث الخيارات 🏡`,
        { parse_mode: "Markdown" }
      );
      return;
    }

    await bot.sendMessage(
      chatId,
      `🏡 *العقارات ${listingType === "sale" ? "للبيع" : "للإيجار"} المتاحة:*\n\n` +
        props.map(formatProperty).join("\n─────────────\n"),
      { parse_mode: "Markdown" }
    );

    // Send images if available
    for (const prop of props.slice(0, 3)) {
      const images = prop.images as string[];
      if (images && images.length > 0) {
        try {
          await bot.sendPhoto(chatId, images[0], {
            caption: `📸 ${prop.titleAr}`,
            parse_mode: "Markdown",
          });
        } catch (e) {
          // ignore photo errors
        }
      }
    }
  } catch (e) {
    console.error("[Telegram] sendProperties error:", e);
  }
}

// ─── Handle /start command ────────────────────────────────────────────────────
async function handleStart(msg: TelegramBot.Message) {
  if (!bot) return;
  const chatId = msg.chat.id;
  const firstName = msg.from?.first_name || "عزيزي العميل";

  const welcomeText =
    `🌟 *أهلاً وسهلاً ${firstName}!*\n\n` +
    `مرحباً بك في بوت *${COMPANY_NAME}*\n` +
    `📍 ${COMPANY_CITY}\n\n` +
    `نحن نقدم لك أفضل الخدمات العقارية:\n\n` +
    `🏠 *بيع وشراء العقارات*\n` +
    `🔑 *تأجير العقارات*\n` +
    `📊 *إدارة الأملاك*\n` +
    `🔍 *البحث عن سكن مناسب*\n\n` +
    `كيف يمكنني مساعدتك اليوم؟ 😊`;

  await bot.sendMessage(chatId, welcomeText, {
    parse_mode: "Markdown",
    reply_markup: {
      keyboard: [
        [{ text: "🏠 عقارات للبيع" }, { text: "🔑 عقارات للإيجار" }],
        [{ text: "📊 إدارة الأملاك" }, { text: "📞 تواصل مع موظف" }],
        [{ text: "ℹ️ خدماتنا" }],
      ],
      resize_keyboard: true,
    },
  });
}

// ─── Initialize bot ───────────────────────────────────────────────────────────
export async function initTelegramBot() {
  if (!TOKEN) {
    console.warn("[Telegram] No TELEGRAM_BOT_TOKEN set, skipping bot init");
    return;
  }

  // Stop any existing bot instance to prevent 409 conflicts
  if (bot) {
    try { await (bot as any).stopPolling(); } catch (_) {}
    bot = null;
  }

  // Delete webhook to ensure polling works cleanly
  try {
    const res = await fetch(`https://api.telegram.org/bot${TOKEN}/deleteWebhook?drop_pending_updates=true`);
    const data = await res.json() as { ok: boolean };
    if (data.ok) console.log("[Telegram] Webhook cleared");
  } catch (_) {}

  // Use polling only in development to avoid conflicts in production
  const isProduction = process.env.NODE_ENV === "production";
  bot = new TelegramBot(TOKEN, { polling: !isProduction });

  bot.onText(/\/start/, handleStart);

  bot.on("message", async (msg) => {
    if (!msg.text) return;
    if (msg.text.startsWith("/start")) return; // handled above
    try {
      await handleMessage(msg);
    } catch (e) {
      console.error("[Telegram] Error handling message:", e);
    }
  });

  if (!isProduction) {
    bot.on("polling_error", (err) => {
      // Suppress 409 conflict errors during hot reload
      if (!err.message.includes("409")) {
        console.error("[Telegram] Polling error:", err.message);
      }
    });
  }

  console.log(`[Telegram] Bot @Takamolestatebot started ✅ (${isProduction ? "webhook" : "polling"} mode)`);
}

export { bot };
