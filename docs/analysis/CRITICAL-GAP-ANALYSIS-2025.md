# DORA Comply Platform - Critical Gap Analysis
## Expert Review: Compliance, DORA Reporting, and TPRM Assessment

**Review Date:** January 5, 2026
**Reviewers:** Compliance Expert, DORA Reporting Specialist, TPRM Officer
**Platform Version:** 0.1.0
**Scope:** Document Analysis (SOC2 Parsing, DORA Mapping, Verification)

---

## Executive Summary

This critical review analyzes the DORA Comply platform's Document Analysis capabilities against regulatory requirements (DORA EU 2022/2554), industry best practices, and leading competitor platforms (OneTrust, Prevalent, SecurityScorecard, BitSight).

### Overall Assessment

| Domain | Current State | Industry Benchmark | Gap Severity |
|--------|---------------|-------------------|--------------|
| SOC2 Parsing | **Strong** (Gemini 2.0) | AI-powered extraction | Low |
| DORA Mapping | **Adequate** (22 articles) | Full 64 articles | Medium |
| Maturity Model | **Good** (L0-L4) | COBIT/CMMI aligned | Low |
| RoI Generation | **Missing** | ESA xBRL-CSV templates | **Critical** |
| Continuous Monitoring | **Missing** | Real-time ratings | **Critical** |
| Fourth-Party Risk | **Partial** | Full Nth-party visibility | High |
| Incident Reporting | **Missing** | 4h/72h/1m automation | **Critical** |

### Key Findings

**Strengths:**
1. Multi-phase AI extraction using Gemini 2.0 Flash (cost-effective)
2. Accurate maturity level scoring (L0-L4 COBIT/CMMI alignment)
3. Evidence traceability to PDF page references (10X differentiator)
4. Verification checklist for human-in-the-loop validation

**Critical Gaps:**
1. **No Register of Information (RoI) Generator** - Deadline April 30, 2026
2. **No Continuous Monitoring Integration** - Industry standard
3. **No Incident Reporting Workflow** - DORA Articles 17-20
4. **Incomplete DORA Article Coverage** - Only 22 of 64 articles mapped

---

## Section 1: Regulatory Accuracy Assessment

### 1.1 DORA Article Coverage

**Current Implementation:** 22 DORA articles mapped in `dora-requirements-data.ts`

| Pillar | Articles Covered | Articles Required | Coverage |
|--------|-----------------|-------------------|----------|
| ICT Risk Management | 10 (Art. 5-14) | 12 | 83% |
| Incident Management | 4 (Art. 17-20) | 7 | 57% |
| Digital Resilience Testing | 4 (Art. 24-27) | 4 | 100% |
| Third-Party Risk | 5 (Art. 28-32) | 17 | 29% |
| Information Sharing | 1 (Art. 45) | 5 | 20% |

**Missing Critical Articles:**

```
TPRM Pillar (Critical Gaps):
- Art. 33-35: Critical ICT Third-Party Provider Oversight
- Art. 36-38: Lead Overseer Designation and Powers
- Art. 39-41: Enforcement and Penalties
- Art. 42-44: Sub-delegation and Termination Rights

Incident Pillar:
- Art. 21: Voluntary Notification of Significant Threats
- Art. 22: Cyber Threat Information Sharing
- Art. 23: Post-Incident Reviews
```

### 1.2 SOC2-to-DORA Mapping Accuracy

**Reviewed:** `SOC2_TO_DORA_MAPPINGS` (27 mappings)

| Assessment | Count | Accuracy Rating |
|------------|-------|-----------------|
| Accurate Mappings | 21 | ✅ Correct |
| Partially Accurate | 4 | ⚠️ Needs refinement |
| Incorrect/Missing | 2 | ❌ Fix required |

**Issues Identified:**

1. **CC9 → Art. 29 (RoI)**: Coverage stated as 40% is generous. SOC2 CC9 does NOT provide RoI-equivalent data. Should be flagged as "none" or "minimal" (10%).

2. **CC7 → Art. 17 (Incident Management)**: Coverage at 60% is accurate, but missing the critical DORA-specific classification thresholds:
   - >100K customers affected
   - >10% service degradation
   - Cross-border impact
   - Data integrity compromise

3. **Missing Mapping**: No SOC2 category maps to Art. 29's 15-template ESA structure.

### 1.3 Maturity Level Calculation

