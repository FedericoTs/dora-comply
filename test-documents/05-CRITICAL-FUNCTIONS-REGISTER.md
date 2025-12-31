# CRITICAL FUNCTIONS REGISTER

**Entity:** EuroFinance Bank AG
**LEI:** 529900ABCDEFGHIJ1234
**Register Reference:** CFR-2025-001
**Last Updated:** January 15, 2025
**Next Review:** July 15, 2025

---

## 1. EXECUTIVE SUMMARY

This register documents all critical or important functions of EuroFinance Bank AG as required under DORA Article 3(22) and the Regulatory Technical Standards on the Register of Information.

### 1.1 Summary Statistics

| Category | Count |
|----------|-------|
| Critical Functions | 8 |
| Important Functions | 12 |
| Total Functions Identified | 20 |
| Functions Supported by ICT TPPs | 15 |
| Functions with Substitutability Concerns | 4 |

---

## 2. CRITICAL FUNCTIONS

### CF-001: Payment Processing

| Attribute | Value |
|-----------|-------|
| **Function Code** | CF-001 |
| **Function Name** | Payment Processing |
| **Licensed Activity** | Payment Services (PSD2) |
| **Criticality** | Critical |
| **Regulatory Basis** | PSD2, TARGET2 participation |
| **Business Impact if Disrupted** | Immediate regulatory breach, customer harm |
| **RTO Requirement** | 2 hours |
| **RPO Requirement** | 0 (zero data loss) |
| **Annual Transaction Volume** | 45 million |
| **Annual Value Processed** | EUR 890 billion |

**ICT Services Supporting This Function:**

| Service ID | Provider | Service Type | Criticality |
|------------|----------|--------------|-------------|
| SVC-001 | CloudTech Solutions GmbH | Cloud Infrastructure | Critical |
| SVC-002 | CloudTech Solutions GmbH | Core Banking SaaS | Critical |
| SVC-INT-001 | EuroFinance Internal | Payment Gateway | Critical |

**Risk Assessment:**
- Concentration: High (single cloud provider)
- Substitutability: Medium (6-month migration)
- Regulatory Impact: Very High

---

### CF-002: Customer Deposit Management

| Attribute | Value |
|-----------|-------|
| **Function Code** | CF-002 |
| **Function Name** | Customer Deposit Management |
| **Licensed Activity** | Deposit Taking (CRD) |
| **Criticality** | Critical |
| **Regulatory Basis** | Banking Act, DGS Directive |
| **Business Impact if Disrupted** | Regulatory breach, liquidity risk |
| **RTO Requirement** | 4 hours |
| **RPO Requirement** | 1 hour |
| **Customer Accounts** | 515,000 |
| **Total Deposits** | EUR 12.5 billion |

**ICT Services Supporting This Function:**

| Service ID | Provider | Service Type | Criticality |
|------------|----------|--------------|-------------|
| SVC-002 | CloudTech Solutions GmbH | Core Banking SaaS | Critical |
| SVC-003 | CloudTech Solutions GmbH | Database Services | Critical |

---

### CF-003: Lending Operations

| Attribute | Value |
|-----------|-------|
| **Function Code** | CF-003 |
| **Function Name** | Lending Operations |
| **Licensed Activity** | Credit Provision (CRD) |
| **Criticality** | Critical |
| **Regulatory Basis** | Banking Act |
| **Business Impact if Disrupted** | Revenue loss, customer impact |
| **RTO Requirement** | 8 hours |
| **RPO Requirement** | 4 hours |
| **Active Loan Accounts** | 125,000 |
| **Total Loan Portfolio** | EUR 8.7 billion |

**ICT Services Supporting This Function:**

| Service ID | Provider | Service Type | Criticality |
|------------|----------|--------------|-------------|
| SVC-002 | CloudTech Solutions GmbH | Core Banking SaaS | Critical |
| SVC-003 | CloudTech Solutions GmbH | Database Services | Critical |
| SVC-EXT-001 | CreditScore AG | Credit Scoring API | Important |

---

### CF-004: Regulatory Reporting

| Attribute | Value |
|-----------|-------|
| **Function Code** | CF-004 |
| **Function Name** | Regulatory Reporting |
| **Licensed Activity** | All Licensed Activities |
| **Criticality** | Critical |
| **Regulatory Basis** | CRR, FINREP, COREP |
| **Business Impact if Disrupted** | Regulatory sanctions |
| **RTO Requirement** | 24 hours |
| **RPO Requirement** | 4 hours |
| **Reports Submitted Annually** | 156 |
| **Supervisory Authorities** | BaFin, ECB, EBA |

**ICT Services Supporting This Function:**

