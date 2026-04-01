#!/bin/bash
# ============================================================
# Takamul Platform — Backup Cron Job Setup
# Run this script once on the VPS to install the daily backup
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="${SCRIPT_DIR}/backup.sh"
APP_DIR="${APP_DIR:-/var/www/takamol}"
CRON_LOG="/var/log/takamol-backup-cron.log"

echo "======================================"
echo "Takamul Backup Cron Setup"
echo "======================================"

# Ensure backup script exists and is executable
if [[ ! -f "${BACKUP_SCRIPT}" ]]; then
    echo "ERROR: backup.sh not found at ${BACKUP_SCRIPT}"
    exit 1
fi
chmod +x "${BACKUP_SCRIPT}"
echo "✓ backup.sh is executable"

# Create backup directory
BACKUP_ROOT="${BACKUP_DIR:-/var/backups/takamol}"
mkdir -p "${BACKUP_ROOT}/logs"
echo "✓ Backup directory created: ${BACKUP_ROOT}"

# Load env from .env file if available
ENV_FILE="${APP_DIR}/.env"
if [[ -f "${ENV_FILE}" ]]; then
    echo "✓ Found .env at ${ENV_FILE}"
else
    echo "WARN: .env not found at ${ENV_FILE} — make sure DATABASE_URL is set in environment"
fi

# Install cron job (daily at 02:00 AM)
CRON_CMD="0 2 * * * DATABASE_URL=\$(grep DATABASE_URL ${ENV_FILE} 2>/dev/null | cut -d= -f2-) TELEGRAM_BOT_TOKEN=\$(grep TELEGRAM_BOT_TOKEN ${ENV_FILE} 2>/dev/null | cut -d= -f2-) TELEGRAM_OWNER_CHAT_ID=\$(grep TELEGRAM_OWNER_CHAT_ID ${ENV_FILE} 2>/dev/null | cut -d= -f2-) BACKUP_DIR=${BACKUP_ROOT} ${BACKUP_SCRIPT} >> ${CRON_LOG} 2>&1"

# Add to crontab if not already present
CURRENT_CRON=$(crontab -l 2>/dev/null || true)
if echo "${CURRENT_CRON}" | grep -q "takamol.*backup.sh"; then
    echo "✓ Cron job already exists — skipping"
else
    (echo "${CURRENT_CRON}"; echo "${CRON_CMD}") | crontab -
    echo "✓ Cron job installed: daily at 02:00 AM"
fi

# Show current crontab
echo ""
echo "Current crontab:"
crontab -l

echo ""
echo "======================================"
echo "Backup cron setup complete!"
echo "Backups will run daily at 02:00 AM"
echo "Logs: ${CRON_LOG}"
echo "Backup files: ${BACKUP_ROOT}"
echo "======================================"
