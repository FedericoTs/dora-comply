# NIS2 Risk Management Module - Complete Specification

> **Version:** 1.0
> **Date:** January 2026
> **Goal:** Build the most complete and user-friendly NIS2 TPRM solution in EMEA

---

## Executive Summary

This specification defines a comprehensive NIS2 compliance and risk management module that will make DORA Comply the **10X better** choice for EMEA organizations. The module combines:

1. **Mathematical Risk Assessment** - Inherent → Controls → Residual risk calculation
2. **Visual Risk Map** - Interactive heat map with drill-down
3. **Document Repository** - Evidence management per control
4. **Automated Scoring** - Real-time compliance calculation
5. **Gap-to-Action Workflow** - From identified gap to tracked remediation

---

## 1. Information Architecture

### 1.1 NIS2 Module Structure

```
/nis2
├── /dashboard          ← Main NIS2 compliance overview
├── /risk-register      ← Central risk repository (NEW)
├── /risk-map           ← Visual heat map (NEW)
├── /assessments        ← Risk assessments by category (NEW)
│   ├── /governance
│   ├── /risk-management
│   ├── /incident-handling
│   ├── /business-continuity
│   ├── /supply-chain
│   └── /reporting
├── /controls           ← Control library & effectiveness (NEW)
├── /gaps               ← Gap analysis (EXISTS - enhance)
├── /incidents          ← NIS2-specific incident workflow (ADAPT)
├── /documents          ← Evidence repository (EXISTS - enhance)
└── /reports            ← Compliance reports (NEW)
```

### 1.2 Navigation Hierarchy

**Level 1: NIS2 Overview**
- Compliance score (0-100%)
- Risk posture summary (Critical/High/Medium/Low counts)
- Quick actions (Start Assessment, Add Risk, Generate Report)

**Level 2: Category Deep-Dive**
- 6 categories with individual scores
- Requirements checklist per category
- Evidence attachment per requirement

**Level 3: Risk Management**
- Risk register with inherent/residual scores
- Heat map visualization
- Treatment plan tracking

---

## 2. Risk Assessment Methodology

### 2.1 Mathematical Framework

#### Core Formula
```
Inherent Risk = Likelihood × Impact
Residual Risk = Inherent Risk × (1 - Control Effectiveness)
```

#### Likelihood Scale (1-5)
| Score | Label | Description | Frequency |
|-------|-------|-------------|-----------|
| 1 | Rare | May occur in exceptional circumstances | < 1% / year |
| 2 | Unlikely | Could occur at some time | 1-10% / year |
| 3 | Possible | Might occur at some time | 10-50% / year |
| 4 | Likely | Will probably occur | 50-90% / year |
| 5 | Almost Certain | Expected to occur | > 90% / year |

#### Impact Scale (1-5)
| Score | Label | Financial | Operational | Reputational |
|-------|-------|-----------|-------------|--------------|
| 1 | Negligible | < €10K | < 1 hour downtime | No media |
| 2 | Minor | €10K - €100K | 1-8 hours | Local media |
| 3 | Moderate | €100K - €1M | 8-24 hours | National media |
| 4 | Major | €1M - €10M | 1-7 days | EU-wide media |
| 5 | Catastrophic | > €10M | > 7 days | Global, regulatory |

#### Risk Matrix (5×5)

```
Impact
  5  │ 5  │ 10 │ 15 │ 20 │ 25 │  ← Catastrophic
  4  │ 4  │  8 │ 12 │ 16 │ 20 │  ← Major
  3  │ 3  │  6 │  9 │ 12 │ 15 │  ← Moderate
  2  │ 2  │  4 │  6 │  8 │ 10 │  ← Minor
  1  │ 1  │  2 │  3 │  4 │  5 │  ← Negligible
     └────┴────┴────┴────┴────┘
       1    2    3    4    5
      Rare      →      Almost Certain
                Likelihood
```

#### Risk Levels
| Score Range | Level | Color | Action Required |
|-------------|-------|-------|-----------------|
| 1-4 | Low | Green | Monitor annually |
| 5-9 | Medium | Yellow | Review quarterly |
| 10-15 | High | Orange | Mitigate within 90 days |
| 16-25 | Critical | Red | Immediate action required |

#### Control Effectiveness Scale (0-100%)
| Score | Label | Description |
|-------|-------|-------------|
| 0% | None | No controls implemented |
| 25% | Minimal | Basic controls, not tested |
| 50% | Partial | Controls exist, partially effective |
| 75% | Substantial | Well-designed, operationally effective |
| 100% | Optimal | Fully effective, regularly tested |

