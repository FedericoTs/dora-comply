# Regulatory Requirements Specification

**Document Status:** [CURRENT]
**Last Updated:** 2024-12-28
**Sources:** DORA Compliance Skill, TPRM Domain Skill, SOC 2 Reports Skill

---

## Executive Summary

This document defines the regulatory requirements that our AI-powered TPRM platform must satisfy to serve EU financial institutions under DORA (Digital Operational Resilience Act), with support for US regulatory frameworks for multi-jurisdictional clients.

---

## Primary Regulation: DORA

### Applicable Scope

| Entity Type | Count | Our Target Segment |
|-------------|-------|-------------------|
| Credit Institutions | 6,000+ | Primary |
| Payment Institutions | 2,500+ | Primary |
| Investment Firms | 8,000+ | Secondary |
| Insurance/Reinsurance | 3,500+ | Secondary |
| Crypto Asset Providers | 1,000+ | Tertiary |
| ICT Third-Party Providers | 500+ | Partner/User |

### Critical Deadlines

| Date | Requirement | Platform Feature Required |
|------|-------------|--------------------------|
| **January 17, 2025** | DORA fully applicable | Compliance readiness dashboard |
| **April 30, 2025** | First RoI submission | RoI generation & export (xBRL-CSV) |
| **Q1 2026** | TLPT cycle begins | Testing management module |
| **October 2027** | DORA review report | Trend analytics & reporting |

---

## DORA Pillar Requirements Mapping

### Pillar 1: ICT Risk Management (Articles 5-16)

**Platform Requirements:**

| Requirement | DORA Article | Platform Feature | Priority |
|-------------|--------------|-----------------|----------|
| ICT risk management framework | Art. 6 | Risk framework templates | P1 |
| Asset inventory | Art. 8 | Vendor/asset registry | P0 |
| Risk identification | Art. 9 | AI-powered risk scoring | P0 |
| Risk treatment | Art. 10 | Remediation tracking | P1 |
| Continuous monitoring | Art. 13 | Real-time risk dashboard | P1 |
| Board oversight | Art. 5 | Executive reporting | P1 |

**Data Model Requirements:**

```typescript
interface ICTRiskManagement {
  // Required by DORA Article 8
  assetInventory: {
    hardware: ICTAsset[];
    software: ICTAsset[];
    data: DataAsset[];
    networkComponents: NetworkAsset[];
  };

  // Required by DORA Article 9
  riskAssessment: {
    inherentRisks: Risk[];
    residualRisks: Risk[];
    riskTolerance: RiskTolerance;
    treatmentPlans: TreatmentPlan[];
  };

  // Required by DORA Article 13
  monitoring: {
    metrics: RiskMetric[];
    alerts: AlertConfiguration[];
    dashboards: Dashboard[];
  };
}
```

### Pillar 2: ICT Incident Management (Articles 17-23)

**Platform Requirements:**

| Requirement | DORA Article | Platform Feature | Priority |
|-------------|--------------|-----------------|----------|
| Incident classification | Art. 18 | Classification engine | P1 |
| Reporting timelines | Art. 19 | Notification workflow | P1 |
| Major incident reporting | Art. 19 | Regulator reporting | P1 |
| Root cause analysis | Art. 17 | Post-incident module | P2 |

**Classification Criteria (DORA Article 18):**

| Severity | Criteria | Reporting Timeline |
|----------|----------|-------------------|
| Major | >100K customers OR >10% service OR Cross-border | 4h initial, 72h intermediate, 1mo final |
| Significant | Material operational impact | 72 hours |
| Minor | Limited impact | Internal logging |

### Pillar 3: Digital Resilience Testing (Articles 24-27)

**Platform Requirements:**

| Requirement | DORA Article | Platform Feature | Priority |
|-------------|--------------|-----------------|----------|
| Vulnerability assessment | Art. 24 | Scan integration | P2 |
| Penetration testing | Art. 25 | Test tracking | P1 |
| TLPT management | Art. 26-27 | TLPT module | P2 |
| Testing evidence | Art. 24 | Evidence repository | P1 |

### Pillar 4: ICT Third-Party Risk Management (Articles 28-44)

**This is the PRIMARY platform focus.**

**Platform Requirements:**

