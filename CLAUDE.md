# NIS2 & DORA Compliance Platform - Project Documentation

## Overview

**NIS2 & DORA Compliance Platform** is an AI-powered compliance platform for EU organizations. The **PRIMARY FOCUS is NIS2** (Network and Information Security Directive 2), with DORA (Digital Operational Resilience Act) as a secondary framework for financial institutions.

The platform automates vendor assessments, manages third-party risk, handles incident reporting, and provides compliance tracking across multiple frameworks.

### Regulatory Deadlines
- **NIS2 Transposition Deadline:** October 17, 2024 (Member states must have transposed into national law)
- **NIS2 Compliance:** Organizations in essential/important sectors must comply NOW
- **DORA Enforcement:** January 17, 2026 (for financial entities)

### Framework Priority
> **IMPORTANT:** When building features, always prioritize NIS2 first. DORA is one of many supported frameworks, not the primary focus. UI labels should show "NIS2 Ready" not "DORA Ready".

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js (App Router) | 16.x |
| Language | TypeScript | 5.x (strict mode) |
| UI Library | shadcn/ui (New York style) | latest |
| Styling | Tailwind CSS | 4.x |
| Database | PostgreSQL (Supabase) | 15.x |
| Auth | Supabase Auth | SSR package |
| State | React Server Components + TanStack Query | v5 |
| Forms | React Hook Form + Zod | - |
| AI | Google Gemini | gemini-2.0-flash |
| Hosting | Vercel (Edge) | - |

## Project Structure

```
compliance-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Auth routes (login, register, etc.)
│   │   ├── (dashboard)/        # Protected routes
│   │   ├── (marketing)/        # Public marketing pages
│   │   └── api/                # API routes
│   ├── components/             # React components (333 files)
│   │   ├── ui/                 # shadcn/ui base components (51)
│   │   ├── vendors/            # Vendor management (24)
│   │   ├── documents/          # Document handling (15)
│   │   ├── dashboard/          # Dashboard widgets (14)
│   │   ├── incidents/          # Incident management (12)
│   │   ├── questionnaires/     # Vendor questionnaires (12)
│   │   ├── soc2/               # SOC 2 analysis (11)
│   │   ├── settings/           # Settings pages (9)
│   │   ├── roi/                # Register of Information (9)
│   │   ├── compliance/         # Compliance views (8)
│   │   └── ...                 # Other feature components
│   ├── hooks/                  # Custom React hooks (18)
│   ├── lib/                    # Business logic (30+ modules)
│   └── types/                  # TypeScript types
├── supabase/
│   └── migrations/             # SQL migrations (29 applied)
├── docs/                       # Architecture & planning docs
├── scripts/                    # Utility & sales scripts
└── data/esa/                   # ESA regulatory reference files
```

---

## Design System

### Brand Colors (Emerald Theme)

```css
/* Primary - Emerald */
--primary: #059669;           /* emerald-600 - main brand */
--primary-light: #10B981;     /* emerald-500 */
--primary-dark: #047857;      /* emerald-700 */
--primary-foreground: #FFFFFF;

/* Background */
--dark: #111827;              /* gray-900 */
--dark-secondary: #1F2937;    /* gray-800 */

/* Semantic */
--success: #10B981;           /* emerald-500 */
--warning: #F59E0B;           /* amber-500 */
--error: #EF4444;             /* red-500 */
--info: #3B82F6;              /* blue-500 */

/* Risk Levels */
--risk-low: #10B981;
--risk-medium: #F59E0B;
--risk-high: #F97316;
--risk-critical: #EF4444;
```

### Typography

- **Font:** Plus Jakarta Sans
- **Headings:** font-semibold, tracking-tight (-0.02em)
- **Body:** font-normal, leading-relaxed (1.6)

### Component Classes

Premium utility classes from `globals.css`:

| Class | Purpose |
|-------|---------|
| `.card-premium` | Elevated card with hover shadow |
| `.card-elevated` | Card with border and hover effect |
| `.btn-primary` | Primary emerald button |
| `.btn-secondary` | Secondary outlined button |
| `.badge-success/warning/error/info` | Status badges |
| `.stat-card` | Metric display card |
| `.table-premium` | Styled data table |
| `.status-dot-*` | Status indicators |
| `.animate-in` | Fade in animation |
| `.stagger > *` | Staggered children (50ms delay) |

---

## Component Library

### UI Components (`/components/ui/`) - 39 files