### 2.2 Example Calculation

```typescript
// Risk: Unauthorized access to critical systems
const inherentRisk = {
  likelihood: 4, // Likely
  impact: 4,     // Major
  score: 4 × 4 = 16 // Critical
};

// Controls: MFA, Access reviews, Monitoring
const controls = [
  { name: 'MFA', effectiveness: 0.85 },
  { name: 'Access Reviews', effectiveness: 0.70 },
  { name: 'SIEM Monitoring', effectiveness: 0.60 }
];

// Combined control effectiveness (not simple average!)
// Uses formula: 1 - Π(1 - effectivenessᵢ)
const combinedEffectiveness = 1 - (1 - 0.85) * (1 - 0.70) * (1 - 0.60);
// = 1 - (0.15 * 0.30 * 0.40) = 1 - 0.018 = 0.982 = 98.2%

const residualRisk = {
  score: 16 × (1 - 0.982) = 16 × 0.018 = 0.29 ≈ 1 // Low
};
```

---

## 3. Database Schema

### 3.1 New Tables Required

```sql
-- Risk Register
CREATE TABLE nis2_risks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),

  -- Risk identification
  reference_code TEXT NOT NULL, -- e.g., "NIS2-RM-001"
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- NIS2 category

  -- Inherent risk assessment
  likelihood_score INT NOT NULL CHECK (likelihood_score BETWEEN 1 AND 5),
  impact_score INT NOT NULL CHECK (impact_score BETWEEN 1 AND 5),
  inherent_risk_score INT GENERATED ALWAYS AS (likelihood_score * impact_score) STORED,
  inherent_risk_level TEXT GENERATED ALWAYS AS (
    CASE
      WHEN likelihood_score * impact_score >= 16 THEN 'critical'
      WHEN likelihood_score * impact_score >= 10 THEN 'high'
      WHEN likelihood_score * impact_score >= 5 THEN 'medium'
      ELSE 'low'
    END
  ) STORED,

  -- Residual risk (calculated from controls)
  residual_likelihood INT,
  residual_impact INT,
  residual_risk_score INT,
  residual_risk_level TEXT,

  -- Risk treatment
  treatment_strategy TEXT CHECK (treatment_strategy IN ('mitigate', 'accept', 'transfer', 'avoid')),
  treatment_plan TEXT,
  treatment_due_date DATE,
  treatment_owner UUID REFERENCES users(id),

  -- Status tracking
  status TEXT DEFAULT 'identified' CHECK (status IN ('identified', 'assessed', 'treating', 'monitoring', 'closed')),
  review_date DATE,

  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, reference_code)
);

-- Risk-Control Linkage
CREATE TABLE nis2_risk_controls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  risk_id UUID NOT NULL REFERENCES nis2_risks(id) ON DELETE CASCADE,
  control_id UUID NOT NULL REFERENCES nis2_controls(id) ON DELETE CASCADE,
  effectiveness_score INT NOT NULL CHECK (effectiveness_score BETWEEN 0 AND 100),
  effectiveness_rationale TEXT,
  last_tested_at TIMESTAMPTZ,
  next_test_due DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(risk_id, control_id)
);

-- Control Library
CREATE TABLE nis2_controls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),

  -- Control identification
  reference_code TEXT NOT NULL, -- e.g., "CTRL-ACC-001"
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- NIS2 category

  -- Control details
  control_type TEXT CHECK (control_type IN ('preventive', 'detective', 'corrective')),
  implementation_status TEXT DEFAULT 'planned'
    CHECK (implementation_status IN ('planned', 'implementing', 'operational', 'needs_improvement', 'retired')),

  -- Effectiveness
  design_effectiveness INT CHECK (design_effectiveness BETWEEN 0 AND 100),
  operational_effectiveness INT CHECK (operational_effectiveness BETWEEN 0 AND 100),
  overall_effectiveness INT GENERATED ALWAYS AS (
    LEAST(COALESCE(design_effectiveness, 0), COALESCE(operational_effectiveness, 0))
  ) STORED,

  -- Evidence
  evidence_requirements TEXT[],
  last_evidence_date TIMESTAMPTZ,

  -- Ownership
  owner_id UUID REFERENCES users(id),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, reference_code)
);

-- Control Evidence
CREATE TABLE nis2_control_evidence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  control_id UUID NOT NULL REFERENCES nis2_controls(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id),

  evidence_type TEXT NOT NULL,
  description TEXT,
  valid_from DATE,
  valid_until DATE,

  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Risk Assessment History (for trend tracking)
CREATE TABLE nis2_risk_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  risk_id UUID NOT NULL REFERENCES nis2_risks(id) ON DELETE CASCADE,
  assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Point-in-time scores
  likelihood_score INT NOT NULL,
  impact_score INT NOT NULL,
  inherent_risk_score INT NOT NULL,
  residual_risk_score INT,

  -- Context
  assessor_id UUID REFERENCES users(id),
  assessment_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- NIS2 Incidents (extends existing incidents)
CREATE TABLE nis2_incident_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),

  -- NIS2 specific reporting
  report_type TEXT NOT NULL CHECK (report_type IN ('early_warning', 'incident_notification', 'intermediate', 'final')),

  -- Timeline compliance
  detection_time TIMESTAMPTZ NOT NULL,
  submission_deadline TIMESTAMPTZ NOT NULL,
  actual_submission_time TIMESTAMPTZ,

  -- Report content
  is_cross_border BOOLEAN DEFAULT FALSE,
  is_malicious BOOLEAN,
  affected_member_states TEXT[],

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'ready', 'submitted', 'acknowledged')),
  csirt_response TEXT,
  csirt_response_time TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.2 Row-Level Security

```sql
-- RLS for nis2_risks
ALTER TABLE nis2_risks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's risks"
  ON nis2_risks FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Users can insert risks for their organization"
  ON nis2_risks FOR INSERT
  WITH CHECK (organization_id = get_user_organization_id());

