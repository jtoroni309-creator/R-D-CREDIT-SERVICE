# API Reference - R&D Tax Credit Application

Complete API documentation for the R&D Tax Credit Application backend.

**Base URL**: `http://localhost:3000/api` (development)
**Authentication**: Bearer JWT Token
**Content-Type**: `application/json`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Engagements](#engagements)
3. [Projects](#projects)
4. [QRE Management](#qre-management)
5. [Calculations](#calculations)
6. [Prior Year](#prior-year)
7. [Documents](#documents)
8. [Reports](#reports)
9. [LLM Assistance](#llm-assistance)
10. [Error Handling](#error-handling)

---

## Authentication

### POST /api/auth/sharefile/login
Initiate ShareFile OAuth login flow.

**Response**:
```json
{
  "authUrl": "https://your-subdomain.sharefile.com/oauth/authorize?..."
}
```

### GET /api/auth/sharefile/callback
Handle ShareFile OAuth callback.

**Query Parameters**:
- `code` (string, required): OAuth authorization code

**Response**:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "STAFF"
  },
  "tokens": {
    "accessToken": "jwt-token",
    "refreshToken": "jwt-refresh-token"
  }
}
```

### POST /api/auth/refresh
Refresh access token.

**Request Body**:
```json
{
  "refreshToken": "jwt-refresh-token"
}
```

**Response**:
```json
{
  "accessToken": "new-jwt-token",
  "refreshToken": "new-refresh-token"
}
```

### GET /api/auth/me
Get current user information.

**Headers**:
- `Authorization: Bearer {access_token}`

**Response**:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "STAFF"
  }
}
```

---

## Engagements

### GET /api/engagements
List all engagements.

**Headers**:
- `Authorization: Bearer {access_token}`

**Query Parameters**:
- `status` (string, optional): Filter by status (DRAFT, IN_PROGRESS, REVIEW, APPROVED, COMPLETED)
- `taxYear` (number, optional): Filter by tax year
- `search` (string, optional): Search in taxpayer name or EIN
- `page` (number, optional, default: 1): Page number
- `limit` (number, optional, default: 20): Items per page

**Response**:
```json
{
  "engagements": [
    {
      "id": "uuid",
      "taxpayerName": "Acme Corp",
      "taxpayerEIN": "12-3456789",
      "taxYear": 2024,
      "status": "IN_PROGRESS",
      "selectedStates": ["CA", "NY"],
      "projects": [
        {
          "id": "uuid",
          "name": "Project Alpha"
        }
      ],
      "calculations": [
        {
          "totalQRE": "500000.00",
          "regularCreditAmount": "75000.00"
        }
      ]
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

### POST /api/engagements
Create new engagement.

**Headers**:
- `Authorization: Bearer {access_token}`

**Request Body**:
```json
{
  "taxpayerName": "Acme Corp",
  "taxpayerEIN": "12-3456789",
  "taxpayerAddress": "123 Main St, City, ST 12345",
  "taxYear": 2024,
  "selectedStates": ["CA", "NY"],
  "shareFileFolderId": "optional-folder-id"
}
```

**Response**: `201 Created`
```json
{
  "id": "uuid",
  "taxpayerName": "Acme Corp",
  "taxpayerEIN": "12-3456789",
  "taxpayerAddress": "123 Main St, City, ST 12345",
  "taxYear": 2024,
  "status": "DRAFT",
  "selectedStates": ["CA", "NY"],
  "shareFileFolderId": "folder-id",
  "createdAt": "2024-01-21T10:00:00Z"
}
```

### GET /api/engagements/:id
Get engagement details.

**Headers**:
- `Authorization: Bearer {access_token}`

**Response**:
```json
{
  "id": "uuid",
  "taxpayerName": "Acme Corp",
  "taxpayerEIN": "12-3456789",
  "taxYear": 2024,
  "status": "IN_PROGRESS",
  "projects": [...],
  "wages": [...],
  "supplies": [...],
  "contracts": [...],
  "calculations": [...],
  "reports": [...]
}
```

### PUT /api/engagements/:id
Update engagement.

**Headers**:
- `Authorization: Bearer {access_token}`

**Request Body**: (all fields optional)
```json
{
  "taxpayerName": "Acme Corporation",
  "taxpayerAddress": "456 New St, City, ST 12345",
  "selectedStates": ["CA", "NY", "TX"]
}
```

**Response**: Updated engagement object

### DELETE /api/engagements/:id
Delete engagement.

**Headers**:
- `Authorization: Bearer {access_token}`

**Response**: `204 No Content`

### GET /api/engagements/:id/summary
Get engagement summary statistics.

**Response**:
```json
{
  "taxpayerName": "Acme Corp",
  "taxYear": 2024,
  "status": "IN_PROGRESS",
  "projectCount": 5,
  "totalWages": "300000.00",
  "totalSupplies": "150000.00",
  "totalContracts": "50000.00",
  "totalQRE": "500000.00",
  "latestCalculation": {
    "regularCreditAmount": "75000.00",
    "ascCreditAmount": "52500.00"
  }
}
```

---

## Projects

### GET /api/projects/engagement/:engagementId
List projects for engagement.

**Response**:
```json
[
  {
    "id": "uuid",
    "name": "Algorithm Development",
    "description": "Development of new ML algorithm",
    "businessComponent": "Proprietary ML algorithm",
    "technologiesUsed": ["Python", "TensorFlow"],
    "isValidated": false,
    "narrativeApproved": false
  }
]
```

### POST /api/projects/engagement/:engagementId
Create project.

**Request Body**:
```json
{
  "name": "Algorithm Development",
  "description": "Development of new ML algorithm",
  "businessComponent": "Proprietary ML algorithm",
  "technologiesUsed": ["Python", "TensorFlow"],
  "permittedPurpose": {
    "question1": "Answer to question 1",
    "question2": "Answer to question 2"
  },
  "eliminationUncertainty": {},
  "processExperimentation": {},
  "technologicalNature": {}
}
```

**Response**: `201 Created` with project object

### GET /api/projects/:id
Get project details.

**Response**: Complete project object including 4-part test responses

### PUT /api/projects/:id
Update project.

**Request Body**: (all fields optional)
```json
{
  "name": "Updated Project Name",
  "description": "Updated description",
  "narrativeImproved": "AI-improved narrative text",
  "narrativeApproved": true
}
```

### POST /api/projects/:id/validate-4part
Validate 4-part test completion.

**Response**:
```json
{
  "isValid": true,
  "issues": []
}
```

Or if invalid:
```json
{
  "isValid": false,
  "issues": [
    "permittedPurpose: 1 answer(s) too brief (< 100 characters)",
    "processExperimentation: Missing responses"
  ]
}
```

---

## QRE Management

### Wages

#### GET /api/qre/engagement/:engagementId/wages
List wages for engagement.

**Response**:
```json
[
  {
    "id": "uuid",
    "employeeName": "John Doe",
    "annualSalary": "100000.00",
    "percentTime": "50.00",
    "qualifiedWages": "50000.00",
    "project": {
      "id": "uuid",
      "name": "Project Alpha"
    }
  }
]
```

#### POST /api/qre/engagement/:engagementId/wages
Add wage entry.

**Request Body**:
```json
{
  "projectId": "uuid-optional",
  "employeeName": "John Doe",
  "annualSalary": 100000,
  "percentTime": 50,
  "qualifiedWages": 50000,
  "notes": "Optional notes"
}
```

#### PUT /api/qre/wages/:id
Update wage entry.

#### DELETE /api/qre/wages/:id
Delete wage entry.

### Supplies

#### GET /api/qre/engagement/:engagementId/supplies
List supplies.

#### POST /api/qre/engagement/:engagementId/supplies
Add supply.

**Request Body**:
```json
{
  "projectId": "uuid-optional",
  "description": "Laboratory equipment",
  "totalCost": 50000,
  "qualifiedAmount": 50000,
  "justification": "Used exclusively for R&D"
}
```

### Contract Research

#### GET /api/qre/engagement/:engagementId/contracts
List contracts.

#### POST /api/qre/engagement/:engagementId/contracts
Add contract.

**Request Body**:
```json
{
  "projectId": "uuid-optional",
  "vendorName": "Research Lab Inc",
  "contractAmount": 100000,
  "qualifiedPercent": 65,
  "qualifiedAmount": 65000,
  "description": "External research services"
}
```

---

## Calculations

### POST /api/calculations/engagement/:engagementId/calculate
Run credit calculations.

**Response**:
```json
{
  "totalWages": "300000.00",
  "totalSupplies": "150000.00",
  "totalContracts": "50000.00",
  "totalQRE": "500000.00",
  "regularCredit": {
    "baseAmount": "250000.00",
    "excessQRE": "250000.00",
    "creditAmount": "50000.00"
  },
  "ascCredit": {
    "baseAmount": "200000.00",
    "excessQRE": "300000.00",
    "creditAmount": "42000.00"
  },
  "stateCredits": [
    {
      "stateCode": "CA",
      "stateName": "California",
      "creditRate": 0.15,
      "baseAmount": "200000.00",
      "creditAmount": "45000.00"
    }
  ],
  "projectAllocations": {
    "project-uuid-1": {
      "projectName": "Project Alpha",
      "wages": "100000.00",
      "supplies": "50000.00",
      "contracts": "25000.00",
      "total": "175000.00"
    }
  }
}
```

### GET /api/calculations/engagement/:engagementId/latest
Get latest calculation results.

---

## Prior Year

### GET /api/prior-year/prior-years
Get prior year engagements.

**Query Parameters**:
- `ein` (string, required): Taxpayer EIN
- `year` (number, required): Current year

**Response**:
```json
[
  {
    "id": "uuid",
    "taxpayerName": "Acme Corp",
    "taxYear": 2023,
    "status": "COMPLETED",
    "projects": [...],
    "calculations": [...]
  }
]
```

### POST /api/prior-year/create-from-prior
Create new engagement from prior year.

**Request Body**:
```json
{
  "priorEngagementId": "uuid",
  "newYear": 2025
}
```

**Response**: `201 Created` with new engagement object

### POST /api/prior-year/copy-data
Selectively copy data from prior year.

**Request Body**:
```json
{
  "sourceEngagementId": "uuid",
  "targetEngagementId": "uuid",
  "options": {
    "copyProjects": true,
    "copyEmployees": true,
    "copySuppliers": false,
    "copyContractors": true
  }
}
```

**Response**:
```json
{
  "success": true,
  "copiedCount": 15,
  "message": "Successfully copied 15 items"
}
```

### GET /api/prior-year/comparison/:ein
Get year-over-year comparison.

**Query Parameters**:
- `years` (string, required): Comma-separated years (e.g., "2022,2023,2024")

**Response**:
```json
{
  "taxpayerEIN": "12-3456789",
  "years": [2022, 2023, 2024],
  "comparison": [
    {
      "year": 2024,
      "status": "COMPLETED",
      "projectCount": 5,
      "totalQRE": 500000,
      "regularCredit": 75000,
      "ascCredit": 52500
    }
  ],
  "trends": {
    "qreGrowth": "11.1%",
    "creditGrowth": "11.1%",
    "avgQRE": "475000.00",
    "totalYears": 3
  }
}
```

---

## Documents

### POST /api/documents/upload
Upload document.

**Headers**:
- `Content-Type: multipart/form-data`
- `Authorization: Bearer {access_token}`

**Form Data**:
- `file` (file, required): Document file
- `engagementId` (string, required)
- `projectId` (string, optional)
- `category` (string, required): PAYROLL_RECORDS, TIMESHEETS, INVOICES, CONTRACTS, TECHNICAL_DOCS, MEETING_NOTES, TEST_RESULTS, DESIGN_DOCS, OTHER
- `description` (string, optional)
- `tags` (JSON array, optional)

**Response**: `201 Created`
```json
{
  "id": "uuid",
  "fileName": "payroll_2024_q1.pdf",
  "fileSize": 1024000,
  "fileType": "application/pdf",
  "category": "PAYROLL_RECORDS",
  "shareFileId": "sf-file-id",
  "shareFileUrl": "https://...",
  "uploadedAt": "2024-01-21T10:00:00Z"
}
```

### GET /api/documents/engagement/:engagementId
List documents for engagement.

**Query Parameters**:
- `projectId` (string, optional)
- `category` (string, optional)
- `search` (string, optional)

### DELETE /api/documents/:id
Delete document.

**Response**: `200 OK`
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

---

## Reports

### POST /api/reports/engagement/:id/generate-pdf
Generate PDF R&D study report.

**Request Body** (optional):
```json
{
  "includeDetailedQRE": true,
  "includeProjectNarratives": true,
  "include4PartTest": true
}
```

**Response**: PDF file download

### POST /api/reports/engagement/:id/form6765/json
Export Form 6765 data as JSON.

**Response**: JSON file download

### POST /api/reports/engagement/:id/form6765/csv
Export Form 6765 data as CSV.

**Response**: CSV file download

### POST /api/reports/engagement/:id/form6765/excel
Export Form 6765 data as Excel.

**Response**: Excel file download

---

## LLM Assistance

### POST /api/llm/improve-narrative
Improve project narrative.

**Request Body**:
```json
{
  "text": "Original narrative text..."
}
```

**Response**:
```json
{
  "original": "Original text...",
  "improved": "Improved text...",
  "disclaimer": "⚠️ AI-Generated Content: This text was created with AI assistance..."
}
```

### POST /api/llm/expand-technical
Expand technical details.

**Request Body**:
```json
{
  "text": "Brief technical description..."
}
```

**Response**:
```json
{
  "expanded": "Detailed technical description..."
}
```

### POST /api/llm/suggest-missing
Identify missing information.

**Request Body**:
```json
{
  "projectData": {
    "name": "Project Name",
    "description": "...",
    "permittedPurpose": {...}
  }
}
```

**Response**:
```json
{
  "questions": [
    "1. What specific technical challenge did you face?",
    "2. What alternatives did you evaluate?"
  ],
  "recommendations": [
    "Ensure all 4-part test questions have substantive answers",
    "Include specific technical details about methods"
  ]
}
```

---

## Error Handling

All API errors return JSON with the following structure:

```json
{
  "status": "error",
  "message": "Error description"
}
```

### HTTP Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `204 No Content`: Resource deleted successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

### Common Error Messages

**Authentication Errors**:
```json
{
  "status": "error",
  "message": "No token provided"
}
```

**Validation Errors**:
```json
{
  "status": "error",
  "message": "Validation failed: [{\"path\":\"taxpayerEIN\",\"message\":\"EIN is required\"}]"
}
```

**Not Found Errors**:
```json
{
  "status": "error",
  "message": "Engagement not found"
}
```

---

## Rate Limiting

API requests are limited to 100 requests per 15 minutes per IP address.

When rate limit is exceeded:
```json
{
  "status": "error",
  "message": "Too many requests, please try again later"
}
```

---

## Pagination

List endpoints support pagination with the following query parameters:

- `page` (number, default: 1): Page number
- `limit` (number, default: 20, max: 100): Items per page

Response includes pagination metadata:
```json
{
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

---

## Example Usage

### Complete Workflow Example

```javascript
// 1. Login
const authResponse = await fetch('/api/auth/sharefile/login');
const { authUrl } = await authResponse.json();
// Redirect user to authUrl, then handle callback

// 2. Create engagement
const engagement = await fetch('/api/engagements', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + accessToken,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    taxpayerName: 'Acme Corp',
    taxpayerEIN: '12-3456789',
    taxpayerAddress: '123 Main St',
    taxYear: 2024,
    selectedStates: ['CA']
  })
});

// 3. Add project
const project = await fetch(`/api/projects/engagement/${engagementId}`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + accessToken,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Algorithm Development',
    description: '...',
    businessComponent: '...',
    permittedPurpose: {...},
    // ... other fields
  })
});

// 4. Add QREs
const wage = await fetch(`/api/qre/engagement/${engagementId}/wages`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + accessToken,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    projectId: projectId,
    employeeName: 'John Doe',
    annualSalary: 100000,
    percentTime: 50,
    qualifiedWages: 50000
  })
});

// 5. Calculate credits
const calculation = await fetch(`/api/calculations/engagement/${engagementId}/calculate`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + accessToken
  }
});

// 6. Generate reports
const pdf = await fetch(`/api/reports/engagement/${engagementId}/generate-pdf`, {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + accessToken
  }
});
const pdfBlob = await pdf.blob();
// Download PDF
```

---

## Postman Collection

Import the Postman collection for easy API testing:

[Download Postman Collection](./postman_collection.json) (coming soon)

---

## Support

For API support:
- GitHub Issues: https://github.com/jtoroni309-creator/R-D-CREDIT-SERVICE/issues
- Email: api-support@example.com
- Documentation: https://docs.example.com

---

**Last Updated**: 2025-01-21
**API Version**: 1.0.0
