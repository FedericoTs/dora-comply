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
| **DORA Enforcement** | January 17, 2026 | Regulation goes live |
| **RoI First Submission** | April 30, 2026 | First Register of Information due |
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
| **SOC2-to-RoI Auto-Population** | P0 | 5 | **NEXT PRIORITY** |
| **Incident Workflow (Full)** | P0 | 5 | Spec Complete |
| **Continuous Monitoring** | P1 | 5 | Spec Complete |
| **Complete DORA Coverage** | P0 | 5 | Spec Complete |
| **Board Reporting Export** | P1 | 5 | Spec Complete |

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
| **5: Critical Improvements** | 17-24 | Market Leadership | Full DORA coverage, Continuous Monitoring, 10X Features |

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

### 8.4 Phase 5: Critical Improvements (Priority - Q1 2025)

> **Status:** NEXT PRIORITY
> **Gap Analysis:** See `/docs/analysis/CRITICAL-GAP-ANALYSIS-2025.md`
> **Last Updated:** January 5, 2026

Phase 5 addresses critical gaps identified through competitive analysis and regulatory accuracy review. These improvements are essential for market leadership and full DORA compliance.

#### 8.4.1 Priority 1: Regulatory Compliance (Must-Have)

| # | Feature | Effort | Impact | Deadline |
|---|---------|--------|--------|----------|
| 5.1.1 | **SOC2-to-RoI Auto-Population** | 3 weeks | 10X Differentiator | April 30, 2026 |
| 5.1.2 | **Incident Reporting Workflow** | 2 weeks | Critical | Active |
| 5.1.3 | **Complete DORA Article Coverage** (Art. 33-44) | 1 week | High | Immediate |
| 5.1.4 | **Entity Type Differentiation** | 1 week | High | Immediate |

#### 8.4.2 Priority 2: Competitive Parity

| # | Feature | Effort | Impact |
|---|---------|--------|--------|
| 5.2.1 | **Continuous Monitoring Integration** (SecurityScorecard/BitSight) | 2 weeks | High |
| 5.2.2 | **Contract Clause Analyzer** (Art. 30 compliance) | 2 weeks | High |
| 5.2.3 | **Concentration Risk Dashboard** | 1 week | Medium |
| 5.2.4 | **PDF Split View Verification** | 1 week | Medium |
| 5.2.5 | **Board Reporting Export** (PDF/PPTX) | 1 week | Medium |

#### 8.4.3 Priority 3: Market Leadership

| # | Feature | Effort | Impact |
|---|---------|--------|--------|
| 5.3.1 | **Fourth-Party Risk Mapping** (Visual supply chain) | 2 weeks | High |
| 5.3.2 | **AI Gap Remediation Suggestions** | 1 week | Medium |
| 5.3.3 | **Historical Maturity Tracking** | 1 week | Medium |
| 5.3.4 | **Multi-Framework Mapping** (NIS2, GDPR, ISO 27001) | 3 weeks | High |

---

## 8.5 Module Specifications: Phase 5

### 8.5.1 SOC2-to-RoI Auto-Population (10X Differentiator)

**Purpose:** One-click generation of ESA-compliant Register of Information from parsed SOC 2 reports

**Why This Is 10X:**
- **No competitor does this automatically**
- OneTrust/Prevalent require manual RoI population
- Reduces RoI generation from 4 weeks → 4 hours

**Technical Specification:**

```typescript
interface SOC2ToRoIMapping {
  // Extract from parsed SOC 2
  vendorName: string;           // → B_02.01 Provider identification
  vendorLEI?: string;           // → B_02.01 LEI (validate via GLEIF)
  auditFirm: string;            // → B_02.01 Additional info
  reportPeriod: {
    start: Date;                // → B_03.01 Contract period validation
    end: Date;
  };

  // Extract subservice orgs → B_06.01 Subcontractors
  subserviceOrgs: Array<{
    name: string;               // → subcontractor_name
    service: string;            // → service_description
    inclusionMethod: string;    // → 'inclusive' | 'carve_out'
  }>;

  // Extract from SOC 2 scope → B_04.01 ICT Services
  systemDescription: string;    // → service_description
  criteria: string[];           // → Maps to service_type

  // Data locations (if mentioned) → B_04.02
  dataLocations?: Array<{
    country: string;            // ISO 3166-1
    dataCenter?: string;
  }>;
}

// Auto-population workflow
async function populateRoIFromSOC2(
  documentId: string,
  vendorId: string
): Promise<RoIPopulationResult> {
  // 1. Get parsed SOC 2 data
  const parsedData = await getParsedSOC2(documentId);

  // 2. Validate LEI via GLEIF
  if (parsedData.vendorLEI) {
    await validateLEI(parsedData.vendorLEI);
  }

  // 3. Map to RoI templates
  const roiData = mapSOC2ToRoI(parsedData);

  // 4. Validate against ESA rules
  const validation = await validateRoIData(roiData);

  // 5. Store in RoI tables (B_02.01, B_04.01, B_06.01)
  await populateRoITables(vendorId, roiData);

  return {
    templatesPopulated: ['B_02.01', 'B_04.01', 'B_04.02', 'B_06.01'],
    fieldsPopulated: roiData.fieldsCount,
    validationWarnings: validation.warnings,
    manualReviewRequired: validation.requiresReview,
  };
}
```

