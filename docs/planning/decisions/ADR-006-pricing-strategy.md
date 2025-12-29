# ADR-006: Pricing Strategy for DORA Compliance Platform

**Status:** Proposed
**Date:** 2024-12-29
**Decision Makers:** Founders, Product, GTM

---

## Executive Summary

Based on competitor analysis and our cost structure, we recommend a **usage-based pricing model** starting at **€599/month** for small financial institutions, scaling to **€4,999+/month** for enterprises. This positions us below enterprise TPRM tools but above generic compliance automation, targeting the underserved mid-market of EU financial institutions requiring DORA compliance.

---

## 1. Competitor Pricing Analysis

### 1.1 Compliance Automation Platforms (GRC)

| Vendor | Starting Price | Enterprise | Target Market | Focus |
|--------|---------------|------------|---------------|-------|
| **Vanta** | $10,000/year | $30,000-80,000/year | Tech companies | SOC 2, ISO 27001 |
| **Drata** | $7,000/year | $100,000/year | Enterprise tech | Multi-framework |
| **Secureframe** | $10,000/year | Custom | Mid-market SaaS | SOC 2 |
| **Sprinto** | $4,000/year | $25,000/year | SMB tech | SOC 2, ISO |

**Key Insight:** These focus on tech company compliance (SOC 2, ISO 27001) with limited DORA/financial services support.

### 1.2 Third-Party Risk Management (TPRM)

| Vendor | Starting Price | Enterprise | Target Market | Focus |
|--------|---------------|------------|---------------|-------|
| **UpGuard** | $1,599/month (~$19K/year) | Custom | Mid-market | Security ratings |
| **SecurityScorecard** | ~$50,000/year | $100,000+/year | Enterprise | Continuous monitoring |
| **BitSight** | ~$30,000/year | $100,000+/year | Enterprise | Security ratings |
| **OneTrust TPRM** | Custom (~$25K+) | $100,000+/year | Enterprise | Privacy + TPRM |
| **Prevalent** | Custom | Custom | Enterprise | Vendor assessments |

**Key Insight:** TPRM tools are expensive ($20K-100K+) and not DORA-specific. They require manual questionnaire management.

### 1.3 DORA-Specific Solutions (Emerging)

| Vendor | Pricing | Notes |
|--------|---------|-------|
| **Consulting firms** | €50K-500K/project | One-time, not software |
| **Big 4 DORA tools** | Enterprise only | >€100K/year typically |
| **RegTech platforms** | Custom pricing | Not publicly available |

**Key Insight:** No direct competitors offer affordable, AI-powered DORA compliance SaaS for mid-market EU financial institutions.

---

## 2. Market Gap Analysis

### 2.1 Underserved Segments

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ENTERPRISE                                   │
│  (€100K+/year) ─────────────────────────── SecurityScorecard,      │
│                                            OneTrust, BitSight       │
├─────────────────────────────────────────────────────────────────────┤
│                        MID-MARKET                                   │
│  (€20K-100K/year) ──────────────────────── Vanta, Drata,           │
│                                            UpGuard                  │
├─────────────────────────────────────────────────────────────────────┤
│                     ★ OUR TARGET ★                                 │
│  (€7K-30K/year) ────────────────────────── DORA-specific,          │
│                                            AI-automated,            │
│                                            Mid-market EU FIs        │
├─────────────────────────────────────────────────────────────────────┤
│                        SMB/STARTUP                                  │
│  (<€7K/year) ───────────────────────────── Sprinto, basic tools    │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Target Customer Profile

| Segment | Company Size | Annual Revenue | IT Budget | DORA Urgency |
|---------|--------------|----------------|-----------|--------------|
| **Primary** | 50-500 employees | €10M-500M | €500K-5M | High |
| **Secondary** | 500-2000 employees | €500M-2B | €5M-20M | High |
| **Future** | <50 employees | <€10M | <€500K | Medium |

---

## 3. Proposed Pricing Model

### 3.1 Pricing Philosophy

1. **Usage-based core metric**: Number of ICT third-party providers tracked
2. **Module add-ons**: Additional capabilities priced separately
3. **EU-first pricing**: Prices in EUR, competitively positioned for EU market
4. **Annual contracts**: Discount for annual commitment
5. **No seat-based pricing**: Unlimited users per organization