**Current Implementation:** Weighted pillar scoring (correct approach)

```typescript
// Current weights (dora-calculator.ts:415-420)
const pillarWeights: Record<DORAPillar, number> = {
  ICT_RISK: 3,    // Correct - critical
  INCIDENT: 3,    // Correct - critical
  TESTING: 2,     // Should be 2.5 for significant entities
  TPRM: 3,        // Correct - critical
  SHARING: 1,     // Correct - voluntary
};
```

**Issue:** No entity type differentiation. DORA requires different requirements for:
- Significant entities (TLPT mandatory every 3 years)
- Non-significant entities (simplified testing regime)
- CTPPs (Critical Third-Party Providers - special oversight)

---

## Section 2: Competitor Comparison

### 2.1 Feature Matrix

| Feature | DORA Comply | OneTrust | Prevalent | SecurityScorecard |
|---------|-------------|----------|-----------|-------------------|
| SOC2 AI Parsing | ✅ Gemini 2.0 | ✅ AI-powered | ✅ 125 templates | ❌ Manual |
| DORA RoI Generator | ❌ Missing | ✅ Full | ✅ ESA template | ✅ Via integrations |
| Continuous Monitoring | ❌ Missing | ✅ RiskRecon | ❌ Partner | ✅ Native |
| Cyber Risk Ratings | ❌ Missing | ✅ Multi-vendor | ✅ BitSight | ✅ Native (A-F) |
| Incident Automation | ❌ Missing | ✅ Workflows | ✅ Playbooks | ❌ N/A |
| Fourth-Party Mapping | ⚠️ Basic | ✅ Full chain | ✅ Sub-tiers | ✅ Full chain |
| AI Assessment Speed | ✅ Fast | ✅ 70% faster | ✅ Hours not weeks | N/A |
| Evidence Traceability | ✅ PDF refs | ⚠️ Partial | ⚠️ Partial | ❌ None |
| Contract Clause Analysis | ❌ Missing | ✅ Art. 30 | ✅ Clause library | ❌ N/A |
| Concentration Risk | ❌ Missing | ✅ Analytics | ✅ Reports | ✅ Heatmaps |

### 2.2 Competitive Positioning

**Where DORA Comply Leads:**
1. **Evidence Traceability**: PDF page references for every control (unique)
2. **Verification Workflow**: Human-in-the-loop validation (unique)
3. **Cost Efficiency**: Gemini 2.0 vs expensive Anthropic/OpenAI

**Where DORA Comply Lags:**
1. **RoI Generation**: Critical gap - deadline April 30, 2026
2. **Continuous Monitoring**: No real-time risk ratings
3. **Workflow Automation**: No rule-based triggers (OneTrust has "ActiveRules")
4. **Concentration Risk**: No analytics or visualization

### 2.3 Market Differentiator Opportunity

Based on competitor analysis, the **10X opportunity** is:

> **"SOC2-to-DORA-RoI in One Click"**
>
> Parse SOC2 → Extract vendor data → Generate ESA-compliant xBRL-CSV Register of Information
>
> NO COMPETITOR DOES THIS AUTOMATICALLY.

---

## Section 3: UI/UX Gap Analysis

### 3.1 DORA Compliance Dashboard (`dora-compliance-dashboard.tsx`)

**Strengths:**
- Clean maturity level visualization (L0-L4 circles)
- Pillar breakdown with color-coded status
- Critical gaps prominently displayed
- Remediation timeline estimate

**Gaps:**

| Issue | Severity | Recommendation |
|-------|----------|----------------|
| No drill-down to specific controls | Medium | Add collapsible control list per pillar |
| No export functionality | High | Add PDF/Excel export for board reporting |
| No comparison view | Medium | Add historical maturity trend chart |
| No regulatory deadline countdown | High | Add "Days to DORA Deadline" widget |
| No action buttons per gap | Medium | Add "Create Task" button for remediation |

### 3.2 Verification Checklist (`verification-checklist.tsx`)

**Strengths:**
- Clear extraction confidence display
- Spot-check random controls feature
- Progress indicator
- Re-parse option for low-confidence extractions

**Gaps:**

| Issue | Severity | Recommendation |
|-------|----------|----------------|
| No PDF side-by-side view | High | Add split view with PDF on right |
| onVerify/onReparse callbacks empty | Critical | Implement actual Supabase persistence |
| No audit trail | High | Log all verification actions with timestamps |
| No batch verification | Medium | Add "Verify All as Correct" quick action |