**UI Flow:**

```
SOC 2 Analysis Page
    │
    └─── [New Button] "Auto-Populate RoI"
              │
              ▼
         ┌─────────────────────────────────┐
         │   RoI Population Preview        │
         │                                 │
         │   ✓ Provider: AWS Inc.          │
         │   ✓ LEI: 5493001KJTIIGC8Y1R12   │
         │   ✓ Services: 3 detected        │
         │   ⚠ Data Locations: 2 (verify)  │
         │   ✓ Subcontractors: 4 detected  │
         │                                 │
         │   [Review & Confirm] [Cancel]   │
         └─────────────────────────────────┘
              │
              ▼
         RoI Dashboard (pre-populated)
```

**Database Changes:**

```sql
-- Migration 010: SOC2 to RoI mapping
CREATE TABLE soc2_roi_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id),
  vendor_id UUID REFERENCES vendors(id),
  organization_id UUID REFERENCES organizations(id),

  -- Mapping results
  templates_populated TEXT[] NOT NULL,
  fields_populated INTEGER NOT NULL,
  auto_populated_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id),

  -- Validation
  validation_warnings JSONB DEFAULT '[]',
  requires_manual_review BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 8.5.2 Incident Reporting Workflow (DORA Art. 17-23)

**Purpose:** Full compliance with DORA ICT incident reporting requirements

**Regulatory Reference:**
- DORA Articles 17-23
- EU Regulation 2025/302 (ITS on incident reporting)
- ESA Annex I notification template

**Three-Stage Reporting System:**

| Report | Deadline | Mandatory Fields | Full Fields |
|--------|----------|------------------|-------------|
| **Initial** | 4h from classification (max 24h from detection) | 7 | 59 |
| **Intermediate** | 72h from initial | 59 | 59 |
| **Final** | 30 days (or when root cause complete) | 59 | 59 |

**Classification Thresholds (EU 2024/1772):**

```typescript
interface IncidentClassificationCriteria {
  // ANY of these triggers "MAJOR" classification
  major: {
    clientsAffectedPercentage: 10;        // >10% of total clients
    clientsAffectedCount: 100000;         // >100,000 clients
    durationCriticalHours: 2;             // >2 hours for critical services
    geographicSpread: 2;                  // >2 EU member states
    economicImpactEUR: 100000;            // >€100,000 direct costs
    transactionsAffectedPercentage: 10;   // >10% of daily transactions
    dataBreach: true;                     // Any personal data breach
    reputationalImpact: 'high';           // Significant media coverage
  };

  // Below major but material impact
  significant: {
    operationalImpact: 'material';
    recoveryTimeHours: 4;
  };

  // Limited impact
  minor: {
    internalOnly: true;
  };
}
```

**Workflow State Machine:**

```
┌──────────────┐
│   DRAFT      │
└──────┬───────┘
       │ Classify
       ▼
┌──────────────┐     4h timer
│   DETECTED   │◄─────────────────┐
└──────┬───────┘                  │
       │ Submit Initial           │ Auto-alert if overdue
       ▼                          │
┌──────────────┐                  │
│   INITIAL    │──────────────────┘
│   SUBMITTED  │
└──────┬───────┘
       │ 72h timer
       ▼
┌──────────────┐
│ INTERMEDIATE │
│   SUBMITTED  │
└──────┬───────┘
       │ 30d timer (or root cause complete)
       ▼
┌──────────────┐
│    FINAL     │
│   SUBMITTED  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│    CLOSED    │
└──────────────┘
```

**Data Model Extension:**

```typescript
interface IncidentReportContent {
  // ESA Annex I Template Fields (7 mandatory for initial)
  mandatory: {
    incidentReference: string;           // Auto-generated
    detectionDateTime: Date;
    classificationJustification: string;
    shortDescription: string;
    servicesAffected: string[];
    initialMitigation: string;
    estimatedImpact: 'high' | 'medium' | 'low';
  };

