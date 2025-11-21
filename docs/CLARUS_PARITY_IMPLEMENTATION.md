# Clarus R&D Parity Implementation Guide

## Implementation Status

### ✅ Phase 1: Core Features (COMPLETE)
- [x] ShareFile Integration
- [x] Project Documentation
- [x] 4-Part Test Engine
- [x] QRE Tracking (Wages, Supplies, Contracts)
- [x] Federal Calculations (Regular & ASC)
- [x] State Credit Calculations
- [x] Form 6765 Export
- [x] PDF Report Generation
- [x] LLM Narrative Assistance
- [x] Role-Based Access Control
- [x] Audit Logging

### 🚧 Phase 2: Enhanced Features (IN PROGRESS)
- [ ] Document Upload & Management
- [ ] Prior Year Data Carryforward
- [ ] Industry-Specific Templates
- [ ] Multi-Year Comparison Reports
- [ ] Payroll Integration Framework

### 📋 Phase 3: Advanced Features (PLANNED)
- [ ] Real-Time Payroll Sync
- [ ] Automated Activity Suggestions
- [ ] Advanced Analytics Dashboard
- [ ] Mobile Application
- [ ] E-Filing Integration

## Detailed Feature Implementation

### 1. Document Upload & Management

**Clarus Feature:** Users can upload and organize supporting documents by project

**Our Implementation:**

#### Database Schema Enhancement
```typescript
// Already added to schema.prisma
model Document {
  id                String          @id @default(uuid())
  engagementId      String
  projectId         String?

  fileName          String
  fileSize          Int
  fileType          String
  category          DocumentCategory
  shareFileId       String
  shareFileUrl      String

  description       String?
  tags              String[]

  uploadedById      String
  uploadedAt        DateTime
}

enum DocumentCategory {
  PAYROLL_RECORDS
  TIMESHEETS
  INVOICES
  CONTRACTS
  TECHNICAL_DOCS
  MEETING_NOTES
  TEST_RESULTS
  DESIGN_DOCS
  OTHER
}
```

#### API Endpoints
```typescript
POST   /api/documents/upload
GET    /api/engagements/:id/documents
GET    /api/projects/:id/documents
DELETE /api/documents/:id
GET    /api/documents/:id/download
```

#### UI Components
- Document upload dropzone
- Category selector
- Document library with filtering
- Preview and download functionality

### 2. Prior Year Data Carryforward

**Clarus Feature:** Import and pre-fill data from previous tax years

**Our Implementation:**

#### Database Schema Enhancement
```typescript
model Engagement {
  // Add to existing model
  priorYearEngagementId String?
  copiedFromEngagement  Engagement? @relation("EngagementHistory")
  futureYearEngagements Engagement[] @relation("EngagementHistory")
}
```

#### API Endpoints
```typescript
GET  /api/engagements/:id/prior-years
POST /api/engagements/create-from-prior
POST /api/engagements/:id/copy-data
```

#### Workflow
1. User selects "Create New Year" from existing engagement
2. System copies:
   - Taxpayer information
   - Project structures (without narratives)
   - Employee list (updates wages to $0)
   - State selections
3. User updates current year data
4. System maintains link to prior year for base calculations

### 3. Industry-Specific Templates

**Clarus Feature:** Pre-built project templates tailored to industry

**Our Implementation:**

#### Database Schema
```typescript
model IndustryTemplate {
  id                  String
  industry            String  @unique
  displayName         String
  description         String

  projectTemplates    Json    // Pre-defined projects
  commonActivities    Json    // Typical R&D activities
  suggestedQuestions  Json    // 4-part test guidance
}
```

#### Industries Supported
1. **Software Development**
   - New algorithm development
   - Performance optimization
   - Security enhancements
   - API development

2. **Manufacturing**
   - Process improvements
   - Automation development
   - Quality control systems
   - Product design

3. **Biotechnology**
   - Drug development
   - Clinical trials
   - Laboratory processes
   - Formulation development

4. **Architecture & Engineering**
   - Structural innovations
   - Energy efficiency
   - Design optimization
   - Building systems

5. **Food & Beverage**
   - Recipe development
   - Packaging innovation
   - Shelf-life extension
   - Production processes

#### API Endpoints
```typescript
GET  /api/industry-templates
GET  /api/industry-templates/:industry
POST /api/projects/from-template
```

### 4. Multi-Year Comparison Reports

**Clarus Feature:** Compare credits across multiple tax years

**Our Implementation:**

