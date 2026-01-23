# MASTERPLAN: Competitive Gap Analysis & Implementation Roadmap

> **Last Updated:** January 23, 2026
> **Status:** Phase 2 Complete
> **Competitor Benchmark:** [3rdRisk](https://www.3rdrisk.com/)

---

## Progress Overview

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1: Fix Broken Features | ✅ Complete | 8/8 |
| Phase 2: High-Value Features | ✅ Complete | 4/4 |
| Phase 3: Competitive Parity | ⏳ Pending | 0/6 |
| Phase 4: Competitive Advantage | ⏳ Pending | 0/6 |

---

## Phase 1: Fix Broken Features (2 weeks)

**Goal:** Ensure all existing features work correctly

### Week 1: Core Fixes

- [x] **1.1 Notifications System** (5 days) ✅
  - [x] Create notification UI components
  - [x] Add notification bell to header
  - [x] Create notification dropdown
  - [x] Add database triggers for events
  - [x] Create notification settings page

- [x] **1.2 API Keys Management** (2 days) ✅
  - [x] Create API keys settings page
  - [x] Add create/revoke key functionality
  - [x] Add key listing with last used date
  - [x] Add copy-to-clipboard for keys

- [x] **1.3 Monitoring Alerts Dashboard** (3 days) ✅
  - [x] Create alerts dashboard page
  - [x] Add alert cards with severity
  - [x] Add alert acknowledgment
  - [x] Add alert filtering

- [x] **1.4 Activity Log Improvements** (2 days) ✅
  - [x] Add advanced filtering
  - [x] Add search functionality
  - [x] Add CSV/JSON export
  - [x] Improve pagination

### Week 2: Polish & Completeness

- [x] **1.5 Score History Population** (1 day) ✅
  - [x] Create trigger to populate `vendor_score_history`
  - [x] Backfill existing vendor scores

- [x] **1.6 Webhook Retry Logic** (2 days) ✅
  - [x] Document background job approach
  - [x] Add retry_count, next_retry_at fields
  - [x] Create manual retry button

- [x] **1.7 Vendor Bulk Export** (1 day) ✅
  - [x] Add XLSX export format
  - [x] Add JSON export format
  - [x] Add export options dialog

- [x] **1.8 Sanctions Screening** (3 days) ✅
  - [x] Research sanctions API providers
  - [x] Implement screening integration
  - [x] Add screening results UI

---

## Phase 2: High-Value Features (4 weeks)

**Goal:** Add features that directly impact user value

### Weeks 3-4: Task Management

- [x] **2.1 Task Management System** (7 days) ✅
  - [x] Create migration for `tasks` and `task_comments` tables
  - [x] Create `lib/tasks/` module (types, queries, actions)
  - [x] Create task list page `/tasks`
  - [x] Create task card component
  - [x] Create task detail sheet
  - [x] Create task creation dialog
  - [x] Add task filters (status, priority, assignee)
  - [x] Add "My Tasks" view
  - [x] Link tasks to vendors, incidents, questionnaires

### Weeks 5-6: Real-time Notifications Enhancement

- [x] **2.2 Real-time Notifications** (5 days) ✅
  - [x] Add Supabase Realtime subscription
  - [x] Create toast notifications
  - [x] Add notification preferences
  - [x] Add email notification option
  - [x] Create notification history page

- [x] **2.3 Vendor Risk Timeline** (3 days) ✅
  - [x] Create timeline component
  - [x] Show score history graph
  - [x] Show key events (assessments, incidents)
  - [x] Add date range selector

- [x] **2.4 Branded Vendor Portal** (3 days) ✅
  - [x] Add branding fields to organizations table
  - [x] Create branding settings page
  - [x] Apply branding to vendor portal
  - [x] Add logo upload

---

## Phase 3: Competitive Parity (6 weeks)

**Goal:** Match 3rdRisk's core competitive features

### Weeks 7-8: Contract Management Enhancement

- [ ] **3.1 Contract Lifecycle Management** (7 days)
  - [ ] Create migration for `contract_clauses`, `contract_renewals`, `contract_alerts`
  - [ ] Create contract detail page with tabs
  - [ ] Add clause extraction from AI
  - [ ] Create renewal workflow
  - [ ] Add contract calendar view
  - [ ] Create expiry alerts

### Weeks 9-10: Remediation Workflow

- [ ] **3.2 Remediation Plans & Actions** (5 days)
  - [ ] Create migration for `remediation_plans`, `remediation_actions`
  - [ ] Create remediation dashboard
  - [ ] Add Kanban board view
  - [ ] Create plan wizard
  - [ ] Add evidence linking
  - [ ] Create progress reporting

### Weeks 11-12: Custom Dashboards

- [ ] **3.3 Custom Dashboards** (10 days)
  - [ ] Create migration for `custom_dashboards`, `dashboard_widgets`
  - [ ] Create dashboard builder UI
  - [ ] Implement drag-and-drop widgets
  - [ ] Create widget library (stats, charts, tables)
  - [ ] Add dashboard sharing
  - [ ] Create default dashboard templates

---

## Phase 4: Competitive Advantage (8 weeks)

**Goal:** Exceed 3rdRisk with unique capabilities

### Weeks 13-16: Multi-Domain Risk & ESG

- [ ] **4.1 Multi-Domain Risk Assessment** (10 days)
  - [ ] Create migration for `vendor_domain_assessments`
  - [ ] Add risk domain selector to vendor form
  - [ ] Create domain-specific assessment forms
  - [ ] Add multi-domain risk dashboard
  - [ ] Create domain comparison charts

- [ ] **4.2 ESG/Sustainability Module** (6 days)
  - [ ] Create migration for `esg_metrics`
  - [ ] Create ESG assessment form
  - [ ] Add ESG dashboard widgets
  - [ ] Create ESG reporting

### Weeks 17-18: GDPR Compliance Module

- [ ] **4.3 GDPR Module** (10 days)
  - [ ] Create migration for `gdpr_processing_activities`, `gdpr_dpias`
  - [ ] Create processing activities register
  - [ ] Create DPIA workflow
  - [ ] Add data subject rights tracking
  - [ ] Create GDPR dashboard

### Weeks 19-20: Integration Framework

- [ ] **4.4 Integration Framework** (10 days)
  - [ ] Create migration for `integrations`, `integration_events`
  - [ ] Create integration settings page
  - [ ] Implement Slack integration
  - [ ] Implement Microsoft Teams integration
  - [ ] Implement Jira integration
  - [ ] Add OAuth flow for integrations

---

## Database Tables Created/To Create

| Migration | Tables | Phase | Status |
|-----------|--------|-------|--------|
| 034 | Notification triggers | 1 | ✅ Done |
| 037 | `tasks`, `task_comments` | 2 | ✅ Done |
| 038 | Organization branding fields | 2 | ✅ Done |
| 039 | `contract_clauses`, `contract_renewals`, `contract_alerts` | 3 | ⏳ Pending |
| 040 | `remediation_plans`, `remediation_actions` | 3 | ⏳ Pending |
| 041 | `custom_dashboards`, `dashboard_widgets` | 3 | ⏳ Pending |
| 042 | `vendor_domain_assessments`, `esg_metrics` | 4 | ⏳ Pending |
| 043 | `gdpr_processing_activities`, `gdpr_dpias` | 4 | ⏳ Pending |
| 044 | `integrations`, `integration_events` | 4 | ⏳ Pending |

---

## Files to Create

### Phase 1

```
src/
├── app/(dashboard)/
│   └── settings/
│       └── api-keys/page.tsx
├── components/
│   ├── notifications/
│   │   ├── notification-bell.tsx
│   │   ├── notification-dropdown.tsx
│   │   ├── notification-item.tsx
│   │   └── notification-settings.tsx
│   └── monitoring/
│       └── alerts-dashboard.tsx
└── lib/
    └── notifications/
        ├── types.ts
        ├── queries.ts
        └── actions.ts
```

### Phase 2

```
src/
├── app/(dashboard)/
│   └── tasks/
│       ├── page.tsx
│       ├── my-tasks/page.tsx
│       └── [taskId]/page.tsx
├── components/
│   └── tasks/
│       ├── task-list.tsx
│       ├── task-card.tsx
│       ├── task-detail-sheet.tsx
│       ├── create-task-dialog.tsx
│       └── task-filters.tsx
└── lib/
    └── tasks/
        ├── types.ts
        ├── schemas.ts
        ├── queries.ts
        └── actions.ts
```

### Phase 3

```
src/
├── app/(dashboard)/
│   ├── contracts/
│   │   ├── page.tsx
│   │   ├── calendar/page.tsx
│   │   └── [contractId]/page.tsx
│   ├── remediation/
│   │   ├── page.tsx
│   │   └── [planId]/page.tsx
│   └── dashboards/
│       ├── page.tsx
│       └── [dashboardId]/page.tsx
├── components/
│   ├── contracts/
│   ├── remediation/
│   └── dashboards/
└── lib/
    ├── contracts/
    ├── remediation/
    └── dashboards/
```

### Phase 4

```
src/
├── app/(dashboard)/
│   ├── gdpr/
│   │   ├── page.tsx
│   │   ├── processing-activities/page.tsx
│   │   └── dpias/page.tsx
│   └── integrations/
│       ├── page.tsx
│       └── [provider]/page.tsx
├── components/
│   ├── gdpr/
│   ├── esg/
│   └── integrations/
└── lib/
    ├── gdpr/
    ├── esg/
    └── integrations/
```

---

## Success Metrics

| Phase | Metric | Target | Current |
|-------|--------|--------|---------|
| Phase 1 | Broken features fixed | 8/8 | 0/8 |
| Phase 1 | Lint/Build passing | Yes | Yes |
| Phase 2 | Task adoption | > 50% users | - |
| Phase 2 | Notification engagement | > 60% | - |
| Phase 3 | Contract tracking | 100% vendors | - |
| Phase 3 | Remediation plans | > 50% gaps | - |
| Phase 4 | Multi-domain assessments | > 30% vendors | - |
| Phase 4 | Integration activations | > 3 per org | - |

---

## Competitive Comparison

### Our Strengths (Exceeds 3rdRisk)
- ✅ NIS2/DORA compliance depth
- ✅ AI document parsing (SOC 2, ISO 27001)
- ✅ LEI/GLEIF integration
- ✅ Incident reporting (24h/72h)
- ✅ Vendor questionnaire AI extraction

### Gaps to Close
- ✅ Real-time notifications
- ✅ Task management
- ✅ Branded vendor portal
- ⬜ Contract lifecycle
- ⬜ Remediation workflow
- ⬜ Custom dashboards
- ⬜ Multi-domain risk
- ⬜ GDPR module
- ⬜ Integration framework

---

## Changelog

| Date | Change | Phase |
|------|--------|-------|
| 2026-01-23 | Created masterplan | - |
| 2026-01-23 | Started Phase 1 | 1 |
| 2026-01-23 | Completed Phase 1 (8/8 features) | 1 |
| 2026-01-23 | Completed Phase 2 (4/4 features) | 2 |

---

*This document is the single source of truth for the product roadmap. Update checkboxes as features are completed.*