  // Full template (59 fields for intermediate/final)
  full: {
    // Timeline
    occurrenceDateTime?: Date;
    recoveryDateTime?: Date;
    resolutionDateTime?: Date;

    // Impact metrics
    clientsAffectedCount?: number;
    clientsAffectedPercentage?: number;
    transactionsAffectedCount?: number;
    transactionsValueAffected?: number;
    economicImpact?: number;

    // Root cause (required for final)
    rootCauseAnalysis?: string;
    attackVector?: string;
    vulnerabilitiesExploited?: string[];

    // Remediation
    remediationActions?: string;
    lessonsLearned?: string;
    preventiveMeasures?: string;

    // Third-party involvement
    thirdPartyInvolved?: boolean;
    vendorId?: string;
    vendorNotified?: boolean;
    vendorNotificationDate?: Date;
  };
}
```

**UI Components:**

```
/incidents                     → Incident list with status badges
/incidents/new                 → New incident wizard
/incidents/[id]                → Incident detail with timeline
/incidents/[id]/report/initial → Initial report form (7 fields)
/incidents/[id]/report/intermediate → Intermediate report (full)
/incidents/[id]/report/final   → Final report with root cause
```

---

### 8.5.3 Continuous Monitoring Integration

**Purpose:** Real-time vendor cyber risk ratings via external APIs

**Supported Providers:**

| Provider | API Type | Key Features | Cost Tier |
|----------|----------|--------------|-----------|
| **SecurityScorecard** | REST | 10 risk factors, A-F rating | $$$$  |
| **BitSight** | REST | Security ratings, industry benchmarks | $$$$ |
| **RiskRecon** (OneTrust) | REST | Third-party risk data | $$$$ |

**Integration Architecture:**

```typescript
// Generic provider interface
interface CyberRatingProvider {
  name: string;
  authenticate(): Promise<void>;
  getVendorRating(domain: string): Promise<VendorRating>;
  getAlerts(since: Date): Promise<Alert[]>;
  subscribeToChanges(domain: string): Promise<Subscription>;
}

interface VendorRating {
  provider: string;
  domain: string;
  overallScore: number;           // 0-100 or letter grade
  ratingDate: Date;

  // Risk factor breakdown
  factors: Array<{
    name: string;                 // e.g., "Network Security"
    score: number;
    grade: string;
    issues: number;
  }>;

  // Trend
  trend: 'improving' | 'stable' | 'declining';
  scoreChange30d?: number;

  // Industry comparison
  industryAverage?: number;
  percentile?: number;
}

// SecurityScorecard implementation
class SecurityScorecardProvider implements CyberRatingProvider {
  private apiToken: string;
  private baseUrl = 'https://api.securityscorecard.io';

  async getVendorRating(domain: string): Promise<VendorRating> {
    const response = await fetch(
      `${this.baseUrl}/companies/${domain}`,
      { headers: { Authorization: `Token ${this.apiToken}` } }
    );
    return this.mapToVendorRating(await response.json());
  }
}

// BitSight implementation
class BitSightProvider implements CyberRatingProvider {
  private apiToken: string;
  private baseUrl = 'https://api.bitsighttech.com/ratings/v1';

  async getVendorRating(domain: string): Promise<VendorRating> {
    const response = await fetch(
      `${this.baseUrl}/companies`,
      {
        headers: { Authorization: `Basic ${btoa(this.apiToken + ':')}` },
        body: JSON.stringify({ domain })
      }
    );
    return this.mapToVendorRating(await response.json());
  }
}
```

**Database Schema:**

```sql
-- Migration 011: Continuous monitoring
CREATE TABLE vendor_cyber_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id),
  organization_id UUID REFERENCES organizations(id),

  -- Rating data
  provider TEXT NOT NULL,         -- 'securityscorecard', 'bitsight'
  domain TEXT NOT NULL,
  overall_score INTEGER,          -- 0-100
  grade TEXT,                     -- 'A', 'B', 'C', etc.
  rating_date TIMESTAMPTZ NOT NULL,

  -- Breakdown
  factors JSONB DEFAULT '[]',

  -- Trend
  score_change_30d INTEGER,
  trend TEXT,                     -- 'improving', 'stable', 'declining'

  -- Industry comparison
  industry_average INTEGER,
  percentile INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE vendor_rating_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendors(id),
  organization_id UUID REFERENCES organizations(id),

  provider TEXT NOT NULL,
  alert_type TEXT NOT NULL,       -- 'score_drop', 'new_vulnerability', 'breach_reported'
  severity TEXT NOT NULL,         -- 'critical', 'high', 'medium', 'low'
  title TEXT NOT NULL,
  description TEXT,

  -- Status
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES users(id),
  resolved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_vendor_cyber_ratings_vendor ON vendor_cyber_ratings(vendor_id, rating_date DESC);
