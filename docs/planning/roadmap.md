# Development Roadmap

**Document Status:** [CURRENT]
**Last Updated:** 2024-12-29
**Target Launch:** Q1 2025 (before April 30 RoI deadline)

> **UPDATE 2024-12-29:** Added critical features identified through regulatory research:
> - Incident Reporting Module (DORA Art. 19) - P0
> - Enhanced RoI Engine (15 ESA templates) - P0
> - Cross-Framework Mapping - P1
> - Contract Analysis AI - P1
> - Enhanced 4th Party Module - P1
> See [new-features-spec.md](../architecture/new-features-spec.md) for detailed implementation plans.

---

## Strategic Timeline

```
2024-12-28                                                     2026-04-30
    │                                                               │
    │   PHASE 1        PHASE 2        PHASE 3        PHASE 4       │
    │   Foundation     AI Parsing     RoI Engine     Scale         │
    │   (4 weeks)      (4 weeks)      (4 weeks)      (4 weeks)     │
    │                                                               │
    ├───────────────┬───────────────┬───────────────┬───────────►  │
    │               │               │               │               │
    │   Week 4      │   Week 8      │   Week 12     │   Week 16    │
    │   MVP Core    │   Beta        │   Public      │   GA         │
    │               │   Launch      │   Launch      │              │
    │               │               │               │      RoI     │
    │               │               │               │   Deadline ──┤
    └───────────────┴───────────────┴───────────────┴──────────────┘
```

---

## Phase 1: Foundation (Weeks 1-4)

### Objective
Build core infrastructure, authentication, and basic vendor management.

### Week 1: Project Setup & Auth

| Task | Priority | Estimate | Owner | Dependencies |
|------|----------|----------|-------|--------------|
| Supabase project setup (US + EU) | P0 | 4h | Backend | None |
| Database schema implementation | P0 | 8h | Backend | Supabase ready |
| RLS policies for multi-tenancy | P0 | 4h | Backend | Schema |
| Authentication flow (login/register) | P0 | 8h | Full-stack | Supabase |
| Protected route middleware | P0 | 4h | Frontend | Auth |
| Organization onboarding flow | P0 | 6h | Full-stack | Auth |
| Basic layout/navigation | P1 | 4h | Frontend | None |

**Deliverables:**
- [ ] Users can register and log in
- [ ] Organizations created on signup
- [ ] Data correctly routed to US/EU

### Week 2: Vendor Management Core

| Task | Priority | Estimate | Owner | Dependencies |
|------|----------|----------|-------|--------------|
| Vendor list page with filtering | P0 | 8h | Frontend | Layout |
| Vendor detail page | P0 | 6h | Frontend | Vendor list |
| Create vendor form | P0 | 6h | Full-stack | Schema |
| Edit vendor functionality | P0 | 4h | Full-stack | Create vendor |
| Vendor search and sort | P1 | 4h | Frontend | Vendor list |
| Bulk import (CSV) | P1 | 8h | Full-stack | Vendor CRUD |
| LEI format validation | P0 | 2h | Backend | None |

**Deliverables:**
- [ ] Full vendor CRUD operations
- [ ] Bulk import from CSV
- [ ] LEI validation

### Week 3: Document Management

| Task | Priority | Estimate | Owner | Dependencies |
|------|----------|----------|-------|--------------|
| File upload component | P0 | 6h | Frontend | None |
| Supabase Storage integration | P0 | 4h | Backend | Storage bucket |
| Document list per vendor | P0 | 4h | Frontend | Upload |
| Document type classification | P0 | 4h | Backend | Upload |
| File size/type validation | P0 | 2h | Frontend | Upload |
| Document preview (PDF) | P1 | 6h | Frontend | Upload |
| Document deletion | P1 | 2h | Full-stack | Document list |

**Deliverables:**
- [ ] Upload documents to vendors
- [ ] View uploaded documents
- [ ] Basic document categorization

### Week 4: Dashboard & Polish

| Task | Priority | Estimate | Owner | Dependencies |
|------|----------|----------|-------|--------------|
| Dashboard home page | P0 | 8h | Frontend | Data available |
| Vendor status widgets | P0 | 4h | Frontend | Dashboard |
| Recent activity feed | P1 | 4h | Full-stack | Audit logging |
| User settings page | P1 | 4h | Full-stack | Auth |
| Organization settings | P1 | 4h | Full-stack | Org model |
| Error handling & toasts | P0 | 4h | Frontend | Components |
| Loading states | P0 | 3h | Frontend | Components |
| Mobile responsiveness | P1 | 4h | Frontend | All pages |

