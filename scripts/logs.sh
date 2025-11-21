#!/bin/bash

##############################################
# View Application Logs
##############################################

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="${PROJECT_ROOT}/docker-compose.prod.yml"

SERVICE="${1:-all}"
LINES="${2:-100}"

if [ "$SERVICE" = "all" ]; then
    docker-compose -f "$COMPOSE_FILE" logs -f --tail="$LINES"
else
    docker-compose -f "$COMPOSE_FILE" logs -f --tail="$LINES" "$SERVICE"
fi
