# DORA Comply UI/UX Redesign Plan

## Executive Summary

**Goal:** 90% of user questions answered within 3 clicks
**Benchmark:** 3rdRisk platform (acquired by Diligent)
**Constraint:** Maintain existing Emerald design system

---

## 1. Information Architecture Redesign

### Current State Issues

| Problem | Current | Click Depth |
|---------|---------|-------------|
| "What's my vendor risk?" | Dashboard → Vendors → Filter → Vendor → Tab | 5 clicks |
| "Am I DORA compliant?" | Dashboard → Compliance → Trends | 3 clicks |
| "Which vendors need attention?" | Dashboard → Vendors → Sort by risk | 3 clicks |
| "What's overdue?" | Dashboard → Incidents → Filter | 3 clicks |
| "NIS2 risk posture?" | Dashboard → NIS2 → Risk Register | 3 clicks |

### Target State: 3-Click Maximum

| Question | New Path | Click Depth |
|----------|----------|-------------|
| "What's my vendor risk?" | Dashboard (widget click) | 1 click |
| "Am I DORA compliant?" | Dashboard (compliance score) | 1 click |
| "Which vendors need attention?" | Dashboard → Action Required | 2 clicks |
| "What's overdue?" | Dashboard (alerts badge) | 1 click |
| "NIS2 risk posture?" | Dashboard (risk widget) | 1 click |

---

## 2. Navigation Architecture

### 2.1 Sidebar Redesign Principles

