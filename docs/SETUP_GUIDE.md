# Complete Setup Guide - R&D Tax Credit Application

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [ShareFile Setup](#sharefile-setup)
3. [Database Setup](#database-setup)
4. [Environment Configuration](#environment-configuration)
5. [Backend Setup](#backend-setup)
6. [Frontend Setup](#frontend-setup)
7. [Docker Deployment](#docker-deployment)
8. [Cloud Deployment](#cloud-deployment)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software
- **Node.js**: Version 18.0.0 or higher
  ```bash
  node --version  # Should show v18.x.x or higher
  ```

- **npm**: Version 9.0.0 or higher
  ```bash
  npm --version   # Should show 9.x.x or higher
  ```

- **PostgreSQL**: Version 14 or higher
  ```bash
  psql --version  # Should show 14.x or higher
  ```

- **Git**: Latest version
  ```bash
  git --version
  ```

### Optional Software
- **Docker**: For containerized deployment
- **Docker Compose**: For multi-container orchestration

### Required Accounts
1. **ShareFile Account** (with admin access)
2. **OpenAI Account** (for LLM features)
3. **GitHub Account** (for repository access)

---

## ShareFile Setup

### Step 1: Create OAuth Application

1. Log into your ShareFile account at https://[your-subdomain].sharefile.com

2. Navigate to **Settings → API & Integrations**

3. Click **Create New App**

4. Fill in the application details:
   ```
   Application Name: R&D Tax Credit Application
   Description: ShareFile-native R&D tax credit study platform
   Application Type: Web Application
   ```

5. Set the **Redirect URI**:
   - Development: `http://localhost:3000/api/auth/sharefile/callback`
   - Production: `https://your-domain.com/api/auth/sharefile/callback`

6. Set **Permissions**:
   - ✅ Read user information
   - ✅ Create and modify folders
   - ✅ Upload and download files
   - ✅ Read and write file metadata

7. Click **Create** and save the following:
   - **Client ID**: `abc123...`
   - **Client Secret**: `xyz789...`
   - **Subdomain**: `your-company`

### Step 2: Configure API Access

1. In ShareFile, go to **Settings → API Settings**

2. Enable the following:
   - ✅ OAuth 2.0 Authentication
   - ✅ API Rate Limiting (recommended: 100 requests/minute)

3. Create a root folder for engagements:
   - Navigate to **Files → Create Folder**
   - Name: "RD Credit Engagements"
   - Note the Folder ID from the URL

---

## Database Setup

### Option 1: Local PostgreSQL

1. **Install PostgreSQL 14+**

   **macOS (Homebrew):**
   ```bash
   brew install postgresql@14
   brew services start postgresql@14
   ```

   **Ubuntu/Debian:**
   ```bash
   sudo apt update
   sudo apt install postgresql-14 postgresql-contrib-14
   sudo systemctl start postgresql
   ```

   **Windows:**
   - Download from https://www.postgresql.org/download/windows/
   - Run the installer and follow prompts

2. **Create Database**
   ```bash
   # Connect to PostgreSQL
   sudo -u postgres psql

   # Create database and user
   CREATE DATABASE rdcredit;
   CREATE USER rdcredit_user WITH ENCRYPTED PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE rdcredit TO rdcredit_user;
   \q
   ```

3. **Verify Connection**
   ```bash
   psql -U rdcredit_user -d rdcredit -h localhost
   ```

### Option 2: Docker PostgreSQL

```bash
docker run --name rd-credit-db \
  -e POSTGRES_DB=rdcredit \
  -e POSTGRES_USER=rdcredit_user \
  -e POSTGRES_PASSWORD=your_secure_password \
  -p 5432:5432 \
  -v pgdata:/var/lib/postgresql/data \
  -d postgres:14-alpine
```

### Option 3: Cloud Database

**AWS RDS:**
1. Create PostgreSQL 14 instance
2. Configure security group (port 5432)
3. Note the endpoint: `your-db.region.rds.amazonaws.com`

**Google Cloud SQL:**
1. Create PostgreSQL 14 instance
2. Add your IP to authorized networks
3. Note the connection string

**Azure Database:**
1. Create Azure Database for PostgreSQL
2. Configure firewall rules
3. Note the server name

---

## Environment Configuration

### Step 1: Clone Repository

```bash
git clone https://github.com/jtoroni309-creator/R-D-CREDIT-SERVICE.git
cd R-D-CREDIT-SERVICE
```

### Step 2: Create Environment Files

**Root `.env`:**
```bash
cp .env.example .env
```

Edit `.env`:
```env
# Database
DATABASE_URL="postgresql://rdcredit_user:your_secure_password@localhost:5432/rdcredit?schema=public"

# ShareFile OAuth
SHAREFILE_CLIENT_ID=your_client_id_from_sharefile
SHAREFILE_CLIENT_SECRET=your_client_secret_from_sharefile
SHAREFILE_REDIRECT_URI=http://localhost:3000/api/auth/sharefile/callback
SHAREFILE_SUBDOMAIN=your_company_subdomain
SHAREFILE_API_URL=https://your_company.sharefile.com/sf/v3

# JWT (generate a secure random string - 32+ characters)
JWT_SECRET=your_super_secret_jwt_key_min_32_chars_random_string_here
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# OpenAI (get from https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-your_openai_api_key_here
OPENAI_MODEL=gpt-4-turbo-preview

# Server
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:5173

# Frontend
VITE_API_URL=http://localhost:3000/api
```

**Backend `.env`:**
```bash
cd backend
cp .env.example .env
```

Copy the same values from root `.env`

**Frontend `.env`:**
```bash
cd ../frontend
cp .env.example .env
```

Edit `frontend/.env`:
```env
VITE_API_URL=http://localhost:3000/api
VITE_SHAREFILE_CLIENT_ID=your_client_id_from_sharefile
VITE_SHAREFILE_REDIRECT_URI=http://localhost:5173/auth/callback
```

### Step 3: Generate JWT Secret

```bash
# Generate a secure random string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output to `JWT_SECRET` in your `.env` files

---

## Backend Setup

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Generate Prisma Client

```bash
npx prisma generate
```

### Step 3: Run Database Migrations

```bash
npx prisma migrate dev --name init
```

This creates all necessary tables in your database.

### Step 4: Seed Database

```bash
npx prisma db seed
```

This adds:
- State credit configurations (CA, NY, TX, MA, WA)
- Default admin user (if configured)

### Step 5: Verify Setup

```bash
npx prisma studio
```

Opens a browser interface to view your database at http://localhost:5555

### Step 6: Start Development Server

```bash
npm run dev
```

Backend should now be running at http://localhost:3000

**Test the API:**
```bash
curl http://localhost:3000/health
# Should return: {"status":"ok","timestamp":"..."}
```

---

## Frontend Setup

### Step 1: Install Dependencies

```bash
cd ../frontend
npm install
```

### Step 2: Start Development Server

```bash
npm run dev
```

Frontend should now be running at http://localhost:5173

### Step 3: Access Application

Open your browser to http://localhost:5173

You should see the login page with "Sign in with ShareFile" button.

---

## Docker Deployment

### Step 1: Configure Environment

Create `.env` file in the root directory with production values:

```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/rdcredit?schema=public
SHAREFILE_CLIENT_ID=your_production_client_id
SHAREFILE_CLIENT_SECRET=your_production_secret
SHAREFILE_REDIRECT_URI=https://your-domain.com/api/auth/sharefile/callback
SHAREFILE_SUBDOMAIN=your_subdomain
SHAREFILE_API_URL=https://your_subdomain.sharefile.com/sf/v3
JWT_SECRET=your_production_jwt_secret_very_long_and_secure
OPENAI_API_KEY=sk-your_production_api_key
CORS_ORIGIN=https://your-domain.com
VITE_API_URL=https://your-domain.com/api
NODE_ENV=production
```

### Step 2: Build and Start Services

```bash
# Build images
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### Step 3: Run Migrations

```bash
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npx prisma db seed
```

### Step 4: Access Application

Open http://localhost (or your domain)

### Docker Management Commands

```bash
# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs for specific service
docker-compose logs -f backend

# Access database
docker-compose exec postgres psql -U postgres -d rdcredit

# Access backend shell
docker-compose exec backend sh

# Remove all data and start fresh
docker-compose down -v
docker-compose up -d
```

---

## Cloud Deployment

### AWS Deployment

#### Step 1: Set Up RDS Database

```bash
# Create RDS PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier rd-credit-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 14.7 \
  --master-username admin \
  --master-user-password YourSecurePassword \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxx \
  --db-name rdcredit
```

#### Step 2: Deploy to ECS

**Create ECR Repositories:**
```bash
aws ecr create-repository --repository-name rd-credit-backend
aws ecr create-repository --repository-name rd-credit-frontend
```

**Build and Push Images:**
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account.dkr.ecr.us-east-1.amazonaws.com

# Build and push backend
cd backend
docker build -t rd-credit-backend .
docker tag rd-credit-backend:latest your-account.dkr.ecr.us-east-1.amazonaws.com/rd-credit-backend:latest
docker push your-account.dkr.ecr.us-east-1.amazonaws.com/rd-credit-backend:latest

# Build and push frontend
cd ../frontend
docker build -t rd-credit-frontend .
docker tag rd-credit-frontend:latest your-account.dkr.ecr.us-east-1.amazonaws.com/rd-credit-frontend:latest
docker push your-account.dkr.ecr.us-east-1.amazonaws.com/rd-credit-frontend:latest
```

**Create ECS Task Definition and Service:**
- Use AWS Console or CLI to create ECS cluster
- Define task with backend and frontend containers
- Configure environment variables
- Set up Application Load Balancer

### Google Cloud Platform

#### Step 1: Set Up Cloud SQL

```bash
gcloud sql instances create rd-credit-db \
  --database-version=POSTGRES_14 \
  --tier=db-f1-micro \
  --region=us-central1

gcloud sql databases create rdcredit --instance=rd-credit-db
```

#### Step 2: Deploy to Cloud Run

```bash
# Build and deploy backend
cd backend
gcloud builds submit --tag gcr.io/your-project/rd-credit-backend
gcloud run deploy rd-credit-backend \
  --image gcr.io/your-project/rd-credit-backend \
  --platform managed \
  --region us-central1 \
  --set-env-vars="DATABASE_URL=postgresql://...,SHAREFILE_CLIENT_ID=..."

# Build and deploy frontend
cd ../frontend
gcloud builds submit --tag gcr.io/your-project/rd-credit-frontend
gcloud run deploy rd-credit-frontend \
  --image gcr.io/your-project/rd-credit-frontend \
  --platform managed \
  --region us-central1
```

### Azure Deployment

#### Step 1: Create Azure Database

```bash
az postgres server create \
  --resource-group rd-credit-rg \
  --name rd-credit-db \
  --location eastus \
  --admin-user adminuser \
  --admin-password YourSecurePassword \
  --sku-name B_Gen5_1

az postgres db create \
  --resource-group rd-credit-rg \
  --server-name rd-credit-db \
  --name rdcredit
```

#### Step 2: Deploy to App Service

```bash
# Create App Service Plan
az appservice plan create \
  --name rd-credit-plan \
  --resource-group rd-credit-rg \
  --sku B1 \
  --is-linux

# Create Web App
az webapp create \
  --resource-group rd-credit-rg \
  --plan rd-credit-plan \
  --name rd-credit-app \
  --deployment-container-image-name your-registry/rd-credit-backend:latest

# Configure environment variables
az webapp config appsettings set \
  --resource-group rd-credit-rg \
  --name rd-credit-app \
  --settings DATABASE_URL="postgresql://..." SHAREFILE_CLIENT_ID="..."
```

---

## Troubleshooting

### Database Connection Issues

**Error: "Connection refused"**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql

# Check if port 5432 is open
sudo netstat -tulpn | grep 5432
```

**Error: "password authentication failed"**
```bash
# Reset password
sudo -u postgres psql
ALTER USER rdcredit_user WITH PASSWORD 'new_password';
\q

# Update .env file with new password
```

### ShareFile Authentication Issues

**Error: "Invalid redirect URI"**
- Verify redirect URI matches exactly in ShareFile OAuth app settings
- Check for trailing slashes
- Ensure protocol (http/https) matches

**Error: "Invalid client credentials"**
- Double-check CLIENT_ID and CLIENT_SECRET
- Ensure no extra spaces in .env file
- Verify subdomain is correct

### OpenAI API Issues

**Error: "Invalid API key"**
```bash
# Test API key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer sk-your-api-key"
```

**Error: "Rate limit exceeded"**
- Check your OpenAI usage limits
- Consider upgrading plan
- Implement request queuing

### Build Issues

**Error: "Cannot find module"**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

**Error: "Prisma client not generated"**
```bash
npx prisma generate
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

### Docker Issues

**Error: "Cannot connect to Docker daemon"**
```bash
# Start Docker
sudo systemctl start docker

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

**Error: "Port already allocated"**
```bash
# Stop conflicting containers
docker ps
docker stop <container-id>

# Or change ports in docker-compose.yml
```

---

## Next Steps

1. **Configure ShareFile Integration**: Test OAuth flow
2. **Create Test Engagement**: Walk through complete workflow
3. **Set Up Monitoring**: Configure logging and error tracking
4. **Configure Backups**: Set up automated database backups
5. **Security Hardening**: Enable SSL/TLS, configure firewall
6. **Performance Tuning**: Optimize database queries, enable caching

---

## Support

For additional help:
- 📚 [Architecture Documentation](../ARCHITECTURE.md)
- 📖 [API Reference](./API_REFERENCE.md)
- 🐛 [Issue Tracker](https://github.com/jtoroni309-creator/R-D-CREDIT-SERVICE/issues)
- 📧 Email: support@example.com