CREATE INDEX idx_vendor_rating_alerts_unread ON vendor_rating_alerts(organization_id)
  WHERE acknowledged_at IS NULL;
```

**Sync Schedule:**

```typescript
// Cron job: Daily rating sync
async function syncVendorRatings() {
  const vendors = await getActiveVendorsWithDomains();

  for (const vendor of vendors) {
    // Rate limit: 100 requests/minute
    await rateLimiter.acquire();

    const rating = await provider.getVendorRating(vendor.domain);

    // Check for significant changes
    const previousRating = await getLatestRating(vendor.id);
    if (hasSignificantChange(previousRating, rating)) {
      await createAlert(vendor.id, rating);
    }

    await saveRating(vendor.id, rating);
  }
}

function hasSignificantChange(previous: VendorRating, current: VendorRating): boolean {
  // Alert on >10 point drop or grade change
  return (
    (previous.overallScore - current.overallScore) > 10 ||
    previous.grade !== current.grade
  );
}
```

---

### 8.5.4 Complete DORA Article Coverage (Art. 33-44)

**Purpose:** Add missing TPRM pillar requirements for full DORA compliance

**Current Coverage:** 22 articles (34% of 64 total)
**Target Coverage:** 64 articles (100%)

**Missing Articles to Add:**

```typescript
// Add to dora-requirements-data.ts
const ADDITIONAL_DORA_REQUIREMENTS: DORARequirement[] = [
  // TPRM Pillar - Critical ICT Third-Party Provider Oversight
  {
    id: 'dora-art-31',
    article_number: 'Art. 31',
    article_title: 'Designation of Critical ICT Third-Party Providers',
    pillar: 'TPRM',
    requirement_text: 'ESAs shall designate ICT third-party service providers as critical based on systemic importance to financial entities...',
    evidence_needed: [
      'CTPP assessment documentation',
      'Systemic importance analysis',
      'ESA notification records'
    ],
    is_mandatory: true,
    applies_to: ['ctpp'],
    priority: 'critical',
    soc2_mappings: [],  // No SOC 2 equivalent
    gap_if_missing: 'No CTPP designation process. Entity may be subject to ESA oversight without preparation.'
  },
  {
    id: 'dora-art-33',
    article_number: 'Art. 33',
    article_title: 'Tasks of the Lead Overseer',
    pillar: 'TPRM',
    requirement_text: 'Lead Overseer shall assess comprehensive ICT risk management arrangements of CTPPs...',
    evidence_needed: [
      'ICT security assessment reports',
      'Physical security documentation',
      'Risk management policies',
      'Governance structure documentation',
      'Incident reporting procedures'
    ],
    is_mandatory: true,
    applies_to: ['ctpp'],
    priority: 'critical',
    soc2_mappings: ['CC1', 'CC6', 'CC7'],
    gap_if_missing: 'CTPPs must demonstrate comprehensive ICT risk management to Lead Overseer.'
  },
  {
    id: 'dora-art-35',
    article_number: 'Art. 35',
    article_title: 'Powers of the Lead Overseer',
    pillar: 'TPRM',
    requirement_text: 'Lead Overseer may issue recommendations on ICT security requirements, processes, patches, updates, encryption...',
    evidence_needed: [
      'Response to Lead Overseer recommendations',
      'Remediation action plans',
      'Compliance timelines'
    ],
    is_mandatory: true,
    applies_to: ['ctpp'],
    priority: 'critical',
    penalty_for_non_compliance: 'Up to 1% of average worldwide daily turnover',
    soc2_mappings: [],
    gap_if_missing: 'Non-compliance with Lead Overseer recommendations may result in daily penalty payments.'
  },
  // ... Additional articles 32, 34, 36-44
];
```

**Entity Type Differentiation:**

```typescript
type EntityType = 'significant' | 'non_significant' | 'ctpp';

interface EntityClassification {
  type: EntityType;

  // Different requirements per type
  requirements: {
    tlptMandatory: boolean;           // Only for significant
    tlptFrequency?: '3_years';
    roiRequired: boolean;             // All types
    incidentReporting: boolean;       // All types
    leadOverseerOversight: boolean;   // Only for ctpp
  };
}

// Add to organization settings
interface OrganizationSettings {
  // ... existing fields

