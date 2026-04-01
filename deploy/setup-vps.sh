#!/usr/bin/env bash
# =============================================================================
# deploy/setup-vps.sh — Takamol Platform VPS Setup
# Tested on: Contabo VPS, Ubuntu 22.04 LTS
# Run once as root on a fresh server
# =============================================================================
# Usage:
#   sudo bash deploy/setup-vps.sh
#   # Or with custom domain:
#   DOMAIN=takamol.sa sudo bash deploy/setup-vps.sh
# =============================================================================
set -euo pipefail

# ─── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[✓]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[✗]${NC}    $*" >&2; exit 1; }
step()    { echo -e "\n${CYAN}${BOLD}━━━ $* ━━━${NC}"; }

# ─── Must run as root ─────────────────────────────────────────────────────────
[ "$(id -u)" -eq 0 ] || error "Run as root: sudo bash deploy/setup-vps.sh"

# ─── Config ───────────────────────────────────────────────────────────────────
DOMAIN="${DOMAIN:-YOUR_DOMAIN}"
APP_USER="${APP_USER:-ubuntu}"
APP_DIR="${APP_DIR:-/var/www/takamol}"
DB_NAME="${DB_NAME:-realestate_db}"
DB_USER="${DB_USER:-realestate_user}"
DB_PASS="${DB_PASS:-$(openssl rand -base64 24 | tr -d '/+=')}"
NODE_VERSION="20"

# ─── Banner ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}${BOLD}╔══════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}${BOLD}║   🛠  Takamol Platform — VPS Setup           ║${NC}"
echo -e "${CYAN}${BOLD}║   Ubuntu 22.04 LTS / Contabo                 ║${NC}"
echo -e "${CYAN}${BOLD}╚══════════════════════════════════════════════╝${NC}"
echo ""

# ─── Step 1: System update ────────────────────────────────────────────────────
step "1/11  System update"
apt-get update -qq && apt-get upgrade -y -qq
apt-get install -y -qq \
  curl wget git build-essential unzip htop net-tools \
  software-properties-common apt-transport-https \
  ca-certificates gnupg lsb-release \
  ufw fail2ban certbot python3-certbot-nginx
success "System packages updated"

# ─── Step 2: Node.js LTS ──────────────────────────────────────────────────────
step "2/11  Installing Node.js $NODE_VERSION LTS"
if ! command -v node &>/dev/null || [[ "$(node -v | cut -d. -f1 | tr -d 'v')" -lt "$NODE_VERSION" ]]; then
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_VERSION}.x" | bash -
  apt-get install -y nodejs
  success "Node.js $(node -v) installed"
else
  success "Node.js $(node -v) already installed"
fi

# Install pnpm + PM2
npm install -g pnpm@9 pm2 2>/dev/null
success "pnpm $(pnpm -v) + PM2 $(pm2 -v) installed"

# ─── Step 3: PM2 startup ──────────────────────────────────────────────────────
step "3/11  Configuring PM2 startup"
pm2 startup systemd -u "$APP_USER" --hp "/home/$APP_USER" 2>/dev/null | grep "sudo" | bash 2>/dev/null || \
pm2 startup systemd -u root --hp /root 2>/dev/null | grep "sudo" | bash 2>/dev/null || true
success "PM2 startup configured (auto-restart on reboot)"

# ─── Step 4: MySQL 8 ──────────────────────────────────────────────────────────
step "4/11  Installing MySQL 8"
if ! command -v mysql &>/dev/null; then
  apt-get install -y mysql-server mysql-client
  systemctl enable --now mysql
  success "MySQL 8 installed"
else
  success "MySQL already installed: $(mysql --version | awk '{print $3}')"
fi

# Create database and user
info "Creating database: $DB_NAME"
mysql -u root 2>/dev/null << SQL
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'127.0.0.1' IDENTIFIED BY '${DB_PASS}';
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'127.0.0.1';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
SQL
success "Database '$DB_NAME' and user '$DB_USER' created"

# Save DB credentials
DB_CREDS_FILE="/root/.takamol-db-creds"
cat > "$DB_CREDS_FILE" << EOF
# Takamol DB Credentials — $(date)
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASS
DATABASE_URL=mysql://${DB_USER}:${DB_PASS}@127.0.0.1:3306/${DB_NAME}
EOF
chmod 600 "$DB_CREDS_FILE"
success "DB credentials saved to $DB_CREDS_FILE (chmod 600)"

# ─── Step 5: Nginx ────────────────────────────────────────────────────────────
step "5/11  Installing Nginx"
if ! command -v nginx &>/dev/null; then
  apt-get install -y nginx
  systemctl enable --now nginx
  success "Nginx installed"
else
  success "Nginx already installed"
fi

# ─── Step 6: App directory ────────────────────────────────────────────────────
step "6/11  Setting up app directory"
mkdir -p "$APP_DIR"
chown -R "$APP_USER":"$APP_USER" "$APP_DIR" 2>/dev/null || true
mkdir -p /var/www/certbot
success "App directory: $APP_DIR"