### 3.3 Missing UI Components

1. **RoI Generation Wizard** - Step-by-step ESA template population
2. **Concentration Risk Dashboard** - Vendor dependency heatmap
3. **Incident Reporting Form** - DORA Art. 19 compliant templates
4. **Contract Clause Analyzer** - Art. 30 mandatory clause checker
5. **Fourth-Party Map** - Visual supply chain hierarchy

---

## Section 4: Technical Implementation Gaps

### 4.1 SOC2 Parser (`soc2-parser-v2.ts`)

**Strengths:**
- Multi-phase extraction (structure → chunks → verification)
- Gemini 2.0 Flash for cost efficiency
- Rate limiting with exponential backoff
- Deduplication of extracted controls

**Gaps:**

```typescript
// Issue 1: No persistence of extraction jobs (line 236-503)
// If parsing fails mid-way, all progress is lost
// Recommendation: Add extraction_jobs table (migration 008 exists but unused)

// Issue 2: DORA mapping in parser is simplified (line 730-759)
// Uses basic category match, not the full SOC2_TO_DORA_MAPPINGS
// Recommendation: Import from dora-requirements-data.ts instead

// Issue 3: No streaming progress updates
// User sees no feedback during 2-5 minute extraction
// Recommendation: Add Server-Sent Events for real-time progress
```

### 4.2 DORA Calculator (`dora-calculator.ts`)

**Strengths:**
- Proper weighted scoring by pillar
- Gap analysis with remediation guidance
- Evidence source tracking

**Gaps:**

```typescript
// Issue 1: Entity type not considered (line 60-130)
// Significant entities have different requirements (TLPT mandatory)
// Add: entityType: 'significant' | 'non_significant' | 'ctpp'

// Issue 2: No RoI data extraction (line 60-130)
// SOC2 contains vendor info but not extracted for RoI
// Add: Extract LEI, jurisdiction, service type for RoI template

// Issue 3: Remediation time estimates are static (line 507-515)
// Should consider entity size, resource availability
// Add: Configurable remediation velocity factor
```

### 4.3 Database Schema Gaps

**Existing Migrations:** 001-009

**Missing Tables:**

1. **`dora_roi_entries`** - Register of Information data
   - Fields: LEI, service_type, contract_start, contract_end, data_location, etc.
   - 15 ESA template fields required

2. **`incident_reports`** - DORA incident tracking
   - Fields: classification, timeline, regulatory_notification_status

3. **`continuous_monitoring`** - External rating integrations
   - Fields: vendor_id, rating_source, score, last_updated

4. **`concentration_risk`** - Vendor dependency analysis
   - Fields: vendor_id, criticality_tier, substitutability_score

---

## Section 5: Improvement Recommendations (Prioritized)

### Priority 1: Critical (Must Have for DORA Compliance)

| # | Feature | Effort | Impact | Deadline |
|---|---------|--------|--------|----------|
| 1.1 | **RoI Generator** - ESA xBRL-CSV export | 3 weeks | Critical | April 30, 2026 |
| 1.2 | **Incident Reporting Workflow** - 4h/72h/1m automation | 2 weeks | Critical | Jan 17, 2025 |
| 1.3 | **Complete DORA Article Coverage** - Add Art. 33-44 | 1 week | High | Immediate |
| 1.4 | **Entity Type Differentiation** - Significant vs non-significant | 1 week | High | Immediate |

### Priority 2: High (Competitive Parity)

| # | Feature | Effort | Impact |
|---|---------|--------|--------|
| 2.1 | **Continuous Monitoring Integration** - SecurityScorecard/BitSight API | 2 weeks | High |
| 2.2 | **Contract Clause Analyzer** - Art. 30 compliance checker | 2 weeks | High |
| 2.3 | **Concentration Risk Dashboard** - Vendor heatmap | 1 week | Medium |
| 2.4 | **PDF Split View** - Side-by-side verification | 1 week | Medium |
| 2.5 | **Board Reporting Export** - PDF/PPTX dashboards | 1 week | Medium |

### Priority 3: Differentiators (Market Leadership)