| Requirement | DORA Article | Platform Feature | Priority |
|-------------|--------------|-----------------|----------|
| Register of Information | Art. 28 | **RoI automation** | **P0** |
| Pre-contract assessment | Art. 29 | Due diligence workflow | P0 |
| Contract provisions | Art. 30 | Contract analyzer | P1 |
| Exit strategies | Art. 32 | Exit planning module | P2 |
| Concentration risk | Art. 29 | Concentration dashboard | P1 |
| Subcontracting visibility | Art. 29 | 4th party detection | P1 |
| CTPP oversight | Art. 31-44 | CTPP flagging | P2 |

**Register of Information (RoI) Data Requirements:**

Per ESA ITS templates, the RoI must include:

```typescript
interface RegisterOfInformation {
  // Entity identification
  entityLEI: string;                    // Legal Entity Identifier
  entityName: string;
  entityType: DORAEntityType;

  // Contract register (per ICT provider)
  contracts: ICTServiceContract[];

  // Provider details
  providers: ICTThirdPartyProvider[];

  // Service mapping
  services: ICTService[];

  // Risk assessment
  riskAssessments: ProviderRiskAssessment[];

  // Subcontracting chain
  subcontractors: SubcontractorInfo[];
}

interface ICTThirdPartyProvider {
  providerLEI: string;                  // Required
  providerName: string;
  providerType: ProviderType;
  jurisdiction: string;                 // ISO country code
  isCritical: boolean;
  criticality: 'critical' | 'important' | 'standard';

  // DORA Article 30 contract provisions
  dataLocation: string[];
  dataAccessLevel: DataAccessLevel;
  auditRights: boolean;
  subcontractingApproval: boolean;
  exitProvisions: boolean;
}

interface ICTServiceContract {
  contractId: string;
  providerId: string;
  serviceDescription: string;
  startDate: Date;
  endDate: Date;

  // Critical function support
  supportsCriticalFunction: boolean;
  criticalFunctions: string[];

  // Data handling
  personalDataProcessed: boolean;
  dataCategories: string[];

  // SLA metrics
  availabilitySLA: number;              // Percentage
  rtoHours: number;
  rpoHours: number;
}
```

**xBRL-CSV Export Format:**

The platform must export RoI in ESA-compliant xBRL-CSV format:
- Entity template
- Contract register template
- Provider template
- Service template
- Intra-group template (if applicable)

### Pillar 5: Information Sharing (Articles 45-49)

**Platform Requirements:**

| Requirement | DORA Article | Platform Feature | Priority |
|-------------|--------------|-----------------|----------|
| Threat intelligence | Art. 45 | Threat feed integration | P3 |
| Voluntary sharing | Art. 45 | Community features | P3 |
| Data protection | Art. 46 | Privacy controls | P2 |

---

## SOC 2 Document Parsing Requirements

### AI Parsing Extraction Targets

When parsing SOC 2 Type II reports, the platform must extract:

| Section | Data to Extract | Use Case |
|---------|-----------------|----------|
| Opinion | Qualified/Unqualified | Risk scoring |
| Management Assertion | Control period, scope | Validation |
| System Description | Services, infrastructure, boundaries | RoI population |
| Control Activities | Control objectives, tests, results | Gap analysis |
| Exceptions | Control failures, management response | Risk assessment |
| CUECs | User responsibilities | Compliance guidance |
| Subservice Organizations | Subcontractor list, carve-outs | 4th party mapping |

**Extraction Schema:**

```typescript
interface ParsedSOC2Report {
  // Metadata
  reportType: 'Type I' | 'Type II';
  auditFirm: string;
  reportDate: Date;
  periodStart?: Date;               // Type II only
  periodEnd?: Date;                 // Type II only

  // Opinion
  opinion: 'unqualified' | 'qualified' | 'adverse';
  opinionBasis?: string;            // If qualified

  // Scope
  trustServicesCriteria: ('security' | 'availability' | 'confidentiality' | 'processing_integrity' | 'privacy')[];
  systemDescription: string;

  // Controls
  controls: SOC2Control[];

  // Exceptions
  exceptions: ControlException[];

  // Subservice Organizations
  subserviceOrgs: SubserviceOrg[];
  inclusionMethod: 'inclusive' | 'carve-out';

  // CUECs
  cueCs: ComplementaryUserControl[];
}

interface SOC2Control {
  controlId: string;
  category: TrustServiceCategory;
  objective: string;
  description: string;
  testProcedure: string;
  testResult: 'no exceptions' | 'exception noted';
  exception?: ControlException;

  // DORA mapping
  doraMapping?: {
    pillar: number;
    article: number;
    requirement: string;
  };
}
```

