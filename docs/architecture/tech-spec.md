# Technical Specification

## Document Info

| Field | Value |
|-------|-------|
| **Feature/Project** | DORA Compliance Platform (DCP) - Full Architecture |
| **Author** | Project Orchestrator |
| **Reviewers** | Engineering Lead, Security, Compliance |
| **Last Updated** | 2024-12-28 |
| **Status** | Draft |
| **Related PRD** | [PRD](../planning/prd.md) |

---

## Context

### Background

EU financial institutions face a January 17, 2026 deadline for DORA (Digital Operational Resilience Act) compliance, with the first Register of Information (RoI) submission due April 30, 2026. Current TPRM tools are US-centric, require months of implementation, and rely on slow questionnaire-based assessments.

We're building an AI-powered TPRM platform that:
1. Eliminates questionnaires by parsing existing compliance documents (SOC 2, ISO 27001)
2. Auto-generates the mandatory Register of Information in ESA-compliant format
3. Provides real-time vendor risk visibility with EU data residency

### Current State

This is a greenfield project. The existing `/compliance-app` repository has:
- Next.js 16 with App Router and TypeScript
- Tailwind CSS v4 and shadcn/ui components
- Supabase configuration for US/EU multi-region
- Vercel deployment configuration with US/EU edge

---

## Goals & Non-Goals

### Goals

- [ ] **G1:** Deploy MVP with AI document parsing within 8 weeks
- [ ] **G2:** Parse SOC 2 reports with >90% extraction accuracy in <60 seconds
- [ ] **G3:** Generate ESA-compliant RoI export (xBRL-CSV) with validation
- [ ] **G4:** Ensure EU customer data never leaves EU infrastructure
- [ ] **G5:** Support 100+ concurrent users with <2s page loads
- [ ] **G6:** Achieve SOC 2 Type II attestation within 12 months

### Non-Goals

- **NG1:** Native mobile applications (web-only for MVP)
- **NG2:** Real-time collaborative editing (single-user workflows first)
- **NG3:** Custom AI model training (use off-the-shelf LLMs initially)
- **NG4:** Integration with all security rating providers (select 1-2 for MVP)
- **NG5:** Full NIS2 compliance (DORA-first, NIS2 future)

---

## Proposed Solution

### High-Level Architecture

```
                                 ┌─────────────────────────────────────┐
                                 │           GLOBAL LAYER              │
                                 ├─────────────────────────────────────┤
                                 │  CDN (Vercel Edge Network)          │
                                 │  - Static asset caching             │
                                 │  - Edge middleware (auth, routing)  │
                                 │  - Geographic request routing       │
                                 └──────────────┬──────────────────────┘
                                                │
                        ┌───────────────────────┼───────────────────────┐
                        │                       │                       │
                        ▼                       ▼                       ▼
           ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐
           │   US REGION (iad1) │  │  EU REGION (fra1)  │  │  AI PROCESSING     │
           ├────────────────────┤  ├────────────────────┤  ├────────────────────┤
           │  Vercel Functions  │  │  Vercel Functions  │  │  Vercel Functions  │
           │  - API Routes      │  │  - API Routes      │  │  - Background Jobs │
           │  - Server Actions  │  │  - Server Actions  │  │  - Queue Workers   │
           └─────────┬──────────┘  └─────────┬──────────┘  └─────────┬──────────┘
                     │                       │                       │
                     ▼                       ▼                       │
           ┌────────────────────┐  ┌────────────────────┐            │
           │   SUPABASE US      │  │   SUPABASE EU      │            │
           │   (aws-us-east-1)  │  │   (aws-eu-central) │            │
           ├────────────────────┤  ├────────────────────┤            │
           │  PostgreSQL        │  │  PostgreSQL        │            │
           │  Auth (GoTrue)     │  │  Auth (GoTrue)     │            │
           │  Storage (S3)      │  │  Storage (S3)      │            │
           │  Realtime          │  │  Realtime          │            │
           └────────────────────┘  └────────────────────┘            │
                                                                     │
                        ┌────────────────────────────────────────────┘
                        │
                        ▼
           ┌────────────────────────────────────────────────────────┐
           │                   EXTERNAL SERVICES                     │
           ├────────────────────────────────────────────────────────┤
           │  Anthropic Claude API   - Document parsing, reasoning   │
           │  OpenAI GPT-4 Vision    - OCR, complex tables          │
           │  GLEIF API              - LEI validation               │
           │  SendGrid               - Transactional email          │
           │  SecurityScorecard*     - Security ratings (future)    │
           └────────────────────────────────────────────────────────┘
```

