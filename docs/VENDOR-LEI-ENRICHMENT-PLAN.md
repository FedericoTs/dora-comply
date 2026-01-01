# Vendor LEI Enrichment & ESA Compliance Implementation Plan

## Executive Summary

This document outlines the comprehensive plan to enhance vendor data collection through GLEIF API enrichment and ensure full ESA DORA compliance for the Register of Information (RoI).

**Goal**: Auto-populate maximum vendor information from LEI lookup to reduce manual data entry and ensure 100% ESA template compliance.

---

## Research Findings

### 1. GLEIF API Data Available (Not Currently Collected)

| GLEIF Field | ESA Template | Current Status |
|-------------|--------------|----------------|
| `registeredAs` | B_05.01 | NOT collected |
| `registeredAt.id` | B_05.01 | NOT collected |
| `jurisdiction` | B_05.01.0080 | NOT collected |
| `entity.status` | Validation | NOT collected |
| `registration.nextRenewalDate` | Warnings | NOT collected |
| `entity.creationDate` | Reference | NOT collected |
| **`ultimate-parent` (Level 2)** | **B_05.01.0110** | **NOT collected - CRITICAL** |
| `legalForm.id` | Reference | NOT collected |
| `legalAddress` (full) | B_05.01 | Partial |
| `headquartersAddress` (full) | B_05.01.0080 | Partial |

### 2. ESA RoI Requirements (Template B_05.01)

| Field ID | Description | Source | Status |
|----------|-------------|--------|--------|
| B_05.01.0010 | Provider LEI | User/GLEIF | Collected |
| B_05.01.0020 | ID Type | Auto (LEI) | Derivable |
| B_05.01.0050 | Provider Name | GLEIF | Collected |
| B_05.01.0060 | Name (Latin) | GLEIF | NOT collected |
| B_05.01.0070 | Type of person | GLEIF | NOT collected |
| B_05.01.0080 | HQ Country | GLEIF | Collected |
| B_05.01.0090 | Currency | User | NOT collected |
| B_05.01.0100 | Annual expense | User | NOT collected |
| **B_05.01.0110** | **Ultimate parent LEI** | **GLEIF Level 2** | **NOT collected** |
| **B_05.01.0120** | **Parent ID Type** | **Auto** | **NOT collected** |

### 3. Competitor Analysis

| Competitor | LEI Auto-population | Parent Lookup | Substitutability |
|------------|---------------------|---------------|------------------|
| ProcessUnity | Yes (from RoI sources) | Unknown | Manual |
| House of Control | Yes (basic) | Unknown | Manual |
| **DORA Comply (Target)** | **Full GLEIF enrichment** | **Auto Level 2** | **AI-suggested** |

---

## Gap Analysis

### Database Schema Gaps

**Currently Missing (Not in any migration):**
```sql
-- LEI Verification Data
lei_status VARCHAR(20)              -- ISSUED, LAPSED, etc.
lei_verified_at TIMESTAMPTZ         -- Last verification timestamp
lei_next_renewal DATE               -- Renewal warning
entity_status VARCHAR(20)           -- ACTIVE, INACTIVE

-- Registration Authority
registration_authority_id VARCHAR(50) -- GLEIF registeredAt.id

-- Legal Structure
legal_form_code VARCHAR(50)         -- GLEIF legalForm.id
legal_address JSONB                 -- Full structured address
headquarters_address JSONB          -- Full HQ address
entity_creation_date DATE           -- When entity was formed

-- GLEIF Cache
gleif_data JSONB                    -- Full GLEIF response cache
gleif_fetched_at TIMESTAMPTZ        -- When last fetched
```

**In Migration 005 (Not Applied):**
```sql
ultimate_parent_lei VARCHAR(20)
ultimate_parent_name TEXT
esa_register_id VARCHAR(50)
substitutability_assessment VARCHAR(50)
total_annual_expense DECIMAL(18,2)
expense_currency VARCHAR(3)
```

