# R&D Credit Service - Quick Start Deployment Guide

🚀 **Your application is now production-ready!** This guide will get you deployed in minutes.

## Prerequisites Checklist

Before deploying, make sure you have:

- [ ] Docker installed (version 20.10+)
- [ ] Docker Compose installed (version 2.0+)
- [ ] ShareFile OAuth credentials
- [ ] OpenAI API key
- [ ] Domain name (for production)
- [ ] SSL certificate (for HTTPS)

## 3-Step Deployment

### Step 1: Configure Environment

```bash
# Copy environment templates
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Generate strong secrets
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# Edit backend/.env and set:
nano backend/.env
```

**Critical values to change:**
```bash
# Database
POSTGRES_PASSWORD=YOUR_STRONG_PASSWORD_HERE

# Security (use generated values above)
JWT_SECRET=your_generated_jwt_secret_here
SESSION_SECRET=your_generated_session_secret_here

# ShareFile
SHAREFILE_CLIENT_ID=your_actual_client_id
SHAREFILE_CLIENT_SECRET=your_actual_client_secret
SHAREFILE_SUBDOMAIN=your_subdomain

# OpenAI
OPENAI_API_KEY=sk-your_actual_api_key

# CORS
CORS_ORIGIN=https://your-domain.com
```

**Frontend environment:**
```bash
nano frontend/.env
```

```bash
VITE_API_URL=https://your-domain.com/api
VITE_SHAREFILE_CLIENT_ID=your_actual_client_id
VITE_SHAREFILE_REDIRECT_URI=https://your-domain.com/auth/callback
```

### Step 2: Deploy with One Command

```bash
# Make deployment script executable
chmod +x scripts/deploy.sh

# Run automated deployment
./scripts/deploy.sh
```

The script will automatically:
1. ✅ Check dependencies
2. ✅ Validate configuration
3. ✅ Backup existing database
4. ✅ Build Docker images
5. ✅ Start services
6. ✅ Run migrations
7. ✅ Verify health

### Step 3: Verify Deployment

```bash
# Check service status
docker-compose -f docker-compose.prod.yml ps

# Test health checks
curl http://localhost:3001/api/health
curl http://localhost:3001/api/ready

# View logs
./scripts/logs.sh all 50
```

**Access your application:**
- Frontend: http://localhost (port 80)
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/api/health

## Essential Commands

### Service Management

```bash
# Start services
docker-compose -f docker-compose.prod.yml up -d

# Stop services
docker-compose -f docker-compose.prod.yml down

# Restart service
docker-compose -f docker-compose.prod.yml restart backend

# View service status
docker-compose -f docker-compose.prod.yml ps
```

### Logs & Debugging

```bash
# View all logs
./scripts/logs.sh all 100

# View specific service
./scripts/logs.sh backend 50
./scripts/logs.sh frontend 50

# Follow logs in real-time
docker-compose -f docker-compose.prod.yml logs -f
```

### Database Management

```bash
# Create backup
./scripts/backup-db.sh

# Restore from backup
./scripts/restore-db.sh backups/rdcredit-backup-20240121-020000.sql.gz

# Initialize/reset database
./scripts/init-db.sh
```

### Updates & Redeployment

```bash
# Pull latest code and redeploy
git pull
./scripts/deploy.sh
```

## Health Check Endpoints

Your application includes 4 health check endpoints:

| Endpoint | Purpose | Use Case |
|----------|---------|----------|
| `/api/health` | Basic health | Quick status check |
| `/api/ready` | Readiness check | Load balancer health |
| `/api/live` | Liveness probe | Kubernetes/Docker |
| `/api/metrics` | System metrics | Monitoring systems |

## Security Checklist

Before going live, ensure:

- [ ] Changed all default passwords
- [ ] Generated strong JWT_SECRET and SESSION_SECRET
- [ ] Configured CORS_ORIGIN to your actual domain
- [ ] Set up HTTPS with SSL certificate
- [ ] Configured firewall rules (allow 80, 443, block direct DB access)
- [ ] Environment files (.env) are in .gitignore
- [ ] Enabled automated backups
- [ ] Set up monitoring and alerts

## Automated Backups

Set up daily automated backups:

```bash
# Edit crontab
crontab -e

# Add this line for daily 2 AM backups
0 2 * * * /path/to/R-D-CREDIT-SERVICE/scripts/backup-db.sh
```

Backups are stored in `backups/` and kept for 7 days automatically.

## Production Deployment (Cloud)

### AWS Quick Start

```bash
# Launch EC2 instance (Ubuntu 22.04, t3.medium)
# Set up RDS PostgreSQL
# SSH to instance

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Clone and deploy
git clone https://github.com/your-org/rd-credit-service.git
cd rd-credit-service
./scripts/deploy.sh
```

### DigitalOcean Quick Start

```bash
# Create Droplet with Docker (4GB RAM)
# Create Managed PostgreSQL database
# SSH to droplet

git clone https://github.com/your-org/rd-credit-service.git
cd rd-credit-service
nano backend/.env  # Use managed DB connection string
./scripts/deploy.sh
```

## Troubleshooting

### Services won't start
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Verify environment
cat backend/.env | grep -v PASSWORD

# Restart
docker-compose -f docker-compose.prod.yml restart
```

### Database connection failed
```bash
# Test database
docker-compose -f docker-compose.prod.yml exec postgres psql -U postgres -c "SELECT 1"

# Check DATABASE_URL
echo $DATABASE_URL
```

### Out of memory
```bash
# Check usage
docker stats

# Increase limits in docker-compose.prod.yml
# Then restart
docker-compose -f docker-compose.prod.yml up -d
```

## Next Steps

1. **Read Full Documentation**: See [DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md)
2. **Configure SSL/TLS**: Use Let's Encrypt for HTTPS
3. **Set Up Monitoring**: Configure Sentry, CloudWatch, or similar
4. **Enable Backups**: Set up automated daily backups
5. **Review Security**: Follow security best practices

## Support

- 📖 [Full Deployment Guide](./docs/DEPLOYMENT_GUIDE.md)
- 📖 [API Reference](./docs/API_REFERENCE.md)
- 📖 [Architecture Overview](./ARCHITECTURE.md)
- 📖 [Setup Guide](./SETUP_GUIDE.md)

## File Structure

```
.
├── backend/                 # Backend application
│   ├── .env.example        # Environment template
│   └── Dockerfile          # Production-optimized
├── frontend/               # Frontend application
│   ├── .env.example       # Environment template
│   └── Dockerfile         # Production-optimized
├── scripts/               # Deployment automation
│   ├── deploy.sh         # Automated deployment
│   ├── backup-db.sh      # Database backup
│   ├── restore-db.sh     # Database restore
│   ├── logs.sh           # Log viewer
│   └── init-db.sh        # DB initialization
├── docs/
│   └── DEPLOYMENT_GUIDE.md  # Comprehensive guide
├── docker-compose.yml        # Development setup
└── docker-compose.prod.yml   # Production setup
```

---

**Status**: ✅ Production Ready

**Version**: 1.0.0

**Last Updated**: 2024-01-21
