#!/bin/bash

##############################################
# Database Restore Script
##############################################

set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <backup-file>"
    echo "Available backups:"
    ls -lh backups/*.sql.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "WARNING: This will replace the current database!"
read -p "Continue? [y/N]: " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Restore cancelled"
    exit 0
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "Restoring database from: $BACKUP_FILE"

if [[ $BACKUP_FILE == *.gz ]]; then
    gunzip -c "$BACKUP_FILE" | docker-compose -f "${PROJECT_ROOT}/docker-compose.prod.yml" exec -T postgres psql -U postgres rdcredit
else
    docker-compose -f "${PROJECT_ROOT}/docker-compose.prod.yml" exec -T postgres psql -U postgres rdcredit < "$BACKUP_FILE"
fi

echo "✓ Database restored successfully"
