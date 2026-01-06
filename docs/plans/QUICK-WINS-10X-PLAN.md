# Quick Wins Implementation Plan: 10X Better Than Competitors

## Executive Summary

Based on extensive research of competitors (OneTrust, Prevalent, SecurityScorecard, Vanta, Panorays), this plan implements three quick wins that will provide immediate 10X value:

1. **Settings Page** - From stub to enterprise-grade configuration
2. **RoI Auto-Population** - One-click SOC2 data extraction
3. **Incident PDF Export** - DORA-compliant regulatory submissions

---

## Research Findings

### Competitor Analysis

| Platform | Settings UX | RoI Auto-Pop | Incident Export |
|----------|-------------|--------------|-----------------|
| OneTrust | 200+ integrations, UI-driven config | N/A | Basic PDF |
| Prevalent | Customizable dashboards, SSO | N/A | Template-based |
| Vanta | IdP/SSO discovery, shadow IT | Reuses SOC2 evidence for DORA | N/A |
| Panorays | DORA questionnaire templates | Built-in RoI automation | N/A |
| SecurityScorecard | API tokens, Bot Users, 100+ integrations | N/A | Score reports |

### 10X Differentiators We Will Build

1. **Settings**: No-code workflow config + GLEIF integration + AI-powered defaults
2. **RoI Auto-Pop**: One-click extraction with preview + confidence scores + field mapping
3. **Incident Export**: ESA-compliant XML/PDF with pre-filled templates + deadline tracking

---

## Quick Win #1: Settings Page

### Current State
- 5 stub cards showing "Coming soon"
- No functionality

### Target State (10X Better)
Enterprise-grade settings with:
- Organization profile with GLEIF LEI validation
- Team management with role-based access
- Notification preferences with smart defaults
- Security settings including MFA
- API keys for integrations
- Appearance/theme customization

### Implementation

#### 1.1 Settings Navigation Structure
```
/settings
├── /settings/organization    # Company details, LEI, jurisdiction
├── /settings/team            # Users, roles, invitations
├── /settings/notifications   # Email preferences, alerts
├── /settings/security        # MFA, sessions, audit log
├── /settings/integrations    # API keys, webhooks
└── /settings/appearance      # Theme, locale
```

#### 1.2 Organization Settings (P0)
**Why 10X**: Auto-validates LEI via GLEIF API, pre-fills jurisdiction data

```tsx
// Key features:
- LEI lookup with GLEIF integration (already built!)
- Auto-fill organization details from LEI data
- Jurisdiction picker with regulatory implications
- Entity type classification (credit institution, payment firm, etc.)
- Parent/subsidiary relationship mapping
```

**Database**: Uses existing `organizations` table

#### 1.3 Team Management (P0)
**Why 10X**: Role-based access aligned with DORA responsibilities

```tsx
// Roles aligned with DORA:
const DORA_ROLES = {
  admin: 'Platform Administrator',
  compliance_officer: 'Compliance Officer',
  risk_manager: 'Risk Manager',
  incident_coordinator: 'Incident Coordinator',
  viewer: 'Read-Only Viewer',
};
```

**Database**: Uses existing `organization_members`, `profiles` tables

#### 1.4 Notification Preferences (P1)
**Why 10X**: Smart defaults based on DORA deadlines

```tsx
// Notification types:
- Document expiration (SOC2, certs) - 90/60/30/7 days
- Incident deadline reminders - Auto based on classification
- RoI submission reminders - Weekly until April 30, 2025
- Vendor risk changes - Real-time
- Compliance gaps detected - Daily digest
```

#### 1.5 Security Settings (P1)
**Why 10X**: MFA enforcement for compliance roles

```tsx
// Features:
- TOTP MFA setup with QR code
- Recovery codes generation
- Active sessions list with revocation
- Audit log viewer (last 90 days)
```

#### 1.6 API & Integrations (P2)
**Why 10X**: Bot users for automation (SecurityScorecard pattern)

```tsx
// Features:
- Personal API token generation
- Bot user creation for CI/CD
- Webhook configuration for events
- Pre-built integrations (Slack, Teams, Jira)
```

