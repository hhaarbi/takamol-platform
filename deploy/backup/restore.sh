#!/bin/bash
# ============================================================
# Takamul Platform — Database Restore Script
# Usage: ./restore.sh [backup_file.sql.gz]
# ============================================================

set -euo pipefail

BACKUP_ROOT="${BACKUP_DIR:-/var/backups/takamol}"
LOG_FILE="${BACKUP_ROOT}/logs/restore-$(date +%Y-%m-%d_%H%M%S).log"

log() {
    local level="$1"
    shift
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] [${level}] $*" | tee -a "${LOG_FILE}"
}

# ─── Validate Arguments ───────────────────────────────────────────────────────
BACKUP_FILE="${1:-}"
if [[ -z "${BACKUP_FILE}" ]]; then
    echo "Usage: $0 <backup_file.sql.gz>"
    echo ""
    echo "Available backups:"
    ls -lh "${BACKUP_ROOT}"/db_*.sql.gz 2>/dev/null || echo "  No backups found in ${BACKUP_ROOT}"
    exit 1
fi

if [[ ! -f "${BACKUP_FILE}" ]]; then
    echo "ERROR: File not found: ${BACKUP_FILE}"
    exit 1
fi

# ─── Parse DATABASE_URL ───────────────────────────────────────────────────────
if [[ -z "${DATABASE_URL:-}" ]]; then
    echo "ERROR: DATABASE_URL environment variable is not set."
    exit 1
fi

DB_USER=$(echo "${DATABASE_URL}" | sed -E 's|mysql://([^:]+):.*|\1|')
DB_PASS=$(echo "${DATABASE_URL}" | sed -E 's|mysql://[^:]+:([^@]+)@.*|\1|')
DB_HOST=$(echo "${DATABASE_URL}" | sed -E 's|mysql://[^@]+@([^:/]+).*|\1|')
DB_PORT=$(echo "${DATABASE_URL}" | sed -E 's|mysql://[^@]+@[^:]+:([0-9]+)/.*|\1|')
DB_NAME=$(echo "${DATABASE_URL}" | sed -E 's|mysql://[^/]+/([^?]+).*|\1|')
DB_PORT="${DB_PORT:-3306}"

log "INFO" "=========================================="
log "INFO" "Takamul Database Restore"
log "INFO" "=========================================="
log "INFO" "Backup file: ${BACKUP_FILE}"
log "INFO" "Target DB: ${DB_NAME} @ ${DB_HOST}:${DB_PORT}"

# ─── Confirm ─────────────────────────────────────────────────────────────────
echo ""
echo "⚠️  WARNING: This will OVERWRITE the database '${DB_NAME}'!"
echo "   Backup file: $(basename "${BACKUP_FILE}")"
echo "   Size: $(du -sh "${BACKUP_FILE}" | cut -f1)"
echo ""
read -rp "Type 'YES' to confirm: " CONFIRM
if [[ "${CONFIRM}" != "YES" ]]; then
    echo "Restore cancelled."
    exit 0
fi

# ─── Verify gzip Integrity ────────────────────────────────────────────────────
log "INFO" "Verifying backup integrity..."
if ! gzip -t "${BACKUP_FILE}" 2>/dev/null; then
    log "ERROR" "Backup file failed gzip integrity check!"
    exit 1
fi
log "INFO" "Integrity check passed ✓"

# ─── Restore ──────────────────────────────────────────────────────────────────
log "INFO" "Starting restore..."
START_TIME=$(date +%s)

gunzip -c "${BACKUP_FILE}" | MYSQL_PWD="${DB_PASS}" mysql \
    --host="${DB_HOST}" \
    --port="${DB_PORT}" \
    --user="${DB_USER}" \
    "${DB_NAME}" 2>>"${LOG_FILE}"

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
log "INFO" "Restore completed in ${DURATION}s ✓"
log "INFO" "=========================================="
echo ""
echo "✅ Database restored successfully from: $(basename "${BACKUP_FILE}")"