| Component | File | Usage |
|-----------|------|-------|
| Button | `button.tsx` | Primary actions |
| Card | `card.tsx` | Content containers |
| Dialog | `dialog.tsx` | Modal dialogs |
| Form | `form.tsx` | Form handling with react-hook-form |
| Input | `input.tsx` | Text inputs |
| Select | `select.tsx` | Dropdown selects |
| Table | `table.tsx` | Data tables |
| Tabs | `tabs.tsx` | Tabbed interfaces |
| Badge | `badge.tsx` | Status badges |
| Alert | `alert.tsx` | Notifications |
| Tooltip | `tooltip.tsx` | Hover tooltips |
| Sheet | `sheet.tsx` | Side panels |
| Skeleton | `skeleton.tsx` | Loading states |
| Progress | `progress.tsx` | Progress bars |
| Calendar | `calendar.tsx` | Date picker |
| StatCard | `stat-card.tsx` | Metric displays |
| StatusBadge | `status-badge.tsx` | Status indicators |
| HelpTooltip | `help-tooltip.tsx` | Help icons |
| ActionCard | `action-card.tsx` | Priority action cards |
| Sparkline | `sparkline.tsx` | Trend mini-charts |
| TrendIndicator | `trend-indicator.tsx` | Delta displays |
| DataFreshnessBadge | `data-freshness-badge.tsx` | Staleness indicators |
| HealthScoreGauge | `health-score-gauge.tsx` | Health visualization |

### Feature Components

#### Vendors (`/components/vendors/`) - 24 files
- `vendor-card.tsx` - Vendor list card
- `vendor-filters.tsx` - Filter controls
- `vendor-search.tsx` - Search input
- `vendor-stats.tsx` - Summary statistics
- `vendor-pagination.tsx` - List pagination
- `vendor-empty-state.tsx` - Empty state view
- `vendor-contracts.tsx` - Contract management
- `vendor-contacts.tsx` - Contact management
- `vendor-dora-dashboard.tsx` - DORA compliance view
- `assessment-progress.tsx` - Assessment tracker
- `detail/vendor-hero.tsx` - Vendor detail header
- `detail/vendor-risk-gauge.tsx` - Risk visualization
- `detail/vendor-gleif-status.tsx` - LEI validation
- `detail/vendor-parent-hierarchy.tsx` - Corporate structure
- `frameworks/vendor-frameworks-tab.tsx` - Framework mapping
- `frameworks/framework-compliance-card.tsx` - Compliance cards
- `monitoring/factor-breakdown.tsx` - Risk factors

#### Documents (`/components/documents/`) - 15 files
- `pdf-viewer/pdf-viewer.tsx` - PDF rendering
- `pdf-viewer/pdf-highlight-layer.tsx` - AI highlights
- `contract-analysis-button.tsx` - Analyze contracts
- `populate-roi-button.tsx` - RoI population
- `document-status-badge.tsx` - Document status
- `soc2-analysis-card/` - SOC 2 analysis display
- `contract-analysis-results/` - Contract findings

#### Incidents (`/components/incidents/`) - 12 files
- `incident-card.tsx` - Incident list item
- `incident-list.tsx` - Incident listing
- `incident-export-button.tsx` - PDF export
- `delete-incident-button.tsx` - Delete action
- `dashboard/incident-metrics-card.tsx` - Metrics display
- `dashboard/incident-trend-sparkline.tsx` - Trend charts
- `dashboard/response-time-indicator.tsx` - Response times
- `incident-wizard/` - Multi-step incident form
- `incident-detail/` - Incident detail views
- `report-builder/` - Report generation

#### Compliance (`/components/compliance/`) - 8 files
- `dora-coverage-chart.tsx` - Coverage visualization
- `dora-evidence-chart.tsx` - Evidence tracking
- `dora-gap-analysis.tsx` - Gap identification
- `dora-gap-remediation/` - Remediation workflow

#### Questionnaires (`/components/questionnaires/`) - 12 files
- `company/questionnaire-dashboard.tsx` - Admin dashboard
- `company/send-questionnaire-dialog.tsx` - Send to vendors
- `company/create-template-dialog.tsx` - Template creation
- `company/questionnaire-review-panel.tsx` - Response review
- `vendor-portal/vendor-portal-layout.tsx` - Portal shell
- `vendor-portal/document-upload-zone.tsx` - Document uploads
- `vendor-portal/questionnaire-form.tsx` - Question form
- `vendor-portal/ai-suggestion-badge.tsx` - AI indicators
- `vendor-portal/submit-questionnaire-button.tsx` - Submission