### ISO 27001 Certificate Parsing

**Extraction Targets:**

```typescript
interface ParsedISO27001 {
  certificateNumber: string;
  certificationBody: string;
  accreditationBody: string;

  issueDate: Date;
  expiryDate: Date;

  scope: string;
  locations: string[];

  // Statement of Applicability (if available)
  soaControls?: SOAControl[];

  // DORA relevance
  doraRelevance: {
    coversICTRiskManagement: boolean;
    coversIncidentManagement: boolean;
    coversBusinessContinuity: boolean;
  };
}
```

### Penetration Test Report Parsing

**Extraction Targets:**

```typescript
interface ParsedPenTestReport {
  testingFirm: string;
  testDate: Date;
  testType: 'external' | 'internal' | 'web application' | 'social engineering';

  scope: string[];
  methodology: string;              // e.g., OWASP, PTES

  findings: PenTestFinding[];

  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    informational: number;
  };

  // DORA Article 25 compliance
  meetsDoraRequirements: boolean;
  doraGaps?: string[];
}
```

---

## TPRM Lifecycle Requirements

### Vendor Tiering Criteria

Per TPRM domain best practices and DORA criticality assessment:

| Factor | Critical | High | Medium | Low |
|--------|----------|------|--------|-----|
| DORA Critical Function | Supports critical | Adjacent | Indirect | None |
| Data Sensitivity | PII/Financial | Confidential | Internal | Public |
| Availability Impact | >4h = major incident | 4-24h impact | 24-72h | >72h |
| Replaceability | >6 months | 3-6 months | 1-3 months | <1 month |
| Customer Facing | Direct | Indirect | Support | None |

### Assessment Frequency Requirements

| Vendor Tier | Full Assessment | Monitoring | Contract Review |
|-------------|-----------------|------------|-----------------|
| Critical | Annual + event-driven | Continuous | Annual |
| High | Annual | Weekly | Annual |
| Medium | Every 2 years | Monthly | Biennial |
| Low | Every 3 years | Quarterly | As needed |

### Contract Provisions Checklist (DORA Article 30)

The platform must track compliance with these mandatory provisions:

```markdown
## DORA Article 30 Contract Requirements

### Service Description
[ ] Clear description of all services provided
[ ] Performance levels and SLAs
[ ] Data locations (jurisdiction)

### Security
[ ] Minimum security standards
[ ] Encryption requirements
[ ] Access control provisions

### Audit Rights
[ ] Right to audit (or accept third-party audits)
[ ] Access to premises
[ ] Cooperation with regulators

### Data Handling
[ ] Data processing locations
[ ] Data portability upon termination
[ ] Data destruction confirmation

### Subcontracting
[ ] Subcontractor approval rights
[ ] Flow-down of requirements
[ ] Notification of changes

### Business Continuity
[ ] BCP/DR requirements
[ ] RTO/RPO commitments
[ ] Testing participation

### Exit
[ ] Termination rights
[ ] Transition assistance period
[ ] Knowledge transfer obligations
[ ] Data return procedures
```

---

## US Regulatory Considerations

For clients operating in both US and EU jurisdictions:

### OCC 2013-29 (Third-Party Relationships)

| OCC Requirement | Platform Feature |
|-----------------|-----------------|
| Board oversight | Executive dashboards |
| Risk assessment lifecycle | Assessment workflows |
| Due diligence | Questionnaire automation |
| Contract negotiation | Clause tracking |
| Ongoing monitoring | Continuous monitoring |
| Termination | Exit planning |

### FFIEC CAT / NIST CSF 2.0

| Framework | Integration |
|-----------|------------|
| FFIEC CAT (sunsetting) | Legacy mapping |
| NIST CSF 2.0 | Control mapping |
| NIST SP 800-53 | Control crosswalk |

### Multi-Jurisdictional Strategy

The platform should:
1. Use DORA as the baseline (more prescriptive)
2. Map to US frameworks via crosswalks
3. Flag jurisdiction-specific requirements
4. Generate region-specific reports

---

## Data Residency Requirements

### DORA + GDPR Compliance

