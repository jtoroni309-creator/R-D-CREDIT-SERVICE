# R&D Tax Credit Service - Production Deployment Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Pre-Deployment Checklist](#pre-deployment-checklist)
3. [Environment Configuration](#environment-configuration)
4. [Deployment Options](#deployment-options)
5. [Automated Deployment](#automated-deployment)
6. [Manual Deployment](#manual-deployment)
7. [Cloud Platform Deployment](#cloud-platform-deployment)
8. [Post-Deployment Tasks](#post-deployment-tasks)
9. [Health Checks & Monitoring](#health-checks--monitoring)
10. [Backup & Restore](#backup--restore)
11. [Troubleshooting](#troubleshooting)
12. [Security Best Practices](#security-best-practices)

---

## Prerequisites

### Required Software

- **Docker**: Version 20.10 or higher
- **Docker Compose**: Version 2.0 or higher
- **Git**: For version control
- **Node.js**: 18+ (for local development)
- **PostgreSQL**: 14+ (if not using Docker)

### System Requirements

**Minimum:**
- 2 CPU cores
- 4 GB RAM
- 20 GB disk space

**Recommended for Production:**
- 4 CPU cores
- 8 GB RAM
- 100 GB disk space (includes database and log storage)
- SSL/TLS certificate for HTTPS

### External Services

- **ShareFile Account**: OAuth credentials required
- **OpenAI API Key**: For LLM assistance features
- **SMTP Server**: For email notifications (optional)
- **Redis**: For caching and session storage (optional, included in docker-compose)

---

## Pre-Deployment Checklist

Before deploying to production, ensure:

- [ ] All ShareFile OAuth credentials obtained
- [ ] OpenAI API key acquired
- [ ] Database backup strategy planned
- [ ] SSL/TLS certificates ready (for HTTPS)
- [ ] Domain name configured and DNS pointed correctly
- [ ] Firewall rules configured to allow traffic on ports 80/443
- [ ] Environment variables configured in `.env` files
- [ ] Security secrets generated (JWT_SECRET, SESSION_SECRET)
- [ ] Database password changed from defaults
- [ ] CORS origins configured correctly
- [ ] Log rotation strategy in place

---

## Environment Configuration

### 1. Backend Configuration

Copy the example environment file:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your production values:

#### Critical Settings (MUST CHANGE)

```bash
# Database - Use strong password
DATABASE_URL="postgresql://postgres:CHANGE_THIS_PASSWORD@postgres:5432/rdcredit?schema=public"
POSTGRES_PASSWORD=CHANGE_THIS_PASSWORD

# Security - Generate strong random strings
JWT_SECRET=GENERATE_STRONG_RANDOM_32_CHARS_OR_MORE
SESSION_SECRET=GENERATE_STRONG_RANDOM_32_CHARS_OR_MORE

# ShareFile OAuth
SHAREFILE_CLIENT_ID=your_actual_client_id
SHAREFILE_CLIENT_SECRET=your_actual_client_secret
SHAREFILE_SUBDOMAIN=your_subdomain
SHAREFILE_REDIRECT_URI=https://your-domain.com/api/auth/sharefile/callback

# OpenAI
OPENAI_API_KEY=sk-your-actual-api-key

# CORS - Your frontend domain
CORS_ORIGIN=https://your-domain.com
```

#### Optional Settings

```bash
# Email (if using email notifications)
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Monitoring
SENTRY_DSN=your-sentry-dsn
SENTRY_ENVIRONMENT=production
```

### 2. Frontend Configuration

Copy the example environment file:

```bash
cp frontend/.env.example frontend/.env
```

Edit `frontend/.env`:

```bash
VITE_API_URL=https://your-domain.com/api
VITE_SHAREFILE_CLIENT_ID=your_actual_client_id
VITE_SHAREFILE_REDIRECT_URI=https://your-domain.com/auth/callback
VITE_SHAREFILE_SUBDOMAIN=your_subdomain
```

### 3. Generate Strong Secrets

```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Deployment Options

### Option 1: Automated Deployment (Recommended)

Use the automated deployment script for quick and consistent deployments.

```bash
# Make script executable (first time only)
chmod +x scripts/deploy.sh

# Run deployment
./scripts/deploy.sh
```

The script will:
1. Check dependencies
2. Validate environment configuration
3. Backup existing database
4. Pull latest code
5. Build Docker images
6. Start services
7. Run database migrations
8. Verify health checks

### Option 2: Manual Deployment

For more control over the deployment process.

### Option 3: Cloud Platform Deployment

Deploy to AWS, Azure, GCP, or DigitalOcean using platform-specific tools.

---

## Automated Deployment

### Using deploy.sh Script

```bash
# Basic deployment
./scripts/deploy.sh

# With specific version tag
VERSION=v1.0.0 ./scripts/deploy.sh
```

### Script Features

- Dependency validation
- Environment configuration checks
- Automatic database backups
- Git integration
- Health check verification
- Rollback support

---

## Manual Deployment

### Step 1: Prepare Environment

```bash
# Clone repository
git clone https://github.com/your-org/rd-credit-service.git
cd rd-credit-service

# Configure environment
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit environment files
nano backend/.env
nano frontend/.env
```

### Step 2: Build Docker Images

```bash
# Build all services
docker-compose -f docker-compose.prod.yml build

# Or build specific service
docker-compose -f docker-compose.prod.yml build backend
docker-compose -f docker-compose.prod.yml build frontend
```

### Step 3: Initialize Database

```bash
# Start database first
docker-compose -f docker-compose.prod.yml up -d postgres redis

# Wait for database to be ready
sleep 10

# Run migrations
docker-compose -f docker-compose.prod.yml run --rm backend npx prisma migrate deploy

# Seed database
docker-compose -f docker-compose.prod.yml run --rm backend npx prisma db seed
```

### Step 4: Start All Services

```bash
# Start all services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Step 5: Verify Deployment

```bash
# Check service status
docker-compose -f docker-compose.prod.yml ps

# Test health endpoints
curl http://localhost:3001/api/health
curl http://localhost:3001/api/ready
curl http://localhost/
```

---

## Cloud Platform Deployment

### AWS Deployment (EC2 + RDS)

#### 1. Launch EC2 Instance

```bash
# Instance Type: t3.medium or larger
# AMI: Ubuntu 22.04 LTS
# Storage: 100 GB
# Security Groups: Allow ports 80, 443, 22
```

#### 2. Setup RDS PostgreSQL

```bash
# Engine: PostgreSQL 14
# Instance: db.t3.medium
# Storage: 100 GB
# Multi-AZ: Yes (for production)
# Backup: 7 days retention
```

#### 3. Deploy Application

```bash
# SSH to EC2 instance
ssh -i your-key.pem ubuntu@your-ec2-ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone and deploy
git clone https://github.com/your-org/rd-credit-service.git
cd rd-credit-service

# Configure with RDS endpoint
nano backend/.env
# DATABASE_URL=postgresql://username:password@rds-endpoint:5432/rdcredit

# Deploy
./scripts/deploy.sh
```

#### 4. Setup Load Balancer (ALB)

- Create Application Load Balancer
- Target Group: Port 80 (frontend)
- Health Check: /api/health
- SSL Certificate: AWS Certificate Manager

### Azure Deployment (Container Instances)

```bash
# Login to Azure
az login

# Create resource group
az group create --name rd-credit-rg --location eastus

# Create PostgreSQL
az postgres flexible-server create \
  --resource-group rd-credit-rg \
  --name rd-credit-db \
  --admin-user postgres \
  --admin-password YourPassword \
  --sku-name Standard_B2s

# Create container registry
az acr create --resource-group rd-credit-rg --name rdcreditacr --sku Basic

# Build and push images
az acr build --registry rdcreditacr --image backend:latest ./backend
az acr build --registry rdcreditacr --image frontend:latest ./frontend

# Deploy containers
az container create \
  --resource-group rd-credit-rg \
  --name rd-credit-backend \
  --image rdcreditacr.azurecr.io/backend:latest \
  --environment-variables DATABASE_URL="..." JWT_SECRET="..." \
  --ports 3001

az container create \
  --resource-group rd-credit-rg \
  --name rd-credit-frontend \
  --image rdcreditacr.azurecr.io/frontend:latest \
  --ports 80
```

### DigitalOcean Deployment (Droplet + Managed Database)

```bash
# Create Droplet (Docker pre-installed)
# Size: 4 GB RAM / 2 vCPUs
# Add SSH key

# Create Managed PostgreSQL
# Plan: 2 GB RAM / 1 vCPU
# Version: 14

# SSH to droplet
ssh root@your-droplet-ip

# Clone repository
git clone https://github.com/your-org/rd-credit-service.git
cd rd-credit-service

# Configure with managed database
nano backend/.env
# Use DigitalOcean database connection string

# Deploy
./scripts/deploy.sh
```

---

## Post-Deployment Tasks

### 1. Verify Services

```bash
# Check all containers are running
docker-compose -f docker-compose.prod.yml ps

# Check health endpoints
curl https://your-domain.com/api/health
curl https://your-domain.com/api/ready

# Check logs
./scripts/logs.sh all 100
```

### 2. Create Admin User

```bash
# Access backend container
docker-compose -f docker-compose.prod.yml exec backend sh

# Run user creation script (if available)
# Or use Prisma Studio
npx prisma studio
```

### 3. Configure Monitoring

```bash
# Setup log aggregation
# Configure Sentry for error tracking
# Setup uptime monitoring (Pingdom, UptimeRobot)
# Configure CloudWatch/Azure Monitor alerts
```

### 4. Setup SSL/TLS

#### Using Let's Encrypt with Certbot

```bash
# Install certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal test
sudo certbot renew --dry-run
```

### 5. Configure Backups

```bash
# Add to crontab for daily backups
crontab -e

# Add line:
0 2 * * * /path/to/scripts/backup-db.sh

# Test backup
./scripts/backup-db.sh
```

---

## Health Checks & Monitoring

### Health Check Endpoints

The application provides several health check endpoints:

| Endpoint | Purpose | Expected Response |
|----------|---------|-------------------|
| `/api/health` | Basic health check | `{"status": "ok"}` |
| `/api/ready` | Readiness check with dependencies | `{"status": "healthy"}` |
| `/api/live` | Liveness check | `{"status": "alive"}` |
| `/api/metrics` | System metrics | CPU, memory, uptime |

### Monitoring with Docker

```bash
# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
./scripts/logs.sh backend 100
./scripts/logs.sh frontend 100
./scripts/logs.sh all 50

# Resource usage
docker stats
```

### Application Logs

```bash
# Backend logs
tail -f backend/logs/app.log

# Docker logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend

# Filter by service
docker-compose -f docker-compose.prod.yml logs --tail=100 postgres
```

---

## Backup & Restore

### Automated Backups

```bash
# Manual backup
./scripts/backup-db.sh

# Automated daily backup (add to crontab)
0 2 * * * /path/to/scripts/backup-db.sh
```

### Backup Files

Backups are stored in: `backups/rdcredit-backup-YYYYMMDD-HHMMSS.sql.gz`

The script automatically:
- Creates compressed backup
- Keeps last 7 backups
- Deletes older backups

### Restore from Backup

```bash
# List available backups
ls -lh backups/

# Restore specific backup
./scripts/restore-db.sh backups/rdcredit-backup-20240121-020000.sql.gz
```

### Manual Backup/Restore

```bash
# Manual backup
docker-compose -f docker-compose.prod.yml exec postgres \
  pg_dump -U postgres rdcredit > backup.sql

# Manual restore
cat backup.sql | docker-compose -f docker-compose.prod.yml exec -T postgres \
  psql -U postgres rdcredit
```

---

## Troubleshooting

### Common Issues

#### Services Won't Start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Check environment variables
docker-compose -f docker-compose.prod.yml config

# Restart services
docker-compose -f docker-compose.prod.yml restart
```

#### Database Connection Failed

```bash
# Check database is running
docker-compose -f docker-compose.prod.yml ps postgres

# Test connection
docker-compose -f docker-compose.prod.yml exec postgres \
  psql -U postgres -c "SELECT 1"

# Check DATABASE_URL
grep DATABASE_URL backend/.env
```

#### Migration Errors

```bash
# Check migration status
docker-compose -f docker-compose.prod.yml exec backend \
  npx prisma migrate status

# Reset and re-migrate (WARNING: Data loss)
docker-compose -f docker-compose.prod.yml exec backend \
  npx prisma migrate reset

# Deploy specific migration
docker-compose -f docker-compose.prod.yml exec backend \
  npx prisma migrate deploy
```

#### Out of Memory

```bash
# Check memory usage
docker stats

# Increase container limits in docker-compose.prod.yml
deploy:
  resources:
    limits:
      memory: 4G

# Restart with new limits
docker-compose -f docker-compose.prod.yml up -d
```

#### High CPU Usage

```bash
# Check which service
docker stats

# Check logs for errors
./scripts/logs.sh backend 500

# Scale if needed (requires orchestration)
# Optimize database queries
# Check for memory leaks
```

### Debug Mode

```bash
# Enable debug logging
# In backend/.env
LOG_LEVEL=debug

# Restart backend
docker-compose -f docker-compose.prod.yml restart backend

# View debug logs
./scripts/logs.sh backend 200
```

---

## Security Best Practices

### 1. Environment Variables

-  Never commit `.env` files to git
-  Use strong random secrets (32+ characters)
-  Rotate secrets regularly (quarterly recommended)
-  Use different secrets for dev/staging/prod

### 2. Database Security

-  Use strong database passwords
-  Enable SSL for database connections
-  Restrict database access to backend only
-  Regular backups with encryption
-  Keep PostgreSQL updated

### 3. API Security

-  Use HTTPS only (redirect HTTP to HTTPS)
-  Configure CORS properly
-  Enable rate limiting
-  Keep dependencies updated
-  Use helmet for security headers

### 4. Container Security

-  Run containers as non-root user
-  Keep base images updated
-  Scan images for vulnerabilities
-  Limit container resources
-  Use read-only filesystems where possible

### 5. Network Security

-  Use Docker networks for service isolation
-  Don't expose database ports publicly
-  Configure firewall rules
-  Use VPC/private networks in cloud

### 6. Monitoring & Logging

-  Enable audit logging
-  Monitor for suspicious activity
-  Set up alerts for errors
-  Regular security audits
-  Keep logs for compliance

### 7. Access Control

-  Use SSH keys (not passwords)
-  Implement MFA for admin access
-  Regular access reviews
-  Principle of least privilege
-  Disable root login

---

## Maintenance Tasks

### Daily

- Check service health status
- Review error logs
- Monitor disk space

### Weekly

- Review security logs
- Check backup integrity
- Update dependencies (if needed)

### Monthly

- Rotate secrets and keys
- Database optimization (VACUUM)
- Review and update documentation
- Security scan

### Quarterly

- Full security audit
- Disaster recovery test
- Performance optimization review
- Update base images and dependencies

---

## Support & Resources

### Documentation

- [Architecture Overview](./ARCHITECTURE.md)
- [API Reference](./API_REFERENCE.md)
- [Setup Guide](./SETUP_GUIDE.md)
- [Feature Comparison](./FEATURE_COMPARISON.md)

### Useful Commands

```bash
# View all services
docker-compose -f docker-compose.prod.yml ps

# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend

# View logs
./scripts/logs.sh [service] [lines]

# Backup database
./scripts/backup-db.sh

# Restore database
./scripts/restore-db.sh [backup-file]

# Deploy/update
./scripts/deploy.sh

# Initialize database
./scripts/init-db.sh
```

### Getting Help

- Check logs: `./scripts/logs.sh all 500`
- Review health checks: `curl http://localhost:3001/api/ready`
- Check GitHub Issues
- Contact support team

---

## Version History

- **v1.0.0** - Initial production release
- Production-ready deployment configuration
- Complete health check system
- Automated deployment scripts
- Comprehensive monitoring setup

---

**Last Updated:** 2024-01-21

**Maintained By:** R&D Credit Service Team