CREATE POLICY "Users can update their organization's risks"
  ON nis2_risks FOR UPDATE
  USING (organization_id = get_user_organization_id());

-- Similar policies for other tables...
```

---

## 4. UI/UX Design Specification

### 4.1 NIS2 Dashboard (Enhanced)

**Layout: Single Page App with Cards**

```
┌─────────────────────────────────────────────────────────────────────────┐
│ NIS2 Compliance Dashboard                                    [Actions ▼]│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │
│  │  Compliance      │  │  Risk Posture    │  │  Open Actions    │      │
│  │     72%          │  │  ██░░░░░░░░      │  │     12           │      │
│  │  ▲ 5% this month │  │  3 Critical      │  │  ⚠ 4 overdue     │      │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘      │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Risk Heat Map (Mini)                              [Full View →] │   │
│  │                                                                 │   │
│  │  Impact ▲                                                       │   │
│  │    5  │ · │ · │ 2 │ 1 │ 3 │  ← Click to drill down             │   │
│  │    4  │ · │ · │ · │ 5 │ · │                                     │   │
│  │    3  │ · │ 1 │ 4 │ 2 │ · │                                     │   │
│  │    2  │ 2 │ · │ · │ · │ · │                                     │   │
│  │    1  │ · │ · │ · │ · │ · │                                     │   │
│  │       └───┴───┴───┴───┴───┘                                     │   │
│  │         1   2   3   4   5 → Likelihood                          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Category Compliance                                             │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │ Governance (Art. 20)          ████████████████░░░░  80%  [→]   │   │
│  │ Risk Management (Art. 21)     █████████████░░░░░░░  65%  [→]   │   │
│  │ Incident Handling             ████████░░░░░░░░░░░░  45%  [→]   │   │
│  │ Business Continuity           ██████████████░░░░░░  70%  [→]   │   │
│  │ Supply Chain Security         ██████████████████░░  85%  [→]   │   │
│  │ Reporting (Art. 23)           ████████████████████  95%  [→]   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Recent Activity                                    [View All →] │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │ ● Risk NIS2-RM-012 assessed - Residual: High → Medium   2h ago │   │
│  │ ● Control CTRL-ACC-001 evidence uploaded             Yesterday │   │
│  │ ● Incident INC-2026-003 early warning submitted      Yesterday │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Risk Register

