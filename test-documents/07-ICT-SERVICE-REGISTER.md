# ICT SERVICE REGISTER

**Entity:** EuroFinance Bank AG
**LEI:** 529900ABCDEFGHIJ1234
**Register Reference:** ICT-SVC-2025-001
**Last Updated:** January 15, 2025

---

## 1. ICT SERVICES INVENTORY

### Service SVC-001: Cloud Infrastructure (IaaS)

| ESA Field | Value |
|-----------|-------|
| **Service Identification Code** | SVC-001 |
| **Service Type** | Cloud Computing - IaaS |
| **Service Description** | Virtual server infrastructure hosting including compute, storage, and networking |
| **Provider Name** | CloudTech Solutions GmbH |
| **Provider LEI** | 5493001KJTIIGC8Y1R17 |
| **Contract Reference** | MSA-2025-CLOUD-001 |
| **Service Start Date** | 2025-02-01 |
| **Service End Date** | 2028-01-31 |
| **Supports Critical Function** | Yes |
| **Critical Functions Supported** | CF-001, CF-006, CF-008 |
| **Annual Cost (EUR)** | 850,000 |
| **Cost Currency** | EUR |

**Service Locations:**

| Location Type | Country | City | Data Center |
|---------------|---------|------|-------------|
| Primary | Germany (DE) | Frankfurt | CloudTech DC-FRA |
| Secondary | Netherlands (NL) | Amsterdam | DC Europe AMS |
| DR | Ireland (IE) | Dublin | AWS EU-WEST |

---

### Service SVC-002: Core Banking Platform (SaaS)

| ESA Field | Value |
|-----------|-------|
| **Service Identification Code** | SVC-002 |
| **Service Type** | Software as a Service (SaaS) |
| **Service Description** | Core banking platform providing account management, transactions, and customer services |
| **Provider Name** | CloudTech Solutions GmbH |
| **Provider LEI** | 5493001KJTIIGC8Y1R17 |
| **Contract Reference** | MSA-2025-CLOUD-001 |
| **Service Start Date** | 2025-02-01 |
| **Service End Date** | 2028-01-31 |
| **Supports Critical Function** | Yes |
| **Critical Functions Supported** | CF-001, CF-002, CF-003, CF-004, CF-005, CF-008 |
| **Annual Cost (EUR)** | 1,200,000 |
| **Cost Currency** | EUR |

**Service Locations:**

| Location Type | Country | City | Data Center |
|---------------|---------|------|-------------|
| Primary | Germany (DE) | Frankfurt | CloudTech DC-FRA |
| Secondary | Netherlands (NL) | Amsterdam | DC Europe AMS |

---

### Service SVC-003: Database Services

| ESA Field | Value |
|-----------|-------|
| **Service Identification Code** | SVC-003 |
| **Service Type** | Data Management Services |
| **Service Description** | Managed PostgreSQL database hosting with high availability and automated backups |
| **Provider Name** | CloudTech Solutions GmbH |
| **Provider LEI** | 5493001KJTIIGC8Y1R17 |
| **Contract Reference** | MSA-2025-CLOUD-001 |
| **Service Start Date** | 2025-02-01 |
| **Service End Date** | 2028-01-31 |
| **Supports Critical Function** | Yes |
| **Critical Functions Supported** | CF-002, CF-003, CF-004, CF-008 |
| **Annual Cost (EUR)** | 320,000 |
| **Cost Currency** | EUR |

**Service Locations:**

| Location Type | Country | City | Data Center |
|---------------|---------|------|-------------|
| Primary | Germany (DE) | Frankfurt | CloudTech DC-FRA |
| Secondary | Germany (DE) | Berlin | CloudTech DC-BER |
| Backup | Netherlands (NL) | Amsterdam | DC Europe AMS |

---

### Service SVC-004: Managed Security Operations

| ESA Field | Value |
|-----------|-------|
| **Service Identification Code** | SVC-004 |
| **Service Type** | Security Services - Managed SOC |
| **Service Description** | 24/7 Security Operations Center with threat detection, incident response, and vulnerability management |
| **Provider Name** | CloudTech Solutions GmbH |
| **Provider LEI** | 5493001KJTIIGC8Y1R17 |
| **Contract Reference** | MSA-2025-CLOUD-001 |
| **Service Start Date** | 2025-02-01 |
| **Service End Date** | 2028-01-31 |
| **Supports Critical Function** | Yes |
| **Critical Functions Supported** | CF-007 |
| **Annual Cost (EUR)** | 180,000 |
| **Cost Currency** | EUR |

