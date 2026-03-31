# تكامل — نظام إدارة الأملاك الذكي

<div dir="rtl">

نظام SaaS متكامل لإدارة الأملاك العقارية، مبني بـ React 19 + Express 4 + tRPC 11 + MySQL.

## المميزات الرئيسية

- **Multi-Tenancy كامل** — عزل بيانات كل شركة بـ `companyId` إلزامي
- **إدارة العقود والدفعات** — جدول دفعات تلقائي عند إنشاء العقد
- **Late Fees Automation** — احتساب الغرامات تلقائياً عبر cron job يومي
- **Owner Transfer Automation** — تحويل صافي المالك فور تسجيل الدفع
- **Smart Alerts** — تنبيهات ذكية مع priority وaction وstatus
- **بوابة المستأجر** — وصول برمز العقد بدون تسجيل دخول
- **تقارير المالك** — تقارير شهرية مفصلة مع PDF
- **نظام الاشتراكات** — باقات متعددة مع Feature Gating
- **سندات القبض والصرف** — PDF احترافي مع واترمارك
- **نظام FAL** — إدارة تراخيص الفال

## المتطلبات التقنية

- Node.js 20 LTS
- MySQL 8.0+ أو MariaDB 10.6+
- pnpm 8+
- PM2 (للإنتاج)
- Nginx (للإنتاج)

## التثبيت المحلي

```bash
# 1. استنساخ المشروع
git clone https://github.com/your-org/realestate-bot.git
cd realestate-bot

# 2. تثبيت الـ dependencies
pnpm install

# 3. إعداد متغيرات البيئة
cp env.example .env
# عدّل .env بالقيم الحقيقية

# 4. إنشاء قاعدة البيانات
mysql -u root -p -e "CREATE DATABASE realestate_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p realestate_db < deploy/migration.sql

# 5. تشغيل التطبيق (development)
pnpm dev
```

## النشر على VPS (Ubuntu 22.04)

```bash
# 1. إعداد السيرفر (مرة واحدة فقط)
sudo bash deploy/setup-vps.sh

# 2. رفع الكود
git clone https://github.com/your-org/realestate-bot.git /var/www/realestate-bot
cd /var/www/realestate-bot

# 3. إعداد .env
cp env.example .env
nano .env  # عبّئ القيم الحقيقية

# 4. النشر
bash deploy/deploy.sh

# 5. تفعيل SSL
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## متغيرات البيئة المطلوبة

| المتغير | الوصف | مثال |
|---|---|---|
| `DATABASE_URL` | رابط قاعدة البيانات | `mysql://user:pass@localhost:3306/db` |
| `JWT_SECRET` | مفتاح توقيع الـ JWT (32+ حرف) | `random-32-char-string` |
| `TELEGRAM_BOT_TOKEN` | توكن بوت التلغرام للإشعارات | `123:AAF...` |
| `TELEGRAM_OWNER_CHAT_ID` | Chat ID لاستقبال الإشعارات | `123456789` |
| `NODE_ENV` | بيئة التشغيل | `production` |

## هيكل المشروع

```
client/src/
  pages/          ← صفحات التطبيق
  components/     ← مكونات قابلة للإعادة
  contexts/       ← React contexts
server/
  routers.ts      ← tRPC procedures
  db.ts           ← Query helpers
  scheduler.ts    ← Cron jobs
  _core/          ← Framework core (auth, llm, storage)
drizzle/
  schema.ts       ← Database schema
deploy/
  migration.sql   ← Full production migration
  nginx.conf      ← Nginx configuration
  setup-vps.sh    ← VPS setup script
  deploy.sh       ← Deployment script
```

## الـ Cron Jobs

| الوقت | المهمة |
|---|---|
| 7:00 AM يومياً | `processOverdueEscalation` — تحديث المتأخرات والغرامات |
| 8:00 AM يومياً | `generateOwnerMonthlyReports` — تقارير المالكين |
| 9:00 AM يومياً | `checkUpcomingPayments` — تنبيهات الدفعات القادمة |

## الأدوار والصلاحيات

| الدور | الصلاحيات |
|---|---|
| `super_admin` | كامل الصلاحيات على جميع الشركات |
| `admin` | إدارة كاملة لشركته |
| `owner` | عرض تقارير عقاراته فقط |
| `broker` | إدارة العملاء والعقود |
| `tenant` | بوابة المستأجر (عقد + صيانة) |

## الاستبدال المستقل عن Manus

| الخدمة | Manus | البديل المستقل |
|---|---|---|
| LLM | Manus Forge | OpenAI API (تغيير `OPENAI_BASE_URL`) |
| Storage | Manus S3 | AWS S3 / Cloudflare R2 |
| Notifications | Manus Notifications | Telegram Bot (مُفعَّل بالفعل) |
| Auth | Manus OAuth | JWT مستقل (مدعوم) |

## الاختبارات

```bash
pnpm test          # تشغيل جميع الاختبارات
pnpm test --run    # تشغيل مرة واحدة بدون watch
```

## الترخيص

جميع الحقوق محفوظة © 2025

</div>
