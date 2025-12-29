# New Features Implementation Specification

**Document Status:** Draft
**Last Updated:** 2024-12-29
**Priority:** P0-P2 features for DORA compliance completeness

---

## Executive Summary

This document specifies implementation plans for critical features identified through regulatory research and competitor analysis. These features are **essential for DORA compliance** and represent **10X improvement opportunities** over existing TPRM solutions.

### Feature Priority Matrix

| Feature | Priority | Regulatory Mandate | Competitive Edge | Phase |
|---------|----------|-------------------|------------------|-------|
| **Incident Reporting Module** | P0 | DORA Art. 19 | First to market | 2 |
| **Enhanced RoI Engine (15 templates)** | P0 | ESA ITS 2024/2956 | Full compliance | 3 |
| **Cross-Framework Mapping** | P1 | Efficiency | 10X faster | 2-3 |
| **Contract Analysis AI** | P1 | DORA Art. 30 | AI automation | 4+ |
| **Enhanced 4th Party Module** | P1 | DORA Art. 28(8) | Supply chain visibility | 4 |
| **DORA Trust Exchange** | P2 | Network effects | Category creation | 5+ |

---

## 1. Incident Reporting Module (P0 - CRITICAL)

### 1.1 Regulatory Background

DORA Article 19 mandates ICT-related incident classification and reporting with strict timelines:

| Report Type | Timeline | Content |
|-------------|----------|---------|
| **Initial Notification** | Within 4 hours | Basic incident identification |
| **Intermediate Report** | Within 72 hours | Detailed impact assessment |
| **Final Report** | Within 1 month | Root cause, remediation |

**Classification Criteria (EU 2024/1772, 2025/301-302):**
- **Major Incident** = Critical services affected + (data breach OR 2+ materiality thresholds)
- Materiality thresholds: clients affected, transactions, duration, geographic spread, economic impact

### 1.2 Database Schema

```sql
-- ============================================
-- INCIDENT REPORTING TABLES
-- ============================================

-- Main incidents table
CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Identification
  incident_ref TEXT NOT NULL, -- Internal reference (auto-generated)
  external_ref TEXT, -- Regulator reference (after submission)

  -- Classification
  classification TEXT NOT NULL CHECK (classification IN ('major', 'significant', 'minor')),
  incident_type TEXT NOT NULL CHECK (incident_type IN (
    'cyber_attack', 'system_failure', 'human_error',
    'third_party_failure', 'natural_disaster', 'other'
  )),

  -- Status tracking
  status TEXT NOT NULL CHECK (status IN (
    'draft', 'detected', 'initial_submitted',
    'intermediate_submitted', 'final_submitted', 'closed'
  )) DEFAULT 'draft',

  -- Timeline
  detection_datetime TIMESTAMPTZ NOT NULL,
  occurrence_datetime TIMESTAMPTZ,
  recovery_datetime TIMESTAMPTZ,
  resolution_datetime TIMESTAMPTZ,

  -- Impact assessment
  services_affected TEXT[] DEFAULT '{}',
  critical_functions_affected TEXT[] DEFAULT '{}',
  clients_affected_count INTEGER,
  clients_affected_percentage FLOAT,
  transactions_affected_count INTEGER,
  transactions_value_affected DECIMAL(18,2),
  data_breach BOOLEAN DEFAULT FALSE,
  data_records_affected INTEGER,
  geographic_spread TEXT[] DEFAULT '{}', -- Country codes
  economic_impact DECIMAL(18,2),
  reputational_impact TEXT CHECK (reputational_impact IN ('low', 'medium', 'high')),

  -- Description
  title TEXT NOT NULL,
  description TEXT,
  root_cause TEXT,
  remediation_actions TEXT,
  lessons_learned TEXT,

  -- Vendor linkage (for third-party incidents)
  vendor_id UUID REFERENCES vendors(id),

  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Incident reports (submissions to regulators)
CREATE TABLE incident_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,

  -- Report type
  report_type TEXT NOT NULL CHECK (report_type IN ('initial', 'intermediate', 'final')),
  version INTEGER NOT NULL DEFAULT 1,

  -- Submission
  status TEXT NOT NULL CHECK (status IN ('draft', 'ready', 'submitted', 'acknowledged')) DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMPTZ,

  -- Content (structured per ESA template)
  report_content JSONB NOT NULL DEFAULT '{}',

  -- Deadlines
  deadline TIMESTAMPTZ NOT NULL,
  is_overdue BOOLEAN GENERATED ALWAYS AS (
    status NOT IN ('submitted', 'acknowledged') AND NOW() > deadline
  ) STORED,

  -- Export
  export_format TEXT CHECK (export_format IN ('pdf', 'xml', 'json')),
  export_path TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Incident timeline events
CREATE TABLE incident_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,

  event_type TEXT NOT NULL CHECK (event_type IN (
    'created', 'classified', 'escalated', 'updated',
    'report_submitted', 'report_acknowledged',
    'mitigation_started', 'service_restored', 'resolved', 'closed'
  )),
  event_datetime TIMESTAMPTZ DEFAULT NOW(),
  description TEXT,
  user_id UUID REFERENCES users(id),
  metadata JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX idx_incidents_organization ON incidents(organization_id);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_classification ON incidents(classification);
CREATE INDEX idx_incidents_detection ON incidents(detection_datetime);
CREATE INDEX idx_incident_reports_incident ON incident_reports(incident_id);
CREATE INDEX idx_incident_reports_deadline ON incident_reports(deadline) WHERE status NOT IN ('submitted', 'acknowledged');

-- RLS Policies
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view org incidents"
  ON incidents FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can create org incidents"
  ON incidents FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update org incidents"
  ON incidents FOR UPDATE
  USING (organization_id = get_user_organization_id());

-- Similar policies for incident_reports and incident_events
```

### 1.3 API Design

```typescript
// Types
interface Incident {
  id: string;
  organizationId: string;
  incidentRef: string;
  externalRef?: string;
  classification: 'major' | 'significant' | 'minor';
  incidentType: IncidentType;
  status: IncidentStatus;
  detectionDatetime: Date;
  occurrenceDatetime?: Date;
  recoveryDatetime?: Date;
  resolutionDatetime?: Date;
  servicesAffected: string[];
  criticalFunctionsAffected: string[];
  clientsAffectedCount?: number;
  dataBreach: boolean;
  vendorId?: string;
  title: string;
  description?: string;
  rootCause?: string;
  remediationActions?: string;
}

interface IncidentReport {
  id: string;
  incidentId: string;
  reportType: 'initial' | 'intermediate' | 'final';
  version: number;
  status: 'draft' | 'ready' | 'submitted' | 'acknowledged';
  deadline: Date;
  isOverdue: boolean;
  reportContent: ESAReportContent;
  submittedAt?: Date;
}

// API Endpoints
// List incidents with filtering
GET /api/incidents?status=detected&classification=major&page=1

// Create new incident (auto-classifies)
POST /api/incidents
{
  "title": "Database outage affecting customer portal",
  "description": "PostgreSQL primary node became unresponsive...",
  "incidentType": "system_failure",
  "detectionDatetime": "2025-01-15T14:30:00Z",
  "servicesAffected": ["customer_portal", "api_gateway"],
  "criticalFunctionsAffected": ["payment_processing"],
  "clientsAffectedCount": 5000,
  "dataBreach": false
}

Response: {
  "id": "uuid",
  "incidentRef": "INC-2025-001",
  "classification": "major", // Auto-classified based on criteria
  "status": "detected",
  "reports": [
    {
      "reportType": "initial",
      "status": "draft",
      "deadline": "2025-01-15T18:30:00Z" // 4 hours from detection
    }
  ]
}

// Get incident with reports
GET /api/incidents/{id}

// Update incident
PATCH /api/incidents/{id}

// Auto-classify incident
POST /api/incidents/{id}/classify

// Get/Update specific report
GET /api/incidents/{id}/reports/{reportType}
PATCH /api/incidents/{id}/reports/{reportType}

// Submit report to regulator
POST /api/incidents/{id}/reports/{reportType}/submit

// Export report
POST /api/incidents/{id}/reports/{reportType}/export
{
  "format": "pdf" | "xml"
}
```