**Deliverables:**
- [ ] Functional dashboard
- [ ] Polished UI/UX
- [ ] Ready for internal testing

### Phase 1 Exit Criteria

- [ ] All P0 tasks complete
- [ ] No critical bugs
- [ ] Internal team can use for real work
- [ ] Performance acceptable (<2s page loads)

---

## Phase 2: AI Parsing (Weeks 5-8)

### Objective
Implement AI-powered document parsing with high accuracy and confidence scoring.

### Week 5: Parsing Infrastructure

| Task | Priority | Estimate | Owner | Dependencies |
|------|----------|----------|-------|--------------|
| Anthropic Claude API integration | P0 | 6h | Backend | API key |
| PDF text extraction pipeline | P0 | 8h | Backend | None |
| Parsing job queue system | P0 | 8h | Backend | None |
| Background worker for parsing | P0 | 6h | Backend | Queue |
| Parsing status tracking | P0 | 4h | Full-stack | Queue |
| Error handling for parse failures | P0 | 4h | Backend | Parser |

**Deliverables:**
- [ ] Documents enter parsing queue
- [ ] Background processing works
- [ ] Status visible to users

### Week 6: SOC 2 Parsing

| Task | Priority | Estimate | Owner | Dependencies |
|------|----------|----------|-------|--------------|
| SOC 2 prompt engineering | P0 | 12h | AI/Backend | Claude API |
| Control extraction logic | P0 | 8h | Backend | Prompts |
| Exception extraction | P0 | 6h | Backend | Prompts |
| Subservice org detection | P0 | 4h | Backend | Prompts |
| CUEC extraction | P0 | 4h | Backend | Prompts |
| Confidence scoring algorithm | P0 | 6h | Backend | Extraction |
| Parsed data storage | P0 | 4h | Backend | Schema |

**Deliverables:**
- [ ] SOC 2 reports parsed end-to-end
- [ ] Confidence scores for all fields
- [ ] Structured data stored

### Week 7: Results Display & Review

| Task | Priority | Estimate | Owner | Dependencies |
|------|----------|----------|-------|--------------|
| Parsed results display page | P0 | 8h | Frontend | Parsed data |
| Control list visualization | P0 | 6h | Frontend | Results page |
| Exception highlighting | P0 | 4h | Frontend | Results page |
| Low-confidence flag UI | P0 | 4h | Frontend | Confidence scores |
| Manual correction interface | P0 | 8h | Full-stack | Results page |
| Approve/reject workflow | P0 | 6h | Full-stack | Corrections |
| Re-parse functionality | P1 | 4h | Full-stack | Parser |

**Deliverables:**
- [ ] Users see parsed results
- [ ] Low-confidence items flagged
- [ ] Manual corrections possible

### Week 8: DORA Mapping + ISO 27001 + Incident Foundation

| Task | Priority | Estimate | Owner | Dependencies |
|------|----------|----------|-------|--------------|
| DORA control mapping logic | P0 | 8h | Backend | Parsed data |
| SOC 2 to DORA crosswalk | P0 | 6h | Backend | Mapping logic |
| **ISO 27001 parsing pipeline** | P0 | 8h | Backend | Claude API |
| **ISO cert + SoA extraction** | P0 | 6h | Backend | ISO pipeline |
| Gap analysis calculation | P0 | 6h | Backend | Crosswalk |
| Mapping visualization | P0 | 6h | Frontend | Mapping data |
| **ISO to DORA mapping** | P1 | 4h | Backend | ISO parsing |
| Gap recommendations | P1 | 6h | Backend | Gap analysis |
| **Incident DB schema** | P0 | 4h | Backend | None |
| **Incident classification algorithm** | P0 | 6h | Backend | Schema |
| **Cross-framework mapping tables** | P0 | 4h | Backend | Schema |
| Beta launch preparation | P0 | 4h | All | Everything |

**Deliverables:**
- [ ] SOC 2 controls mapped to DORA
- [ ] **ISO 27001 certificates parsed and mapped**
- [ ] Gap analysis visible
- [ ] **Incident reporting foundation ready**
- [ ] **Cross-framework mapping database populated**
- [ ] Beta ready for 10 customers

