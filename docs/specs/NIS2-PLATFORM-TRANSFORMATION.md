# NIS2 Platform Transformation - Complete Architecture

> **Version:** 1.0
> **Date:** January 2026
> **Goal:** Transform DORA Comply into the 10X best-in-class NIS2 TPRM platform for EMEA

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Analysis](#2-current-state-analysis)
3. [Target State Vision](#3-target-state-vision)
4. [Risk Positioning Matrix](#4-risk-positioning-matrix)
5. [UI/UX Design Patterns](#5-uiux-design-patterns)
6. [Component Architecture](#6-component-architecture)
7. [Database Design](#7-database-design)
8. [Implementation Roadmap](#8-implementation-roadmap)
9. [Success Criteria](#9-success-criteria)

---

## 1. Executive Summary

### The Challenge

Organizations in EMEA need to comply with NIS2 by October 2024 (transposition) and enforce by January 2025+. They face:

- **Complex risk assessment requirements** with no clear methodology
- **Fragmented tools** that don't connect risks to controls to evidence
- **Manual processes** for inherent vs residual risk calculation
- **No visual positioning** to understand where they stand
- **Expensive enterprise solutions** (OneTrust €100K+/year) or inadequate free tools

### Our Solution

Build the **simplest yet most complete** NIS2 risk management platform that:

1. **Shows exactly where you stand** - Visual risk matrix with current position marker
2. **Guides you to compliance** - Clear path from current state to target state
3. **Automates calculations** - Mathematical risk assessment with compound control effectiveness
4. **Integrates everything** - Risks → Controls → Evidence → Reports in one flow
5. **Costs 10X less** than enterprise alternatives

### Key Differentiators

| Feature | Us | Competitors |
|---------|-----|-------------|
| Visual Position Indicator | ✅ "You are here" marker | ❌ Just heat map |
| Target State Guidance | ✅ "What to do next" | ❌ Manual interpretation |
| Compound Control Effectiveness | ✅ Mathematical formula | ❌ Simple average |
| EMEA Document Support | ✅ ISO/BSI C5/ISAE 3402 | ⚠️ SOC 2 only |
| Price Point | ✅ €200-500/month | ❌ €5K-20K/month |

---

## 2. Current State Analysis

### 2.1 What We Have Built

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CURRENT PLATFORM CAPABILITIES                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ✅ COMPLETE                    ⚠️ PARTIAL                 ❌ MISSING   │
│                                                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐         │
│  │ DORA Framework  │  │ NIS2 Framework  │  │ Risk Management │         │
│  │ • Full controls │  │ • 56 requirements│  │ • Risk register │         │
│  │ • Gap analysis  │  │ • Basic scoring  │  │ • Heat map     │         │
│  │ • Remediation   │  │ • Calculator     │  │ • Controls lib │         │
│  │ • Testing       │  │ • Dashboard      │  │ • Assessment   │         │
│  │ • TLPT          │  │ ─────────────── │  │   wizard       │         │
│  │ • RoI templates │  │ NEEDS:          │  │ • Inherent vs  │         │
│  └─────────────────┘  │ • Risk scoring   │  │   Residual     │         │
│                       │ • Control link   │  │ • Treatment    │         │
│  ┌─────────────────┐  │ • Evidence mgmt  │  │   planning     │         │
│  │ Vendor Mgmt     │  └─────────────────┘  └─────────────────┘         │
│  │ • Full CRUD     │                                                    │
│  │ • Risk scoring  │  ┌─────────────────┐  ┌─────────────────┐         │
│  │ • Assessments   │  │ Incidents       │  │ Reporting       │         │
│  │ • Documents     │  │ • Basic CRUD    │  │ • PDF export   │         │
│  │ • LEI/contracts │  │ • Classification│  │ • CSIRT format │         │
│  └─────────────────┘  │ ─────────────── │  │ • Board summary│         │
│                       │ NEEDS:          │  │ • Trend charts │         │
│  ┌─────────────────┐  │ • 24/72/30 flow │  └─────────────────┘         │
│  │ Documents       │  │ • CSIRT notify  │                              │
│  │ • Upload/parse  │  │ • Cross-border  │                              │
│  │ • AI extraction │  └─────────────────┘                              │
│  │ • Evidence link │                                                    │
│  └─────────────────┘                                                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Existing Components Inventory

| Component | Location | Reusability |
|-----------|----------|-------------|
| `nis2-dashboard.tsx` | `src/components/compliance/` | ✅ Enhance |
| `nis2-gap-list.tsx` | `src/components/compliance/` | ✅ Enhance |
| `nis2-calculator.ts` | `src/lib/compliance/` | ⚠️ Needs risk calc |
| `nis2-requirements.ts` | `src/lib/compliance/` | ✅ Keep |
| `vendor-risk-gauge.tsx` | `src/components/vendors/` | ✅ Reuse |
| `stat-card.tsx` | `src/components/ui/` | ✅ Reuse |
| `incident-form.tsx` | `src/components/incidents/` | ✅ Extend |
| `dora-gap-remediation/` | `src/components/compliance/` | ✅ Pattern reuse |

### 2.3 Gap Analysis

| Capability | Current State | Gap | Priority |
|------------|---------------|-----|----------|
| Risk Register | None | Full build | P0 |
| Heat Map | None | Full build | P0 |
| Control Library | Basic (per vendor) | Centralize | P0 |
| Inherent/Residual | None | Full build | P0 |
| Position Indicator | None | Full build | P0 |
| Target State Guidance | None | Full build | P1 |
| NIS2 Incident Timeline | Basic | Add 24/72/30 | P1 |
| Evidence Management | Per document | Per control | P1 |
| Trend Analytics | None | Add history | P2 |

---

## 3. Target State Vision

### 3.1 User Journey

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    TARGET USER JOURNEY                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                 │
│  │ 1. LANDING  │ ──▶│ 2. ASSESS   │ ──▶│ 3. POSITION │                 │
│  │             │    │             │    │             │                 │
│  │ "Where am I │    │ "What's my  │    │ "Where do I │                 │
│  │  on NIS2?"  │    │  inherent   │    │  stand now? │                 │
│  │             │    │  risk?"     │    │  vs target" │                 │
│  └─────────────┘    └─────────────┘    └─────────────┘                 │
│         │                 │                   │                         │
│         │                 ▼                   ▼                         │
│         │          ┌─────────────┐    ┌─────────────┐                 │
│         │          │ Wizard      │    │ Heat Map    │                 │
│         │          │ L × I = ?   │    │ You Are Here│                 │
│         │          └─────────────┘    │      ●      │                 │
│         │                              │ Target: ★   │                 │
│         │                              └─────────────┘                 │
│         ▼                                     │                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                 │
│  │ 4. CONTROL  │ ◀──│ 5. TREAT    │ ◀──│ What to do? │                 │
│  │             │    │             │    │             │                 │
│  │ "Which      │    │ "Accept,    │    │ "Guided     │                 │
│  │  controls   │    │  mitigate,  │    │  remediation│                 │
│  │  help?"     │    │  transfer,  │    │  plan"      │                 │
│  │             │    │  avoid"     │    │             │                 │
│  └─────────────┘    └─────────────┘    └─────────────┘                 │
│         │                 │                   │                         │
│         ▼                 ▼                   ▼                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                 │
│  │ 6. EVIDENCE │ ──▶│ 7. MONITOR  │ ──▶│ 8. REPORT   │                 │
│  │             │    │             │    │             │                 │
│  │ "Attach     │    │ "Track      │    │ "Generate   │                 │
│  │  proof of   │    │  progress   │    │  compliance │                 │
│  │  compliance"│    │  over time" │    │  report"    │                 │
│  └─────────────┘    └─────────────┘    └─────────────┘                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Information Architecture

```
/nis2
├── /dashboard              ← Main NIS2 compliance overview
│   ├── Compliance score card
│   ├── Risk posture summary with POSITION MARKER
│   ├── Category breakdown
│   └── Quick actions
│
├── /risk-register          ← Central risk repository
│   ├── Risk list with filters
│   ├── Add/Edit risk wizard
│   └── Risk detail panel
│
├── /risk-map               ← Visual heat map
│   ├── 5×5 matrix with cell interaction
│   ├── "You are here" indicator
│   ├── "Target state" marker
│   └── Drill-down to risk list
│
├── /controls               ← Control library
│   ├── Control inventory
│   ├── Effectiveness scoring
│   ├── Evidence attachment
│   └── Risk linkage
│
├── /assessment             ← Risk assessment wizard
│   ├── Step 1: Identify
│   ├── Step 2: Assess (L × I)
│   ├── Step 3: Link controls
│   └── Step 4: Treatment plan
│
├── /incidents              ← NIS2 incident reporting
│   ├── Timeline view (24h/72h/30d)
│   ├── CSIRT notification
│   └── Cross-border tracking
│
└── /reports                ← Compliance reports
    ├── Board summary
    ├── Auditor package
    └── Trend analytics
```

---

## 4. Risk Positioning Matrix

### 4.1 The Core Innovation: "You Are Here" + "Target State"

This is the **key differentiator** that makes our platform 10X better. Instead of just showing a heat map, we show:

1. **Current Position** (●) - Where the organization stands RIGHT NOW
2. **Target Position** (★) - Where they SHOULD be (within risk tolerance)
3. **Path to Target** (→) - What they need to do to get there

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    RISK POSITIONING MATRIX                              │
│                                                                         │
│  Impact                                                                │
│                                                                         │
│  Catastrophic │     │     │     │ ●←─┐│     │  Current: 20 (Critical)  │
│         (5)   │     │     │     │CURR│     │  "Ransomware attack"      │
│               ├─────┼─────┼─────┼─────┼─────┤                          │
│       Major   │     │     │     │     │     │                          │
│         (4)   │     │     │     │     │     │                          │
│               ├─────┼─────┼─────┼─────┼─────┤                          │
│     Moderate  │     │     │ ★←─┐│     │     │  Target: 9 (Medium)      │
│         (3)   │     │     │TARG│     │     │  "With controls"          │
│               ├─────┼─────┼─────┼─────┼─────┤                          │
│       Minor   │     │     │     │     │     │                          │
│         (2)   │     │     │     │     │     │                          │
│               ├─────┼─────┼─────┼─────┼─────┤                          │
│   Negligible  │     │     │     │     │     │                          │
│         (1)   │     │     │     │     │     │                          │
│               └─────┴─────┴─────┴─────┴─────┘                          │
│                 Rare  Unl.  Poss. Like. Cert.                          │
│                  (1)   (2)   (3)   (4)   (5)                           │
│                             Likelihood                                 │
│                                                                         │
│  ─────────────────────────────────────────────────────────────────     │
│  WHAT TO DO TO REACH TARGET:                                           │
│                                                                         │
│  1. ☐ Implement endpoint backup (reduces Impact 5→3)      CRITICAL     │
│  2. ☐ Deploy EDR solution (reduces Likelihood 4→3)        HIGH         │
│  3. ☐ Conduct phishing awareness training                 MEDIUM       │
│  4. ☐ Test disaster recovery procedures quarterly         MEDIUM       │
│                                                                         │
│  Combined Control Effectiveness after changes: 89%                     │
│  Expected Residual Risk: 3 × 3 × (1-0.89) = 0.99 ≈ 1 (LOW)            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Visual Indicator Design

**Position Markers:**

```css
/* Current Position - Pulsing Red/Orange/Yellow/Green based on level */
.position-current {
  animation: pulse 2s ease-in-out infinite;
  border: 3px solid white;
  box-shadow: 0 0 10px currentColor;
}

.position-current.critical { background: #EF4444; }
.position-current.high { background: #F97316; }
.position-current.medium { background: #F59E0B; }
.position-current.low { background: #10B981; }

/* Target Position - Star with glow */
.position-target {
  shape: star;
  color: #3B82F6;
  box-shadow: 0 0 15px #3B82F6;
}

/* Path Arrow - Animated dash */
.position-path {
  stroke-dasharray: 5 3;
  animation: dash 1s linear infinite;
}
```

**Color Coding Matrix:**

```
┌──────────────────────────────────────────────────────┐
│                 HEAT MAP COLOR SCHEME                │
├──────────────────────────────────────────────────────┤
│                                                      │
│  Score  │ Level    │ Background   │ Text            │
│ ────────┼──────────┼──────────────┼──────────────── │
│  1-4    │ Low      │ #D1FAE5      │ #047857         │
│  5-9    │ Medium   │ #FEF3C7      │ #92400E         │
│  10-15  │ High     │ #FFEDD5      │ #C2410C         │
│  16-25  │ Critical │ #FEE2E2      │ #B91C1C         │
│                                                      │
│  Cell with risks: Show count badge                  │
│  Empty cell: Show subtle background only            │
│  Hover: Highlight cell, show tooltip                │
│  Click: Expand to show risk list                    │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 4.3 Aggregate Position Calculation

To show "where the organization stands overall," we calculate an **aggregate risk position**:

```typescript
interface AggregateRiskPosition {
  // Average position on the matrix
  avgLikelihood: number;       // 1-5 weighted average
  avgImpact: number;           // 1-5 weighted average
  avgScore: number;            // Overall risk score

  // Distribution
  criticalCount: number;       // Risks >= 16
  highCount: number;           // Risks 10-15
  mediumCount: number;         // Risks 5-9
  lowCount: number;            // Risks 1-4

  // Target comparison
  targetScore: number;         // Where they should be (configurable tolerance)
  gapToTarget: number;         // Distance to acceptable risk level

  // Trend
  trend: 'improving' | 'stable' | 'worsening';
  changeFromLastMonth: number;
}

function calculateAggregatePosition(risks: Risk[]): AggregateRiskPosition {
  const inherentRisks = risks.map(r => ({
    likelihood: r.likelihood_score,
    impact: r.impact_score,
    score: r.likelihood_score * r.impact_score
  }));

  const residualRisks = risks.map(r => ({
    likelihood: r.residual_likelihood || r.likelihood_score,
    impact: r.residual_impact || r.impact_score,
    score: r.residual_risk_score || r.inherent_risk_score
  }));

  // Use residual for current position (after controls)
  const current = residualRisks;

  return {
    avgLikelihood: average(current.map(r => r.likelihood)),
    avgImpact: average(current.map(r => r.impact)),
    avgScore: average(current.map(r => r.score)),

    criticalCount: current.filter(r => r.score >= 16).length,
    highCount: current.filter(r => r.score >= 10 && r.score < 16).length,
    mediumCount: current.filter(r => r.score >= 5 && r.score < 10).length,
    lowCount: current.filter(r => r.score < 5).length,

    // Target: No Critical or High risks
    targetScore: 6, // Maximum acceptable average (Medium)
    gapToTarget: Math.max(0, average(current.map(r => r.score)) - 6),

    trend: calculateTrend(risks),
    changeFromLastMonth: calculateChange(risks),
  };
}
```

### 4.4 Target State Guidance

The "What to do" section is **auto-generated** based on:

1. **Highest-impact risks** that are above tolerance
2. **Controls that would reduce** those risks most effectively
3. **Effort vs impact** prioritization

```typescript
interface RemediationGuidance {
  riskId: string;
  riskTitle: string;
  currentPosition: { likelihood: number; impact: number; score: number };
  targetPosition: { likelihood: number; impact: number; score: number };
  recommendedActions: {
    action: string;
    reducesLikelihood: boolean;
    reducesImpact: boolean;
    expectedReduction: number;
    priority: 'critical' | 'high' | 'medium' | 'low';
    effort: 'low' | 'medium' | 'high';
    linkedControl?: string;
  }[];
}

function generateGuidance(risk: Risk, controls: Control[]): RemediationGuidance {
  const suggestions: RemediationGuidance['recommendedActions'] = [];

  // Find controls not yet linked to this risk
  const unlinkedControls = controls.filter(c =>
    !risk.linkedControlIds.includes(c.id) &&
    c.category === risk.category
  );

  // Prioritize by effectiveness and implementation status
  const ranked = unlinkedControls
    .filter(c => c.implementation_status === 'operational')
    .sort((a, b) => b.overall_effectiveness - a.overall_effectiveness);

  for (const control of ranked.slice(0, 5)) {
    suggestions.push({
      action: `Implement ${control.title}`,
      reducesLikelihood: control.control_type === 'preventive',
      reducesImpact: control.control_type === 'corrective',
      expectedReduction: estimateReduction(risk, control),
      priority: prioritize(risk.inherent_risk_score, control.overall_effectiveness),
      effort: control.implementation_effort || 'medium',
      linkedControl: control.id,
    });
  }

  return {
    riskId: risk.id,
    riskTitle: risk.title,
    currentPosition: {
      likelihood: risk.residual_likelihood,
      impact: risk.residual_impact,
      score: risk.residual_risk_score,
    },
    targetPosition: calculateTargetPosition(risk),
    recommendedActions: suggestions,
  };
}
```

---

## 5. UI/UX Design Patterns

### 5.1 Best-in-Class Risk Visualization Patterns

Based on research of leading GRC platforms (ServiceNow, Archer, SAP GRC), here are the patterns we'll implement:

#### Pattern 1: Dual Heat Map (Before/After)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    INHERENT vs RESIDUAL COMPARISON                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────┐   ┌──────────────────────────┐          │
│  │    INHERENT RISK        │   │    RESIDUAL RISK         │          │
│  │    (Before Controls)    │   │    (After Controls)      │          │
│  ├──────────────────────────┤   ├──────────────────────────┤          │
│  │     1   2   3   4   5   │   │     1   2   3   4   5   │          │
│  │  5 │   │   │ 2 │ 1 │ 3 │   │  5 │   │   │   │   │   │          │
│  │  4 │   │   │   │ 5 │   │   │  4 │   │   │   │   │   │          │
│  │  3 │   │ 1 │ 4 │ 2 │   │ → │  3 │   │   │ 1 │   │   │          │
│  │  2 │ 2 │   │   │   │   │   │  2 │ 3 │ 5 │ 4 │ 2 │   │          │
│  │  1 │   │   │   │   │   │   │  1 │ 5 │ 3 │   │   │   │          │
│  └──────────────────────────┘   └──────────────────────────┘          │
│                                                                         │
│  SUMMARY: 11 Critical/High → 1 Medium | 89% Risk Reduction            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Pattern 2: Risk Trajectory Chart

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    RISK TRAJECTORY OVER TIME                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Risk Score                                                             │
│      │                                                                  │
│   20 │    ●──────●                                                      │
│      │           \              Inherent (constant)                    │
│   15 │            ●──────●──────●──────●──────●                        │
│      │                                                                  │
│   10 │    ●──●                                                          │
│      │       \                                                          │
│    5 │         ●──●                    Residual (improving)            │
│      │             \──●                                                │
│    0 │                 ●──●──●──★                                      │
│      └────────────────────────────────────────────────────────────      │
│        Jan  Feb  Mar  Apr  May  Jun  Jul  Aug  Sep                     │
│                                                                         │
│  ★ = Target by Q3 2026                                                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Pattern 3: Risk Tolerance Band

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    RISK TOLERANCE VISUALIZATION                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Impact                                                                │
│                                                                         │
│    5  │████████████████████████████████████│                           │
│    4  │████████████████████████████████████│                           │
│    3  │████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░│  ████ = Outside tolerance │
│    2  │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│  ░░░░ = Within tolerance  │
│    1  │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│                           │
│       └────────────────────────────────────┘                           │
│          1    2    3    4    5                                         │
│                 Likelihood                                             │
│                                                                         │
│  Risks OUTSIDE tolerance: 8 (require treatment)                        │
│  Risks INSIDE tolerance: 15 (can be accepted)                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Component Library Design

#### Risk Heat Map Component

```typescript
// src/components/nis2/risk-heat-map.tsx

interface RiskHeatMapProps {
  risks: Risk[];
  view: 'inherent' | 'residual';
  showCurrentPosition?: boolean;  // Show aggregate "You are here"
  showTargetPosition?: boolean;   // Show aggregate "Target"
  toleranceThreshold?: number;    // Default: 9 (Medium max)
  onCellClick?: (likelihood: number, impact: number, risks: Risk[]) => void;
}

// Visual states for each cell
interface CellState {
  likelihood: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  riskCount: number;
  isCurrentPosition: boolean;  // Aggregate position marker
  isTargetPosition: boolean;   // Target marker
  isAboveTolerance: boolean;   // Needs treatment
}
```

#### Assessment Wizard Component

```typescript
// src/components/nis2/risk-assessment-wizard.tsx

interface AssessmentWizardProps {
  mode: 'create' | 'edit';
  existingRisk?: Risk;
  onComplete: (assessment: RiskAssessment) => void;
  onCancel: () => void;
}

interface WizardStep {
  id: 'identify' | 'assess' | 'controls' | 'treatment';
  title: string;
  description: string;
  isComplete: boolean;
  validation: () => boolean;
}

// Wizard flow with real-time preview
// As user selects L and I, show position on mini heat map
// As user links controls, show residual calculation updating
```

#### Control Effectiveness Slider

```typescript
// src/components/nis2/control-effectiveness-slider.tsx

interface ControlEffectivenessSliderProps {
  controlId: string;
  controlName: string;
  initialValue: number;
  onChange: (value: number) => void;
  showLabels?: boolean;  // None/Minimal/Partial/Substantial/Optimal
}

// Visual slider with:
// - Color gradient (red → yellow → green)
// - Percentage display
// - Helper text explaining each level
```

### 5.3 Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│ NIS2 Compliance Dashboard                                    [Actions ▼]│
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    YOUR COMPLIANCE POSITION                      │   │
│  │                                                                  │   │
│  │   ╭─────────────────────────────────────────────────────────╮   │   │
│  │   │                                                          │   │   │
│  │   │        [ LOW ]    [ MEDIUM ]    [ HIGH ]    [ CRIT ]    │   │   │
│  │   │           ░░░░░░░░░░░▓▓▓▓▓▓▓▓▓▓██████████████████████   │   │   │
│  │   │                      ●                           ★       │   │   │
│  │   │                    YOU                        TARGET     │   │   │
│  │   │                                                          │   │   │
│  │   │   Overall Risk Score: 12 (HIGH)                         │   │   │
│  │   │   Target Score: 6 (MEDIUM)                              │   │   │
│  │   │   Gap: 6 points (50% improvement needed)                │   │   │
│  │   │                                                          │   │   │
│  │   ╰─────────────────────────────────────────────────────────╯   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐       │
│  │ Critical Risks   │ │ Control Coverage │ │ Next Actions     │       │
│  │      3           │ │     72%          │ │      5           │       │
│  │  ⚠ Action needed │ │  ▲ 8% this month │ │  ⏱ Due this week │       │
│  └──────────────────┘ └──────────────────┘ └──────────────────┘       │
│                                                                         │
│  ┌────────────────────────────┐ ┌──────────────────────────────┐      │
│  │ Risk Heat Map (Mini)       │ │ Category Compliance          │      │
│  │                            │ │                              │      │
│  │  5 │ · │ · │ 2 │ 1 │ 3 │  │ │ Governance       ████░ 80%  │      │
│  │  4 │ · │ · │ · │ 5 │ · │  │ │ Risk Mgmt        ███░░ 65%  │      │
│  │  3 │ · │ 1 │ 4 │ 2 │ · │  │ │ Incident         ██░░░ 45%  │      │
│  │  2 │ 2 │ · │ · │ · │ · │  │ │ BCP              ███░░ 70%  │      │
│  │  1 │ · │ · │ · │ · │ · │  │ │ Supply Chain     ████░ 85%  │      │
│  │    1   2   3   4   5      │ │ Reporting        █████ 95%  │      │
│  │              [Full View →]│ │                              │      │
│  └────────────────────────────┘ └──────────────────────────────┘      │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │ WHAT TO DO NEXT (Auto-generated)                   [View All →] │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │ 1. 🔴 Implement EDR solution for "Ransomware" risk    CRITICAL  │   │
│  │ 2. 🟠 Complete access review for Q1                   HIGH      │   │
│  │ 3. 🟡 Upload ISO 27001 certificate renewal            MEDIUM    │   │
│  │ 4. 🟢 Schedule business continuity test               LOW       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 6. Component Architecture

### 6.1 Modular Design Principles

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    COMPONENT HIERARCHY                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  LAYER 1: PAGES (Server Components)                                    │
│  ─────────────────────────────────────                                 │
│  /app/(dashboard)/nis2/                                                │
│    ├── page.tsx              ← Dashboard (imports layer 2)             │
│    ├── risk-register/page.tsx                                          │
│    ├── risk-map/page.tsx                                               │
│    ├── controls/page.tsx                                               │
│    └── assessment/page.tsx                                             │
│                                                                         │
│  LAYER 2: FEATURES (Mixed Components)                                  │
│  ─────────────────────────────────────                                 │
│  /components/nis2/                                                      │
│    ├── nis2-dashboard.tsx    ← Feature container                       │
│    ├── risk-register-table.tsx                                         │
│    ├── risk-heat-map.tsx     ← Core innovation                        │
│    ├── assessment-wizard.tsx                                           │
│    ├── control-library.tsx                                             │
│    └── incident-timeline.tsx                                           │
│                                                                         │
│  LAYER 3: SHARED (Reusable Components)                                 │
│  ─────────────────────────────────────                                 │
│  /components/nis2/shared/                                              │
│    ├── risk-score-badge.tsx  ← 🔴🟠🟡🟢                                │
│    ├── risk-level-pill.tsx   ← Critical/High/Medium/Low               │
│    ├── position-marker.tsx   ← ● You are here                         │
│    ├── target-marker.tsx     ← ★ Target                               │
│    ├── effectiveness-slider.tsx                                        │
│    ├── likelihood-scale.tsx  ← 1-5 selector                           │
│    ├── impact-scale.tsx      ← 1-5 selector                           │
│    └── treatment-strategy-select.tsx                                   │
│                                                                         │
│  LAYER 4: PRIMITIVES (Design System)                                   │
│  ─────────────────────────────────────                                 │
│  /components/ui/ (existing shadcn/ui)                                  │
│    ├── card.tsx, button.tsx, badge.tsx, etc.                           │
│                                                                         │
│  LAYER 5: UTILITIES (Pure Functions)                                   │
│  ─────────────────────────────────────                                 │
│  /lib/nis2/                                                            │
│    ├── risk-calculator.ts    ← Math formulas                          │
│    ├── risk-guidance.ts      ← Auto-generate "what to do"             │
│    ├── heat-map-utils.ts     ← Matrix generation                      │
│    ├── queries.ts            ← Database queries                       │
│    └── types.ts              ← TypeScript interfaces                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Component Specifications

#### `risk-heat-map.tsx` - The Core Component

```typescript
// Props
interface RiskHeatMapProps {
  // Data
  risks: NIS2Risk[];

  // View configuration
  view: 'inherent' | 'residual';
  showAggregatePosition?: boolean;
  showTargetPosition?: boolean;
  toleranceThreshold?: number;

  // Interaction
  onCellClick?: (cell: HeatMapCell) => void;
  onRiskClick?: (risk: NIS2Risk) => void;
  selectedCell?: { likelihood: number; impact: number };

  // Styling
  size?: 'compact' | 'full';
  className?: string;
}

// Internal state
interface HeatMapState {
  hoveredCell: { likelihood: number; impact: number } | null;
  expandedCell: { likelihood: number; impact: number } | null;
}

// Render structure
<HeatMapContainer>
  <HeatMapHeader view={view} onViewChange={setView} />
  <HeatMapGrid>
    {cells.map(cell => (
      <HeatMapCell
        key={`${cell.likelihood}-${cell.impact}`}
        {...cell}
        isHovered={isHovered}
        isExpanded={isExpanded}
        onClick={handleClick}
      >
        {cell.isCurrentPosition && <PositionMarker type="current" />}
        {cell.isTargetPosition && <TargetMarker />}
        {cell.riskCount > 0 && <RiskCountBadge count={cell.riskCount} />}
      </HeatMapCell>
    ))}
  </HeatMapGrid>
  <HeatMapLegend />
  {expandedCell && (
    <CellDetailPanel
      risks={getRisksForCell(expandedCell)}
      onClose={clearExpanded}
    />
  )}
</HeatMapContainer>
```

#### `assessment-wizard.tsx` - The Workflow Component

```typescript
// Step definitions
const WIZARD_STEPS = [
  {
    id: 'identify',
    title: 'Identify Risk',
    fields: ['title', 'description', 'category', 'owner'],
  },
  {
    id: 'assess',
    title: 'Assess Inherent Risk',
    fields: ['likelihood', 'impact'],
    showPreview: true,  // Mini heat map preview
  },
  {
    id: 'controls',
    title: 'Link Controls',
    fields: ['controls[]', 'effectiveness[]'],
    showCalculation: true,  // Show residual calculation live
  },
  {
    id: 'treatment',
    title: 'Treatment Plan',
    fields: ['strategy', 'rationale', 'reviewDate'],
  },
] as const;

// Render structure
<WizardContainer>
  <WizardProgress steps={steps} currentStep={currentStep} />
  <WizardContent>
    {currentStep === 'identify' && <IdentifyStep />}
    {currentStep === 'assess' && (
      <AssessStep>
        <LikelihoodScale value={likelihood} onChange={setLikelihood} />
        <ImpactScale value={impact} onChange={setImpact} />
        <MiniHeatMap
          position={{ likelihood, impact }}
          score={likelihood * impact}
        />
      </AssessStep>
    )}
    {currentStep === 'controls' && (
      <ControlsStep>
        <ControlSelector
          selected={selectedControls}
          onSelect={addControl}
        />
        <EffectivenessEditor
          controls={selectedControls}
          onChange={updateEffectiveness}
        />
        <ResidualCalculation
          inherent={likelihood * impact}
          controls={selectedControls}
        />
        <BeforeAfterPreview
          before={{ likelihood, impact }}
          after={calculateResidual(likelihood, impact, selectedControls)}
        />
      </ControlsStep>
    )}
    {currentStep === 'treatment' && <TreatmentStep />}
  </WizardContent>
  <WizardFooter>
    <Button variant="outline" onClick={goBack}>Back</Button>
    <Button onClick={goNext}>{isLast ? 'Complete' : 'Next'}</Button>
  </WizardFooter>
</WizardContainer>
```

### 6.3 Reuse Strategy

| Existing Component | New Usage |
|-------------------|-----------|
| `stat-card.tsx` | Dashboard KPI cards (Critical Risks, Coverage %) |
| `progress.tsx` | Category compliance bars |
| `badge.tsx` | Risk level pills (extend with colors) |
| `vendor-risk-gauge.tsx` | Adapt for risk score visualization |
| `dora-gap-remediation/` | Pattern for "What to do" actions |
| `incident-form.tsx` | Base for NIS2 incident reports |
| `document-upload.tsx` | Evidence attachment to controls |

---

## 7. Database Design

### 7.1 Schema Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    DATABASE ENTITY RELATIONSHIPS                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌────────────────┐       ┌────────────────┐                           │
│  │ organizations  │──────<│   nis2_risks   │                           │
│  └────────────────┘       │                │                           │
│         │                 │  - inherent L×I│                           │
│         │                 │  - residual L×I│                           │
│         │                 │  - treatment   │                           │
│         │                 └───────┬────────┘                           │
│         │                         │                                    │
│         │                         │ M:N                                │
│         │                         ▼                                    │
│         │       ┌─────────────────────────────────┐                    │
│         │       │      nis2_risk_controls         │                    │
│         │       │                                 │                    │
│         │       │  - risk_id                      │                    │
│         │       │  - control_id                   │                    │
│         │       │  - effectiveness_score          │                    │
│         │       └──────────────┬──────────────────┘                    │
│         │                      │                                       │
│         │                      │ M:N                                   │
│         │                      ▼                                       │
│         │       ┌────────────────────────────────┐                     │
│         └──────>│        nis2_controls           │                     │
│                 │                                │                     │
│                 │  - design_effectiveness        │                     │
│                 │  - operational_effectiveness   │                     │
│                 │  - overall (generated)         │                     │
│                 └───────────────┬────────────────┘                     │
│                                 │                                      │
│                                 │ 1:N                                  │
│                                 ▼                                      │
│                 ┌────────────────────────────────┐                     │
│                 │     nis2_control_evidence      │                     │
│                 │                                │                     │
│                 │  - document_id (FK documents)  │                     │
│                 │  - valid_from / valid_until    │                     │
│                 └────────────────────────────────┘                     │
│                                                                         │
│  ┌────────────────┐       ┌────────────────────────────────┐          │
│  │   incidents    │──────<│    nis2_incident_reports       │          │
│  └────────────────┘       │                                │          │
│                           │  - report_type (24h/72h/30d)   │          │
│                           │  - deadline compliance         │          │
│                           │  - CSIRT status                │          │
│                           └────────────────────────────────┘          │
│                                                                         │
│  ┌────────────────────────────────┐                                    │
│  │    nis2_risk_assessments       │  (History/Audit Trail)            │
│  │                                │                                    │
│  │  - risk_id                     │                                    │
│  │  - assessment_date             │                                    │
│  │  - point-in-time scores        │                                    │
│  │  - assessor notes              │                                    │
│  └────────────────────────────────┘                                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Key Design Decisions

#### Generated Columns

```sql
-- Inherent risk score is auto-calculated
inherent_risk_score INT GENERATED ALWAYS AS (likelihood_score * impact_score) STORED,

-- Risk level is derived from score
inherent_risk_level TEXT GENERATED ALWAYS AS (
  CASE
    WHEN likelihood_score * impact_score >= 16 THEN 'critical'
    WHEN likelihood_score * impact_score >= 10 THEN 'high'
    WHEN likelihood_score * impact_score >= 5 THEN 'medium'
    ELSE 'low'
  END
) STORED,
```

**Benefits:**
- Single source of truth for calculations
- No sync issues between score and level
- Instant querying without joins or functions
- Database-enforced consistency

#### Soft Delete Pattern

```sql
-- All tables use soft delete
deleted_at TIMESTAMPTZ DEFAULT NULL,

-- RLS policies filter deleted records
CREATE POLICY "only_active_risks" ON nis2_risks
  FOR SELECT USING (deleted_at IS NULL AND organization_id = get_user_organization_id());
```

#### Audit Trail

```sql
-- Risk assessments table tracks all changes
-- Every time residual risk changes, a new row is inserted
-- This enables trend charts and "show me last month's position"
```

### 7.3 Migration Strategy

```sql
-- Migration 1: Core risk tables
005_nis2_risk_management.sql
  - nis2_risks
  - nis2_controls
  - nis2_risk_controls

-- Migration 2: Evidence and history
006_nis2_evidence_history.sql
  - nis2_control_evidence
  - nis2_risk_assessments

-- Migration 3: Incident reporting
007_nis2_incidents.sql
  - nis2_incident_reports

-- Migration 4: Functions and views
008_nis2_functions.sql
  - calculate_residual_risk()
  - risk_position_aggregate view
  - guidance_generator view
```

---

## 8. Implementation Roadmap

### 8.1 Phase Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    IMPLEMENTATION TIMELINE                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PHASE 1 (Week 1-2)         PHASE 2 (Week 2-3)                         │
│  ═══════════════════════    ═══════════════════════                    │
│  🎯 Risk Foundation         🎯 Control Management                       │
│                                                                         │
│  □ Database migrations      □ Control library CRUD                     │
│  □ Risk calculator lib      □ Control-Risk linking                     │
│  □ Risk register CRUD       □ Effectiveness scoring                    │
│  □ Heat map component       □ Evidence attachment                      │
│  □ Position calculation     □ Combined effectiveness                   │
│                                                                         │
│  Deliverable:               Deliverable:                               │
│  - View/add/edit risks      - Link controls to risks                   │
│  - See heat map             - See residual calculation                 │
│  - See "You are here"       - Attach evidence                          │
│                                                                         │
│  ───────────────────────────────────────────────────────────────────   │
│                                                                         │
│  PHASE 3 (Week 3-4)         PHASE 4 (Week 4-5)                         │
│  ═══════════════════════    ═══════════════════════                    │
│  🎯 Assessment Workflow     🎯 Incident Reporting                       │
│                                                                         │
│  □ Assessment wizard        □ NIS2 timeline (24/72/30)                 │
│  □ Before/after preview     □ CSIRT notification                       │
│  □ Treatment planning       □ Cross-border tracking                    │
│  □ Review scheduling        □ Report templates                         │
│  □ Guidance generator       □ Deadline alerts                          │
│                                                                         │
│  Deliverable:               Deliverable:                               │
│  - Complete assessment      - Submit NIS2 reports                      │
│  - See "What to do next"    - Track deadlines                          │
│  - Plan treatments          - Cross-border impact                      │
│                                                                         │
│  ───────────────────────────────────────────────────────────────────   │
│                                                                         │
│  PHASE 5 (Week 5-6)                                                    │
│  ═══════════════════════                                               │
│  🎯 Dashboard & Reports                                                 │
│                                                                         │
│  □ Enhanced NIS2 dashboard                                             │
│  □ Position indicator bar                                              │
│  □ PDF compliance reports                                              │
│  □ Trend analytics                                                     │
│  □ Board summary view                                                  │
│                                                                         │
│  Deliverable:                                                          │
│  - Complete NIS2 module                                                │
│  - Generate auditor package                                            │
│  - Track improvement over time                                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 8.2 Phase 1 Details (Week 1-2)

#### Day 1-2: Database Foundation

```bash
# Tasks
1. Create migration 005_nis2_risk_management.sql
   - nis2_risks table with generated columns
   - nis2_controls table
   - nis2_risk_controls junction table
   - RLS policies

2. Create TypeScript types
   - src/lib/nis2/types.ts
   - src/lib/nis2/schema.ts (Zod)

3. Create query utilities
   - src/lib/nis2/queries.ts
   - getRisks(), createRisk(), updateRisk()
   - getControls(), createControl()
```

#### Day 3-4: Risk Calculator

```bash
# Tasks
1. Create risk calculation library
   - src/lib/nis2/risk-calculator.ts
   - calculateInherentRisk()
   - calculateCombinedControlEffectiveness()
   - calculateResidualRisk()
   - getRiskLevel()

2. Create heat map utilities
   - src/lib/nis2/heat-map-utils.ts
   - generateHeatMapData()
   - calculateAggregatePosition()

3. Unit tests
   - src/lib/nis2/__tests__/risk-calculator.test.ts
```

#### Day 5-7: Risk Register UI

```bash
# Tasks
1. Create risk register page
   - src/app/(dashboard)/nis2/risk-register/page.tsx

2. Create components
   - src/components/nis2/risk-register-table.tsx
   - src/components/nis2/risk-detail-panel.tsx
   - src/components/nis2/shared/risk-score-badge.tsx
   - src/components/nis2/shared/risk-level-pill.tsx

3. Create add/edit risk form
   - src/components/nis2/risk-form.tsx
```

#### Day 8-10: Heat Map

```bash
# Tasks
1. Create heat map component
   - src/components/nis2/risk-heat-map.tsx
   - Interactive 5×5 grid
   - Cell click to expand
   - Hover states

2. Create position markers
   - src/components/nis2/shared/position-marker.tsx
   - src/components/nis2/shared/target-marker.tsx

3. Create heat map page
   - src/app/(dashboard)/nis2/risk-map/page.tsx

4. Integration
   - Connect heat map to risk data
   - Show aggregate position
```

### 8.3 Acceptance Criteria

| Phase | Must Have | Should Have | Nice to Have |
|-------|-----------|-------------|--------------|
| Phase 1 | Add/view risks, Heat map, Position marker | Filter by category | Export to CSV |
| Phase 2 | Link controls, Calculate residual | Effectiveness slider | Control templates |
| Phase 3 | 4-step wizard, Live preview | Bulk assessment | Risk templates |
| Phase 4 | 24/72/30 timeline, Deadline alerts | CSIRT integration | Auto-notification |
| Phase 5 | Dashboard, PDF export | Board summary | Trend analytics |

---

## 9. Success Criteria

### 9.1 User Experience Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Time to complete first assessment | < 10 min | User session timing |
| Clicks to find "Where am I?" | 1 click | Dashboard visibility |
| Understanding of next steps | 90% clarity | User survey |
| Risk register completeness | > 80% fields | Data quality check |

### 9.2 Technical Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Heat map render time | < 200ms | Performance monitoring |
| Residual calculation accuracy | 100% | Unit tests |
| Database query efficiency | < 50ms | Query analysis |
| Mobile responsiveness | 100% | Visual testing |

### 9.3 Business Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| NIS2 feature adoption | 70% of users | Feature usage analytics |
| Assessment completion rate | > 60% | Funnel analysis |
| Time to compliance (avg) | < 3 months | User progress tracking |
| Churn reduction | -20% | Subscription analytics |

---

## Appendix A: Competitor Feature Matrix

| Feature | Us | OneTrust | BitSight | 3rdRisk |
|---------|-----|----------|----------|---------|
| NIS2 Native | ✅ Full | ⚠️ Add-on | ❌ | ✅ Full |
| "You Are Here" Marker | ✅ | ❌ | ❌ | ❌ |
| Target State Guidance | ✅ | ❌ | ❌ | ⚠️ Basic |
| Compound Control Calc | ✅ | ❌ | ❌ | ❌ |
| Interactive Heat Map | ✅ Full | ✅ Basic | ❌ | ⚠️ Static |
| Before/After Preview | ✅ | ❌ | ❌ | ❌ |
| EMEA Docs (ISO/BSI C5) | ✅ | ⚠️ SOC2 | ⚠️ Limited | ✅ |
| 24/72/30 Workflow | ✅ Auto | ⚠️ Manual | ❌ | ⚠️ Basic |
| Price (Annual) | €2K-6K | €50K-150K | €20K-50K | €5K-15K |

---

## Appendix B: Risk Positioning Examples

### Example 1: Financial Services Company

```
Before NIS2 Risk Assessment:
- 15 risks identified
- 8 Critical (score >= 16)
- 5 High (score 10-15)
- 2 Medium (score 5-9)
- Aggregate position: Likelihood 4, Impact 4 = Score 16 (Critical)

After implementing controls:
- 15 risks (same)
- 0 Critical
- 2 High
- 8 Medium
- 5 Low
- Aggregate position: Likelihood 2, Impact 3 = Score 6 (Medium) ✅

"What to do" generated 23 actions, 18 completed
```

### Example 2: Healthcare Provider

```
Initial assessment:
- 12 risks identified
- Focus areas: Supply Chain (4 risks), Incident Handling (5 risks)
- Position: Score 14 (High)

Target: Score <= 8 (Medium) by Q2 2026

Actions auto-generated:
1. Implement vendor assessment questionnaire
2. Deploy incident response automation
3. Establish CSIRT communication channel
...
```

---

## Appendix C: UI Mockup Reference

See Figma file: [NIS2 Risk Management Module](link-to-figma)

Key screens:
1. Dashboard with position indicator
2. Risk heat map with drill-down
3. Assessment wizard (4 steps)
4. Control library with effectiveness
5. Incident timeline (24/72/30)

---

*Document prepared for DORA Comply platform transformation*
*Last updated: January 2026*
