#!/usr/bin/env bash
# =============================================================================
# deploy/deploy.sh — Takamol Platform Deploy Script
# Safe, repeatable, zero-downtime deploy with automatic rollback support
# =============================================================================
# Usage:
#   cd /var/www/takamol
#   bash deploy/deploy.sh
#
# Environment variables (override defaults):
#   APP_DIR      — project directory (default: /var/www/takamol)
#   APP_NAME     — PM2 process name (default: takamol)
#   HEALTH_URL   — health check URL (default: http://localhost:3000/)
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

# ─── Config ───────────────────────────────────────────────────────────────────
APP_DIR="${APP_DIR:-/var/www/takamol}"
APP_NAME="${APP_NAME:-takamol}"
APP_PORT="${PORT:-3000}"
HEALTH_URL="${HEALTH_URL:-http://localhost:${APP_PORT}/}"
HEALTH_RETRIES=12
HEALTH_WAIT=3
BACKUP_DIR="${APP_DIR}/.deploy-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# ─── Trap: print error on failure ─────────────────────────────────────────────
trap 'echo -e "\n${RED}[✗] Deploy FAILED at line $LINENO. Exit code: $?${NC}" >&2' ERR

# ─── Banner ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}${BOLD}╔══════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}${BOLD}║   🚀  Takamol Platform — Deploy Script       ║${NC}"
echo -e "${CYAN}${BOLD}║   $(date '+%Y-%m-%d %H:%M:%S')                      ║${NC}"
echo -e "${CYAN}${BOLD}╚══════════════════════════════════════════════╝${NC}"
echo ""

# ─── Step 0: Verify environment ───────────────────────────────────────────────
step "0/7  Verifying environment"
[ -d "$APP_DIR" ] || error "APP_DIR=$APP_DIR does not exist. Run deploy/setup-vps.sh first."
cd "$APP_DIR"
info "Working directory: $(pwd)"

# ─── Step 1: Check .env ───────────────────────────────────────────────────────
step "1/7  Checking .env"
if [ ! -f ".env" ]; then
  error ".env not found!\n  Run: cp env.example .env && nano .env"
fi
# Load env vars for migration step
set -a; source .env; set +a
success ".env loaded"

# ─── Step 2: Backup current dist (rollback support) ───────────────────────────
step "2/7  Creating rollback backup"
mkdir -p "$BACKUP_DIR"
if [ -d "dist" ]; then
  BACKUP_PATH="$BACKUP_DIR/dist_$TIMESTAMP"
  cp -r dist "$BACKUP_PATH"
  success "Backup saved: $BACKUP_PATH"
  # Keep only last 5 backups
  ls -1dt "$BACKUP_DIR"/dist_* 2>/dev/null | tail -n +6 | xargs rm -rf 2>/dev/null || true
else
  warn "No existing dist/ to backup (first deploy)"
fi

# ─── Step 3: Pull latest code ─────────────────────────────────────────────────
step "3/7  Pulling latest code"
if git rev-parse --git-dir > /dev/null 2>&1; then
  # Stash local changes (e.g., .env) to avoid conflicts
  git stash --include-untracked 2>/dev/null || true
  git fetch origin
  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
  git reset --hard "origin/$CURRENT_BRANCH"
  # Restore stashed changes (mainly .env)
  git stash pop 2>/dev/null || true
  success "Code updated to commit $(git rev-parse --short HEAD)"
else
  warn "Not a git repo — skipping git pull"
fi

# ─── Step 4: Install dependencies ─────────────────────────────────────────────
step "4/7  Installing dependencies"
if command -v pnpm &>/dev/null; then
  pnpm install --frozen-lockfile --prod=false
else
  npm ci
fi
success "Dependencies installed"

# ─── Step 5: Build ────────────────────────────────────────────────────────────
step "5/7  Building production bundle"
NODE_ENV=production pnpm run build 2>&1 || {
  echo -e "${RED}[✗] Build FAILED — rolling back to previous dist...${NC}" >&2
  if [ -d "$BACKUP_DIR/dist_$TIMESTAMP" ]; then
    rm -rf dist
    cp -r "$BACKUP_DIR/dist_$TIMESTAMP" dist
    warn "Rolled back to previous build. Reloading PM2..."
    pm2 reload "$APP_NAME" --update-env 2>/dev/null || true
  fi
  exit 1
}
test -f dist/index.js || error "dist/index.js missing after build"
test -d dist/public   || error "dist/public missing after build"
success "Build complete: dist/index.js + dist/public/"

# ─── Step 6: Apply DB migrations ──────────────────────────────────────────────
step "6/7  Applying database migrations"

