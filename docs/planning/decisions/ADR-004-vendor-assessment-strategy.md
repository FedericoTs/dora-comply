# ADR-004: Vendor Assessment Strategy (Non-SOC 2 Fallback)

## Metadata

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Date** | 2024-12-28 |
| **Author** | Product Team |
| **Deciders** | Founder |

---

## Context

~40-60% of vendors don't have SOC 2 reports. We needed to decide how to handle vendor assessments when our primary AI parsing target (SOC 2) isn't available, while maintaining our "no questionnaires" differentiation.

## Decision

**Phased approach: Document-first with tiered fallback**

### Phase 1 (MVP - Weeks 1-12)
1. SOC 2 Type I/II parsing (primary)
2. ISO 27001 certificate + SoA parsing (secondary)
3. Manual entry for vendors with neither (temporary)

### Phase 2 (Post-launch - Weeks 13-20)
4. Tiered assessment requirements by vendor criticality
5. Smart questionnaire (AI-reduced) for standard-tier vendors
6. Additional document types (pen tests, privacy docs)

## Rationale

1. **Speed to market**: SOC 2 + ISO covers ~60-70% of critical vendors
2. **Maintain differentiation**: Still "no questionnaires" for majority
3. **Learn first**: Beta feedback informs Phase 2 design
4. **Risk-proportional**: Critical vendors need hard evidence anyway
5. **Defensible to regulators**: Risk-based approach is DORA-aligned

---

## Phase 1: Feasibility Analysis

### SOC 2 Parsing (Already Planned)

| Aspect | Assessment |
|--------|------------|
| Technical complexity | High but proven - LLMs excel at structured extraction |
| Accuracy target | >90% with confidence scoring |
| Time to build | 4 weeks (Weeks 5-8 in roadmap) |
| Risk | Medium - document variety requires robust prompts |

### ISO 27001 Parsing (Addition)

| Aspect | Assessment |
|--------|------------|
| Technical complexity | **Lower than SOC 2** - certificates are standardized |
| What to extract | Cert body, scope, expiry, locations, SoA controls |
| Time to build | **1.5-2 weeks** (simpler structure) |
| DORA value | High - proves security management system exists |

**ISO 27001 Parsing Scope:**

```typescript
interface ParsedISO27001 {
  // Certificate metadata (simple extraction)
  certificateNumber: string;
  certificationBody: string;        // e.g., "BSI", "TÜV"
  accreditationBody: string;        // e.g., "UKAS", "DAkkS"
  issueDate: Date;
  expiryDate: Date;

  // Scope (text extraction)
  scope: string;
  locations: string[];

  // Statement of Applicability (if provided)
  soaControls?: {
    controlId: string;              // e.g., "A.5.1"
    applicable: boolean;
    justification?: string;
  }[];

  // DORA mapping
  doraRelevance: {
    pillar1_ictRisk: 'full' | 'partial' | 'none';
    pillar2_incident: 'full' | 'partial' | 'none';
    pillar3_testing: 'full' | 'partial' | 'none';
  };
}
```

**Why ISO 27001 is easier:**
- Certificates follow standard format (1-2 pages)
- Limited fields to extract
- SoA is tabular (structured)
- Less narrative text than SOC 2

### Manual Entry (Temporary Fallback)

Already in roadmap - vendor form with all RoI fields. No additional work.

---

## Phase 1 Timeline Impact

| Original Week | Task | Adjustment |
|---------------|------|------------|
| Week 5-6 | SOC 2 parsing | No change |
| Week 7 | Results display | No change |
| **Week 8** | DORA mapping | **Add: ISO 27001 parsing (parallel track)** |
| Week 9-10 | RoI data model | Include ISO source flag |

**Net impact:** +1 week of parallel work, no critical path delay.

---

## Phase 2: Tiered Assessment Model

### Vendor Tiers & Requirements

| Tier | Criteria | Required Evidence | Fallback |
|------|----------|-------------------|----------|
| **Critical** | Supports critical function, >10% revenue, irreplaceable | SOC 2 Type II **required** | Escalate to CISO; no auto-approval |
| **Important** | Material business impact, 3-6mo to replace | SOC 2 OR (ISO 27001 + Pen Test) | Smart questionnaire (25 questions) |
| **Standard** | Limited impact, easily replaceable | Any document OR smart questionnaire | Minimal questionnaire (10 questions) |

### Smart Questionnaire Design

**Principles:**
1. AI pre-fills from public sources (website, LinkedIn, news)
2. Only ask what we can't infer
3. Target: <10 minutes vendor time
4. Binary/multiple choice where possible (faster than free text)