1. **Maximum 7±2 top-level items** (Miller's Law)
2. **Progressive disclosure** - Advanced features hidden until needed
3. **Context-aware badges** - Show counts only when actionable
4. **Smart grouping** - Related features clustered logically

### 2.2 New Navigation Structure

```
┌─────────────────────────────────────────┐
│  🏠 Home                                │  ← Single unified dashboard
├─────────────────────────────────────────┤
│  MANAGE                                 │
│  ├─ 👥 Third Parties          [12]     │  ← Unified vendor view
│  ├─ 📄 Documents              [3]      │  ← Pending reviews badge
│  └─ ⚠️ Incidents              [2]      │  ← Active incidents badge
├─────────────────────────────────────────┤
│  COMPLIANCE                             │
│  ├─ 📊 Register of Information         │  ← DORA RoI
│  ├─ 🎯 Risk Register                   │  ← Unified risk view (NIS2+)
│  └─ 🧪 Resilience Testing              │  ← TLPT + Pen tests
├─────────────────────────────────────────┤
│  INSIGHTS                               │  ← Collapsed by default
│  ├─ 📈 Compliance Trends               │
│  ├─ 🔥 Concentration Risk              │
│  └─ 🗺️ Framework Coverage              │
├─────────────────────────────────────────┤
│  ⚙️ Settings                            │
└─────────────────────────────────────────┘
```

### 2.3 Navigation Rules

| Rule | Implementation |
|------|----------------|
| **Badge policy** | Only show badges for actionable items (overdue, needs review, critical) |
| **Collapse policy** | "Insights" section collapsed for users < 10 vendors |
| **Active state** | Highlight parent AND child when nested page active |
| **Mobile** | Bottom tab bar with 5 core items |

---

## 3. Dashboard Redesign ("Command Center")

### 3.1 Dashboard Layout

```
┌──────────────────────────────────────────────────────────────────┐
│ Welcome back, [Name]                            🔔 [3] ⚙️        │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ DORA     │  │ Third    │  │ Risk     │  │ Days to  │         │
│  │ Score    │  │ Parties  │  │ Exposure │  │ Deadline │         │
│  │ ●●●○○    │  │ 47       │  │ ▼ 12%   │  │ 458      │         │
│  │ 68%      │  │ +3 new   │  │ 4 crit   │  │ Apr 2026 │         │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘         │
│                                                                   │
├────────────────────────────────┬─────────────────────────────────┤
│                                │                                  │
│  🚨 ACTION REQUIRED            │  📊 COMPLIANCE OVERVIEW         │
│  ┌────────────────────────┐   │  ┌─────────────────────────┐    │
│  │ 🔴 2 Overdue reports   │→  │  │ ICT Risk Mgmt    ████░ 75%│   │
│  │ 🟠 3 Vendors need SOC2 │→  │  │ Incident Mgmt    ███░░ 60%│   │
│  │ 🟡 5 Contracts expiring│→  │  │ Resilience       ██░░░ 40%│   │
│  │ 🔵 1 TLPT due soon     │→  │  │ TPRM             ████░ 80%│   │
│  └────────────────────────┘   │  │ Info Sharing     ███░░ 55%│   │
│                                │  └─────────────────────────┘    │
│                                │                                  │
├────────────────────────────────┼─────────────────────────────────┤
│                                │                                  │
│  🔥 RISK HEAT MAP (Residual)  │  📋 RECENT ACTIVITY             │
│  ┌────────────────────────┐   │  ┌─────────────────────────┐    │
│  │     1   2   3   4   5  │   │  │ • Vendor ABC assessed   │    │
│  │  5 [░][░][▓][▓][█]    │   │  │ • SOC2 uploaded for XYZ │    │
│  │  4 [░][░][▓][▓][█]    │   │  │ • Incident #42 resolved │    │
│  │  3 [░][░][░][▓][▓]    │   │  │ • Contract renewed      │    │
│  │  2 [░][░][░][░][▓]    │   │  │ • New vendor onboarded  │    │
│  │  1 [░][░][░][░][░]    │   │  └─────────────────────────┘    │
│  └────────────────────────┘   │                                  │
│    ● Current  ◇ Target        │                                  │
│                                │                                  │
└────────────────────────────────┴─────────────────────────────────┘
```

### 3.2 KPI Cards Specification

| KPI | Visual | Interaction |
|-----|--------|-------------|
| **DORA Score** | 5-dot progress + percentage | Click → Compliance breakdown |
| **Third Parties** | Count + trend arrow | Click → Vendor list |
| **Risk Exposure** | Delta + critical count | Click → Risk register filtered |
| **Days to Deadline** | Countdown + date | Click → RoI submission page |

### 3.3 Action Required Widget

This is the **most important widget** - surfaces everything needing attention:

```typescript
interface ActionItem {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  type: 'overdue' | 'pending' | 'expiring' | 'due_soon';
  icon: 'alert' | 'clock' | 'document' | 'vendor';
  title: string;
  subtitle: string;
  href: string;
  dueDate?: Date;
}
```

**Priority Colors:**
- 🔴 Critical: `--risk-critical` (#EF4444)
- 🟠 High: `--risk-high` (#F97316)
- 🟡 Medium: `--risk-medium` (#F59E0B)
- 🔵 Low: `--info` (#3B82F6)

---

## 4. Third Party Management ("Vendor Hub")

### 4.1 Unified Vendor List

Replace current vendor cards with a **smart table** with inline indicators:

```
┌─────────────────────────────────────────────────────────────────────┐
│ Third Parties                                    🔍 [Search...]  ➕ │
├─────────────────────────────────────────────────────────────────────┤
│ [All] [Critical ⚠️4] [Needs Review 🔔7] [Expiring Soon 📅3]        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ ┌───┬────────────────┬────────┬──────────┬──────────┬─────────────┐│
│ │   │ VENDOR         │ TIER   │ RISK     │ DORA     │ ACTIONS     ││
│ ├───┼────────────────┼────────┼──────────┼──────────┼─────────────┤│
│ │ ☐ │ AWS            │ 🔷 T1  │ 🟢 A     │ ████░ 85%│ [📄][📊][⋮]││
│ │   │ Cloud Provider │        │ ▲ +5     │ ✓ SOC2   │             ││
│ ├───┼────────────────┼────────┼──────────┼──────────┼─────────────┤│
│ │ ☐ │ Salesforce     │ 🔷 T1  │ 🟡 B     │ ███░░ 60%│ [📄][📊][⋮]││
│ │   │ CRM Platform   │        │ ▼ -3     │ ⚠️ Gaps  │             ││
│ ├───┼────────────────┼────────┼──────────┼──────────┼─────────────┤│
│ │ ☐ │ Stripe         │ 🔶 T2  │ 🔴 D     │ ██░░░ 40%│ [📄][📊][⋮]││
│ │   │ Payment Proc.  │ ⚠️CTPP │ ▼ -12    │ ❌ No SOC│             ││
│ └───┴────────────────┴────────┴──────────┴──────────┴─────────────┘│
│                                                                      │
│ Showing 1-20 of 47          [◀] [1] [2] [3] [▶]                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Inline Indicators Specification

| Column | Indicator | Visual |
|--------|-----------|--------|
| **Tier** | T1/T2/T3 + CTPP flag | 🔷 T1, 🔶 T2, ⬜ T3, ⚠️ CTPP badge |
| **Risk** | Letter grade + trend | 🟢 A, 🟡 B, 🟠 C, 🔴 D, ⚫ F |
| **DORA** | Progress bar + status | ████░ 85% + ✓/⚠️/❌ icons |
| **Actions** | Quick action icons | 📄 Docs, 📊 Analysis, ⋮ More |

### 4.3 Vendor Detail Page Tabs

Reorganize tabs for **information hierarchy**:

```
┌─────────────────────────────────────────────────────────────────┐
│ ← Back    AWS                                    [Edit] [⋮]     │
│           Cloud Infrastructure Provider                          │
│           🔷 Tier 1  │  🟢 A (92)  │  ████░ 85% DORA           │
├─────────────────────────────────────────────────────────────────┤
│ [Overview] [Compliance] [Documents] [Contracts] [Monitoring]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Overview tab content...                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Tab Structure:**
1. **Overview** - Key info, contacts, assessment progress
2. **Compliance** - DORA analysis, framework scores, gaps
3. **Documents** - SOC2, ISO27001, contracts, evidence
4. **Contracts** - Terms, SLAs, exit clauses, renewals
5. **Monitoring** - SecurityScorecard, alerts, score history

---

## 5. Risk Register (Unified)

### 5.1 Combined Risk View

Merge NIS2 risk register with vendor risks:

```
┌─────────────────────────────────────────────────────────────────┐
│ Risk Register                               [+ Add Risk] [Export]│
├─────────────────────────────────────────────────────────────────┤
│ View: [All Risks] [NIS2] [Vendor] [Operational]                  │
│ Status: [All] [Open] [Treating] [Monitoring]                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SUMMARY                                                         │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐        │
│  │Critical│ │  High  │ │ Medium │ │  Low   │ │ Total  │        │
│  │🔴  4   │ │🟠  8   │ │🟡  15  │ │🟢  23  │ │   50   │        │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘        │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│ ┌───┬───────────────────┬────────┬─────────┬────────┬─────────┐│
│ │   │ RISK              │ LEVEL  │ TREND   │ OWNER  │ DUE     ││
│ ├───┼───────────────────┼────────┼─────────┼────────┼─────────┤│
│ │🔴│ Ransomware attack  │ 20 Crit│ ▲ +4    │ J.Smith│ Mar 15  ││
│ │   │ 📍 NIS2 > Incident│ I:5×L:4│ 🛡️ 2 ctrls│        │ ⚠️ 5d  ││
│ ├───┼───────────────────┼────────┼─────────┼────────┼─────────┤│
│ │🟠│ AWS concentration  │ 15 High│ → stable│ M.Lee  │ Apr 30  ││
│ │   │ 📍 Vendor > AWS   │ I:5×L:3│ 🛡️ 1 ctrl│        │         ││
│ └───┴───────────────────┴────────┴─────────┴────────┴─────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Risk Row Indicators

| Element | Visual | Meaning |
|---------|--------|---------|
| **Level dot** | 🔴🟠🟡🟢 | Risk level color |
| **Score** | `20 Crit` | Score + level label |
| **Matrix** | `I:5×L:4` | Impact × Likelihood |
| **Controls** | `🛡️ 2 ctrls` | Linked controls count |
| **Due warning** | `⚠️ 5d` | Days until overdue |
| **Category path** | `📍 NIS2 > Incident` | Category breadcrumb |

---

## 6. Summary Tables Design System

### 6.1 Status Indicators

```tsx
// Status Dot + Label
<StatusIndicator status="critical" /> // 🔴 Critical
<StatusIndicator status="high" />     // 🟠 High
<StatusIndicator status="medium" />   // 🟡 Medium
<StatusIndicator status="low" />      // 🟢 Low
<StatusIndicator status="none" />     // ⚪ None

// Trend Arrows
<TrendIndicator value={5} />   // ▲ +5 (green)
<TrendIndicator value={-3} />  // ▼ -3 (red)
<TrendIndicator value={0} />   // → stable (gray)

// Progress Bars (inline)
<ProgressBar value={85} size="sm" /> // ████░ 85%

// Letter Grades
<GradeBadge grade="A" score={92} /> // 🟢 A (92)
<GradeBadge grade="D" score={45} /> // 🔴 D (45)

// Tier Badges
<TierBadge tier={1} ctpp={false} /> // 🔷 T1
<TierBadge tier={2} ctpp={true} />  // 🔶 T2 ⚠️CTPP
```

### 6.2 Quick Action Icons

| Icon | Action | Context |
|------|--------|---------|
| 📄 | View documents | Vendor row |
| 📊 | View analysis | Vendor row |
| ✏️ | Edit | Any row |
| 🗑️ | Delete | Any row |
| 📥 | Download | Document row |
| 🔗 | Link | Relationship |
| ➕ | Add | Create new |
| ⋮ | More actions | Overflow menu |

### 6.3 Table Component Specification

```tsx
interface SmartTableColumn<T> {
  key: keyof T;
  header: string;
  width?: string;

  // Inline indicators
  indicator?: {
    type: 'status' | 'trend' | 'progress' | 'grade' | 'tier';
    field: keyof T;
  };

  // Secondary line (subtitle)
  subtitle?: keyof T;

  // Quick actions
  actions?: Array<{
    icon: string;
    label: string;
    href?: (row: T) => string;
    onClick?: (row: T) => void;
  }>;
}
```

---

## 7. Color System Application

### 7.1 Semantic Colors

| Purpose | Light Mode | Dark Mode | Usage |
|---------|------------|-----------|-------|
| **Success/Low** | `#10B981` | `#34D399` | Low risk, compliant, positive |
| **Warning/Medium** | `#F59E0B` | `#FBBF24` | Medium risk, attention needed |
| **High Risk** | `#F97316` | `#FB923C` | High risk, urgent |
| **Critical/Error** | `#EF4444` | `#F87171` | Critical risk, overdue, failed |
| **Info** | `#3B82F6` | `#60A5FA` | Informational, due soon |
| **Muted** | `#64748B` | `#94A3B8` | Inactive, disabled, secondary |

### 7.2 Progress Bar Colors

```css
/* DORA Compliance Progress */
.progress-excellent { background: var(--success); }  /* 80-100% */
.progress-good { background: var(--chart-2); }       /* 60-79% */
.progress-fair { background: var(--warning); }       /* 40-59% */
.progress-poor { background: var(--risk-high); }     /* 20-39% */
.progress-critical { background: var(--error); }     /* 0-19% */
```

### 7.3 Badge Variants

```css
/* Status badges with background */
.badge-critical { bg: #FEE2E2; color: #991B1B; }
.badge-high { bg: #FFEDD5; color: #9A3412; }
.badge-medium { bg: #FEF3C7; color: #92400E; }
.badge-low { bg: #D1FAE5; color: #065F46; }
.badge-info { bg: #DBEAFE; color: #1E40AF; }
```

---

## 8. Interaction Patterns

### 8.1 Click Hierarchy

```
Level 0: Dashboard (Home)
├── Level 1: Section Pages (Vendors, Documents, etc.)
│   └── Level 2: Detail Pages (Vendor Detail, Document Detail)
│       └── Level 3: Sub-pages (Edit forms, Analysis tabs)
```

**Rule:** Most users should complete tasks at Level 1-2.

### 8.2 Navigation Shortcuts

| Shortcut | Action |
|----------|--------|
| `/` | Global search |
| `g` `h` | Go to Home |
| `g` `v` | Go to Vendors |
| `g` `d` | Go to Documents |
| `g` `r` | Go to Risk Register |
| `n` | New item (context-aware) |
| `?` | Help/keyboard shortcuts |

### 8.3 Contextual Actions

Every list page should have:
1. **Quick filters** - Pre-set filter buttons above table
2. **Bulk actions** - Checkbox select + action bar
3. **Search** - Global search with recent items
4. **Export** - CSV/PDF export for current view

---

## 9. Component Library Additions

### 9.1 New Components Needed

| Component | Purpose |
|-----------|---------|
| `<SmartTable>` | Table with inline indicators |
| `<StatusDot>` | Color-coded status indicator |
| `<TrendArrow>` | Up/down/stable trend |
| `<ProgressMini>` | Inline progress bar |
| `<GradeBadge>` | Letter grade with score |
| `<TierBadge>` | Vendor tier indicator |
| `<ActionBar>` | Floating bulk action bar |
| `<QuickFilters>` | Pre-set filter buttons |
| `<GlobalSearch>` | Unified search component |
| `<ActionRequired>` | Dashboard action widget |
| `<ComplianceGauge>` | Circular progress gauge |

### 9.2 Enhanced Existing Components

| Component | Enhancement |
|-----------|-------------|
| `<StatCard>` | Add click-to-filter, inline trends |
| `<DataTable>` | Add row actions, inline editing |
| `<Badge>` | Add dot variant, tier variant |
| `<Card>` | Add action slot, status stripe |

---

## 10. Implementation Phases

### Phase 1: Foundation (Week 1-2)

1. ✅ Create new component library additions
2. ✅ Implement `<SmartTable>` with indicators
3. ✅ Redesign sidebar navigation
4. ✅ Build action required widget

### Phase 2: Dashboard (Week 3)

1. ✅ Implement new dashboard layout
2. ✅ Add compliance gauge component
3. ✅ Build risk heat map widget
4. ✅ Connect real-time data

### Phase 3: Vendor Hub (Week 4-5)

1. ✅ Redesign vendor list with smart table
2. ✅ Reorganize vendor detail tabs
3. ✅ Add inline compliance indicators
4. ✅ Implement quick actions

### Phase 4: Risk & Compliance (Week 6)

1. ✅ Unify risk register views
2. ✅ Add risk row indicators
3. ✅ Implement control linkage UI
4. ✅ Build compliance breakdown

### Phase 5: Polish (Week 7-8)

1. ✅ Add keyboard shortcuts
2. ✅ Implement global search
3. ✅ Mobile responsive updates
4. ✅ Performance optimization

---

## 11. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Click depth** | 90% tasks ≤ 3 clicks | Analytics tracking |
| **Time to insight** | < 10 seconds | Session recordings |
| **Feature discovery** | > 80% find key features | User surveys |
| **Task completion** | > 95% success rate | Funnel analysis |
| **User satisfaction** | NPS > 50 | Quarterly surveys |

---

## 12. Reference Screenshots

### 3rdRisk Patterns to Adopt

1. **Dashboard widgets** - Clickable cards that filter/navigate
2. **Risk segmentation** - Concentric rings by tier
3. **World map** - Geographic distribution
4. **Action-oriented UI** - Every widget leads somewhere
5. **Clean navigation** - Minimal sidebar, contextual tabs

### 3rdRisk Patterns to Improve

1. **Better mobile** - They're desktop-focused
2. **Faster load** - Our edge deployment advantage
3. **AI integration** - Deeper than their chatbot
4. **DORA specificity** - More granular Article mapping
5. **Supply chain depth** - Fourth-party visibility

---

## Appendix: Page-by-Page Specifications

### A1. Home Dashboard

**URL:** `/dashboard`
**Purpose:** Single view of compliance health + actions
**Sections:**
1. KPI cards (4 metrics)
2. Action required list (max 5 items)
3. Compliance pillar breakdown
4. Risk heat map (mini)
5. Recent activity feed

### A2. Third Parties List

**URL:** `/vendors`
**Purpose:** All vendors with inline status
**Features:**
- Smart table with indicators
- Quick filter tabs
- Bulk actions
- Export

### A3. Third Party Detail

**URL:** `/vendors/[id]`
**Purpose:** Complete vendor profile
**Tabs:** Overview, Compliance, Documents, Contracts, Monitoring

### A4. Risk Register

**URL:** `/risks`
**Purpose:** Unified risk management
**Views:** All, NIS2, Vendor, Operational

### A5. Register of Information

**URL:** `/roi`
**Purpose:** DORA Article 28 RoI
**Features:** Template wizard, validation, export

### A6. Resilience Testing

**URL:** `/testing`
**Purpose:** TLPT + penetration tests
**Views:** Tests, TLPT, Findings

### A7. Documents

**URL:** `/documents`
**Purpose:** Evidence library
**Features:** Upload, parse, link to vendors

### A8. Incidents

**URL:** `/incidents`
**Purpose:** ICT incident management
**Features:** Timeline, reporting, deadlines

### A9. Settings

**URL:** `/settings`
**Purpose:** Configuration
**Sections:** Organization, Team, Security, Integrations

---

*Document Version: 1.0*
*Last Updated: January 2026*
*Author: Claude (AI Assistant)*