**Service Locations:**

| Location Type | Country | City | Data Center |
|---------------|---------|------|-------------|
| Primary SOC | Germany (DE) | Berlin | CloudTech HQ |
| Backup SOC | Germany (DE) | Frankfurt | CloudTech DC-FRA |

---

### Service SVC-005: Disaster Recovery Services

| ESA Field | Value |
|-----------|-------|
| **Service Identification Code** | SVC-005 |
| **Service Type** | Business Continuity Services |
| **Service Description** | Disaster recovery infrastructure with automated failover and 4-hour RTO |
| **Provider Name** | CloudTech Solutions GmbH |
| **Provider LEI** | 5493001KJTIIGC8Y1R17 |
| **Contract Reference** | MSA-2025-CLOUD-001 |
| **Service Start Date** | 2025-02-01 |
| **Service End Date** | 2028-01-31 |
| **Supports Critical Function** | Yes |
| **Critical Functions Supported** | All Critical Functions |
| **Annual Cost (EUR)** | 150,000 |
| **Cost Currency** | EUR |

**Service Locations:**

| Location Type | Country | City | Data Center |
|---------------|---------|------|-------------|
| DR Primary | Netherlands (NL) | Amsterdam | DC Europe AMS |
| DR Secondary | Ireland (IE) | Dublin | AWS EU-WEST |

---

## 2. THIRD-PARTY SUB-SERVICES

### Sub-Service SUB-001: Data Center Colocation

| ESA Field | Value |
|-----------|-------|
| **Service Identification Code** | SUB-001 |
| **Service Type** | Data Center Services |
| **Service Description** | Physical data center space, power, and cooling for CloudTech infrastructure |
| **Provider Name** | DataCenter Europe BV |
| **Provider LEI** | 549300DCENTER12345 |
| **Contract Reference** | COLO-2024-AMS-001 |
| **Service Start Date** | 2024-01-01 |
| **Service End Date** | 2026-12-31 |
| **Primary Provider** | CloudTech Solutions GmbH |
| **Subcontracting Rank** | 1 |
| **Annual Cost (EUR)** | 450,000 |

**Service Locations:**

| Location Type | Country | City |
|---------------|---------|------|
| Primary | Netherlands (NL) | Amsterdam |

---

### Sub-Service SUB-002: Network Security Monitoring

| ESA Field | Value |
|-----------|-------|
| **Service Identification Code** | SUB-002 |
| **Service Type** | Network Security Services |
| **Service Description** | Network traffic analysis, intrusion detection, and firewall management |
| **Provider Name** | SecureNet AG |
| **Provider LEI** | 549300SECNET67890 |
| **Contract Reference** | SEC-2024-NET-001 |
| **Service Start Date** | 2024-03-01 |
| **Service End Date** | 2026-02-28 |
| **Primary Provider** | CloudTech Solutions GmbH |
| **Subcontracting Rank** | 2 |
| **Annual Cost (EUR)** | 120,000 |

**Service Locations:**

| Location Type | Country | City |
|---------------|---------|------|
| Primary | Germany (DE) | Berlin |
| Secondary | Germany (DE) | Frankfurt |

---

### Sub-Service SUB-003: Backup Services

| ESA Field | Value |
|-----------|-------|
| **Service Identification Code** | SUB-003 |
| **Service Type** | Backup and Recovery Services |
| **Service Description** | Encrypted offsite backup storage and recovery services |
| **Provider Name** | BackupSafe GmbH |
| **Provider LEI** | 549300BACKUP11111 |
| **Contract Reference** | BKP-2024-001 |
| **Service Start Date** | 2024-06-01 |
| **Service End Date** | 2027-05-31 |
| **Primary Provider** | CloudTech Solutions GmbH |
| **Subcontracting Rank** | 3 |
| **Annual Cost (EUR)** | 85,000 |

**Service Locations:**

| Location Type | Country | City |
|---------------|---------|------|
| Primary | Germany (DE) | Munich |
| Secondary | Germany (DE) | Hamburg |