### 3.2 Pricing Tiers

| Tier | Monthly (Annual) | Vendors Included | Target Customer |
|------|------------------|------------------|-----------------|
| **Starter** | €599/mo (€499 annual) | 25 vendors | Small credit unions, fintech startups |
| **Professional** | €1,499/mo (€1,249 annual) | 100 vendors | Regional banks, asset managers |
| **Enterprise** | €4,999/mo+ | Unlimited | Large banks, insurers |
| **Custom** | Contact us | Custom | ICT providers, multi-entity |

### 3.3 Detailed Feature Matrix

| Feature | Starter | Professional | Enterprise |
|---------|---------|--------------|------------|
| **Core TPRM** ||||
| Vendor inventory | 25 | 100 | Unlimited |
| Risk assessments | ✓ | ✓ | ✓ |
| Document parsing (AI) | 10/mo | 50/mo | Unlimited |
| Due diligence workflows | ✓ | ✓ | ✓ |
| **DORA Compliance** ||||
| Register of Information | ✓ | ✓ | ✓ |
| xBRL-CSV export | ✓ | ✓ | ✓ |
| ESA template validation | ✓ | ✓ | ✓ |
| Critical function mapping | - | ✓ | ✓ |
| Subservice org tracking | - | ✓ | ✓ |
| **Incident Reporting** ||||
| Incident classification | ✓ | ✓ | ✓ |
| Threshold monitoring | - | ✓ | ✓ |
| NCA report generation | - | ✓ | ✓ |
| RTS templates | - | ✓ | ✓ |
| **Contract Management** ||||
| Contract repository | 25 | 100 | Unlimited |
| Clause analysis (AI) | - | ✓ | ✓ |
| DORA provision checker | - | ✓ | ✓ |
| Renewal tracking | ✓ | ✓ | ✓ |
| **Document Intelligence** ||||
| SOC 2 parsing | ✓ | ✓ | ✓ |
| ISO 27001 parsing | ✓ | ✓ | ✓ |
| Exception extraction | - | ✓ | ✓ |
| Cross-framework mapping | - | ✓ | ✓ |
| **Advanced Features** ||||
| API access | - | ✓ | ✓ |
| SSO (SAML) | - | - | ✓ |
| Custom integrations | - | - | ✓ |
| Multi-entity support | - | - | ✓ |
| Dedicated CSM | - | - | ✓ |
| SLA guarantee | - | - | 99.9% |
| **Support** ||||
| Email support | ✓ | ✓ | ✓ |
| Chat support | - | ✓ | ✓ |
| Phone support | - | - | ✓ |
| Onboarding | Self-serve | Guided | White-glove |

### 3.4 Add-On Modules

| Module | Price | Description |
|--------|-------|-------------|
| **Additional vendors** | €15/vendor/mo | Above tier limits |
| **Additional AI parsing** | €0.50/document | Above monthly quota |
| **Incident reporting module** | €299/mo | Full incident management |
| **Contract intelligence** | €399/mo | Advanced contract analysis |
| **Audit preparation kit** | €999/quarter | Examiner-ready packages |
| **Premium support** | €499/mo | 4-hour SLA, dedicated slack |

### 3.5 Overages

| Resource | Overage Rate | Notes |
|----------|--------------|-------|
| Additional vendors | €15/vendor/month | Prorated |
| Additional documents parsed | €0.50/document | Batched monthly |
| API calls (above 10K/mo) | €0.001/call | Enterprise exempt |
| Storage (above 10GB) | €0.10/GB/month | Documents, reports |

---

## 4. Price Justification

### 4.1 Value Analysis

**Cost of alternatives:**

| Alternative | Annual Cost | Problems |
|-------------|-------------|----------|
| Manual compliance | €100K-500K | Headcount, errors, slow |
| Consulting firms | €50K-200K | One-time, not scalable |
| Generic TPRM tools | €20K-100K | No DORA, manual work |
| Our platform | €6K-60K | Automated, DORA-native |

**ROI for customers:**

