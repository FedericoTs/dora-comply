# DORA Compliance Platform - Master Specification

**Document Status:** AUTHORITATIVE
**Last Updated:** 2024-12-29
**Version:** 1.0

> This document consolidates ALL specifications into a single authoritative source.
> When in doubt, this document takes precedence.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Platform Architecture](#2-platform-architecture)
3. [Database Schema](#3-database-schema)
4. [Core Modules](#4-core-modules)
5. [API Specifications](#5-api-specifications)
6. [UI/UX Screens](#6-uiux-screens)
7. [External Data Sources](#7-external-data-sources)
8. [Implementation Timeline](#8-implementation-timeline)
9. [Technical Decisions](#9-technical-decisions)

---

## 1. Executive Summary

### 1.1 Product Vision

**DORA Comply** is an AI-powered Third-Party Risk Management solution purpose-built for EU financial institutions facing DORA (Digital Operational Resilience Act) compliance.

> **Related Documents:**
> - [AUTH-SPECIFICATION.md](./AUTH-SPECIFICATION.md) - Industry-standard authentication workflow
> - [LANDING-PAGE-SPECIFICATION.md](../design/LANDING-PAGE-SPECIFICATION.md) - Premium landing page design

### 1.2 Key Value Propositions

| Proposition | Description | Target Metric |
|-------------|-------------|---------------|
| **AI-First Assessment** | Parse SOC 2/ISO 27001 in <60 seconds | 98% time reduction |
| **Automated RoI Generation** | All 15 ESA templates auto-populated | 4 hours vs 4 weeks |
| **Zero Questionnaire Model** | Documents replace questionnaires | 0 questionnaires for audited vendors |
| **EU-Native Architecture** | True data residency | Frankfurt/Dublin only |
| **Incident Compliance** | Art. 19 incident reporting workflow | 4h/72h/1mo deadlines met |

### 1.3 Primary Users

| Persona | Role | Primary Use Case |
|---------|------|------------------|
| **Clara** | Head of Compliance | RoI generation, regulatory submission |
| **Sam** | CISO | Risk dashboards, board reporting |
| **Victor** | Vendor Manager | Vendor onboarding, contract tracking |

### 1.4 Critical Deadlines

| Deadline | Date | Requirement |
|----------|------|-------------|
| **DORA Enforcement** | January 17, 2025 | Regulation goes live |
| **RoI First Submission** | April 30, 2025 | First Register of Information due |
| **Platform GA** | Week 16 | Before RoI deadline |

---

## 2. Platform Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                  │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                 Next.js 15 (App Router)                        │  │
│  │  - React 18 Server Components                                  │  │
│  │  - TypeScript strict mode                                      │  │
│  │  - Tailwind CSS + shadcn/ui                                    │  │
│  └────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      API GATEWAY (Vercel Edge)                        │
│  - Geo-routing (US/EU)  - Rate limiting  - Auth validation           │
└─────────────────────────────────────────────────────────────────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              ▼                     ▼                     ▼
┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐
│   SUPABASE EU      │ │   SUPABASE US      │ │   AI PROCESSING    │
│   (fra1)           │ │   (iad1)           │ │                    │
│   - PostgreSQL     │ │   - PostgreSQL     │ │   - Claude 3.5     │
│   - Auth           │ │   - Auth           │ │   - GPT-4 Vision   │
│   - Storage        │ │   - Storage        │ │   - Vercel AI SDK  │
│   - Edge Functions │ │   - Edge Functions │ │                    │
└────────────────────┘ └────────────────────┘ └────────────────────┘
```

### 2.2 Technology Stack

| Layer | Technology | Version | Notes |
|-------|------------|---------|-------|
| **Frontend** | Next.js | 15.x | App Router, RSC |
| **UI Library** | shadcn/ui | latest | Radix primitives |
| **Styling** | Tailwind CSS | 3.x | Custom design tokens |
| **State** | TanStack Query | 5.x | Server state |
| **Forms** | React Hook Form + Zod | - | Type-safe validation |
| **Database** | PostgreSQL (Supabase) | 15.x | Multi-region |
| **Auth** | Supabase Auth | - | MFA, RLS |
| **Storage** | Supabase Storage | - | S3-compatible |
| **AI** | Claude 3.5 Sonnet | - | Primary parser |
| **Hosting** | Vercel | - | Edge + Serverless |
| **Monitoring** | Sentry + Vercel Analytics | - | Error + performance |

### 2.3 Data Residency

```typescript
// Region routing logic
function getSupabaseConfig(userRegion: 'us' | 'eu') {
  return userRegion === 'eu'
    ? { url: SUPABASE_EU_URL, key: SUPABASE_EU_KEY }  // Frankfurt
    : { url: SUPABASE_US_URL, key: SUPABASE_US_KEY }; // Virginia
}
```

| Data Type | EU Customer | US Customer |
|-----------|-------------|-------------|
| User PII | Frankfurt | Virginia |
| Vendor Data | Frankfurt | Virginia |
| Documents | Frankfurt | Virginia |
| AI Processing | EU API endpoint | US API endpoint |

---

## 3. Database Schema

### 3.1 Schema Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DATABASE SCHEMA                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  CORE ENTITIES (001_initial_schema.sql)                             │
│  ├── organizations           Multi-tenant root                      │
│  ├── users                   Authenticated users                    │
│  ├── vendors                 ICT third-party providers              │
│  ├── documents               Uploaded files (SOC2, ISO, etc.)       │
│  ├── parsed_soc2             AI-extracted SOC 2 data                │
│  ├── parsed_iso27001         AI-extracted ISO 27001 data            │
│  ├── roi_entries             Register of Information entries        │
│  ├── risk_scores             Historical risk scores                 │
│  ├── activity_log            Audit trail                            │
│  └── roi_exports             Export history                         │
│                                                                      │
│  INCIDENT REPORTING (002_incident_reporting.sql)                    │
│  ├── incidents               ICT-related incidents                  │
│  ├── incident_reports        Initial/Intermediate/Final reports     │
│  └── incident_events         Timeline events                        │
│                                                                      │
│  ENHANCED ROI (003_enhanced_roi.sql)                                │
│  ├── organization_branches   B_01.02 - Entity branches              │
│  ├── organization_responsible_persons  B_01.03 - Contacts           │
│  ├── vendor_contacts         B_02.02 - Provider contacts            │
│  ├── vendor_entities         B_02.03 - Provider entities            │
│  ├── contracts               B_03.01 - Contractual arrangements     │
│  ├── contract_contacts       B_03.02 - Contract contacts            │
│  ├── ict_services            B_04.01 - ICT services                 │
│  ├── service_data_locations  B_04.02 - Data locations               │
│  ├── critical_functions      B_05.01 - Critical functions           │
│  ├── function_service_mapping B_05.02 - Function-service map        │
│  ├── subcontractors          B_06.01 - Subcontracting chain         │
│  └── intra_group_arrangements B_07.01 - Intra-group                 │
│                                                                      │
│  FRAMEWORK MAPPING (004_framework_mapping.sql)                      │
│  ├── frameworks              DORA, SOC 2, ISO 27001, NIST CSF       │
│  ├── framework_controls      Individual controls                    │
│  ├── control_mappings        Cross-framework mappings               │
│  ├── vendor_control_assessments  Vendor compliance status           │
│  └── vendor_gap_analysis     Gap analysis cache                     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 Key Entity Relationships

```
organizations
    │
    ├─── users (1:N)
    │
    ├─── vendors (1:N)
    │        │
    │        ├─── documents (1:N)
    │        │        │
    │        │        ├─── parsed_soc2 (1:1)
    │        │        └─── parsed_iso27001 (1:1)
    │        │
    │        ├─── contracts (N:1 via contract)
    │        │        │
    │        │        └─── ict_services (1:N)
    │        │                 │
    │        │                 └─── service_data_locations (1:N)
    │        │
    │        ├─── vendor_control_assessments (1:N)
    │        │
    │        └─── subcontractors (1:N)
    │
    ├─── incidents (1:N)
    │        │
    │        ├─── incident_reports (1:N)
    │        └─── incident_events (1:N)
    │
    ├─── critical_functions (1:N)
    │
    └─── roi_exports (1:N)
```

### 3.3 Row-Level Security (RLS)

All tables implement organization-based RLS:

```sql
-- Helper function
CREATE FUNCTION get_user_organization_id() RETURNS UUID AS $$
  SELECT organization_id FROM users WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER;

-- Standard policy pattern
CREATE POLICY "Users can view org data"
  ON [table] FOR SELECT
  USING (organization_id = get_user_organization_id());
```

---

## 4. Core Modules

### 4.1 Module Overview

| Module | Priority | Phase | Status |
|--------|----------|-------|--------|
| **Vendor Management** | P0 | 1 | Planned |
| **Document Parsing (AI)** | P0 | 2 | Planned |
| **Incident Reporting** | P0 | 2-3 | Spec Complete |
| **RoI Engine (15 Templates)** | P0 | 3 | Spec Complete |
| **Cross-Framework Mapping** | P1 | 2-3 | Spec Complete |
| **Contract Analysis AI** | P1 | 4 | Spec Complete |
| **4th Party Detection** | P1 | 4 | Spec Complete |
| **Risk Scoring** | P0 | 4 | Planned |
| **Trust Exchange** | P2 | 6 | Future |

---

### 4.2 Module: Vendor Management

**Purpose:** Core vendor inventory with DORA-required fields

#### Data Model

```typescript
interface Vendor {
  id: string;
  organization_id: string;
  name: string;
  lei?: string;                    // Legal Entity Identifier
  tier: 'critical' | 'important' | 'standard';
  status: 'active' | 'pending' | 'inactive' | 'offboarding';

  // Classification
  jurisdiction?: string;            // ISO 3166-1 alpha-2
  service_types: string[];
  provider_type?: 'ict_service_provider' | 'cloud_service_provider' |
                  'data_centre' | 'network_provider' | 'other';

  // DORA specific
  supports_critical_function: boolean;
  critical_functions: string[];
  is_intra_group: boolean;

  // Risk
  risk_score?: number;              // 0-100
  last_assessment_date?: Date;
}
```

#### User Flows

```
CREATE VENDOR:
  1. Click "Add Vendor"
  2. Enter basic info (name, LEI)
     → LEI validated via GLEIF API
  3. Classify tier based on criticality
  4. Add to inventory
  5. Upload documents → triggers AI parsing

BULK IMPORT:
  1. Download CSV template
  2. Fill in vendor data
  3. Upload CSV
  4. Review validation errors
  5. Confirm import
```

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/vendors` | List vendors (filtered, paginated) |
| POST | `/api/vendors` | Create vendor |
| GET | `/api/vendors/[id]` | Get vendor detail |
| PUT | `/api/vendors/[id]` | Update vendor |
| DELETE | `/api/vendors/[id]` | Soft delete vendor |
| POST | `/api/vendors/import` | Bulk import from CSV |
| GET | `/api/vendors/[id]/documents` | List vendor documents |

---

### 4.3 Module: AI Document Parsing

**Purpose:** Extract compliance data from SOC 2, ISO 27001, pen test reports

#### Supported Document Types

| Type | Parser | Extraction Fields | Target Accuracy |
|------|--------|-------------------|-----------------|
| **SOC 2 Type II** | Claude 3.5 | Opinion, controls, exceptions, subservice orgs, CUECs | >95% |
| **ISO 27001 Certificate** | Claude 3.5 | Cert #, body, dates, scope, locations | >98% |
| **ISO 27001 SoA** | Claude 3.5 | 93 controls, applicability, implementation | >90% |
| **Penetration Test** | Claude 3.5 | Findings by severity, remediation status | >90% |
| **Contracts** | Claude 3.5 | DORA Art. 30 provisions, dates, parties | >85% |

#### Parsing Pipeline

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Upload    │───▶│   Queue     │───▶│   Parse     │───▶│   Store     │
│   Document  │    │   Job       │    │   with AI   │    │   Results   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                             │
                                             ▼
                                    ┌─────────────────┐
                                    │ Confidence      │
                                    │ Scoring         │
                                    │ (<85% → Review) │
                                    └─────────────────┘
```

#### SOC 2 Extraction Schema

```typescript
interface ParsedSOC2 {
  document_id: string;

  // Report metadata
  report_type: 'type1' | 'type2';
  audit_firm: string;
  opinion: 'unqualified' | 'qualified' | 'adverse';
  period_start: Date;
  period_end: Date;

  // Scope
  criteria: ('security' | 'availability' | 'processing_integrity' |
             'confidentiality' | 'privacy')[];
  system_description: string;

  // Extracted data
  controls: {
    id: string;           // e.g., "CC6.1"
    description: string;
    test_result: 'operating_effectively' | 'exception' | 'not_tested';
    confidence: number;   // 0-1
  }[];

  exceptions: {
    control_id: string;
    description: string;
    management_response?: string;
    remediation_date?: Date;
    confidence: number;
  }[];

  subservice_orgs: {
    name: string;
    service: string;
    inclusion_method: 'inclusive' | 'carve_out';
    confidence: number;
  }[];

  cuecs: {
    id: string;
    description: string;
    related_control: string;
    confidence: number;
  }[];

  // Overall confidence
  confidence_scores: {
    overall: number;
    metadata: number;
    controls: number;
    exceptions: number;
  };
}
```

#### AI Prompts Location

```
/src/lib/ai/prompts/
├── soc2-parser.ts       # SOC 2 extraction prompt
├── iso27001-parser.ts   # ISO 27001 extraction prompt
├── pentest-parser.ts    # Pen test extraction prompt
├── contract-parser.ts   # Contract analysis prompt
└── confidence-scorer.ts # Confidence calculation
```

---

### 4.4 Module: Incident Reporting

**Purpose:** DORA Article 19 compliance for ICT-related incident reporting

#### Classification Criteria (EU 2024/1772)

```typescript
const MAJOR_INCIDENT_THRESHOLDS = {
  // ANY of these triggers "major" classification
  clients_affected_percentage: 10,      // >10% of total clients
  clients_affected_count: 100000,       // >100,000 clients
  duration_critical_hours: 2,           // >2 hours for critical services
  geographic_spread: 2,                 // >2 EU member states affected
  economic_impact_eur: 100000,          // >€100,000 direct costs
  transactions_affected_percentage: 10, // >10% of daily transactions
  data_breach: true,                    // Any personal data breach
  reputational_impact: 'high',          // Significant media coverage
};
```

#### Report Timeline

```
Detection ──┬── 4 hours ───▶ INITIAL REPORT (mandatory if major)
            │
            ├── 24 hours ──▶ INITIAL REPORT (max deadline from detection)
            │
            ├── 72 hours ──▶ INTERMEDIATE REPORT
            │
            └── 30 days ───▶ FINAL REPORT
```

#### Data Model

```typescript
interface Incident {
  id: string;
  organization_id: string;
  incident_ref: string;         // Auto: "INC-2025-0001"
  external_ref?: string;        // From regulator after submission

  // Classification
  classification: 'major' | 'significant' | 'minor';
  incident_type: 'cyber_attack' | 'system_failure' | 'human_error' |
                 'third_party_failure' | 'natural_disaster' | 'other';

  // Status
  status: 'draft' | 'detected' | 'initial_submitted' |
          'intermediate_submitted' | 'final_submitted' | 'closed';

  // Timeline
  detection_datetime: Date;
  occurrence_datetime?: Date;
  recovery_datetime?: Date;
  resolution_datetime?: Date;

  // Impact assessment
  services_affected: string[];
  critical_functions_affected: string[];
  clients_affected_count?: number;
  clients_affected_percentage?: number;
  transactions_affected_count?: number;
  transactions_value_affected?: number;
  data_breach: boolean;
  data_records_affected?: number;
  geographic_spread: string[];  // ISO country codes
  economic_impact?: number;
  reputational_impact?: 'low' | 'medium' | 'high';
  duration_hours?: number;

  // Description
  title: string;
  description?: string;
  root_cause?: string;
  remediation_actions?: string;
  lessons_learned?: string;

  // Vendor linkage
  vendor_id?: string;
}

interface IncidentReport {
  id: string;
  incident_id: string;
  report_type: 'initial' | 'intermediate' | 'final';
  version: number;

  status: 'draft' | 'ready' | 'submitted' | 'acknowledged';
  deadline: Date;
  submitted_at?: Date;
  submitted_by?: string;

  report_content: object;  // ESA-structured content
}
```

#### User Flow

```
INCIDENT DETECTION:
  1. User clicks "Report Incident"
  2. Enter detection time and description
  3. System auto-calculates classification based on impact
  4. If MAJOR: 4-hour deadline timer starts

REPORT SUBMISSION:
  1. Fill required fields per ESA template
  2. System validates completeness
  3. Generate PDF/XML preview
  4. Submit to regulator
  5. Track acknowledgment
```

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/incidents` | List incidents |
| POST | `/api/incidents` | Create incident |
| GET | `/api/incidents/[id]` | Get incident detail |
| PUT | `/api/incidents/[id]` | Update incident |
| POST | `/api/incidents/[id]/classify` | Re-classify incident |
| GET | `/api/incidents/[id]/reports` | List incident reports |
| POST | `/api/incidents/[id]/reports` | Create report |
| PUT | `/api/incidents/[id]/reports/[reportId]` | Update report |
| POST | `/api/incidents/[id]/reports/[reportId]/submit` | Submit to regulator |

---

### 4.5 Module: Register of Information (RoI) Engine

**Purpose:** Generate all 15 ESA-mandated templates for regulatory submission

#### Template Overview

| Template | Description | Data Source |
|----------|-------------|-------------|
| **B_01.01** | Entity identification | organizations |
| **B_01.02** | Entity branches | organization_branches |
| **B_01.03** | Responsible persons | organization_responsible_persons |
| **B_02.01** | Provider identification | vendors |
| **B_02.02** | Provider contacts | vendor_contacts |
| **B_02.03** | Provider entities | vendor_entities |
| **B_03.01** | Contracts | contracts |
| **B_03.02** | Contract contacts | contract_contacts |
| **B_03.03** | Contract amendments | contracts.amendments |
| **B_04.01** | ICT services | ict_services |
| **B_04.02** | Service data locations | service_data_locations |
| **B_05.01** | Critical functions | critical_functions |
| **B_05.02** | Function-service mapping | function_service_mapping |
| **B_06.01** | Subcontracting chain | subcontractors |
| **B_07.01** | Intra-group arrangements | intra_group_arrangements |

#### Export Format (xBRL-CSV)

```
export_package/
├── parameters.csv       # Entity LEI, reporting period, currency
├── report.json          # xBRL-CSV metadata
└── reports/
    ├── b_01.01.csv
    ├── b_01.02.csv
    ├── b_01.03.csv
    ├── b_02.01.csv
    ├── b_02.02.csv
    ├── b_02.03.csv
    ├── b_03.01.csv
    ├── b_03.02.csv
    ├── b_03.03.csv
    ├── b_04.01.csv
    ├── b_04.02.csv
    ├── b_05.01.csv
    ├── b_05.02.csv
    ├── b_06.01.csv
    └── b_07.01.csv
```

#### Validation Rules

```typescript
// Validation engine structure
interface ValidationRule {
  id: string;
  template: string;
  field: string;
  type: 'required' | 'format' | 'reference' | 'business_logic' | 'cross_template';
  severity: 'error' | 'warning';
  message: string;
  validate: (value: any, context: ValidationContext) => boolean;
}

// Example rules
const VALIDATION_RULES: ValidationRule[] = [
  {
    id: 'LEI_FORMAT',
    template: 'all',
    field: 'lei',
    type: 'format',
    severity: 'error',
    message: 'LEI must be 20 alphanumeric characters',
    validate: (v) => /^[A-Z0-9]{20}$/.test(v),
  },
  {
    id: 'CONTRACT_DATE_ORDER',
    template: 'B_03.01',
    field: 'contract_dates',
    type: 'business_logic',
    severity: 'error',
    message: 'Contract end date must be after start date',
    validate: (_, ctx) => ctx.end_date > ctx.start_date,
  },
  {
    id: 'SERVICE_CONTRACT_REF',
    template: 'B_04.01',
    field: 'contract_ref',
    type: 'cross_template',
    severity: 'error',
    message: 'Service must reference valid contract from B_03.01',
    validate: (v, ctx) => ctx.contracts.has(v),
  },
];
```

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/roi/status` | Get RoI completeness status |
| GET | `/api/roi/validation` | Run full validation |
| GET | `/api/roi/templates/[template]` | Get template data |
| PUT | `/api/roi/templates/[template]` | Update template data |
| POST | `/api/roi/export` | Generate export package |
| GET | `/api/roi/exports` | List export history |
| GET | `/api/roi/exports/[id]` | Download specific export |

---

### 4.6 Module: Cross-Framework Mapping

**Purpose:** Map controls across DORA, SOC 2, ISO 27001, NIST CSF for gap analysis

#### Supported Frameworks

| Framework | Code | Controls | Source |
|-----------|------|----------|--------|
| **DORA** | `dora` | 21 | EUR-Lex + RTS |
| **SOC 2 TSC** | `soc2` | 64 | AICPA |
| **ISO 27001:2022** | `iso27001` | 93 | ISO |
| **NIST CSF 2.0** | `nist_csf` | 106 | NIST |

#### Mapping Types

```typescript
type MappingType =
  | 'equivalent'  // 1:1 direct mapping, fully satisfies
  | 'partial'     // Partially covers the target control
  | 'supports'    // Provides supporting evidence
  | 'related';    // Conceptually related but not direct evidence
```

#### Gap Analysis Algorithm

```typescript
async function calculateGapAnalysis(
  vendorId: string,
  targetFramework: string = 'dora'
): Promise<GapAnalysis> {
  // 1. Get all target framework controls
  const targetControls = await getFrameworkControls(targetFramework);

  // 2. Get vendor's assessed controls (from parsed documents)
  const assessedControls = await getVendorAssessments(vendorId);

  // 3. For each target control, check coverage
  const coverage = targetControls.map(target => {
    // Find mappings from assessed controls to this target
    const mappings = findMappingsToControl(target.id, assessedControls);

    // Calculate coverage score
    const coverageScore = mappings.reduce((score, mapping) => {
      const weight = MAPPING_WEIGHTS[mapping.mapping_type];
      return score + (mapping.coverage_percentage * weight);
    }, 0);

    return {
      control: target,
      status: coverageScore >= 80 ? 'met' :
              coverageScore >= 40 ? 'partially_met' : 'not_met',
      coverage: Math.min(coverageScore, 100),
      evidence: mappings,
    };
  });

  // 4. Calculate pillar-level scores (DORA-specific)
  const byPillar = groupBy(coverage, c => c.control.dora_pillar);

  return {
    overall_coverage: average(coverage.map(c => c.coverage)),
    coverage_by_pillar: mapValues(byPillar, controls =>
      average(controls.map(c => c.coverage))
    ),
    controls_met: coverage.filter(c => c.status === 'met').length,
    controls_partial: coverage.filter(c => c.status === 'partially_met').length,
    controls_not_met: coverage.filter(c => c.status === 'not_met').length,
    critical_gaps: coverage
      .filter(c => c.status === 'not_met' && c.control.is_mandatory)
      .slice(0, 10),
  };
}
```

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/frameworks` | List frameworks |
| GET | `/api/frameworks/[code]/controls` | Get framework controls |
| GET | `/api/mappings?source=soc2&target=dora` | Get control mappings |
| GET | `/api/vendors/[id]/gap-analysis` | Get vendor gap analysis |
| POST | `/api/vendors/[id]/assessments` | Submit control assessment |

---

### 4.7 Module: 4th Party Detection

**Purpose:** Auto-detect and track subcontracting chain from SOC 2 reports

#### Data Model

```typescript
interface Subcontractor {
  id: string;
  vendor_id: string;            // Direct vendor
  service_id?: string;          // Specific service
  organization_id: string;

  // Identification
  subcontractor_name: string;
  subcontractor_lei?: string;
  country_code?: string;

  // Chain position
  tier_level: number;           // 1=direct, 2=sub-sub, etc.
  parent_subcontractor_id?: string;

  // Service
  service_description?: string;
  service_type?: string;

  // Criticality
  supports_critical_function: boolean;

  // Monitoring
  is_monitored: boolean;
  last_assessment_date?: Date;
  risk_rating?: 'low' | 'medium' | 'high';
}
```

#### Detection Sources

| Source | Detection Method | Confidence |
|--------|------------------|------------|
| **SOC 2 Subservice Orgs** | AI extraction from Section IV | High |
| **ISO 27001 SoA** | AI extraction of 3rd party refs | Medium |
| **Contracts** | AI extraction of subcontractor clauses | Medium |
| **Manual Entry** | User input | N/A |

#### Visualization

```
Supply Chain Graph (React Flow)

┌─────────────────┐
│  Your Org       │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌───────┐
│ AWS   │ │Stripe │  ← Tier 1 (Your Vendors)
└───┬───┘ └───┬───┘
    │         │
    ▼         ▼
┌───────┐ ┌───────┐
│Datadog│ │Plaid  │  ← Tier 2 (4th Parties)
└───────┘ └───────┘
```

---

### 4.8 Module: Contract Analysis AI

**Purpose:** Extract DORA Article 30 provisions from contracts

#### Required Provisions (DORA Art. 30)

| Provision | Description | Required |
|-----------|-------------|----------|
| **30(2)(a)** | Clear description of ICT services | Yes |
| **30(2)(b)** | Data processing locations | Yes |
| **30(2)(c)** | Service level agreements | Yes |
| **30(2)(d)** | Incident notification obligations | Yes |
| **30(2)(e)** | Business continuity provisions | Yes |
| **30(2)(f)** | Access and audit rights | Yes |
| **30(2)(g)** | Termination rights | Yes |
| **30(2)(h)** | Exit strategies | Critical only |
| **30(3)** | Subcontracting conditions | Yes |

#### Extraction Schema

```typescript
interface ContractAnalysis {
  contract_id: string;

  provisions: {
    provision_code: string;       // "30(2)(a)"
    status: 'present' | 'partial' | 'missing';
    location?: string;            // "Section 5.2, page 12"
    extracted_text?: string;
    confidence: number;
    notes?: string;
  }[];

  overall_compliance: number;     // 0-100%
  critical_gaps: string[];        // Missing mandatory provisions

  recommended_amendments: {
    provision: string;
    current_text?: string;
    recommended_text: string;
    priority: 'high' | 'medium' | 'low';
  }[];
}
```

---

## 5. API Specifications

### 5.1 API Design Principles

- **RESTful** endpoints for CRUD operations
- **Server Actions** for mutations (Next.js 15)
- **Rate limiting**: 100 req/min per user
- **Response format**: JSON with consistent error structure

### 5.2 Error Response Format

```typescript
interface APIError {
  error: {
    code: string;           // "VALIDATION_ERROR"
    message: string;        // Human-readable message
    details?: object;       // Field-level errors
  };
}
```

### 5.3 Complete Endpoint List

```
AUTHENTICATION (See AUTH-SPECIFICATION.md for full details)
POST   /api/auth/signup              Create account (email verification sent)
POST   /api/auth/login               Login (returns session, may require MFA)
POST   /api/auth/logout              Logout (revoke session)
POST   /api/auth/reset-password      Request password reset email
GET    /api/auth/callback            OAuth callback handler
GET    /api/auth/session             Get current session
DELETE /api/auth/session             Revoke current session
GET    /api/auth/sessions            List all active sessions
DELETE /api/auth/sessions/[id]       Revoke specific session
POST   /api/auth/mfa/enroll          Start MFA enrollment (TOTP)
POST   /api/auth/mfa/verify          Verify MFA code
POST   /api/auth/mfa/disable         Disable MFA (requires verification)
GET    /api/auth/recovery-codes      Get recovery codes

VENDORS
GET    /api/vendors                  List vendors
POST   /api/vendors                  Create vendor
GET    /api/vendors/[id]             Get vendor
PUT    /api/vendors/[id]             Update vendor
DELETE /api/vendors/[id]             Delete vendor
POST   /api/vendors/import           Bulk import
GET    /api/vendors/[id]/documents   List documents
GET    /api/vendors/[id]/gap-analysis Get gap analysis

DOCUMENTS
GET    /api/documents                List documents
POST   /api/documents                Upload document
GET    /api/documents/[id]           Get document
DELETE /api/documents/[id]           Delete document
POST   /api/documents/[id]/parse     Trigger parsing
GET    /api/documents/[id]/parsed    Get parsed data
PUT    /api/documents/[id]/parsed    Update parsed data (corrections)

INCIDENTS
GET    /api/incidents                List incidents
POST   /api/incidents                Create incident
GET    /api/incidents/[id]           Get incident
PUT    /api/incidents/[id]           Update incident
POST   /api/incidents/[id]/classify  Re-classify
GET    /api/incidents/[id]/reports   List reports
POST   /api/incidents/[id]/reports   Create report
PUT    /api/incidents/[id]/reports/[rid]        Update report
POST   /api/incidents/[id]/reports/[rid]/submit Submit report

ROI
GET    /api/roi/status               Completeness status
GET    /api/roi/validation           Run validation
GET    /api/roi/templates            List templates
GET    /api/roi/templates/[template] Get template data
PUT    /api/roi/templates/[template] Update template
POST   /api/roi/export               Generate export
GET    /api/roi/exports              Export history
GET    /api/roi/exports/[id]         Download export

FRAMEWORKS
GET    /api/frameworks               List frameworks
GET    /api/frameworks/[code]/controls Get controls
GET    /api/mappings                 Get control mappings

CONTRACTS
GET    /api/contracts                List contracts
POST   /api/contracts                Create contract
GET    /api/contracts/[id]           Get contract
PUT    /api/contracts/[id]           Update contract
POST   /api/contracts/[id]/analyze   Trigger AI analysis

SETTINGS
GET    /api/settings/organization    Get org settings
PUT    /api/settings/organization    Update org settings
GET    /api/settings/profile         Get user profile
PUT    /api/settings/profile         Update profile
```

---

## 6. UI/UX Screens

### 6.1 Screen Inventory

| Screen | Route | Priority | Module |
|--------|-------|----------|--------|
| **Landing Page** | `/` | P0 | Marketing |
| **Login** | `/login` | P0 | Auth |
| **Register** | `/register` | P0 | Auth |
| **MFA Setup** | `/mfa/setup` | P0 | Auth |
| **MFA Verify** | `/mfa/verify` | P0 | Auth |
| **Onboarding** | `/onboarding` | P0 | Auth |
| **Password Reset** | `/reset-password` | P0 | Auth |
| **Dashboard** | `/dashboard` | P0 | Core |
| **Vendor List** | `/vendors` | P0 | Vendors |
| **Vendor Detail** | `/vendors/[id]` | P0 | Vendors |
| **Vendor Create** | `/vendors/new` | P0 | Vendors |
| **Document Upload** | `/vendors/[id]/documents/upload` | P0 | Documents |
| **Document Detail** | `/documents/[id]` | P0 | Documents |
| **RoI Dashboard** | `/roi` | P0 | RoI |
| **RoI Export** | `/roi/export` | P0 | RoI |
| **Incident List** | `/incidents` | P0 | Incidents |
| **Incident Detail** | `/incidents/[id]` | P0 | Incidents |
| **Incident Report** | `/incidents/[id]/report/[type]` | P0 | Incidents |
| **Contract List** | `/contracts` | P1 | Contracts |
| **Contract Detail** | `/contracts/[id]` | P1 | Contracts |
| **Gap Analysis** | `/vendors/[id]/gap-analysis` | P1 | Mapping |
| **Supply Chain** | `/vendors/[id]/supply-chain` | P1 | 4th Party |
| **Risk Dashboard** | `/risk` | P1 | Risk |
| **Settings** | `/settings` | P1 | Core |

### 6.2 Design System

> **Full specification:** [LANDING-PAGE-SPECIFICATION.md](../design/LANDING-PAGE-SPECIFICATION.md)
> **Live preview:** `/theme` route in the application

**Color Palette (Premium Coral Theme):**

```css
:root {
  /* Primary - Warm Coral (brand color) */
  --primary: #E07A5F;
  --primary-foreground: #FFFFFF;

  /* Status Colors */
  --success: #10B981;    /* Green */
  --warning: #F59E0B;    /* Amber */
  --error: #EF4444;      /* Red */
  --info: #3B82F6;       /* Blue */

  /* Neutrals */
  --background: #FAFAFA;        /* Off-white */
  --foreground: #1A1A2E;        /* Near-black */
  --muted: #F4F4F5;             /* Light gray */
  --muted-foreground: #71717A;  /* Medium gray */
  --border: #E4E4E7;            /* Border gray */

  /* Sidebar */
  --sidebar: #FAFAFA;
  --sidebar-border: #E4E4E7;

  /* Premium Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.07);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.08);
  --shadow-premium: 0 20px 40px -12px rgb(0 0 0 / 0.15);
}
```

**Typography:**
- Display & Headings: `Plus Jakarta Sans` (font-weight: 600-700)
- Body: `Plus Jakarta Sans` (font-weight: 400-500)
- Monospace: `JetBrains Mono` (for code, data)

**Component Patterns:**
- Cards with premium shadows (`card-premium` class)
- Generous padding (p-6 to p-8 for cards)
- Rounded corners (rounded-lg: 8px, rounded-xl: 12px, rounded-2xl: 16px)
- Micro-animations on hover/focus (translate-y, shadow transitions)
- Staggered entry animations for lists
- Glass morphism effects for overlays

**Key Component Classes:**
```css
.card-premium     /* Elevated card with hover effect */
.btn-primary      /* Coral primary button */
.btn-secondary    /* Outline/ghost button */
.badge-*          /* Status badges (success, warning, error) */
.input-premium    /* Styled input fields */
.stat-card        /* Metric display cards */
```

---

## 7. External Data Sources

### 7.1 Summary

| Category | Source | Priority | Cost |
|----------|--------|----------|------|
| **Regulatory** | ESA/EBA Downloads | P0 | Free |
| **Entity Validation** | GLEIF LEI API | P0 | Free |
| **Framework Controls** | AICPA, ISO, NIST | P0 | Free |
| **Security Ratings** | SecurityScorecard | P2 | $$$$ |

### 7.2 Downloaded ESA Data

Located at: `/data/esa/`

| Directory | Contents |
|-----------|----------|
| `/templates/` | Annotated Table Layout DORADORA 4.0.xlsx |
| `/samples/dora/` | Sample xBRL-CSV files (all 15 templates) |
| `/taxonomy/` | EBA XBRL 4.0 Dictionary |
| `/validation/` | DPM Glossary, Validation Rules |

### 7.3 GLEIF Integration

```typescript
// src/lib/external/gleif.ts
export async function validateLEI(lei: string): Promise<LEIValidationResult>;
export async function searchByName(name: string): Promise<LEIRecord[]>;

// Cache: 24-hour TTL in Supabase
```

---

## 8. Implementation Timeline

### 8.1 Phase Summary

| Phase | Weeks | Focus | Key Deliverables |
|-------|-------|-------|------------------|
| **1: Foundation** | 1-4 | Core CRUD | Auth, Vendors, Documents, Dashboard |
| **2: AI Parsing** | 5-8 | Intelligence | SOC 2 parsing, ISO parsing, DORA mapping |
| **3: RoI Engine** | 9-12 | Compliance | All 15 templates, Validation, Export |
| **4: Scale** | 13-16 | Polish | Risk scoring, 4th party, Performance |

### 8.2 Key Milestones

| Milestone | Week | Criteria |
|-----------|------|----------|
| **MVP Internal** | 4 | Vendor CRUD, Document upload |
| **Beta Launch** | 8 | AI parsing >90%, 10 customers |
| **Public Launch** | 12 | RoI export working, <10 bugs |
| **General Availability** | 16 | Security audit passed, 99.9% uptime |

### 8.3 Phase 2-3 Critical Path

```
Week 5-6: SOC 2 Parsing Infrastructure
    ↓
Week 7: Parsing Results UI + Review
    ↓
Week 8: DORA Mapping + ISO 27001 + Incident Foundation
    ↓
Week 9-10: RoI Data Model + Validation Engine
    ↓
Week 11: All 15 Template Export
    ↓
Week 12: Incident Reporting Complete + Public Launch
```

---

## 9. Technical Decisions

### 9.1 Architecture Decision Records (ADRs)

| ADR | Decision | Rationale |
|-----|----------|-----------|
| **ADR-001** | Usage-based pricing | Aligns with customer value, reduces barrier |
| **ADR-002** | Multi-tenant shared DB | Cost-effective, simpler ops at current scale |
| **ADR-003** | Claude 3.5 primary | Best accuracy on document parsing benchmarks |
| **ADR-004** | AI-first + human review | Balances speed with accuracy requirements |

### 9.2 Security Requirements

> **Full specification:** [AUTH-SPECIFICATION.md](./AUTH-SPECIFICATION.md)

| Requirement | Implementation |
|-------------|----------------|
| **Authentication** | Supabase Auth with PKCE flow |
| **Multi-Factor Auth** | TOTP mandatory for admins, recommended for all |
| **OAuth/SSO** | Microsoft Entra ID, Google Workspace (P1) |
| **Password Policy** | 12+ chars, zxcvbn score 3+, HIBP check |
| **Session Management** | JWT (1h) + refresh token (7d), max 5 sessions |
| **Authorization** | Row-Level Security on all tables |
| **RBAC** | Owner > Admin > Member > Viewer hierarchy |
| **Encryption at Rest** | AES-256 (Supabase default) |
| **Encryption in Transit** | TLS 1.3, HSTS enabled |
| **Rate Limiting** | 5 login attempts/15min, progressive lockout |
| **Audit Logging** | All auth events logged with 2-year retention |
| **Security Headers** | CSP, X-Frame-Options, X-Content-Type-Options |
| **Penetration Testing** | External pen test before GA |

### 9.3 Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Page Load | <2 seconds | Core Web Vitals |
| API Response | <500ms p95 | Vercel Analytics |
| Document Parse | <60 seconds | Internal timing |
| Uptime | 99.9% | Uptime monitoring |
| Concurrent Users | 1,000+ | Load testing |

---

## Appendix A: File Structure

```
compliance-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Auth routes (login, register)
│   │   ├── (dashboard)/        # Protected routes
│   │   │   ├── vendors/
│   │   │   ├── documents/
│   │   │   ├── incidents/
│   │   │   ├── roi/
│   │   │   └── settings/
│   │   └── api/                # API routes
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   └── [feature]/          # Feature-specific components
│   ├── lib/
│   │   ├── supabase/           # Supabase client & config
│   │   ├── ai/                 # AI parsing utilities
│   │   │   └── prompts/        # LLM prompts
│   │   ├── validation/         # RoI validation engine
│   │   ├── export/             # xBRL-CSV generator
│   │   └── external/           # External API integrations
│   └── types/                  # TypeScript types
├── supabase/
│   └── migrations/             # SQL migrations
├── data/
│   └── esa/                    # Downloaded ESA files
├── docs/
│   ├── architecture/           # Tech specs
│   ├── planning/               # PRD, roadmap
│   └── design/                 # Wireframes
└── scripts/                    # Utility scripts
```

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| **DORA** | Digital Operational Resilience Act (EU 2022/2554) |
| **RoI** | Register of Information - mandatory ICT provider registry |
| **LEI** | Legal Entity Identifier - 20-char company identifier |
| **ICT** | Information and Communication Technology |
| **TPRM** | Third-Party Risk Management |
| **TSC** | Trust Services Criteria (SOC 2) |
| **SoA** | Statement of Applicability (ISO 27001) |
| **xBRL-CSV** | ESA-mandated export format for regulatory reporting |
| **DPM** | Data Point Model - ESA semantic data model |
| **RTS** | Regulatory Technical Standards |
| **ITS** | Implementing Technical Standards |

---

**Document Maintained By:** Project Orchestrator
**Last Full Review:** 2024-12-29
**Next Review:** Weekly during active development