| Service ID | Provider | Service Type | Criticality |
|------------|----------|--------------|-------------|
| SVC-002 | CloudTech Solutions GmbH | Core Banking SaaS | Critical |
| SVC-003 | CloudTech Solutions GmbH | Database Services | Critical |
| SVC-INT-002 | EuroFinance Internal | Regulatory Platform | Critical |

---

### CF-005: AML/KYC Operations

| Attribute | Value |
|-----------|-------|
| **Function Code** | CF-005 |
| **Function Name** | AML/KYC Operations |
| **Licensed Activity** | All Customer-Facing |
| **Criticality** | Critical |
| **Regulatory Basis** | AMLD6, GwG |
| **Business Impact if Disrupted** | Regulatory breach, sanctions |
| **RTO Requirement** | 4 hours |
| **RPO Requirement** | 1 hour |
| **Daily Screenings** | 50,000 |
| **SAR Filed Annually** | 1,250 |

**ICT Services Supporting This Function:**

| Service ID | Provider | Service Type | Criticality |
|------------|----------|--------------|-------------|
| SVC-002 | CloudTech Solutions GmbH | Core Banking SaaS | Critical |
| SVC-EXT-002 | WorldCheck Ltd | Sanctions Screening | Critical |
| SVC-EXT-003 | VerifyID GmbH | Identity Verification | Important |

---

### CF-006: Treasury Operations

| Attribute | Value |
|-----------|-------|
| **Function Code** | CF-006 |
| **Function Name** | Treasury Operations |
| **Licensed Activity** | Investment Services |
| **Criticality** | Critical |
| **Regulatory Basis** | MiFID II, CRR |
| **Business Impact if Disrupted** | Liquidity risk, market risk |
| **RTO Requirement** | 2 hours |
| **RPO Requirement** | 15 minutes |
| **Daily Transaction Value** | EUR 2.5 billion |

**ICT Services Supporting This Function:**

| Service ID | Provider | Service Type | Criticality |
|------------|----------|--------------|-------------|
| SVC-001 | CloudTech Solutions GmbH | Cloud Infrastructure | Critical |
| SVC-INT-003 | EuroFinance Internal | Trading Platform | Critical |
| SVC-EXT-004 | Bloomberg LP | Market Data | Critical |

---

### CF-007: Cybersecurity Operations

| Attribute | Value |
|-----------|-------|
| **Function Code** | CF-007 |
| **Function Name** | Cybersecurity Operations |
| **Licensed Activity** | All |
| **Criticality** | Critical |
| **Regulatory Basis** | DORA, NIS2, BaFin BAIT |
| **Business Impact if Disrupted** | Security exposure, regulatory breach |
| **RTO Requirement** | 0 (continuous) |
| **RPO Requirement** | 0 |

**ICT Services Supporting This Function:**

| Service ID | Provider | Service Type | Criticality |
|------------|----------|--------------|-------------|
| SVC-004 | CloudTech Solutions GmbH | Managed SOC | Critical |
| SVC-INT-004 | EuroFinance Internal | SIEM Platform | Critical |

---

### CF-008: Core Banking Operations

| Attribute | Value |
|-----------|-------|
| **Function Code** | CF-008 |
| **Function Name** | Core Banking Operations |
| **Licensed Activity** | Banking License |
| **Criticality** | Critical |
| **Regulatory Basis** | Banking Act |
| **Business Impact if Disrupted** | Complete operational failure |
| **RTO Requirement** | 4 hours |
| **RPO Requirement** | 1 hour |

**ICT Services Supporting This Function:**

| Service ID | Provider | Service Type | Criticality |
|------------|----------|--------------|-------------|
| SVC-001 | CloudTech Solutions GmbH | Cloud Infrastructure | Critical |
| SVC-002 | CloudTech Solutions GmbH | Core Banking SaaS | Critical |
| SVC-003 | CloudTech Solutions GmbH | Database Services | Critical |

---

## 3. IMPORTANT FUNCTIONS

### IF-001: Customer Onboarding

| Attribute | Value |
|-----------|-------|
| **Function Code** | IF-001 |
| **Function Name** | Customer Onboarding |
| **Licensed Activity** | All Customer-Facing |
| **Criticality** | Important |
| **RTO Requirement** | 24 hours |
| **New Customers Monthly** | 2,500 |

---

### IF-002: Customer Support

| Attribute | Value |
|-----------|-------|
| **Function Code** | IF-002 |
| **Function Name** | Customer Support |
| **Licensed Activity** | All |
| **Criticality** | Important |
| **RTO Requirement** | 8 hours |
| **Monthly Interactions** | 85,000 |

---

### IF-003: Digital Banking Channels