### 1.4 Classification Algorithm

```typescript
// src/lib/incidents/classifier.ts

interface ClassificationInput {
  servicesAffected: string[];
  criticalFunctionsAffected: string[];
  clientsAffectedCount?: number;
  clientsAffectedPercentage?: number;
  transactionsAffectedCount?: number;
  transactionsValueAffected?: number;
  dataBreach: boolean;
  dataRecordsAffected?: number;
  geographicSpread?: string[];
  economicImpact?: number;
  durationHours?: number;
}

interface ClassificationResult {
  classification: 'major' | 'significant' | 'minor';
  reasoning: string[];
  materialityThresholds: {
    criterion: string;
    threshold: string;
    actual: string;
    exceeded: boolean;
  }[];
}

export function classifyIncident(input: ClassificationInput): ClassificationResult {
  const thresholds = [];
  const reasoning = [];

  // Check if critical functions affected
  const criticalAffected = input.criticalFunctionsAffected.length > 0;

  // Materiality threshold checks (per EU 2024/1772)
  const clientThreshold = {
    criterion: 'Clients Affected',
    threshold: '>10% or >100,000',
    actual: `${input.clientsAffectedPercentage || 0}% / ${input.clientsAffectedCount || 0}`,
    exceeded: (input.clientsAffectedPercentage || 0) > 10 || (input.clientsAffectedCount || 0) > 100000
  };

  const durationThreshold = {
    criterion: 'Duration',
    threshold: '>2 hours for critical services',
    actual: `${input.durationHours || 0} hours`,
    exceeded: criticalAffected && (input.durationHours || 0) > 2
  };

  const geographicThreshold = {
    criterion: 'Geographic Spread',
    threshold: '>2 EU member states',
    actual: `${input.geographicSpread?.length || 0} countries`,
    exceeded: (input.geographicSpread?.length || 0) > 2
  };

  const economicThreshold = {
    criterion: 'Economic Impact',
    threshold: '>€100,000 direct costs',
    actual: `€${input.economicImpact || 0}`,
    exceeded: (input.economicImpact || 0) > 100000
  };

  thresholds.push(clientThreshold, durationThreshold, geographicThreshold, economicThreshold);

  const exceededCount = thresholds.filter(t => t.exceeded).length;

  // Classification logic
  // Major = Critical services + (data breach OR 2+ materiality thresholds)
  if (criticalAffected && (input.dataBreach || exceededCount >= 2)) {
    reasoning.push('Critical functions affected');
    if (input.dataBreach) reasoning.push('Data breach confirmed');
    if (exceededCount >= 2) reasoning.push(`${exceededCount} materiality thresholds exceeded`);

    return {
      classification: 'major',
      reasoning,
      materialityThresholds: thresholds
    };
  }

  // Significant = 1 materiality threshold exceeded
  if (exceededCount >= 1) {
    reasoning.push(`${exceededCount} materiality threshold(s) exceeded`);
    return {
      classification: 'significant',
      reasoning,
      materialityThresholds: thresholds
    };
  }

  // Minor = Below all thresholds
  reasoning.push('Below all materiality thresholds');
  return {
    classification: 'minor',
    reasoning,
    materialityThresholds: thresholds
  };
}
```

### 1.5 User Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        INCIDENT REPORTING WORKFLOW                           │
└─────────────────────────────────────────────────────────────────────────────┘

1. INCIDENT DETECTION
   ┌─────────────────┐
   │ User clicks     │
   │ "Report         │──────► Quick-capture form
   │  Incident"      │        - Title
   └─────────────────┘        - Type (dropdown)
                              - When detected
                              - Services affected (auto-complete from vendors)
                              - Brief description
                                      │
                                      ▼
2. AUTO-CLASSIFICATION
   ┌─────────────────────────────────────────────────────────┐
   │  System analyzes input and suggests classification:      │
   │                                                          │
   │  ⚠️ MAJOR INCIDENT                                       │
   │  Reason: Critical function "Payment Processing" affected │
   │         + 2 materiality thresholds exceeded              │
   │                                                          │
   │  Deadlines:                                              │
   │  • Initial report due: 4 hours (14:30 today)            │
   │  • Intermediate report: 72 hours (Jan 18, 10:30)        │
   │  • Final report: 1 month (Feb 15)                       │
   │                                                          │
   │  [Confirm Classification] [Override to Significant]      │
   └─────────────────────────────────────────────────────────┘
                              │
                              ▼
3. GUIDED REPORT CREATION
   ┌─────────────────────────────────────────────────────────┐
   │  INITIAL REPORT (Due in 3h 45m)                         │
   │                                                          │
   │  Section 1: Incident Identification  ✓ Complete         │
   │  Section 2: Impact Assessment        ◐ In Progress      │
   │  Section 3: Initial Response         ○ Not Started      │
   │                                                          │
   │  Progress: ████████░░░░░░░░ 45%                         │
   │                                                          │
   │  AI Suggestions:                                         │
   │  💡 Based on similar incidents, consider:               │
   │     - Notifying affected clients within 24h             │
   │     - Engaging third-party forensics                    │
   │                                                          │
   │  [Save Draft] [Preview] [Submit to Regulator]           │
   └─────────────────────────────────────────────────────────┘
                              │
                              ▼
4. DASHBOARD & TRACKING
   ┌─────────────────────────────────────────────────────────┐
   │  INCIDENT CENTER                                         │
   │                                                          │
   │  ┌─────────────────────────────────────────────────────┐│
   │  │ 🔴 OVERDUE    │ 🟡 DUE TODAY  │ ✅ ON TRACK        ││
   │  │     1         │      2        │      5             ││
   │  └─────────────────────────────────────────────────────┘│
   │                                                          │
   │  Recent Incidents:                                       │
   │  ┌────────────────────────────────────────────────────┐ │
   │  │ INC-2025-001 │ Database Outage │ MAJOR │ Initial   │ │
   │  │              │                 │       │ ⏰ 2h left │ │
   │  ├────────────────────────────────────────────────────┤ │
   │  │ INC-2025-002 │ API Latency    │ SIG   │ Complete   │ │
   │  └────────────────────────────────────────────────────┘ │
   └─────────────────────────────────────────────────────────┘
