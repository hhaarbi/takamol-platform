#!/bin/bash
# ============================================================
# VPS Setup Script — Real Estate Bot
# Ubuntu 22.04 LTS
# تشغيل: sudo bash setup-vps.sh
# ============================================================

set -e  # إيقاف عند أي خطأ

DOMAIN="yourdomain.com"
APP_DIR="/var/www/realestate-bot"
LOG_DIR="/var/log/realestate-bot"
DB_NAME="realestate_db"
DB_USER="realestate_user"
DB_PASS="$(openssl rand -base64 32)"  # كلمة مرور عشوائية

echo "============================================"
echo "  Real Estate Bot — VPS Setup"
echo "  Ubuntu 22.04 LTS"
echo "============================================"

# ─── 1. تحديث النظام ──────────────────────────────────────
echo "[1/10] تحديث النظام..."
apt-get update -y && apt-get upgrade -y
apt-get install -y curl wget git unzip build-essential software-properties-common

# ─── 2. تثبيت Node.js 20 LTS ──────────────────────────────
echo "[2/10] تثبيت Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node --version
npm --version

# تثبيت pnpm
npm install -g pnpm
pnpm --version

# ─── 3. تثبيت PM2 ─────────────────────────────────────────
echo "[3/10] تثبيت PM2..."
npm install -g pm2
pm2 --version

# إعداد PM2 للبدء التلقائي مع النظام
pm2 startup systemd -u root --hp /root
systemctl enable pm2-root

# ─── 4. تثبيت MySQL ───────────────────────────────────────
echo "[4/10] تثبيت MySQL..."
apt-get install -y mysql-server
systemctl start mysql
systemctl enable mysql

# إنشاء قاعدة البيانات والمستخدم
mysql -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';"
mysql -e "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

echo "✅ قاعدة البيانات: ${DB_NAME}"
echo "✅ المستخدم: ${DB_USER}"
echo "✅ كلمة المرور: ${DB_PASS}"
echo "⚠️  احفظ كلمة المرور في مكان آمن!"

# ─── 5. تثبيت Nginx ───────────────────────────────────────
echo "[5/10] تثبيت Nginx..."
apt-get install -y nginx
systemctl start nginx
systemctl enable nginx

# ─── 6. تثبيت Certbot (SSL) ───────────────────────────────
echo "[6/10] تثبيت Certbot..."
apt-get install -y certbot python3-certbot-nginx

# ─── 7. إنشاء مجلدات التطبيق ─────────────────────────────
echo "[7/10] إنشاء مجلدات التطبيق..."
mkdir -p ${APP_DIR}
mkdir -p ${LOG_DIR}
mkdir -p /var/www/certbot

# ─── 8. إعداد Firewall ────────────────────────────────────
echo "[8/10] إعداد Firewall..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
ufw status

# ─── 9. إعداد Nginx ───────────────────────────────────────
echo "[9/10] إعداد Nginx..."
cp $(dirname "$0")/nginx.conf /etc/nginx/sites-available/realestate-bot

# تعديل الدومين
sed -i "s/yourdomain.com/${DOMAIN}/g" /etc/nginx/sites-available/realestate-bot

# تفعيل الموقع
ln -sf /etc/nginx/sites-available/realestate-bot /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# اختبار Nginx
nginx -t
systemctl reload nginx

# ─── 10. طباعة معلومات الاتصال ───────────────────────────
echo ""
echo "============================================"
echo "  ✅ الإعداد مكتمل!"
echo "============================================"
echo ""
echo "DATABASE_URL=mysql://${DB_USER}:${DB_PASS}@localhost:3306/${DB_NAME}"
echo ""
echo "الخطوات التالية:"
echo "1. رفع الكود: git clone <repo> ${APP_DIR}"
echo "2. إنشاء .env: cp ${APP_DIR}/env.example ${APP_DIR}/.env"
echo "3. تعبئة .env بالقيم الحقيقية"
echo "4. تشغيل: bash ${APP_DIR}/deploy/deploy.sh"
echo "5. SSL: certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
echo ""
