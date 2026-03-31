#!/bin/bash
# ============================================================
# VPS Setup Script — Real Estate Bot (تكامل)
# Ubuntu 22.04 LTS
# ============================================================
# الاستخدام:
#   sudo bash deploy/setup-vps.sh
#
# ما يفعله هذا السكريبت:
#   1. تحديث النظام
#   2. تثبيت Node.js 20 LTS + pnpm
#   3. تثبيت PM2 (process manager)
#   4. تثبيت MySQL 8.0 + إنشاء DB/User
#   5. تثبيت Nginx
#   6. تثبيت Certbot (Let's Encrypt SSL)
#   7. إنشاء مجلدات التطبيق
#   8. إعداد Firewall (UFW)
#   9. إعداد Fail2ban
#   10. تطبيق Nginx config
# ============================================================

set -e  # إيقاف عند أي خطأ

# ─── الألوان ───────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# ─── الإعدادات (يمكن تجاوزها بمتغيرات البيئة) ────────────
DOMAIN="${DOMAIN:-yourdomain.com}"
APP_DIR="${APP_DIR:-/var/www/realestate-bot}"
LOG_DIR="/var/log/realestate-bot"
DB_NAME="${DB_NAME:-realestate_db}"
DB_USER="${DB_USER:-realestate_user}"
DB_PASS="${DB_PASS:-$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)}"
NODE_VERSION="20"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Real Estate Bot — VPS Setup${NC}"
echo -e "${BLUE}  Ubuntu 22.04 LTS${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# التحقق من صلاحيات root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}❌ يجب تشغيل هذا السكريبت بصلاحيات root${NC}"
   echo "   استخدم: sudo bash deploy/setup-vps.sh"
   exit 1
fi

# ─── 1. تحديث النظام ──────────────────────────────────────
echo -e "${YELLOW}[1/10] تحديث النظام...${NC}"
apt-get update -y
apt-get upgrade -y
apt-get install -y \
    curl wget git unzip build-essential \
    software-properties-common apt-transport-https \
    ca-certificates gnupg lsb-release \
    htop net-tools ufw fail2ban
echo -e "${GREEN}✓ النظام محدَّث${NC}"

# ─── 2. تثبيت Node.js 20 LTS + pnpm ──────────────────────
echo -e "${YELLOW}[2/10] تثبيت Node.js ${NODE_VERSION} LTS...${NC}"
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
apt-get install -y nodejs
echo -e "${GREEN}✓ Node.js $(node --version) مثبّت${NC}"

npm install -g pnpm
echo -e "${GREEN}✓ pnpm $(pnpm --version) مثبّت${NC}"

# ─── 3. تثبيت PM2 ─────────────────────────────────────────
echo -e "${YELLOW}[3/10] تثبيت PM2...${NC}"
npm install -g pm2
echo -e "${GREEN}✓ PM2 $(pm2 --version) مثبّت${NC}"

# إعداد PM2 للبدء التلقائي مع النظام
pm2 startup systemd -u root --hp /root 2>/dev/null | grep "sudo" | bash || true
echo -e "${GREEN}✓ PM2 startup مُعدّ${NC}"

# ─── 4. تثبيت MySQL 8.0 ───────────────────────────────────
echo -e "${YELLOW}[4/10] تثبيت MySQL 8.0...${NC}"
apt-get install -y mysql-server mysql-client
systemctl start mysql
systemctl enable mysql

# إنشاء قاعدة البيانات والمستخدم
mysql -u root << MYSQL_SCRIPT
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost'
  IDENTIFIED BY '${DB_PASS}';

GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';

FLUSH PRIVILEGES;
MYSQL_SCRIPT

echo -e "${GREEN}✓ MySQL مثبّت وقاعدة البيانات جاهزة${NC}"
echo -e "${YELLOW}   اسم المستخدم: ${DB_USER}${NC}"
echo -e "${YELLOW}   كلمة المرور:  ${DB_PASS}${NC}"