```

### 1.6 Integration Points

- **Vendor Module**: Link incidents to third-party providers
- **Risk Scoring**: Incidents affect vendor risk scores
- **RoI Export**: Incident history included in register
- **Notifications**: Email/Slack alerts for deadlines
- **Audit Log**: All incident actions logged for compliance

---

## 2. Enhanced RoI Engine (P0)

### 2.1 ESA Template Structure

The full Register of Information requires 15 interconnected templates per ESA ITS 2024/2956:

| Template | Description | Dependencies |
|----------|-------------|--------------|
| **B_01.01** | Entity-level information | Base template |
| **B_01.02** | Branch information | B_01.01 |
| **B_01.03** | Entity responsible persons | B_01.01 |
| **B_02.01** | ICT third-party providers | B_01.01 |
| **B_02.02** | Provider responsible persons | B_02.01 |
| **B_02.03** | Provider branches/entities | B_02.01 |
| **B_03.01** | Contractual arrangements | B_01.01, B_02.01 |
| **B_03.02** | Contract responsible persons | B_03.01 |
| **B_03.03** | Contract scope | B_03.01 |
| **B_04.01** | ICT services received | B_03.01 |
| **B_04.02** | Service data locations | B_04.01 |
| **B_05.01** | Functions supported by services | B_04.01 |
| **B_05.02** | Function criticality assessment | B_05.01 |
| **B_06.01** | Subcontracting chain | B_02.01, B_04.01 |
| **B_07.01** | Intra-group arrangements | B_03.01 |

### 2.2 Database Schema Extensions

```sql
-- ============================================
-- ENHANCED ROI SCHEMA
-- ============================================

-- B_01.01 Entity Information (extends organizations)
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS
  roi_entity_data JSONB DEFAULT '{}';
-- Contains: competent_authorities, parent_entity_lei, group_structure, etc.

-- B_01.02 Branch Information
CREATE TABLE organization_branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id TEXT NOT NULL,
  country_code TEXT NOT NULL,
  branch_name TEXT NOT NULL,
  address JSONB,
  regulatory_status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- B_02.01 Enhanced Provider Data (extends vendors)
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS
  provider_type TEXT CHECK (provider_type IN (
    'ict_service_provider', 'cloud_service_provider',
    'data_centre', 'other'
  ));
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS
  headquarters_country TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS
  is_intra_group BOOLEAN DEFAULT FALSE;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS
  parent_provider_id UUID REFERENCES vendors(id);