| Requirement | Implementation |
|-------------|---------------|
| EU data stays in EU | EU Supabase instance (Frankfurt) |
| Data location transparency | Jurisdiction tracking per vendor |
| Cross-border transfer | Transfer mechanism documentation |
| Right to audit | Location disclosure in RoI |

### Platform Architecture

```
US Customers          EU Customers
     │                     │
     ▼                     ▼
┌─────────┐          ┌─────────┐
│ US Edge │          │ EU Edge │
│ (iad1)  │          │ (fra1)  │
└────┬────┘          └────┬────┘
     │                     │
     ▼                     ▼
┌─────────┐          ┌─────────┐
│Supabase │          │Supabase │
│   US    │          │   EU    │
└─────────┘          └─────────┘
```

---

## Compliance Validation Rules

### RoI Data Quality Rules

The platform must enforce:

```typescript
const roiValidationRules = {
  // Required fields
  requiredFields: [
    'entityLEI',
    'providerLEI',
    'contractStartDate',
    'serviceDescription',
    'dataLocation',
  ],

  // Format validation
  formats: {
    lei: /^[A-Z0-9]{20}$/,           // LEI format
    countryCode: /^[A-Z]{2}$/,        // ISO 3166-1 alpha-2
    date: /^\d{4}-\d{2}-\d{2}$/,     // ISO 8601
  },

  // Business rules
  businessRules: [
    'criticalProviderMustHaveExitStrategy',
    'dataLocationMustMatchJurisdiction',
    'contractEndDateMustBeAfterStartDate',
    'subcontractorsMustHaveLEI',
  ],

  // Cross-validation
  crossValidation: [
    'sumOfServicesMatchesContract',
    'criticalFunctionsMappedToProviders',
  ],
};
```

### Document Parsing Accuracy Targets

| Document Type | Accuracy Target | Confidence Threshold |
|---------------|-----------------|---------------------|
| SOC 2 Reports | >95% | 0.85 |
| ISO 27001 Certs | >98% | 0.90 |
| Pen Test Reports | >90% | 0.80 |
| Contracts | >85% | 0.75 |

---

## Reporting Requirements

### Regulatory Reports

| Report | Audience | Frequency | Format |
|--------|----------|-----------|--------|
| Register of Information | NCA | Annual (April 30) | xBRL-CSV |
| Incident Reports | NCA | Event-driven | ESA template |
| TLPT Summary | NCA | Per test cycle | ESA template |

### Internal Reports

| Report | Audience | Frequency |
|--------|----------|-----------|
| Vendor Risk Dashboard | Compliance | Real-time |
| Concentration Analysis | Board | Quarterly |
| Assessment Status | CISO | Monthly |
| Compliance Readiness | Executive | Monthly |

---

## Summary: Feature Priority by Regulation

### P0 (Must-Have for Launch)

| Feature | Regulation Driver |
|---------|------------------|
| Vendor inventory | DORA Art. 28, OCC 2013-29 |
| RoI generation | DORA Art. 28 |
| AI SOC 2 parsing | TPRM efficiency |
| Risk scoring | DORA Art. 9 |
| EU data residency | GDPR, DORA |

### P1 (Required within 3 months)

| Feature | Regulation Driver |
|---------|------------------|
| Contract clause tracking | DORA Art. 30 |
| Concentration risk | DORA Art. 29 |
| 4th party detection | DORA Art. 29 |
| Continuous monitoring | DORA Art. 13 |
| Incident classification | DORA Art. 18 |

### P2 (Required within 6 months)

| Feature | Regulation Driver |
|---------|------------------|
| Exit planning | DORA Art. 32 |
| TLPT management | DORA Art. 26-27 |
| Multi-framework mapping | SOC 2, ISO, NIST |
| API ecosystem | Integration needs |

---

## References

- [DORA Regulation (EU 2022/2554)](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32022R2554)
- [EBA DORA Technical Standards](https://www.eba.europa.eu/activities/direct-supervision-and-oversight/digital-operational-resilience-act)
- [OCC 2013-29 Third-Party Relationships](https://www.occ.gov/news-issuances/bulletins/2013/bulletin-2013-29.html)
- [AICPA SOC 2 Criteria](https://us.aicpa.org/interestareas/frc/assuranceadvisoryservices/sorhome)
- [ISO 27001:2022](https://www.iso.org/standard/27001)