### Multi-Region Data Flow

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         USER REQUEST FLOW                                 │
└──────────────────────────────────────────────────────────────────────────┘

User (Germany) ─────────────────────────────────────────────────────────────►
        │
        │  1. DNS Resolution (Vercel)
        ▼
┌─────────────────┐
│  Edge Network   │  2. Determine region from:
│  (fra1)         │     - User preference cookie
│                 │     - Organization setting
│                 │     - IP geolocation (fallback)
└────────┬────────┘
         │
         │  3. Route to appropriate region
         ▼
┌─────────────────┐
│  EU API Route   │  4. Process request
│  (fra1)         │     - Validate auth (Supabase EU)
│                 │     - Query data (PostgreSQL EU)
└────────┬────────┘     - Store files (S3 EU)
         │
         │  5. If AI processing needed:
         ▼
┌─────────────────┐
│  AI Processing  │  6. Call Anthropic Claude API
│  (Background)   │     - Data minimization
│                 │     - No persistent storage at AI provider
└────────┬────────┘
         │
         │  7. Results stored in EU
         ▼
┌─────────────────┐
│  Supabase EU    │  8. Data persisted in EU region only
│  (eu-central)   │
└─────────────────┘
```

### Components

#### Component 1: Next.js Application (Frontend + API)

**Purpose:** Single deployable unit containing UI, API routes, and server actions

**Responsibilities:**
- Render React UI components with shadcn/ui
- Handle authentication flows via Supabase Auth
- Expose REST API endpoints for CRUD operations
- Manage server-side rendering for SEO/performance
- Execute server actions for mutations

**Technology Stack:**
- Next.js 16 (App Router)
- React 19 with Server Components
- TypeScript 5.x
- Tailwind CSS v4
- shadcn/ui components

**Directory Structure:**
```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Dashboard home
│   │   ├── vendors/
│   │   │   ├── page.tsx          # Vendor list
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx      # Vendor detail
│   │   │   │   └── documents/
│   │   │   └── new/
│   │   ├── documents/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   ├── roi/
│   │   │   ├── page.tsx          # RoI dashboard
│   │   │   └── export/
│   │   ├── risk/
│   │   └── settings/
│   ├── api/
│   │   ├── vendors/
│   │   ├── documents/
│   │   ├── parse/
│   │   ├── roi/
│   │   └── webhooks/
│   └── layout.tsx
├── components/
│   ├── ui/                       # shadcn components
│   ├── vendors/
│   ├── documents/
│   ├── roi/
│   ├── risk/
│   └── shared/
├── lib/
│   ├── supabase/                 # Multi-region config
│   ├── ai/                       # AI parsing logic
│   ├── roi/                      # RoI generation
│   ├── validators/               # Zod schemas
│   └── utils/
├── hooks/
├── types/
└── middleware.ts
```

#### Component 2: Supabase Backend (Multi-Region)

**Purpose:** Provide database, authentication, storage, and realtime subscriptions

**Responsibilities:**
- PostgreSQL database with Row-Level Security (RLS)
- User authentication (email, SSO future)
- File storage for uploaded documents
- Realtime subscriptions for collaborative features
- Edge functions for serverless compute

**Database Schema (Core Tables):**

```sql
-- Organizations (tenants)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  lei TEXT,
  entity_type TEXT NOT NULL,
  data_region TEXT NOT NULL CHECK (data_region IN ('us', 'eu')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users with organization membership
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id),
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendors
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  lei TEXT,
  tier TEXT NOT NULL CHECK (tier IN ('critical', 'important', 'standard')),
  status TEXT NOT NULL DEFAULT 'active',
  risk_score INTEGER,
  last_assessment_date TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents (uploaded files)
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  type TEXT NOT NULL,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  parsing_status TEXT DEFAULT 'pending',
  parsed_at TIMESTAMPTZ,
  parsing_confidence FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parsed SOC 2 data
