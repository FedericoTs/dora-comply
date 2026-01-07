# Concentration Risk Dashboard - 10X Implementation Plan

## Executive Summary

**The 10X Opportunity**: No TPRM platform currently provides automated, real-time concentration risk visualization with DORA Article 28-29 compliance built-in. Competitors offer static reports or manual assessments. We will deliver **living concentration intelligence** that transforms how compliance officers identify and mitigate vendor dependencies.

**Why This Matters (DORA Context)**:
- Article 28 requires financial entities to "identify and assess" ICT concentration risk
- Article 29 mandates assessment of "critical or important functions" supported by ICT third-party providers
- ESAs expect **quantitative metrics** in Register of Information submissions
- Regulators can impose restrictions on new contracts if concentration risk is unaddressed

---

## Current State Analysis

### Vendor Data Available
| Metric | Current Value |
|--------|---------------|
| Total Vendors | 13 |
| Critical Tier | 3 (23%) |
| Important Tier | 1 (8%) |
| Standard Tier | 9 (69%) |

### Concentration Signals Detected
- **Service Type**: Cloud computing has 4 vendors (2 critical) - 31% concentration
- **Geographic**: DE (2 critical), US (3 total) - EU/non-EU balance needed
- **Substitutability**: 0% assessed - **critical gap**
- **Fourth-Party**: Not tracked - **critical gap**

---

## 10X Feature Specification

### Core Value Proposition

> **"See your ICT concentration risk at a glance. Know exactly where a single failure would cascade. Take action before regulators mandate it."**

### Competitive Differentiation

| Feature | Competitors | Our 10X Approach |
|---------|-------------|------------------|
| Concentration View | Static pie charts | **Real-time heat maps with drill-down** |
| Risk Thresholds | Manual setting | **DORA-aligned auto-thresholds** |
| Substitutability | Text fields | **Guided assessment wizard + scoring** |
| Fourth-Party | Not tracked | **Visual dependency graph** |
| Alerts | Email only | **In-app + severity-based routing** |
| Remediation | Recommendations | **Action buttons + progress tracking** |

---

## Feature Breakdown

### 1. Concentration Risk Overview Cards (P0)

**Purpose**: Instant visibility into concentration health

**Cards**:
```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ 🔴 CRITICAL     │  │ 🟠 HIGH         │  │ 🟡 MEDIUM       │  │ 🟢 LOW          │
│                 │  │                 │  │                 │  │                 │
│   3 VENDORS     │  │   1 VENDOR      │  │   5 VENDORS     │  │   4 VENDORS     │
│   Supporting    │  │   Geographic    │  │   Balanced      │  │   Diversified   │
│   5 Critical    │  │   Concentration │  │   Distribution  │  │   Portfolio     │
│   Functions     │  │   (80% EU)      │  │                 │  │                 │
│                 │  │                 │  │                 │  │                 │
│ ▼ View Details  │  │ ▼ View Details  │  │ ▼ View Details  │  │ ▼ View Details  │
└─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘
```

**Click Behavior**: Expands to show affected vendors with remediation actions

### 2. Concentration Heat Map (P0)

**Purpose**: Visual identification of concentration hotspots

**Dimensions**:
- **X-Axis**: Service Categories (cloud, security, data, network, etc.)
- **Y-Axis**: Geographic Regions (EU countries, US, APAC, etc.)
- **Cell Color**: Concentration score (green → yellow → orange → red)
- **Cell Size**: Number of vendors in that segment

**Interactions**:
- Hover: Show vendor count, critical function dependency, avg risk score
- Click: Open drawer with vendor list and actions
- Filter: By tier (critical/important/standard), by status (active/pending)