### Code Gaps

**GLEIF Client (`src/lib/external/gleif.ts`):**
- Missing: Parent lookup endpoints (direct-parent, ultimate-parent)
- Missing: Full entity data extraction
- Missing: Status validation (entity.status vs registration.status)

**Vendor Types (`src/lib/vendors/types.ts`):**
- Missing: Extended GLEIFEntity with all fields
- Missing: Parent company types
- Missing: Full address structure

**Vendor Registration (`add-vendor-wizard.tsx`):**
- Missing: Auto-population of all GLEIF fields
- Missing: Parent company display
- Missing: Substitutability assessment field
- Missing: Total annual expense field

---

## Implementation Plan

### Phase 1: Enhanced GLEIF Client

**File: `src/lib/external/gleif.ts`**

Add new functions:
1. `lookupLEIWithParent(lei)` - Fetch LEI + parent data
2. `getDirectParent(lei)` - Direct parent lookup
3. `getUltimateParent(lei)` - Ultimate parent lookup
4. Enhanced `mapGLEIFRecord()` with all fields

```typescript
// New types
interface GLEIFFullEntity extends GLEIFEntity {
  registeredAs?: string;
  registeredAt?: string;
  jurisdiction?: string;
  entityStatus?: 'ACTIVE' | 'INACTIVE';
  nextRenewalDate?: string;
  entityCreationDate?: string;
  legalFormCode?: string;
  legalAddressFull: {
    addressLines: string[];
    city: string;
    region?: string;
    country: string;
    postalCode?: string;
  };
  headquartersAddressFull?: {
    addressLines?: string[];
    city?: string;
    region?: string;
    country?: string;
    postalCode?: string;
  };
}

interface GLEIFParentEntity {
  lei: string;
  legalName: string;
  country: string;
  relationshipType: 'IS_DIRECTLY_CONSOLIDATED_BY' | 'IS_ULTIMATELY_CONSOLIDATED_BY';
}

interface GLEIFEnrichedEntity extends GLEIFFullEntity {
  directParent?: GLEIFParentEntity | null;
  ultimateParent?: GLEIFParentEntity | null;
  parentException?: string;
}
```

### Phase 2: Database Migration

**File: `supabase/migrations/006_vendor_lei_enrichment.sql`**

```sql
-- Add LEI verification fields
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS
  lei_status VARCHAR(20) CHECK (lei_status IN (
    'ISSUED', 'LAPSED', 'RETIRED', 'ANNULLED', 'PENDING_VALIDATION'
  ));

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS
  lei_verified_at TIMESTAMPTZ;

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS
  lei_next_renewal DATE;

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS
  entity_status VARCHAR(20) CHECK (entity_status IN ('ACTIVE', 'INACTIVE'));

-- Add registration authority
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS
  registration_authority_id VARCHAR(50);

-- Add legal structure
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS
  legal_form_code VARCHAR(50);

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS
  legal_address JSONB DEFAULT '{}';

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS
  headquarters_address JSONB DEFAULT '{}';

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS
  entity_creation_date DATE;

-- GLEIF cache
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS
  gleif_data JSONB DEFAULT '{}';

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS
  gleif_fetched_at TIMESTAMPTZ;

-- Comments
COMMENT ON COLUMN vendors.lei_status IS 'LEI registration status from GLEIF';
COMMENT ON COLUMN vendors.lei_next_renewal IS 'LEI renewal date for compliance warnings';
COMMENT ON COLUMN vendors.gleif_data IS 'Cached GLEIF API response for reference';
```

### Phase 3: Update Vendor Types

**File: `src/lib/vendors/types.ts`**

Add new fields to Vendor interface and CreateVendorInput.

### Phase 4: Update Vendor Actions

**File: `src/lib/vendors/actions.ts`**

Enhance `createVendor()` to:
1. Fetch full GLEIF data when LEI provided
2. Auto-populate all available fields
3. Store GLEIF response in `gleif_data`
4. Set verification timestamp

