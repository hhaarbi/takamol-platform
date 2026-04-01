# Takamul — Automated Database Backup System

## Overview

This directory contains the automated backup system for the Takamul platform database. Backups run daily via cron, compress with gzip, and are retained for 30 days.

## Files

| File | Description |
|------|-------------|
| `backup.sh` | Main backup script (mysqldump + gzip + retention) |
| `restore.sh` | Database restore script with confirmation prompt |
| `setup-backup-cron.sh` | One-time cron job installation script |
| `README.md` | This documentation |

## Quick Setup (on VPS)

```bash
# 1. Copy backup scripts to the server
scp -r deploy/backup/ user@your-vps:/var/www/takamol/backup/

# 2. Make scripts executable
chmod +x /var/www/takamol/backup/*.sh

# 3. Install cron job (runs daily at 02:00 AM)
APP_DIR=/var/www/takamol /var/www/takamol/backup/setup-backup-cron.sh
```

## Manual Backup

```bash
DATABASE_URL="mysql://user:pass@host:3306/dbname" \
BACKUP_DIR="/var/backups/takamol" \
./backup.sh
```

## Restore from Backup

```bash
DATABASE_URL="mysql://user:pass@host:3306/dbname" \
./restore.sh /var/backups/takamol/db_20260401_020000.sql.gz
```

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ Yes | — | MySQL connection string |
| `BACKUP_DIR` | No | `/var/backups/takamol` | Backup storage directory |
| `BACKUP_RETENTION_DAYS` | No | `30` | Days to keep old backups |
| `TELEGRAM_BOT_TOKEN` | No | — | Telegram bot token for alerts |
| `TELEGRAM_OWNER_CHAT_ID` | No | — | Telegram chat ID for alerts |
| `BACKUP_NOTIFY_EMAIL` | No | — | Email address for failure alerts |

## Backup Schedule

- **Frequency**: Daily at **02:00 AM** (server time)
- **Retention**: 30 days (configurable via `BACKUP_RETENTION_DAYS`)
- **Format**: `db_YYYYMMDD_HHMMSS.sql.gz` (gzip-compressed SQL dump)
- **Location**: `/var/backups/takamol/`
- **Logs**: `/var/backups/takamol/logs/backup-YYYY-MM.log`

## Alerts

The backup script sends Telegram notifications on:
- ✅ **Success**: backup size, duration, total backup count
- ❌ **Failure**: error reason and timestamp

Configure `TELEGRAM_BOT_TOKEN` and `TELEGRAM_OWNER_CHAT_ID` in your `.env` file to enable alerts.

## Monitoring

Check backup logs:
```bash
tail -f /var/backups/takamol/logs/backup-$(date +%Y-%m).log
```

List available backups:
```bash
ls -lh /var/backups/takamol/db_*.sql.gz
```

Verify a backup file:
```bash
gzip -t /var/backups/takamol/db_20260401_020000.sql.gz && echo "OK"
```
