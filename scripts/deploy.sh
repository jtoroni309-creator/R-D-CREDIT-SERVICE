#!/bin/bash

##############################################
# R&D Credit Service Deployment Script
# Version: 1.0.0
##############################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="${PROJECT_ROOT}/backend/.env"
COMPOSE_FILE="${PROJECT_ROOT}/docker-compose.prod.yml"
BACKUP_DIR="${PROJECT_ROOT}/backups"
VERSION="${VERSION:-$(date +%Y%m%d-%H%M%S)}"

##############################################
# Helper Functions
##############################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_dependencies() {
    log_info "Checking dependencies..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    log_success "All dependencies are installed"
}

check_env_file() {
    log_info "Checking environment configuration..."
    
    if [ ! -f "$ENV_FILE" ]; then
        log_error "Environment file not found at: $ENV_FILE"
        log_info "Please copy backend/.env.example to backend/.env and configure it"
        exit 1
    fi
    
    # Check for critical environment variables
    source "$ENV_FILE"
    
    if [ -z "$SHAREFILE_CLIENT_ID" ] || [ "$SHAREFILE_CLIENT_ID" = "your_client_id_here" ]; then
        log_warning "ShareFile Client ID not configured"
    fi
    
    if [ -z "$JWT_SECRET" ] || [[ "$JWT_SECRET" == *"CHANGE_THIS"* ]]; then
        log_error "JWT_SECRET must be changed from default value"
        exit 1
    fi
    
    if [ -z "$DATABASE_URL" ]; then
        log_error "DATABASE_URL is not configured"
        exit 1
    fi
    
    log_success "Environment configuration validated"
}

backup_database() {
    log_info "Creating database backup..."
    
    mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).sql"
    
    docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_dump -U postgres rdcredit > "$BACKUP_FILE" 2>/dev/null || {
        log_warning "Database backup skipped (database may not be running or empty)"
        return 0
    }
    
    log_success "Database backed up to: $BACKUP_FILE"
}

pull_latest_code() {
    log_info "Pulling latest code from repository..."
    
    cd "$PROJECT_ROOT"
    
    if [ -d ".git" ]; then
        git pull origin "$(git rev-parse --abbrev-ref HEAD)" || {
            log_warning "Failed to pull latest code. Continuing with current code..."
        }
        log_success "Code updated"
    else
        log_warning "Not a git repository. Skipping code pull."
    fi
}

build_images() {
    log_info "Building Docker images (version: $VERSION)..."
    
    cd "$PROJECT_ROOT"
    
    export VERSION="$VERSION"
    docker-compose -f "$COMPOSE_FILE" build --no-cache
    
    log_success "Docker images built successfully"
}

run_migrations() {
    log_info "Running database migrations..."
    
    docker-compose -f "$COMPOSE_FILE" run --rm backend npx prisma migrate deploy
    
    log_success "Database migrations completed"
}

start_services() {
    log_info "Starting services..."
    
    cd "$PROJECT_ROOT"
    
    export VERSION="$VERSION"
    docker-compose -f "$COMPOSE_FILE" up -d
    
    log_success "Services started successfully"
}

check_health() {
    log_info "Checking service health..."
    
    MAX_ATTEMPTS=30
    ATTEMPT=0
    
    while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
        if docker-compose -f "$COMPOSE_FILE" ps | grep -q "healthy"; then
            log_success "All services are healthy"
            return 0
        fi
        
        ATTEMPT=$((ATTEMPT + 1))
        echo -n "."
        sleep 2
    done
    
    log_error "Services failed to become healthy after ${MAX_ATTEMPTS} attempts"
    docker-compose -f "$COMPOSE_FILE" ps
    docker-compose -f "$COMPOSE_FILE" logs --tail=50
    return 1
}

show_status() {
    log_info "Service Status:"
    docker-compose -f "$COMPOSE_FILE" ps
    
    echo ""
    log_info "Application URLs:"
    echo "  Frontend: http://localhost:${FRONTEND_PORT:-80}"
    echo "  Backend API: http://localhost:${BACKEND_PORT:-3001}"
    echo "  Health Check: http://localhost:${BACKEND_PORT:-3001}/api/health"
    
    echo ""
    log_info "Useful Commands:"
    echo "  View logs: docker-compose -f $COMPOSE_FILE logs -f"
    echo "  Stop services: docker-compose -f $COMPOSE_FILE down"
    echo "  Restart services: docker-compose -f $COMPOSE_FILE restart"
}

##############################################
# Main Deployment Flow
##############################################

main() {
    echo ""
    echo "=================================================="
    echo "  R&D Credit Service Deployment"
    echo "  Version: $VERSION"
    echo "=================================================="
    echo ""
    
    check_dependencies
    check_env_file
    
    # Ask for confirmation
    read -p "$(echo -e ${YELLOW}Continue with deployment? [y/N]:${NC} )" -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Deployment cancelled"
        exit 0
    fi
    
    backup_database
    pull_latest_code
    build_images
    start_services
    sleep 10
    run_migrations
    check_health
    
    echo ""
    log_success "Deployment completed successfully!"
    echo ""
    show_status
}

# Run main function
main "$@"