# ─── 5. تثبيت Nginx ───────────────────────────────────────
echo -e "${YELLOW}[5/10] تثبيت Nginx...${NC}"
apt-get install -y nginx
systemctl start nginx
systemctl enable nginx
echo -e "${GREEN}✓ Nginx مثبّت${NC}"

# ─── 6. تثبيت Certbot (SSL) ───────────────────────────────
echo -e "${YELLOW}[6/10] تثبيت Certbot (Let's Encrypt)...${NC}"
apt-get install -y certbot python3-certbot-nginx
echo -e "${GREEN}✓ Certbot مثبّت${NC}"

# ─── 7. إنشاء مجلدات التطبيق ─────────────────────────────
echo -e "${YELLOW}[7/10] إنشاء مجلدات التطبيق...${NC}"
mkdir -p "${APP_DIR}"
mkdir -p "${LOG_DIR}"
mkdir -p /var/www/certbot
echo -e "${GREEN}✓ المجلدات جاهزة: ${APP_DIR}${NC}"

# ─── 8. إعداد Firewall (UFW) ──────────────────────────────
echo -e "${YELLOW}[8/10] إعداد Firewall...${NC}"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
echo -e "${GREEN}✓ Firewall مُفعَّل (SSH + HTTP + HTTPS)${NC}"

# ─── 9. إعداد Fail2ban ────────────────────────────────────
echo -e "${YELLOW}[9/10] إعداد Fail2ban...${NC}"
systemctl start fail2ban
systemctl enable fail2ban
echo -e "${GREEN}✓ Fail2ban مُفعَّل${NC}"

# ─── 10. تطبيق Nginx Config ───────────────────────────────
echo -e "${YELLOW}[10/10] تطبيق Nginx config...${NC}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -f "${SCRIPT_DIR}/nginx.conf" ]; then
    cp "${SCRIPT_DIR}/nginx.conf" /etc/nginx/sites-available/realestate-bot
    # تعديل الدومين في الـ config
    sed -i "s/yourdomain\.com/${DOMAIN}/g" /etc/nginx/sites-available/realestate-bot
    ln -sf /etc/nginx/sites-available/realestate-bot /etc/nginx/sites-enabled/realestate-bot
    rm -f /etc/nginx/sites-enabled/default
    nginx -t && systemctl reload nginx
    echo -e "${GREEN}✓ Nginx config مُطبَّق${NC}"
else
    echo -e "${YELLOW}⚠️  لم يتم العثور على nginx.conf، يرجى تطبيقه يدوياً${NC}"
fi

# ─── ملخص الإعداد ─────────────────────────────────────────
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  ✅ الإعداد مكتمل!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${BLUE}معلومات قاعدة البيانات (احفظها الآن):${NC}"
echo "  DATABASE_URL=mysql://${DB_USER}:${DB_PASS}@localhost:3306/${DB_NAME}"
echo ""
echo -e "${BLUE}الخطوات التالية:${NC}"
echo ""
echo "  1. استنساخ المشروع:"
echo "     git clone https://github.com/your-org/realestate-bot.git ${APP_DIR}"
echo ""
echo "  2. إنشاء ملف .env:"
echo "     cp ${APP_DIR}/env.example ${APP_DIR}/.env"
echo "     nano ${APP_DIR}/.env"
echo "     # أضف: DATABASE_URL=mysql://${DB_USER}:${DB_PASS}@localhost:3306/${DB_NAME}"
echo ""
echo "  3. تشغيل Migration:"
echo "     mysql -u ${DB_USER} -p${DB_PASS} ${DB_NAME} < ${APP_DIR}/deploy/migration.sql"
echo ""
echo "  4. نشر التطبيق:"
echo "     cd ${APP_DIR} && bash deploy/deploy.sh"
echo ""
echo "  5. تفعيل SSL:"
echo "     sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
echo ""
echo -e "${RED}⚠️  احفظ كلمة مرور قاعدة البيانات: ${DB_PASS}${NC}"