### Phase 2 Exit Criteria

- [ ] SOC 2 parsing >90% accuracy
- [ ] Parsing completes in <60 seconds
- [ ] DORA mapping functional
- [ ] 10 beta customers onboarded

---

## Phase 3: RoI Engine (Weeks 9-12)

### Objective
Build ESA-compliant Register of Information generation with validation.

### Week 9: RoI Data Model

| Task | Priority | Estimate | Owner | Dependencies |
|------|----------|----------|-------|--------------|
| ESA template analysis | P0 | 8h | Compliance | ESA docs |
| RoI entry data model | P0 | 6h | Backend | Analysis |
| Auto-population from parsed docs | P0 | 8h | Backend | Parsing, model |
| Manual RoI entry form | P0 | 8h | Full-stack | Model |
| RoI entry CRUD | P0 | 6h | Full-stack | Model |
| Contract data integration | P1 | 6h | Backend | Vendor data |

**Deliverables:**
- [ ] RoI entries created from parsed docs
- [ ] Manual entry possible
- [ ] All ESA fields supported

### Week 10: Validation Engine

| Task | Priority | Estimate | Owner | Dependencies |
|------|----------|----------|-------|--------------|
| Validation rules engine | P0 | 10h | Backend | RoI model |
| Required field validation | P0 | 4h | Backend | Rules engine |
| Format validation (LEI, dates) | P0 | 4h | Backend | Rules engine |
| Business logic validation | P0 | 6h | Backend | Rules engine |
| Cross-field validation | P0 | 4h | Backend | Rules engine |
| Validation results UI | P0 | 8h | Frontend | Validation |
| Error remediation workflow | P0 | 6h | Full-stack | Results UI |

**Deliverables:**
- [ ] All RoI entries validated
- [ ] Clear error messages
- [ ] Guided remediation

### Week 11: Export Generation (Enhanced - 15 Templates)

| Task | Priority | Estimate | Owner | Dependencies |
|------|----------|----------|-------|--------------|
| xBRL-CSV export engine | P0 | 12h | Backend | ESA format |
| Template B_01.01-03 (Entity) | P0 | 6h | Backend | Export logic |
| Template B_02.01-03 (Providers) | P0 | 6h | Backend | Export logic |
| Template B_03.01-03 (Contracts) | P0 | 6h | Backend | Export logic |
| Template B_04.01-02 (Services) | P0 | 4h | Backend | Export logic |
| Template B_05.01-02 (Functions) | P0 | 4h | Backend | Export logic |
| Template B_06.01 (Subcontracting) | P0 | 4h | Backend | Export logic |
| Template B_07.01 (Intra-group) | P0 | 2h | Backend | Export logic |
| **Cross-template validation** | P0 | 6h | Backend | All templates |
| Export download functionality | P0 | 4h | Full-stack | Generation |
| Export history tracking | P1 | 4h | Full-stack | Export |

**Deliverables:**
- [ ] ESA-compliant xBRL-CSV exports
- [ ] **All 15 required templates generated**
- [ ] **Cross-template validation passing**
- [ ] Export history maintained

### Week 12: RoI Dashboard + Incident Reporting Completion

| Task | Priority | Estimate | Owner | Dependencies |
|------|----------|----------|-------|--------------|
| RoI completeness dashboard | P0 | 8h | Frontend | RoI data |
| Data quality score | P0 | 4h | Full-stack | Validation |
| Missing data highlighting | P0 | 4h | Frontend | Validation |
| **Incident report generation (init/int/final)** | P0 | 8h | Backend | Incident schema |
| **Incident deadline tracking & notifications** | P0 | 6h | Full-stack | Reports |
| **Incident dashboard integration** | P0 | 4h | Frontend | Reports |
| Deadline countdown | P1 | 2h | Frontend | None |
| Email notifications (export ready) | P1 | 4h | Backend | Export |
| Public launch preparation | P0 | 8h | All | Everything |
| Documentation and help | P1 | 6h | Product | All features |

**Deliverables:**
- [ ] Complete RoI workflow
- [ ] **Complete Incident Reporting workflow (4h/72h/1mo)**
- [ ] **Incident classification algorithm live**
- [ ] Public launch ready
- [ ] User documentation

### Phase 3 Exit Criteria