**Pre-fill sources:**
```typescript
interface PublicDataSources {
  website: {
    securityPage: string;           // /security, /trust
    privacyPolicy: string;
    subprocessorList: string;       // Often public for GDPR
  };

  apis: {
    crunchbase: CompanyInfo;        // Funding, size, HQ
    linkedin: CompanyProfile;       // Employee count, locations
    dnb: FinancialData;            // D&B for financial health
  };

  securityRatings?: {
    securityScorecard?: number;     // If integrated
    bitSight?: number;
  };
}
```

**Question reduction example:**

| Traditional Question | Smart Approach |
|---------------------|----------------|
| "Where is your HQ located?" | Pre-filled from LinkedIn/Crunchbase |
| "Do you use cloud infrastructure?" | Inferred from tech stack (BuiltWith) |
| "Do you have a security team?" | Inferred from LinkedIn job titles |
| "What's your employee count?" | Pre-filled from LinkedIn |
| "Do you process EU data?" | **Ask - can't infer reliably** |

**Result:** 100-question traditional → 15-25 questions actually asked

---

## Competitive Edge Analysis

### Current Market Positioning

```
                    HIGH DORA FOCUS
                          │
           Vendorica      │
           3rdRisk        │      ★ OUR POSITION
           doraregister   │      (DORA + AI + No Questionnaires)
                          │
LOW AI ───────────────────┼─────────────────── HIGH AI
                          │
           OneTrust       │      Vanta
           ProcessUnity   │      Scytale
                          │      (US-focused, questionnaire-based)
                          │
                    LOW DORA FOCUS
```

### Competitor Comparison: Assessment Approach

| Competitor | SOC 2 Parsing | ISO Parsing | Questionnaires | Our Edge |
|------------|---------------|-------------|----------------|----------|
| **OneTrust** | Manual review | Manual | Yes, heavy | AI-native extraction |
| **Vanta** | AI-assisted (basic) | No | Yes, AI-autofill | Deeper extraction, DORA mapping |
| **3rdRisk** | Limited | Limited | Yes | Full AI parsing, no questionnaires |
| **BitSight** | "Instant Insights" (new) | No | Optional | We do DORA mapping, they don't |
| **SecurityScorecard** | No | No | Yes | We parse evidence, they rate externally |
| **ProcessUnity** | Manual | Manual | Yes, extensive | 10X faster assessment |

### Differentiation Messaging

**Tagline options:**
- "From document to compliant in 60 seconds"
- "The questionnaire is dead. Long live AI."
- "Your vendors already did the audit. We just read it."

**Key claims we can make:**

| Claim | Proof Point |
|-------|-------------|
| "90% less vendor friction" | SOC 2/ISO parsing = no questionnaire for those vendors |
| "60-second assessments" | AI parsing benchmark vs 60-day industry average |
| "No questionnaire fatigue" | For 60-70% of critical vendors (those with SOC 2/ISO) |
| "DORA-native intelligence" | Auto-mapping to DORA articles, gap detection |
| "Risk-based, regulator-approved" | Tiered approach aligns with DORA proportionality |

### Why Competitors Can't Easily Copy

| Moat Element | Details |
|--------------|---------|
| **Prompt engineering** | Months of iteration on SOC 2/ISO extraction prompts |
| **DORA mapping logic** | Deep regulatory expertise embedded in product |
| **Confidence scoring** | Proprietary accuracy measurement |
| **EU-first architecture** | Competitors would need to rebuild infrastructure |
| **Document corpus** | Training data from customer uploads improves accuracy |

---

## Customer Experience Flow

### Vendor with SOC 2

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Upload SOC 2 PDF                                            │
│     ↓                                                           │
│  2. "Processing..." (45 seconds)                                │
│     ↓                                                           │
│  3. See extracted data with confidence scores                   │
│     - Opinion: Unqualified ✓ (98% confidence)                   │
│     - Controls: 47 extracted (94% avg confidence)               │
│     - Exceptions: 2 found                                       │
│     - Subservice orgs: 3 detected                               │
│     ↓                                                           │
│  4. Review low-confidence items (if any)                        │
│     ↓                                                           │
│  5. See DORA mapping                                            │
│     - Pillar 1 coverage: 85%                                    │
│     - Pillar 2 coverage: 70%                                    │
│     - Gaps: [list with recommendations]                         │
│     ↓                                                           │
│  6. RoI entries auto-populated                                  │
│     ↓                                                           │
│  7. Done. Vendor assessed. No questionnaire sent.               │
└─────────────────────────────────────────────────────────────────┘

