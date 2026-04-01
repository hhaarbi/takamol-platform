# تكامل — Real Estate Management Platform

نظام SaaS متكامل لإدارة الأملاك العقارية، مبني بـ React 19 + Express 4 + tRPC 11 + MySQL.

---

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
- **مساعد AI** — chatbot مدمج يعمل مع أي OpenAI-compatible API

---

## المتطلبات التقنية

| المكوّن | الإصدار |
|---------|----------|
| Node.js | 20 LTS+ |
| pnpm | 9+ |
| MySQL | 8.0+ أو MariaDB 10.6+ |
| Nginx | 1.18+ (للإنتاج) |
| PM2 | 5+ (للإنتاج) |
| Ubuntu | 22.04 LTS (للإنتاج) |

---

## التثبيت المحلي (Development)

```bash
# 1. استنساخ المشروع
git clone https://github.com/hhaarbi/takamol-platform.git
cd takamol-platform

# 2. تثبيت الـ dependencies
pnpm install

# 3. إعداد متغيرات البيئة
cp env.example .env
nano .env  # عدّل DATABASE_URL و JWT_SECRET

# 4. تطبيق Migration
mysql -u root -p realestate_db < deploy/migration.sql

# 5. تشغيل development server
pnpm dev
# → http://localhost:3000
```

---

## النشر على VPS (Ubuntu 22.04 — Contabo أو أي VPS)

### الخطوة 1 — إعداد السيرفر (مرة واحدة)

```bash
# SSH إلى السيرفر
ssh root@YOUR_VPS_IP

# استنساخ المشروع
git clone https://github.com/hhaarbi/takamol-platform.git /var/www/takamol
cd /var/www/takamol

# تشغيل سكريبت الإعداد
# يثبت: Node.js 20, MySQL 8.0, Nginx, PM2, Certbot, UFW, Fail2ban
sudo bash deploy/setup-vps.sh
```

### الخطوة 2 — إعداد متغيرات البيئة

```bash
cp /var/www/takamol/env.example /var/www/takamol/.env
nano /var/www/takamol/.env
```

**المتغيرات الإلزامية:**

```env
NODE_ENV=production
APP_URL=https://your-domain.com
DATABASE_URL=mysql://realestate_user:YOUR_PASSWORD@localhost:3306/realestate_db
JWT_SECRET=<run: openssl rand -base64 64>
```

### الخطوة 3 — تطبيق Migration

```bash
mysql -u realestate_user -p realestate_db < /var/www/takamol/deploy/migration.sql
```

### الخطوة 4 — نشر التطبيق

```bash
cd /var/www/takamol
bash deploy/deploy.sh
# يقوم تلقائياً بـ: install → build → migrate → PM2 start → health check → reload Nginx
```

### الخطوة 5 — إعداد Nginx

```bash
# استبدل your-domain.com بدومينك الفعلي
sudo cp deploy/nginx.conf /etc/nginx/sites-available/takamol
sudo sed -i 's/YOUR_DOMAIN/ACTUAL_DOMAIN/g' /etc/nginx/sites-available/takamol
sudo ln -s /etc/nginx/sites-available/takamol /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

### الخطوة 6 — تفعيل SSL (Let's Encrypt)

```bash
# تأكد أن DNS يشير إلى IP السيرفر أولاً
sudo certbot --nginx -d ACTUAL_DOMAIN -d www.ACTUAL_DOMAIN
# التجديد التلقائي مُفعَّل تلقائياً عبر systemd timer
```

### الخطوة 7 — التحقق

```bash
pm2 status takamol
curl https://ACTUAL_DOMAIN/api/trpc/auth.me?batch=1&input=%7B%7D
```

---

## التحديث (Redeploy)

```bash
cd /var/www/takamol
bash deploy/deploy.sh
# git pull → build → migrate → PM2 zero-downtime reload → health check
```

---

## GitHub Actions — Auto Deploy

عند كل `push` إلى `main`، يعمل GitHub Actions تلقائياً على:

```
Install → TypeScript Check → Tests → Build → SSH Deploy → Health Check
```

### إعداد GitHub Secrets

اذهب إلى: **GitHub → Repository → Settings → Secrets and variables → Actions** وأضف:

| Secret | القيمة |
|--------|--------|
| `VPS_HOST` | عنوان IP أو دومين الـ VPS (e.g. `85.215.xxx.xxx`) |
| `VPS_USER` | مستخدم SSH (e.g. `ubuntu` أو `root`) |
| `VPS_PORT` | منفذ SSH (افتراضي: `22`) |
| `VPS_SSH_KEY` | محتوى ملف المفتاح الخاص كاملاً (BEGIN...END) |
| `APP_DIR` | مسار المشروع على VPS (e.g. `/var/www/takamol`) |
| `DATABASE_URL` | سلسلة اتصال قاعدة البيانات |
| `JWT_SECRET` | مفتاح توقيع الجلسات |
| `STRIPE_SECRET_KEY` | مفتاح Stripe السري |

### إعداد SSH Key لـ CI/CD

```bash
# على جهازك المحلي — أنشئ مفتاح مخصص لـ CI/CD:
ssh-keygen -t ed25519 -C "github-actions-takamol" -f ~/.ssh/takamol_deploy

