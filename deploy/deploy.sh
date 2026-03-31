#!/bin/bash
# ============================================================
# Deploy Script — Real Estate Bot
# تشغيل: bash deploy/deploy.sh
# ============================================================

set -e

APP_DIR="/var/www/realestate-bot"
LOG_DIR="/var/log/realestate-bot"

echo "============================================"
echo "  Real Estate Bot — Deployment"
echo "============================================"

# ─── التحقق من وجود .env ──────────────────────────────────
if [ ! -f "${APP_DIR}/.env" ]; then
    echo "❌ خطأ: ملف .env غير موجود!"
    echo "   قم بإنشائه: cp ${APP_DIR}/env.example ${APP_DIR}/.env"
    exit 1
fi

cd ${APP_DIR}

# ─── 1. تثبيت الـ dependencies ────────────────────────────
echo "[1/5] تثبيت الـ dependencies..."
pnpm install --frozen-lockfile

# ─── 2. بناء التطبيق ──────────────────────────────────────
echo "[2/5] بناء التطبيق..."
pnpm run build

# ─── 3. تشغيل migrations ──────────────────────────────────
echo "[3/5] تشغيل migrations..."
# تشغيل migration SQL الكامل
if [ -f "${APP_DIR}/deploy/migration.sql" ]; then
    echo "  تطبيق migration.sql..."
    mysql "${DB_NAME}" < "${APP_DIR}/deploy/migration.sql" 2>/dev/null || echo "  (migration قد تكون مطبقة بالفعل)"
fi

# ─── 4. تشغيل التطبيق بـ PM2 ──────────────────────────────
echo "[4/5] تشغيل التطبيق..."
mkdir -p ${LOG_DIR}

# إيقاف النسخة القديمة إذا كانت تعمل
pm2 stop realestate-bot 2>/dev/null || true
pm2 delete realestate-bot 2>/dev/null || true

# تشغيل النسخة الجديدة
pm2 start ${APP_DIR}/ecosystem.config.js --env production
pm2 save

# ─── 5. إعادة تحميل Nginx ─────────────────────────────────
echo "[5/5] إعادة تحميل Nginx..."
nginx -t && systemctl reload nginx

echo ""
echo "============================================"
echo "  ✅ النشر مكتمل!"
echo "============================================"
echo ""
echo "حالة التطبيق:"
pm2 status realestate-bot
echo ""
echo "لمتابعة الـ logs:"
echo "  pm2 logs realestate-bot"
echo ""
