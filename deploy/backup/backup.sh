#!/bin/bash
# ============================================================
# Takamul Platform — Automated MySQL Backup Script
# Version: 1.0.0
# Schedule: Daily at 02:00 AM (via cron)
# Retention: 30 days
# ============================================================

set -euo pipefail

# ─── Configuration ────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_ROOT="${BACKUP_DIR:-/var/backups/takamol}"
LOG_DIR="${BACKUP_ROOT}/logs"
LOG_FILE="${LOG_DIR}/backup-$(date +%Y-%m).log"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATE_LABEL=$(date +%Y-%m-%d)
BACKUP_FILE="${BACKUP_ROOT}/db_${TIMESTAMP}.sql.gz"
LOCK_FILE="/tmp/takamol_backup.lock"

# ─── Notification Config (optional) ───────────────────────────────────────────
NOTIFY_EMAIL="${BACKUP_NOTIFY_EMAIL:-}"
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_OWNER_CHAT_ID="${TELEGRAM_OWNER_CHAT_ID:-}"

# ─── Helpers ──────────────────────────────────────────────────────────────────
log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp
    timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[${timestamp}] [${level}] ${message}" | tee -a "${LOG_FILE}"
}

send_telegram_alert() {
    local message="$1"
    if [[ -n "${TELEGRAM_BOT_TOKEN}" && -n "${TELEGRAM_OWNER_CHAT_ID}" ]]; then
        curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
            -d "chat_id=${TELEGRAM_OWNER_CHAT_ID}" \
            -d "text=${message}" \
            -d "parse_mode=HTML" \
            --max-time 10 \
            > /dev/null 2>&1 || true
    fi
}

send_email_alert() {
    local subject="$1"
    local body="$2"
    if [[ -n "${NOTIFY_EMAIL}" ]] && command -v mail &>/dev/null; then
        echo "${body}" | mail -s "${subject}" "${NOTIFY_EMAIL}" || true
    fi
}

cleanup_lock() {
    rm -f "${LOCK_FILE}"
}

# ─── Lock File (prevent concurrent runs) ──────────────────────────────────────
if [[ -f "${LOCK_FILE}" ]]; then
    log "WARN" "Backup already running (lock file exists: ${LOCK_FILE}). Exiting."
    exit 0
fi
trap cleanup_lock EXIT
echo $$ > "${LOCK_FILE}"

# ─── Setup Directories ────────────────────────────────────────────────────────
mkdir -p "${BACKUP_ROOT}" "${LOG_DIR}"
log "INFO" "=========================================="
log "INFO" "Takamul Backup Started — ${DATE_LABEL}"
log "INFO" "=========================================="
log "INFO" "Backup root: ${BACKUP_ROOT}"
log "INFO" "Retention: ${RETENTION_DAYS} days"

# ─── Parse DATABASE_URL ───────────────────────────────────────────────────────
# Expected format: mysql://user:password@host:port/dbname
if [[ -z "${DATABASE_URL:-}" ]]; then
    log "ERROR" "DATABASE_URL environment variable is not set."
    send_telegram_alert "❌ <b>تكامل — فشل النسخ الاحتياطي</b>%0A%0Aالسبب: متغير DATABASE_URL غير محدد.%0Aالتاريخ: ${DATE_LABEL}"
    exit 1
fi

# Extract components from DATABASE_URL
DB_USER=$(echo "${DATABASE_URL}" | sed -E 's|mysql://([^:]+):.*|\1|')
DB_PASS=$(echo "${DATABASE_URL}" | sed -E 's|mysql://[^:]+:([^@]+)@.*|\1|')
DB_HOST=$(echo "${DATABASE_URL}" | sed -E 's|mysql://[^@]+@([^:/]+).*|\1|')
DB_PORT=$(echo "${DATABASE_URL}" | sed -E 's|mysql://[^@]+@[^:]+:([0-9]+)/.*|\1|')
DB_NAME=$(echo "${DATABASE_URL}" | sed -E 's|mysql://[^/]+/([^?]+).*|\1|')

# Default port if not found
DB_PORT="${DB_PORT:-3306}"

log "INFO" "Database: ${DB_NAME} @ ${DB_HOST}:${DB_PORT} (user: ${DB_USER})"