**Layout: Table with Filters + Side Panel**

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Risk Register                           [+ Add Risk]  [Export]  [Filter]│
├─────────────────────────────────────────────────────────────────────────┤
│ Filters: Category [All ▼] Status [All ▼] Risk Level [All ▼]           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌────────────────────────────────────────────────┐ ┌─────────────────┐│
│  │ Risk List                                       │ │ Risk Detail     ││
│  ├────────────────────────────────────────────────┤ │ NIS2-RM-003     ││
│  │ ID          │ Title              │ Inh │ Res  │ │                 ││
│  ├─────────────┼────────────────────┼─────┼──────┤ │ Unauthorized    ││
│  │ NIS2-RM-001 │ Phishing attacks   │ 🔴20│ 🟡8  │ │ system access   ││
│  │ NIS2-RM-002 │ Vendor breach      │ 🟠16│ 🟢4  │ │                 ││
│  │ NIS2-RM-003 │ Unauthorized access│ 🟠12│ 🟡6  │ │ ─────────────── ││
│  │ NIS2-RM-004 │ Data exfiltration  │ 🔴20│ 🟠12 │ │ Category:       ││
│  │ NIS2-RM-005 │ Ransomware         │ 🔴25│ 🟠15 │ │ Risk Management ││
│  │ NIS2-RM-006 │ Insider threat     │ 🟡9 │ 🟢3  │ │                 ││
│  │ ...         │ ...                │ ... │ ...  │ │ Inherent: 12 🟠 ││
│  └────────────────────────────────────────────────┘ │ L:3 × I:4       ││
│                                                      │                 ││
│  ┌─ Legend ──────────────────────────────────────┐  │ Residual: 6 🟡  ││
│  │ 🔴 Critical (16-25)  🟠 High (10-15)          │  │ L:2 × I:3       ││
│  │ 🟡 Medium (5-9)      🟢 Low (1-4)             │  │                 ││
│  └───────────────────────────────────────────────┘  │ Controls (3):   ││
│                                                      │ • MFA (85%)     ││
│                                                      │ • Reviews (70%) ││
│                                                      │ • SIEM (60%)    ││
│                                                      │                 ││
│                                                      │ [Assess] [Edit] ││
│                                                      └─────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.3 Risk Assessment Wizard

**Flow: Step-by-Step with Visual Feedback**