run_migration() {
  local sql_file="$1"
  if [ -f "$sql_file" ]; then
    info "Applying $(basename $sql_file)..."
    if [ -n "${DATABASE_URL:-}" ]; then
      # Parse DATABASE_URL: mysql://user:pass@host:port/dbname
      DB_USER_M=$(echo "$DATABASE_URL" | sed 's|mysql://||' | cut -d: -f1)
      DB_PASS_M=$(echo "$DATABASE_URL" | sed 's|mysql://[^:]*:||' | cut -d@ -f1)
      DB_HOST_M=$(echo "$DATABASE_URL" | cut -d@ -f2 | cut -d: -f1)
      DB_PORT_M=$(echo "$DATABASE_URL" | cut -d@ -f2 | cut -d: -f2 | cut -d/ -f1)
      DB_NAME_M=$(echo "$DATABASE_URL" | cut -d/ -f4 | cut -d? -f1)
      mysql -u"${DB_USER_M}" -p"${DB_PASS_M}" -h"${DB_HOST_M}" \
            -P"${DB_PORT_M:-3306}" "${DB_NAME_M}" \
            < "$sql_file" 2>/dev/null \
        && success "$(basename $sql_file) applied" \
        || warn "$(basename $sql_file) may already be applied (OK)"
    elif [ -n "${DB_USER:-}" ] && [ -n "${DB_PASSWORD:-}" ]; then
      mysql -u"${DB_USER}" -p"${DB_PASSWORD}" \
            -h"${DB_HOST:-127.0.0.1}" -P"${DB_PORT:-3306}" \
            "${DB_NAME:-realestate_db}" \
            < "$sql_file" 2>/dev/null \
        && success "$(basename $sql_file) applied" \
        || warn "$(basename $sql_file) may already be applied (OK)"
    else
      warn "No DB credentials found — skipping $(basename $sql_file)"
    fi
  fi
}

run_migration "deploy/migration.sql"
run_migration "drizzle/auth-extensions.sql"

# ─── Step 7: Reload PM2 (zero-downtime) ───────────────────────────────────────
step "7/7  Reloading PM2 (zero-downtime)"
if pm2 describe "$APP_NAME" &>/dev/null; then
  pm2 reload "$APP_NAME" --update-env
  success "PM2 reloaded: $APP_NAME (zero-downtime)"
else
  if [ -f "ecosystem.config.js" ]; then
    pm2 start ecosystem.config.js --env production
  else
    pm2 start dist/index.js --name "$APP_NAME" \
      --max-memory-restart 512M \
      --env production
  fi
  success "PM2 started: $APP_NAME"
fi
pm2 save
success "PM2 process list saved (auto-restart on reboot)"

# ─── Health check ─────────────────────────────────────────────────────────────
echo ""
info "Running health check on $HEALTH_URL ..."
sleep 3

ATTEMPT=0
PASSED=false
while [ $ATTEMPT -lt $HEALTH_RETRIES ]; do
  ATTEMPT=$((ATTEMPT + 1))
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$HEALTH_URL" 2>/dev/null || echo "000")

  if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "304" || "$HTTP_CODE" == "301" || "$HTTP_CODE" == "302" ]]; then
    success "Health check passed (HTTP $HTTP_CODE) after $ATTEMPT attempt(s)"
    PASSED=true
    break
  fi

  warn "Attempt $ATTEMPT/$HEALTH_RETRIES — HTTP $HTTP_CODE — retrying in ${HEALTH_WAIT}s..."
  sleep $HEALTH_WAIT
done

if [ "$PASSED" = false ]; then
  echo -e "${RED}[✗] Health check FAILED after $HEALTH_RETRIES attempts${NC}" >&2
  echo -e "${YELLOW}  Last HTTP code: $HTTP_CODE${NC}" >&2
  echo -e "${YELLOW}  Check logs: pm2 logs $APP_NAME --lines 50${NC}" >&2
  echo -e "${YELLOW}  To rollback manually:${NC}" >&2
  echo -e "${YELLOW}    rm -rf dist && cp -r $BACKUP_DIR/dist_$TIMESTAMP dist${NC}" >&2
  echo -e "${YELLOW}    pm2 reload $APP_NAME${NC}" >&2
  exit 1
fi

# ─── Reload Nginx ─────────────────────────────────────────────────────────────
if command -v nginx &>/dev/null; then
  nginx -t 2>/dev/null && systemctl reload nginx && info "Nginx reloaded"
fi

# ─── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║   ✅  DEPLOY SUCCESSFUL                      ║${NC}"
echo -e "${GREEN}${BOLD}║   Commit: $(git rev-parse --short HEAD 2>/dev/null || echo 'N/A')                          ║${NC}"
echo -e "${GREEN}${BOLD}║   Time:   $(date '+%Y-%m-%d %H:%M:%S')                ║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${YELLOW}Useful commands:${NC}"
echo -e "  pm2 status               → view process status"
echo -e "  pm2 logs $APP_NAME       → view live logs"
echo -e "  pm2 monit                → monitor CPU/RAM"
echo -e "  pm2 restart $APP_NAME    → restart app"
echo ""
