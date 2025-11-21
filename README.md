# R&D Tax Credit ShareFile Application

A complete, ShareFile-native application for conducting Federal and State R&D Tax Credit studies with integrated LLM assistance, comprehensive calculations, and IRS-compliant outputs.

## Features

### Core Functionality
- **ShareFile Integration**: Native authentication, folder management, and file storage
- **Engagement Management**: Track multiple R&D credit studies with taxpayer information
- **Project Tracking**: Document R&D projects with the 4-part test requirements
- **QRE Management**: Track wages, supplies, and contract research expenses
- **Federal Calculations**: Both Regular Credit and Alternative Simplified Credit (ASC)
- **State Credits**: Configurable state-by-state credit calculations
- **LLM Assistance**: AI-powered narrative improvement with OpenAI GPT-4
- **PDF Reports**: Professional R&D study reports with complete documentation
- **Form 6765 Export**: JSON, CSV, and Excel formats for tax software integration

### Security & Compliance
- ShareFile OAuth 2.0 authentication
- Role-based access control (Client, Staff, Admin)
- Complete audit logging
- Encrypted data at rest
- IRS Section 41 compliance
- Professional CPA review workflow

## Technology Stack

### Backend
- Node.js 18+ with TypeScript
- Express.js framework
- PostgreSQL 14+ database
- Prisma ORM
- OpenAI GPT-4 API
- PDFKit for PDF generation
- ExcelJS for spreadsheet export

### Frontend
- React 18+ with TypeScript
- Material-UI (MUI) v5
- TanStack Query for data fetching
- React Router for navigation
- Vite for fast development

### Infrastructure
- Docker & Docker Compose
- Nginx reverse proxy
- Automated database migrations

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Docker & Docker Compose (optional)
- ShareFile account with OAuth app configured
- OpenAI API key

### 1. Clone Repository
```bash
git clone https://github.com/jtoroni309-creator/R-D-CREDIT-SERVICE.git
cd R-D-CREDIT-SERVICE
```

### 2. Environment Setup

Copy the example environment files:
```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Edit the `.env` files with your credentials:
- ShareFile OAuth credentials
- Database connection string
- JWT secret
- OpenAI API key

### 3. Database Setup

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

### 4. Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Access the application at http://localhost:5173

### 5. Docker Deployment

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Access the application at http://localhost

## ShareFile Configuration

### Create OAuth Application

1. Log into your ShareFile account
2. Navigate to Settings > API & Integrations
3. Create new OAuth 2.0 application
4. Set the redirect URI to: `http://your-domain/api/auth/sharefile/callback`
5. Copy the Client ID and Client Secret to your `.env` file

### Permissions Required
- Read/Write access to folders
- User information access
- File upload/download permissions

## Application Workflow

### 1. Engagement Setup
- Create new engagement with taxpayer details
- Select tax year and applicable states
- ShareFile folder automatically created

### 2. Project Documentation
- Add R&D projects with descriptions
- Complete 4-part test questionnaire:
  - Permitted Purpose
  - Elimination of Uncertainty
  - Process of Experimentation
  - Technological in Nature
- Use AI assistance to improve narratives

### 3. QRE Data Entry
- Enter employee wages with R&D time allocation
- Document supplies and materials
- Track contract research expenses
- Allocate costs to specific projects

### 4. Calculate Credits
- Run Federal Regular Credit calculation
- Calculate Alternative Simplified Credit (ASC)
- Compute state-specific credits
- Review allocations by project

### 5. Generate Reports
- PDF R&D Study with complete documentation
- Form 6765 data exports (JSON/CSV/Excel)
- All files saved to ShareFile engagement folder

## API Documentation

### Authentication
```
POST /api/auth/sharefile/login      - Initiate ShareFile OAuth
GET  /api/auth/sharefile/callback   - Handle OAuth callback
POST /api/auth/refresh              - Refresh access token
GET  /api/auth/me                   - Get current user
```

### Engagements
```
GET    /api/engagements             - List engagements
POST   /api/engagements             - Create engagement
GET    /api/engagements/:id         - Get engagement details
PUT    /api/engagements/:id         - Update engagement
DELETE /api/engagements/:id         - Delete engagement
GET    /api/engagements/:id/summary - Get summary statistics
```

### Projects
```
GET    /api/projects/engagement/:engagementId  - List projects
POST   /api/projects/engagement/:engagementId  - Create project
GET    /api/projects/:id                       - Get project
PUT    /api/projects/:id                       - Update project
DELETE /api/projects/:id                       - Delete project
POST   /api/projects/:id/validate-4part        - Validate 4-part test
```

### QRE Tracking
```
GET    /api/qre/engagement/:engagementId/wages     - List wages
POST   /api/qre/engagement/:engagementId/wages     - Add wage
PUT    /api/qre/wages/:id                          - Update wage
DELETE /api/qre/wages/:id                          - Delete wage
# Similar endpoints for supplies and contracts
```

### Calculations
```
POST /api/calculations/engagement/:engagementId/calculate  - Run calculations
GET  /api/calculations/engagement/:engagementId/latest     - Get latest results
```

### LLM Assistance
```
POST /api/llm/improve-narrative   - Improve project narrative
POST /api/llm/expand-technical    - Expand technical details
POST /api/llm/suggest-missing     - Identify missing information
```

### Reports
```
POST /api/reports/engagement/:id/generate-pdf        - Generate PDF report
POST /api/reports/engagement/:id/form6765/json       - Export Form 6765 JSON
POST /api/reports/engagement/:id/form6765/csv        - Export Form 6765 CSV
POST /api/reports/engagement/:id/form6765/excel      - Export Form 6765 Excel
```