```
Step 1: Identify Risk
┌─────────────────────────────────────────────────────────────────────────┐
│ New Risk Assessment                                        Step 1 of 4  │
├─────────────────────────────────────────────────────────────────────────┤
│ ● Identify  ○ Assess  ○ Controls  ○ Treatment                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Risk Title *                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Unauthorized access to customer data                            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Description                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Risk of unauthorized personnel or external actors gaining       │   │
│  │ access to sensitive customer PII stored in production systems.  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  NIS2 Category *                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Risk Management (Article 21)                              [▼]   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Risk Owner                                                            │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Maria Schmidt (CISO)                                      [▼]   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│                                               [Cancel]  [Next Step →]   │
└─────────────────────────────────────────────────────────────────────────┘

Step 2: Assess Inherent Risk
┌─────────────────────────────────────────────────────────────────────────┐
│ New Risk Assessment                                        Step 2 of 4  │
├─────────────────────────────────────────────────────────────────────────┤
│ ✓ Identify  ● Assess  ○ Controls  ○ Treatment                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Rate LIKELIHOOD (without controls)                                    │
│                                                                         │
│    1 ○  Rare         - May occur only in exceptional circumstances     │
│    2 ○  Unlikely     - Could occur at some time                        │
│    3 ●  Possible     - Might occur at some time (10-50%/year)          │
│    4 ○  Likely       - Will probably occur in most circumstances       │
│    5 ○  Almost Certain - Expected to occur                             │
│                                                                         │
│  Rate IMPACT (if it occurs)                                            │
│                                                                         │
│    1 ○  Negligible   - < €10K, minimal disruption                      │
│    2 ○  Minor        - €10K-100K, 1-8 hours downtime                   │
│    3 ○  Moderate     - €100K-1M, 8-24 hours downtime                   │
│    4 ●  Major        - €1M-10M, 1-7 days downtime, regulatory notice   │
│    5 ○  Catastrophic - > €10M, > 7 days, significant fines             │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     INHERENT RISK SCORE                         │   │
│  │                                                                 │   │
│  │         3 (Likelihood) × 4 (Impact) = 12 HIGH 🟠               │   │
│  │                                                                 │   │
│  │  Impact ▲                                                       │   │
│  │    5  │   │   │   │   │   │                                     │   │
│  │    4  │   │   │ ● │   │   │  ← You are here                     │   │
│  │    3  │   │   │   │   │   │                                     │   │
│  │    2  │   │   │   │   │   │                                     │   │
│  │    1  │   │   │   │   │   │                                     │   │
│  │       └───┴───┴───┴───┴───┘                                     │   │
│  │         1   2   3   4   5 → Likelihood                          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│                                    [← Back]  [Skip Controls]  [Next →]  │
└─────────────────────────────────────────────────────────────────────────┘

Step 3: Link Controls
┌─────────────────────────────────────────────────────────────────────────┐
│ New Risk Assessment                                        Step 3 of 4  │
├─────────────────────────────────────────────────────────────────────────┤
│ ✓ Identify  ✓ Assess  ● Controls  ○ Treatment                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  What controls mitigate this risk?                    [+ Add Control]  │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Control                        │ Type       │ Effectiveness     │   │
│  ├────────────────────────────────┼────────────┼───────────────────┤   │
│  │ ☑ Multi-Factor Authentication │ Preventive │ █████████░░ 85%  │   │
│  │ ☑ Quarterly Access Reviews    │ Detective  │ ███████░░░░ 70%  │   │
│  │ ☑ SIEM Monitoring             │ Detective  │ ██████░░░░░ 60%  │   │
│  │ ☐ Privileged Access Mgmt      │ Preventive │ ░░░░░░░░░░░  N/A │   │
│  │ ☐ Data Loss Prevention        │ Detective  │ ░░░░░░░░░░░  N/A │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                  RESIDUAL RISK CALCULATION                      │   │
│  │                                                                 │   │
│  │  Combined Control Effectiveness: 98.2%                          │   │
│  │  Formula: 1 - (1-0.85) × (1-0.70) × (1-0.60) = 98.2%           │   │
│  │                                                                 │   │
│  │  Inherent Risk:  12 (HIGH 🟠)                                   │   │
│  │  Residual Risk:  12 × (1 - 0.982) = 0.22 ≈ 1 (LOW 🟢)          │   │
│  │                                                                 │   │
│  │  Impact ▲                      Impact ▲                         │   │
│  │    5  │   │   │   │   │   │      5  │   │   │   │   │   │      │   │
│  │    4  │   │   │ ● │   │   │  →    4  │   │   │   │   │   │      │   │
│  │    3  │   │   │   │   │   │      3  │   │   │   │   │   │      │   │
│  │    2  │   │   │   │   │   │      2  │   │   │   │   │   │      │   │
│  │    1  │   │   │   │   │   │      1  │ ● │   │   │   │   │      │   │
│  │       └───┴───┴───┴───┴───┘         └───┴───┴───┴───┴───┘      │   │
│  │       BEFORE                        AFTER                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│                                               [← Back]  [Next Step →]   │
└─────────────────────────────────────────────────────────────────────────┘

Step 4: Treatment Plan
┌─────────────────────────────────────────────────────────────────────────┐
│ New Risk Assessment                                        Step 4 of 4  │
├─────────────────────────────────────────────────────────────────────────┤
│ ✓ Identify  ✓ Assess  ✓ Controls  ● Treatment                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Current Residual Risk: 1 (LOW 🟢) - Within acceptable tolerance      │
│                                                                         │
│  Treatment Strategy *                                                  │
│                                                                         │
│    ● Accept    - Risk is within tolerance, monitor only                │
│    ○ Mitigate  - Implement additional controls                         │
│    ○ Transfer  - Shift risk (insurance, outsource)                     │
│    ○ Avoid     - Eliminate the activity causing risk                   │
│                                                                         │
│  Rationale                                                             │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ With MFA, access reviews, and SIEM monitoring in place, the     │   │
│  │ residual risk is acceptably low. We will continue monitoring    │   │
│  │ and review annually or upon significant change.                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Next Review Date                                                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ 2026-07-15                                                [📅]   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ☑ I confirm management body approval of this risk acceptance         │
│                                                                         │
│                                      [← Back]  [Save as Draft]  [✓ Complete Assessment]  │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.4 Interactive Risk Heat Map

**Features:**
- Click cell to see risks in that position
- Drag risk to reassess
- Toggle inherent/residual view
- Filter by category

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Risk Heat Map                                        [Inherent ▼] [⟳]  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Filters: Category [All ▼]  Status [All ▼]  Owner [All ▼]             │
│                                                                         │
│  Impact                                                                │
│                                                                         │
│  Catastrophic │     │     │  2  │  1  │  3  │                          │
│         (5)   │     │     │risks│risk │risks│                          │
│               ├─────┼─────┼─────┼─────┼─────┤                          │
│       Major   │     │     │     │  5  │     │                          │
│         (4)   │     │     │     │risks│     │                          │
│               ├─────┼─────┼─────┼─────┼─────┤                          │
│     Moderate  │     │  1  │  4  │  2  │     │                          │
│         (3)   │     │risk │risks│risks│     │                          │
│               ├─────┼─────┼─────┼─────┼─────┤                          │
│       Minor   │  2  │     │     │     │     │                          │
│         (2)   │risks│     │     │     │     │                          │
│               ├─────┼─────┼─────┼─────┼─────┤                          │
│   Negligible  │     │     │     │     │     │                          │
│         (1)   │     │     │     │     │     │                          │
│               └─────┴─────┴─────┴─────┴─────┘                          │
│                 Rare  Unl.  Poss. Like. Cert.                          │
│                  (1)   (2)   (3)   (4)   (5)                           │
│                             Likelihood                                 │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ Cell Details: Likely × Major (Score: 16)           3 Risks     │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │ NIS2-RM-001  Phishing attack campaign      Critical  [View →]  │   │
│  │ NIS2-RM-004  Data exfiltration             Critical  [View →]  │   │
│  │ NIS2-RM-005  Ransomware infection          Critical  [View →]  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Legend:                                                               │
│  ░░░ Low (1-4)  ▓▓▓ Medium (5-9)  ███ High (10-15)  ■■■ Critical (16-25) │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.5 Control Library

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Control Library                              [+ Add Control] [Import]  │
├─────────────────────────────────────────────────────────────────────────┤
│ Search: [________________________]  Category: [All ▼]  Status: [All ▼] │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ ID          │ Control Name           │ Type    │ Effect. │ Risks│   │
│  ├─────────────┼────────────────────────┼─────────┼─────────┼──────┤   │
│  │ CTRL-ACC-001│ Multi-Factor Auth      │ Prevent │ 85% ███ │  12  │   │
│  │ CTRL-ACC-002│ Access Reviews         │ Detect  │ 70% ██░ │   8  │   │
│  │ CTRL-ACC-003│ Privileged Access Mgmt │ Prevent │ 75% ██░ │   5  │   │
│  │ CTRL-DET-001│ SIEM Monitoring        │ Detect  │ 60% █░░ │  15  │   │
│  │ CTRL-DET-002│ IDS/IPS                │ Detect  │ 65% ██░ │   7  │   │
│  │ CTRL-ENC-001│ Data Encryption at Rest│ Prevent │ 90% ███ │   4  │   │
│  │ CTRL-BCP-001│ Backup & Recovery      │ Correct │ 80% ███ │   6  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  Total: 47 controls  │  Avg Effectiveness: 72%  │  Evidence Gap: 12   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.6 NIS2 Incident Reporting Workflow

```
┌─────────────────────────────────────────────────────────────────────────┐
│ Incident: INC-2026-003                                      [Actions ▼]│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Status Timeline                                                       │
│  ═══════════════════════════════════════════════════════════════════   │
│  ● Detected     ● Early Warning    ○ Notification    ○ Final Report   │
│  Jan 15, 10:30  Due: Jan 15, 11:30  Due: Jan 18       Due: Feb 15     │
│                 ✓ Submitted 10:45                                      │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ EARLY WARNING                                         ✓ Sent    │   │
│  │ Deadline: 24 hours from detection                               │   │
│  │ Submitted: 15 minutes after detection ✓                         │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │ ☑ Is suspected unlawful/malicious: Yes                          │   │
│  │ ☑ Could have cross-border impact: Under investigation           │   │
│  │ ☑ CSIRT notified: DE-BSIRT                                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ INCIDENT NOTIFICATION                                ⏱ 2d 14h   │   │
│  │ Deadline: 72 hours from detection                               │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │                                                                 │   │
│  │ Initial Assessment                                              │   │
│  │ ┌─────────────────────────────────────────────────────────────┐ │   │
│  │ │ Ransomware incident affecting production file servers.      │ │   │
│  │ │ Impact assessment in progress.                              │ │   │
│  │ └─────────────────────────────────────────────────────────────┘ │   │
│  │                                                                 │   │
│  │ Severity: [Major ▼]      Impact: [Significant ▼]               │   │
│  │                                                                 │   │
│  │ Indicators of Compromise                                        │   │
│  │ ┌─────────────────────────────────────────────────────────────┐ │   │
│  │ │ • SHA256: a1b2c3d4...                                       │ │   │
│  │ │ • IP: 192.168.x.x (C2 server)                              │ │   │
│  │ │ • File extension: .locked                                   │ │   │
│  │ └─────────────────────────────────────────────────────────────┘ │   │
│  │                                                                 │   │
│  │                        [Save Draft] [Submit to CSIRT →]         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Component Reuse Strategy