#### Dashboard (`/components/dashboard/`) - 14 files
- Metric cards, charts, and widgets for the main dashboard

---

## Custom Hooks (`/hooks/`)

| Hook | Purpose |
|------|---------|
| `use-async-action` | Async action with loading/error states |
| `use-debounce` | Debounced values |
| `use-dialog-state` | Dialog open/close state |
| `use-filter-state` | URL-synced filter state |
| `use-url-filters` | Query parameter management |
| `use-local-storage` | Persisted local storage |
| `use-mounted` | Component mount detection |
| `use-intersection-observer` | Scroll-based visibility |
| `use-documents-state` | Document list state |
| `use-edit-vendor-form` | Vendor edit form state |
| `use-incident-edit-form` | Incident edit form state |
| `use-roi-population` | RoI population workflow |
| `use-organization-settings` | Org settings state |
| `use-team-settings` | Team management state |
| `use-webhooks` | Webhook configuration |
| `use-landing-auth` | Landing page auth flow |
| `use-data-entry-sheet` | Data entry sheet state |

---

## Library Modules (`/lib/`)

### Core Modules

| Module | Purpose |
|--------|---------|
| `supabase/` | Supabase client configuration |
| `auth/` | Authentication utilities |
| `api/` | API client functions |
| `actions/` | Server actions |
| `utils.ts` | Shared utilities (cn, formatters) |
| `constants/` | App-wide constants |

### Feature Modules

| Module | Purpose |
|--------|---------|
| `vendors/` | Vendor CRUD operations |
| `documents/` | Document processing |
| `incidents/` | Incident management |
| `roi/` | Register of Information logic |
| `compliance/` | Compliance calculations |
| `concentration/` | Concentration risk (HHI) |
| `certifications/` | Vendor certifications |
| `contracts/` | Contract management |
| `contacts/` | Contact management |
| `testing/` | Resilience testing |
| `soc2/` | SOC 2 report parsing |
| `nis2-questionnaire/` | Vendor questionnaire system |

### AI & External

| Module | Purpose |
|--------|---------|
| `ai/` | Gemini AI integration |
| `external/` | External API clients |
| `exports/` | PDF/Excel export utilities |
| `exports/brand-colors.ts` | Centralized brand colors for exports |

---

## Database Schema

### Supabase Configuration
- **Region:** EU Frankfurt
- **Project ID:** oipwlrhyzayuxgcabsvu
- **Multi-tenant:** All tables use `organization_id`
- **RLS:** Enabled on all tables

### Migrations (29 applied)

**Core Schema (001-010):**
- `001_initial_schema.sql` - Core entities (orgs, users, vendors)
- `002_incident_reporting.sql` - Incident management
- `003_enhanced_roi.sql` - Full RoI support (15 templates)
- `004_framework_mapping.sql` - Cross-framework controls
- `005_esa_field_additions.sql` - ESA regulatory fields
- `006_lei_enrichment.sql` - LEI/GLEIF integration
- `007_parsed_soc2_insert_policy.sql` - SOC 2 parsing
- `008_extraction_jobs.sql` - AI extraction jobs
- `009_dora_compliance_scoring.sql` - Compliance metrics
- `010_soc2_roi_mapping.sql` - SOC 2 to RoI mapping

**Feature Extensions (011-020):**
- `011_roi_ux_improvements.sql` - RoI user experience
- `012_roi_population_tracking.sql` - RoI population tracking
- `013_soft_delete_columns.sql` - Soft delete support
- `014_resilience_testing.sql` - Testing framework
- `015_continuous_monitoring.sql` - Vendor monitoring
- `016_maturity_history.sql` - Maturity tracking
- `017_framework_licensing.sql` - Framework licensing
- `018_vendor_framework_compliance.sql` - Multi-framework compliance
- `019_nis2_risk_management.sql` - NIS2 risk register
- `020_nis2_vendor_questionnaire.sql` - Vendor questionnaire system

**Refinements & Cleanup (021-028):**
- `021_fix_questionnaire_progress_stats.sql` - Questionnaire progress
- `022_fix_validate_token_exclude_draft.sql` - Token validation
- `023_database_cleanup.sql` - Remove unused tables
- `024_chain_traversal.sql` - Subcontractor chain analysis
- `025_cleanup_remaining_tables.sql` - Further cleanup
- `026_security_fixes.sql` - Security hardening
- `027_fix_function_search_path.sql` - Function security
- `028_remove_deprecated_tables.sql` - Final deprecated table removal

### Key Tables (74 total)