#### Report Structure
```json
{
  "taxpayerInfo": {},
  "years": [
    {
      "year": 2024,
      "totalQRE": 500000,
      "regularCredit": 75000,
      "ascCredit": 52500,
      "projectCount": 5
    },
    {
      "year": 2023,
      "totalQRE": 450000,
      "regularCredit": 67500,
      "ascCredit": 47250,
      "projectCount": 4
    }
  ],
  "trends": {
    "qreGrowth": "11.1%",
    "creditGrowth": "11.1%",
    "avgProjectSize": "$100,000"
  }
}
```

#### API Endpoints
```typescript
GET /api/engagements/multi-year-comparison
GET /api/taxpayers/:ein/history
POST /api/reports/multi-year-pdf
```

#### Charts & Visualizations
- QRE trend line chart
- Credit comparison bar chart
- Category breakdown pie chart
- Year-over-year growth indicators

### 5. Payroll Integration Framework

**Clarus Feature:** Import wage data from payroll systems

**Our Implementation:**

#### Supported Providers
1. **QuickBooks Online**
2. **ADP**
3. **Gusto**
4. **Paychex**
5. **Generic CSV Import**

#### Database Schema
```typescript
model PayrollIntegration {
  id              String
  engagementId    String  @unique
  provider        String
  isEnabled       Boolean
  credentials     Json    // Encrypted
  lastSyncAt      DateTime?
  syncFrequency   String
}
```

#### Integration Flow
1. User connects payroll account (OAuth)
2. System fetches employee list
3. User selects R&D employees
4. User assigns % time to R&D
5. System calculates qualified wages
6. Data synced to engagement

#### API Endpoints
```typescript
POST /api/integrations/payroll/connect
GET  /api/integrations/payroll/employees
POST /api/integrations/payroll/sync
GET  /api/integrations/payroll/status
```

## Implementation Priority Matrix

| Feature | Impact | Effort | Priority | ETA |
|---------|--------|--------|----------|-----|
| Document Management | High | Medium | 🔴 1 | Week 1 |
| Prior Year Carryforward | High | Low | 🔴 2 | Week 1 |
| Industry Templates | Medium | Medium | 🟡 3 | Week 2 |
| Multi-Year Reports | Medium | Low | 🟡 4 | Week 2 |
| Payroll Integration | High | High | 🟡 5 | Week 3 |

## Code Examples

### Document Upload Service

```typescript
// backend/src/services/document.service.ts
export class DocumentService {
  async uploadDocument(
    engagementId: string,
    projectId: string | null,
    file: Express.Multer.File,
    category: DocumentCategory,
    userId: string
  ) {
    // 1. Upload to ShareFile
    const shareFileFile = await this.shareFileService.uploadFile(
      accessToken,
      folderId,
      file.originalname,
      file.buffer
    );

    // 2. Create database record
    const document = await prisma.document.create({
      data: {
        engagementId,
        projectId,
        fileName: file.originalname,
        fileSize: file.size,
        fileType: file.mimetype,
        category,
        shareFileId: shareFileFile.Id,
        shareFileUrl: shareFileFile.url,
        uploadedById: userId,
      },
    });

    // 3. Log audit
    await this.auditService.log({
      userId,
      action: 'UPLOAD_DOCUMENT',
      entityType: 'Document',
      entityId: document.id,
    });

    return document;
  }
}
```

### Prior Year Carryforward

```typescript
// backend/src/services/engagement.service.ts
export class EngagementService {
  async createFromPriorYear(priorEngagementId: string, newYear: number) {
    const priorEngagement = await prisma.engagement.findUnique({
      where: { id: priorEngagementId },
      include: {
        projects: true,
        wages: true,
      },
    });

    // Create new engagement
    const newEngagement = await prisma.engagement.create({
      data: {
        ...pick(priorEngagement, [
          'taxpayerName',
          'taxpayerEIN',
          'taxpayerAddress',
          'selectedStates',
          'industry',
        ]),
        taxYear: newYear,
        priorYearEngagementId: priorEngagementId,
        createdById: userId,
      },
    });

    // Copy projects (structure only)
    for (const priorProject of priorEngagement.projects) {
      await prisma.project.create({
        data: {
          engagementId: newEngagement.id,
          name: priorProject.name,
          description: '', // Clear for new year
          businessComponent: priorProject.businessComponent,
          technologiesUsed: priorProject.technologiesUsed,
          permittedPurpose: {},
          eliminationUncertainty: {},
          processExperimentation: {},
          technologicalNature: {},
          createdById: userId,
        },
      });
    }

    // Copy employee list (zero out wages)
    for (const priorWage of priorEngagement.wages) {
      await prisma.wage.create({
        data: {
          engagementId: newEngagement.id,
          employeeName: priorWage.employeeName,
          annualSalary: priorWage.annualSalary,
          percentTime: 0,
          qualifiedWages: 0,
        },
      });
    }

    return newEngagement;
  }
}
```