### Phase 5: Enhanced Registration UI

**File: `src/app/(dashboard)/vendors/new/add-vendor-wizard.tsx`**

1. Add Step 4 for ESA-specific fields:
   - Substitutability assessment (dropdown)
   - Total annual expense (input)
   - Currency (dropdown)

2. Enhance LEI verification display:
   - Show parent company info
   - Show full legal address
   - Show LEI renewal warning if applicable

3. Add validation warnings:
   - LEI status not ISSUED
   - Entity status not ACTIVE
   - Missing critical fields for RoI

### Phase 6: RoI Integration

**File: `src/lib/roi/ai-pipeline.ts`**

Update to use enriched vendor data:
- Use `ultimate_parent_lei` for B_05.01.0110
- Use `total_annual_expense` for B_05.01.0100
- Use enriched address data for exports

---

## Data Flow Diagram

```
User enters LEI or Name
        │
        ▼
┌───────────────────────────────────────┐
│  GLEIF API Lookup                     │
│  ├─ Basic entity data                 │
│  ├─ Full address data                 │
│  ├─ Registration authority            │
│  └─ Level 2: Parent lookup            │
│      ├─ Direct parent                 │
│      └─ Ultimate parent               │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  Auto-populate Form Fields            │
│  ├─ Name                              │
│  ├─ Country                           │
│  ├─ Full address                      │
│  ├─ Registration number               │
│  ├─ Legal form                        │
│  ├─ Ultimate parent LEI               │
│  └─ Ultimate parent name              │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  User adds remaining fields           │
│  ├─ Tier classification               │
│  ├─ Provider type                     │
│  ├─ Service types                     │
│  ├─ Substitutability assessment       │
│  ├─ Total annual expense              │
│  └─ Contact information               │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  Save to Database                     │
│  ├─ All auto-populated fields         │
│  ├─ User-provided fields              │
│  ├─ GLEIF cache (gleif_data)          │
│  └─ Verification timestamp            │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│  RoI Export                           │
│  B_05.01 fully populated:             │
│  ├─ 0010: LEI ✓                       │
│  ├─ 0020: Type (LEI) ✓                │
│  ├─ 0050: Name ✓                      │
│  ├─ 0060: Latin name ✓                │
│  ├─ 0080: HQ Country ✓                │
│  ├─ 0100: Annual expense ✓            │
│  ├─ 0110: Ultimate parent LEI ✓       │
│  └─ 0120: Parent ID type ✓            │
└───────────────────────────────────────┘
```

---

## Implementation Priority

| Priority | Task | Complexity | Impact |
|----------|------|------------|--------|
| P0 | Apply Migration 005 | Low | High |
| P0 | Add parent lookup to GLEIF | Medium | Critical |
| P1 | Add LEI enrichment fields | Low | High |
| P1 | Update vendor registration | Medium | High |
| P2 | Add substitutability UI | Low | Medium |
| P2 | Add expense tracking | Low | Medium |
| P3 | LEI renewal warnings | Low | Low |

---

## Success Metrics

1. **100% ESA field coverage** for B_05.01 template
2. **90% auto-population** rate for GLEIF-available fields
3. **Zero manual parent entry** - all from GLEIF Level 2
4. **Real-time validation** warnings for LEI status issues

---

## Sources

- [GLEIF API Documentation](https://www.gleif.org/en/lei-data/gleif-api)
- [ESA DORA RoI Data Model](https://www.eba.europa.eu/sites/default/files/2024-11/0f0f79a0-6f9d-413f-b6f3-917371e404ba/Data%20Model%20for%20DORA%20RoI.pdf)
- [ProcessUnity DORA Solution](https://www.processunity.com/achieve-an-accelerated-dora/)
- [House of Control DORA Software](https://www.houseofcontrol.com/digital-operational-resilience-act-software)
- [LEI for DORA Requirements](https://leiworldwide.com/news/lei-dora-2)