| Attribute | Value |
|-----------|-------|
| **Function Code** | IF-003 |
| **Function Name** | Digital Banking Channels |
| **Licensed Activity** | All |
| **Criticality** | Important |
| **RTO Requirement** | 4 hours |
| **Monthly Active Users** | 380,000 |

---

### IF-004: Card Services

| Attribute | Value |
|-----------|-------|
| **Function Code** | IF-004 |
| **Function Name** | Card Services |
| **Licensed Activity** | Payment Services |
| **Criticality** | Important |
| **RTO Requirement** | 4 hours |
| **Active Cards** | 425,000 |

---

### IF-005: Trade Finance

| Attribute | Value |
|-----------|-------|
| **Function Code** | IF-005 |
| **Function Name** | Trade Finance |
| **Licensed Activity** | Banking |
| **Criticality** | Important |
| **RTO Requirement** | 24 hours |
| **Annual Volume** | EUR 2.1 billion |

---

### IF-006: Wealth Management

| Attribute | Value |
|-----------|-------|
| **Function Code** | IF-006 |
| **Function Name** | Wealth Management |
| **Licensed Activity** | Investment Services |
| **Criticality** | Important |
| **RTO Requirement** | 8 hours |
| **AUM** | EUR 4.5 billion |

---

### IF-007: HR Operations

| Attribute | Value |
|-----------|-------|
| **Function Code** | IF-007 |
| **Function Name** | HR Operations |
| **Licensed Activity** | Support |
| **Criticality** | Important |
| **RTO Requirement** | 48 hours |
| **Employees Supported** | 2,500 |

---

### IF-008: Financial Accounting

| Attribute | Value |
|-----------|-------|
| **Function Code** | IF-008 |
| **Function Name** | Financial Accounting |
| **Licensed Activity** | Support |
| **Criticality** | Important |
| **RTO Requirement** | 24 hours |

---

### IF-009: Risk Management

| Attribute | Value |
|-----------|-------|
| **Function Code** | IF-009 |
| **Function Name** | Risk Management |
| **Licensed Activity** | All |
| **Criticality** | Important |
| **RTO Requirement** | 8 hours |

---

### IF-010: Compliance Management

| Attribute | Value |
|-----------|-------|
| **Function Code** | IF-010 |
| **Function Name** | Compliance Management |
| **Licensed Activity** | All |
| **Criticality** | Important |
| **RTO Requirement** | 24 hours |

---

### IF-011: Internal Audit

| Attribute | Value |
|-----------|-------|
| **Function Code** | IF-011 |
| **Function Name** | Internal Audit |
| **Licensed Activity** | Support |
| **Criticality** | Important |
| **RTO Requirement** | 48 hours |

---

### IF-012: Legal Operations

| Attribute | Value |
|-----------|-------|
| **Function Code** | IF-012 |
| **Function Name** | Legal Operations |
| **Licensed Activity** | Support |
| **Criticality** | Important |
| **RTO Requirement** | 48 hours |

---

## 4. FUNCTION-ICT MAPPING SUMMARY

| Function | Total ICT Services | Critical ICT | Third-Party ICT |
|----------|-------------------|--------------|-----------------|
| CF-001 | 3 | 3 | 2 |
| CF-002 | 2 | 2 | 2 |
| CF-003 | 3 | 2 | 3 |
| CF-004 | 3 | 3 | 2 |
| CF-005 | 3 | 2 | 3 |
| CF-006 | 3 | 3 | 2 |
| CF-007 | 2 | 2 | 1 |
| CF-008 | 3 | 3 | 3 |
| **Total** | **22** | **20** | **18** |

---

## 5. CONCENTRATION RISK ANALYSIS

### 5.1 Provider Concentration

| Provider | Functions Supported | Criticality |
|----------|---------------------|-------------|
| CloudTech Solutions GmbH | 8 Critical, 6 Important | HIGH |
| Bloomberg LP | 1 Critical | Medium |
| WorldCheck Ltd | 1 Critical | Medium |
| Others | Various Important | Low |

### 5.2 Geographic Concentration

| Location | Functions | Data Types |
|----------|-----------|------------|
| Germany | 20 | All |
| Netherlands | 15 | Backup, DR |
| Ireland | 10 | DR only |

---

## 6. REVIEW AND APPROVAL

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Head of Operations | Peter Weber | January 15, 2025 | [Signed] |
| Chief Risk Officer | Dr. Friedrich Lange | January 15, 2025 | [Signed] |
| Chief Information Officer | Thomas Schmidt | January 15, 2025 | [Signed] |
| Chief Executive Officer | Maria Schmidt | January 15, 2025 | [Signed] |

---

*Document Classification: Confidential - Regulatory*
*Version: 2.0*
*Last Updated: January 15, 2025*
*Review Cycle: Semi-annual*