# أضف المفتاح العام إلى VPS:
ssh-copy-id -i ~/.ssh/takamol_deploy.pub USER@YOUR_VPS_IP

# انسخ محتوى المفتاح الخاص وأضفه كـ VPS_SSH_KEY في GitHub Secrets:
cat ~/.ssh/takamol_deploy
```

### تدفق النشر

```
[GitHub Push] → [CI: Install + TypeScript + Tests + Build]
                              ↓ (on success)
                    [Deploy: SSH to VPS]
                              ↓
                   [bash deploy/deploy.sh]
                              ↓
       git pull → pnpm install → build → migrations → pm2 reload
                              ↓
                     [Health Check]
                              ↓
                  ✅ Deploy Successful
```

### تشغيل يدوي

```bash
# من GitHub UI: Actions → CI/CD — Deploy to VPS → Run workflow
# أو بدفع commit جديد إلى main
git push origin main
```

---

## إعداد البريد الإلكتروني (Resend)

```bash
# 1. سجّل في https://resend.com (مجاني حتى 3000 إيميل/شهر)
# 2. أضف دومينك وتحقق منه
# 3. أنشئ API Key
# 4. أضف في .env:
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=noreply@ACTUAL_DOMAIN
```

### DNS Records للبريد الإلكتروني

| النوع | الاسم | القيمة |
|-------|-------|--------|
| `A` | `@` | `YOUR_VPS_IP` |
| `A` | `www` | `YOUR_VPS_IP` |
| `MX` | `@` | `feedback-smtp.us-east-1.amazonses.com` (تُعطى من Resend) |
| `TXT` | `@` | `v=spf1 include:amazonses.com ~all` |
| `TXT` | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:admin@ACTUAL_DOMAIN` |
| `CNAME` | (من Resend) | (من Resend — للـ DKIM) |

---

## متغيرات البيئة

راجع [`env.example`](./env.example) للقائمة الكاملة. المتغيرات الأساسية:

| المتغير | إلزامي | الوصف |
|---------|--------|-------|
| `NODE_ENV` | نعم | `production` أو `development` |
| `APP_URL` | نعم | رابط التطبيق الكامل، مثال: `https://takamol.example.com` |
| `DATABASE_URL` | نعم | رابط اتصال MySQL |
| `JWT_SECRET` | نعم | مفتاح عشوائي 64 حرف لتوقيع الجلسات |
| `TELEGRAM_BOT_TOKEN` | لا | توكن بوت التلغرام للإشعارات |
| `OPENAI_API_KEY` | لا | مفتاح LLM API |
| `OPENAI_BASE_URL` | لا | رابط LLM API (OpenAI أو أي بديل متوافق) |
| `STORAGE_PROVIDER` | لا | `local` أو `s3` أو `r2` |
| `EMAIL_PROVIDER` | لا | `resend` أو `smtp` |
| `RESEND_API_KEY` | لا | مفتاح Resend API |
| `EMAIL_FROM` | لا | عنوان المرسل (مثال: `noreply@domain.com`) |
| `OTP_EXPIRES_MINUTES` | لا | مدة صلاحية OTP (افتراضي: 5 دقائق) |