# ─── Run mysqldump ─────────────────────────────────────────────────────────────
log "INFO" "Starting mysqldump → ${BACKUP_FILE}"
START_TIME=$(date +%s)

MYSQL_PWD="${DB_PASS}" mysqldump \
    --host="${DB_HOST}" \
    --port="${DB_PORT}" \
    --user="${DB_USER}" \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    --set-gtid-purged=OFF \
    --column-statistics=0 \
    "${DB_NAME}" 2>>"${LOG_FILE}" | gzip -9 > "${BACKUP_FILE}"

DUMP_EXIT_CODE=${PIPESTATUS[0]}
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

if [[ ${DUMP_EXIT_CODE} -ne 0 ]]; then
    log "ERROR" "mysqldump failed with exit code ${DUMP_EXIT_CODE}."
    rm -f "${BACKUP_FILE}"
    send_telegram_alert "❌ <b>تكامل — فشل النسخ الاحتياطي</b>%0A%0Aالسبب: فشل mysqldump (exit code: ${DUMP_EXIT_CODE})%0Aالتاريخ: ${DATE_LABEL}"
    send_email_alert "[Takamul] Backup FAILED — ${DATE_LABEL}" "mysqldump failed with exit code ${DUMP_EXIT_CODE}. Check logs at ${LOG_FILE}"
    exit 1
fi

# ─── Verify Backup File ────────────────────────────────────────────────────────
if [[ ! -f "${BACKUP_FILE}" ]] || [[ ! -s "${BACKUP_FILE}" ]]; then
    log "ERROR" "Backup file is missing or empty: ${BACKUP_FILE}"
    send_telegram_alert "❌ <b>تكامل — فشل النسخ الاحتياطي</b>%0A%0Aالسبب: الملف فارغ أو مفقود%0Aالتاريخ: ${DATE_LABEL}"
    exit 1
fi

BACKUP_SIZE=$(du -sh "${BACKUP_FILE}" | cut -f1)
log "INFO" "Backup completed successfully in ${DURATION}s — Size: ${BACKUP_SIZE}"
log "INFO" "Backup file: ${BACKUP_FILE}"

# ─── Verify gzip Integrity ────────────────────────────────────────────────────
if ! gzip -t "${BACKUP_FILE}" 2>/dev/null; then
    log "ERROR" "Backup file failed gzip integrity check: ${BACKUP_FILE}"
    send_telegram_alert "❌ <b>تكامل — فشل التحقق من النسخة</b>%0A%0Aالسبب: ملف gzip تالف%0Aالتاريخ: ${DATE_LABEL}"
    exit 1
fi
log "INFO" "gzip integrity check passed ✓"

# ─── Retention Policy (delete backups older than RETENTION_DAYS) ──────────────
log "INFO" "Applying retention policy: removing backups older than ${RETENTION_DAYS} days..."
DELETED_COUNT=0
while IFS= read -r old_file; do
    rm -f "${old_file}"
    log "INFO" "Deleted old backup: $(basename "${old_file}")"
    ((DELETED_COUNT++))
done < <(find "${BACKUP_ROOT}" -maxdepth 1 -name "db_*.sql.gz" -mtime "+${RETENTION_DAYS}" 2>/dev/null)

log "INFO" "Retention cleanup: removed ${DELETED_COUNT} old backup(s)"

# ─── List Current Backups ─────────────────────────────────────────────────────
BACKUP_COUNT=$(find "${BACKUP_ROOT}" -maxdepth 1 -name "db_*.sql.gz" | wc -l)
TOTAL_SIZE=$(du -sh "${BACKUP_ROOT}" --exclude="${LOG_DIR}" 2>/dev/null | cut -f1 || echo "N/A")
log "INFO" "Current backups: ${BACKUP_COUNT} file(s), total size: ${TOTAL_SIZE}"

# ─── Success Notification ─────────────────────────────────────────────────────
send_telegram_alert "✅ <b>تكامل — نسخ احتياطي ناجح</b>%0A%0A📅 التاريخ: ${DATE_LABEL}%0A💾 الحجم: ${BACKUP_SIZE}%0A⏱ المدة: ${DURATION}s%0A📦 إجمالي النسخ: ${BACKUP_COUNT}"

log "INFO" "Backup process completed successfully."
log "INFO" "=========================================="
exit 0
