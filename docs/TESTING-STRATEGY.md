# DORA RoI Testing & Validation Strategy

## Executive Summary

Based on ESA dry run results where **93.5% of submissions failed**, this document outlines a comprehensive testing strategy to ensure legally compliant RoI exports.

---

## 1. Validation Layers Required

### Layer 1: Technical Integration Checks
- File format compliance (xBRL-CSV / Plain-CSV)
- ZIP package structure
- File naming convention: `{LEI}_{CountryCode}_DORA_RoI_{ReferenceDate}_{SubmissionDate}.zip`
- UTF-8 encoding
- JSON entry point references

### Layer 2: Data Point Model (DPM) Technical Checks
- Primary key constraints (Error 805 - REJECTION)
- Foreign key constraints (Error 807 - REJECTION)
- Filing indicators (Error 808 - REJECTION)
- Duplicate key detection (Error 806)

### Layer 3: Business Validation Rules
- Mandatory field presence (86% of dry run failures)
- Date format validation (YYYY-MM-DD)
- LEI format and validity (32% of failures)
- Enumeration value compliance
- Cross-template referential integrity

### Layer 4: Legal/Regulatory Compliance
- Complete coverage of all ICT third-party arrangements
- Critical function identification accuracy
- Subcontracting chain completeness
- Exit plan requirements per DORA Article 28(8)

---

## 2. Official ESA Resources to Download

### Required Downloads

| Resource | URL | Purpose |
|----------|-----|---------|
| **Taxonomy Package v4.0** | https://www.eba.europa.eu/sites/default/files/2025-03/729fe4f5-bbcc-495d-b520-8ad5cbeeead0/taxo_package_4.0_errata5.zip | Reference schema |
| **Validation Rules Excel** | https://www.eba.europa.eu/sites/default/files/2025-03/de521052-1069-4e43-a08b-43aaeb938a35/EBA%20Validation%20Rules%202025-03-20%20deactivation.xlsx | All validation rules |
| **Sample Files** | https://www.eba.europa.eu/sites/default/files/2024-12/f4519b45-d6c2-4e7d-a8d4-4bee91a9c530/sample_documents.zip | Reference output |
| **DPM Dictionary v4.0** | https://www.eba.europa.eu/sites/default/files/2025-01/eee6cdde-536f-448a-8c42-75752f536d75/dpm2_4_0_glossary_20250129.xlsx | Field definitions |
| **Filing Rules v5.5** | https://www.eba.europa.eu/sites/default/files/2025-01/1f92a6e9-9e5a-41e8-bd44-0dc757f754c2/EBA%20Filing%20Rules%20v5.5_2025_01_14.pdf | Technical specs |
| **FAQ Document** | https://www.eba.europa.eu/sites/default/files/2025-03/31bb6e60-7d10-4405-a8c5-9f04934630ac/20250328%20-%20DORA%20RoI%20reporting%20FAQ%20(updated).pdf | Clarifications |

---

## 3. Testing Phases

### Phase 1: Schema Validation (Automated)
**Objective:** Ensure CSV output matches ESA taxonomy exactly

```
Tests:
□ Column headers match ESA codes (c0010, c0020, etc.)
□ Column order matches template specification
□ Data types match DPM definitions
□ Enumeration values are valid ESA codes
□ Date formats are YYYY-MM-DD
□ LEI format validation (20 alphanumeric)
□ Required fields are never null/empty
```

### Phase 2: Cross-Reference Validation (Automated)
**Objective:** Ensure referential integrity across templates

```
Tests:
□ B_02.02 provider LEIs referenced in B_03.01 contracts
□ B_03.01 contract IDs referenced in B_04.01 services
□ B_04.01 service IDs referenced in B_07.01 function mapping
□ B_06.01 function IDs referenced in B_07.01
□ B_99.01 subcontractor LEIs valid and referenced
□ All LEIs pass checksum validation
```

### Phase 3: Third-Party Validator Testing
**Objective:** Pre-submission validation using external tools

| Validator | URL | Status |
|-----------|-----|--------|
| DORA Validator (Arendt) | https://www.doravalidator.com/ | Free, no registration |
| Formalize RoI Validator | https://formalize.com/en/roi-validator | Free validation |
| DORApp | https://dorapp.eu/ | Excel to xBRL-CSV |