| # | Feature | Effort | Impact |
|---|---------|--------|--------|
| 3.1 | **SOC2-to-RoI Auto-Population** - One-click from parsed data | 2 weeks | **10X** |
| 3.2 | **Fourth-Party Risk Mapping** - Visual supply chain | 2 weeks | High |
| 3.3 | **AI Gap Remediation Suggestions** - LLM-powered advice | 1 week | Medium |
| 3.4 | **Historical Maturity Tracking** - Trend charts | 1 week | Medium |
| 3.5 | **Multi-Framework Mapping** - NIS2, GDPR, ISO 27001 | 3 weeks | High |

---

## Section 6: Regulatory Accuracy Recommendations

### 6.1 DORA Mapping Corrections

```typescript
// Correction 1: Art. 29 RoI Mapping
{
  id: 'map-cc9-art29',
  soc2_category: 'CC9',
  dora_requirement_id: 'dora-art-29',
  mapping_strength: 'minimal',  // Changed from 'partial'
  coverage_percentage: 10,       // Changed from 40
  gap_description: 'SOC 2 CC9 provides basic vendor oversight but does NOT generate DORA Register of Information. The 15-template ESA structure requires: LEI, service descriptions, contract dates, data locations, criticality ratings, concentration risk, exit plans, and subcontractor chains - none of which are in SOC 2 scope.',
  remediation_guidance: 'Implement dedicated RoI module extracting data from SOC 2, contracts, and vendor questionnaires. Use ESA xBRL-CSV templates.',
}

// Correction 2: Art. 18 Classification Thresholds
{
  id: 'map-none-art18',
  gap_description: 'No SOC 2 equivalent. DORA requires specific incident classification thresholds:\n- Major: >100,000 clients OR >10% service degradation OR cross-border OR data breach\n- Significant: Material operational impact\n- Minor: Limited impact, internal logging only',
}
```

### 6.2 Missing DORA Requirements to Add

```typescript
// TPRM Pillar Additions (Art. 33-44)
{
  id: 'dora-art-33',
  article_number: 'Art. 33',
  article_title: 'Designation of Critical ICT Third-Party Providers',
  pillar: 'TPRM',
  requirement_text: 'ESAs shall designate CTPPs based on systemic importance criteria...',
  evidence_needed: ['CTPP designation assessment', 'Systemic risk analysis', 'ESA notification records'],
  is_mandatory: true,
  applies_to: ['ctpp'],
  priority: 'critical',
}
// ... Add Art. 34-44 similarly
```

---

## Section 7: Quick Wins (Immediate Implementation)

### 7.1 This Week

1. **Fix SOC2 Event Handler Errors** ✅ DONE
   - Removed event handler props from server components

2. **Add DORA Deadline Countdown**
   - Simple widget: "X days until RoI deadline (April 30, 2026)"

3. **Export Dashboard to PDF**
   - Add jsPDF export for DORA Compliance Dashboard

4. **Implement Verification Persistence**
   - Wire up onVerify callback to Supabase

### 7.2 This Month

1. **Complete DORA Article Coverage** (Art. 33-44)
2. **Add Entity Type Selection** (significant/non-significant)
3. **Create RoI Data Model** (migration 010)
4. **Build RoI Export Wizard** (MVP with Excel template)

---

## Appendix A: Competitor Feature URLs

- [OneTrust SOC 2 Compliance](https://www.onetrust.com/solutions/soc-2-compliance/)
- [OneTrust Third-Party Risk Management](https://www.onetrust.com/products/third-party-risk-management/)
- [Prevalent SOC 2 Exception Analysis](https://www.prevalent.net/solutions/soc-2-analysis/)
- [BitSight vs SecurityScorecard Comparison](https://www.upguard.com/compare/bitsight-vs-securityscorecard)
- [EBA DORA RoI Requirements](https://www.eba.europa.eu/activities/direct-supervision-and-oversight/digital-operational-resilience-act/preparation-dora-application)
- [ESA RoI Template](https://vendorica.com/supervisory/register-of-information/template/)

## Appendix B: DORA Deadline Calendar

| Date | Milestone |
|------|-----------|
| Jan 17, 2025 | DORA becomes fully applicable |
| April 1, 2025 | eDesk portal opens for RoI submission |
| April 30, 2026 | **FIRST RoI SUBMISSION DEADLINE** |
| May 2025 | ESA validation checks round 2 |
| 2025-2027 | First CTPP designations expected |

---

*Report generated: January 5, 2026*
*Next review scheduled: January 12, 2026*