---

## هيكل المشروع

```
├── client/src/
│   ├── pages/          ← صفحات التطبيق
│   ├── components/     ← مكونات قابلة للإعادة
│   └── contexts/       ← React contexts
├── server/
│   ├── routers.ts      ← tRPC procedures
│   ├── db.ts           ← Query helpers
│   ├── scheduler.ts    ← Cron jobs
│   └── _core/          ← Framework core (auth, llm, storage)
├── drizzle/
│   └── schema.ts       ← Database schema
├── deploy/
│   ├── migration.sql   ← Full production migration
│   ├── nginx.conf      ← Nginx reverse proxy config
│   ├── setup-vps.sh    ← One-time VPS setup
│   └── deploy.sh       ← Deploy/update script
├── ecosystem.config.js ← PM2 cluster configuration
└── env.example         ← Environment variables reference
```

---

## الأوامر المتاحة

```bash
pnpm dev          # تشغيل development server
pnpm build        # بناء للإنتاج (→ dist/)
pnpm start        # تشغيل production server
pnpm test         # تشغيل Vitest tests (watch mode)
pnpm test --run   # تشغيل مرة واحدة
```

## أوامر PM2

```bash
pm2 status takamol          # حالة التطبيق
pm2 logs takamol            # متابعة الـ logs
pm2 monit                   # مراقبة الأداء
pm2 restart takamol         # إعادة التشغيل
pm2 reload takamol          # zero-downtime reload
pm2 stop takamol            # إيقاف
```

---

## الـ Cron Jobs

| الوقت | المهمة |
|-------|--------|
| 7:00 AM يومياً | `processOverdueEscalation` — تحديث المتأخرات والغرامات |
| 8:00 AM يومياً | `generateOwnerMonthlyReports` — تقارير المالكين |
| 9:00 AM يومياً | `checkUpcomingPayments` — تنبيهات الدفعات القادمة |

---

## الأدوار والصلاحيات

| الدور | الصلاحيات |
|-------|-----------|
| `super_admin` | كامل الصلاحيات على جميع الشركات |
| `admin` | إدارة كاملة لشركته |
| `owner` | عرض تقارير عقاراته فقط |
| `broker` | إدارة العملاء والعقود |
| `tenant` | بوابة المستأجر (عقد + صيانة) |

---

## الاستقلالية عن Manus

| الخدمة | Manus | البديل المستقل |
|--------|-------|----------------|
| LLM | Manus Forge | OpenAI API / Groq / Azure (عبر `OPENAI_BASE_URL`) |
| Storage | Manus S3 | AWS S3 / Cloudflare R2 / Local |
| Notifications | Manus Notifications | Telegram Bot (مُفعَّل بالفعل) |
| Auth | Manus OAuth | JWT مستقل (مدعوم تلقائياً) |
| Hosting | Manus Platform | أي VPS (Contabo, DigitalOcean, Hetzner...) |

---

## الأمان

| الطبقة | الحماية |
|--------|---------|
| **CORS** | مقيّد بـ `APP_URL` في الإنتاج |
| **Cookies** | `sameSite=strict`, `secure=true`, `httpOnly=true` |
| **Rate Limiting** | Nginx (30 req/min API, 10 req/min auth) + Express |
| **SQL Injection** | Drizzle ORM (parameterized queries) |
| **Security Headers** | HSTS, X-Frame-Options, X-Content-Type-Options |
| **HTTPS** | Let's Encrypt (certbot) |
| **Firewall** | UFW (SSH + HTTP + HTTPS فقط) |
| **Fail2ban** | حماية من brute force على SSH و Nginx |

---

## استكشاف الأخطاء

```bash
# التطبيق لا يعمل
pm2 logs takamol --lines 50

# أخطاء Nginx
sudo nginx -t
sudo tail -f /var/log/nginx/takamol-error.log

# مشكلة قاعدة البيانات
mysql -u realestate_user -p -e "SELECT 1;"

# Port مشغول
sudo ss -tlnp | grep :3000
pm2 delete takamol && pm2 start ecosystem.config.js --env production
```

---

## الترخيص

جميع الحقوق محفوظة © تكامل لإدارة الأملاك