### Phase 4: Sample File Comparison
**Objective:** Byte-level comparison with ESA samples

```
Tests:
□ Download ESA sample_documents.zip
□ Compare our output structure to samples
□ Verify META-INF folder structure
□ Verify parameters.csv format
□ Verify report.json structure
□ Compare CSV column headers exactly
```

### Phase 5: Legal Review Checklist
**Objective:** Human expert verification

```
Compliance Officer Review:
□ All ICT third-party providers included
□ All contracts with ICT services captured
□ Critical function classification accurate
□ Subcontracting chains complete (rank 1, 2, etc.)
□ Data locations accurate (country codes)
□ Exit plans documented for critical services
□ Annual cost figures accurate
□ Contract dates verified against source documents
```

### Phase 6: NCA Portal Test Submission
**Objective:** Validate against actual regulatory system

```
For German entities (BaFin MVP):
□ Test upload to MVP sandbox (if available)
□ Review validation feedback
□ Address any rejection errors
□ Re-test until clean pass

Portal URLs by country:
- Germany: BaFin MVP Portal
- Netherlands: MyDNB / AFM Portal
- Luxembourg: CSSF eDesk
- Austria: FMA Incoming Platform
- France: ACPR Portal
- Ireland: CBI Portal
```

---

## 4. Common Error Resolution Guide

### Rejection Errors (Must Fix)

| Code | Error | Resolution |
|------|-------|------------|
| 805 | Primary key missing | Ensure unique ID in first column |
| 807 | Foreign key constraint | Verify referenced entity exists |
| 808 | Filing indicators wrong | Check report.json filing flags |
| 720 | Incorrect file names/case | Match exact ESA naming pattern |
| 714 | entityID mismatch | LEI in filename = LEI in data |

### Warning Errors (Should Fix)

| Code | Error | Resolution |
|------|-------|------------|
| v8886_m | Mandatory value missing | Fill required fields |
| v8850_m | Missing SLA data | Add RTO/RPO values |
| VR_71 | Wrong LEI reported | Verify against GLEIF database |
| 806 | Duplicate keys | Remove duplicate rows |

---

## 5. Automated Test Suite Design

### Unit Tests (per template)

```typescript
// Example: B_03.01 Contract Template Tests
describe('B_03.01 Contracts Export', () => {
  it('should have correct column headers', () => {
    const expected = ['c0010', 'c0020', 'c0030', ...];
    expect(exportHeaders).toEqual(expected);
  });

  it('should have valid LEIs for all providers', () => {
    data.forEach(row => {
      expect(isValidLEI(row.c0040)).toBe(true);
    });
  });

  it('should have signing_date <= effective_date', () => {
    data.forEach(row => {
      expect(new Date(row.c0050) <= new Date(row.c0060)).toBe(true);
    });
  });

  it('should reference valid provider from B_02.02', () => {
    const providerLEIs = b0202Data.map(p => p.c0010);
    data.forEach(row => {
      expect(providerLEIs).toContain(row.c0040);
    });
  });
});
```

### Integration Tests (cross-template)

```typescript
describe('Cross-Template Referential Integrity', () => {
  it('all contract providers exist in vendor registry', () => {
    const vendors = getB0202Data();
    const contracts = getB0301Data();
    contracts.forEach(c => {
      expect(vendors.find(v => v.lei === c.providerLei)).toBeDefined();
    });
  });

  it('all service contracts exist', () => {
    const contracts = getB0301Data();
    const services = getB0401Data();
    services.forEach(s => {
      expect(contracts.find(c => c.id === s.contractRef)).toBeDefined();
    });
  });
});
```

### End-to-End Tests

```typescript
describe('Full RoI Package Generation', () => {
  it('should generate valid ZIP structure', async () => {
    const pkg = await generateRoIPackage(orgId);
    expect(pkg.hasFile('META-INF/reports/parameters.csv')).toBe(true);
    expect(pkg.hasFile('META-INF/reports/report.json')).toBe(true);
    expect(pkg.hasFile('META-INF/reports/b_01.01.csv')).toBe(true);
    // ... all 15 templates
  });

  it('should pass DORA Validator', async () => {
    const pkg = await generateRoIPackage(orgId);
    const result = await submitToValidator(pkg);
    expect(result.errors).toHaveLength(0);
  });
});
```

---

## 6. LEI Validation

