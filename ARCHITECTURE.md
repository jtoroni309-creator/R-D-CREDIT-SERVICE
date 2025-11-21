# R&D Tax Credit ShareFile Application - Architecture

## Overview
A complete ShareFile-native application for conducting Federal and State R&D Tax Credit studies with integrated LLM assistance, comprehensive calculations, and IRS-compliant outputs.

## Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 14+ (relational data with JSON support)
- **ORM**: Prisma
- **Authentication**: ShareFile OAuth 2.0
- **LLM**: OpenAI API (GPT-4)
- **PDF Generation**: PDFKit + pdfmake
- **Excel Export**: ExcelJS

### Frontend
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **UI Library**: Material-UI (MUI) v5
- **State Management**: React Context + TanStack Query
- **Forms**: React Hook Form + Zod validation
- **Tables**: TanStack Table
- **HTTP Client**: Axios

### Infrastructure
- **Hosting**: Docker containers
- **Reverse Proxy**: Nginx
- **SSL/TLS**: Let's Encrypt
- **Logging**: Winston + structured logging
- **Monitoring**: Prometheus + Grafana (optional)

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    ShareFile Platform                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Auth & Users │  │ Folders/Files│  │ Client Portal│      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└────────────────────────────┬────────────────────────────────┘
                             │ OAuth 2.0 / API
                             │
┌────────────────────────────┼────────────────────────────────┐
│                    R&D Credit Application                    │
│                             │                                │
│  ┌─────────────────────────▼──────────────────────────┐    │
│  │              Embedded Frontend (React)              │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐│    │
│  │  │Engagement│ │ Projects │ │   QRE    │ │Reports ││    │
│  │  │  Setup   │ │ & 4-Part │ │  Entry   │ │ Review ││    │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────┘│    │
│  └─────────────────────────┬──────────────────────────┘    │
│                             │ REST API                       │
│  ┌─────────────────────────▼──────────────────────────┐    │
│  │            Backend API (Express + TypeScript)       │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐│    │
│  │  │  Auth    │ │ Business │ │   LLM    │ │  PDF   ││    │
│  │  │Middleware│ │  Logic   │ │Integration│ │ Engine ││    │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────┘│    │
│  └─────────────────────────┬──────────────────────────┘    │
│                             │                                │
│  ┌─────────────────────────▼──────────────────────────┐    │
│  │         PostgreSQL Database (Prisma ORM)            │    │
│  │  - Engagements  - Projects  - QREs  - Audit Logs   │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
              ┌─────▼─────┐   ┌──────▼──────┐
              │  OpenAI   │   │  ShareFile  │
              │    API    │   │   Storage   │
              └───────────┘   └─────────────┘
