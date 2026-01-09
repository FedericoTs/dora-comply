# RoI Engine 10X Implementation Plan

## Executive Summary

**Market Opportunity:** 93.5% of ESA dry run submissions failed. The DORA RoI deadline is April 30, 2026.

**Our 10X Advantage:** AI-powered contract analysis + one-click xBRL-CSV generation with real-time ESA validation.

---

## Competitive Intelligence Summary

### Why Competitors Fail

| Competitor | Price | Implementation | Key Weakness |
|------------|-------|----------------|--------------|
| ServiceNow | $50K-500K | 3-6 months | Too complex, requires existing investment |
| OneTrust | $30K-100K+ | Months | Difficult setup, steep learning curve |
| Vanta | $12K+ | Weeks | Not deep enough on DORA specifics |
| Drata | $15K-100K | Weeks | Limited VRM, integration issues |
| 3rdRisk | $12K+ | 10 days | Less brand recognition |
| Formalize | $18K+ | Weeks | Lighter automation, more manual |

### Market Gaps We Exploit

1. **93.5% Dry Run Failure Rate** - No solution prevents submission errors
2. **No AI Contract Extraction** - Manual 100+ data points per vendor
3. **Missing Mid-Market** - Gap between $12K startup tools and $50K+ enterprise
4. **xBRL-CSV Complexity** - ESA removed converter, companies struggle
5. **32% Invalid LEIs** - No integrated LEI validation workflow

---

## Current Implementation Status

### What's Built (70% Complete)

| Component | Status | Notes |
|-----------|--------|-------|
| Type System | 100% | All 14 templates defined |
| Data Queries | 57% | 8/14 templates implemented |
| Column Mappings | 100% | All EBA enumerations |
| Validation Rules | 64% | 9/14 templates |
| CSV Export | 100% | RFC 4180 compliant |
| ZIP Package | 100% | Correct ESA structure |
| API Endpoints | 100% | All 4 working |
| Dashboard UI | 100% | Functional |
| Template Detail UI | 100% | View-only |
| Validation UI | 100% | Full display |
| AI Contract Analysis | 100% | DORA Article 30 extraction |

### What's Missing

1. **6 Template Queries:** B_02.03, B_03.01, B_03.02, B_03.03, B_04.01, B_05.02
2. **5 Validation Rule Sets:** B_01.03, B_02.03, B_03.01-03, B_04.01, B_05.02
3. **Cross-Template Validation:** Referential integrity between templates
4. **AI-to-RoI Pipeline:** Contract analysis not feeding into RoI data
5. **Data Editing UI:** No inline corrections, no bulk import
6. **ESA Field Gaps:** ~7-10 missing fields per template

---

## 10X Feature Roadmap

### Phase 1: Complete Core Engine (This Sprint)

**Goal:** 100% template coverage with validation

**Tasks:**
1. Add missing database fields (migration 005)
2. Implement 6 remaining template queries
3. Add 5 remaining validation rule sets
4. Implement cross-template referential validation
5. Connect AI analysis to RoI data population

**Deliverable:** Full RoI generation from existing vendor/contract data

### Phase 2: AI-Powered Data Population

**Goal:** One-click contract-to-RoI extraction

**Tasks:**
1. Auto-populate contracts table from parsed_contracts
2. Extract ICT service details from contract text
3. Identify subcontractors from contract clauses
4. Map critical functions to services
5. Surface compliance gaps as validation warnings

**Deliverable:** Upload contract → AI extracts → RoI populated

### Phase 3: Real-Time ESA Validation

**Goal:** Zero submission failures

**Tasks:**
1. Implement all 116 ESA validation checks
2. Add LEI format validation with GLEIF lookup
3. Cross-template reference integrity
4. Date range consistency checks
5. Enumeration value validation

**Deliverable:** "Submission Ready" indicator with 100% confidence

### Phase 4: Data Correction UX

**Goal:** Fix errors without leaving the platform

**Tasks:**
1. Inline editing in template data tables
2. Bulk import from CSV/Excel
3. AI-suggested fixes with one-click apply
4. Audit trail of all changes
5. Version history for rollback

**Deliverable:** Complete data management without external tools

### Phase 5: Enterprise Features

**Goal:** Multi-entity, audit-ready

**Tasks:**
1. Group consolidation across subsidiaries
2. Export history with digital signatures
3. Scheduled automated exports
4. Email delivery to regulators
5. Audit trail export for compliance teams

**Deliverable:** Enterprise-grade regulatory reporting

---

## Database Schema Updates (Migration 005)

### Missing ESA-Required Fields