| Table | Purpose |
|-------|---------|
| `organizations` | Multi-tenant orgs |
| `profiles` | User profiles |
| `organization_invitations` | Team invitations |
| `vendors` | Third-party providers |
| `vendor_certifications` | Vendor certs (SOC 2, ISO) |
| `vendor_contracts` | Contract details |
| `vendor_contacts` | Vendor contacts |
| `vendor_framework_compliance` | Multi-framework compliance |
| `documents` | Uploaded documents |
| `incidents` | ICT incidents |
| `incident_reports` | Regulatory reports |
| `resilience_tests` | Testing records |
| `tlpt_engagements` | TLPT tracking |
| `roi_entries` | RoI data entries |
| `dora_control_mappings` | DORA article mappings |
| `nis2_questionnaire_templates` | Questionnaire templates |
| `nis2_template_questions` | Template questions |
| `nis2_vendor_questionnaires` | Questionnaire instances |
| `nis2_questionnaire_answers` | Vendor responses |
| `nis2_questionnaire_documents` | Uploaded documents |
| `nis2_ai_extractions` | AI extraction jobs |

---

## API Routes (`/app/api/`)

| Route | Purpose |
|-------|---------|
| `/api/vendors` | Vendor CRUD |
| `/api/documents` | Document upload/analysis |
| `/api/incidents` | Incident management |
| `/api/incidents/[id]/export` | PDF export |
| `/api/roi` | Register of Information |
| `/api/compliance` | Compliance data |
| `/api/concentration` | Risk concentration |
| `/api/certifications` | Certification tracking |
| `/api/monitoring` | Vendor monitoring |
| `/api/webhooks` | Webhook management |
| `/api/settings` | Organization settings |
| `/api/board` | Board reporting |
| `/api/copilot` | AI copilot chat |
| `/api/gleif` | LEI validation |
| `/api/sanctions` | Sanctions screening |
| `/api/questionnaires` | Questionnaire management |
| `/api/vendor-portal/[token]` | Public vendor portal API |
| `/api/invite` | Team invitation handling |

---

## Key Features

### 1. Third-Party Risk Management (TPRM)
- Centralized vendor registry with risk tiering
- LEI validation via GLEIF API
- Contract and certification tracking
- 4th party (subcontractor) detection
- NIS2 supply chain security compliance

### 2. AI Document Parsing
- SOC 2 report analysis (60 seconds)
- Contract clause extraction
- Auto-population of compliance fields
- Control mapping to NIS2/DORA articles

### 3. Compliance Dashboard
- **NIS2 compliance tracking (PRIMARY)**
- DORA coverage visualization (for financial entities)
- Multi-framework support (NIS2, DORA, ISO 27001, SOC 2)
- Maturity scoring (L0-L4)
- Gap remediation tracking
- Board-ready reports

### 4. Incident Reporting
- NIS2 Article 23 compliant (significant incident reporting)
- DORA Article 19 compliant (for financial entities)
- Timeline tracking (24h/72h notification deadlines)
- Classification (Significant/Major/Minor)
- PDF report generation

### 5. Resilience Testing
- Test tracking across 10 types
- TLPT engagement management (DORA)
- Finding remediation workflow
- Tester certification tracking

### 6. Register of Information (RoI)
- All 15 ESA templates supported (DORA-specific)
- Cross-reference validation
- Export to regulatory format
- Gap analysis and suggestions

### 7. Vendor Questionnaire System
- NIS2 security questionnaire templates
- Magic link vendor portal (`/q/[token]`)
- AI-powered document extraction (SOC 2, ISO 27001, policies)
- Answer pre-filling with confidence scores
- Progress tracking and email notifications
- Review and approval workflow

### 8. Team Management
- Organization invitation system
- Role-based access (Admin, Member)
- Pending invitation tracking
- Team member management

---

## Coding Standards

### TypeScript
- Strict mode enabled
- Use `interface` for objects, `type` for unions
- Explicit return types on exports
- Path alias: `@/*` → `./src/*`

### React Patterns
```typescript
// Server Components (default)
export default async function Page() {
  const data = await fetchData();
  return <Component data={data} />;
}

// Client Components (when needed)
'use client';
export function InteractiveComponent() { ... }

// Server Actions
'use server';
export async function submitForm(data: FormData) { ... }
```

