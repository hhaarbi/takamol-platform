#!/usr/bin/env bash
# ============================================================
# Deploy Script — تكامل Real Estate Platform
# ============================================================
# Usage (first deploy or update):
#   cd /var/www/takamol
#   bash deploy/deploy.sh
#
# Steps:
#   1. git pull (update code)
#   2. pnpm install (install dependencies)
#   3. pnpm build (build the app)
#   4. Apply migration.sql
#   5. Start/reload PM2
#   6. Health check (HTTP 200)
#   7. Reload Nginx
# ============================================================
set -euo pipefail

# ─── Colors ───────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC}   $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

APP_DIR="${APP_DIR:-/var/www/takamol}"
APP_PORT="${PORT:-3000}"
APP_NAME="takamol"

echo -e "${BLUE}============================================================${NC}"
echo -e "${BLUE}  تكامل Real Estate Platform — Deployment${NC}"
echo -e "${BLUE}============================================================${NC}"
echo ""

# ─── Check .env ───────────────────────────────────────────────
[[ ! -f "${APP_DIR}/.env" ]] && error ".env not found! Run: cp ${APP_DIR}/env.example ${APP_DIR}/.env && nano ${APP_DIR}/.env"

# Load env vars for migration
set -a; source "${APP_DIR}/.env"; set +a

cd "${APP_DIR}"

# ─── 1. Git Pull ──────────────────────────────────────────────
info "[1/7] Pulling latest code from Git..."
if git rev-parse --git-dir > /dev/null 2>&1; then
    git pull origin main 2>/dev/null || git pull origin master 2>/dev/null || warn "git pull skipped"
    success "Code updated ($(git rev-parse --short HEAD))"
else
    warn "Not a git repo — skipping git pull"
fi

# ─── 2. Install Dependencies ──────────────────────────────────
info "[2/7] Installing dependencies..."
pnpm install --frozen-lockfile
success "Dependencies installed"

# ─── 3. Build ─────────────────────────────────────────────────
info "[3/7] Building production bundle..."
NODE_ENV=production pnpm run build
[[ -f "dist/index.js" ]] || error "Build failed: dist/index.js not found"
success "Build complete → dist/index.js + dist/public/"

# ─── 4. Apply Migration ───────────────────────────────────────
info "[4/7] Applying database migration..."
if [[ -f "${APP_DIR}/deploy/migration.sql" && -n "${DATABASE_URL:-}" ]]; then
    DB_USER_M=$(echo "$DATABASE_URL" | sed 's|mysql://||' | cut -d: -f1)
    DB_PASS_M=$(echo "$DATABASE_URL" | sed 's|mysql://[^:]*:||' | cut -d@ -f1)
    DB_HOST_M=$(echo "$DATABASE_URL" | cut -d@ -f2 | cut -d: -f1)
    DB_PORT_M=$(echo "$DATABASE_URL" | cut -d@ -f2 | cut -d: -f2 | cut -d/ -f1)
    DB_NAME_M=$(echo "$DATABASE_URL" | cut -d/ -f4 | cut -d? -f1)
    mysql -u"${DB_USER_M}" -p"${DB_PASS_M}" -h"${DB_HOST_M}" -P"${DB_PORT_M:-3306}" \
          "${DB_NAME_M}" < "${APP_DIR}/deploy/migration.sql" 2>/dev/null \
          && success "Migration applied" \
          || warn "Migration may already be applied — OK"
else
    warn "Skipping migration (migration.sql not found or DATABASE_URL not set)"
fi

# ─── 5. Start/Reload PM2 ──────────────────────────────────────
info "[5/7] Starting/reloading PM2..."
if pm2 describe "${APP_NAME}" > /dev/null 2>&1; then
    pm2 reload "${APP_DIR}/ecosystem.config.js" --env production
    success "PM2 reloaded (zero-downtime)"
else
    pm2 start "${APP_DIR}/ecosystem.config.js" --env production
    success "PM2 started (first run)"
fi
pm2 save

# ─── 6. Health Check ──────────────────────────────────────────
info "[6/7] Running health check (waiting up to 30s)..."
for i in $(seq 1 15); do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${APP_PORT}/" 2>/dev/null || echo "000")
    if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "304" ]]; then
        success "Health check passed (HTTP $HTTP_CODE)"
        break
    fi
    if [[ $i -eq 15 ]]; then
        error "Health check failed after 30s (last status: HTTP $HTTP_CODE). Check: pm2 logs ${APP_NAME}"
    fi
    sleep 2
done

# ─── 7. Reload Nginx ──────────────────────────────────────────
info "[7/7] Reloading Nginx..."
if command -v nginx > /dev/null 2>&1; then
    nginx -t && systemctl reload nginx
    success "Nginx reloaded"
else
    warn "Nginx not installed — skipping"
fi

# ─── Summary ──────────────────────────────────────────────────
echo ""
echo -e "${GREEN}============================================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}============================================================${NC}"
echo ""
echo -e "  ${BLUE}App status:${NC}"
pm2 status "${APP_NAME}" 2>/dev/null || true
echo ""
echo -e "  ${YELLOW}Useful commands:${NC}"
echo -e "  pm2 logs ${APP_NAME}        # View logs"
echo -e "  pm2 monit                   # Monitor performance"
echo -e "  pm2 restart ${APP_NAME}     # Restart app"
echo -e "  pm2 stop ${APP_NAME}        # Stop app"
echo ""