```sql
-- B_01.01 Entity additions
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS
  last_roi_update TIMESTAMP WITH TIME ZONE,
  annual_ict_spend_currency VARCHAR(3) DEFAULT 'EUR',
  annual_ict_spend_amount DECIMAL(15,2);

-- B_02.01 Provider additions
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS
  ultimate_parent_lei VARCHAR(20),
  esa_register_id VARCHAR(50),
  substitutability_assessment VARCHAR(20); -- 'easy', 'difficult', 'impossible'

-- B_03.01 Contract additions
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS
  governing_law_country VARCHAR(2),
  notice_period_entity INTEGER, -- days
  notice_period_provider INTEGER; -- days

-- B_04.01 ICT Service additions
ALTER TABLE ict_services ADD COLUMN IF NOT EXISTS
  service_identification_code VARCHAR(100),
  recipient_entity_lei VARCHAR(20),
  service_start_date DATE,
  service_end_date DATE,
  notice_period_days INTEGER;

-- B_04.02 Data location additions
ALTER TABLE service_data_locations ADD COLUMN IF NOT EXISTS
  sensitivity_level VARCHAR(20), -- 'public', 'internal', 'confidential', 'restricted'
  data_volume_category VARCHAR(20); -- 'small', 'medium', 'large', 'very_large'

-- B_05.01 Critical function additions
ALTER TABLE critical_functions ADD COLUMN IF NOT EXISTS
  business_rto_hours INTEGER,
  business_rpo_hours INTEGER;
```

---

## Template Query Implementation Plan

### B_02.03 - Provider Entity Links
```typescript
// Query: Join vendors → vendor_entities
// Output: Provider LEI, Entity name, Entity LEI, Country, Relationship type
```

### B_03.01 - Entity-Arrangement Links
```typescript
// Query: Join organizations → contracts → vendors
// Output: Entity LEI, Contract ref, Provider LEI, Service type
```

### B_03.02 - Provider-Arrangement Links
```typescript
// Query: Join vendors → contracts → ict_services
// Output: Provider LEI, Contract ref, Service type, Criticality
```

### B_03.03 - Intra-Group Links
```typescript
// Query: Join contracts WHERE is_intra_group = true
// Output: Contract ref, Provider LEI, Recipient LEI, Service type
```

### B_04.01 - ICT Service Recipients
```typescript
// Query: ict_services with organization as recipient
// Output: Service ID, Recipient LEI, Provider LEI, Criticality
```

### B_05.02 - Function-Service Mapping
```typescript
// Query: function_service_mapping → critical_functions → ict_services
// Output: Function ID, Service ID, Dependency level, RTO/RPO
```

---

## AI-to-RoI Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Document Upload                              │
│                          ↓                                       │
│              ┌─────────────────────┐                            │
│              │   PDF/Document      │                            │
│              └──────────┬──────────┘                            │
│                         ↓                                        │
│              ┌─────────────────────┐                            │
│              │  Claude Sonnet 4    │                            │
│              │  Contract Analyzer  │                            │
│              └──────────┬──────────┘                            │
│                         ↓                                        │
│              ┌─────────────────────┐                            │
│              │  parsed_contracts   │                            │
│              │  (AI Results)       │                            │
│              └──────────┬──────────┘                            │
│                         ↓                                        │
│    ┌────────────────────┼────────────────────┐                  │
│    ↓                    ↓                    ↓                   │
│ ┌──────┐          ┌──────────┐         ┌──────────┐            │
│ │contracts│       │ict_services│       │subcontractors│        │
│ └──────┘          └──────────┘         └──────────┘            │
│    ↓                    ↓                    ↓                   │
│    └────────────────────┼────────────────────┘                  │
│                         ↓                                        │
│              ┌─────────────────────┐                            │
│              │   RoI Templates     │                            │
│              │   B_01 - B_07       │                            │
│              └──────────┬──────────┘                            │
│                         ↓                                        │
│              ┌─────────────────────┐                            │
│              │   ESA Validation    │                            │
│              │   116 Checks        │                            │
│              └──────────┬──────────┘                            │
│                         ↓                                        │
│              ┌─────────────────────┐                            │
│              │   xBRL-CSV Export   │                            │
│              │   Ready for ESA     │                            │
│              └─────────────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Priority

### P0 - Critical Path (This Week)

1. **Migration 005** - Add missing ESA fields
2. **Complete 6 Template Queries** - Full coverage
3. **AI-to-RoI Pipeline** - Auto-populate from contract analysis
4. **Cross-Template Validation** - Reference integrity

### P1 - High Value (Next Week)

5. **LEI Validation** - GLEIF API integration
6. **Data Editing UI** - Inline corrections
7. **Bulk Import** - CSV/Excel upload
8. **Validation Rule Completion** - All 14 templates

### P2 - Differentiation (Week 3)

9. **AI Fix Suggestions** - Smart error resolution
10. **Group Consolidation** - Multi-entity support
11. **Export History** - Audit trail
12. **Scheduled Exports** - Automation

---

## Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Template Coverage | 100% (14/14) | 57% (8/14) |
| Validation Rules | 100% (14/14) | 64% (9/14) |
| ESA Checks Implemented | 116 | ~40 |
| Export Success Rate | 100% | ~70% |
| Time to First RoI | < 1 hour | Manual |
| AI Extraction Accuracy | > 90% | 85% |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| ESA format changes | Version control on mappings |
| Large data volumes | Chunked processing |
| AI extraction errors | Human review workflow |
| Cross-entity conflicts | Unique ID validation |
| Deadline pressure | Prioritize P0 features |

---

## Next Immediate Actions

1. Create migration 005 with missing fields
2. Implement B_03.01 query (entity-arrangement links)
3. Connect parsed_contracts to contracts table
4. Add cross-template validation
5. Test end-to-end RoI generation

---

*Plan created: 2026-01-01*
*Target completion: Phase 1 by end of week*