-- B_03.01 Contractual Arrangements (enhanced)
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- Contract identification
  contract_ref TEXT NOT NULL,
  contract_type TEXT NOT NULL CHECK (contract_type IN (
    'master_agreement', 'service_agreement', 'sla',
    'nda', 'dpa', 'amendment', 'other'
  )),

  -- Dates
  signature_date DATE,
  effective_date DATE NOT NULL,
  expiry_date DATE,
  termination_notice_days INTEGER,

  -- DORA Article 30 provisions
  dora_provisions JSONB DEFAULT '{}', -- Tracks 21 mandatory clauses

  -- Contract value
  annual_value DECIMAL(18,2),
  currency TEXT DEFAULT 'EUR',

  -- Linked documents
  document_ids UUID[] DEFAULT '{}',

  -- Metadata
  status TEXT CHECK (status IN ('active', 'expiring', 'expired', 'terminated')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- B_04.01 ICT Services (enhanced)
CREATE TABLE ict_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,

  -- Service identification
  service_name TEXT NOT NULL,
  service_type TEXT NOT NULL CHECK (service_type IN (
    'cloud_computing', 'software', 'hardware',
    'network', 'security', 'data_management',
    'communication', 'other'
  )),
  service_subtype TEXT,

  -- Service details
  description TEXT,
  criticality_level TEXT CHECK (criticality_level IN ('critical', 'important', 'non_critical')),

  -- SLA metrics
  availability_target FLOAT,
  actual_availability FLOAT,
  rto_hours INTEGER,
  rpo_hours INTEGER,

  -- Personal data
  processes_personal_data BOOLEAN DEFAULT FALSE,
  personal_data_categories TEXT[],
  data_subjects TEXT[],

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- B_04.02 Data Locations
CREATE TABLE service_data_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID NOT NULL REFERENCES ict_services(id) ON DELETE CASCADE,

  location_type TEXT NOT NULL CHECK (location_type IN (
    'processing', 'storage', 'backup', 'disaster_recovery'
  )),
  country_code TEXT NOT NULL,
  region TEXT,
  provider_name TEXT,

  -- Data categories at this location
  data_categories TEXT[],

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- B_05.01 Functions Supported
CREATE TABLE critical_functions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  function_name TEXT NOT NULL,
  function_type TEXT,
  is_critical BOOLEAN DEFAULT FALSE,

  -- Criticality assessment
  criticality_assessment JSONB DEFAULT '{}',

  -- Linked services
  service_ids UUID[] DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- B_06.01 Subcontracting Chain
CREATE TABLE subcontractors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  service_id UUID REFERENCES ict_services(id) ON DELETE SET NULL,

  -- Subcontractor info
  subcontractor_name TEXT NOT NULL,
  subcontractor_lei TEXT,
  country_code TEXT,

  -- Chain position
  tier_level INTEGER NOT NULL DEFAULT 1, -- 1 = direct subcontractor, 2 = sub-subcontractor, etc.
  parent_subcontractor_id UUID REFERENCES subcontractors(id),

  -- Service provided
  service_description TEXT,

  -- Monitoring
  is_monitored BOOLEAN DEFAULT FALSE,
  last_assessment_date TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_contracts_organization ON contracts(organization_id);
CREATE INDEX idx_contracts_vendor ON contracts(vendor_id);
CREATE INDEX idx_contracts_expiry ON contracts(expiry_date);
CREATE INDEX idx_ict_services_contract ON ict_services(contract_id);
CREATE INDEX idx_ict_services_criticality ON ict_services(criticality_level);
CREATE INDEX idx_service_data_locations_service ON service_data_locations(service_id);
CREATE INDEX idx_subcontractors_vendor ON subcontractors(vendor_id);
CREATE INDEX idx_subcontractors_tier ON subcontractors(tier_level);
```

### 2.3 xBRL-CSV Export Engine

```typescript
// src/lib/roi/export.ts

interface XBRLExportOptions {
  organizationId: string;
  templates: TemplateId[];
  reportingDate: Date;
  validationLevel: 'strict' | 'lenient';
}

interface XBRLExportResult {
  files: {
    templateId: string;
    filename: string;
    content: string;
    recordCount: number;
    validationErrors: ValidationError[];
  }[];
  manifest: {
    reportingEntity: string;
    reportingDate: string;
    templateCount: number;
    totalRecords: number;
  };
}

export async function generateXBRLExport(
  options: XBRLExportOptions
): Promise<XBRLExportResult> {
  const files = [];

  for (const templateId of options.templates) {
    const generator = templateGenerators[templateId];
    const data = await generator.fetchData(options.organizationId);
    const validated = await generator.validate(data);
    const csv = generator.toCSV(validated, options.reportingDate);

    files.push({
      templateId,
      filename: `${templateId}_${formatDate(options.reportingDate)}.csv`,
      content: csv,
      recordCount: validated.records.length,
      validationErrors: validated.errors
    });
  }

  return {
    files,
    manifest: generateManifest(files, options)
  };
}

// Template-specific generators
const templateGenerators: Record<TemplateId, TemplateGenerator> = {
  'B_01.01': {
    fetchData: async (orgId) => {
      return supabase
        .from('organizations')
        .select('*, organization_branches(*)')
        .eq('id', orgId)
        .single();
    },
    validate: (data) => {
      const errors = [];
      if (!data.lei) errors.push({ field: 'lei', message: 'LEI is required' });
      if (!data.entity_type) errors.push({ field: 'entity_type', message: 'Entity type required' });
      // ... more validations per ESA Data Point Model v4.0
      return { records: [data], errors };
    },
    toCSV: (data, reportingDate) => {
      const headers = ESA_HEADERS['B_01.01'];
      const rows = data.records.map(r => [
        r.lei,
        r.name,
        r.entity_type,
        formatDate(reportingDate),
        // ... map all required fields
      ]);
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  },
  // ... generators for all 15 templates
};
```

### 2.4 Validation Rules Engine

```typescript
// src/lib/roi/validation.ts

interface ValidationRule {
  id: string;
  template: TemplateId;
  field: string;
  type: 'required' | 'format' | 'reference' | 'business' | 'cross_template';
  severity: 'error' | 'warning';
  validate: (value: any, context: ValidationContext) => ValidationResult;
  message: string;
}

// ESA-mandated validation rules
export const ESA_VALIDATION_RULES: ValidationRule[] = [
  // LEI format validation
  {
    id: 'LEI_FORMAT',
    template: 'B_01.01',
    field: 'entity_lei',
    type: 'format',
    severity: 'error',
    validate: (value) => ({
      valid: /^[A-Z0-9]{20}$/.test(value),
      value
    }),
    message: 'LEI must be exactly 20 alphanumeric characters'
  },

  // Contract-service relationship
  {
    id: 'CONTRACT_SERVICE_LINK',
    template: 'B_04.01',
    field: 'contract_id',
    type: 'reference',
    severity: 'error',
    validate: async (value, ctx) => {
      const contract = await ctx.lookupContract(value);
      return { valid: !!contract, value };
    },
    message: 'Service must reference a valid contract in B_03.01'
  },

  // Critical function assessment required
  {
    id: 'CRITICAL_FUNCTION_ASSESSMENT',
    template: 'B_05.01',
    field: 'criticality_assessment',
    type: 'business',
    severity: 'error',
    validate: (value, ctx) => {
      if (ctx.record.is_critical && !value) {
        return { valid: false, value };
      }
      return { valid: true, value };
    },
    message: 'Critical functions require criticality assessment'
  },

  // Cross-template: All providers must have contracts
  {
    id: 'PROVIDER_CONTRACT_EXISTS',
    template: 'B_02.01',
    field: 'provider_id',
    type: 'cross_template',
    severity: 'warning',
    validate: async (value, ctx) => {
      const contracts = await ctx.getContractsForProvider(value);
      return { valid: contracts.length > 0, value };
    },
    message: 'Provider should have at least one contractual arrangement in B_03.01'
  },

  // ... 50+ more validation rules per ESA specification
];
```

---

## 3. Cross-Framework Mapping (P1)

### 3.1 Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      CROSS-FRAMEWORK MAPPING ENGINE                          │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────────────────────┐
                    │         MAPPING DATABASE            │
                    │  ┌───────────────────────────────┐  │
                    │  │  SOC 2 TSC → DORA Articles    │  │
                    │  │  ISO 27001 → DORA Articles    │  │
                    │  │  SOC 2 ↔ ISO 27001            │  │
                    │  │  NIST CSF → All frameworks    │  │
                    │  └───────────────────────────────┘  │
                    └─────────────────┬───────────────────┘
                                      │
         ┌────────────────────────────┼────────────────────────────┐
         │                            │                            │
         ▼                            ▼                            ▼
┌─────────────────┐        ┌─────────────────┐        ┌─────────────────┐
│  SOC 2 Report   │        │ ISO 27001 Cert  │        │  DORA Controls  │
│  Parsed Data    │        │  Parsed Data    │        │   Required      │
└────────┬────────┘        └────────┬────────┘        └────────┬────────┘
         │                          │                          │
         └──────────────────────────┼──────────────────────────┘
                                    │
                                    ▼
                    ┌─────────────────────────────────────┐
                    │         GAP ANALYSIS ENGINE         │
                    │  ┌───────────────────────────────┐  │
                    │  │ • Coverage calculation        │  │
                    │  │ • Gap identification          │  │
                    │  │ • Remediation recommendations │  │
                    │  │ • Confidence scoring          │  │
                    │  └───────────────────────────────┘  │
                    └─────────────────────────────────────┘
```

### 3.2 Mapping Database Schema

```sql
-- ============================================
-- FRAMEWORK MAPPING TABLES
-- ============================================

-- Framework definitions
CREATE TABLE frameworks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL, -- 'soc2', 'iso27001', 'dora', 'nist_csf'
  name TEXT NOT NULL,
  version TEXT,
  effective_date DATE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Framework controls/requirements
CREATE TABLE framework_controls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  framework_id UUID NOT NULL REFERENCES frameworks(id) ON DELETE CASCADE,

  control_id TEXT NOT NULL, -- e.g., 'CC1.1', 'A.5.1', 'Art. 5'
  control_name TEXT NOT NULL,
  control_description TEXT,
  category TEXT,
  subcategory TEXT,

  -- For hierarchical controls
  parent_control_id UUID REFERENCES framework_controls(id),

  -- Metadata
  is_mandatory BOOLEAN DEFAULT TRUE,
  evidence_types TEXT[], -- Types of evidence that satisfy this control

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(framework_id, control_id)
);

-- Cross-framework mappings
CREATE TABLE control_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  source_control_id UUID NOT NULL REFERENCES framework_controls(id) ON DELETE CASCADE,
  target_control_id UUID NOT NULL REFERENCES framework_controls(id) ON DELETE CASCADE,

  -- Mapping strength
  mapping_type TEXT NOT NULL CHECK (mapping_type IN (
    'equivalent', -- 1:1 direct mapping
    'partial', -- Partially covers
    'supports', -- Provides supporting evidence
    'related' -- Conceptually related
  )),

  coverage_percentage INTEGER CHECK (coverage_percentage >= 0 AND coverage_percentage <= 100),

  -- Confidence in mapping
  confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),

  -- Notes
  mapping_notes TEXT,

  -- Source of mapping (ESA official, expert review, AI-generated)
  source TEXT CHECK (source IN ('regulatory', 'industry', 'expert', 'ai_generated')),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(source_control_id, target_control_id)
);

-- Vendor control assessments
CREATE TABLE vendor_control_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  control_id UUID NOT NULL REFERENCES framework_controls(id) ON DELETE CASCADE,

  -- Assessment result
  status TEXT NOT NULL CHECK (status IN (
    'met', 'partially_met', 'not_met', 'not_applicable', 'pending'
  )),

  -- Evidence
  evidence_document_id UUID REFERENCES documents(id),
  evidence_notes TEXT,

  -- Confidence (from AI extraction or manual review)
  confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),
  assessment_source TEXT CHECK (assessment_source IN ('ai_parsed', 'manual', 'questionnaire')),

  -- Review
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(vendor_id, control_id)
);

-- Indexes
CREATE INDEX idx_framework_controls_framework ON framework_controls(framework_id);
CREATE INDEX idx_control_mappings_source ON control_mappings(source_control_id);
CREATE INDEX idx_control_mappings_target ON control_mappings(target_control_id);
CREATE INDEX idx_vendor_control_assessments_vendor ON vendor_control_assessments(vendor_id);
CREATE INDEX idx_vendor_control_assessments_status ON vendor_control_assessments(status);
```

### 3.3 Gap Analysis Algorithm

```typescript
// src/lib/mapping/gap-analysis.ts

interface GapAnalysisInput {
  vendorId: string;
  targetFramework: 'dora'; // Primary target
  sourceFrameworks: ('soc2' | 'iso27001')[]; // Available evidence
}

interface GapAnalysisResult {
  overallCoverage: number; // 0-100%
  coverageByPillar: {
    pillar: string;
    name: string;
    coverage: number;
    controlsMet: number;
    controlsTotal: number;
  }[];
  gaps: {
    controlId: string;
    controlName: string;
    pillar: string;
    severity: 'critical' | 'major' | 'minor';
    status: 'not_met' | 'partially_met' | 'no_evidence';
    availableEvidence: {
      framework: string;
      controlId: string;
      mappingType: string;
      coverage: number;
    }[];
    recommendations: string[];
  }[];
  strengths: {
    controlId: string;
    controlName: string;
    evidence: string;
    confidence: number;
  }[];
}

export async function analyzeGaps(input: GapAnalysisInput): Promise<GapAnalysisResult> {
  // 1. Get all DORA controls
  const doraControls = await getFrameworkControls('dora');

  // 2. Get vendor's existing assessments
  const vendorAssessments = await getVendorAssessments(input.vendorId);

  // 3. Get available mappings
  const mappings = await getControlMappings(input.sourceFrameworks, 'dora');

  // 4. Calculate coverage for each DORA control
  const controlAnalysis = doraControls.map(doraControl => {
    // Find direct assessments
    const directAssessment = vendorAssessments.find(
      a => a.controlId === doraControl.id
    );

    if (directAssessment?.status === 'met') {
      return {
        control: doraControl,
        status: 'met',
        coverage: 100,
        source: 'direct'
      };
    }

    // Find mapped evidence from other frameworks
    const mappedEvidence = mappings
      .filter(m => m.targetControlId === doraControl.id)
      .map(m => {
        const sourceAssessment = vendorAssessments.find(
          a => a.controlId === m.sourceControlId
        );
        return {
          mapping: m,
          assessment: sourceAssessment
        };
      })
      .filter(e => e.assessment?.status === 'met');

    if (mappedEvidence.length > 0) {
      // Calculate weighted coverage from mapped controls
      const totalCoverage = mappedEvidence.reduce((sum, e) => {
        return sum + (e.mapping.coveragePercentage * e.mapping.confidence);
      }, 0) / mappedEvidence.length;

      return {
        control: doraControl,
        status: totalCoverage >= 80 ? 'met' : 'partially_met',
        coverage: totalCoverage,
        source: 'mapped',
        mappedFrom: mappedEvidence
      };
    }

    return {
      control: doraControl,
      status: 'not_met',
      coverage: 0,
      source: 'none'
    };
  });

  // 5. Aggregate by DORA pillar
  const coverageByPillar = DORA_PILLARS.map(pillar => {
    const pillarControls = controlAnalysis.filter(
      c => c.control.category === pillar.code
    );
    const met = pillarControls.filter(c => c.status === 'met').length;
    const total = pillarControls.length;

    return {
      pillar: pillar.code,
      name: pillar.name,
      coverage: total > 0 ? Math.round((met / total) * 100) : 0,
      controlsMet: met,
      controlsTotal: total
    };
  });

  // 6. Identify gaps with recommendations
  const gaps = controlAnalysis
    .filter(c => c.status !== 'met')
    .map(c => ({
      controlId: c.control.controlId,
      controlName: c.control.controlName,
      pillar: c.control.category,
      severity: determineSeverity(c.control),
      status: c.status,
      availableEvidence: c.mappedFrom?.map(m => ({
        framework: m.mapping.sourceFramework,
        controlId: m.mapping.sourceControlId,
        mappingType: m.mapping.mappingType,
        coverage: m.mapping.coveragePercentage
      })) || [],
      recommendations: generateRecommendations(c)
    }))
    .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return {
    overallCoverage: calculateOverallCoverage(controlAnalysis),
    coverageByPillar,
    gaps,
    strengths: extractStrengths(controlAnalysis)
  };
}

const DORA_PILLARS = [
  { code: 'ICT_RISK', name: 'ICT Risk Management' },
  { code: 'INCIDENT', name: 'Incident Reporting' },
  { code: 'RESILIENCE', name: 'Digital Resilience Testing' },
  { code: 'TPRM', name: 'Third-Party Risk Management' },
  { code: 'SHARING', name: 'Information Sharing' }
];
```

### 3.4 UI Visualization

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    VENDOR: AWS | DORA COMPLIANCE GAP ANALYSIS                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  OVERALL DORA COVERAGE                                                       │
│                                                                              │
│  ████████████████████████████████████░░░░░░░░░░░░  72%                      │
│                                                                              │
│  Evidence Sources: SOC 2 Type II (2024) ✓  |  ISO 27001 (2023) ✓            │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  COVERAGE BY DORA PILLAR                                                     │
│                                                                              │
│  ICT Risk Management     ████████████████████████████████  89%              │
│  Incident Reporting      ████████████████████░░░░░░░░░░░░  54%  ⚠️          │
│  Resilience Testing      ████████████████████████░░░░░░░░  68%              │
│  Third-Party Risk        ████████████████████████████████  91%              │
│  Information Sharing     ████████████████░░░░░░░░░░░░░░░░  45%  ⚠️          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  CRITICAL GAPS (3)                                                           │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ ⚠️ Art. 19 - Major Incident Reporting                                  │ │
│  │    Status: Partially Met (45%)                                         │ │
│  │    Evidence: SOC 2 CC7.3 (→ 30% coverage)                             │ │
│  │    Missing: Specific incident classification criteria, 4h reporting   │ │
│  │    Recommendation: Implement incident classification per EU 2024/1772 │ │
│  │                   [View Mapping Details] [Create Action Item]         │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ ⚠️ Art. 28(8) - Subcontracting Chain Visibility                       │ │
│  │    Status: Not Met                                                     │ │
│  │    Evidence: None found in current documentation                      │ │
│  │    Recommendation: Request subcontractor disclosure from vendor       │ │
│  │                   [Request from Vendor] [Mark N/A]                    │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Contract Analysis AI (P1)

### 4.1 DORA Article 30 Requirements

DORA Article 30 mandates 21 specific provisions in ICT third-party contracts:

| # | Provision | Description |
|---|-----------|-------------|
| 1 | Service Description | Clear description of ICT services |
| 2 | Data Locations | Where data will be processed/stored |
| 3 | Data Protection | GDPR compliance guarantees |
| 4 | Service Levels | Quantitative performance targets |
| 5 | Incident Reporting | Notification obligations |
| 6 | BCM/DR | Business continuity provisions |
| 7 | Audit Rights | Right to audit provider |
| 8 | Termination | Exit provisions and assistance |
| 9 | Subcontracting | Subcontractor approval and monitoring |
| 10 | Security Measures | ICT security requirements |
| ... | ... | (11 more provisions) |

### 4.2 AI Contract Parsing

```typescript
// src/lib/contracts/parser.ts

interface ContractAnalysisResult {
  documentId: string;
  analysisDate: Date;
  overallCompliance: number; // 0-100%

  provisions: {
    provisionId: number;
    name: string;
    status: 'present' | 'partial' | 'missing';
    confidence: number;
    extractedText?: string;
    location?: {
      page: number;
      section: string;
    };
    issues?: string[];
    recommendations?: string[];
  }[];

  keyTerms: {
    effectiveDate?: Date;
    expiryDate?: Date;
    terminationNotice?: number;
    governingLaw?: string;
    dataLocations?: string[];
    serviceLevels?: {
      metric: string;
      target: string;
    }[];
  };

  risks: {
    severity: 'high' | 'medium' | 'low';
    description: string;
    relatedProvision: number;
  }[];
}

const CONTRACT_ANALYSIS_PROMPT = `
You are a legal expert analyzing ICT service contracts for DORA (Digital Operational Resilience Act) compliance.

Analyze the following contract and extract information about the 21 mandatory provisions under DORA Article 30.

For each provision, determine:
1. Whether it is PRESENT, PARTIAL, or MISSING
2. The exact text from the contract (if present)
3. The page/section location
4. Any compliance issues or gaps
5. Confidence score (0-1)

PROVISIONS TO CHECK:

1. SERVICE DESCRIPTION (Art. 30(2)(a))
   - Clear, complete description of ICT services
   - Specific deliverables and responsibilities

2. DATA LOCATIONS (Art. 30(2)(a))
   - Processing locations explicitly stated
   - Storage locations explicitly stated
   - Any restrictions on data transfers

3. DATA PROTECTION (Art. 30(2)(a))
   - GDPR compliance commitments
   - Data processing agreement referenced
   - Personal data handling procedures

4. SERVICE LEVELS (Art. 30(2)(a))
   - Availability targets (e.g., 99.9%)
   - Performance metrics
   - Response time commitments

5. INCIDENT NOTIFICATION (Art. 30(2)(b))
   - Notification timeframes
   - Communication channels
   - Incident classification criteria

6. BUSINESS CONTINUITY (Art. 30(2)(c))
   - BCM plan requirements
   - Disaster recovery provisions
   - Testing obligations

7. AUDIT RIGHTS (Art. 30(2)(d))
   - Right to audit/inspect
   - Third-party audit reports
   - Information access provisions

8. TERMINATION & EXIT (Art. 30(2)(f))
   - Termination clauses
   - Exit assistance period
   - Data portability provisions

9. SUBCONTRACTING (Art. 30(2)(a))
   - Prior approval requirements
   - Chain visibility
   - Monitoring obligations

10. SECURITY MEASURES (Art. 30(2)(a))
    - ICT security requirements
    - Certification requirements
    - Security testing provisions

... (continue for all 21 provisions)

Return JSON with the following structure:
{
  "provisions": [...],
  "keyTerms": {...},
  "risks": [...],
  "overallCompliance": number
}
`;

export async function analyzeContract(
  documentId: string,
  contractText: string
): Promise<ContractAnalysisResult> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [{
      role: 'user',
      content: `${CONTRACT_ANALYSIS_PROMPT}\n\nCONTRACT TEXT:\n${contractText}`
    }]
  });

  const analysis = JSON.parse(response.content[0].text);

  return {
    documentId,
    analysisDate: new Date(),
    ...analysis
  };
}
```

### 4.3 User Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       CONTRACT COMPLIANCE CHECKER                            │
└─────────────────────────────────────────────────────────────────────────────┘

1. UPLOAD CONTRACT
   ┌─────────────────────────────────────────────────────┐
   │  📄 Drop contract PDF here or browse               │
   │                                                     │
   │  Supported: PDF, DOCX (max 50MB)                   │
   │  AI will analyze for DORA Article 30 compliance    │
   └─────────────────────────────────────────────────────┘

2. ANALYSIS IN PROGRESS
   ┌─────────────────────────────────────────────────────┐
   │  ⏳ Analyzing "AWS_MSA_2024.pdf"                    │
   │                                                     │
   │  ✓ Extracting text...                             │
   │  ✓ Identifying provisions...                       │
   │  ◐ Checking DORA compliance...                    │
   │  ○ Generating recommendations...                   │
   │                                                     │
   │  Estimated time: 30 seconds                        │
   └─────────────────────────────────────────────────────┘

3. COMPLIANCE REPORT
   ┌─────────────────────────────────────────────────────────────────────────┐
   │  CONTRACT: AWS Master Service Agreement 2024                            │
   │  VENDOR: Amazon Web Services                                            │
   │  DORA ARTICLE 30 COMPLIANCE: 76%                                        │
   │                                                                          │
   │  ┌─────────────────────────────────────────────────────────────────────┐│
   │  │ ✅ COMPLIANT (16 provisions)                                        ││
   │  │ ⚠️ PARTIAL (3 provisions)                                          ││
   │  │ ❌ MISSING (2 provisions)                                          ││
   │  └─────────────────────────────────────────────────────────────────────┘│
   │                                                                          │
   │  KEY FINDINGS:                                                           │
   │  ┌─────────────────────────────────────────────────────────────────────┐│
   │  │ ❌ #9 Subcontracting                                                ││
   │  │    No prior approval clause found                                   ││
   │  │    Recommendation: Negotiate addendum requiring subcontractor       ││
   │  │    approval for critical services                                   ││
   │  │    [View in Contract] [Generate Amendment Language]                 ││
   │  │─────────────────────────────────────────────────────────────────────││
   │  │ ⚠️ #5 Incident Notification                                        ││
   │  │    Notification period: 72 hours (DORA requires awareness of       ││
   │  │    major incidents "without undue delay")                          ││
   │  │    Found in: Section 8.2, page 14                                  ││
   │  │    [View in Contract] [Suggest Improvement]                        ││
   │  └─────────────────────────────────────────────────────────────────────┘│
   │                                                                          │
   │  [Export Report] [Link to Vendor] [Create Remediation Tasks]           │
   └─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Enhanced 4th Party Module (P1)

### 5.1 Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       4TH PARTY DETECTION & MONITORING                       │
└─────────────────────────────────────────────────────────────────────────────┘

                          YOUR ORGANIZATION
                                 │
              ┌──────────────────┼──────────────────┐
              │                  │                  │
              ▼                  ▼                  ▼
         ┌─────────┐       ┌─────────┐       ┌─────────┐
         │  Vendor │       │  Vendor │       │  Vendor │
         │   AWS   │       │Salesforce│      │ Stripe  │
         └────┬────┘       └────┬────┘       └────┬────┘
              │                  │                  │
    ┌─────────┼─────────┐       │         ┌───────┼───────┐
    │         │         │       │         │       │       │
    ▼         ▼         ▼       ▼         ▼       ▼       ▼
┌───────┐┌───────┐┌───────┐┌───────┐┌───────┐┌───────┐┌───────┐
│Fastly ││Twilio ││Mongo  ││Heroku ││Plaid  ││AWS    ││Adyen  │
│       ││       ││Atlas  ││       ││       ││       ││       │
└───────┘└───────┘└───────┘└───────┘└───────┘└───────┘└───────┘
  Tier 2   Tier 2   Tier 2   Tier 2   Tier 2   Tier 2   Tier 2

              ▼                  ▼                  ▼
       ┌─────────────────────────────────────────────────┐
       │            4TH PARTY ANALYSIS ENGINE            │
       │  • Extract from SOC 2 subservice orgs           │
       │  • Parse contracts for subcontractor mentions   │
       │  • API integrations (vendor disclosures)        │
       │  • Concentration risk calculation               │
       │  • Supply chain visualization                   │
       └─────────────────────────────────────────────────┘
```

### 5.2 Data Extraction from SOC 2

```typescript
// src/lib/parsing/subservice-extractor.ts

interface SubserviceOrganization {
  name: string;
  servicesProvided: string[];
  inclusionMethod: 'inclusive' | 'carve_out';
  monitoringApproach: string;
  relevance: 'critical' | 'supporting' | 'minimal';
  confidence: number;
}

const SUBSERVICE_EXTRACTION_PROMPT = `
Extract all Subservice Organizations mentioned in this SOC 2 report.

For each subservice organization, identify:
1. Organization name
2. Services provided to the service organization
3. Inclusion method (Inclusive or Carve-out)
4. How the service organization monitors the subservice org
5. Relevance to the overall service delivery (Critical/Supporting/Minimal)

Look for these sections:
- "Subservice Organizations"
- "Complementary Subservice Organization Controls"
- "Carve-out Method"
- "Inclusive Method"
- Section IV or V of the SOC 2 report

Return JSON array of subservice organizations.
`;

export async function extractSubserviceOrgs(
  parsedText: string
): Promise<SubserviceOrganization[]> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `${SUBSERVICE_EXTRACTION_PROMPT}\n\nSOC 2 REPORT TEXT:\n${parsedText}`
    }]
  });

  return JSON.parse(response.content[0].text);
}
```

### 5.3 Supply Chain Visualization

```typescript
// src/components/vendors/supply-chain-graph.tsx