### 5.1 Existing Components to Reuse

| Component | Location | Reuse For |
|-----------|----------|-----------|
| `nis2-dashboard.tsx` | `/src/components/compliance/` | Base dashboard layout |
| `nis2-gap-list.tsx` | `/src/components/compliance/` | Gap management UI |
| `vendor-risk-gauge.tsx` | `/src/components/vendors/detail/` | Risk score visualization |
| `maturity-level-badge.tsx` | `/src/components/compliance/` | Status badges |
| `dora-gap-remediation/` | `/src/components/compliance/` | Remediation workflow pattern |
| `stat-card.tsx` | `/src/components/ui/` | KPI cards |
| `progress.tsx` | `/src/components/ui/` | Progress bars |
| `incident-form.tsx` | `/src/components/incidents/` | Incident reporting base |

### 5.2 New Components Required

| Component | Purpose | Priority |
|-----------|---------|----------|
| `risk-heat-map.tsx` | Interactive 5×5 risk matrix | P1 |
| `risk-assessment-wizard.tsx` | 4-step assessment flow | P1 |
| `control-library.tsx` | Control management | P1 |
| `control-effectiveness-slider.tsx` | 0-100% effectiveness | P1 |
| `risk-comparison-chart.tsx` | Inherent vs Residual | P1 |
| `nis2-incident-timeline.tsx` | 24h/72h/30d workflow | P1 |
| `risk-register-table.tsx` | Paginated risk list | P1 |
| `risk-detail-panel.tsx` | Slide-over risk details | P2 |
| `control-evidence-upload.tsx` | Evidence attachment | P2 |
| `risk-trend-chart.tsx` | Historical risk trends | P3 |

