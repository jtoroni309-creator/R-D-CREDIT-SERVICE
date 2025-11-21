#!/bin/bash

##############################################
# Database Backup Script
##############################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${PROJECT_ROOT}/backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/rdcredit-backup-$TIMESTAMP.sql"

mkdir -p "$BACKUP_DIR"

echo "Creating database backup..."
docker-compose -f "${PROJECT_ROOT}/docker-compose.prod.yml" exec -T postgres pg_dump -U postgres rdcredit > "$BACKUP_FILE"

# Compress the backup
gzip "$BACKUP_FILE"

echo "✓ Backup created: ${BACKUP_FILE}.gz"

# Keep only last 7 backups
ls -t "$BACKUP_DIR"/rdcredit-backup-*.sql.gz | tail -n +8 | xargs -r rm
echo "✓ Old backups cleaned up (keeping last 7)"