interface SupplyChainNode {
  id: string;
  name: string;
  type: 'organization' | 'vendor' | 'subcontractor';
  tier: number; // 0 = your org, 1 = vendor, 2+ = subcontractor
  riskScore?: number;
  servicesProvided?: string[];
  concentration?: number; // % of critical functions dependent
}

interface SupplyChainEdge {
  source: string;
  target: string;
  serviceType: string;
  criticality: 'critical' | 'important' | 'standard';
}

export function SupplyChainGraph({
  organizationId
}: {
  organizationId: string
}) {
  const { data: graph } = useSupplyChainGraph(organizationId);

  return (
    <div className="h-[600px] w-full">
      <ReactFlow
        nodes={graph.nodes.map(node => ({
          id: node.id,
          type: 'supplyChainNode',
          position: calculatePosition(node),
          data: node
        }))}
        edges={graph.edges.map(edge => ({
          id: `${edge.source}-${edge.target}`,
          source: edge.source,
          target: edge.target,
          animated: edge.criticality === 'critical',
          style: getEdgeStyle(edge)
        }))}
        nodeTypes={{ supplyChainNode: SupplyChainNodeComponent }}
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>

      {/* Concentration Risk Panel */}
      <ConcentrationRiskPanel data={graph.concentrationAnalysis} />
    </div>
  );
}
```

### 5.4 Concentration Risk Calculation

```typescript
// src/lib/risk/concentration.ts