CREATE TABLE parsed_soc2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id),
  report_type TEXT NOT NULL,
  audit_firm TEXT,
  opinion TEXT,
  period_start DATE,
  period_end DATE,
  criteria TEXT[],
  system_description TEXT,
  controls JSONB DEFAULT '[]',
  exceptions JSONB DEFAULT '[]',
  subservice_orgs JSONB DEFAULT '[]',
  cuecs JSONB DEFAULT '[]',
  raw_extraction JSONB,
  confidence_scores JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Register of Information entries
CREATE TABLE roi_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  contract_id TEXT,
  -- ESA-required fields
  entity_lei TEXT NOT NULL,
  provider_lei TEXT,
  provider_name TEXT NOT NULL,
  service_description TEXT,
  contract_start_date DATE,
  contract_end_date DATE,
  data_locations TEXT[],
  supports_critical_function BOOLEAN DEFAULT FALSE,
  critical_functions TEXT[],
  personal_data_processed BOOLEAN DEFAULT FALSE,
  data_categories TEXT[],
  availability_sla FLOAT,
  rto_hours INTEGER,
  rpo_hours INTEGER,
  -- Metadata
  validation_status TEXT DEFAULT 'pending',
  validation_errors JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Risk scores (historical)
CREATE TABLE risk_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  score INTEGER NOT NULL,
  breakdown JSONB NOT NULL,
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only see their org's vendors"
  ON vendors FOR ALL
  USING (organization_id = (
    SELECT organization_id FROM users WHERE id = auth.uid()
  ));

-- Repeat for all tenant-scoped tables
```

#### Component 3: AI Parsing Engine

**Purpose:** Extract structured data from compliance documents using LLMs

**Responsibilities:**
- PDF text extraction and preprocessing
- LLM prompt construction for document types
- Structured data extraction with confidence scoring
- DORA control mapping
- Error handling and fallback strategies

**Architecture:**

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AI PARSING PIPELINE                          │
└─────────────────────────────────────────────────────────────────────┘

   Document Upload
        │
        ▼
┌───────────────────┐
│  1. PREPROCESSING │
│  - PDF extraction │
│  - OCR if needed  │
│  - Page chunking  │
│  - Table detection│
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  2. CLASSIFICATION│
│  - Document type  │
│  - Structure ID   │
│  - Quality check  │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  3. EXTRACTION    │
│  - Type-specific  │
│    prompts        │
│  - Multi-pass for │
│    complex docs   │
│  - Confidence     │
│    scoring        │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  4. VALIDATION    │
│  - Schema check   │
│  - Cross-field    │
│  - Business rules │
└────────┬──────────┘
         │
         ▼
┌───────────────────┐
│  5. MAPPING       │
│  - DORA articles  │
│  - Risk scoring   │
│  - RoI population │
└───────────────────┘
```

**SOC 2 Parsing Prompt Structure:**

```typescript
const soc2ExtractionPrompt = `
You are an expert auditor analyzing a SOC 2 Type II report.
Extract the following information with high precision:

1. REPORT METADATA
   - Report type (Type I or Type II)
   - Audit firm name
   - Opinion type (unqualified, qualified, adverse)
   - Observation period (start and end dates)
   - Trust Services Criteria included

2. SYSTEM DESCRIPTION
   - Services provided
   - System boundaries
   - Infrastructure components
   - Key processes

3. CONTROL ACTIVITIES
   For each control, extract:
   - Control ID/reference
   - Control objective
   - Control description
   - Test procedure performed
   - Test result (no exceptions / exception noted)
   - If exception: description of exception

4. EXCEPTIONS
   For each exception:
   - Control reference
   - Exception description
   - Management response
   - Remediation status

5. SUBSERVICE ORGANIZATIONS
   For each subservice org:
   - Organization name
   - Services provided
   - Inclusion method (inclusive / carve-out)
   - Monitoring approach

6. COMPLEMENTARY USER ENTITY CONTROLS (CUECs)
   List all CUECs with descriptions.

Return as structured JSON with confidence scores (0-1) for each field.
`;
```

#### Component 4: RoI Generation Engine

**Purpose:** Generate ESA-compliant Register of Information exports

**Responsibilities:**
- Aggregate vendor data into RoI structure
- Validate against ESA ITS requirements
- Generate xBRL-CSV format
- Provide data quality scoring
- Track submission history