### File Organization
```typescript
'use client'; // Only if needed

import { ... } from 'react';
import { ... } from 'next/...';
import { ... } from '@/components/ui';
import { ... } from '@/lib/...';
import { cn } from '@/lib/utils';

interface Props { ... }

export function Component({ ... }: Props) { ... }
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `VendorCard.tsx` |
| Hooks | camelCase, use- prefix | `useAuth.ts` |
| Utils | camelCase | `formatDate.ts` |
| Types | PascalCase | `Vendor`, `AuthState` |
| Routes | kebab-case | `reset-password/` |

---

## Commands

```bash
# Development
npm run dev          # Start dev server (port 3000)
npm run build        # Production build
npm run lint         # ESLint check
npm run start        # Start production server

# Database (via Supabase MCP)
# Use mcp__supabase__* tools for operations
```

---

## Documentation

| File | Purpose |
|------|---------|
| `docs/planning/MASTERPLAN.md` | **🎯 ACTIVE ROADMAP - Check before starting work** |
| `docs/planning/GAP-ANALYSIS-3RDRISK.md` | Competitive analysis vs 3rdRisk |
| `docs/architecture/MASTER-SPEC.md` | Complete platform specification |
| `docs/architecture/AUTH-SPECIFICATION.md` | Authentication flows |
| `docs/architecture/tech-spec.md` | Technical architecture |
| `docs/design/design-system.md` | Design tokens and patterns |
| `docs/design/LANDING-PAGE-SPECIFICATION.md` | Marketing page spec |
| `docs/planning/prd.md` | Product requirements |
| `docs/planning/roadmap.md` | Development roadmap |
| `docs/planning/decisions/` | Architecture Decision Records |
| `docs/requirements/regulatory-requirements.md` | DORA requirements |
| `docs/setup/SETUP-GUIDE.md` | Development setup |

---

## Active Roadmap (MASTERPLAN)

> **IMPORTANT:** Always check `docs/planning/MASTERPLAN.md` for current progress and next tasks.

**Current Phase:** Phase 1 - Fix Broken Features

| Phase | Status | Focus |
|-------|--------|-------|
| Phase 1 | 🔄 In Progress | Notifications, API Keys, Monitoring Alerts, Activity Log |
| Phase 2 | ⏳ Pending | Task Management, Real-time Notifications |
| Phase 3 | ⏳ Pending | Contract Management, Remediation, Custom Dashboards |
| Phase 4 | ⏳ Pending | Multi-Domain Risk, GDPR, Integrations |

When completing tasks:
1. Check off items in MASTERPLAN.md
2. Update "Progress" counts in the overview table
3. Add entry to Changelog section

---

## Sales Materials

Located in `/scripts/`:
- `DORA-Comply-Sales-Presentation.pptx` - 10-slide deck
- `DORA-Comply-Sales-Guide.pdf` - 8-page sales guide
- `sales-deck/` - HTML slide templates
- `create-sales-guide-pdf.js` - PDF generator
- `sales-deck/create-presentation-direct.js` - PPTX generator

---

## Quality Checklist

Before completing features:

- [ ] `npm run build` passes
- [ ] `npm run lint` passes
- [ ] Uses design system tokens (emerald colors)
- [ ] Server Components where possible
- [ ] Forms validated with Zod
- [ ] Keyboard accessible
- [ ] Mobile responsive (640px, 1024px)
- [ ] Error states handled
- [ ] Loading states implemented

---

## Anti-Patterns

- ❌ Don't use `any` - use `unknown` and narrow
- ❌ Don't fetch in useEffect - use Server Components
- ❌ Don't hardcode colors - use CSS variables
- ❌ Don't create one-off components - extend shadcn/ui
- ❌ Don't skip error handling - wrap with boundaries
- ❌ Don't use old Coral colors (#E07A5F) - use Emerald (#059669)

---

## Competitor Analysis Reference

**Primary Competitor: 3rdRisk** - Enterprise TPRM platform for financial services and critical infrastructure.

| Resource | URL | Purpose |
|----------|-----|---------|
| API Documentation | https://api.3rdrisk.com/ | Technical capabilities reference |
| Support/Help Center | https://support.3rdrisk.com/en | Feature documentation, user guides |
| Best Practices | https://www.3rdrisk.com/best-practices | Industry knowledge, compliance guidance |
| Platform Overview | https://www.3rdrisk.com/platform | Core features and value proposition |

**Key Differentiators to Study:**
- Dashboard KPIs and metrics presentation
- Framework-specific views (NIS2, DORA, ISO 27001)
- Third-party risk scoring methodology
- Vendor assessment workflows
- Compliance gap visualization
- Board reporting capabilities

> Use these references when designing features to ensure competitive parity while maintaining our NIS2-first positioning.