interface ConcentrationAnalysis {
  overallScore: number; // 0-100 (higher = more concentrated = riskier)

  byProvider: {
    providerId: string;
    providerName: string;
    dependencyScore: number;
    criticalFunctionsDependentOn: string[];
    cannotEasilyReplace: boolean;
  }[];

  byJurisdiction: {
    jurisdiction: string;
    providerCount: number;
    criticalProviderCount: number;
    percentageOfCritical: number;
  }[];

  byServiceType: {
    serviceType: string;
    providerCount: number;
    singleProviderDependency: boolean;
  }[];

  recommendations: string[];
}

export async function calculateConcentrationRisk(
  organizationId: string
): Promise<ConcentrationAnalysis> {
  // Get all vendors with their services and critical functions
  const vendors = await getVendorsWithServices(organizationId);
  const criticalFunctions = await getCriticalFunctions(organizationId);

  // Provider concentration
  const byProvider = vendors.map(vendor => {
    const dependentFunctions = criticalFunctions.filter(
      cf => cf.serviceIds.some(sid => vendor.serviceIds.includes(sid))
    );

    return {
      providerId: vendor.id,
      providerName: vendor.name,
      dependencyScore: (dependentFunctions.length / criticalFunctions.length) * 100,
      criticalFunctionsDependentOn: dependentFunctions.map(f => f.name),
      cannotEasilyReplace: vendor.tier === 'critical' && dependentFunctions.length > 2
    };
  }).sort((a, b) => b.dependencyScore - a.dependencyScore);

  // Jurisdiction concentration
  const jurisdictionGroups = groupBy(vendors, 'jurisdiction');
  const byJurisdiction = Object.entries(jurisdictionGroups).map(([jurisdiction, vendors]) => ({
    jurisdiction,
    providerCount: vendors.length,
    criticalProviderCount: vendors.filter(v => v.tier === 'critical').length,
    percentageOfCritical: (vendors.filter(v => v.tier === 'critical').length /
      vendors.filter(v => v.tier === 'critical').length) * 100 || 0
  }));

  // Service type concentration (single provider dependency)
  const serviceTypeGroups = groupBy(vendors.flatMap(v => v.services), 'serviceType');
  const byServiceType = Object.entries(serviceTypeGroups).map(([serviceType, services]) => ({
    serviceType,
    providerCount: new Set(services.map(s => s.vendorId)).size,
    singleProviderDependency: new Set(services.map(s => s.vendorId)).size === 1
  }));

  // Overall score (weighted)
  const overallScore = calculateOverallConcentration(byProvider, byJurisdiction, byServiceType);

  // Generate recommendations
  const recommendations = generateConcentrationRecommendations(
    byProvider, byJurisdiction, byServiceType
  );

  return {
    overallScore,
    byProvider,
    byJurisdiction,
    byServiceType,
    recommendations
  };
}
```

---

## 6. DORA Trust Exchange (P2 - Future)

### 6.1 Concept

A network where financial entities share anonymized vendor assessments, creating:
- **Shared intelligence**: One assessment benefits many
- **Network effects**: More users = more valuable
- **Cost reduction**: Amortize assessment costs across community
- **Faster coverage**: New vendors assessed by first adopter, available to all

### 6.2 Data Model

```sql
-- ============================================
-- TRUST EXCHANGE TABLES
-- ============================================

