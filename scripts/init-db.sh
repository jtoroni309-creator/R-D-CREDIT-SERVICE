#!/bin/bash

##############################################
# Database Initialization Script
##############################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="${PROJECT_ROOT}/docker-compose.prod.yml"

echo "==================================="
echo "Database Initialization"
echo "==================================="

echo "1. Creating database migration..."
cd "$PROJECT_ROOT/backend"
npx prisma migrate dev --name init || echo "Migration already exists or created"

echo ""
echo "2. Generating Prisma client..."
npx prisma generate

echo ""
echo "3. Deploying migrations to database..."
npx prisma migrate deploy

echo ""
echo "4. Running database seed..."
npx prisma db seed || npm run seed || echo "Seed script not configured"

echo ""
echo "✓ Database initialization complete!"