## Federal Credit Calculations

### Regular Credit
```
Regular Credit = 20% × (Current Year QRE - Base Amount)
Base Amount = Fixed-Base % × Average Annual Gross Receipts (4 years)
```

### Alternative Simplified Credit (ASC)
```
ASC = 14% × (Current Year QRE - 50% × Average QREs (prior 3 years))
```

## State Credit Configurations

State credits are configurable in the database:
- California: 15% with unlimited carryforward
- New York: 10% with 15-year carryforward
- Texas: 5% with 20-year carryforward
- Massachusetts: 10% with 15-year carryforward
- Washington: 1.5% with $2M annual cap

Add more states via the `state_configs` table.

## LLM Integration

### AI Narrative Improvement
The application uses OpenAI GPT-4 to assist with:
- Improving project narratives for clarity
- Expanding technical descriptions
- Identifying missing information
- Suggesting areas that need more detail

### Important Disclaimers
- AI does NOT fabricate facts or data
- AI only rephrases and organizes existing information
- All AI-generated content includes disclaimer
- CPA review required before finalization

## Security Best Practices

### Authentication
- OAuth 2.0 with ShareFile
- JWT tokens with refresh mechanism
- httpOnly cookies for token storage
- Token expiration and rotation

### Data Protection
- PostgreSQL encryption at rest
- TLS 1.3 for all connections
- Input validation with Zod
- SQL injection prevention via Prisma
- XSS prevention with React escaping

### Access Control
- Role-based permissions (CLIENT, STAFF, ADMIN)
- Clients can only access their own engagements
- Staff can access assigned engagements
- Admins have full system access

## Audit Logging

All actions are logged:
- User authentication events
- Engagement creation/modification
- Project changes
- QRE data entry
- Calculation runs
- Report generation
- Data exports

Logs include:
- Timestamp
- User ID and name
- Action type
- Entity type and ID
- Before/after values (for updates)
- IP address and user agent

## Database Schema

### Core Tables
- `users` - User accounts linked to ShareFile
- `engagements` - R&D credit studies
- `projects` - Individual R&D projects
- `wages` - Employee wage QREs
- `supplies` - Supply and material QREs
- `contract_research` - Contract research QREs
- `calculations` - Credit calculation results
- `reports` - Generated reports
- `audit_logs` - Complete audit trail
- `state_configs` - State credit configurations

See `backend/prisma/schema.prisma` for complete schema.

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up -d
```

### ShareFile Authentication Issues
- Verify OAuth credentials are correct
- Check redirect URI matches exactly
- Ensure ShareFile subdomain is correct
- Verify API URL is accessible

### LLM Issues
- Verify OpenAI API key is valid
- Check API quota and billing
- Review rate limiting settings
- Monitor token usage

### Build Issues
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Regenerate Prisma client
npx prisma generate

# Clear TypeScript cache
rm -rf dist
npm run build
```

## Testing

### Unit Tests
```bash
cd backend
npm test
```

### API Testing
```bash
# Install testing tools
npm install -g @hoppscotch/cli

# Run API tests
hoppscotch test api-tests.json
```

### E2E Testing
```bash
cd frontend
npm run test:e2e
```

## Production Deployment

### Environment Variables
Ensure all production environment variables are set:
- Strong JWT secret (min 32 characters)
- Production database URL
- Production ShareFile credentials
- Production CORS origin
- Secure OpenAI API key

### Database Migrations
```bash
npx prisma migrate deploy
```

### SSL/TLS
Configure SSL certificates:
- Use Let's Encrypt for free certificates
- Configure Nginx for HTTPS
- Redirect HTTP to HTTPS
- Enable HSTS headers

### Monitoring
- Set up application logging
- Monitor API response times
- Track database performance
- Set up error alerting
- Monitor LLM usage and costs

## Support & Documentation

### Additional Resources
- [Architecture Documentation](ARCHITECTURE.md)
- [API Reference](docs/api-reference.md)
- [ShareFile API Docs](https://api.sharefile.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [OpenAI API Docs](https://platform.openai.com/docs)

### Contributing
Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### License
This project is proprietary and confidential.

### Contact
For support, please contact:
- Technical Support: support@example.com
- Security Issues: security@example.com

## Compliance Notes

### IRS Requirements (IRC Section 41)
- Documentation must substantiate all 4 tests
- QREs must be directly related to qualified research
- Contemporaneous documentation preferred
- Reasonable allocation methodology required

### State Variations
- Each state has unique credit calculations
- Some states require pre-approval
- Carryforward periods vary
- Some states have caps or limitations

### Data Retention
- Minimum 7 years (IRS statute of limitations)
- Maintain complete audit trail
- Secure archival storage required

## Version History

### Version 1.0.0 (Current)
- Initial release
- Complete ShareFile integration
- Federal and State credit calculations
- LLM narrative assistance
- PDF and Form 6765 exports
- Role-based access control
- Comprehensive audit logging

## Roadmap

### Future Enhancements
- [ ] Real-time collaboration features
- [ ] Advanced analytics dashboard
- [ ] Industry benchmarking
- [ ] QuickBooks integration
- [ ] Automated project categorization
- [ ] Intelligent QRE allocation
- [ ] Risk assessment tools
- [ ] Mobile application
- [ ] E-filing integration
- [ ] Multi-language support

---

Built with ❤️ for tax professionals and R&D credit specialists.