-- Shared assessments (anonymized)
CREATE TABLE trust_exchange_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Vendor identification (public)
  vendor_lei TEXT NOT NULL,
  vendor_name TEXT NOT NULL,

  -- Assessment metadata (anonymized)
  assessment_date DATE NOT NULL,
  assessment_type TEXT NOT NULL, -- 'document_review', 'questionnaire', 'on_site'
  framework TEXT NOT NULL, -- 'dora', 'soc2', 'iso27001'

  -- Aggregated scores (no individual org data)
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  category_scores JSONB DEFAULT '{}',

  -- Evidence summary (redacted)
  evidence_summary TEXT,
  key_findings TEXT[],

  -- Contribution tracking
  contributor_count INTEGER DEFAULT 1,
  last_updated TIMESTAMPTZ DEFAULT NOW(),

  -- Trust metrics
  validation_count INTEGER DEFAULT 0,
  dispute_count INTEGER DEFAULT 0,
  confidence_score FLOAT GENERATED ALWAYS AS (
    CASE
      WHEN contributor_count >= 5 AND dispute_count = 0 THEN 0.95
      WHEN contributor_count >= 3 THEN 0.85
      WHEN contributor_count >= 1 THEN 0.70
      ELSE 0.50
    END
  ) STORED
);

-- Organization contributions (private, for reputation)
CREATE TABLE trust_exchange_contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  assessment_id UUID NOT NULL REFERENCES trust_exchange_assessments(id),

  -- Contribution type
  contribution_type TEXT NOT NULL CHECK (contribution_type IN (
    'initial_assessment', 'validation', 'update', 'dispute'
  )),

  -- Reputation points earned
  points_earned INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization reputation in network