- [ ] RoI exports pass ESA format validation
- [ ] **All 15 ESA templates generating correctly**
- [ ] All validation rules implemented
- [ ] **Incident Reporting workflow complete (classification, reports, deadlines)**
- [ ] Public beta with self-serve signup
- [ ] <5 P1 bugs outstanding

---

## Phase 4: Scale & Optimize (Weeks 13-16)

### Objective
Add risk analytics, optimize performance, and prepare for general availability.

### Week 13: Risk Scoring

| Task | Priority | Estimate | Owner | Dependencies |
|------|----------|----------|-------|--------------|
| Risk scoring algorithm | P0 | 10h | Backend | Parsed data |
| Score breakdown by domain | P0 | 6h | Backend | Algorithm |
| Historical score tracking | P0 | 4h | Backend | Algorithm |
| Risk score display | P0 | 6h | Frontend | Scores |
| Vendor risk dashboard | P0 | 8h | Frontend | Scores |
| Risk trend charts | P1 | 6h | Frontend | History |

**Deliverables:**
- [ ] All vendors have risk scores
- [ ] Score methodology transparent
- [ ] Trend tracking works

### Week 14: Enhanced 4th Party Module + Concentration

| Task | Priority | Estimate | Owner | Dependencies |
|------|----------|----------|-------|--------------|
| **Subcontractors DB schema** | P0 | 4h | Backend | Schema |
| **SOC 2 subservice org extraction (AI)** | P0 | 8h | Backend | Parsing |
| **Supply chain graph visualization** | P0 | 10h | Frontend | Extraction |
| Concentration risk calculation | P0 | 8h | Backend | Vendor data |
| Geographic concentration | P0 | 4h | Backend | Calculation |
| Service concentration | P0 | 4h | Backend | Calculation |
| Concentration visualization | P0 | 6h | Frontend | Calculation |
| **Nth-party tier tracking** | P1 | 4h | Backend | Subcontractors |
| **Contract Analysis AI (basic)** | P1 | 8h | Backend | AI pipeline |

**Deliverables:**
- [ ] Concentration risks visible
- [ ] **4th parties auto-detected from SOC 2 reports**
- [ ] **Supply chain graph (React Flow)**
- [ ] **Subcontracting chain visible in RoI (B_06.01)**
- [ ] Contract DORA provision extraction (MVP)

### Week 15: Performance & Monitoring

| Task | Priority | Estimate | Owner | Dependencies |
|------|----------|----------|-------|--------------|
| Performance audit | P0 | 8h | Backend | All features |
| Database query optimization | P0 | 8h | Backend | Audit |
| Caching implementation | P0 | 6h | Backend | Audit |
| Load testing | P0 | 6h | Backend | Optimization |
| Monitoring dashboards | P0 | 6h | DevOps | Infrastructure |
| Alerting setup | P0 | 4h | DevOps | Monitoring |
| Error tracking (Sentry) | P1 | 4h | DevOps | None |

**Deliverables:**
- [ ] <2s page loads under load
- [ ] Monitoring in place
- [ ] Alerts configured

### Week 16: GA Preparation

| Task | Priority | Estimate | Owner | Dependencies |
|------|----------|----------|-------|--------------|
| Security review | P0 | 8h | Security | All features |
| Penetration testing | P0 | 16h | External | Security review |
| Bug fixes from testing | P0 | 16h | All | Pen test |
| GA launch checklist | P0 | 4h | All | All |
| Marketing materials | P1 | 8h | Marketing | Product ready |
| Customer success onboarding | P1 | 6h | Success | Product ready |
| Status page setup | P1 | 4h | DevOps | Infrastructure |

**Deliverables:**
- [ ] Security audit passed
- [ ] All P0 bugs fixed
- [ ] General availability launch

### Phase 4 Exit Criteria

- [ ] 99.9% uptime achieved
- [ ] Security pen test passed
- [ ] **4th party detection from SOC 2 at >90% accuracy**
- [ ] **Supply chain visualization functional**
- [ ] **Contract analysis AI extracting DORA provisions**
- [ ] Support team trained
- [ ] Marketing launch executed

---

## Post-GA Roadmap (Q2 2025+)

### Month 5-6: Enhanced Assessment & Contract AI (Phase 5)

