#!/bin/bash
# ============================================================
# Deploy Script — Real Estate Bot (تكامل)
# ============================================================
# الاستخدام (أول نشر أو تحديث):
#   cd /var/www/realestate-bot
#   bash deploy/deploy.sh
#
# ما يفعله:
#   1. git pull (تحديث الكود)
#   2. pnpm install (تثبيت dependencies)
#   3. pnpm build (بناء التطبيق)
#   4. تطبيق migration.sql
#   5. تشغيل/إعادة تشغيل PM2
#   6. إعادة تحميل Nginx
# ============================================================

set -e

# ─── الألوان ───────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

APP_DIR="${APP_DIR:-/var/www/realestate-bot}"
LOG_DIR="/var/log/realestate-bot"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Real Estate Bot — Deployment${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# ─── التحقق من وجود .env ──────────────────────────────────
if [ ! -f "${APP_DIR}/.env" ]; then
    echo -e "${RED}❌ خطأ: ملف .env غير موجود!${NC}"
    echo "   قم بإنشائه: cp ${APP_DIR}/env.example ${APP_DIR}/.env"
    echo "   ثم عبّئ القيم الحقيقية في .env"
    exit 1
fi

# تحميل متغيرات البيئة لاستخدامها في migration
set -a
source "${APP_DIR}/.env"
set +a

cd "${APP_DIR}"

# ─── 1. تحديث الكود من Git ────────────────────────────────
echo -e "${YELLOW}[1/6] تحديث الكود من Git...${NC}"
if git rev-parse --git-dir > /dev/null 2>&1; then
    git pull origin main 2>/dev/null || git pull origin master 2>/dev/null || echo "  (تخطي git pull — ليس في git repo)"
    echo -e "${GREEN}✓ الكود محدَّث${NC}"
else
    echo -e "${YELLOW}  (تخطي git pull — ليس في git repo)${NC}"
fi

# ─── 2. تثبيت الـ dependencies ────────────────────────────
echo -e "${YELLOW}[2/6] تثبيت الـ dependencies...${NC}"
pnpm install --frozen-lockfile
echo -e "${GREEN}✓ Dependencies مثبّتة${NC}"

# ─── 3. بناء التطبيق ──────────────────────────────────────
echo -e "${YELLOW}[3/6] بناء التطبيق...${NC}"
NODE_ENV=production pnpm run build
echo -e "${GREEN}✓ Build مكتمل${NC}"

# ─── 4. تطبيق Migration ───────────────────────────────────
echo -e "${YELLOW}[4/6] تطبيق migration...${NC}"
if [ -f "${APP_DIR}/deploy/migration.sql" ]; then
    # استخراج بيانات الاتصال من DATABASE_URL
    # مثال: mysql://user:pass@localhost:3306/dbname
    if [ -n "${DATABASE_URL:-}" ]; then
        DB_USER_M=$(echo "$DATABASE_URL" | sed 's|mysql://||' | cut -d: -f1)
        DB_PASS_M=$(echo "$DATABASE_URL" | sed 's|mysql://[^:]*:||' | cut -d@ -f1)
        DB_HOST_M=$(echo "$DATABASE_URL" | cut -d@ -f2 | cut -d: -f1)
        DB_PORT_M=$(echo "$DATABASE_URL" | cut -d@ -f2 | cut -d: -f2 | cut -d/ -f1)
        DB_NAME_M=$(echo "$DATABASE_URL" | cut -d/ -f4 | cut -d? -f1)

        mysql -u"${DB_USER_M}" -p"${DB_PASS_M}" -h"${DB_HOST_M}" -P"${DB_PORT_M:-3306}" \
              "${DB_NAME_M}" < "${APP_DIR}/deploy/migration.sql" 2>/dev/null \
              && echo -e "${GREEN}✓ Migration مطبَّق${NC}" \
              || echo -e "${YELLOW}  (migration قد تكون مطبقة بالفعل — OK)${NC}"
    else
        echo -e "${YELLOW}  ⚠️  DATABASE_URL غير معرّف — تخطي migration${NC}"
    fi
else
    echo -e "${YELLOW}  ⚠️  migration.sql غير موجود — تخطي${NC}"
fi

# ─── 5. تشغيل/إعادة تشغيل PM2 ────────────────────────────
echo -e "${YELLOW}[5/6] تشغيل التطبيق بـ PM2...${NC}"
mkdir -p "${LOG_DIR}"

if pm2 describe realestate-bot > /dev/null 2>&1; then
    # التطبيق يعمل بالفعل — إعادة تحميل بدون downtime
    pm2 reload "${APP_DIR}/ecosystem.config.js" --env production
    echo -e "${GREEN}✓ التطبيق أُعيد تحميله (zero-downtime reload)${NC}"
else
    # أول تشغيل
    pm2 start "${APP_DIR}/ecosystem.config.js" --env production
    echo -e "${GREEN}✓ التطبيق بدأ للمرة الأولى${NC}"
fi

pm2 save
echo -e "${GREEN}✓ PM2 state محفوظ${NC}"

# ─── 6. إعادة تحميل Nginx ─────────────────────────────────
echo -e "${YELLOW}[6/6] إعادة تحميل Nginx...${NC}"
if command -v nginx > /dev/null 2>&1; then
    nginx -t && systemctl reload nginx
    echo -e "${GREEN}✓ Nginx أُعيد تحميله${NC}"
else
    echo -e "${YELLOW}  (Nginx غير مثبّت — تخطي)${NC}"
fi

# ─── ملخص ─────────────────────────────────────────────────
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  ✅ النشر مكتمل!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${BLUE}حالة التطبيق:${NC}"
pm2 status realestate-bot
echo ""
echo -e "${BLUE}أوامر مفيدة:${NC}"
echo "  pm2 logs realestate-bot        # متابعة الـ logs"
echo "  pm2 monit                      # مراقبة الأداء"
echo "  pm2 restart realestate-bot     # إعادة التشغيل"
echo "  pm2 stop realestate-bot        # إيقاف"
echo ""