# ─── Step 7: Apply Nginx config ───────────────────────────────────────────────
step "7/11  Applying Nginx config"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "${SCRIPT_DIR}/nginx.conf" ]; then
  cp "${SCRIPT_DIR}/nginx.conf" /etc/nginx/sites-available/takamol
  # Replace placeholder domain if DOMAIN is set
  if [ "$DOMAIN" != "YOUR_DOMAIN" ]; then
    sed -i "s/YOUR_DOMAIN/${DOMAIN}/g" /etc/nginx/sites-available/takamol
    success "Domain set to: $DOMAIN"
  else
    warn "DOMAIN not set — edit /etc/nginx/sites-available/takamol manually"
  fi
  ln -sf /etc/nginx/sites-available/takamol /etc/nginx/sites-enabled/takamol
  rm -f /etc/nginx/sites-enabled/default
  nginx -t && systemctl reload nginx
  success "Nginx config applied"
else
  warn "deploy/nginx.conf not found — apply manually after cloning"
fi

# ─── Step 8: UFW Firewall ─────────────────────────────────────────────────────
step "8/11  Configuring UFW firewall"
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    comment 'SSH'
ufw allow 80/tcp    comment 'HTTP'
ufw allow 443/tcp   comment 'HTTPS'
ufw --force enable
success "UFW: SSH(22) + HTTP(80) + HTTPS(443) open"

# ─── Step 9: Fail2ban ─────────────────────────────────────────────────────────
step "9/11  Configuring Fail2ban"
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime  = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port    = 22
logpath = /var/log/auth.log

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled  = true
port     = http,https
logpath  = /var/log/nginx/takamol-error.log
findtime = 600
bantime  = 7200
maxretry = 10
EOF
systemctl enable --now fail2ban
success "Fail2ban configured (SSH + Nginx brute-force protection)"

# ─── Step 10: SSH key for GitHub Actions ──────────────────────────────────────
step "10/11  Generating SSH key for GitHub Actions"
SSH_KEY_FILE="/root/.ssh/github_actions_deploy"
if [ ! -f "$SSH_KEY_FILE" ]; then
  ssh-keygen -t ed25519 -C "github-actions-deploy@takamol" -f "$SSH_KEY_FILE" -N ""
  # Add public key to authorized_keys
  cat "${SSH_KEY_FILE}.pub" >> /root/.ssh/authorized_keys
  chmod 600 /root/.ssh/authorized_keys
  success "SSH key generated: $SSH_KEY_FILE"
else
  success "SSH key already exists: $SSH_KEY_FILE"
fi

echo ""
echo -e "${YELLOW}  ⚠  Add this PRIVATE key as GitHub Secret VPS_SSH_KEY:${NC}"
echo -e "${CYAN}$(cat $SSH_KEY_FILE)${NC}"
echo ""

# ─── Step 11: Swap (for low-RAM VPS) ─────────────────────────────────────────
step "11/11  Setting up swap (2GB)"
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  success "2GB swap created"
else
  success "Swap already configured"
fi

# ─── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║   ✅  VPS SETUP COMPLETE                     ║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}  Database credentials (SAVE THESE):${NC}"
echo -e "  DB_NAME:   ${GREEN}$DB_NAME${NC}"
echo -e "  DB_USER:   ${GREEN}$DB_USER${NC}"
echo -e "  DB_PASS:   ${GREEN}$DB_PASS${NC}"
echo -e "  DATABASE_URL: ${GREEN}mysql://${DB_USER}:${DB_PASS}@127.0.0.1:3306/${DB_NAME}${NC}"
echo ""
echo -e "${YELLOW}  Next steps:${NC}"
echo ""
echo -e "  ${CYAN}1. Clone project:${NC}"
echo -e "     git clone https://github.com/hhaarbi/takamol-platform.git $APP_DIR"
echo ""
echo -e "  ${CYAN}2. Configure .env:${NC}"
echo -e "     cp $APP_DIR/env.example $APP_DIR/.env && nano $APP_DIR/.env"
echo -e "     # Use DB credentials above"
echo ""
echo -e "  ${CYAN}3. Apply migration:${NC}"
echo -e "     mysql -u $DB_USER -p'$DB_PASS' $DB_NAME < $APP_DIR/deploy/migration.sql"
echo ""
echo -e "  ${CYAN}4. Deploy:${NC}"
echo -e "     cd $APP_DIR && bash deploy/deploy.sh"
echo ""
echo -e "  ${CYAN}5. SSL (replace with your domain):${NC}"
echo -e "     certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo ""
echo -e "  ${CYAN}6. GitHub Actions secrets to add:${NC}"
echo -e "     VPS_HOST     = $(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_VPS_IP')"
echo -e "     VPS_USER     = root"
echo -e "     VPS_PORT     = 22"
echo -e "     APP_DIR      = $APP_DIR"
echo -e "     VPS_SSH_KEY  = (private key shown above)"
echo -e "     APP_URL      = https://$DOMAIN"
echo ""
echo -e "${BLUE}  Full credentials: $DB_CREDS_FILE${NC}"
echo ""