**RoI Template Mapping:**

```typescript
interface ESATemplateMapping {
  // Template B_01: Register of Information - Entity Level
  B_01: {
    entityLEI: string;
    entityName: string;
    entityType: DORAEntityType;
    reportingDate: Date;
    // ... additional fields per ESA ITS
  };

  // Template B_02: ICT Third-Party Service Providers
  B_02: {
    providerLEI: string;
    providerName: string;
    providerJurisdiction: string;
    // ... additional fields
  };

  // Template B_03: Contractual Arrangements
  B_03: {
    contractRef: string;
    entityLEI: string;
    providerLEI: string;
    serviceDescription: string;
    startDate: Date;
    endDate: Date;
    // ... additional fields
  };

  // Template B_04: ICT Services
  B_04: {
    serviceType: string;
    supportsCriticalFunction: boolean;
    criticalFunctions: string[];
    // ... additional fields
  };
}
```

### Data Model

**Entity Relationship Diagram:**

```
                      ┌─────────────────┐
                      │  Organization   │
                      │─────────────────│
                      │ id              │
                      │ name            │
                      │ lei             │
                      │ data_region     │
                      └────────┬────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
     ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
     │    User      │  │   Vendor     │  │  ROI_Export  │
     │──────────────│  │──────────────│  │──────────────│
     │ id           │  │ id           │  │ id           │
     │ org_id       │  │ org_id       │  │ org_id       │
     │ email        │  │ name         │  │ export_date  │
     │ role         │  │ tier         │  │ format       │
     └──────────────┘  │ risk_score   │  │ file_path    │
                       └──────┬───────┘  └──────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
     ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
     │  Document    │  │  ROI_Entry   │  │  Risk_Score  │
     │──────────────│  │──────────────│  │──────────────│
     │ id           │  │ id           │  │ id           │
     │ vendor_id    │  │ vendor_id    │  │ vendor_id    │
     │ type         │  │ entity_lei   │  │ score        │
     │ status       │  │ provider_lei │  │ breakdown    │
     └──────┬───────┘  └──────────────┘  │ calculated_at│
            │                            └──────────────┘
            │
            ▼
     ┌──────────────┐
     │ Parsed_SOC2  │
     │──────────────│
     │ document_id  │
     │ opinion      │
     │ controls     │
     │ exceptions   │
     └──────────────┘
```

### API Design

#### Authentication Endpoints

```http
# Login (via Supabase Auth)
POST /api/auth/login
Content-Type: application/json

Request:
{
  "email": "user@company.com",
  "password": "********"
}

Response (200 OK):
{
  "user": { "id": "uuid", "email": "...", "organization_id": "..." },
  "session": { "access_token": "...", "refresh_token": "...", "expires_at": "..." }
}
```

#### Vendor Endpoints

```http
# List vendors
GET /api/vendors?tier=critical&status=active&page=1&limit=20
Authorization: Bearer <token>

Response (200 OK):
{
  "vendors": [
    {
      "id": "uuid",
      "name": "AWS",
      "lei": "5493004...",
      "tier": "critical",
      "status": "active",
      "riskScore": 78,
      "lastAssessmentDate": "2024-12-15T00:00:00Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 156 }
}

# Create vendor
POST /api/vendors
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "name": "New Vendor Inc",
  "lei": "549300EXAMPLE123456",
  "tier": "important",
  "services": ["Cloud Hosting"],
  "jurisdiction": "US"
}

Response (201 Created):
{
  "id": "uuid",
  "name": "New Vendor Inc",
  ...
}
```

#### Document Parsing Endpoints

```http
# Upload document
POST /api/documents
Authorization: Bearer <token>
Content-Type: multipart/form-data

Request:
- file: <binary>
- vendorId: "uuid"
- type: "soc2"

Response (202 Accepted):
{
  "documentId": "uuid",
  "status": "processing",
  "estimatedTime": 60
}

# Get parsing status/results
GET /api/documents/{id}
Authorization: Bearer <token>

Response (200 OK):
{
  "id": "uuid",
  "status": "completed",
  "type": "soc2",
  "parsedAt": "2024-12-28T12:00:00Z",
  "confidence": 0.94,
  "data": {
    "reportType": "type2",
    "opinion": "unqualified",
    "auditFirm": "Deloitte",
    "periodStart": "2024-01-01",
    "periodEnd": "2024-12-31",
    "criteria": ["security", "availability"],
    "controls": [...],
    "exceptions": [...],
    "subserviceOrgs": [...],
    "cueCs": [...]
  },
  "doraMapping": {
    "pillar1Coverage": 0.85,
    "pillar2Coverage": 0.70,
    "gaps": [...]
  }
}
```