| Metric | Without Us | With Us | Savings |
|--------|------------|---------|---------|
| Time to RoI submission | 40 hours/quarter | 4 hours/quarter | 90% |
| Vendor assessment time | 8 hours/vendor | 1 hour/vendor | 87% |
| Compliance FTE needed | 2-3 | 0.5-1 | 50-67% |
| Error rate in submissions | 15-25% | <5% | 75% |

**Break-even for customer:**
- Starter (€6K/year) vs. 0.1 FTE saved = €8K-12K value
- Professional (€15K/year) vs. 0.5 FTE saved = €40K-60K value

### 4.2 Competitive Positioning

```
Price/year vs. DORA Capability

€100K+ │                              ┌──────────────┐
       │                              │ OneTrust     │
       │                              │ ServiceNow   │
€50K   │     ┌─────────────┐          └──────────────┘
       │     │ Vanta       │
       │     │ Drata       │
€25K   │     │ UpGuard     │
       │     └─────────────┘
       │                    ★ OUR ENTERPRISE
€15K   │ ┌─────────┐        ★ OUR PROFESSIONAL
       │ │ Sprinto │
€6K    │ └─────────┘        ★ OUR STARTER
       │
       └────────────────────────────────────────────
         Generic GRC        ──────────► DORA-Native
```

---

## 5. Unit Economics

### 5.1 Cost Per Customer

From our cost analysis (ADR-005):

| Scale | Customers | Infra/Customer | AI/Customer | Total Cost/Customer |
|-------|-----------|----------------|-------------|---------------------|
| Startup | 10 | €15/mo | €3/mo | €20/mo |
| Growth | 50 | €9/mo | €3/mo | €12/mo |
| Scale | 200 | €8/mo | €3/mo | €11/mo |

### 5.2 Gross Margin by Tier

| Tier | Monthly Price | Cost/Customer | Gross Margin |
|------|---------------|---------------|--------------|
| Starter | €599 | €25 | **96%** |
| Professional | €1,499 | €35 | **98%** |
| Enterprise | €4,999 | €50 | **99%** |

### 5.3 Target Metrics

| Metric | Target | Notes |
|--------|--------|-------|
| ARPU (blended) | €1,000/mo | Mix of tiers |
| LTV | €36,000 | 3-year retention |
| CAC | €6,000 | 6-month payback |
| LTV:CAC | 6:1 | Healthy SaaS |
| Gross margin | 97% | Excellent |
| Net revenue retention | 110% | Upsells, overages |

---

## 6. Go-to-Market Pricing Tactics

### 6.1 Launch Pricing (First 50 Customers)

| Offer | Details |
|-------|---------|
| **Early Adopter Discount** | 50% off first year |
| **Founder's Tier** | Lock in current pricing forever |
| **Free pilot** | 30-day full access, no CC |
| **Implementation included** | White-glove onboarding |

**Example:**
- Professional tier: €1,499/mo → €749/mo first year
- Annual commitment: €9,000 first year (normally €18,000)

### 6.2 Conversion Strategy

```
Free Trial (30 days)
        ↓
Self-serve Starter (€599/mo)
        ↓ Upsell triggers:
        - >25 vendors
        - Needs incident reporting
        - Requests API access
        ↓
Sales-assisted Professional (€1,499/mo)
        ↓ Upsell triggers:
        - >100 vendors
        - Multi-entity
        - SSO requirement
        ↓
Enterprise negotiation (€4,999+/mo)
```

### 6.3 Negotiation Guidelines

| Discount Type | Max Discount | Approval |
|---------------|--------------|----------|
| Annual prepay | 20% | Automatic |
| 2-year commitment | 30% | Sales lead |
| 3-year commitment | 40% | CEO |
| Multi-entity | 25% per entity | Sales lead |
| Non-profit/academic | 50% | CEO |
| Strategic partner | Custom | CEO |

---

## 7. Competitor Comparison Summary

### 7.1 Feature Comparison

