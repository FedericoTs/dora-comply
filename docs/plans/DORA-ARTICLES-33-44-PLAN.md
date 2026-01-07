# DORA Articles 33-44 Implementation Plan

## Executive Summary

This plan adds the **missing DORA articles** to complete regulatory coverage from 24/64 (37.5%) to **45/64 (70%)**. The focus is on Chapter V Section II (Articles 33-44) for CTPP oversight, plus filling gaps in other pillars.

**Estimated Effort:** 4-6 hours
**Impact:** TPRM pillar coverage increases from 29% to ~82%

---

## Current State Analysis

### Articles Currently Implemented (24)

| Pillar | Articles | Count |
|--------|----------|-------|
| ICT Risk (Ch. II) | 5, 6, 7, 8, 9, 10, 11, 12, 13, 14 | 10/12 |
| Incident (Ch. III) | 17, 18, 19, 20 | 4/7 |
| Testing (Ch. IV) | 24, 25, 26, 27 | 4/4 |
| TPRM (Ch. V) | 28, 29, 30, 31, 32 | 5/17 |
| Sharing (Ch. VI) | 45 | 1/1 |

### Articles Missing (21)

| Pillar | Missing Articles | Priority |
|--------|------------------|----------|
| **ICT Risk** | 15, 16 | Medium |
| **Incident** | 21, 22, 23 | High |
| **TPRM** | 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44 | **Critical** |

---

## Research Summary

### Chapter V Section II: Oversight Framework for CTPPs