---

## 3. EXTERNAL ICT SERVICES (NON-CLOUDTECH)

### Service EXT-001: Credit Scoring API

| ESA Field | Value |
|-----------|-------|
| **Service Identification Code** | EXT-001 |
| **Service Type** | Data Services - API |
| **Service Description** | Real-time credit scoring and risk assessment API |
| **Provider Name** | CreditScore AG |
| **Provider LEI** | 549300CREDIT00001 |
| **Contract Reference** | API-2024-CS-001 |
| **Service Start Date** | 2024-01-01 |
| **Service End Date** | 2025-12-31 |
| **Supports Critical Function** | Yes |
| **Critical Functions Supported** | CF-003 |
| **Annual Cost (EUR)** | 95,000 |
| **Cost Currency** | EUR |

---

### Service EXT-002: Sanctions Screening

| ESA Field | Value |
|-----------|-------|
| **Service Identification Code** | EXT-002 |
| **Service Type** | Compliance Services |
| **Service Description** | Global sanctions and PEP screening service |
| **Provider Name** | WorldCheck Ltd |
| **Provider LEI** | 549300WCHECK00002 |
| **Contract Reference** | AML-2024-WC-001 |
| **Service Start Date** | 2024-01-01 |
| **Service End Date** | 2026-12-31 |
| **Supports Critical Function** | Yes |
| **Critical Functions Supported** | CF-005 |
| **Annual Cost (EUR)** | 180,000 |
| **Cost Currency** | EUR |

---

### Service EXT-003: Identity Verification

| ESA Field | Value |
|-----------|-------|
| **Service Identification Code** | EXT-003 |
| **Service Type** | Identity Services |
| **Service Description** | Digital identity verification and document authentication |
| **Provider Name** | VerifyID GmbH |
| **Provider LEI** | 549300VERIFY00003 |
| **Contract Reference** | KYC-2024-VID-001 |
| **Service Start Date** | 2024-04-01 |
| **Service End Date** | 2026-03-31 |
| **Supports Critical Function** | Yes |
| **Critical Functions Supported** | CF-005 |
| **Annual Cost (EUR)** | 65,000 |
| **Cost Currency** | EUR |

---

### Service EXT-004: Market Data Feed

| ESA Field | Value |
|-----------|-------|
| **Service Identification Code** | EXT-004 |
| **Service Type** | Data Services - Market Data |
| **Service Description** | Real-time market data, pricing, and financial news |
| **Provider Name** | Bloomberg LP |
| **Provider LEI** | 549300BLOOM00004 |
| **Contract Reference** | MKT-2024-BBG-001 |
| **Service Start Date** | 2024-01-01 |
| **Service End Date** | 2025-12-31 |
| **Supports Critical Function** | Yes |
| **Critical Functions Supported** | CF-006 |
| **Annual Cost (EUR)** | 420,000 |
| **Cost Currency** | EUR |

---

## 4. SERVICE LEVEL SUMMARY

| Service ID | Availability SLA | RTO | RPO | Last Review |
|------------|------------------|-----|-----|-------------|
| SVC-001 | 99.95% | 4 hours | 1 hour | January 2025 |
| SVC-002 | 99.99% | 4 hours | 1 hour | January 2025 |
| SVC-003 | 99.95% | 4 hours | 15 min | January 2025 |
| SVC-004 | 24/7/365 | N/A | N/A | January 2025 |
| SVC-005 | 99.9% | 4 hours | 1 hour | January 2025 |
| EXT-001 | 99.5% | 8 hours | N/A | December 2024 |
| EXT-002 | 99.9% | 4 hours | N/A | December 2024 |
| EXT-003 | 99.5% | 24 hours | N/A | December 2024 |
| EXT-004 | 99.99% | 1 hour | Real-time | January 2025 |

---

## 5. COST SUMMARY

| Category | Annual Cost (EUR) |
|----------|-------------------|
| CloudTech Services (SVC-001 to SVC-005) | 2,700,000 |
| External Services (EXT-001 to EXT-004) | 760,000 |
| **Total ICT Third-Party Costs** | **3,460,000** |

---

*Document Classification: Confidential*
*Version: 1.0*
*Last Updated: January 15, 2025*