| Feature | Priority | Description |
|---------|----------|-------------|
| **Contract Analysis AI (full)** | P0 | Complete DORA Art. 30 provision analysis |
| **Contract amendment generator** | P1 | AI-generated clause language for gaps |
| **Smart questionnaire** | P0 | AI-reduced questionnaire for non-SOC 2 vendors |
| **Public data scraping** | P0 | Pre-fill from website, LinkedIn, Crunchbase |
| **Vendor portal** | P1 | Self-serve document upload and questionnaire response |
| Pen test parsing | P1 | Extend AI parsing to penetration test reports |
| Tiered assessment logic | P1 | Different requirements by vendor criticality |
| Continuous monitoring | P1 | Security rating integrations |
| API access | P1 | Customer API for integrations |
| SSO (SAML) | P1 | Enterprise authentication |

### Month 7-9: DORA Trust Exchange (Phase 6)

| Feature | Priority | Description |
|---------|----------|-------------|
| **Trust Exchange foundation** | P1 | Anonymized assessment sharing infrastructure |
| **Community validation** | P1 | 3+ contributor verification for assessments |
| **Reputation system** | P1 | Points and tiers for contributors |
| Benchmarking | P2 | Compare vendor coverage against peers |
| Threat intelligence | P2 | Shared threat data from incidents |
| Privacy-preserving analytics | P2 | Insights without exposing org data |

### Month 10-12: Platform Expansion (Phase 7)

| Feature | Priority | Description |
|---------|----------|-------------|
| NIS2 compliance module | P1 | Adjacent EU regulation (network & information systems) |
| **Enhanced framework mapping** | P1 | NIST CSF 2.0, CIS Controls, PCI-DSS crosswalks |
| **Regulatory change tracking** | P1 | Auto-detect ESA/EBA updates and impact |
| Predictive risk | P2 | ML-based risk forecasting from historical data |
| **API integrations (GRC)** | P1 | ServiceNow, Archer, OneTrust connectors |

---

## Resource Requirements

### Team Composition

| Role | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|------|---------|---------|---------|---------|
| Full-stack Developer | 2 | 2 | 2 | 2 |
| Backend/AI Developer | 1 | 2 | 2 | 1 |
| Frontend Developer | 1 | 1 | 1 | 1 |
| DevOps | 0.5 | 0.5 | 0.5 | 1 |
| Product Manager | 0.5 | 0.5 | 0.5 | 0.5 |
| QA | 0 | 0.5 | 1 | 1 |

### Key Milestones

| Milestone | Date | Success Criteria |
|-----------|------|------------------|
| Phase 1 Complete | Week 4 | Internal team using product |
| Beta Launch | Week 8 | 10 beta customers onboarded |
| Public Launch | Week 12 | Self-serve signup, <10 P1 bugs |
| General Availability | Week 16 | 50+ customers, 99.9% uptime |
| **RoI Deadline** | April 30 | Customers successfully submitted RoI |

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation | Owner |
|------|-------------|--------|------------|-------|
| AI parsing accuracy <90% | Medium | High | More training data, hybrid AI+human review | AI Lead |
| ESA template format changes | Low | High | Weekly monitoring of ESA updates | Product |
| Team capacity constraints | Medium | Medium | Prioritize P0 ruthlessly, contractor backup | PM |
| Customer adoption slow | Medium | Medium | Free tier, urgency marketing | Marketing |
| Security vulnerability | Low | Critical | Security review, pen test, bug bounty | Security |

---

## Success Metrics by Phase

| Phase | North Star Metric | Supporting Metrics |
|-------|-------------------|-------------------|
| 1 | Internal users active | Vendors created, documents uploaded |
| 2 | Parsing accuracy >90% | Parse time <60s, review queue <10% |
| 3 | RoI exports generated | Validation pass rate, export downloads |
| 4 | Paying customers | ARR, NPS, uptime |

---

## Appendix: Sprint Planning Template

Each week should have a sprint planning session using this template:

```markdown
# Sprint [X] Planning

## Sprint Goal
[One sentence describing sprint objective]

## Capacity
- Developer 1: X hours
- Developer 2: X hours
- Total: X hours

## Committed Stories
| Story | Points | Assignee | Dependencies |
|-------|--------|----------|--------------|
| | | | |

## Risks
- Risk 1: [Description] - Mitigation: [Action]

## Definition of Done
- [ ] Code complete and reviewed
- [ ] Tests passing (unit + integration)
- [ ] Documentation updated
- [ ] Deployed to staging
- [ ] Product owner accepted
```

---

**Last Updated:** 2024-12-28
**Next Review:** Weekly during development