  // DORA entity classification
  doraEntityType: EntityType;
  doraClassificationDate?: Date;
  doraClassificationJustification?: string;
}
```

---

### 8.5.5 UI Improvements

**A. PDF Split View Verification:**

```tsx
// New component: src/components/documents/split-verification-view.tsx
export function SplitVerificationView({
  documentId,
  parsedData,
}: {
  documentId: string;
  parsedData: ParsedSOC2;
}) {
  return (
    <div className="grid grid-cols-2 gap-4 h-[80vh]">
      {/* Left: PDF Viewer */}
      <div className="border rounded-lg overflow-hidden">
        <PDFViewer
          url={`/api/documents/${documentId}/pdf`}
          highlights={parsedData.pageReferences}
        />
      </div>

      {/* Right: Verification Checklist */}
      <div className="overflow-y-auto">
        <VerificationChecklist
          extractedData={parsedData}
          onJumpToPage={(page) => pdfViewer.goToPage(page)}
        />
      </div>
    </div>
  );
}
```

**B. DORA Deadline Countdown:**

```tsx
// src/components/compliance/dora-deadline-widget.tsx
export function DORADeadlineWidget() {
  const roiDeadline = new Date('2026-04-30');
  const daysRemaining = differenceInDays(roiDeadline, new Date());

  return (
    <Card className={cn(
      'p-4',
      daysRemaining <= 30 && 'border-destructive bg-destructive/5'
    )}>
      <div className="flex items-center gap-3">
        <Clock className="h-8 w-8 text-primary" />
        <div>
          <p className="text-sm text-muted-foreground">RoI Submission Deadline</p>
          <p className="text-2xl font-bold">{daysRemaining} days</p>
          <p className="text-xs text-muted-foreground">April 30, 2026</p>
        </div>
      </div>
    </Card>
  );
}
```

**C. Board Reporting Export:**

```typescript
// src/lib/exports/board-report.ts
export async function generateBoardReport(
  organizationId: string,
  options: {
    format: 'pdf' | 'pptx';
    includeVendorList: boolean;
    includeRiskScores: boolean;
    includeDORACompliance: boolean;
  }
): Promise<Blob> {
  // Generate executive summary
  const summary = await getExecutiveSummary(organizationId);

  // Generate charts
  const charts = {
    riskDistribution: await getRiskDistributionChart(),
    complianceTrend: await getComplianceTrendChart(),
    vendorTierBreakdown: await getVendorTierChart(),
    doraMaturity: await getDORAMaturityChart(),
  };

  // Generate report
  if (options.format === 'pdf') {
    return generatePDFReport(summary, charts);
  } else {
    return generatePPTXReport(summary, charts);
  }
}
```

---

### 8.5.6 Phase 5 Implementation Timeline

```
Week 17-18: SOC2-to-RoI Auto-Population
├── Day 1-3: Design mapping schema
├── Day 4-6: Implement SOC2→RoI field mapping
├── Day 7-8: Build preview UI
├── Day 9-10: Add GLEIF LEI validation
└── Testing + Documentation

Week 19-20: Incident Reporting Workflow
├── Day 1-2: State machine implementation
├── Day 3-5: ESA template forms (Initial, Intermediate, Final)
├── Day 6-7: Classification logic
├── Day 8-9: Deadline timers + notifications
└── Day 10: Submission workflow

Week 21-22: Continuous Monitoring
├── Day 1-3: Provider interface + SecurityScorecard integration
├── Day 4-5: BitSight integration
├── Day 6-7: Alert system
├── Day 8-10: Dashboard widgets + sync jobs

Week 23: Complete DORA Coverage
├── Day 1-2: Add Art. 31-44 requirements
├── Day 3-4: Entity type differentiation
├── Day 5: Update gap analysis algorithm

Week 24: UI Polish + Market Differentiators
├── Day 1-2: PDF split view
├── Day 3-4: Board reporting export
├── Day 5: DORA deadline widgets
└── Final testing + documentation
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
| **CTPP** | Critical Third-Party Provider - ICT provider designated by ESAs for oversight |
| **Lead Overseer** | ESA appointed to supervise a specific CTPP |
| **JON** | Joint Oversight Network - coordination body for CTPP oversight |
| **TLPT** | Threat-Led Penetration Testing - mandatory for significant entities |
| **NIS2** | Network and Information Security Directive 2 (EU 2022/2555) |
| **ESA** | European Supervisory Authority (EBA, ESMA, EIOPA) |
| **EU 2024/1772** | RTS on incident classification criteria |
| **EU 2025/302** | ITS on incident reporting templates |

---

**Document Maintained By:** Project Orchestrator
**Last Full Review:** 2024-12-29
**Next Review:** Weekly during active development