| Capability | Our Platform | Vanta | UpGuard | OneTrust |
|------------|--------------|-------|---------|----------|
| DORA RoI generation | ✓ Native | ✗ | ✗ | Partial |
| xBRL-CSV export | ✓ | ✗ | ✗ | ✗ |
| AI document parsing | ✓ | Partial | ✗ | ✗ |
| Incident classification | ✓ DORA-specific | ✗ | ✗ | Generic |
| EU data residency | ✓ | ✓ | ✗ | ✓ |
| SOC 2 parsing | ✓ | ✓ | ✓ | Partial |
| Contract analysis | ✓ DORA-focused | ✗ | ✗ | Partial |
| Starting price | €7K/year | $10K/year | $19K/year | $25K+/year |

### 7.2 Price/Value Positioning

| Vendor | Price Range | DORA Value | Our Advantage |
|--------|-------------|------------|---------------|
| Vanta | $10-80K | Low | Purpose-built for DORA |
| Drata | $7-100K | Low | EU-focused, AI-native |
| UpGuard | $19K+ | Low | Full RoI automation |
| OneTrust | $25K+ | Medium | 70% cheaper, faster |
| Consulting | $50K+ | High | Continuous vs. one-time |

---

## 8. Pricing FAQs

### For Sales Team

**Q: Why don't we charge per seat?**
A: DORA compliance requires cross-functional collaboration. Seat-based pricing discourages adoption and creates friction. Usage (vendors) is a better value metric.

**Q: What if a prospect says we're too expensive?**
A: Calculate their current cost: FTE time + consultant fees + risk of non-compliance fines (up to 2% global revenue). We're typically 70% cheaper than alternatives.

**Q: How do we justify vs. Sprinto ($4K)?**
A: Sprinto doesn't support DORA, xBRL export, or EU regulatory requirements. They're for tech companies doing SOC 2. We're for financial institutions doing DORA.

**Q: Can we discount below €599/mo?**
A: Not recommended. Below this, customers aren't serious about compliance. Offer a longer free trial instead.

### For Customers

**Q: What's included in the vendor count?**
A: Any ICT third-party provider you track in the system, whether assessed or pending.

**Q: Do you charge for inactive vendors?**
A: No. Only active vendors in your current inventory count toward limits.

**Q: What happens if I exceed my document parsing quota?**
A: You're billed €0.50/document for overages. We'll notify you at 80% usage.

---

## 9. Decision & Recommendation

### Recommended Pricing

| Tier | Annual Price | Monthly Equivalent |
|------|--------------|-------------------|
| **Starter** | €5,988/year | €499/month (billed annually) |
| **Professional** | €14,988/year | €1,249/month (billed annually) |
| **Enterprise** | €49,988+/year | €4,166+/month (negotiated) |

### Key Differentiators to Emphasize

1. **Only DORA-native platform** - Not retrofitted GRC
2. **AI-powered automation** - 90% reduction in manual work
3. **xBRL-CSV compliant** - Ready for ESA submission
4. **EU data residency** - GDPR-compliant by design
5. **70% cheaper than enterprise TPRM** - SMB accessible

### Launch Strategy

1. **Phase 1 (MVP):** Early adopter pricing, 50% discount
2. **Phase 2 (PMF):** Standard pricing, case study focus
3. **Phase 3 (Scale):** Enterprise tier, partnership pricing

---

## 10. References

### Competitor Pricing Sources

- [Vanta Pricing Guide 2025](https://www.complyjet.com/blog/vanta-pricing-guide-2025)
- [Drata vs Secureframe Comparison](https://www.planetcompliance.com/grc/drata-vs-secureframe/)
- [UpGuard Pricing](https://www.upguard.com/pricing)
- [Sprinto Pricing Breakdown](https://www.spendflo.com/blog/the-ultimate-sprinto-pricing-breakdown-a-buyers-guide)
- [Gartner TPRM Solutions Reviews](https://www.gartner.com/reviews/market/third-party-risk-management-technology-solutions)

### Market Research

- [Verizon 2025 DBIR - 30% breaches from third parties](https://www.verizon.com/business/resources/reports/dbir/)
- [DORA Compliance Deadlines](https://www.digital-operational-resilience-act.com/)
- [DORA Penalties - up to 2% global turnover](https://n2ws.com/blog/dora-regulation)

---

**Last Updated:** 2024-12-29