Total time: ~2 minutes
Vendor involvement: Zero
```

### Vendor with ISO 27001 Only

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Upload ISO 27001 certificate + SoA                          │
│     ↓                                                           │
│  2. "Processing..." (20 seconds)                                │
│     ↓                                                           │
│  3. See extracted data                                          │
│     - Cert valid until: 2026-03-15 ✓                            │
│     - Scope: "Cloud hosting services..."                        │
│     - SoA controls: 93/114 applicable                           │
│     ↓                                                           │
│  4. See DORA mapping                                            │
│     - Coverage: Partial (ISO doesn't cover all DORA)            │
│     - Recommendation: "Request pen test for Pillar 3"           │
│     ↓                                                           │
│  5. RoI entries populated (with gaps flagged)                   │
│     ↓                                                           │
│  6. Optional: Upload pen test to fill gaps                      │
│     ↓                                                           │
│  7. Done. No questionnaire.                                     │
└─────────────────────────────────────────────────────────────────┘

Total time: ~3 minutes
Vendor involvement: Zero
```

### Vendor with Neither (Phase 1 - Manual)

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Create vendor record                                        │
│     ↓                                                           │
│  2. System prompts: "No SOC 2 or ISO found"                     │
│     ↓                                                           │
│  3. Options shown:                                              │
│     a) "Request SOC 2 from vendor" → generates email template   │
│     b) "Upload other document" → pen test, security policy      │
│     c) "Enter RoI data manually" → form with all fields         │
│     ↓                                                           │
│  4. If (c): Manual form completion                              │
│     - Guided workflow                                           │
│     - Field-level help text                                     │
│     - Validation as you go                                      │
│     ↓                                                           │
│  5. Flag vendor for Phase 2 smart questionnaire                 │
└─────────────────────────────────────────────────────────────────┘

Total time: ~15-30 minutes (manual)
Note: "Coming soon: AI-assisted assessment"
```

### Vendor with Neither (Phase 2 - Smart Questionnaire)

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Create vendor record, enter domain                          │
│     ↓                                                           │
│  2. AI scrapes public data (5 seconds)                          │
│     - Website security page                                     │
│     - LinkedIn company info                                     │
│     - Crunchbase data                                           │
│     ↓                                                           │
│  3. Pre-filled assessment shown                                 │
│     "We found the following about Acme Corp:"                   │
│     - HQ: San Francisco, CA ✓                                   │
│     - Employees: ~150 ✓                                         │
│     - Cloud: AWS (inferred from job posts) ?                    │
│     - SOC 2: Not found ✗                                        │
│     ↓                                                           │
│  4. "15 questions need your input"                              │
│     - Do they process EU personal data?                         │
│     - What's the contract value?                                │
│     - etc.                                                      │
│     ↓                                                           │
│  5. Option: "Send to vendor for confirmation"                   │
│     - Vendor receives link                                      │
│     - Reviews pre-filled, answers remaining                     │
│     - 10-minute experience                                      │
│     ↓                                                           │
│  6. RoI entries populated from responses                        │
└─────────────────────────────────────────────────────────────────┘

Total time: ~10 minutes (vendor)
Improvement: 85% faster than traditional questionnaire
```

---

## Success Metrics

### Phase 1 Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| SOC 2 parsing accuracy | >90% | Manual review sample |
| ISO 27001 parsing accuracy | >95% | Manual review sample |
| % vendors with SOC 2/ISO | Track actual | Customer data |
| Time to assess (with docs) | <2 minutes | Automated timing |
| Customer satisfaction (doc flow) | NPS >40 | Survey |

### Phase 2 Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| Smart questionnaire completion rate | >80% | Funnel analytics |
| Vendor response time | <24 hours | Automated timing |
| Questions actually asked (vs traditional) | <25% | Comparison |
| Customer satisfaction (smart Q) | NPS >30 | Survey |

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| ISO parsing lower priority | Medium | Low | Parallel track, doesn't block SOC 2 |
| Manual entry frustrates users | Medium | Medium | Clear "coming soon" messaging, prioritize docs |
| Smart questionnaire inaccurate | Medium | Medium | Human review, confidence scoring |
| Vendors still complain | Low | Low | Still faster than competitors |

---

## Implementation Checklist

### Phase 1 (MVP)

- [ ] SOC 2 parsing (Weeks 5-8) - already planned
- [ ] ISO 27001 parsing (Week 8) - add to sprint
- [ ] Manual entry form (Week 3) - already planned
- [ ] "Request document from vendor" email template
- [ ] Document type detection (auto-classify uploads)

### Phase 2 (Post-launch)

- [ ] Public data scraping infrastructure
- [ ] Smart questionnaire builder
- [ ] Vendor portal for responses
- [ ] Tiered assessment logic
- [ ] Pen test parsing
- [ ] Privacy policy parsing

---

**Decision Date:** 2024-12-28
**Review Date:** Week 12 (based on beta feedback)