### Industry Template Usage

```typescript
// backend/src/services/industry-template.service.ts
export class IndustryTemplateService {
  async getTemplate(industry: string) {
    return prisma.industryTemplate.findUnique({
      where: { industry },
    });
  }

  async createProjectFromTemplate(
    engagementId: string,
    templateId: string,
    userId: string
  ) {
    const template = await this.getTemplate(templateId);
    const projectTemplate = template.projectTemplates[0]; // First template

    return prisma.project.create({
      data: {
        engagementId,
        name: projectTemplate.name,
        description: projectTemplate.description,
        businessComponent: projectTemplate.businessComponent,
        technologiesUsed: projectTemplate.technologies,
        industryCategory: template.industry,
        templateUsed: templateId,
        permittedPurpose: projectTemplate.permittedPurpose,
        eliminationUncertainty: projectTemplate.eliminationUncertainty,
        processExperimentation: projectTemplate.processExperimentation,
        technologicalNature: projectTemplate.technologicalNature,
        createdById: userId,
      },
    });
  }
}
```

## Testing Strategy

### Unit Tests
```typescript
describe('Document Service', () => {
  it('should upload document to ShareFile', async () => {
    const file = createMockFile();
    const document = await documentService.uploadDocument(
      engagementId,
      null,
      file,
      'PAYROLL_RECORDS',
      userId
    );

    expect(document).toBeDefined();
    expect(document.shareFileId).toBeTruthy();
  });
});

describe('Prior Year Carryforward', () => {
  it('should copy engagement structure', async () => {
    const newEngagement = await engagementService.createFromPriorYear(
      priorId,
      2025
    );

    expect(newEngagement.taxYear).toBe(2025);
    expect(newEngagement.priorYearEngagementId).toBe(priorId);
  });
});
```

## User Documentation

### How to Upload Documents

1. Navigate to engagement detail page
2. Click "Documents" tab
3. Drag and drop files or click "Upload"
4. Select document category
5. Add optional description and tags
6. Click "Save"

### How to Create Next Year Engagement

1. Open current year engagement
2. Click "Actions" → "Create Next Year"
3. Review copied data
4. Update year-specific information
5. Begin entering current year data

### How to Use Industry Templates

1. Create new engagement
2. Select industry from dropdown
3. Click "Use Template" on project creation
4. Choose pre-built project template
5. Customize for specific situation
6. Save project

## Deployment Notes

### Database Migrations

```bash
# Generate migration for new tables
npx prisma migrate dev --name add_documents_and_templates

# Deploy to production
npx prisma migrate deploy
```

### Environment Variables

```env
# Document upload limits
MAX_DOCUMENT_SIZE=10485760  # 10MB
ALLOWED_FILE_TYPES=pdf,docx,xlsx,png,jpg

# Payroll integration
QUICKBOOKS_CLIENT_ID=...
QUICKBOOKS_CLIENT_SECRET=...
ADP_API_KEY=...
GUSTO_CLIENT_ID=...
```

## Performance Optimization

### File Upload
- Use multipart upload for large files (>5MB)
- Implement upload progress tracking
- Add virus scanning for uploaded files

### Prior Year Data
- Index on `priorYearEngagementId` for fast lookups
- Cache frequently accessed prior year data
- Lazy load projects and QREs

### Industry Templates
- Cache templates in Redis
- Pre-load common templates on app startup
- Compress JSON template data

## Security Considerations

### Document Upload
- Validate file types and sizes
- Scan for malware
- Restrict access by role
- Encrypt files at rest in ShareFile

### Payroll Integration
- Encrypt credentials using AES-256
- Use OAuth where possible
- Revoke tokens on disconnect
- Audit all payroll data access

## Future Enhancements

1. **Bulk Document Upload** - Upload multiple files at once
2. **Document OCR** - Extract data from uploaded documents
3. **Smart Template Matching** - AI suggests best template
4. **Automated Carryforward** - Auto-create next year in January
5. **Real-Time Collaboration** - Multiple users edit simultaneously

---

**Status**: Phase 2 features ready for implementation
**Last Updated**: 2025-01-21
**Next Review**: Week 2 Sprint Planning
