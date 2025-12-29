# External Data Sources Specification

**Document Status:** Draft
**Last Updated:** 2024-12-29
**Purpose:** Comprehensive inventory of all external data sources required for the DORA Compliance Platform

---

## Executive Summary

The platform requires external data from multiple sources across five categories:

| Category | Sources | Priority | Cost |
|----------|---------|----------|------|
| **Regulatory Data** | ESA/EBA official downloads | P0 | Free |
| **Entity Validation** | GLEIF LEI API | P0 | Free tier available |
| **Framework Controls** | AICPA, ISO, NIST downloads | P0 | Free/Low cost |
| **Security Ratings** | SecurityScorecard, BitSight | P2 | Enterprise pricing |
| **Company Enrichment** | OpenCorporates, GLEIF | P2 | Free tier available |

---

## 1. Regulatory Data Sources (P0 - CRITICAL)

### 1.1 ESA Register of Information Templates

**Purpose:** Official RoI templates, validation rules, xBRL taxonomy

| Resource | URL | Format | Update Frequency |
|----------|-----|--------|------------------|
| **RoI Templates & DPM** | [EBA DORA Preparation](https://www.eba.europa.eu/activities/direct-supervision-and-oversight/digital-operational-resilience-act/preparation-dora-application) | Excel, xBRL-CSV | Per regulation update |
| **Annotated Table Layout** | Download from EBA page: `20241217 Annotated Table Layout DORADORA 4.0` | Excel | Version-based |
| **Sample xBRL-CSV Files** | Download from EBA page: `DUMMYLEI123456789012.CON_FR_DORA010100_DORA_2024-12-31` | CSV | Version-based |
| **Validation Rules** | Included in technical package | XML/Excel | Version-based |

**Key Files to Download:**
```
/eba-downloads/
├── DORA_DPM_4.0_Annotated_Table_Layout.xlsx
├── DORA_Validation_Rules.xlsx
├── DORA_xBRL_Taxonomy.zip
├── Sample_xBRL_CSV/
│   ├── B_01.01.csv
│   ├── B_02.01.csv
│   └── ... (all 15 templates)
└── DORA_Filing_Rules.pdf
```

**Integration Notes:**
- Must download and parse the DPM to build our validation engine
- xBRL-CSV samples are essential for testing export generation
- Validation rules must be implemented exactly as specified

### 1.2 Incident Classification Criteria

**Purpose:** Official criteria for classifying ICT-related incidents per DORA Article 17

| Document | Official Reference | URL |
|----------|-------------------|-----|
| **Classification RTS** | EU 2024/1772 | [EBA RTS Classification](https://www.eba.europa.eu/activities/single-rulebook/regulatory-activities/operational-resilience/regulatory-technical-standards-criteria-classification-ict-related-incidents) |
| **Incident Reporting ITS** | EU 2025/301-302 | [EBA ITS Incident Reporting](https://www.eba.europa.eu/activities/single-rulebook/regulatory-activities/operational-resilience/joint-technical-standards-major-incident-reporting) |

**Key Data to Extract:**
```typescript
// Classification thresholds from EU 2024/1772
const MATERIALITY_THRESHOLDS = {
  clients_affected_percentage: 10, // >10% of total clients
  clients_affected_count: 100000, // OR >100,000 clients
  duration_critical_hours: 2, // >2 hours for critical services
  geographic_spread: 2, // >2 EU member states
  economic_impact_eur: 100000, // >€100,000 direct costs
  transactions_affected: 10, // >10% of daily transactions
};

// Report timelines from EU 2025/301
const REPORT_TIMELINES = {
  initial: { hours: 4, from: 'classification' },
  initial_max: { hours: 24, from: 'detection' },
  intermediate: { hours: 72, from: 'detection' },
  final: { days: 30, from: 'detection' },
};
```

### 1.3 EBA/EIOPA XBRL Taxonomy

**Purpose:** Machine-readable definitions for xBRL-CSV generation

| Resource | URL | Notes |
|----------|-----|-------|
| **EBA Reporting Frameworks** | [EBA Reporting](https://www.eba.europa.eu/risk-and-data-analysis/reporting-frameworks) | All taxonomy versions |
| **DPM 2.0 Architecture** | [EBA DPM 2.0 PDF](https://www.eba.europa.eu/sites/default/files/2024-12/8fdac0fc-ddf7-4244-831c-20be53b2605a/EBA%20and%20EIOPA%20taxonomy%20architecture%20v2.0-20241218.pdf) | Technical specification |
| **EIOPA DPM & XBRL** | [EIOPA Reporting](https://www.eiopa.europa.eu/tools-and-data/supervisory-reporting-dpm-and-xbrl_en) | Insurance-specific |

**Important Timeline:**
- By **December 2025**: Only xBRL-CSV format accepted by EBA
- DPM 2.0 is now the standard (DPM 1.0 being phased out)

---

## 2. Entity Validation APIs (P0)

### 2.1 GLEIF LEI API

**Purpose:** Validate Legal Entity Identifiers, lookup company information

| Endpoint | Description | Rate Limit |
|----------|-------------|------------|
| `GET /api/v1/lei-records/{lei}` | Get LEI record by LEI | 1000/day (free) |
| `GET /api/v1/lei-records?filter[entity.legalName]={name}` | Search by name | 1000/day (free) |
| `GET /api/v1/lei-records?filter[entity.legalAddress.country]={country}` | Filter by country | 1000/day (free) |

**Base URL:** `https://api.gleif.org`

**Documentation:** [GLEIF API](https://www.gleif.org/en/lei-data/gleif-api)

**Sample Response:**
```json
{
  "data": [{
    "type": "lei-records",
    "id": "5493001KJTIIGC8Y1R17",
    "attributes": {
      "lei": "5493001KJTIIGC8Y1R17",
      "entity": {
        "legalName": { "name": "Example Financial Corp" },
        "legalAddress": {
          "addressLines": ["123 Finance Street"],
          "city": "Frankfurt",
          "country": "DE",
          "postalCode": "60313"
        },
        "jurisdiction": "DE",
        "status": "ACTIVE"
      },
      "registration": {
        "initialRegistrationDate": "2012-06-06T15:51:00+02:00",
        "lastUpdateDate": "2024-06-06T08:00:00+02:00",
        "status": "ISSUED",
        "nextRenewalDate": "2025-06-06T00:00:00+02:00"
      }
    },
    "relationships": {
      "direct-parent": {
        "data": { "type": "lei-records", "id": "PARENTLEI123456789012" }
      },
      "ultimate-parent": {
        "data": { "type": "lei-records", "id": "ULTIMATELEI12345678901" }
      }
    }
  }]
}
```

**Integration Code:**
```typescript
// src/lib/external/gleif.ts

const GLEIF_BASE_URL = 'https://api.gleif.org/api/v1';

export interface LEIRecord {
  lei: string;
  legalName: string;
  legalAddress: {
    country: string;
    city: string;
    postalCode: string;
  };
  jurisdiction: string;
  status: 'ACTIVE' | 'INACTIVE' | 'LAPSED';
  parentLei?: string;
  ultimateParentLei?: string;
}

export async function validateLEI(lei: string): Promise<{
  valid: boolean;
  record?: LEIRecord;
  error?: string;
}> {
  // Validate format first
  if (!/^[A-Z0-9]{20}$/.test(lei)) {
    return { valid: false, error: 'Invalid LEI format' };
  }

  try {
    const response = await fetch(`${GLEIF_BASE_URL}/lei-records/${lei}`);

    if (response.status === 404) {
      return { valid: false, error: 'LEI not found in GLEIF database' };
    }

    const data = await response.json();
    const record = data.data;

    return {
      valid: record.attributes.registration.status === 'ISSUED',
      record: {
        lei: record.attributes.lei,
        legalName: record.attributes.entity.legalName.name,
        legalAddress: {
          country: record.attributes.entity.legalAddress.country,
          city: record.attributes.entity.legalAddress.city,
          postalCode: record.attributes.entity.legalAddress.postalCode,
        },
        jurisdiction: record.attributes.entity.jurisdiction,
        status: record.attributes.entity.status,
        parentLei: record.relationships?.['direct-parent']?.data?.id,
        ultimateParentLei: record.relationships?.['ultimate-parent']?.data?.id,
      },
    };
  } catch (error) {
    return { valid: false, error: 'GLEIF API unavailable' };
  }
}

export async function searchByName(name: string, country?: string): Promise<LEIRecord[]> {
  let url = `${GLEIF_BASE_URL}/lei-records?filter[entity.legalName]=${encodeURIComponent(name)}`;
  if (country) {
    url += `&filter[entity.legalAddress.country]=${country}`;
  }
  url += '&page[size]=20';

  const response = await fetch(url);
  const data = await response.json();

  return data.data.map((record: any) => ({
    lei: record.attributes.lei,
    legalName: record.attributes.entity.legalName.name,
    // ... map other fields
  }));
}
```

**Caching Strategy:**
```typescript
// Cache LEI lookups for 24 hours (data rarely changes)
const LEI_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Use Supabase or Redis for caching
async function getCachedLEI(lei: string): Promise<LEIRecord | null> {
  const cached = await supabase
    .from('lei_cache')
    .select('*')
    .eq('lei', lei)
    .gt('cached_at', new Date(Date.now() - LEI_CACHE_TTL).toISOString())
    .single();

  return cached?.data || null;
}
```

---

## 3. Framework Control Databases (P0)

### 3.1 DORA Controls (Internal Seeding)

We seed DORA controls from the official regulation. See `004_framework_mapping.sql` for the seeded data.

**Source:** [EUR-Lex DORA](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554)

### 3.2 SOC 2 Trust Services Criteria

**Purpose:** Map SOC 2 controls to DORA for gap analysis

| Resource | URL | Format |
|----------|-----|--------|
| **TSC 2017 (2022 PoF)** | [AICPA TSC Download](https://www.aicpa-cima.com/resources/download/2017-trust-services-criteria-with-revised-points-of-focus-2022) | PDF |
| **TSC to ISO 27001 Mapping** | [AICPA Mapping](https://www.aicpa-cima.com/resources/download/mapping-2017-trust-services-criteria-to-iso-27001) | Excel |
| **NIST Privacy Framework Crosswalk** | [NIST Crosswalk](https://www.nist.gov/itl/applied-cybersecurity/privacy-engineering/american-institute-certified-public-accountants-aicpa) | Excel |

**Control Structure (to seed):**
```typescript
const SOC2_CONTROLS = [
  // CC Series - Common Criteria
  { id: 'CC1.1', category: 'Control Environment', name: 'COSO Principle 1' },
  { id: 'CC1.2', category: 'Control Environment', name: 'Board Independence' },
  // ... 60+ controls

  // Security-specific
  { id: 'CC6.1', category: 'Logical Access', name: 'Logical Access Security Software' },
  { id: 'CC6.2', category: 'Logical Access', name: 'New Logical Access' },
  // ...

  // Availability
  { id: 'A1.1', category: 'Availability', name: 'Availability Commitment' },
  { id: 'A1.2', category: 'Availability', name: 'Environmental Protections' },
  // ...
];
```

### 3.3 ISO 27001:2022 Controls

**Purpose:** Map ISO 27001 controls to DORA

| Resource | URL | Format |
|----------|-----|--------|
| **Annex A Controls List** | [HighTable.io](https://hightable.io/iso-27001-annex-a-controls-list/) | Free Excel/PDF |
| **2013 to 2022 Mapping** | [Advisera](https://info.advisera.com/27001academy/free-download/iso-27001-2022-mapping-of-controls-with-the-2013-revision/) | Excel |
| **Blackmores Mapping** | [Isology Hub](https://isologyhub.com/wp-content/uploads/2023/02/ISO-27001-2022-Annex-A-Control-Mapping.pdf) | PDF |
| **Uebermeister Mapping Tables** | [Direct Excel](https://www.uebermeister.com/fileadmin/documents/uebermeister.ch/Dokumente/Mapping_Tables_ISO_27002_2022_2013.xlsx) | Excel |

**Control Structure (93 controls in 2022 version):**
```typescript
const ISO27001_2022_CATEGORIES = [
  { code: '5', name: 'Organizational Controls', count: 37 },
  { code: '6', name: 'People Controls', count: 8 },
  { code: '7', name: 'Physical Controls', count: 14 },
  { code: '8', name: 'Technological Controls', count: 34 },
];

// Sample controls
const ISO27001_CONTROLS = [
  { id: 'A.5.1', category: '5', name: 'Policies for information security' },
  { id: 'A.5.2', category: '5', name: 'Information security roles and responsibilities' },
  { id: 'A.5.7', category: '5', name: 'Threat intelligence' }, // New in 2022
  // ... 93 total
];
```

### 3.4 NIST Cybersecurity Framework 2.0

**Purpose:** Additional framework mapping, especially for US vendors

| Resource | URL | Format |
|----------|-----|--------|
| **CSF 2.0 JSON** | [NIST JSON Download](https://csrc.nist.gov/extensions/nudp/services/json/csf/download?olirids=all) | JSON |
| **CSF 2.0 Reference Tool** | [NIST CSF Tool](https://csrc.nist.gov/News/2023/just-released-nist-csf-2-0-reference-tool) | Web/JSON |
| **CSF 2.0 to SP 800-53 Mapping** | NIST CPRT | JSON |
| **CIS Controls to CSF 2.0** | [CIS Mapping](https://www.cisecurity.org/insights/white-papers/cis-controls-v8-mapping-to-nist-csf-2-0) | PDF |

**Structure (6 Functions):**
```typescript
const NIST_CSF_FUNCTIONS = [
  { code: 'GV', name: 'Govern' }, // New in 2.0
  { code: 'ID', name: 'Identify' },
  { code: 'PR', name: 'Protect' },
  { code: 'DE', name: 'Detect' },
  { code: 'RS', name: 'Respond' },
  { code: 'RC', name: 'Recover' },
];
```

### 3.5 Secure Controls Framework (SCF) - Comprehensive Mappings

**Purpose:** Pre-built crosswalk mappings between all major frameworks

| Resource | URL | Cost |
|----------|-----|------|
| **SCF STRM Bundle** | [SCF Download](https://securecontrolsframework.com/strm-bundle/) | Paid (~$500) |

**Includes mappings for:**
- SOC 2 TSC ↔ DORA
- ISO 27001 ↔ DORA
- NIST CSF ↔ All frameworks
- PCI-DSS, HIPAA, GDPR, and 100+ more

**Alternative:** Build our own mappings using the free resources above.

---

## 4. Security Ratings APIs (P2 - Future)

### 4.1 SecurityScorecard

**Purpose:** External security ratings for vendors

| Plan | Features | Estimated Cost |
|------|----------|----------------|
| **Free** | Self-monitoring only | $0 |
| **Business** | 5 vendor monitoring, basic API | Custom pricing |
| **Enterprise** | Unlimited, full API, compliance | Custom ($$$$) |

**API Documentation:** [SecurityScorecard API](https://securityscorecard.readme.io/reference/introduction)

**Sample API Usage:**
```typescript
// Get vendor security rating
const response = await fetch(
  `https://api.securityscorecard.io/companies/${domain}/factors`,
  {
    headers: {
      'Authorization': `Bearer ${SECURITYSCORECARD_API_KEY}`,
    },
  }
);

const data = await response.json();
// Returns: overall score (0-100), factor scores, grade (A-F)
```

### 4.2 BitSight

**Purpose:** Alternative security ratings provider

**API Documentation:** [BitSight API](https://help.bitsighttech.com/hc/en-us/categories/360005934253-Bitsight-API)

**Key Features:**
- Security rating (300-820 scale, like credit score)
- Risk vectors (specific security issues)
- Company portfolio monitoring
- ServiceNow, Power BI, Tableau integrations

---

## 5. Company Enrichment APIs (P2 - Future)

### 5.1 OpenCorporates

**Purpose:** Company registration data, directors, filings

| Tier | Features | Cost |
|------|----------|------|
| **Free** | Limited queries, basic data | $0 (1000/month) |
| **API** | Full access, bulk queries | Custom pricing |

**API Documentation:** [OpenCorporates API](https://api.opencorporates.com/documentation/API-Reference)

**Sample Query:**
```typescript
// Search for companies
const response = await fetch(
  `https://api.opencorporates.com/v0.4/companies/search?q=${encodeURIComponent(companyName)}&jurisdiction_code=de`
);
```

### 5.2 Free Alternatives

| Source | Data | URL |
|--------|------|-----|
| **Companies House (UK)** | UK company registry | https://developer.company-information.service.gov.uk/ |
| **SEC EDGAR (US)** | US public company filings | https://www.sec.gov/developer |
| **EU Business Registers** | Varies by country | National registries |

---

## 6. Data Fetching & Caching Strategy

### 6.1 Scheduled Data Updates

```typescript
// src/lib/jobs/data-sync.ts

// Daily: LEI cache refresh for watched entities
schedule('0 2 * * *', async () => {
  const watchedLEIs = await db.vendors.select('lei').whereNotNull('lei');
  for (const { lei } of watchedLEIs) {
    await refreshLEICache(lei);
  }
});

// Weekly: Framework control updates check
schedule('0 3 * 0', async () => {
  await checkFrameworkUpdates();
});

// Monthly: Regulatory document check
schedule('0 4 1 * *', async () => {
  await checkRegulatoryUpdates();
});
```

### 6.2 Caching Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    CACHING ARCHITECTURE                      │
└─────────────────────────────────────────────────────────────┘

                   Request
                      │
                      ▼
              ┌───────────────┐
              │  In-Memory    │  TTL: 5 minutes
              │  (Next.js)    │  Hot data, user sessions
              └───────┬───────┘
                      │ Miss
                      ▼
              ┌───────────────┐
              │  Supabase     │  TTL: 24 hours - 7 days
              │  (PostgreSQL) │  LEI records, framework data
              └───────┬───────┘
                      │ Miss
                      ▼
              ┌───────────────┐
              │  External API │  Rate limited
              │  (GLEIF, etc) │  Fallback + update cache
              └───────────────┘
```

### 6.3 Database Tables for Cached Data

```sql
-- LEI cache table
CREATE TABLE lei_cache (
  lei TEXT PRIMARY KEY,
  legal_name TEXT NOT NULL,
  legal_address JSONB,
  jurisdiction TEXT,
  status TEXT,
  parent_lei TEXT,
  ultimate_parent_lei TEXT,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days'
);

CREATE INDEX idx_lei_cache_expires ON lei_cache(expires_at);

-- Framework updates tracking
CREATE TABLE framework_versions (
  framework_code TEXT PRIMARY KEY,
  current_version TEXT,
  last_checked TIMESTAMPTZ DEFAULT NOW(),
  source_url TEXT,
  changelog_url TEXT
);
```

---

## 7. Implementation Checklist

### Phase 1 (Foundation) - P0
- [ ] Download and parse ESA DORA DPM 4.0
- [ ] Implement GLEIF LEI validation API integration
- [ ] Seed DORA controls from official regulation
- [ ] Set up LEI caching layer

### Phase 2 (AI Parsing) - P0
- [ ] Download SOC 2 TSC controls list
- [ ] Download ISO 27001:2022 controls list
- [ ] Build SOC 2 ↔ DORA mapping table
- [ ] Build ISO 27001 ↔ DORA mapping table

### Phase 3 (RoI Engine) - P0
- [ ] Parse xBRL taxonomy for validation rules
- [ ] Implement all 15 template generators
- [ ] Download and implement ESA validation rules
- [ ] Test against sample xBRL-CSV files

### Phase 4 (Scale) - P1
- [ ] Download NIST CSF 2.0 JSON
- [ ] Implement cross-framework gap analysis
- [ ] Set up framework update monitoring

### Future - P2
- [ ] Evaluate SecurityScorecard/BitSight integration
- [ ] Evaluate company enrichment APIs
- [ ] Implement regulatory change tracking

---

## 8. Cost Estimation

| Data Source | Phase | Cost | Notes |
|-------------|-------|------|-------|
| ESA/EBA Downloads | 1-3 | Free | Official regulatory data |
| GLEIF LEI API | 1 | Free | 1000 requests/day |
| AICPA SOC 2 TSC | 2 | Free* | May require AICPA membership |
| ISO 27001 Controls | 2 | Free | Community resources |
| NIST CSF 2.0 | 4 | Free | US government resource |
| SCF Mappings | 4 | ~$500 | Optional, can build own |
| SecurityScorecard | Future | $$$$ | Enterprise pricing |
| BitSight | Future | $$$$ | Enterprise pricing |
| OpenCorporates | Future | Custom | Depends on volume |

**Total for MVP: $0 - $500**

---

## References

### Official Regulatory Sources
- [EBA DORA Preparation](https://www.eba.europa.eu/activities/direct-supervision-and-oversight/digital-operational-resilience-act/preparation-dora-application)
- [EBA Reporting Frameworks](https://www.eba.europa.eu/risk-and-data-analysis/reporting-frameworks)
- [EUR-Lex DORA Regulation](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554)

### API Documentation
- [GLEIF API](https://www.gleif.org/en/lei-data/gleif-api)
- [NIST CSF 2.0 Reference Tool](https://csrc.nist.gov/News/2023/just-released-nist-csf-2-0-reference-tool)
- [SecurityScorecard API](https://securityscorecard.readme.io/reference/introduction)
- [BitSight API](https://help.bitsighttech.com/hc/en-us/categories/360005934253-Bitsight-API)

### Framework Resources
- [AICPA SOC 2 TSC](https://www.aicpa-cima.com/resources/download/2017-trust-services-criteria-with-revised-points-of-focus-2022)
- [ISO 27001:2022 Controls](https://hightable.io/iso-27001-annex-a-controls-list/)
- [SCF STRM Mappings](https://securecontrolsframework.com/strm-bundle/)
