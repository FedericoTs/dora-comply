# NIS2 Third-Party Risk Management: Competitive Research

> **Research Date:** January 2026
> **Objective:** Understand the EMEA TPRM landscape to build a 10X better solution

---

## Executive Summary

To dominate the NIS2 TPRM market, we must understand:
1. What competitors offer (and their gaps)
2. What documents/certifications exist in EMEA (not just US-centric SOC 2)
3. What questionnaire frameworks are used
4. What the actual NIS2 requirements mandate
5. What the typical TPRM workflow looks like

**Key Insight:** 73% of companies experienced a cybersecurity incident caused by a third-party vendor in the past 3 years. The market is ripe for disruption.

---

## 1. Competitor Analysis

### Tier 1: Enterprise Platforms

| Platform | Strengths | Weaknesses | Pricing |
|----------|-----------|------------|---------|
| **[OneTrust](https://www.onetrust.com/products/third-party-risk-management/)** | AI engine (Athena), pre-completed questionnaires, broad integrations | Generalized AI not TPRM-specific, complex UI, vendor lock-in | Enterprise ($$$) |
| **[BitSight](https://www.bitsight.com/)** | 40M+ orgs monitored, AI document analysis, predictive forecasting | US-centric, expensive | Enterprise ($$$) |
| **[SecurityScorecard](https://securityscorecard.com/)** | A-F rating system, dark web monitoring, 10 risk factors | Less EMEA-focused | Enterprise ($$) |
| **[Prevalent (Mitratech)](https://mitratech.com/solutions/risk-compliance/third-party-risk-management/)** | 10,000+ vendor risk reports exchange, dedicated TPRM experts | Complex, overwhelming features | Enterprise ($$$) |

### Tier 2: Mid-Market / European Focus

| Platform | Strengths | Weaknesses | Pricing |
|----------|-----------|------------|---------|
| **[3rdRisk](https://www.3rdrisk.com/)** | Built for NIS2/DORA/GDPR, 10-day implementation, embedded AI, KPMG partnership | Newer player, less market share | Mid-market (€€) |
| **[Supplier Shield](https://www.suppliershield.com/)** | Simple UI, NIS2/DORA native, managed services option | Less feature-rich | Starting €499/year |
| **[Ceeyu](https://www.ceeyu.io/)** | Automated + questionnaire assessments, EU-focused | Smaller vendor database | Mid-market (€€) |
| **[RiskRecon (Mastercard)](https://www.riskrecon.com/)** | Strong accuracy, cloud scanning, 4th-party detection | Less customizable | Enterprise ($$) |

### Competitor Workflow Features

Based on [3rdRisk comparison](https://www.3rdrisk.com/compare/onetrust) and [UpGuard analysis](https://www.upguard.com/blog/top-vendor-risk-monitoring-solutions):

| Feature | OneTrust | 3rdRisk | BitSight | Gap to Exploit |
|---------|----------|---------|----------|----------------|
| Vendor onboarding automation | ✅ | ✅ | ✅ | All similar |
| AI document parsing | ✅ | ✅ | ✅ | Focus on EMEA docs |
| NIS2-native workflows | ❌ | ✅ | ❌ | **Opportunity** |
| Pre-filled questionnaires | ✅ | ⚠️ | ⚠️ | EMEA-specific needed |
| Concentration risk (HHI) | ⚠️ | ⚠️ | ⚠️ | **Opportunity** |
| Contract clause checking | ❌ | ❌ | ❌ | **Major opportunity** |
| 4th-party mapping | ⚠️ | ⚠️ | ✅ | Visual graphs needed |
| Real-time monitoring | ✅ | ⚠️ | ✅ | Cert expiry focus |

---

## 2. EMEA Security Certifications & Attestations

### The Problem with SOC 2 in Europe

SOC 2 is US-centric (AICPA standard). While accepted globally, **European regulators and enterprises prefer:**

| Certification | Region | Description | Relevance |
|---------------|--------|-------------|-----------|
| **[ISO 27001](https://www.iso.org/iso-27001-information-security.html)** | International (EMEA preferred) | ISMS certification, pass/fail, 3-year validity | **Primary** - Required by most EU enterprises |
| **[ISAE 3402](https://isae3402.co.uk/)** | International/Europe | Financial reporting controls (like SOC 1) | Finance sector |
| **[ISAE 3000](https://www.pwc.ch/en/insights/digital/iso-27001-vs-isae-soc.html)** | International/Europe | Trust Service Principles (like SOC 2) | Growing adoption |
| **[BSI C5](https://www.bsi.bund.de/EN/Themen/Unternehmen-und-Organisationen/Informationen-und-Empfehlungen/Empfehlungen-nach-Angriffszielen/Cloud-Computing/Kriterienkatalog-C5/kriterienkatalog-c5_node.html)** | Germany | Cloud security attestation, 121 controls, Type 1/2 | **Mandatory** for German govt/regulated |
| **[Cyber Essentials](https://www.ncsc.gov.uk/cyberessentials/overview)** | UK | Basic cyber hygiene certification | UK market entry |
| **[SecNumCloud](https://www.ssi.gouv.fr/entreprise/qualifications/prestataires-de-services-de-confiance-qualifies/prestataires-de-service-dinformatique-en-nuage-secnumcloud/)** | France | French cloud security qualification | French govt |
| **[EUCS](https://www.enisa.europa.eu/topics/certification/eu-cybersecurity-certification-framework/eucs)** | EU-wide (coming) | EU Cloud Certification Scheme | Future standard |

### Key Documents to Collect from EMEA Vendors

Per [BitSight](https://www.bitsight.com/blog/vendor-risk-assessment-iso-27001-requirements) and [UpGuard](https://www.upguard.com/blog/iso-27001-third-party-risk-requirements):

**Tier 1 - Critical Vendors:**
1. ISO 27001 Certificate + Statement of Applicability (SoA)
2. Penetration Test Report (executive summary)
3. Business Continuity Plan summary
4. Incident Response Plan
5. Data Processing Agreement (GDPR Article 28)
6. Sub-processor list

**Tier 2 - High-Risk Vendors:**
1. ISO 27001 Certificate OR completed security questionnaire
2. Insurance certificate (cyber liability)
3. GDPR compliance attestation

**Tier 3 - Standard Vendors:**
1. Security questionnaire (SIG Lite or custom)
2. Basic compliance attestation

### Document Verification Requirements

From [Pivot Point Security](https://www.pivotpointsecurity.com/upping-the-due-diligence-with-your-iso-27001-certified-vendors/):

> "A certificate is not proof. Always request scope documents and expiration dates."

**Must verify:**
- Certificate validity dates
- Scope of certification (does it cover the services you're using?)
- Statement of Applicability (what controls are in/out of scope?)
- Last audit date
- Certification body accreditation

---

## 3. Questionnaire Frameworks

### Major Frameworks

| Framework | Questions | Best For | EMEA Support |
|-----------|-----------|----------|--------------|
| **[SIG (Shared Assessments)](https://sharedassessments.org/)** | 150-1,000+ | Financial services, large enterprises | ✅ NIS2/DORA mapping added 2025 |
| **[CAIQ (CSA)](https://cloudsecurityalliance.org/artifacts/consensus-assessments-initiative-questionnaire)** | 261 | Cloud providers | ✅ Good for SaaS vendors |
| **[VSA (Vendor Security Alliance)](https://www.vendorsecurityalliance.org/)** | ~150 | Tech companies | ✅ Includes GDPR section |
| **Custom/Proprietary** | Variable | Organization-specific | ⚠️ Creates vendor fatigue |

### SIG 2025 Updates (Critical for NIS2)

From [Shared Assessments](https://sharedassessments.org/blog/2025-sig/) and [Mitratech](https://mitratech.com/resource-hub/blog/sig-2025-key-updates-and-considerations/):

New mappings added:
- **DORA** - Article 18 incident reporting, ICT risk management
- **NIS2** - Article 29 information sharing, supply chain security
- **NIST CSF 2.0** - Updated controls

**Key SIG 2025 Controls for NIS2:**
- C.11, C.12: Cybersecurity information exchange (NIS2 Art. 29)
- J.11: Outsourced incident reporting (DORA Art. 18)

### Questionnaire Fatigue Problem

From [UpGuard](https://www.upguard.com/blog/top-vendor-assessment-questionnaires):

> "Large vendors receive dozens or hundreds of security questionnaires annually... leading to rushed responses, copy-pasted answers, or outright refusal."

**Solution Opportunity:** Build a questionnaire exchange/trust network where vendors complete once and share with multiple customers.

---

## 4. NIS2 Requirements Deep Dive

### Article 21 Supply Chain Requirements

From [NIS-2-Directive.com](https://www.nis-2-directive.com/NIS_2_Directive_Article_21.html) and [EY](https://www.ey.com/en_pl/insights/law/nis2-supply-chain-security):

> "Supply chain security, including security-related aspects concerning the relationships between each entity and its direct suppliers or service providers."

**Mandatory Measures:**
1. Risk assessments of ICT supply chain
2. Supplier relationship management
3. Vulnerability handling in products/components
4. Quality assessment of cybersecurity practices

### Contract Requirements

From [DLA Piper](https://www.dlapiper.com/en-us/insights/publications/2025/12/nis2-directive-explained-part-3-supply-chain-security) and [DataGuard](https://www.dataguard.com/nis2/requirements/):

| Clause | Requirement | Timeline |
|--------|-------------|----------|
| **Incident Notification** | Vendor must notify within 24 hours | First notification: 24h, Full report: 1 week |
| **Audit Rights** | Customer may conduct annual audits | 5 business days notice |
| **SLA Requirements** | Define security SLAs | Contractual |
| **Flow-Down** | Same terms for subcontractors | Mandatory |
| **Termination** | Right to terminate for breach | Immediate for material breach |

### Vendor Tiering (NIS2 Best Practice)

From [BitSight](https://www.bitsight.com/blog/nis2-compliance-how-to-identify-critical-suppliers) and [Panorays](https://panorays.com/blog/nis2-compliance-for-third-party-risk-management/):

| Tier | Criteria | Assessment Frequency | Due Diligence Level |
|------|----------|---------------------|---------------------|
| **Critical** | Direct access to core systems, sensitive data | Continuous + Annual deep dive | Full (all documents) |
| **High-Risk** | IT infra, cloud, security services | Semi-annual | Comprehensive |
| **Medium-Risk** | Business process outsourcing | Annual | Standard questionnaire |
| **Low-Risk** | Non-technical services | Every 2-3 years | Basic |

### Penalties

- Essential entities: Up to €10M or **2% of global turnover**
- Important entities: Up to €7M or **1.4% of global turnover**
- Senior management faces **personal liability**

---

## 5. ENISA Good Practices

From [ENISA Report (June 2023)](https://www.enisa.europa.eu/publications/good-practices-for-supply-chain-cybersecurity):

### Survey Findings

| Metric | Percentage |
|--------|------------|
| Organizations with supply chain policies | 86% |
| **Lack dedicated TPRM roles** | 76% |
| Require security certification from suppliers | 61% |
| Use security rating services | 43% |
| Conduct due diligence/risk assessments | 37% |
| Impacted by third-party incident | 39-62% |

### Recommended Assessment Methods

1. **Questionnaires** - Gauge cybersecurity maturity (automate regular basis)
2. **External Data Insights** - Bridge gap from subjective to objective evidence
3. **On-site Assessments** - For high-risk suppliers
4. **Certification Requirements** - ISO 27001, SOC 2, etc.

### Four Key Risk Areas (NIS2-aligned)

1. Risk assessment of ICT/OT supply chain
2. Management of supplier relationships
3. Handling vulnerabilities in products/components
4. Quality of products and cybersecurity practices

---

## 6. Typical TPRM Workflow (EMEA)

### Lifecycle Phases

From [SecurityScorecard](https://securityscorecard.com/blog/complete-third-party-risk-management-guide/) and [BitSight](https://www.bitsight.com/learn/tprm/vendor-management-lifecycle):

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         TPRM LIFECYCLE                                   │
├──────────┬──────────┬──────────┬──────────┬──────────┬──────────────────┤
│ 1.SOURCE │ 2.ONBOARD│ 3.ASSESS │ 4.MONITOR│ 5.MANAGE │ 6.OFFBOARD       │
├──────────┼──────────┼──────────┼──────────┼──────────┼──────────────────┤
│ • RFP    │ • Intake │ • Tier   │ • Contin-│ • Issue  │ • Access revoke  │
│ • Initial│   form   │   assign │   uous   │   track  │ • Data return/   │
│   screen │ • Docs   │ • Quest- │   monitor│ • Audit  │   destroy        │
│ • Due    │   collect│   ionnaire│ • Alert │ • Contract│ • Final audit   │
│   diligence• Contract│ • Risk   │   on     │   review │ • Documentation │
│          │   sign   │   score  │   changes│          │                  │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────────────┘
```

### Documents Exchanged at Each Phase

**Phase 1: Sourcing**
- Vendor basic information
- Initial risk screening results
- Business justification

**Phase 2: Onboarding**
- Master Service Agreement (MSA)
- Data Processing Agreement (DPA) - GDPR Art. 28
- Security Exhibit / Schedule
- Insurance certificates
- ISO 27001 / certifications

**Phase 3: Assessment**
- Security questionnaire (SIG/CAIQ/VSA)
- Penetration test report
- SOC 2 / ISAE 3000 report
- Business continuity plan
- Incident response plan

**Phase 4: Monitoring**
- Security rating updates
- Certificate expiry tracking
- News/breach alerts
- Continuous scan results

**Phase 5: Management**
- Issue remediation tracking
- Annual review documentation
- Contract amendments
- Audit findings

**Phase 6: Offboarding**
- Data destruction certificate
- Access removal confirmation
- Final compliance attestation

---

## 7. Opportunities for 10X Differentiation

### Gap Analysis: What Competitors Miss

| Gap | Current State | 10X Opportunity |
|-----|---------------|-----------------|
| **EMEA Document Support** | US-centric (SOC 2 focused) | AI parsing of ISO 27001 SoA, BSI C5, ISAE 3402 |
| **Contract Compliance** | Manual review | AI-powered clause detection (audit rights, incident notification) |
| **Concentration Risk** | Basic or none | Real-time HHI calculation with "what-if" scenarios |
| **4th-Party Visibility** | Limited | Visual supply chain graph with attack path analysis |
| **Questionnaire Fatigue** | Each customer sends own | Pre-filled from documents + trust network |
| **NIS2-Native** | Bolt-on compliance | Purpose-built for Article 21 requirements |
| **Real-time Monitoring** | Security ratings only | Cert expiry + news + breach + rating combined |
| **Evidence Auto-Collection** | Manual upload | API integrations + document parsing + verification |

### Proposed Differentiators

1. **EMEA-First Document Intelligence**
   - Parse ISO 27001 SoA to auto-fill questionnaires
   - Validate BSI C5 attestations
   - Extract ISAE 3402/3000 control findings
   - OCR European documents in multiple languages

2. **Contract Clause Analyzer**
   - AI detection of NIS2-required clauses
   - Gap report: "Missing audit rights clause"
   - Template generator with compliant language

3. **Supply Chain Concentration Dashboard**
   - HHI index visualization
   - Single point of failure detection
   - "What if Vendor X fails?" simulation
   - Geographic concentration mapping

4. **Questionnaire Intelligence**
   - Auto-fill from uploaded documents
   - Response quality scoring
   - Inconsistency detection
   - SIG 2025 NIS2/DORA mapping

5. **Continuous Compliance Score**
   - Weighted scoring across all evidence types
   - Real-time alerts on compliance drift
   - Regulatory deadline tracking

---

## 8. Recommended Next Steps

### Immediate (This Sprint)

1. **Research Validation**
   - Interview 3-5 EU compliance officers
   - Understand their current pain points
   - Validate document types they actually use

2. **Competitive Demo**
   - Get demos of 3rdRisk, Supplier Shield, Ceeyu
   - Document exact workflows
   - Identify UX gaps

### Short-term (Next Month)

3. **Document Parser POC**
   - Build parser for ISO 27001 certificates
   - Extract: validity dates, scope, certification body
   - Test with real European vendor documents

4. **NIS2 Contract Template**
   - Create compliant contract schedule
   - Include all required clauses
   - AI checker for uploaded contracts

### Medium-term (Next Quarter)

5. **Concentration Risk Module**
   - HHI calculation engine
   - Visual dependency graph
   - Scenario simulator

6. **Questionnaire Engine**
   - Support SIG Lite, CAIQ, VSA
   - Auto-fill from documents
   - NIS2 requirement mapping

---

## Sources

### Competitors
- [3rdRisk vs OneTrust](https://www.3rdrisk.com/compare/onetrust)
- [OneTrust TPRM](https://www.onetrust.com/products/third-party-risk-management/)
- [BitSight Security Ratings](https://www.bitsight.com/security-ratings)
- [UpGuard Competitor Analysis](https://www.upguard.com/competitors/securityscorecard)
- [Supplier Shield](https://www.suppliershield.com/post/third-party-risk-management-software-what-you-need-to-know-in-2025)

### European Certifications
- [BSI C5 Criteria](https://www.bsi.bund.de/EN/Themen/Unternehmen-und-Organisationen/Informationen-und-Empfehlungen/Empfehlungen-nach-Angriffszielen/Cloud-Computing/Kriterienkatalog-C5/kriterienkatalog-c5_node.html)
- [A-LIGN SOC 2 vs ISO 27001](https://www.a-lign.com/articles/will-soc-2-take-the-place-of-iso-27001-in-the-uk-eu)
- [PwC ISO vs ISAE](https://www.pwc.ch/en/insights/digital/iso-27001-vs-isae-soc.html)

### Questionnaire Frameworks
- [Shared Assessments SIG 2025](https://sharedassessments.org/blog/2025-sig/)
- [BitSight CAIQ vs SIG](https://www.bitsight.com/blog/caiq-vs-sig-top-questionnaires-vendor-risk-assessment)
- [UpGuard Top Questionnaires](https://www.upguard.com/blog/top-vendor-assessment-questionnaires)

### NIS2 Requirements
- [NIS2 Article 21](https://www.nis-2-directive.com/NIS_2_Directive_Article_21.html)
- [DLA Piper NIS2 Supply Chain](https://www.dlapiper.com/en-us/insights/publications/2025/12/nis2-directive-explained-part-3-supply-chain-security)
- [BitSight NIS2 Critical Suppliers](https://www.bitsight.com/blog/nis2-compliance-how-to-identify-critical-suppliers)
- [DataGuard NIS2 Requirements](https://www.dataguard.com/nis2/requirements/)

### ENISA & Best Practices
- [ENISA Supply Chain Good Practices](https://www.enisa.europa.eu/publications/good-practices-for-supply-chain-cybersecurity)
- [SecurityScorecard TPRM Guide](https://securityscorecard.com/blog/complete-third-party-risk-management-guide/)