**Visual Design** (per frontend-design skill):
- Dark theme option for data density
- Gradient meshes for background atmosphere
- Sharp accent colors for risk levels (#22c55e, #eab308, #f97316, #ef4444)
- Subtle grid lines with 0.1 opacity
- Smooth hover transitions (150ms ease-out)

### 3. Vendor Dependency Graph (P1)

**Purpose**: Visualize fourth-party relationships and cascade risk

**Graph Structure**:
```
                    ┌───────────────┐
                    │  Your Entity  │
                    └───────┬───────┘
                            │
           ┌────────────────┼────────────────┐
           │                │                │
    ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
    │   AWS       │  │  Salesforce │  │  Microsoft  │
    │  (Critical) │  │ (Important) │  │  (Standard) │
    └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
           │                │                │
    ┌──────▼──────┐  ┌──────▼──────┐  ┌──────▼──────┐
    │  Cloudflare │  │   Twilio    │  │   GitHub    │
    │ (4th Party) │  │ (4th Party) │  │ (4th Party) │
    └─────────────┘  └─────────────┘  └─────────────┘
```

**Features**:
- Force-directed layout with zoom/pan
- Node size = criticality tier
- Edge thickness = dependency strength
- Color coding by risk level
- Highlight paths on hover
- Collapse/expand node clusters

### 4. Single Point of Failure Detector (P0)

**Purpose**: Identify vendors where loss would cascade to multiple critical functions

**Logic**:
```typescript
interface SinglePointOfFailure {
  vendor_id: string;
  vendor_name: string;
  critical_functions_affected: string[];
  substitutability: 'not_substitutable' | 'substitutable_with_difficulty' | 'easily_substitutable';
  recovery_time_estimate: string; // e.g., "6+ months"
  recommended_actions: string[];
  risk_score: number; // 0-100
}
```

**Display**:
- Alert banner at top when SPOFs detected
- Expandable list with severity ranking
- One-click to initiate remediation workflow

### 5. Substitutability Assessment Wizard (P1)

**Purpose**: Guided assessment for DORA compliance

**Wizard Flow**:
1. **Select Vendor** → Show current services and critical functions
2. **Market Alternatives** → Are there viable alternatives in the market?
3. **Transition Complexity** → Data migration, integration effort, training
4. **Contractual Constraints** → Lock-in period, exit costs, IP concerns
5. **Timeline Estimate** → How long to transition (weeks/months/years)?
6. **Final Score** → Calculate substitutability rating

**Scoring Model**:
```typescript
type SubstitutabilityScore = {
  market_alternatives: 1 | 2 | 3 | 4 | 5; // 1=none, 5=many
  transition_complexity: 1 | 2 | 3 | 4 | 5; // 1=trivial, 5=extreme
  contractual_freedom: 1 | 2 | 3 | 4 | 5; // 1=locked, 5=flexible
  timeline_months: number;

  // Calculated
  overall: 'easily_substitutable' | 'substitutable_with_difficulty' | 'not_substitutable';
};
```

### 6. Concentration Alerts System (P0)

**Alert Types**:

| Alert | Trigger | Severity | Action |
|-------|---------|----------|--------|
| Threshold Breach | >30% spend with single vendor | Critical | Review immediately |
| Geographic Concentration | >50% vendors in single country | High | Diversification plan |
| Service Concentration | >40% of service type with single vendor | High | Identify alternatives |
| SPOF Detected | Critical function with no backup vendor | Critical | Exit strategy required |
| Substitutability Gap | Critical vendor not assessed | Medium | Complete assessment |

**Alert Banner Design**:
```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ⚠️  CONCENTRATION ALERT                                                  ✕  │
│                                                                              │
│ Cloud infrastructure shows 67% concentration with AWS (2/3 critical         │
│ vendors). DORA Article 29 requires documented mitigation strategy.          │
│                                                                              │
│ [View Details]  [Create Mitigation Plan]  [Dismiss for 7 days]              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 7. Concentration Metrics Dashboard (P0)

**Key Metrics Grid**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     CONCENTRATION RISK METRICS                               │
├─────────────────────┬─────────────────────┬─────────────────────────────────┤
│ VENDOR DISTRIBUTION │ SERVICE DIVERSITY   │ GEOGRAPHIC SPREAD               │
│                     │                     │                                 │
│ Critical: 3 (23%)   │ Herfindahl Index:   │ EU: 67%                         │
│ Important: 1 (8%)   │ 0.23 (Moderate)     │ US: 25%                         │
│ Standard: 9 (69%)   │                     │ APAC: 8%                        │
│                     │ Top Service: Cloud  │                                 │
│ [Donut Chart]       │ 31% of vendors      │ [World Map Mini]                │
├─────────────────────┼─────────────────────┼─────────────────────────────────┤
│ SUBSTITUTABILITY    │ FOURTH-PARTY DEPTH  │ SINGLE POINTS OF FAILURE        │
│                     │                     │                                 │
│ Assessed: 0%        │ Avg Chain Length:   │ 🔴 2 SPOFs Detected             │
│ ⚠️ ACTION NEEDED    │ 2.3 hops            │                                 │
│                     │                     │ - AWS (Core Banking)            │
│ [Start Assessment]  │ Max Depth: 4        │ - Microsoft 365 (Email)         │
│                     │                     │                                 │
│                     │ [View Graph]        │ [View All]                      │
└─────────────────────┴─────────────────────┴─────────────────────────────────┘
```

---

## UI/UX Specifications

### Design Philosophy (per skills guidance)

**Aesthetic Direction**: "Control Room Clarity"
- Professional dark mode default (compliance officers work long hours)
- High contrast for critical alerts (accessibility compliant)
- Data-dense layouts with generous whitespace between sections
- Monospace fonts for numbers/metrics (JetBrains Mono)
- Display font for headers (Instrument Sans or similar)

**Color Palette**:
```css
:root {
  /* Risk Levels */
  --risk-critical: #ef4444;    /* Red 500 */
  --risk-high: #f97316;        /* Orange 500 */
  --risk-medium: #eab308;      /* Yellow 500 */
  --risk-low: #22c55e;         /* Green 500 */

  /* Background (Dark Mode) */
  --bg-primary: #0a0a0a;       /* Near black */
  --bg-secondary: #171717;     /* Zinc 900 */
  --bg-elevated: #262626;      /* Zinc 800 */

  /* Accents */
  --accent-primary: #3b82f6;   /* Blue 500 */
  --accent-glow: rgba(59, 130, 246, 0.2);
}
```

**Animation Principles**:
- Staggered entrance for metric cards (50ms delay each)
- Smooth hover states (150ms ease-out)
- Heat map cells fade in from center outward
- Alert banners slide down with spring physics
- Number counters animate to final value

### Responsive Breakpoints

| Breakpoint | Layout |
|------------|--------|
| Desktop (1280px+) | Full dashboard with sidebar |
| Tablet (768-1279px) | Stacked cards, collapsible sections |
| Mobile (< 768px) | Alert summary only, link to full view |

### Accessibility

- WCAG 2.1 AA compliant
- Color-blind safe palette (use patterns in addition to color)
- Keyboard navigation for all interactive elements
- Screen reader announcements for alert changes
- Reduced motion option

---

## Technical Architecture

### Component Structure

```
src/app/(dashboard)/concentration/
├── page.tsx                      # Main dashboard page
├── components/
│   ├── concentration-overview.tsx    # Risk level summary cards
│   ├── concentration-heat-map.tsx    # Service x Geography heat map
│   ├── vendor-dependency-graph.tsx   # D3/Vis.js force graph
│   ├── spof-detector.tsx             # Single point of failure list
│   ├── substitutability-wizard.tsx   # Multi-step assessment
│   ├── concentration-alerts.tsx      # Alert banner system
│   ├── metrics-grid.tsx              # KPI cards grid
│   └── geographic-map.tsx            # Mini world map
├── hooks/
│   ├── use-concentration-data.ts     # Data fetching/caching
│   ├── use-concentration-alerts.ts   # Alert state management
│   └── use-substitutability.ts       # Assessment state
└── lib/
    ├── concentration-calculations.ts  # HHI, SPOF detection
    ├── concentration-thresholds.ts    # Alert trigger logic
    └── concentration-types.ts         # TypeScript interfaces
```

### Database Queries

**Main Concentration Query**:
```sql
-- Concentration by service type
SELECT
  unnest(service_types) as service_type,
  tier,
  headquarters_country,
  COUNT(*) as vendor_count,
  SUM(CASE WHEN supports_critical_function THEN 1 ELSE 0 END) as critical_support,
  AVG(risk_score) as avg_risk,
  array_agg(id) as vendor_ids
FROM vendors
WHERE deleted_at IS NULL AND organization_id = $1
GROUP BY service_type, tier, headquarters_country
ORDER BY critical_support DESC, vendor_count DESC;
```

**SPOF Detection Query**:
```sql
-- Vendors supporting critical functions with no alternatives
WITH critical_vendors AS (
  SELECT
    id,
    name,
    unnest(critical_functions) as critical_function,
    substitutability_assessment,
    tier
  FROM vendors
  WHERE deleted_at IS NULL
    AND organization_id = $1
    AND supports_critical_function = true
),
function_coverage AS (
  SELECT
    critical_function,
    COUNT(*) as vendor_count,
    array_agg(json_build_object('id', id, 'name', name, 'substitutability', substitutability_assessment)) as vendors
  FROM critical_vendors
  GROUP BY critical_function
)
SELECT * FROM function_coverage
WHERE vendor_count = 1;  -- Single point of failure
```

**Herfindahl-Hirschman Index (HHI)**:
```sql
-- Calculate service concentration index
WITH service_shares AS (
  SELECT
    service_type,
    COUNT(*)::float / (SELECT COUNT(*) FROM vendors WHERE deleted_at IS NULL AND organization_id = $1) as market_share
  FROM (
    SELECT unnest(service_types) as service_type
    FROM vendors
    WHERE deleted_at IS NULL AND organization_id = $1
  ) sub
  GROUP BY service_type
)
SELECT SUM(market_share * market_share) as hhi
FROM service_shares;
-- HHI < 0.15 = Low concentration
-- HHI 0.15-0.25 = Moderate concentration
-- HHI > 0.25 = High concentration
```

### API Endpoints

```typescript
// New API routes needed

// GET /api/concentration/overview
// Returns: { risk_levels: RiskLevelSummary[], alerts: ConcentrationAlert[] }

// GET /api/concentration/heat-map
// Returns: { cells: HeatMapCell[], dimensions: { services: string[], regions: string[] } }

// GET /api/concentration/spof
// Returns: { spofs: SinglePointOfFailure[], total_critical_functions: number }

// GET /api/concentration/metrics
// Returns: { hhi: number, geographic_spread: GeoSpread, substitutability_coverage: number }

// POST /api/concentration/assessment
// Body: { vendor_id, assessment: SubstitutabilityAssessment }
// Returns: { success: boolean, updated_score: string }
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Create concentration types and interfaces
- [ ] Build concentration calculation utilities (HHI, SPOF detection)
- [ ] Create `/api/concentration/*` endpoints
- [ ] Set up concentration page routing

### Phase 2: Core Dashboard (Week 2)
- [ ] Build ConcentrationOverview cards component
- [ ] Implement MetricsGrid with live data
- [ ] Create ConcentrationAlerts banner system
- [ ] Add SPOF detector list

### Phase 3: Visualizations (Week 3)
- [ ] Build heat map component (Recharts or custom Canvas)
- [ ] Implement geographic mini-map
- [ ] Add drill-down drawers for each visualization
- [ ] Polish animations and transitions

### Phase 4: Dependency Graph (Week 4)
- [ ] Set up vendor_subcontractors table for fourth-party tracking
- [ ] Build force-directed graph with D3 or Vis.js
- [ ] Add interactive path highlighting
- [ ] Implement zoom/pan controls

### Phase 5: Substitutability Wizard (Week 5)
- [ ] Create multi-step wizard component
- [ ] Build scoring algorithm
- [ ] Integrate with vendor profile
- [ ] Add batch assessment mode

### Phase 6: Polish & Launch (Week 6)
- [ ] Dark/light theme toggle
- [ ] Responsive mobile view
- [ ] E2E testing with Playwright
- [ ] Performance optimization
- [ ] Documentation

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Substitutability Coverage | 100% of critical vendors | DB query |
| SPOF Resolution Rate | 50% within 90 days | Tracking |
| Alert Response Time | < 48 hours | Audit log |
| User Engagement | 3+ sessions/week | Analytics |
| Regulator Readiness | Pass mock audit | Manual |

---

## Risk & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Complex visualizations slow performance | Medium | High | Canvas rendering, virtualization |
| Fourth-party data unavailable | High | Medium | Manual entry option, GLEIF integration |
| Users ignore alerts | Medium | High | Escalation to manager, blocking actions |
| Mobile UX compromised | Low | Medium | Progressive disclosure, alert-only mobile |

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/app/(dashboard)/concentration/page.tsx` | Main dashboard |
| `src/app/(dashboard)/concentration/components/*.tsx` | UI components |
| `src/app/api/concentration/overview/route.ts` | Overview API |
| `src/app/api/concentration/heat-map/route.ts` | Heat map data |
| `src/app/api/concentration/spof/route.ts` | SPOF detection |
| `src/app/api/concentration/metrics/route.ts` | KPI metrics |
| `src/lib/concentration/*.ts` | Calculation utilities |
| `supabase/migrations/XXX_vendor_subcontractors.sql` | Fourth-party tracking |

---

## Dependencies

- **Existing**: shadcn/ui, Tailwind CSS, Supabase, React Query
- **New Recommended**:
  - `recharts` - Already in package.json, use for heat map
  - `react-force-graph` or `vis-network` - Dependency graph
  - `react-world-map` - Geographic visualization (lightweight)
  - `framer-motion` - Advanced animations (optional)

---

## Approval Checklist

- [ ] UX design reviewed by stakeholder
- [ ] Database schema approved
- [ ] API contract finalized
- [ ] Visualization library selected
- [ ] Performance budget defined (< 3s initial load)
- [ ] Accessibility audit plan

---

*Plan created: 2025-01-07*
*Author: Claude Code*
*Status: Ready for Implementation*