### Files to Create
```
src/app/(dashboard)/settings/
├── page.tsx                     # Hub with navigation
├── layout.tsx                   # Sidebar navigation
├── organization/
│   └── page.tsx                 # Organization form
├── team/
│   ├── page.tsx                 # Team list
│   └── invite/page.tsx          # Invite flow
├── notifications/
│   └── page.tsx                 # Notification prefs
├── security/
│   └── page.tsx                 # MFA, sessions
├── integrations/
│   └── page.tsx                 # API keys
└── appearance/
    └── page.tsx                 # Theme picker
```

---

## Quick Win #2: RoI Auto-Population UI

### Current State
- `ai-population-panel.tsx` shows documents ready for population
- `document-population-card.tsx` has UI but `onPopulateDocument` is not wired up
- No backend API to perform the actual population

### Target State (10X Better)
- One-click population with preview
- Field-by-field confidence scores
- Selective population (choose which fields)
- Audit trail of what was populated

### Implementation

#### 2.1 Population Preview Modal
**Why 10X**: Users see exactly what will be populated before committing

```tsx
// Flow:
1. User clicks "Auto-Populate" on document card
2. Modal shows preview of fields to be populated
3. Each field shows:
   - Template ID (e.g., B_05.01)
   - Field code (e.g., c0020)
   - Current value (if any)
   - New value from SOC2
   - Confidence score (0-100%)
4. User can deselect fields they don't want
5. User clicks "Populate Selected" to commit
```

#### 2.2 API Endpoint
```typescript
// POST /api/roi/populate
{
  documentId: string,
  fieldMappings: {
    templateId: string,
    fieldCode: string,
    value: string,
    confidence: number
  }[],
  overwriteExisting: boolean
}
```

#### 2.3 Field Mapping Logic
```typescript
// SOC2 parsed data → RoI field mapping
const SOC2_TO_ROI_MAPPINGS = {
  // Vendor info → B_05.01 (Third-Party Register)
  'company_name': { template: 'B_05.01', field: 'c0020' },
  'lei': { template: 'B_05.01', field: 'c0010' },
  'country': { template: 'B_05.01', field: 'c0040' },

  // Service info → B_02.02 (ICT Services)
  'service_description': { template: 'B_02.02', field: 'c0020' },

  // Subcontractors → B_04.01 (Fourth Parties)
  'subservice_orgs': { template: 'B_04.01', field: 'multiple' },

  // ... comprehensive mapping
};
```

#### 2.4 Population Tracking
```sql
-- Track what was populated from which document
CREATE TABLE roi_population_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  document_id UUID REFERENCES documents(id),
  template_id TEXT NOT NULL,
  field_code TEXT NOT NULL,
  previous_value TEXT,
  new_value TEXT NOT NULL,
  confidence DECIMAL(5,2),
  populated_by UUID REFERENCES profiles(id),
  populated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Files to Create/Modify
```
src/app/(dashboard)/roi/
├── components/
│   ├── ai-population-panel.tsx   # MODIFY: Wire up onPopulateDocument
│   ├── document-population-card.tsx # MODIFY: Connect to API
│   └── population-preview-modal.tsx # NEW: Preview before commit

src/app/api/roi/
├── populate/
│   └── route.ts                  # NEW: Population endpoint
└── population-preview/
    └── route.ts                  # NEW: Get preview data

src/lib/roi/
├── population.ts                 # NEW: Field mapping logic
└── population-tracking.ts        # NEW: Audit trail

supabase/migrations/
└── XXX_roi_population_log.sql    # NEW: Tracking table
```

---

## Quick Win #3: Incident PDF Export

### Current State
- Incident detail page shows all data
- No export functionality
- No DORA-compliant format

### Target State (10X Better)
- One-click PDF export in DORA ITS format
- All 101 data points from ESA template
- Pre-filled from incident data
- Suitable for regulatory submission

### DORA Incident Report Requirements

#### Report Stages
| Stage | Deadline | Content |
|-------|----------|---------|
| Initial | 4h after classification, 24h after detection | Basic incident info |
| Intermediate | 72h | Cause, classification, impact |
| Final | 1 month | Root cause, follow-up, prevention |

#### Key Data Points (101 total per ESA ITS)
```
General Information (10 fields):
- Reporting entity LEI
- Incident reference number
- Report type (initial/intermediate/final)
- Classification (major/significant)
- Detection datetime
- Classification datetime

