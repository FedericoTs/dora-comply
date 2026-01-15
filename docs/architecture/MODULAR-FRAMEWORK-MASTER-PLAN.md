# Modular Framework Platform - Master Plan

> **Document Version:** 1.0
> **Created:** January 2025
> **Status:** Active Implementation Guide
> **Last Updated:** January 15, 2025

---

## Executive Summary

This document outlines the strategic restructuring of DORA Comply from a monolithic DORA-focused platform to a modular, multi-framework compliance solution. The restructuring enables:

1. **Module-based licensing** - Organizations purchase specific framework modules
2. **Progressive disclosure** - Users see only what they've licensed (with upgrade teasers)
3. **Unified data collection** - Backend captures ALL framework data regardless of license
4. **Cross-sell opportunities** - "You're 60% ready for DORA" messaging for NIS2 users

### Business Model

| Tier | Frameworks | Price Point | Target |
|------|------------|-------------|--------|
| **Starter** | NIS2 | €299/mo | SMBs, broad market |
| **Professional** | NIS2 + DORA | €999/mo | Financial services |
| **Enterprise** | All (NIS2, DORA, GDPR, ISO) | Custom | Large enterprises |

### Key Principles

1. **Framework-first navigation** - User picks primary framework, UI adapts
2. **Shared core + module features** - Vendors/docs shared; RoI/incidents framework-specific
3. **Visible but locked modules** - Shows upgrade path, builds urgency
4. **Progressive data collection** - Backend captures everything, UI gates by license
5. **Dashboard per framework** - Reduces cognitive load, clearer value prop

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Target Architecture](#2-target-architecture)
3. [Database Schema Changes](#3-database-schema-changes)
4. [Module Definitions](#4-module-definitions)
5. [UI/UX Restructuring](#5-uiux-restructuring)
6. [Implementation Phases](#6-implementation-phases)
7. [File Change Registry](#7-file-change-registry)
8. [Migration Strategy](#8-migration-strategy)
9. [Testing & Validation](#9-testing--validation)
10. [Risk Mitigation](#10-risk-mitigation)

---

## 1. Current State Analysis

### 1.1 Framework Implementation Status

| Framework | Requirements | Scoring | UI Features | RoI | Incidents | Testing |
|-----------|-------------|---------|-------------|-----|-----------|---------|
| **DORA** | ✅ 64 articles | ✅ L0-L4 maturity | ✅ Full dashboard | ✅ 15 ESA templates | ✅ Art. 19 compliant | ✅ TLPT |
| **NIS2** | ✅ 100+ req | ❌ None | ❌ Read-only | ❌ None | ❌ None | ❌ None |
| **GDPR** | ✅ 32 req | ❌ None | ❌ Read-only | ❌ None | ❌ None | N/A |
| **ISO 27001** | ✅ 93 controls | ❌ None | ❌ Read-only | ❌ None | N/A | N/A |

### 1.2 DORA-Specific Code (Needs Abstraction)

```
src/lib/compliance/
├── dora-types.ts           # Maturity levels L0-L4
├── dora-requirements-data.ts # 64 articles
├── dora-calculator.ts      # Maturity calculation
└── dora-constants.ts       # Pillar configs

src/lib/roi/                # 100% DORA (ESA templates)
src/lib/incidents/          # 100% DORA (Article 18-20)
src/lib/testing/            # 100% DORA (TLPT)

src/components/compliance/
├── dora-coverage-chart.tsx
├── dora-evidence-chart.tsx
├── dora-gap-analysis.tsx
└── dora-gap-remediation/
```

### 1.3 Framework-Agnostic Code (Good Foundation)

```
src/lib/compliance/
├── framework-types.ts      # ✅ Generic types
├── framework-calculator.ts # ✅ Scoring interface (unused)
├── nis2-requirements.ts    # ✅ Data defined
├── gdpr-requirements.ts    # ✅ Data defined
├── iso27001-requirements.ts # ✅ Data defined
└── mappings/               # ✅ Cross-framework mappings

src/app/(dashboard)/frameworks/
└── page.tsx                # ✅ Shows all 4 frameworks
```

### 1.4 Database Gaps

| Current | Missing |
|---------|---------|
| `organizations` has no licensing fields | `licensed_frameworks`, `enabled_modules`, `license_tier` |
| `vendor_dora_compliance` is DORA-only | Generic `vendor_framework_compliance` table |
| No entitlement tracking | `organization_framework_entitlements` table |
| `frameworks` table created but empty | Seed data for all frameworks |

---

## 2. Target Architecture

### 2.1 Module Structure

```
┌─────────────────────────────────────────────────────────────┐
│                      SHARED CORE                            │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐ │
│  │ Vendors │  │Documents│  │Contacts │  │ Certifications  │ │
│  └─────────┘  └─────────┘  └─────────┘  └─────────────────┘ │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              AI Document Parsing Engine                 ││
│  │  (Extracts controls for ALL frameworks simultaneously)  ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  NIS2 MODULE  │   │  DORA MODULE  │   │  GDPR MODULE  │
│   (Starter)   │   │ (Professional)│   │ (Enterprise)  │
├───────────────┤   ├───────────────┤   ├───────────────┤
│ • NIS2 Dash   │   │ • DORA Dash   │   │ • GDPR Dash   │
│ • NIS2 Score  │   │ • RoI (15 ESA)│   │ • DPIA Tool   │
│ • NIS2 Gaps   │   │ • Incidents   │   │ • Breach Log  │
│ • Compliance  │   │ • TLPT Tests  │   │ • Consent Mgmt│
│   Report      │   │ • TPRM Focus  │   │ • DPO Tools   │
└───────────────┘   └───────────────┘   └───────────────┘

┌───────────────┐
│ ISO27001 MOD  │
│ (Enterprise)  │
├───────────────┤
│ • ISMS Dash   │
│ • Control Map │
│ • Audit Prep  │
│ • SoA Gen     │
└───────────────┘
```

### 2.2 Data Flow

```
┌──────────────────┐
│   SOC2 Report    │
│   Uploaded       │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│              AI Parsing Engine (Gemini)                  │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Extracts controls and maps to ALL frameworks:       │ │
│  │ • DORA: Article 5 (ICT Risk Management) ✓           │ │
│  │ • NIS2: Article 21 (Cybersecurity Risk Measures) ✓  │ │
│  │ • GDPR: Article 32 (Security of Processing) ✓      │ │
│  │ • ISO: A.8.1 (User Endpoint Devices) ✓             │ │
│  └─────────────────────────────────────────────────────┘ │
└────────┬─────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│           vendor_framework_compliance (Database)         │
│  ┌────────────────────────────────────────────────────┐  │
│  │ vendor_id │ framework │ score │ status │ details  │  │
│  ├───────────┼───────────┼───────┼────────┼──────────┤  │
│  │ v-123     │ dora      │ 78%   │ partial│ {...}    │  │
│  │ v-123     │ nis2      │ 82%   │ partial│ {...}    │  │
│  │ v-123     │ gdpr      │ 65%   │ partial│ {...}    │  │
│  │ v-123     │ iso27001  │ 71%   │ partial│ {...}    │  │
│  └────────────────────────────────────────────────────┘  │
└────────┬─────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────┐
│                    UI LAYER (License-Gated)              │
│                                                          │
│  User has: NIS2 + DORA licenses                         │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐      │
│  │ NIS2: 82%   │  │ DORA: 78%   │  │ 🔒 GDPR     │      │
│  │ [View →]    │  │ [View →]    │  │ Upgrade to  │      │
│  │             │  │             │  │ unlock      │      │
│  └─────────────┘  └─────────────┘  └─────────────┘      │
└──────────────────────────────────────────────────────────┘
```

### 2.3 License Enforcement

```typescript
// src/lib/licensing/check-access.ts

export type FrameworkModule =
  | 'dashboard'      // Framework-specific dashboard
  | 'scoring'        // Compliance scoring
  | 'gaps'           // Gap analysis
  | 'roi'            // Register of Information (DORA)
  | 'incidents'      // Incident reporting
  | 'testing'        // Resilience testing (DORA TLPT)
  | 'dpia'           // Data Protection Impact (GDPR)
  | 'isms'           // ISMS management (ISO)
  | 'reports';       // Compliance reports

export function hasAccess(
  org: Organization,
  framework: FrameworkCode,
  module: FrameworkModule
): boolean {
  const entitlement = org.framework_entitlements?.[framework];
  if (!entitlement?.enabled) return false;

  // Check module-specific access
  return entitlement.modules?.[module] ?? false;
}

// Usage in components
const canViewDoraRoi = hasAccess(org, 'dora', 'roi');
const canViewNis2Dashboard = hasAccess(org, 'nis2', 'dashboard');
```

---

## 3. Database Schema Changes

### 3.1 Migration: Add Licensing to Organizations

```sql
-- Migration: 011_framework_licensing.sql

-- Add licensing columns to organizations
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS license_tier TEXT DEFAULT 'starter'
  CHECK (license_tier IN ('starter', 'professional', 'enterprise', 'trial')),
ADD COLUMN IF NOT EXISTS licensed_frameworks TEXT[] DEFAULT ARRAY['nis2']::TEXT[],
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS billing_status TEXT DEFAULT 'active'
  CHECK (billing_status IN ('active', 'past_due', 'canceled', 'trialing'));

-- Create framework entitlements table
CREATE TABLE organization_framework_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  framework TEXT NOT NULL CHECK (framework IN ('dora', 'nis2', 'gdpr', 'iso27001')),
  enabled BOOLEAN DEFAULT true,
  activated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  modules_enabled JSONB DEFAULT '{
    "dashboard": true,
    "scoring": true,
    "gaps": true,
    "reports": true
  }'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, framework)
);

-- Enable RLS
ALTER TABLE organization_framework_entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org entitlements"
  ON organization_framework_entitlements FOR SELECT
  USING (organization_id = get_user_organization_id());

-- Create index for fast lookups
CREATE INDEX idx_org_framework_entitlements_org
  ON organization_framework_entitlements(organization_id);

-- Create framework modules definition table (seed data)
CREATE TABLE framework_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework TEXT NOT NULL CHECK (framework IN ('dora', 'nis2', 'gdpr', 'iso27001')),
  module_code TEXT NOT NULL,
  module_name TEXT NOT NULL,
  description TEXT,
  min_tier TEXT DEFAULT 'starter',
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(framework, module_code)
);

-- Seed framework modules
INSERT INTO framework_modules (framework, module_code, module_name, description, min_tier, is_premium) VALUES
-- NIS2 Modules (Starter tier)
('nis2', 'dashboard', 'NIS2 Dashboard', 'Compliance overview and scoring', 'starter', false),
('nis2', 'scoring', 'Compliance Scoring', 'Automated NIS2 compliance assessment', 'starter', false),
('nis2', 'gaps', 'Gap Analysis', 'Identify compliance gaps', 'starter', false),
('nis2', 'reports', 'Compliance Reports', 'Generate NIS2 compliance reports', 'starter', false),
('nis2', 'incidents', 'Incident Reporting', 'NIS2 incident notification workflow', 'professional', true),

-- DORA Modules (Professional tier)
('dora', 'dashboard', 'DORA Dashboard', 'DORA compliance overview', 'professional', false),
('dora', 'scoring', 'Maturity Scoring', 'L0-L4 maturity assessment', 'professional', false),
('dora', 'gaps', 'Gap Analysis', 'DORA gap identification', 'professional', false),
('dora', 'roi', 'Register of Information', 'ESA RoI templates (15)', 'professional', true),
('dora', 'incidents', 'ICT Incidents', 'Article 19 incident reporting', 'professional', true),
('dora', 'testing', 'Resilience Testing', 'TLPT management', 'professional', true),
('dora', 'tprm', 'Third Party Risk', 'ICT concentration risk', 'professional', true),
('dora', 'reports', 'Board Reports', 'Executive compliance reports', 'professional', false),

-- GDPR Modules (Enterprise tier)
('gdpr', 'dashboard', 'GDPR Dashboard', 'GDPR compliance overview', 'enterprise', false),
('gdpr', 'scoring', 'Compliance Scoring', 'Risk-based assessment', 'enterprise', false),
('gdpr', 'dpia', 'DPIA Tool', 'Data Protection Impact Assessments', 'enterprise', true),
('gdpr', 'breach', 'Breach Management', '72-hour breach notification', 'enterprise', true),
('gdpr', 'consent', 'Consent Management', 'Track consent records', 'enterprise', true),
('gdpr', 'reports', 'GDPR Reports', 'Compliance documentation', 'enterprise', false),

-- ISO 27001 Modules (Enterprise tier)
('iso27001', 'dashboard', 'ISMS Dashboard', 'ISO 27001 overview', 'enterprise', false),
('iso27001', 'scoring', 'Control Assessment', 'Control implementation status', 'enterprise', false),
('iso27001', 'soa', 'Statement of Applicability', 'Generate SoA document', 'enterprise', true),
('iso27001', 'audit', 'Audit Preparation', 'Internal audit toolkit', 'enterprise', true),
('iso27001', 'reports', 'Certification Reports', 'Audit-ready documentation', 'enterprise', false);
```

### 3.2 Migration: Generic Vendor Framework Compliance

```sql
-- Migration: 012_vendor_framework_compliance.sql

-- Create generic vendor framework compliance table
CREATE TABLE vendor_framework_compliance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  framework TEXT NOT NULL CHECK (framework IN ('dora', 'nis2', 'gdpr', 'iso27001')),

  -- Generic compliance metrics
  overall_score NUMERIC(5,2) CHECK (overall_score >= 0 AND overall_score <= 100),
  overall_status TEXT CHECK (overall_status IN (
    'compliant', 'partially_compliant', 'non_compliant', 'not_assessed', 'not_applicable'
  )) DEFAULT 'not_assessed',

  -- Framework-specific maturity data (flexible JSONB)
  maturity_data JSONB DEFAULT '{}'::JSONB,
  -- DORA: { "level": 3, "pillar_scores": {...} }
  -- NIS2: { "compliant_count": 45, "total": 100 }
  -- GDPR: { "risk_level": "medium", "controls_implemented": 28 }
  -- ISO: { "implemented": 80, "documented": 75, "maintained": 60 }

  -- Category/pillar breakdown
  category_scores JSONB DEFAULT '{}'::JSONB,

  -- Assessment tracking
  assessment_date TIMESTAMPTZ,
  assessed_by UUID REFERENCES profiles(id),
  assessment_method TEXT CHECK (assessment_method IN (
    'ai_parsing', 'manual', 'questionnaire', 'audit', 'certification'
  )),

  -- Evidence linkage
  evidence_document_ids UUID[] DEFAULT ARRAY[]::UUID[],

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(vendor_id, organization_id, framework)
);

-- Enable RLS
ALTER TABLE vendor_framework_compliance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org vendor compliance"
  ON vendor_framework_compliance FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can modify own org vendor compliance"
  ON vendor_framework_compliance FOR ALL
  USING (organization_id = get_user_organization_id());

-- Indexes
CREATE INDEX idx_vfc_vendor ON vendor_framework_compliance(vendor_id);
CREATE INDEX idx_vfc_org ON vendor_framework_compliance(organization_id);
CREATE INDEX idx_vfc_framework ON vendor_framework_compliance(framework);
CREATE INDEX idx_vfc_org_framework ON vendor_framework_compliance(organization_id, framework);

-- Create view for easy querying
CREATE OR REPLACE VIEW vendor_compliance_summary AS
SELECT
  v.id AS vendor_id,
  v.name AS vendor_name,
  v.tier,
  vfc.framework,
  vfc.overall_score,
  vfc.overall_status,
  vfc.maturity_data,
  vfc.assessment_date,
  vfc.organization_id
FROM vendors v
LEFT JOIN vendor_framework_compliance vfc ON v.id = vfc.vendor_id
WHERE v.deleted_at IS NULL;
```

### 3.3 Migration: Migrate Existing DORA Data

```sql
-- Migration: 013_migrate_dora_to_generic.sql

-- Migrate existing vendor_dora_compliance to generic table
INSERT INTO vendor_framework_compliance (
  vendor_id,
  organization_id,
  framework,
  overall_score,
  overall_status,
  maturity_data,
  category_scores,
  assessment_date,
  created_at,
  updated_at
)
SELECT
  vdc.vendor_id,
  vdc.organization_id,
  'dora' AS framework,
  vdc.overall_compliance_score AS overall_score,
  CASE
    WHEN vdc.overall_compliance_score >= 75 THEN 'compliant'
    WHEN vdc.overall_compliance_score >= 50 THEN 'partially_compliant'
    WHEN vdc.overall_compliance_score > 0 THEN 'non_compliant'
    ELSE 'not_assessed'
  END AS overall_status,
  jsonb_build_object(
    'level', FLOOR(vdc.overall_compliance_score / 25),
    'pillar_scores', jsonb_build_object(
      'ict_risk', vdc.pillar_ict_risk_maturity,
      'incident', vdc.pillar_incident_maturity,
      'testing', vdc.pillar_testing_maturity,
      'tprm', vdc.pillar_tprm_maturity,
      'sharing', vdc.pillar_sharing_maturity
    )
  ) AS maturity_data,
  jsonb_build_object(
    'ict_risk', vdc.pillar_ict_risk_maturity * 25,
    'incident', vdc.pillar_incident_maturity * 25,
    'testing', vdc.pillar_testing_maturity * 25,
    'tprm', vdc.pillar_tprm_maturity * 25,
    'sharing', vdc.pillar_sharing_maturity * 25
  ) AS category_scores,
  vdc.updated_at AS assessment_date,
  vdc.created_at,
  vdc.updated_at
FROM vendor_dora_compliance vdc
ON CONFLICT (vendor_id, organization_id, framework)
DO UPDATE SET
  overall_score = EXCLUDED.overall_score,
  overall_status = EXCLUDED.overall_status,
  maturity_data = EXCLUDED.maturity_data,
  category_scores = EXCLUDED.category_scores,
  updated_at = NOW();

-- Set default entitlements for existing orgs (grandfather them into Professional)
INSERT INTO organization_framework_entitlements (
  organization_id,
  framework,
  enabled,
  modules_enabled
)
SELECT
  o.id,
  fw.framework,
  true,
  CASE fw.framework
    WHEN 'dora' THEN '{"dashboard": true, "scoring": true, "gaps": true, "roi": true, "incidents": true, "testing": true, "tprm": true, "reports": true}'::JSONB
    WHEN 'nis2' THEN '{"dashboard": true, "scoring": true, "gaps": true, "reports": true}'::JSONB
    ELSE '{"dashboard": true, "scoring": true, "gaps": true, "reports": true}'::JSONB
  END
FROM organizations o
CROSS JOIN (VALUES ('dora'), ('nis2')) AS fw(framework)
WHERE NOT EXISTS (
  SELECT 1 FROM organization_framework_entitlements ofe
  WHERE ofe.organization_id = o.id AND ofe.framework = fw.framework
);

-- Update existing orgs to Professional tier
UPDATE organizations
SET
  license_tier = 'professional',
  licensed_frameworks = ARRAY['nis2', 'dora']::TEXT[]
WHERE license_tier IS NULL OR license_tier = 'starter';
```

---

## 4. Module Definitions

### 4.1 NIS2 Module (Starter Tier)

**Target Users:** Any EU organization in scope of NIS2
**Price:** €299/month

#### Features

| Feature | Description | Priority |
|---------|-------------|----------|
| **NIS2 Dashboard** | Compliance score, gaps overview, trends | P0 |
| **Compliance Scoring** | Binary yes/no assessment (100+ requirements) | P0 |
| **Gap Analysis** | Identify missing controls with remediation | P0 |
| **Vendor Risk (Basic)** | Vendor list with NIS2-relevant certifications | P0 |
| **Compliance Report** | PDF export of NIS2 compliance status | P1 |
| **Cross-Framework Preview** | "See how you'd score on DORA" teaser | P1 |

#### NIS2-Specific Scoring Model

```typescript
interface NIS2ComplianceScore {
  // Binary compliance (yes/no/partial per requirement)
  compliant_count: number;      // Requirements fully met
  partial_count: number;        // Requirements partially met
  non_compliant_count: number;  // Requirements not met
  total_requirements: number;   // Always 100+

  // Category breakdown
  categories: {
    governance: number;         // % of governance requirements met
    risk_management: number;    // % of risk requirements met
    incident_handling: number;  // % of incident requirements met
    business_continuity: number;
    supply_chain: number;
    network_security: number;
    access_control: number;
    cryptography: number;
    hr_security: number;
    asset_management: number;
  };

  // Overall percentage
  overall_percentage: number;   // (compliant + partial*0.5) / total * 100

  // Status
  status: 'compliant' | 'partially_compliant' | 'non_compliant';
}
```

#### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/lib/compliance/nis2-calculator.ts` | CREATE | NIS2 scoring logic |
| `src/lib/compliance/nis2-types.ts` | CREATE | NIS2 type definitions |
| `src/app/(dashboard)/nis2/page.tsx` | CREATE | NIS2 dashboard |
| `src/app/(dashboard)/nis2/gaps/page.tsx` | CREATE | NIS2 gap analysis |
| `src/components/compliance/nis2-dashboard.tsx` | CREATE | NIS2 dashboard component |
| `src/components/compliance/nis2-score-card.tsx` | CREATE | NIS2 score display |

### 4.2 DORA Module (Professional Tier)

**Target Users:** EU financial services entities
**Price:** €999/month (includes NIS2)

#### Features (Existing - Keep As-Is)

| Feature | Status | Notes |
|---------|--------|-------|
| DORA Dashboard | ✅ Exists | Rebrand to "DORA Module" |
| L0-L4 Maturity Scoring | ✅ Exists | No changes |
| Register of Information | ✅ Exists | Gate behind DORA license |
| ICT Incidents | ✅ Exists | Gate behind DORA license |
| TLPT Testing | ✅ Exists | Gate behind DORA license |
| Concentration Risk | ✅ Exists | Gate behind DORA license |
| Board Reports | ✅ Exists | Gate behind DORA license |

#### Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `src/app/(dashboard)/roi/*` | MODIFY | Add license check |
| `src/app/(dashboard)/incidents/*` | MODIFY | Add license check |
| `src/app/(dashboard)/testing/*` | MODIFY | Add license check |
| `src/components/navigation/sidebar-nav.tsx` | MODIFY | Hide/show based on license |

### 4.3 GDPR Module (Enterprise Tier)

**Target Users:** Data processors/controllers
**Price:** Enterprise custom

#### Features (To Build)

| Feature | Description | Priority |
|---------|-------------|----------|
| **GDPR Dashboard** | Art. 32 compliance overview | P2 |
| **DPIA Tool** | Data Protection Impact Assessment wizard | P2 |
| **Breach Management** | 72-hour notification workflow | P2 |
| **Consent Records** | Track lawful basis | P3 |
| **DPO Tools** | Data subject request management | P3 |

### 4.4 ISO 27001 Module (Enterprise Tier)

**Target Users:** Organizations seeking/maintaining ISO certification
**Price:** Enterprise custom

#### Features (To Build)

| Feature | Description | Priority |
|---------|-------------|----------|
| **ISMS Dashboard** | Control implementation status | P2 |
| **Statement of Applicability** | Generate SoA document | P2 |
| **Internal Audit** | Audit finding tracker | P3 |
| **Risk Register** | ISO-style risk assessment | P3 |

---

## 5. UI/UX Restructuring

### 5.1 Navigation Structure (New)

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER                                                     │
│  ┌─────────┐  ┌──────────────────────────┐  ┌────────────┐ │
│  │ Logo    │  │ [NIS2 ▼] [DORA] [+More]  │  │ Settings ⚙ │ │
│  └─────────┘  └──────────────────────────┘  └────────────┘ │
│                Framework Selector (tabs)                    │
└─────────────────────────────────────────────────────────────┘
┌──────────────┐ ┌────────────────────────────────────────────┐
│  SIDEBAR     │ │  MAIN CONTENT                              │
│              │ │                                             │
│ ─ CORE ───── │ │  Shows content for selected framework      │
│ Dashboard    │ │                                             │
│ Vendors      │ │  If framework not licensed:                │
│ Documents    │ │  ┌─────────────────────────────────────┐   │
│              │ │  │  🔒 DORA Module                     │   │
│ ─ NIS2 ──── │ │  │                                     │   │
│ Compliance   │ │  │  Unlock advanced DORA features:    │   │
│ Gaps         │ │  │  • Register of Information         │   │
│ Report       │ │  │  • ICT Incident Reporting          │   │
│              │ │  │  • TLPT Testing Management         │   │
│ ─ DORA ──── │ │  │                                     │   │
│ RoI         │ │  │  [Upgrade to Professional →]        │   │
│ Incidents   │ │  └─────────────────────────────────────┘   │
│ Testing     │ │                                             │
│ TPRM        │ │                                             │
│              │ │                                             │
│ ─ SETTINGS ─ │ │                                             │
│ Organization │ │                                             │
│ Team         │ │                                             │
│ Billing      │ │                                             │
└──────────────┘ └────────────────────────────────────────────┘
```

### 5.2 Framework Selector Component

```typescript
// src/components/navigation/framework-selector.tsx

'use client';

import { useFramework } from '@/lib/context/framework-context';
import { cn } from '@/lib/utils';
import { Lock, Plus } from 'lucide-react';

const FRAMEWORKS = [
  { code: 'nis2', name: 'NIS2', color: 'bg-blue-500' },
  { code: 'dora', name: 'DORA', color: 'bg-emerald-500' },
  { code: 'gdpr', name: 'GDPR', color: 'bg-purple-500' },
  { code: 'iso27001', name: 'ISO 27001', color: 'bg-orange-500' },
] as const;

export function FrameworkSelector() {
  const { activeFramework, enabledFrameworks, setActiveFramework } = useFramework();

  return (
    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
      {FRAMEWORKS.map((fw) => {
        const isEnabled = enabledFrameworks.includes(fw.code);
        const isActive = activeFramework === fw.code;

        return (
          <button
            key={fw.code}
            onClick={() => isEnabled && setActiveFramework(fw.code)}
            disabled={!isEnabled}
            className={cn(
              'px-3 py-1.5 rounded-md text-sm font-medium transition-all',
              isActive && isEnabled && 'bg-background shadow-sm',
              !isActive && isEnabled && 'hover:bg-background/50',
              !isEnabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <span className="flex items-center gap-1.5">
              <span className={cn('w-2 h-2 rounded-full', fw.color)} />
              {fw.name}
              {!isEnabled && <Lock className="w-3 h-3" />}
            </span>
          </button>
        );
      })}

      <button className="px-2 py-1.5 text-muted-foreground hover:text-foreground">
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
```

### 5.3 Sidebar Navigation (Updated)

```typescript
// src/components/navigation/sidebar-nav.tsx - Updated structure

const NAVIGATION_ITEMS = {
  core: [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Vendors', href: '/vendors', icon: Building2 },
    { name: 'Documents', href: '/documents', icon: FileText },
  ],

  nis2: [
    { name: 'NIS2 Overview', href: '/nis2', icon: Shield },
    { name: 'Gap Analysis', href: '/nis2/gaps', icon: AlertTriangle },
    { name: 'Compliance Report', href: '/nis2/report', icon: FileBarChart },
  ],

  dora: [
    { name: 'DORA Overview', href: '/dora', icon: Shield },
    { name: 'Register of Information', href: '/roi', icon: Database, module: 'roi' },
    { name: 'ICT Incidents', href: '/incidents', icon: AlertCircle, module: 'incidents' },
    { name: 'Resilience Testing', href: '/testing', icon: FlaskConical, module: 'testing' },
    { name: 'Concentration Risk', href: '/concentration', icon: PieChart, module: 'tprm' },
  ],

  gdpr: [
    { name: 'GDPR Overview', href: '/gdpr', icon: Shield },
    { name: 'DPIA Tool', href: '/gdpr/dpia', icon: ClipboardCheck, module: 'dpia' },
    { name: 'Breach Log', href: '/gdpr/breaches', icon: AlertOctagon, module: 'breach' },
  ],

  iso27001: [
    { name: 'ISMS Overview', href: '/iso27001', icon: Shield },
    { name: 'Statement of Applicability', href: '/iso27001/soa', icon: FileCheck, module: 'soa' },
    { name: 'Audit Tracker', href: '/iso27001/audits', icon: ClipboardList, module: 'audit' },
  ],

  settings: [
    { name: 'Organization', href: '/settings/organization', icon: Building },
    { name: 'Team', href: '/settings/team', icon: Users },
    { name: 'Billing', href: '/settings/billing', icon: CreditCard },
  ],
};

export function SidebarNav() {
  const { activeFramework, enabledFrameworks } = useFramework();
  const { hasModuleAccess } = useLicensing();

  // Filter items based on license
  const frameworkItems = NAVIGATION_ITEMS[activeFramework]?.filter(item => {
    if (!item.module) return true;
    return hasModuleAccess(activeFramework, item.module);
  }) ?? [];

  return (
    <nav>
      <NavSection title="Core" items={NAVIGATION_ITEMS.core} />

      {enabledFrameworks.map(fw => (
        <NavSection
          key={fw}
          title={fw.toUpperCase()}
          items={NAVIGATION_ITEMS[fw]}
          isActive={fw === activeFramework}
        />
      ))}

      <NavSection title="Settings" items={NAVIGATION_ITEMS.settings} />
    </nav>
  );
}
```

### 5.4 Locked Module Component

```typescript
// src/components/licensing/locked-module.tsx

interface LockedModuleProps {
  framework: FrameworkCode;
  moduleName: string;
  features: string[];
  upgradeTier: 'professional' | 'enterprise';
}

export function LockedModule({
  framework,
  moduleName,
  features,
  upgradeTier
}: LockedModuleProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md text-center p-8">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-muted-foreground" />
        </div>

        <h2 className="text-2xl font-semibold mb-2">
          {moduleName}
        </h2>

        <p className="text-muted-foreground mb-6">
          Upgrade to {upgradeTier === 'professional' ? 'Professional' : 'Enterprise'}
          to unlock this module.
        </p>

        <ul className="text-left space-y-2 mb-6">
          {features.map((feature, i) => (
            <li key={i} className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <Button asChild className="w-full">
          <Link href="/settings/billing">
            Upgrade to {upgradeTier === 'professional' ? 'Professional' : 'Enterprise'}
          </Link>
        </Button>

        <p className="text-xs text-muted-foreground mt-4">
          Contact sales for custom pricing
        </p>
      </Card>
    </div>
  );
}
```

### 5.5 Dashboard Updates

Each framework gets its own dashboard showing:

1. **Compliance Score** (framework-specific visualization)
2. **Gap Summary** (top 5 gaps)
3. **Recent Activity** (framework-filtered)
4. **Quick Actions** (framework-specific)
5. **Cross-Framework Teaser** (if not licensed, show preview)

---

## 6. Implementation Phases

### Phase 1: Foundation (Week 1-2)

**Goal:** Add licensing infrastructure without breaking existing functionality

#### Tasks

| ID | Task | Files | Est. |
|----|------|-------|------|
| 1.1 | Create database migrations (011, 012, 013) | `supabase/migrations/` | 4h |
| 1.2 | Run migrations and verify | - | 1h |
| 1.3 | Create licensing types | `src/lib/licensing/types.ts` | 2h |
| 1.4 | Create license check utilities | `src/lib/licensing/check-access.ts` | 3h |
| 1.5 | Create FrameworkContext provider | `src/lib/context/framework-context.tsx` | 3h |
| 1.6 | Add licensing API route | `src/app/api/licensing/route.ts` | 2h |
| 1.7 | Update organization fetch to include entitlements | `src/lib/org/queries.ts` | 2h |

**Deliverable:** License checks work, existing users grandfathered to Professional

### Phase 2: Navigation & Context (Week 2-3)

**Goal:** Framework selector and dynamic navigation

#### Tasks

| ID | Task | Files | Est. |
|----|------|-------|------|
| 2.1 | Create FrameworkSelector component | `src/components/navigation/framework-selector.tsx` | 4h |
| 2.2 | Update header to include selector | `src/components/navigation/header.tsx` | 2h |
| 2.3 | Update SidebarNav for dynamic items | `src/components/navigation/sidebar-nav.tsx` | 4h |
| 2.4 | Create LockedModule component | `src/components/licensing/locked-module.tsx` | 3h |
| 2.5 | Wrap dashboard layout with FrameworkProvider | `src/app/(dashboard)/layout.tsx` | 2h |
| 2.6 | Add framework param to URL state | `src/hooks/use-framework-state.ts` | 2h |

**Deliverable:** Users can switch frameworks, see locked modules

### Phase 3: NIS2 Module (Week 3-4)

**Goal:** Complete NIS2 starter experience

#### Tasks

| ID | Task | Files | Est. |
|----|------|-------|------|
| 3.1 | Create NIS2 types | `src/lib/compliance/nis2-types.ts` | 2h |
| 3.2 | Implement NIS2 calculator | `src/lib/compliance/nis2-calculator.ts` | 6h |
| 3.3 | Create NIS2 dashboard page | `src/app/(dashboard)/nis2/page.tsx` | 4h |
| 3.4 | Create NIS2 dashboard component | `src/components/compliance/nis2-dashboard.tsx` | 6h |
| 3.5 | Create NIS2 gap analysis page | `src/app/(dashboard)/nis2/gaps/page.tsx` | 4h |
| 3.6 | Create NIS2 gap list component | `src/components/compliance/nis2-gap-list.tsx` | 4h |
| 3.7 | Create NIS2 report generator | `src/lib/reports/nis2-report.ts` | 4h |
| 3.8 | Update AI parser for NIS2 mapping | `src/lib/ai/document-parser.ts` | 4h |

**Deliverable:** Full NIS2 starter experience working

### Phase 4: DORA Module Gating (Week 4-5)

**Goal:** Gate existing DORA features behind license

#### Tasks

| ID | Task | Files | Est. |
|----|------|-------|------|
| 4.1 | Create DORA overview page | `src/app/(dashboard)/dora/page.tsx` | 3h |
| 4.2 | Add license check to RoI pages | `src/app/(dashboard)/roi/*` | 2h |
| 4.3 | Add license check to Incidents pages | `src/app/(dashboard)/incidents/*` | 2h |
| 4.4 | Add license check to Testing pages | `src/app/(dashboard)/testing/*` | 2h |
| 4.5 | Add license check to Concentration pages | `src/app/(dashboard)/concentration/*` | 2h |
| 4.6 | Update main dashboard for framework context | `src/app/(dashboard)/dashboard/page.tsx` | 4h |
| 4.7 | Create upgrade prompts in locked pages | Various | 3h |

**Deliverable:** DORA features only visible to Professional+ users

### Phase 5: Cross-Framework Features (Week 5-6)

**Goal:** Show compliance across frameworks

#### Tasks

| ID | Task | Files | Est. |
|----|------|-------|------|
| 5.1 | Update vendor detail for multi-framework scores | `src/app/(dashboard)/vendors/[id]/page.tsx` | 4h |
| 5.2 | Create multi-framework score card | `src/components/vendors/multi-framework-score.tsx` | 4h |
| 5.3 | Update AI parser to score all frameworks | `src/lib/ai/multi-framework-scorer.ts` | 6h |
| 5.4 | Create cross-framework mapping visualization | `src/components/compliance/framework-mapping-viz.tsx` | 4h |
| 5.5 | Add "you'd score X on DORA" teaser | `src/components/licensing/framework-teaser.tsx` | 3h |

**Deliverable:** Single document upload scores all frameworks

### Phase 6: Polish & Testing (Week 6-7)

**Goal:** QA, edge cases, documentation

#### Tasks

| ID | Task | Est. |
|----|------|------|
| 6.1 | End-to-end testing of all license tiers | 8h |
| 6.2 | Test license upgrade flow | 4h |
| 6.3 | Test data visibility across tiers | 4h |
| 6.4 | Performance testing | 4h |
| 6.5 | Update CLAUDE.md documentation | 2h |
| 6.6 | Create admin license management UI | 6h |
| 6.7 | Bug fixes and polish | 8h |

**Deliverable:** Production-ready modular platform

---

## 7. File Change Registry

### New Files to Create

| Path | Purpose | Phase |
|------|---------|-------|
| `supabase/migrations/011_framework_licensing.sql` | Licensing schema | 1 |
| `supabase/migrations/012_vendor_framework_compliance.sql` | Generic compliance | 1 |
| `supabase/migrations/013_migrate_dora_to_generic.sql` | Data migration | 1 |
| `src/lib/licensing/types.ts` | License types | 1 |
| `src/lib/licensing/check-access.ts` | Access utilities | 1 |
| `src/lib/context/framework-context.tsx` | React context | 1 |
| `src/app/api/licensing/route.ts` | License API | 1 |
| `src/components/navigation/framework-selector.tsx` | Framework tabs | 2 |
| `src/components/licensing/locked-module.tsx` | Locked state | 2 |
| `src/hooks/use-framework-state.ts` | Framework URL state | 2 |
| `src/lib/compliance/nis2-types.ts` | NIS2 types | 3 |
| `src/lib/compliance/nis2-calculator.ts` | NIS2 scoring | 3 |
| `src/app/(dashboard)/nis2/page.tsx` | NIS2 dashboard | 3 |
| `src/app/(dashboard)/nis2/gaps/page.tsx` | NIS2 gaps | 3 |
| `src/components/compliance/nis2-dashboard.tsx` | NIS2 UI | 3 |
| `src/components/compliance/nis2-gap-list.tsx` | NIS2 gaps UI | 3 |
| `src/lib/reports/nis2-report.ts` | NIS2 PDF report | 3 |
| `src/app/(dashboard)/dora/page.tsx` | DORA overview | 4 |
| `src/components/vendors/multi-framework-score.tsx` | Multi-FW scores | 5 |
| `src/lib/ai/multi-framework-scorer.ts` | Multi-FW AI | 5 |
| `src/components/licensing/framework-teaser.tsx` | Upgrade teaser | 5 |

### Existing Files to Modify

| Path | Changes | Phase |
|------|---------|-------|
| `src/app/(dashboard)/layout.tsx` | Wrap with FrameworkProvider | 2 |
| `src/components/navigation/header.tsx` | Add FrameworkSelector | 2 |
| `src/components/navigation/sidebar-nav.tsx` | Dynamic nav items | 2 |
| `src/app/(dashboard)/roi/*` | Add license checks | 4 |
| `src/app/(dashboard)/incidents/*` | Add license checks | 4 |
| `src/app/(dashboard)/testing/*` | Add license checks | 4 |
| `src/app/(dashboard)/concentration/*` | Add license checks | 4 |
| `src/app/(dashboard)/dashboard/page.tsx` | Framework-aware | 4 |
| `src/app/(dashboard)/vendors/[id]/page.tsx` | Multi-FW scores | 5 |
| `src/lib/ai/document-parser.ts` | Multi-FW parsing | 5 |
| `CLAUDE.md` | Update documentation | 6 |

---

## 8. Migration Strategy

### 8.1 Existing Customer Handling

| Customer Type | Migration Action |
|---------------|------------------|
| Demo/Trial accounts | Set to `trial` tier with 14-day expiry |
| Active paying customers | Grandfather to `professional` tier |
| Enterprise customers | Set to `enterprise` tier |

### 8.2 Data Migration Steps

1. **Backup** - Full database backup before migration
2. **Add columns** - New columns with defaults (no data loss)
3. **Create tables** - New tables for entitlements
4. **Copy data** - Migrate DORA data to generic tables
5. **Verify** - Check data integrity
6. **Set entitlements** - Grant existing customers Professional
7. **Test** - Verify all features work
8. **Deploy UI** - Roll out new navigation
9. **Monitor** - Watch for issues

### 8.3 Rollback Plan

- Keep `vendor_dora_compliance` table (don't delete)
- Feature flags for new navigation
- Ability to revert to monolithic navigation
- Database restore from backup if needed

---

## 9. Testing & Validation

### 9.1 Test Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| Starter user visits /roi | Sees LockedModule with upgrade CTA |
| Professional user visits /roi | Sees full RoI functionality |
| User switches framework | Dashboard updates, nav updates |
| AI parses SOC2 | Scores all 4 frameworks |
| User upgrades tier | Immediate access to new modules |
| Trial expires | Locked module states appear |

### 9.2 Test Accounts

| Account | Tier | Frameworks | Use Case |
|---------|------|------------|----------|
| `starter@test.com` | Starter | NIS2 only | Test basic experience |
| `pro@test.com` | Professional | NIS2, DORA | Test upgrade path |
| `enterprise@test.com` | Enterprise | All | Test full access |
| `trial@test.com` | Trial | All (14 days) | Test expiry |

---

## 10. Risk Mitigation

### 10.1 Technical Risks

| Risk | Mitigation |
|------|------------|
| Data migration failure | Full backup, tested rollback procedure |
| Performance degradation | Database indexes, query optimization |
| Breaking existing workflows | Feature flags, gradual rollout |
| License check overhead | Cache entitlements in context |

### 10.2 Business Risks

| Risk | Mitigation |
|------|------------|
| Customer confusion | Clear in-app messaging, email communication |
| Downgrade requests | Offer extended trials, clear value prop |
| Feature parity expectations | Document what's in each tier clearly |

### 10.3 Success Metrics

| Metric | Target |
|--------|--------|
| Starter → Pro conversion | >15% within 30 days |
| Feature adoption (NIS2) | >60% of starter users active |
| Support tickets (confusion) | <5% of users |
| Performance (page load) | <2s for dashboard |

---

## Appendix A: Framework Requirement Counts

| Framework | Requirements | Categories |
|-----------|-------------|------------|
| DORA | 64 articles | 5 pillars |
| NIS2 | 100+ requirements | 10 categories |
| GDPR | 32 requirements | Article 32 focus |
| ISO 27001 | 93 controls | Annexes A.5-A.8 |

## Appendix B: Tier Comparison

| Feature | Starter | Professional | Enterprise |
|---------|---------|--------------|------------|
| Vendors | 25 | 100 | Unlimited |
| Documents | 50/mo | Unlimited | Unlimited |
| AI Parsing | 5/mo | Unlimited | Unlimited |
| NIS2 | ✅ | ✅ | ✅ |
| DORA | ❌ | ✅ | ✅ |
| GDPR | ❌ | ❌ | ✅ |
| ISO 27001 | ❌ | ❌ | ✅ |
| Board Reports | ❌ | ✅ | ✅ |
| SSO/SAML | ❌ | ❌ | ✅ |
| Dedicated CSM | ❌ | ❌ | ✅ |
| SLA | Standard | Priority | Premium |

---

**Document maintained by:** Engineering Team
**Next review:** After Phase 1 completion