### LEI Format
- 20 characters: 4 alphanumeric (LOU) + 14 alphanumeric + 2 check digits
- Checksum: ISO 17442 / MOD 97-10

### LEI Validation Code

```typescript
function isValidLEI(lei: string): boolean {
  if (!lei || lei.length !== 20) return false;
  if (!/^[A-Z0-9]+$/.test(lei)) return false;

  // Convert letters to numbers (A=10, B=11, etc.)
  const converted = lei.split('').map(char => {
    const code = char.charCodeAt(0);
    return code >= 65 ? (code - 55).toString() : char;
  }).join('');

  // MOD 97-10 check
  let remainder = '';
  for (const char of converted) {
    remainder = ((parseInt(remainder + char, 10)) % 97).toString();
  }
  return parseInt(remainder, 10) === 1;
}
```

### GLEIF Lookup
- API: https://api.gleif.org/api/v1/lei-records/{LEI}
- Verify LEI is active and entity name matches

---

## 7. Testing Data Quality

### Minimum Viable Test Data

| Template | Minimum Records | Test Coverage |
|----------|-----------------|---------------|
| B_01.01 | 1 organization | Entity registration |
| B_01.02 | 2 responsible persons | Contact info |
| B_02.01 | 2 provider contacts | Provider contacts |
| B_02.02 | 2 providers | With valid LEIs |
| B_03.01 | 3 contracts | Various types |
| B_03.02 | 3 contract contacts | Per contract |
| B_04.01 | 5 services | Various criticalities |
| B_05.01 | 5 data locations | Multiple countries |
| B_05.02 | 5 processing locations | Multiple countries |
| B_06.01 | 3 critical functions | With RTO/RPO |
| B_07.01 | 8 function-service maps | All critical |
| B_99.01 | 2 subcontractors | Chain depth 2 |
| B_99.02 | 1 intra-group | If applicable |

---

## 8. Testing Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Testing Workflow                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. DATA ENTRY                                                   │
│     └─> Add test documents (MSA, SLA, DPA, etc.)                │
│     └─> System parses and populates database                    │
│                                                                  │
│  2. INTERNAL VALIDATION                                          │
│     └─> Run automated schema tests                               │
│     └─> Run cross-reference tests                                │
│     └─> Fix any errors found                                     │
│                                                                  │
│  3. EXPORT GENERATION                                            │
│     └─> Generate xBRL-CSV package                                │
│     └─> Compare with ESA samples                                 │
│                                                                  │
│  4. EXTERNAL VALIDATION                                          │
│     └─> Upload to https://www.doravalidator.com/                │
│     └─> Fix any validation errors                                │
│     └─> Re-export and re-validate                                │
│                                                                  │
│  5. LEGAL REVIEW                                                 │
│     └─> Compliance officer reviews completeness                  │
│     └─> Verify against source contracts                          │
│     └─> Sign-off on accuracy                                     │
│                                                                  │
│  6. NCA SUBMISSION                                               │
│     └─> Upload to regulatory portal                              │
│     └─> Review feedback file                                     │
│     └─> Address any final issues                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Success Criteria

### Technical Success
- [ ] Zero rejection errors (805, 807, 808, 720, 714)
- [ ] Zero warning errors
- [ ] All 15 templates generate valid CSV
- [ ] ZIP package structure matches ESA specification
- [ ] Passes doravalidator.com validation

### Legal Success
- [ ] All ICT third-party arrangements included
- [ ] All critical functions identified
- [ ] Subcontracting chains complete
- [ ] Exit plans documented
- [ ] Data locations accurate
- [ ] Compliance officer sign-off obtained

### Operational Success
- [ ] Export completes in < 5 minutes
- [ ] No manual CSV editing required
- [ ] Clear error messages for any issues
- [ ] Audit trail of generation

---

## 10. Contacts

### ESA Technical Support
**Email:** esa-dora-reporting@eba.europa.eu

### NCA Portals (by country)
- **Germany (BaFin):** MVP Portal - April 14-28, 2025
- **Netherlands (DNB):** MyDNB - April 23, 2025
- **Luxembourg (CSSF):** eDesk - April 2025
- **Ireland (CBI):** CBI Portal - April 23, 2025

---

*Document Version: 1.0*
*Last Updated: January 2025*
*Review Cycle: Before each submission period*
