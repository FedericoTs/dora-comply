# SERVICE LEVEL AGREEMENT

**Agreement Reference:** SLA-2025-CLOUD-001
**Related MSA:** MSA-2025-CLOUD-001

**Date of Execution:** January 15, 2025

---

## PARTIES

### Service Provider
- **Legal Name:** CloudTech Solutions GmbH
- **Legal Entity Identifier (LEI):** 5493001KJTIIGC8Y1R17

### Client
- **Legal Name:** EuroFinance Bank AG
- **Legal Entity Identifier (LEI):** 529900ABCDEFGHIJ1234

---

## 1. SERVICE AVAILABILITY

### 1.1 Core Platform Availability

| Service Component | Monthly Uptime Target | Measurement Window |
|-------------------|----------------------|-------------------|
| Core Banking Platform | 99.99% | Monthly |
| Payment Processing | 99.99% | Monthly |
| Database Services | 99.95% | Monthly |
| API Gateway | 99.9% | Monthly |
| Security Operations | 24/7/365 | Continuous |

### 1.2 Maintenance Windows
- **Scheduled Maintenance:** Sundays 02:00-06:00 CET
- **Emergency Maintenance:** With 4-hour advance notice
- **Maintenance Exclusions:** Not counted against uptime targets

---

## 2. BUSINESS CONTINUITY METRICS

### 2.1 Recovery Objectives

| Metric | Value | Applicable Services |
|--------|-------|---------------------|
| Recovery Time Objective (RTO) | 4 hours | All critical services |
| Recovery Point Objective (RPO) | 1 hour | Transaction data |
| Recovery Point Objective (RPO) | 15 minutes | Payment processing |
| Maximum Tolerable Downtime (MTD) | 24 hours | All services |

### 2.2 Disaster Recovery Sites

| Site Role | Location | Distance from Primary | Failover Time |
|-----------|----------|----------------------|---------------|
| Primary | Frankfurt, Germany | - | - |
| Secondary (Hot) | Amsterdam, Netherlands | 450 km | < 4 hours |
| Tertiary (Cold) | Dublin, Ireland | 1,100 km | < 24 hours |

### 2.3 DR Testing Schedule
- **Full Failover Test:** Annually (last: November 2024)
- **Partial Failover Test:** Quarterly
- **Backup Restoration Test:** Monthly
- **Tabletop Exercise:** Semi-annually

---

## 3. INCIDENT RESPONSE

### 3.1 Incident Severity Classification

| Severity | Definition | Response Time | Resolution Target |
|----------|------------|---------------|-------------------|
| P1 - Critical | Complete service outage | 15 minutes | 2 hours |
| P2 - High | Major functionality impaired | 30 minutes | 4 hours |
| P3 - Medium | Minor functionality impaired | 2 hours | 8 hours |
| P4 - Low | Non-critical issues | 8 hours | 5 business days |

### 3.2 Escalation Matrix

| Time Elapsed | Escalation Level | Contact |
|--------------|------------------|---------|
| 0 minutes | L1 - Service Desk | support@cloudtech.de |
| 30 minutes | L2 - Technical Lead | techops@cloudtech.de |
| 2 hours | L3 - Service Manager | servicemanager@cloudtech.de |
| 4 hours | L4 - VP Operations | vp.ops@cloudtech.de |
| 8 hours | L5 - CTO | cto@cloudtech.de |

---

## 4. SERVICE CREDITS

### 4.1 Credit Schedule

| Monthly Uptime | Service Credit |
|----------------|----------------|
| 99.99% - 99.95% | 0% |
| 99.95% - 99.9% | 10% |
| 99.9% - 99.0% | 25% |
| Below 99.0% | 50% |

### 4.2 Credit Limitations
- Maximum monthly credit: 50% of monthly fees
- Credits apply to next invoice
- Credits expire after 12 months

---

## 5. SUPPORT SERVICES

### 5.1 Support Channels

| Channel | Availability | Response SLA |
|---------|-------------|--------------|
| Phone Hotline | 24/7 | Immediate |
| Email | 24/7 | 4 hours |
| Portal | 24/7 | 2 hours |
| Dedicated Account Manager | Business hours | 1 hour |

### 5.2 Dedicated Resources
- Named Technical Account Manager
- Monthly service review meetings
- Quarterly business reviews

---

## 6. CAPACITY MANAGEMENT

### 6.1 Resource Thresholds

| Resource | Warning Threshold | Critical Threshold | Auto-scale |
|----------|------------------|-------------------|------------|
| CPU | 70% | 85% | Yes |
| Memory | 75% | 90% | Yes |
| Storage | 80% | 90% | Manual |
| Network | 60% | 80% | Yes |

### 6.2 Capacity Planning
- Quarterly capacity reviews
- 6-month forward planning
- Annual growth projections

---

## 7. CHANGE MANAGEMENT

### 7.1 Change Categories

| Category | Approval Required | Lead Time | Testing Required |
|----------|------------------|-----------|------------------|
| Standard | Pre-approved | 5 days | Yes |
| Normal | CAB approval | 10 days | Yes |
| Emergency | Emergency CAB | Immediate | Post-implementation |

### 7.2 Change Advisory Board
- Meets weekly (Thursdays 10:00 CET)
- Emergency CAB: On-demand within 2 hours

---

## 8. SECURITY OPERATIONS

### 8.1 Security Monitoring

| Activity | Frequency | Reporting |
|----------|-----------|-----------|
| Vulnerability Scanning | Weekly | Monthly report |
| Penetration Testing | Annually | After completion |
| Log Analysis | Real-time | Daily summary |
| Threat Intelligence | Continuous | Weekly briefing |

### 8.2 Security Incident Response
- Detection to Notification: < 15 minutes
- Initial Assessment: < 1 hour
- Containment: < 4 hours
- Eradication: < 24 hours
- Post-Incident Report: Within 72 hours

---

## 9. REPORTING AND GOVERNANCE

### 9.1 Standard Reports

| Report | Frequency | Delivery | Format |
|--------|-----------|----------|--------|
| Availability Report | Monthly | Day 5 | PDF/Excel |
| Incident Summary | Monthly | Day 5 | PDF |
| Security Report | Monthly | Day 10 | PDF |
| Capacity Report | Quarterly | Week 2 | PDF/Excel |

### 9.2 Service Review Meetings
- Monthly operational review
- Quarterly business review
- Annual strategic review

---

## 10. COMPLIANCE AND CERTIFICATIONS

### 10.1 Current Certifications

| Certification | Scope | Expiry | Auditor |
|---------------|-------|--------|---------|
| ISO 27001:2022 | Full operations | December 2026 | TUV |
| SOC 2 Type II | Cloud services | March 2025 | Big Four |
| PCI DSS v4.0 | Payment systems | June 2025 | QSA |
| C5 (BSI) | Cloud services | September 2025 | BSI |

### 10.2 Audit Access
- 30-day notice for on-site audits
- Annual third-party audit reports provided
- Penetration test results available upon request

---

## SIGNATURES

**For CloudTech Solutions GmbH:**
Name: Dr. Hans Mueller
Title: Chief Executive Officer
Date: January 15, 2025

**For EuroFinance Bank AG:**
Name: Maria Schmidt
Title: Chief Operating Officer
Date: January 15, 2025

---

*Document Classification: Confidential*
*Version: 1.0*
*Last Updated: January 15, 2025*