#### RoI Endpoints

```http
# Get RoI summary
GET /api/roi/summary
Authorization: Bearer <token>

Response (200 OK):
{
  "completeness": 0.87,
  "vendorsCovered": 142,
  "vendorsTotal": 163,
  "errors": 3,
  "warnings": 12,
  "lastUpdated": "2024-12-28T10:00:00Z"
}

# Validate RoI
POST /api/roi/validate
Authorization: Bearer <token>

Response (200 OK):
{
  "valid": false,
  "errors": [
    { "field": "vendors[12].lei", "message": "Invalid LEI format", "vendorId": "uuid" }
  ],
  "warnings": [
    { "field": "vendors[5].contractEndDate", "message": "Contract expires in 30 days", "vendorId": "uuid" }
  ]
}

# Export RoI
POST /api/roi/export
Authorization: Bearer <token>
Content-Type: application/json

Request:
{
  "format": "xbrl-csv",
  "templates": ["B_01", "B_02", "B_03", "B_04"]
}

Response (200 OK):
{
  "exportId": "uuid",
  "downloadUrl": "https://...",
  "expiresAt": "2024-12-29T00:00:00Z",
  "files": ["B_01.csv", "B_02.csv", "B_03.csv", "B_04.csv"]
}
```

---

## Security Considerations

### Authentication

| Method | Use Case | Implementation |
|--------|----------|----------------|
| Email/Password | Primary login | Supabase Auth (GoTrue) |
| MFA (TOTP) | Required for all users | Supabase Auth MFA |
| SSO (SAML) | Enterprise (future) | Supabase Auth SAML |
| API Keys | Service-to-service | Custom implementation |

### Authorization

**Role-Based Access Control (RBAC):**

| Role | Permissions |
|------|-------------|
| Owner | Full access, billing, user management |
| Admin | All features except billing |
| Member | Read/write vendors, documents, RoI |
| Viewer | Read-only access |

**Row-Level Security (RLS):**
- All tables have RLS enabled
- Policies ensure organization-level data isolation
- No cross-tenant data access possible at database level

### Data Protection

| Control | Implementation |
|---------|---------------|
| Encryption at Rest | Supabase PostgreSQL: AES-256 |
| Encryption in Transit | TLS 1.3 enforced |
| File Encryption | S3 SSE-S3 |
| API Security | HTTPS only, HSTS enabled |
| PII Handling | Minimization, access logging |

### Audit Logging

All security-relevant events logged:
- Authentication events (login, logout, MFA)
- Authorization failures
- Data exports
- Configuration changes
- Document uploads/deletions

---

## Compliance Considerations

### Data Residency

| Customer Region | Data Storage | Processing |
|-----------------|--------------|------------|
| EU | Supabase EU (Frankfurt) | Vercel EU (fra1) |
| US | Supabase US (Virginia) | Vercel US (iad1) |

**Hard Requirements:**
- EU customer data NEVER leaves EU region
- AI processing uses data minimization
- Anthropic Claude: No data retention (API terms)

### Audit Trail

| Event Type | Retention | Format |
|------------|-----------|--------|
| User actions | 7 years | Structured JSON |
| System events | 2 years | Structured logs |
| Data changes | 7 years | PostgreSQL audit table |
| Access logs | 1 year | Vercel logs |

### Retention Policy

| Data Type | Retention | Deletion Method |
|-----------|-----------|-----------------|
| Vendor records | While active + 7 years | Soft delete, then hard delete |
| Documents | 7 years from upload | Scheduled purge |
| Parsed data | 7 years | Cascade with document |
| User data | Account life + 90 days | Right to erasure |
| Logs | Per type above | Automated purge |

---

## Alternative Approaches Considered

### Option A: Microservices Architecture

**Description:** Separate services for API, AI parsing, RoI generation

**Pros:**
- Independent scaling of AI workloads
- Technology flexibility per service
- Fault isolation