Impact Assessment (25 fields):
- Clients affected (count, percentage)
- Transactions affected (count, value)
- Services affected
- Critical functions affected
- Geographic spread
- Economic impact
- Data breach indicators
- Reputational impact

Incident Details (35 fields):
- Incident type
- Description
- Root cause
- Attack vectors (if cyber)
- Systems affected
- Third-party involvement

Response & Recovery (20 fields):
- Containment actions
- Recovery actions
- Service restoration datetime
- Duration
- Remediation status

Lessons Learned (11 fields):
- Prevention measures
- Policy changes
- Control improvements
```

### Implementation

#### 3.1 PDF Generator
```typescript
// src/lib/exports/incident-reports.ts

interface DORAIncidentReport {
  reportType: 'initial' | 'intermediate' | 'final';
  reportingEntity: {
    lei: string;
    name: string;
    jurisdiction: string;
  };
  incident: Incident;
  submissionInfo: {
    preparedBy: string;
    preparedAt: Date;
    version: number;
  };
}

export function generateDORAIncidentPDF(data: DORAIncidentReport): Blob {
  // Uses jsPDF with ESA template structure
  // Includes all 101 data points
  // Branded footer with submission info
}

export function generateDORAIncidentXML(data: DORAIncidentReport): string {
  // XML format per ITS 2025/302
  // Interoperable with all EU supervisors
}
```

#### 3.2 Export Button Component
```tsx
// src/components/incidents/export-incident-button.tsx

export function ExportIncidentButton({
  incident,
  reportType
}: {
  incident: Incident;
  reportType: 'initial' | 'intermediate' | 'final';
}) {
  // Shows format options (PDF, XML)
  // Validates required fields before export
  // Shows warnings for missing data
}
```

#### 3.3 UI Integration
- Add export button to incident detail page header
- Add export option in reports tab
- Pre-fill template from incident data
- Show field completion percentage

### Files to Create/Modify
```
src/lib/exports/
├── compliance-reports.ts         # EXISTING: SOC2 exports
└── incident-reports.ts           # NEW: DORA incident exports

src/components/incidents/
└── export-incident-button.tsx    # NEW: Export button

src/app/(dashboard)/incidents/
└── [id]/page.tsx                 # MODIFY: Add export button

src/app/api/incidents/
└── [id]/export/route.ts          # NEW: Export API
```

---

## Implementation Priority

### Week 1: Settings Foundation
1. Settings layout with navigation
2. Organization settings with LEI validation
3. Team management with roles

### Week 2: RoI Population
1. Population preview modal
2. Backend API for population
3. Tracking/audit log

### Week 3: Incident Export
1. PDF generator with DORA format
2. Export button integration
3. XML output for supervisor submission

---

## Success Metrics

| Feature | Metric | Target |
|---------|--------|--------|
| Settings | User activation | 80% complete org profile |
| RoI Population | Time saved | 70% reduction in manual entry |
| Incident Export | Submission compliance | 100% valid exports |

---

## Competitor Differentiation

| Feature | Us (After) | OneTrust | Prevalent | Vanta |
|---------|------------|----------|-----------|-------|
| LEI auto-validation | Yes (GLEIF API) | No | No | No |
| SOC2→RoI mapping | One-click | Manual | N/A | Partial |
| DORA incident PDF | ESA-compliant | Generic | Template | N/A |
| Field confidence | AI-scored | No | No | No |
| Population preview | Visual diff | No | N/A | No |

---

## Technical Architecture

### Settings
```
User → Settings Page → Server Action → Supabase
                    ↓
              GLEIF API (for LEI validation)
```

### RoI Population
```
User → Click Populate → Preview Modal → Confirm
                    ↓
           SOC2 Parsed Data → Field Mapper → RoI Tables
                                         ↓
                                   Population Log
```

### Incident Export
```
User → Export Button → Format Selection → Generate
                    ↓
           Incident Data → DORA Template → PDF/XML
                                        ↓
                                   Download
```