CREATE TABLE trust_exchange_reputation (
  organization_id UUID PRIMARY KEY REFERENCES organizations(id),

  total_contributions INTEGER DEFAULT 0,
  assessments_shared INTEGER DEFAULT 0,
  validations_provided INTEGER DEFAULT 0,
  disputes_raised INTEGER DEFAULT 0,
  disputes_upheld INTEGER DEFAULT 0,

  reputation_score INTEGER DEFAULT 0, -- Unlocks features at higher levels
  tier TEXT GENERATED ALWAYS AS (
    CASE
      WHEN reputation_score >= 1000 THEN 'platinum'
      WHEN reputation_score >= 500 THEN 'gold'
      WHEN reputation_score >= 100 THEN 'silver'
      ELSE 'bronze'
    END
  ) STORED,

  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.3 Network Value Proposition

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DORA TRUST EXCHANGE                                  │
└─────────────────────────────────────────────────────────────────────────────┘

                    ┌─────────────────────────────────────┐
                    │      NETWORK PARTICIPANTS           │
                    │  ┌──────────────────────────────┐   │
                    │  │  250+ Financial Institutions │   │
                    │  │  15,000+ Vendors Assessed    │   │
                    │  │  95% Coverage Rate           │   │
                    │  └──────────────────────────────┘   │
                    └─────────────────────────────────────┘

VALUE FOR PARTICIPANTS:

┌─────────────────────────────────────────────────────────────────────────────┐
│  CONTRIBUTOR                                                                 │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │  You Share:                    │  You Get:                             │ │
│  │  • 1 SOC 2 assessment          │  • Access to 15,000+ assessments      │ │
│  │  • Anonymized findings         │  • Real-time vendor intelligence      │ │
│  │  • 30 minutes effort           │  • Reputation points (unlock features)│ │
│  │                                │  • 100x ROI on assessment cost        │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘

TRUST MECHANICS:

┌─────────────────────────────────────────────────────────────────────────────┐
│  VALIDATION PROCESS                                                          │
│                                                                              │
│  New Assessment Shared                                                       │
│         │                                                                    │
│         ▼                                                                    │
│  Community Validation (3+ confirmations)                                     │
│         │                                                                    │
│         ▼                                                                    │
│  Confidence Score: 85%+ = "Verified"                                        │
│         │                                                                    │
│         ▼                                                                    │
│  Available to Network                                                        │
└─────────────────────────────────────────────────────────────────────────────┘

PRIVACY GUARANTEES:

• No individual organization data ever shared
• Assessments aggregated from 3+ contributors before publication
• LEI-based vendor matching (no proprietary vendor lists exposed)
• Contribute anonymously, benefit collectively
```

---

## 7. Implementation Roadmap Integration

### 7.1 Updated Phase Timeline

| Phase | Weeks | New Features Added |
|-------|-------|-------------------|
| **Phase 2** | 5-8 | Incident Reporting (basic), Cross-Framework Mapping |
| **Phase 3** | 9-12 | Enhanced RoI (15 templates), Incident Reporting (full) |
| **Phase 4** | 13-16 | Enhanced 4th Party, Contract Analysis AI (basic) |
| **Phase 5** | 17-20 | Contract Analysis AI (full), Trust Exchange (foundation) |

### 7.2 Priority Sequence

```
WEEK 5-6: Incident Reporting Foundation
├── Database schema (incidents, incident_reports)
├── Classification algorithm
├── Basic incident CRUD
└── Timeline tracking

WEEK 7-8: Cross-Framework Mapping
├── Mapping database (frameworks, controls, mappings)
├── SOC 2 → DORA mapping implementation
├── ISO 27001 → DORA mapping implementation
└── Gap analysis visualization

WEEK 9-10: Enhanced RoI Engine
├── Extended schema (contracts, services, subcontractors)
├── Template generators for B_01 through B_07
├── Cross-template validation rules
└── xBRL-CSV export engine

WEEK 11-12: Incident Reporting Completion
├── Report generation (initial, intermediate, final)
├── Deadline tracking and notifications
├── Regulatory submission workflow
└── Dashboard integration

WEEK 13-14: 4th Party Module
├── Subservice org extraction from SOC 2
├── Supply chain visualization (React Flow)
├── Concentration risk calculation
└── Monitoring dashboard

WEEK 15-16: Contract Analysis AI
├── Contract upload and parsing
├── DORA Article 30 provision extraction
├── Compliance scoring
└── Remediation recommendations
```

### 7.3 Success Metrics

| Feature | Metric | Target |
|---------|--------|--------|
| Incident Reporting | Classification accuracy | >95% |
| Incident Reporting | Report generation time | <5 min |
| RoI Engine | Template coverage | 15/15 |
| RoI Engine | Validation error detection | >99% |
| Cross-Framework Mapping | DORA coverage calculation | >90% accuracy |
| Contract Analysis | Provision extraction accuracy | >85% |
| 4th Party Module | Subservice org detection | >90% recall |

---

## Appendix A: Migration Scripts

```sql
-- Migration: 002_incident_reporting.sql
-- Run after 001_initial_schema.sql

-- Include incidents table and related tables from Section 1.2

-- Migration: 003_enhanced_roi.sql
-- Include contracts, ict_services, service_data_locations from Section 2.2

-- Migration: 004_framework_mapping.sql
-- Include frameworks, framework_controls, control_mappings from Section 3.2

-- Migration: 005_trust_exchange.sql (Future)
-- Include trust_exchange_* tables from Section 6.2
```

## Appendix B: API Versioning

All new endpoints follow versioned API pattern:
- `/api/v1/incidents/*`
- `/api/v1/roi/*`
- `/api/v1/mapping/*`
- `/api/v1/contracts/*`

---

**Document History:**
| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-29 | Claude | Initial specification |