**Cons:**
- Operational complexity
- Network latency between services
- Higher infrastructure cost
- Overkill for early stage

**Why not chosen:** Too complex for MVP. Can migrate to microservices later as scale demands.

### Option B: Self-Hosted AI Models

**Description:** Deploy open-source LLMs (Llama, Mistral) on our infrastructure

**Pros:**
- Data never leaves our infrastructure
- No per-API-call costs
- Full control over model

**Cons:**
- Significant GPU infrastructure cost
- Operational burden
- Lower accuracy than commercial models
- Slower iteration on prompts

**Why not chosen:** Commercial APIs (Claude, GPT-4) offer superior accuracy and faster iteration. Data minimization + API terms provide adequate privacy.

### Option C: Single-Region Architecture

**Description:** All customers on single region, EU-first

**Pros:**
- Simpler architecture
- Lower operational cost
- Faster development

**Cons:**
- Latency for US customers
- Limits US market expansion
- Some US customers may require US data residency

**Why not chosen:** Multi-region from start ensures we can serve both markets and comply with all data residency requirements.

---

## Implementation Plan

### Phase 1: Foundation (Weeks 1-4)

**Scope:**
- Database schema implementation
- Authentication and authorization
- Basic UI scaffolding
- Vendor CRUD operations
- File upload infrastructure

**Deliverables:**
- Working authentication flow
- Vendor inventory feature
- Document upload (no parsing)
- Basic dashboard

**Dependencies:**
- Supabase projects created (US + EU)
- Vercel project configured
- Domain setup

### Phase 2: AI Parsing (Weeks 5-8)

**Scope:**
- SOC 2 parsing pipeline
- Confidence scoring
- DORA control mapping
- Review workflow for low-confidence

**Deliverables:**
- End-to-end SOC 2 parsing
- Parsed data display
- Control gap visualization
- Manual correction interface

**Dependencies:**
- Phase 1 complete
- Anthropic API access
- Sample SOC 2 reports for testing

### Phase 3: RoI Generation (Weeks 9-12)

**Scope:**
- RoI data aggregation
- Validation engine
- xBRL-CSV export
- Data quality dashboard

**Deliverables:**
- RoI generation feature
- Export in ESA format
- Validation with actionable errors
- Submission preparation workflow

**Dependencies:**
- Phase 2 complete
- ESA template specifications confirmed
- Validation rules defined

### Phase 4: Risk & Monitoring (Weeks 13-16)

**Scope:**
- Risk scoring engine
- Concentration risk analysis
- 4th party detection
- Basic continuous monitoring

**Deliverables:**
- Risk dashboard
- Vendor risk scores
- Concentration visualizations
- Alert notifications

**Dependencies:**
- Phase 3 complete
- Risk methodology defined

---

## Testing Strategy

### Unit Tests

- **Coverage target:** 80%
- **Framework:** Vitest
- **Key test scenarios:**
  - Data validation functions
  - Risk scoring calculations
  - RoI field mapping
  - Parsing output normalization

### Integration Tests

- Supabase CRUD operations
- Authentication flows
- File upload to storage
- API endpoint responses
- AI parsing with mock responses

### End-to-End Tests

- **Framework:** Playwright
- **User journeys:**
  - New user registration to first vendor added
  - Document upload through parsed results
  - Full RoI export workflow
  - Risk dashboard interaction

### Performance Tests

- **Tool:** k6
- **Scenarios:**
  - 100 concurrent users, normal operations
  - Large file uploads (50MB PDFs)
  - RoI export with 500 vendors
  - Burst traffic simulation

### Security Tests

- OWASP ZAP automated scanning
- Dependency vulnerability scanning (Snyk)
- Penetration testing (external, pre-launch)
- RLS bypass testing

---

## Rollout Plan

### Feature Flags

| Flag Name | Description | Default |
|-----------|-------------|---------|
| `ai_parsing_enabled` | Enable AI document parsing | true |
| `advanced_risk_scoring` | Enable ML-based risk scores | false |
| `roi_export_v2` | New RoI export format | false |
| `beta_features` | Access to beta features | false |

### Rollout Stages

1. **Internal testing** (Week 8)
   - Internal team uses for 1 week
   - Fix critical bugs
   - Criteria: No P0 bugs, core flows working