---

## 6. Implementation Phases

### Phase 1: Risk Assessment Foundation (Week 1-2)
1. Database migrations for risk tables
2. Risk calculation utilities
3. Basic risk register CRUD
4. Risk heat map component

### Phase 2: Control Management (Week 2-3)
1. Control library pages
2. Control-Risk linking
3. Effectiveness calculation
4. Evidence attachment

### Phase 3: Assessment Workflow (Week 3-4)
1. Assessment wizard
2. Inherent/Residual comparison
3. Treatment planning
4. Review scheduling

### Phase 4: NIS2 Incident Reporting (Week 4-5)
1. Adapt incident module for NIS2 24/72/30 timeline
2. CSIRT notification workflow
3. Cross-border impact tracking
4. Report templates

### Phase 5: Dashboard & Reports (Week 5-6)
1. Enhanced NIS2 dashboard
2. Compliance reports (PDF export)
3. Management summary views
4. Trend analytics

---

## 7. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to complete assessment | < 10 minutes | User session tracking |
| Risk register completeness | > 80% fields filled | Data quality checks |
| Control effectiveness documented | > 90% controls | Evidence count |
| Incident report timeline compliance | 100% on-time | Submission timestamps |
| User satisfaction (NPS) | > 50 | In-app surveys |

---

## 8. Technical Notes

### 8.1 Risk Score Calculation Function