Based on [EUR-Lex DORA Regulation](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32022R2554) and [Digital Operational Resilience Act website](https://www.digital-operational-resilience-act.com/):

| Article | Title | Key Requirement |
|---------|-------|-----------------|
| **33** | Tasks of the Lead Overseer | Assess CTPP ICT risk management covering governance, security, BCP, incident reporting |
| **34** | Operational Coordination | Joint Oversight Network (JON) for consistent approaches between Lead Overseers |
| **35** | Powers of the Lead Overseer | Request info, conduct investigations, issue recommendations, impose penalties |
| **36** | Exercise of Powers Outside EU | Third-country inspections with consent and cooperation arrangements |
| **37** | Request for Information | Simple requests or binding decisions for documents, contracts, audit reports |
| **38** | General Investigations | Examine records, obtain copies, summon representatives, request telecom data |
| **39** | Inspections | On-site/off-site inspections with advance notice, seal records as needed |
| **40** | Ongoing Oversight | Joint examination teams from ESAs and competent authorities |
| **41** | Harmonisation of Conditions | RTS for voluntary designation, subcontracting templates, team composition |
| **42** | Follow-up by Competent Authorities | Inform entities of risks, may suspend services as last resort |
| **43** | Oversight Fees | CTPPs pay fees covering oversight expenditures proportionate to turnover |
| **44** | International Cooperation | Administrative arrangements with third-country regulators |

### Chapter II Missing Articles

| Article | Title | Key Requirement |
|---------|-------|-----------------|
| **15** | Further Harmonisation | ESAs develop RTS for ICT risk management tools, methods, processes, policies |
| **16** | Simplified Framework | Reduced requirements for small/non-interconnected entities |

### Chapter III Missing Articles

| Article | Title | Key Requirement |
|---------|-------|-----------------|
| **21** | Centralisation of Reporting | ESAs assess feasibility of single EU Hub for incident reporting |
| **22** | Supervisory Feedback | ESAs provide yearly aggregated reports, warnings, statistics |
| **23** | Payment Incident Reporting | Credit/e-money/payment institutions report operational security incidents |

---

## Implementation Details

### 1. New DORA Requirements to Add

#### 1.1 TPRM Pillar (Articles 33-44)

```typescript
// Article 33 - Tasks of the Lead Overseer
{
  id: 'dora-art-33',
  article_number: 'Art. 33',
  article_title: 'Tasks of the Lead Overseer',
  chapter: 'V',
  pillar: 'TPRM',
  requirement_text: 'The Lead Overseer shall assess whether critical ICT third-party service providers have in place comprehensive, sound and effective rules, procedures, mechanisms and arrangements to manage ICT risk. Assessment shall cover ICT security, service quality, physical security, risk management governance, and incident handling.',
  evidence_needed: [
    'CTPP designation assessment',
    'Lead Overseer assignment documentation',
    'Oversight plan acknowledgment',
    'ICT risk management evidence from CTPPs'
  ],
  is_mandatory: true,
  applies_to: ['ctpp', 'significant'],
  priority: 'critical',
}

// Article 34 - Operational Coordination
{
  id: 'dora-art-34',
  article_number: 'Art. 34',
  article_title: 'Operational Coordination Between Lead Overseers',
  chapter: 'V',
  pillar: 'TPRM',
  requirement_text: 'Lead Overseers shall establish a Joint Oversight Network (JON) to ensure consistent oversight approaches, coordinate strategies, develop common protocols, and facilitate information exchange regarding critical ICT third-party service providers.',
  evidence_needed: [
    'JON coordination records',
    'Cross-ESA communication logs',
    'Common oversight protocols'
  ],
  is_mandatory: true,
  applies_to: ['ctpp', 'significant'],
  priority: 'high',
}

// Article 35 - Powers of the Lead Overseer
{
  id: 'dora-art-35',
  article_number: 'Art. 35',
  article_title: 'Powers of the Lead Overseer',
  chapter: 'V',
  pillar: 'TPRM',
  requirement_text: 'The Lead Overseer may request information and documentation, conduct general investigations and inspections, issue recommendations on ICT security and service quality, and impose daily penalty payments up to 1% of worldwide turnover for non-compliance.',
  evidence_needed: [
    'Response to information requests',
    'Inspection readiness documentation',
    'Recommendation compliance evidence',
    'Penalty payment records (if applicable)'
  ],
  is_mandatory: true,
  applies_to: ['ctpp'],
  priority: 'critical',
}

// Article 36 - Exercise of Powers Outside the Union
{
  id: 'dora-art-36',
  article_number: 'Art. 36',
  article_title: 'Exercise of Powers Outside the Union',
  chapter: 'V',
  pillar: 'TPRM',
  requirement_text: 'Lead Overseers may conduct inspections at third-country premises owned or used by critical ICT third-party service providers, subject to consent, notification, and administrative cooperation arrangements with relevant third-country authorities.',
  evidence_needed: [
    'Third-country premises inventory',
    'Consent documentation for inspections',
    'Cooperation arrangements with foreign authorities'
  ],
  is_mandatory: true,
  applies_to: ['ctpp'],
  priority: 'medium',
}

// Article 37 - Request for Information
{
  id: 'dora-art-37',
  article_number: 'Art. 37',
  article_title: 'Request for Information',
  chapter: 'V',
  pillar: 'TPRM',
  requirement_text: 'The Lead Overseer may request critical ICT third-party service providers to provide business documents, contracts, policies, audit reports, and incident information through simple requests or binding decisions with specified timeframes.',
  evidence_needed: [
    'Information request response procedures',
    'Document retention policy',
    'Audit report availability',
    'Contract disclosure procedures'
  ],
  is_mandatory: true,
  applies_to: ['ctpp'],
  priority: 'high',
}

// Article 38 - General Investigations
{
  id: 'dora-art-38',
  article_number: 'Art. 38',
  article_title: 'General Investigations',
  chapter: 'V',
  pillar: 'TPRM',
  requirement_text: 'Lead Overseers may investigate critical ICT third-party service providers by examining records, obtaining certified copies, summoning representatives for explanations, and requesting telecommunications data relevant to oversight duties.',
  evidence_needed: [
    'Investigation cooperation procedures',
    'Record examination protocols',
    'Representative availability matrix',
    'Telecommunications data retention policy'
  ],
  is_mandatory: true,
  applies_to: ['ctpp'],
  priority: 'high',
}

// Article 39 - Inspections
{
  id: 'dora-art-39',
  article_number: 'Art. 39',
  article_title: 'Inspections',
  chapter: 'V',
  pillar: 'TPRM',
  requirement_text: 'Lead Overseers may conduct on-site and off-site inspections of critical ICT third-party service providers premises with reasonable advance notice, except during emergencies. Inspectors may seal records and request explanations.',
  evidence_needed: [
    'Inspection readiness procedures',
    'Facility access protocols',
    'Document sealing procedures',
    'Staff availability for inspections'
  ],
  is_mandatory: true,
  applies_to: ['ctpp'],
  priority: 'high',
}

// Article 40 - Ongoing Oversight
{
  id: 'dora-art-40',
  article_number: 'Art. 40',
  article_title: 'Ongoing Oversight',
  chapter: 'V',
  pillar: 'TPRM',
  requirement_text: 'Oversight activities shall be conducted through joint examination teams composed of staff from ESAs, relevant competent authorities, and national authorities, working under Lead Overseer coordination to complete investigations within three months.',
  evidence_needed: [
    'Joint examination team engagement records',
    'Ongoing oversight compliance evidence',
    'Three-month investigation timeline adherence'
  ],
  is_mandatory: true,
  applies_to: ['ctpp'],
  priority: 'high',
}

// Article 41 - Harmonisation of Conditions
{
  id: 'dora-art-41',
  article_number: 'Art. 41',
  article_title: 'Harmonisation of Conditions Enabling the Conduct of the Oversight',
  chapter: 'V',
  pillar: 'TPRM',
  requirement_text: 'ESAs shall develop regulatory technical standards specifying information for voluntary designation applications, subcontracting reporting templates, and joint examination team composition criteria.',
  evidence_needed: [
    'Voluntary designation application (if applicable)',
    'Subcontracting information template compliance',
    'RTS adherence documentation'
  ],
  is_mandatory: true,
  applies_to: ['ctpp', 'significant'],
  priority: 'medium',
}

// Article 42 - Follow-up by Competent Authorities
{
  id: 'dora-art-42',
  article_number: 'Art. 42',
  article_title: 'Follow-up by Competent Authorities',
  chapter: 'V',
  pillar: 'TPRM',
  requirement_text: 'Competent authorities shall inform financial entities of risks identified in Lead Overseer recommendations, may require service suspension as a last resort, and shall grant reasonable transition periods for contractual adjustments.',
  evidence_needed: [
    'Risk notification acknowledgments',
    'CTPP recommendation review records',
    'Contingency plans for service suspension',
    'Contract transition procedures'
  ],
  is_mandatory: true,
  applies_to: ['all'],
  priority: 'critical',
}

// Article 43 - Oversight Fees
{
  id: 'dora-art-43',
  article_number: 'Art. 43',
  article_title: 'Oversight Fees',
  chapter: 'V',
  pillar: 'TPRM',
  requirement_text: 'Critical ICT third-party service providers shall pay oversight fees covering ESA expenditures and joint examination team costs, calculated proportionately to their turnover.',
  evidence_needed: [
    'Fee payment records',
    'Turnover disclosure documentation',
    'Fee calculation methodology acknowledgment'
  ],
  is_mandatory: true,
  applies_to: ['ctpp'],
  priority: 'medium',
}

// Article 44 - International Cooperation
{
  id: 'dora-art-44',
  article_number: 'Art. 44',
  article_title: 'International Cooperation',
  chapter: 'V',
  pillar: 'TPRM',
  requirement_text: 'ESAs may conclude administrative arrangements with third-country financial regulators to foster cooperation on ICT third-party risk oversight and shall submit confidential reports every five years.',
  evidence_needed: [
    'International cooperation arrangements',
    'Third-country regulator engagement records',
    'Confidential reporting compliance'
  ],
  is_mandatory: false,
  applies_to: ['ctpp', 'significant'],
  priority: 'low',
}
```

#### 1.2 ICT Risk Pillar (Articles 15-16)

```typescript
// Article 15 - Further Harmonisation
{
  id: 'dora-art-15',
  article_number: 'Art. 15',
  article_title: 'Further Harmonisation of ICT Risk Management Tools',
  chapter: 'II',
  pillar: 'ICT_RISK',
  requirement_text: 'ESAs shall develop regulatory technical standards further harmonising ICT risk management tools, methods, processes and policies. Financial entities shall implement controls aligned with these technical standards.',
  evidence_needed: [
    'RTS compliance assessment',
    'Harmonised tools implementation evidence',
    'Process alignment documentation'
  ],
  is_mandatory: true,
  applies_to: ['all'],
  priority: 'high',
}

// Article 16 - Simplified Framework
{
  id: 'dora-art-16',
  article_number: 'Art. 16',
  article_title: 'Simplified ICT Risk Management Framework',
  chapter: 'II',
  pillar: 'ICT_RISK',
  requirement_text: 'Small and non-interconnected investment firms, exempted payment/e-money institutions, and small IORPs shall maintain a simplified ICT risk management framework with documented policies, continuous security monitoring, and identified third-party dependencies.',
  evidence_needed: [
    'Entity classification as eligible for simplified framework',
    'Simplified ICT risk framework documentation',
    'Periodic review records',
    'Key ICT third-party dependency list'
  ],
  is_mandatory: true,
  applies_to: ['small', 'exempted'],
  priority: 'medium',
}
```

#### 1.3 Incident Pillar (Articles 21-23)

```typescript
// Article 21 - Centralisation of Reporting
{
  id: 'dora-art-21',
  article_number: 'Art. 21',
  article_title: 'Centralisation of Reporting of Major ICT-related Incidents',
  chapter: 'III',
  pillar: 'INCIDENT',
  requirement_text: 'ESAs shall assess feasibility of establishing a single EU Hub for ICT-related incident reporting. Financial entities shall be prepared to adapt to centralised reporting mechanisms when implemented.',
  evidence_needed: [
    'Incident reporting system configuration',
    'EU Hub integration readiness assessment',
    'Multi-channel reporting capability'
  ],
  is_mandatory: true,
  applies_to: ['all'],
  priority: 'medium',
}

// Article 22 - Supervisory Feedback
{
  id: 'dora-art-22',
  article_number: 'Art. 22',
  article_title: 'Supervisory Feedback',
  chapter: 'III',
  pillar: 'INCIDENT',
  requirement_text: 'ESAs shall provide yearly aggregated reports on major ICT incidents including number, nature, impact, remedial actions, and costs. They shall issue warnings and statistics to support threat assessments.',
  evidence_needed: [
    'ESA feedback acknowledgment records',
    'Threat assessment integration evidence',
    'Warning response procedures'
  ],
  is_mandatory: true,
  applies_to: ['all'],
  priority: 'medium',
}

// Article 23 - Payment Incident Reporting
{
  id: 'dora-art-23',
  article_number: 'Art. 23',
  article_title: 'Operational or Security Payment-related Incidents',
  chapter: 'III',
  pillar: 'INCIDENT',
  requirement_text: 'Credit institutions, payment institutions, account information service providers, and electronic money institutions shall report serious operational or security payment-related incidents to competent authorities, replacing PSD2 requirements.',
  evidence_needed: [
    'Payment incident classification procedures',
    'PSD2 to DORA transition documentation',
    'Payment incident reporting templates',
    'Dual-reporting avoidance procedures'
  ],
  is_mandatory: true,
  applies_to: ['credit_institutions', 'payment_institutions', 'e_money_institutions'],
  priority: 'critical',
}
```

### 2. SOC2 to DORA Mappings to Add

For the new articles, most will have **no SOC2 equivalent** since they relate to regulatory oversight mechanisms:

```typescript
// TPRM Oversight Articles (33-44) - No SOC2 Coverage
{
  id: 'map-none-art33',
  soc2_category: 'NONE',
  soc2_control_pattern: null,
  dora_requirement_id: 'dora-art-33',
  mapping_strength: 'none',
  coverage_percentage: 0,
  gap_description: 'No SOC 2 equivalent. DORA Article 33 establishes Lead Overseer assessment requirements for CTPPs - this is a regulatory construct not addressed by SOC 2.',
  remediation_guidance: 'Monitor CTPP designations and ensure vendors are prepared for Lead Overseer assessments. Maintain evidence of CTPP oversight readiness.',
}
// ... similar for Art. 34-44
```

### 3. Type Updates Required

No type changes needed - existing `DORAPillar` and `DORARequirement` types support all new articles.

### 4. Calculator Updates

The `dora-calculator.ts` already uses `DORA_REQUIREMENTS` array - new articles will automatically be included in pillar scoring once added.

---

## File Changes

### Files to Modify

| File | Changes |
|------|---------|
| `src/lib/compliance/dora-requirements-data.ts` | Add 21 new requirements + 21 new mappings |

### Files NOT Modified

| File | Reason |
|------|--------|
| `dora-types.ts` | Types already support new articles |
| `dora-calculator.ts` | Auto-picks up new requirements |
| UI Components | No changes needed |

---

## Implementation Steps

### Step 1: Add TPRM Articles 33-44 (12 requirements)
- Add to `DORA_REQUIREMENTS` array
- Add corresponding `SOC2_TO_DORA_MAPPINGS` entries (all 'none')

### Step 2: Add ICT Risk Articles 15-16 (2 requirements)
- Add to `DORA_REQUIREMENTS` array
- Add corresponding mappings

### Step 3: Add Incident Articles 21-23 (3 requirements)
- Add to `DORA_REQUIREMENTS` array
- Add corresponding mappings

### Step 4: Verify and Test
- Run `npm run build` to verify TypeScript
- Check DORA calculator produces correct pillar scores
- Verify article count increased from 24 to 45

---

## Testing Checklist

- [ ] TypeScript compiles without errors
- [ ] All 21 new articles added to `DORA_REQUIREMENTS`
- [ ] All 21 new mappings added to `SOC2_TO_DORA_MAPPINGS`
- [ ] TPRM pillar shows 17 articles (5 existing + 12 new)
- [ ] ICT_RISK pillar shows 12 articles (10 existing + 2 new)
- [ ] INCIDENT pillar shows 7 articles (4 existing + 3 new)
- [ ] Calculator correctly weights new articles
- [ ] No UI regressions

---

## Impact Analysis

### Before Implementation

| Pillar | Articles | Coverage |
|--------|----------|----------|
| ICT_RISK | 10/12 | 83% |
| INCIDENT | 4/7 | 57% |
| TESTING | 4/4 | 100% |
| TPRM | 5/17 | 29% |
| SHARING | 1/1 | 100% |
| **Total** | **24/41** | **58%** |

### After Implementation

| Pillar | Articles | Coverage |
|--------|----------|----------|
| ICT_RISK | 12/12 | **100%** |
| INCIDENT | 7/7 | **100%** |
| TESTING | 4/4 | 100% |
| TPRM | 17/17 | **100%** |
| SHARING | 1/1 | 100% |
| **Total** | **41/41** | **100%** |

*Note: Total DORA articles is 64, but many are procedural (ESA duties, transitional provisions). The 41 articles above are the substantive compliance requirements.*

---

## References

- [EUR-Lex DORA Full Text](https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32022R2554)
- [Digital Operational Resilience Act Website](https://www.digital-operational-resilience-act.com/)
- [DORA-Info Article 16](https://www.dora-info.eu/dora/article-16/)
- [EBA CTPP Designation Press Release](https://www.eba.europa.eu/publications-and-media/press-releases/european-supervisory-authorities-designate-critical-ict-third-party-providers-under-digital)
- [Springlex DORA Articles](https://www.springlex.eu/en/packages/dora/dora-regulation/)