```

## Data Model

### Core Entities

#### Engagement
- Links to ShareFile folder ID
- Taxpayer information
- Tax year
- Selected states
- Status (draft, in_progress, review, approved, completed)
- Creation/modification timestamps

#### Project
- Belongs to Engagement
- Project name and description
- Business component details
- Technologies used
- 4-Part Test responses (JSON)
- LLM-assisted narratives
- Validation status

#### QRE Categories

##### Wages
- Employee name
- Annual salary
- % time on R&D
- Qualified wages amount
- Project allocation

##### Supplies
- Description
- Total cost
- Project allocation
- Justification

##### Contract Research
- Vendor name
- Contract amount
- Qualified percentage
- Project allocation

#### Calculation Results
- Federal Regular Credit
- Federal ASC
- State-by-state credits
- Totals by category
- Historical base amounts

#### Audit Log
- Entity type and ID
- Action performed
- User
- Timestamp
- Change details (JSON)

## API Endpoints

### Authentication
- `POST /api/auth/sharefile/callback` - OAuth callback
- `GET /api/auth/me` - Current user info
- `POST /api/auth/refresh` - Refresh token

### Engagements
- `GET /api/engagements` - List all
- `POST /api/engagements` - Create new
- `GET /api/engagements/:id` - Get details
- `PUT /api/engagements/:id` - Update
- `DELETE /api/engagements/:id` - Delete

### Projects
- `GET /api/engagements/:engagementId/projects` - List
- `POST /api/engagements/:engagementId/projects` - Create
- `GET /api/projects/:id` - Get details
- `PUT /api/projects/:id` - Update
- `DELETE /api/projects/:id` - Delete
- `POST /api/projects/:id/validate-4part` - Validate 4-part test

### QREs
- `GET /api/engagements/:engagementId/qre/wages` - List wages
- `POST /api/engagements/:engagementId/qre/wages` - Add wage
- `PUT /api/qre/wages/:id` - Update wage
- `DELETE /api/qre/wages/:id` - Delete wage
- (Similar endpoints for supplies and contracts)

### Calculations
- `POST /api/engagements/:id/calculate` - Run calculations
- `GET /api/engagements/:id/calculations` - Get results
- `GET /api/engagements/:id/summary` - Summary by project/category

### LLM Assistance
- `POST /api/llm/improve-narrative` - Improve project narrative
- `POST /api/llm/expand-technical-details` - Expand technical details
- `POST /api/llm/suggest-missing-info` - Identify gaps

### Reports
- `POST /api/engagements/:id/generate-report` - Generate PDF
- `GET /api/engagements/:id/report` - Download PDF
- `GET /api/engagements/:id/form6765` - Export Form 6765 data
- `POST /api/engagements/:id/finalize` - Finalize and save to ShareFile

## Security Model

### Roles
1. **Client** - View own engagement, enter data, no access to calculations
2. **Staff** - Full access to assigned engagements
3. **Admin** - Full system access, user management

### Authentication Flow
1. User accesses app via ShareFile portal
2. App redirects to ShareFile OAuth
3. User authorizes app
4. App receives access token and refresh token
5. Token stored securely (httpOnly cookie)
6. All API calls include token
7. Backend validates token with ShareFile
8. User role determined from ShareFile permissions

### Data Protection
- All data encrypted at rest (PostgreSQL TDE)
- TLS 1.3 for all connections
- API rate limiting
- Input validation and sanitization
- SQL injection prevention (Prisma ORM)
- XSS prevention (React escaping + CSP headers)

## Calculation Engines

### Federal Regular Credit (Section 41)
```
Regular Credit = 20% × (Current Year QREs - Base Amount)
Base Amount = Fixed-Base % × Average Annual Gross Receipts (4 years)
Fixed-Base % = Aggregate QREs (1984-1988) / Aggregate Gross Receipts (1984-1988)
```

### Federal Alternative Simplified Credit (ASC)
```
ASC = 14% × (Current Year QREs - 50% × Average QREs (prior 3 years))
Minimum Base = 0 (if negative, use 0)
```

### State Credits
Configurable by state:
- Rate (%)
- Base calculation method
- Carryforward rules
- Cap limits
- Refundability

## 4-Part Test Validation

### Questions Per Test
1. **Permitted Purpose**
   - Is the purpose to develop a new or improved business component?
   - Does it improve function, performance, reliability, or quality?

2. **Elimination of Uncertainty**
   - What technical uncertainty existed?
   - Was the capability or method uncertain?
   - Was the design uncertain?

3. **Process of Experimentation**
   - What alternatives were evaluated?
   - What testing was performed?
   - How were results analyzed?

4. **Technological in Nature**
   - Was it based on hard sciences (engineering, physics, chemistry, biology, computer science)?
   - Did it rely on principles of these sciences?

### Validation Rules
- All 4 tests must have substantive answers (>100 characters)
- Flag missing elements for user review
- LLM can suggest improvements but not fabricate facts

## LLM Integration

### Prompts

#### Narrative Improvement
```
You are assisting a CPA with an R&D tax credit study.
Improve the following project narrative for clarity and completeness.
Do NOT add facts not present in the original.
Only rephrase and organize the existing information.

Original: {user_text}

Improved version:
```

#### Technical Expansion
```
Review this technical description for an R&D project.
Identify any areas that need more detail to satisfy IRS requirements.
Ask specific questions about missing information.

Technical Description: {user_text}