```typescript
// src/lib/nis2/risk-calculator.ts

export interface RiskAssessment {
  likelihood: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
}

export interface ControlEffectiveness {
  controlId: string;
  effectiveness: number; // 0-100
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export function calculateInherentRisk(assessment: RiskAssessment): number {
  return assessment.likelihood * assessment.impact;
}

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 16) return 'critical';
  if (score >= 10) return 'high';
  if (score >= 5) return 'medium';
  return 'low';
}

export function calculateCombinedControlEffectiveness(
  controls: ControlEffectiveness[]
): number {
  if (controls.length === 0) return 0;

  // Combined effectiveness = 1 - Π(1 - effectivenessᵢ)
  const product = controls.reduce(
    (acc, ctrl) => acc * (1 - ctrl.effectiveness / 100),
    1
  );

  return Math.round((1 - product) * 100);
}

export function calculateResidualRisk(
  inherentRisk: number,
  combinedEffectiveness: number
): number {
  return Math.max(1, Math.round(inherentRisk * (1 - combinedEffectiveness / 100)));
}

export interface RiskCalculationResult {
  inherentRisk: number;
  inherentRiskLevel: RiskLevel;
  combinedControlEffectiveness: number;
  residualRisk: number;
  residualRiskLevel: RiskLevel;
  riskReduction: number; // percentage
}

export function calculateFullRiskAssessment(
  assessment: RiskAssessment,
  controls: ControlEffectiveness[]
): RiskCalculationResult {
  const inherentRisk = calculateInherentRisk(assessment);
  const combinedEffectiveness = calculateCombinedControlEffectiveness(controls);
  const residualRisk = calculateResidualRisk(inherentRisk, combinedEffectiveness);

  return {
    inherentRisk,
    inherentRiskLevel: getRiskLevel(inherentRisk),
    combinedControlEffectiveness: combinedEffectiveness,
    residualRisk,
    residualRiskLevel: getRiskLevel(residualRisk),
    riskReduction: Math.round(((inherentRisk - residualRisk) / inherentRisk) * 100),
  };
}
```

### 8.2 Heat Map Data Structure

```typescript
// src/lib/nis2/risk-heat-map.ts

export interface HeatMapCell {
  likelihood: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  score: number;
  level: RiskLevel;
  risks: {
    id: string;
    title: string;
    category: string;
  }[];
}

export type HeatMapData = HeatMapCell[][];

export function generateHeatMapData(risks: NIS2Risk[]): HeatMapData {
  const matrix: HeatMapData = [];

  for (let impact = 5; impact >= 1; impact--) {
    const row: HeatMapCell[] = [];
    for (let likelihood = 1; likelihood <= 5; likelihood++) {
      const cellRisks = risks.filter(
        r => r.likelihood_score === likelihood && r.impact_score === impact
      );
      row.push({
        likelihood: likelihood as 1|2|3|4|5,
        impact: impact as 1|2|3|4|5,
        score: likelihood * impact,
        level: getRiskLevel(likelihood * impact),
        risks: cellRisks.map(r => ({
          id: r.id,
          title: r.title,
          category: r.category,
        })),
      });
    }
    matrix.push(row);
  }

  return matrix;
}
```

---

## 9. References

- [NIS2 Directive Article 21](https://www.nis-2-directive.com/NIS_2_Directive_Article_21.html)
- [NIS2 Implementing Regulation EU 2024/2690](https://www.enisa.europa.eu/publications/nis2-technical-implementation-guidance)
- [ENISA Technical Implementation Guidance (June 2025)](https://www.enisa.europa.eu/publications/nis2-technical-implementation-guidance)
- [ISO 31000:2018 Risk Management](https://www.iso.org/iso-31000-risk-management.html)
- [FAIR Risk Quantification Framework](https://www.fairinstitute.org/)

---

## Appendix A: NIS2 Category → Requirement Mapping

| Category | Article | Requirements Count | Weight |
|----------|---------|-------------------|--------|
| Governance | Art. 20 | 3 | 15% |
| Risk Management | Art. 21(2)(a-j) | 25+ | 25% |
| Incident Handling | Art. 21(2)(b) | 8 | 20% |
| Business Continuity | Art. 21(2)(c) | 5 | 15% |
| Supply Chain | Art. 21(2)(d) | 8 | 15% |
| Reporting | Art. 23 | 7 | 10% |

---

## Appendix B: Comparison with Competitors

| Feature | DORA Comply | OneTrust | 3rdRisk | BitSight |
|---------|-------------|----------|---------|----------|
| NIS2 Native | ✅ Full | ⚠️ Add-on | ✅ Full | ❌ |
| Risk Heat Map | ✅ Interactive | ✅ Basic | ⚠️ Limited | ❌ |
| Inherent/Residual | ✅ Auto-calc | ⚠️ Manual | ⚠️ Manual | ❌ |
| Control Library | ✅ Built-in | ✅ Enterprise | ⚠️ Basic | ❌ |
| 24/72/30 Workflow | ✅ Automated | ⚠️ Manual | ⚠️ Basic | ❌ |
| EU Document Parsing | ✅ ISO/BSI C5 | ⚠️ SOC 2 only | ⚠️ Limited | ⚠️ Limited |
| Pricing | €€ | €€€€ | €€ | €€€€ |
