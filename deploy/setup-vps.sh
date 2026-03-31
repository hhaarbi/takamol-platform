#!/usr/bin/env bash
# ============================================================
# VPS Setup Script — تكامل Real Estate Platform
# Target: Ubuntu 22.04 LTS (Contabo VPS or any VPS)
# Run as root: sudo bash deploy/setup-vps.sh
# ============================================================
set -euo pipefail

# ─── Colors ───────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC}   $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ─── Check root ───────────────────────────────────────────────
[[ $EUID -ne 0 ]] && error "Run as root: sudo bash deploy/setup-vps.sh"

# ─── Configuration (override via env vars) ────────────────────
DOMAIN="${DOMAIN:-your-domain.com}"
APP_USER="${APP_USER:-ubuntu}"
APP_DIR="${APP_DIR:-/var/www/takamol}"
DB_NAME="${DB_NAME:-realestate_db}"
DB_USER="${DB_USER:-realestate_user}"
DB_PASS="${DB_PASS:-$(openssl rand -base64 24 | tr -d '/+=')}"
NODE_VERSION="20"

echo -e "${BLUE}============================================================${NC}"
echo -e "${BLUE}  تكامل Real Estate Platform — VPS Setup${NC}"
echo -e "${BLUE}  Ubuntu 22.04 LTS${NC}"
echo -e "${BLUE}============================================================${NC}"
echo ""

# ─── 1. System Update ─────────────────────────────────────────
info "[1/10] Updating system packages..."
apt-get update -qq && apt-get upgrade -y -qq
apt-get install -y -qq \
    curl wget git build-essential \
    software-properties-common apt-transport-https \
    ca-certificates gnupg lsb-release \
    ufw fail2ban certbot python3-certbot-nginx \
    unzip htop net-tools
success "System packages installed"

# ─── 2. Node.js LTS ───────────────────────────────────────────
info "[2/10] Installing Node.js $NODE_VERSION LTS..."
if ! command -v node &>/dev/null || [[ "$(node -v | cut -d. -f1 | tr -d 'v')" -lt "$NODE_VERSION" ]]; then
    curl -fsSL "https://deb.nodesource.com/setup_${NODE_VERSION}.x" | bash -
    apt-get install -y nodejs
fi
success "Node.js $(node -v) installed"

# ─── 3. pnpm + PM2 ────────────────────────────────────────────
info "[3/10] Installing pnpm and PM2..."
npm install -g pnpm pm2 2>/dev/null
success "pnpm $(pnpm -v) + PM2 $(pm2 -v) installed"

# ─── 4. MySQL 8.0 ─────────────────────────────────────────────
info "[4/10] Installing MySQL 8.0..."
if ! command -v mysql &>/dev/null; then
    apt-get install -y mysql-server mysql-client
    systemctl start mysql
    systemctl enable mysql
fi
success "MySQL $(mysql --version | awk '{print $3}') installed"

# ─── 5. Create Database & User ────────────────────────────────
info "[5/10] Creating database and user..."
mysql -u root <<SQL
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
SQL
success "Database '${DB_NAME}' and user '${DB_USER}' created"

# ─── 6. Nginx ─────────────────────────────────────────────────
info "[6/10] Installing Nginx..."
if ! command -v nginx &>/dev/null; then
    apt-get install -y nginx
    systemctl start nginx
    systemctl enable nginx
fi
success "Nginx $(nginx -v 2>&1 | awk -F/ '{print $2}') installed"

# ─── 7. App Directory ─────────────────────────────────────────
info "[7/10] Creating app directory: $APP_DIR"
mkdir -p "$APP_DIR"
chown -R "$APP_USER:$APP_USER" "$APP_DIR"
mkdir -p /var/www/certbot
success "App directory created"

# ─── 8. Apply Nginx Config ────────────────────────────────────
info "[8/10] Applying Nginx config..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -f "${SCRIPT_DIR}/nginx.conf" ]]; then
    cp "${SCRIPT_DIR}/nginx.conf" /etc/nginx/sites-available/takamol
    sed -i "s/your-domain\.com/${DOMAIN}/g" /etc/nginx/sites-available/takamol
    ln -sf /etc/nginx/sites-available/takamol /etc/nginx/sites-enabled/takamol
    rm -f /etc/nginx/sites-enabled/default
    nginx -t && systemctl reload nginx
    success "Nginx config applied for domain: $DOMAIN"
else
    warn "nginx.conf not found — apply manually later"
fi

# ─── 9. PM2 Startup ───────────────────────────────────────────
info "[9/10] Setting up PM2 startup..."
pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER" 2>/dev/null || \
pm2 startup systemd -u root --hp /root 2>/dev/null || true
success "PM2 startup configured"

# ─── 10. Firewall (UFW) + Fail2ban ────────────────────────────
info "[10/10] Configuring firewall and fail2ban..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force enable

cat > /etc/fail2ban/jail.local <<'EOF'
[DEFAULT]
bantime  = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled  = true
port     = http,https
logpath  = /var/log/nginx/takamol-error.log
maxretry = 10
EOF
systemctl restart fail2ban
success "Firewall (UFW) + Fail2ban configured"

# ─── Summary ──────────────────────────────────────────────────
echo ""
echo -e "${GREEN}============================================================${NC}"
echo -e "${GREEN}  VPS Setup Complete!${NC}"
echo -e "${GREEN}============================================================${NC}"
echo ""
echo -e "  ${YELLOW}Database credentials (SAVE THESE NOW):${NC}"
echo -e "  DB_NAME: ${GREEN}${DB_NAME}${NC}"
echo -e "  DB_USER: ${GREEN}${DB_USER}${NC}"
echo -e "  DB_PASS: ${GREEN}${DB_PASS}${NC}"
echo ""
echo -e "  ${YELLOW}DATABASE_URL for .env:${NC}"
echo -e "  ${GREEN}mysql://${DB_USER}:${DB_PASS}@localhost:3306/${DB_NAME}${NC}"
echo ""
echo -e "  ${YELLOW}Next steps:${NC}"
echo -e "  1. Clone:    git clone https://github.com/hhaarbi/takamol-platform.git ${APP_DIR}"
echo -e "  2. Config:   cp ${APP_DIR}/env.example ${APP_DIR}/.env && nano ${APP_DIR}/.env"
echo -e "  3. Migrate:  mysql -u ${DB_USER} -p${DB_PASS} ${DB_NAME} < ${APP_DIR}/deploy/migration.sql"
echo -e "  4. Deploy:   cd ${APP_DIR} && bash deploy/deploy.sh"
echo -e "  5. SSL:      sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
echo -e "${GREEN}============================================================${NC}"