2. **Private beta** (Week 10)
   - 10 selected customers
   - Dedicated support channel
   - Criteria: <10 P1 bugs, NPS > 20

3. **Public beta** (Week 14)
   - Open registration
   - Self-serve onboarding
   - Criteria: <5 P1 bugs, 99.5% uptime

4. **General availability** (Week 18)
   - Full marketing push
   - SLA commitments
   - Criteria: 99.9% uptime, support SLAs met

### Rollback Plan

1. **Feature-level rollback:** Disable feature flag
2. **Version rollback:** Redeploy previous Vercel deployment
3. **Database rollback:** Point-in-time recovery (Supabase)
4. **Communication:** Status page update, customer email

---

## Monitoring & Alerting

### Key Metrics

| Metric | Description | Threshold | Alert |
|--------|-------------|-----------|-------|
| API Error Rate | 5xx responses | >1% | PagerDuty |
| API Latency p95 | Response time | >2000ms | Slack |
| Parsing Success Rate | Successful parses | <95% | Slack |
| Parsing Duration p95 | Time to parse | >120s | Slack |
| Database Connections | Active connections | >80% pool | PagerDuty |
| Storage Usage | S3 bucket size | >80% quota | Slack |

### Dashboards

| Dashboard | Purpose | Tool |
|-----------|---------|------|
| System Health | Uptime, errors, latency | Vercel Analytics |
| AI Performance | Parsing metrics, confidence | Custom (Supabase) |
| Business Metrics | Users, vendors, exports | PostHog |
| Security | Auth events, failed attempts | Supabase Logs |

### Alerts

| Alert | Condition | Severity | Response |
|-------|-----------|----------|----------|
| API Down | 0 requests in 5 min | P0 | Immediate investigation |
| High Error Rate | >5% errors in 5 min | P1 | Investigate within 30 min |
| Parsing Backlog | >100 pending >10 min | P2 | Investigate within 2 hours |
| Database Slow | Queries >5s | P2 | Investigate within 2 hours |

---

## Dependencies

### External Services

| Service | Purpose | Criticality | Fallback |
|---------|---------|-------------|----------|
| Supabase | Database, Auth, Storage | Critical | None (single provider) |
| Vercel | Hosting, Edge | Critical | None (single provider) |
| Anthropic Claude | AI parsing | High | OpenAI GPT-4 fallback |
| OpenAI GPT-4V | Complex OCR | Medium | Manual processing |
| GLEIF | LEI validation | Low | Offline cache + manual |
| SendGrid | Email | Medium | Resend as fallback |

### Internal Teams

| Team | Dependency | Timeline |
|------|------------|----------|
| Design | UI/UX mockups | Week 2 |
| Legal | Terms of Service, DPA | Week 6 |
| Security | Pen test, SOC 2 prep | Week 12 |
| Marketing | Launch materials | Week 16 |

---

## Open Questions

- [ ] **Q1:** Should we support on-premise deployment for enterprise? - Owner: Product - Due: Week 6
- [ ] **Q2:** What's the SLA for AI parsing availability? - Owner: Engineering - Due: Week 4
- [ ] **Q3:** Do we need real-time collaboration (presence, cursors)? - Owner: Product - Due: Week 8

---

## Appendix

### A. Glossary

| Term | Definition |
|------|------------|
| DORA | Digital Operational Resilience Act (EU Regulation 2022/2554) |
| RoI | Register of Information (DORA-mandated vendor registry) |
| LEI | Legal Entity Identifier (20-character global identifier) |
| TPRM | Third-Party Risk Management |
| SOC 2 | Service Organization Control 2 (AICPA audit framework) |
| TSC | Trust Services Criteria (SOC 2 control categories) |
| xBRL | eXtensible Business Reporting Language |
| ESA | European Supervisory Authority |
| RLS | Row-Level Security (PostgreSQL feature) |
| CUEC | Complementary User Entity Control |

### B. References

- [DORA Regulation Text](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554)
- [EBA DORA Technical Standards](https://www.eba.europa.eu/activities/direct-supervision-and-oversight/digital-operational-resilience-act)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Anthropic Claude API](https://docs.anthropic.com)

### C. Changelog

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-28 | Project Orchestrator | Initial technical specification |