Questions to ask the client:
```

### Disclaimers
Every LLM output includes:
> ⚠️ AI-Generated Content: This text was created with AI assistance. It must be reviewed and approved by a qualified CPA before inclusion in the final R&D study.

## Workflow Steps

### Step 1: Engagement Setup
- Create engagement in ShareFile folder
- Enter taxpayer details (name, EIN, address)
- Select tax year
- Choose applicable states
- Set up team access

### Step 2: Client Intake
- Client questionnaire (general business info)
- High-level R&D activity description
- List potential projects

### Step 3: Project Details
- For each project:
  - Name and description
  - Business component
  - Technical uncertainties
  - Technologies used
  - 4-Part Test questionnaire
  - LLM assistance for narratives

### Step 4: QRE Entry
- Wages table (employees, time, qualified amounts)
- Supplies table (description, cost, allocation)
- Contract research table (vendors, amounts, qualification %)

### Step 5: Calculations
- Run Federal Regular Credit calculation
- Run Federal ASC calculation
- Run State credit calculations
- Review allocation by project
- Review summary by QRE category

### Step 6: Review & Approval
- Staff reviews all data
- Validates 4-Part Test completeness
- Checks calculations
- Approves for finalization

### Step 7: Generate Outputs
- PDF Report: Full R&D study with narratives, test results, summaries
- Form 6765 Dataset: JSON/CSV/Excel with line-by-line data
- Save all to ShareFile engagement folder
- Lock engagement (no further edits without unlock)

## PDF Report Structure

### Title Page
- Client name
- Tax year
- Report date
- Preparer information

### Executive Summary
- Total QREs
- Federal Regular Credit
- Federal ASC
- State credits summary

### Section 1: Taxpayer Information
- Legal name, EIN
- Address
- Business description

### Section 2: R&D Projects
For each project:
- Project name
- Business component
- Technologies
- 4-Part Test responses
- QRE allocation

### Section 3: Qualified Research Expenses
- Wages summary table
- Supplies summary table
- Contract research summary table
- Total by category

### Section 4: Credit Calculations
- Federal Regular Credit calculation
- Federal ASC calculation
- State-by-state calculations

### Section 5: Supporting Documentation
- References to source documents
- Methodology notes

### Appendices
- Detailed QRE listings
- Employee time allocation detail

## Form 6765 Export

### Data Fields
- Part I: Current Year Credit
  - Lines 1-9: Regular Credit calculation
  - Lines 10-16: ASC calculation

- Part II: Qualified Research Expenses
  - Wages
  - Supplies
  - Contract research

- Part III: Credit Calculation

### Export Formats
1. **JSON**: Structured data for software import
2. **CSV**: Tabular format for spreadsheets
3. **Excel**: Multi-sheet workbook with formatting
4. **PDF Preview**: Form layout for manual transcription

## Audit Logging

### Logged Actions
- CREATE, UPDATE, DELETE for all entities
- Calculation runs
- Report generation
- User logins
- Data exports
- Status changes

### Log Entry Schema
```typescript
{
  id: string
  timestamp: DateTime
  userId: string
  userName: string
  action: string
  entityType: string
  entityId: string
  changes: json
  ipAddress: string
  userAgent: string
}
```

## Deployment

### Docker Compose Setup
```yaml
services:
  postgres:
    image: postgres:14
    volumes:
      - pgdata:/var/lib/postgresql/data

  backend:
    build: ./backend
    environment:
      - DATABASE_URL
      - SHAREFILE_CLIENT_ID
      - SHAREFILE_CLIENT_SECRET
      - OPENAI_API_KEY

  frontend:
    build: ./frontend
    depends_on:
      - backend

  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
```

### Environment Variables
```
DATABASE_URL=postgresql://user:pass@postgres:5432/rdcredit
SHAREFILE_CLIENT_ID=your_client_id
SHAREFILE_CLIENT_SECRET=your_client_secret
SHAREFILE_REDIRECT_URI=https://your-app.com/auth/callback
OPENAI_API_KEY=sk-...
JWT_SECRET=your_secret_key
NODE_ENV=production
```

## Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Docker (optional)

### Installation
```bash
# Clone repository
git clone <repo-url>

# Backend setup
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev

# Frontend setup
cd ../frontend
npm install
npm run dev
```

### Environment Files
- `backend/.env` - Backend configuration
- `frontend/.env` - Frontend configuration

## Testing Strategy

### Unit Tests
- Calculation engines (Jest)
- Validation logic
- Data transformations

### Integration Tests
- API endpoints (Supertest)
- Database operations
- ShareFile integration

### E2E Tests
- Complete workflow (Playwright)
- PDF generation
- Form export

## Performance Considerations

### Database
- Indexes on foreign keys
- Composite indexes for common queries
- Connection pooling

### API
- Response caching for reference data
- Pagination for list endpoints
- Streaming for large file downloads

### Frontend
- Code splitting
- Lazy loading of routes
- Memoization of expensive computations

## Future Enhancements

1. **Advanced Analytics**
   - Historical trends
   - Industry benchmarking
   - Predictive modeling

2. **Collaboration Features**
   - Real-time co-editing
   - Comments and annotations
   - Version comparison

3. **Integration Expansion**
   - QuickBooks integration
   - Payroll system connectors
   - E-filing integration

4. **AI Enhancements**
   - Automated project categorization
   - Intelligent QRE allocation
   - Risk assessment

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
- Maintain audit trail
- Secure archival storage

## Support & Documentation

### User Documentation
- Getting started guide
- Video tutorials
- FAQ section
- Workflow examples

### API Documentation
- OpenAPI/Swagger specification
- Example requests/responses
- Authentication guide
- Webhook documentation

### Admin Guide
- Installation instructions
- Configuration options
- Troubleshooting
- Backup/restore procedures
