# DORA Comply - Roadmap Status

**Last Updated:** January 2026
**Platform Version:** 1.0
**Deployment:** https://dora-comply.vercel.app

---

## Executive Summary

DORA Comply has achieved **92% feature completion** for Phase 5 critical improvements. The platform is production-ready with all regulatory must-haves implemented before the April 30, 2025 RoI submission deadline. Historical maturity tracking with full audit trails is now complete.

---

## Feature Implementation Status

### Phase 5.1: Regulatory Compliance (Must-Have) ✅ COMPLETE

| # | Feature | Status | Files | Notes |
|---|---------|--------|-------|-------|
| 5.1.1 | **SOC2-to-RoI Auto-Population** | ✅ DONE | `src/lib/roi/soc2-to-roi.ts` | 10X differentiator - one-click RoI generation |
| 5.1.2 | **Incident Reporting Workflow** | ✅ DONE | `src/lib/incidents/` | 4h/72h/1mo deadlines, ESA templates |
| 5.1.3 | **DORA Articles 33-44** | ✅ DONE | `src/lib/compliance/dora-requirements-data.ts` | 21 new CTPP oversight articles |
| 5.1.4 | **Entity Type Differentiation** | ✅ DONE | `src/app/(dashboard)/roi/onboarding/` | Significant/non-significant/CTPP handling |

### Phase 5.2: Competitive Parity

| # | Feature | Status | Files | Notes |
|---|---------|--------|-------|-------|
| 5.2.1 | **Continuous Monitoring Integration** | ✅ DONE | `src/lib/external/securityscorecard.ts` | SecurityScorecard API with mock mode |
| 5.2.2 | **Contract Clause Analyzer** | ✅ DONE | `src/lib/ai/contract-analyzer.ts` | Full Art. 30 compliance checking |
| 5.2.3 | **Concentration Risk Dashboard** | ✅ DONE | `src/app/(dashboard)/concentration/` | HHI, SPOF, alerts, mitigation |
| 5.2.4 | **PDF Split View Verification** | ✅ DONE | `src/components/evidence/split-evidence-view.tsx` | Side-by-side evidence linking |
| 5.2.5 | **Board Reporting Export** | ✅ DONE | `src/lib/exports/board-report-*.ts` | PDF & 8-slide PPTX |

### Phase 5.3: Market Leadership

| # | Feature | Status | Files | Notes |
|---|---------|--------|-------|-------|
| 5.3.1 | **Fourth-Party Risk Mapping** | ✅ DONE | `src/components/visualization/supply-chain-graph.tsx` | Full Nth-party chain visualization |
| 5.3.2 | **AI Gap Remediation Suggestions** | ✅ DONE | `src/app/(dashboard)/roi/validate/components/ai-suggestions.tsx` | Claude-powered fix recommendations |
| 5.3.3 | **Historical Maturity Tracking** | ✅ DONE | `src/app/(dashboard)/compliance/trends/` | Full audit trail with trend charts, snapshots, auto-triggers |
| 5.3.4 | **Multi-Framework Mapping** | ⚠️ PARTIAL | `src/lib/compliance/` | DORA complete, ISO/GDPR/NIS2 limited |

---

## Completion Summary

```
Phase 5.1 (Regulatory):     4/4  = 100% ████████████████████
Phase 5.2 (Competitive):    5/5  = 100% ████████████████████
Phase 5.3 (Leadership):     3/4  =  75% ███████████████░░░░░
────────────────────────────────────────────────────────────
OVERALL:                   12/13 =  92% ██████████████████░░
```

---

## Remaining Development Items

### Priority 1: Multi-Framework Expansion

**Why:** Market expansion beyond DORA-only customers.

**Scope:**
- NIS2 Directive requirements
- GDPR Article 32 controls
- ISO 27001:2022 full mapping
- Cross-framework control mapping UI

**Files to create:**
```
src/lib/compliance/nis2-requirements.ts
src/lib/compliance/gdpr-requirements.ts
src/lib/compliance/iso27001-requirements.ts
src/app/(dashboard)/frameworks/page.tsx
```

---

## Implemented Features Detail

### Core Platform
- ✅ Authentication (email/password, MFA-ready)
- ✅ Multi-tenant organization support
- ✅ Role-based access control
- ✅ Vendor management (full CRUD)
- ✅ Document management with AI parsing
- ✅ Dashboard with KPIs

### DORA Compliance
- ✅ All 5 DORA pillars covered
- ✅ 50+ DORA articles mapped
- ✅ Articles 33-44 CTPP oversight (NEW)
- ✅ Maturity scoring (L0-L4)
- ✅ Gap analysis per vendor
- ✅ Compliance calculator

### Register of Information (RoI)
- ✅ All 15 ESA templates supported
- ✅ xBRL-CSV validation engine
- ✅ SOC2-to-RoI auto-population
- ✅ Export functionality
- ✅ Onboarding wizard
- ✅ AI-powered gap remediation

### Incident Management
- ✅ Incident creation and tracking
- ✅ DORA classification (major/significant)
- ✅ Timeline management
- ✅ 4h/72h/1mo deadline tracking
- ✅ ESA reporting templates

### Resilience Testing
- ✅ Testing programmes (Art. 24)
- ✅ 10 test types (Art. 25)
- ✅ TLPT management (Art. 26)
- ✅ Tester qualifications (Art. 27)
- ✅ Finding tracking

### Risk Analytics
- ✅ Concentration risk dashboard
- ✅ HHI scoring
- ✅ SPOF detection
- ✅ Fourth-party mapping
- ✅ Supply chain visualization
- ✅ Mitigation workflows

### Reporting & Export
- ✅ Board report PDF
- ✅ Board report PPTX (8 slides)
- ✅ RoI CSV export
- ✅ Evidence traceability

### AI Capabilities
- ✅ SOC 2 report parsing (Gemini 2.0)
- ✅ Contract clause analysis (Claude)
- ✅ Gap remediation suggestions
- ✅ Evidence extraction with confidence scores

---

## Technical Debt & Improvements

### Low Priority
- [ ] Add unit tests for critical paths
- [ ] Performance optimization for large vendor lists
- [ ] Caching layer for AI parsing results
- [ ] Webhook integrations for external systems

### Nice to Have
- [ ] Mobile app (React Native)
- [ ] Slack/Teams notifications
- [ ] Calendar integration for deadlines
- [ ] Custom report builder

---

## Deployment Information

| Environment | URL | Status |
|-------------|-----|--------|
| Production | https://dora-comply.vercel.app | ✅ Live |
| Database | Supabase Frankfurt (EU) | ✅ Active |
| AI Services | Gemini 2.0 / Claude | ✅ Connected |

---

## Changelog

### January 2026
- ✅ **Historical Maturity Tracking** - Full compliance trends dashboard with snapshots, audit trails, and auto-triggers
- ✅ **Continuous Monitoring Integration** - SecurityScorecard API with full UI
- ✅ Added DORA Articles 33-44 (21 new requirements)
- ✅ Deployed to Vercel production
- ✅ Completed stress testing
- ✅ Created testing guide

### Previous
- ✅ Resilience Testing module (Articles 24-27)
- ✅ Concentration Risk dashboard
- ✅ Board reporting exports
- ✅ Fourth-party risk mapping
- ✅ Contract clause analyzer
- ✅ SOC2-to-RoI auto-population
