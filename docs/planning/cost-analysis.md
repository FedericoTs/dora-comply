# DORA Compliance Platform - Cost Analysis

**Document Status:** Draft
**Last Updated:** 2024-12-29
**Purpose:** Infrastructure and operational cost estimation

---

## Executive Summary

| Scale | Monthly Cost | Annual Cost | Cost per Customer |
|-------|--------------|-------------|-------------------|
| **Startup** (10 customers) | ~$850 | ~$10,200 | $85/customer |
| **Growth** (50 customers) | ~$2,800 | ~$33,600 | $56/customer |
| **Scale** (200 customers) | ~$9,500 | ~$114,000 | $47.50/customer |
| **Enterprise** (500 customers) | ~$22,000 | ~$264,000 | $44/customer |

---

## 1. Infrastructure Costs

### 1.1 Supabase (Database + Auth + Storage)

We need **two regions** (EU Frankfurt + US Virginia) for data residency compliance.

| Plan | Price/Project | Features | Recommended For |
|------|---------------|----------|-----------------|
| **Free** | $0 | 500MB DB, 1GB storage, 50K MAU | Development only |
| **Pro** | $25/mo | 8GB DB, 100GB storage, 100K MAU | Startup |
| **Team** | $599/mo | 100GB DB, 500GB storage, unlimited MAU | Growth/Scale |
| **Enterprise** | Custom | Dedicated infra, SLA | Enterprise |

**Our Configuration (2 regions):**

| Scale | EU Project | US Project | Total/Month |
|-------|------------|------------|-------------|
| **Startup** | Pro ($25) | Pro ($25) | **$50** |
| **Growth** | Pro ($25) | Pro ($25) | **$50** |
| **Scale** | Team ($599) | Pro ($25) | **$624** |
| **Enterprise** | Team ($599) | Team ($599) | **$1,198** |

**Additional Supabase Costs:**
- Database egress: $0.09/GB after 50GB
- Storage egress: $0.09/GB after 200GB
- Realtime: Included in Pro/Team

### 1.2 Vercel (Hosting + Edge Functions)

| Plan | Price | Features | Recommended For |
|------|-------|----------|-----------------|
| **Hobby** | $0 | Personal projects | Development |
| **Pro** | $20/user/mo | Team features, 1TB bandwidth | Startup/Growth |
| **Enterprise** | Custom | SLA, advanced security | Enterprise |

**Our Configuration:**

| Scale | Plan | Team Size | Total/Month |
|-------|------|-----------|-------------|
| **Startup** | Pro | 2 users | **$40** |
| **Growth** | Pro | 4 users | **$80** |
| **Scale** | Pro | 6 users | **$120** |
| **Enterprise** | Enterprise | 10+ users | **~$500+** |

**Additional Vercel Costs:**
- Bandwidth overage: $0.15/GB after 1TB
- Serverless function execution: $0.18/million invocations after 1M
- Edge function execution: $0.65/million invocations after 1M

---

## 2. AI/LLM Costs (Critical Cost Driver)

### 2.1 Claude API (Anthropic) - Primary Parser

| Model | Input | Output | Context |
|-------|-------|--------|---------|
| **Claude 3.5 Sonnet** | $3/M tokens | $15/M tokens | 200K |
| **Claude 3 Haiku** | $0.25/M tokens | $1.25/M tokens | 200K |

**Document Parsing Token Estimates:**

| Document Type | Avg Pages | Input Tokens | Output Tokens | Cost/Doc |
|---------------|-----------|--------------|---------------|----------|
| **SOC 2 Type II** | 150 | ~150K | ~10K | ~$0.60 |
| **ISO 27001 Cert** | 3 | ~3K | ~2K | ~$0.04 |
| **ISO 27001 SoA** | 20 | ~20K | ~5K | ~$0.14 |
| **Penetration Test** | 50 | ~50K | ~8K | ~$0.27 |
| **Contract** | 30 | ~30K | ~5K | ~$0.17 |

**Monthly AI Cost Estimates:**

| Scale | Docs/Month | Avg Cost/Doc | Monthly AI Cost |
|-------|------------|--------------|-----------------|
| **Startup** (10 customers) | 50 | $0.40 | **$20** |
| **Growth** (50 customers) | 250 | $0.40 | **$100** |
| **Scale** (200 customers) | 1,000 | $0.40 | **$400** |
| **Enterprise** (500 customers) | 2,500 | $0.40 | **$1,000** |

**Cost Optimization Strategies:**
1. Use Claude Haiku for simple extractions (10x cheaper)
2. Cache parsed results (never re-parse same document)
3. Chunk large documents intelligently
4. Use confidence scoring to reduce re-parsing

### 2.2 OpenAI GPT-4 Vision (Fallback/OCR)

| Model | Input | Output |
|-------|-------|--------|
| **GPT-4o** | $2.50/M tokens | $10/M tokens |
| **GPT-4o-mini** | $0.15/M tokens | $0.60/M tokens |

**Estimate:** 10% of documents may need vision/OCR
- Additional cost: ~$50-200/month at scale

---

## 3. Third-Party Services

### 3.1 Email (Transactional)

| Service | Free Tier | Paid | Our Choice |
|---------|-----------|------|------------|
| **Resend** | 3K/month | $20/mo for 50K | Resend |
| **SendGrid** | 100/day | $19.95/mo for 50K | Alternative |
| **AWS SES** | N/A | $0.10/1K emails | Budget option |

**Email Volume Estimates:**
- Notifications, alerts, reports
- ~100 emails/customer/month
- At 200 customers: 20K emails/month

| Scale | Emails/Month | Provider | Cost/Month |
|-------|--------------|----------|------------|
| **Startup** | 1,000 | Resend Free | **$0** |
| **Growth** | 5,000 | Resend Starter | **$20** |
| **Scale** | 20,000 | Resend Pro | **$50** |
| **Enterprise** | 50,000 | Resend Pro | **$100** |

### 3.2 Monitoring & Error Tracking

| Service | Free Tier | Paid | Purpose |
|---------|-----------|------|---------|
| **Sentry** | 5K errors/mo | $26/mo (50K) | Error tracking |
| **Vercel Analytics** | Included | Included | Performance |
| **LogTail/Axiom** | 1GB/mo | $25/mo | Logging |

**Total Monitoring:**

| Scale | Sentry | Logging | Total/Month |
|-------|--------|---------|-------------|
| **Startup** | Free | Free | **$0** |
| **Growth** | $26 | Free | **$26** |
| **Scale** | $26 | $25 | **$51** |
| **Enterprise** | $80 | $100 | **$180** |

### 3.3 Domain & SSL

| Item | Cost | Notes |
|------|------|-------|
| Domain (.com) | $12-15/year | e.g., doracomply.com |
| SSL | Free | Via Vercel/Cloudflare |
| DNS (Cloudflare) | Free | Recommended |

**Annual:** ~$15

---

## 4. External APIs

### 4.1 Free/Low-Cost APIs

| API | Free Tier | Paid | Our Usage |
|-----|-----------|------|-----------|
| **GLEIF LEI** | 1,000/day | N/A | LEI validation |
| **NIST CSF** | Unlimited | N/A | Framework data |
| **OpenCorporates** | 1,000/month | Custom | Company lookup |

**Estimate:** $0-50/month (mostly free tier sufficient)

### 4.2 Premium APIs (Future - Phase 5+)

| API | Pricing | Purpose |
|-----|---------|---------|
| **SecurityScorecard** | Enterprise ($50K+/year) | Security ratings |
| **BitSight** | Enterprise ($30K+/year) | Security ratings |
| **UpGuard** | $5K+/year | Vendor monitoring |

**Note:** These are future considerations, not MVP costs.

---

## 5. Development & Operational Costs

### 5.1 Team Costs (Not Infrastructure)

| Role | Monthly Cost (EU) | Headcount |
|------|-------------------|-----------|
| Full-stack Developer | $8-15K | 2 |
| Backend/AI Developer | $10-18K | 1-2 |
| Frontend Developer | $6-12K | 1 |
| DevOps (Part-time) | $4-8K | 0.5 |
| Product Manager | $8-12K | 0.5 |
| QA | $5-8K | 0.5-1 |

**Team Cost Estimates:**
- Startup phase (4 people): ~$40-60K/month
- Growth phase (6 people): ~$60-90K/month
- Scale phase (10 people): ~$100-150K/month

### 5.2 Security & Compliance

| Item | Cost | Frequency |
|------|------|-----------|
| Penetration Testing | $5-15K | Annual |
| SOC 2 Type II Audit | $30-80K | Annual |
| Legal/DPO Consulting | $2-5K | As needed |
| Security Tools | $500-2K/mo | Monthly |

**Annual Security Budget:** $40-100K (depending on stage)

---

## 6. Total Cost Summary

### 6.1 Infrastructure Only (Monthly)

| Component | Startup | Growth | Scale | Enterprise |
|-----------|---------|--------|-------|------------|
| Supabase (2 regions) | $50 | $50 | $624 | $1,198 |
| Vercel | $40 | $80 | $120 | $500 |
| AI (Claude) | $20 | $100 | $400 | $1,000 |
| AI (GPT-4 fallback) | $10 | $50 | $100 | $200 |
| Email (Resend) | $0 | $20 | $50 | $100 |
| Monitoring | $0 | $26 | $51 | $180 |
| External APIs | $0 | $25 | $50 | $100 |
| Domain/SSL (amortized) | $2 | $2 | $2 | $2 |
| **Buffer (20%)** | $24 | $71 | $279 | $656 |
| **TOTAL** | **$146** | **$424** | **$1,676** | **$3,936** |

### 6.2 With Compute/Storage Overages

Adding realistic overages for growing platforms:

| Scale | Base | Overages | Total/Month |
|-------|------|----------|-------------|
| **Startup** | $146 | $50 | **~$200** |
| **Growth** | $424 | $150 | **~$575** |
| **Scale** | $1,676 | $500 | **~$2,175** |
| **Enterprise** | $3,936 | $1,500 | **~$5,500** |

### 6.3 Full Operational Cost (Including Team & Compliance)

| Scale | Infrastructure | Team | Compliance | Total/Month |
|-------|----------------|------|------------|-------------|
| **Startup** | $200 | $50,000 | $3,000 | **~$53,200** |
| **Growth** | $575 | $75,000 | $5,000 | **~$80,575** |
| **Scale** | $2,175 | $120,000 | $8,000 | **~$130,175** |
| **Enterprise** | $5,500 | $180,000 | $15,000 | **~$200,500** |

---

## 7. Revenue Projections vs Costs

### 7.1 Pricing Model (from ADR-001)

| Tier | Monthly Price | Included Vendors | Overage |
|------|---------------|------------------|---------|
| **Starter** | $499 | 25 vendors | $15/vendor |
| **Professional** | $1,499 | 100 vendors | $12/vendor |
| **Enterprise** | $4,999+ | Unlimited | Custom |

### 7.2 Break-Even Analysis

| Scale | Customers | Avg Revenue | Monthly Revenue | Costs | Profit/Loss |
|-------|-----------|-------------|-----------------|-------|-------------|
| **Startup** | 10 | $800 | $8,000 | $53,200 | **-$45,200** |
| **Growth** | 50 | $1,000 | $50,000 | $80,575 | **-$30,575** |
| **Scale** | 200 | $1,200 | $240,000 | $130,175 | **+$109,825** |
| **Enterprise** | 500 | $1,500 | $750,000 | $200,500 | **+$549,500** |

**Break-even point:** ~80-100 customers

### 7.3 Unit Economics

| Metric | Startup | Growth | Scale |
|--------|---------|--------|-------|
| Infrastructure/Customer | $20 | $11.50 | $10.88 |
| Full Cost/Customer | $5,320 | $1,612 | $651 |
| Revenue/Customer | $800 | $1,000 | $1,200 |
| Gross Margin (infra only) | 97.5% | 98.9% | 99.1% |
| Net Margin (with team) | -565% | -61% | +46% |

---

## 8. Cost Optimization Strategies

### 8.1 Immediate Optimizations

| Strategy | Savings | Implementation |
|----------|---------|----------------|
| **AI Caching** | 30-50% on AI | Cache parsed docs, never re-parse |
| **Use Haiku for simple tasks** | 80% on some AI | Route by complexity |
| **Optimize DB queries** | 20% on Supabase | Indexes, query analysis |
| **Edge caching** | 15% on Vercel | Cache API responses |
| **Batch operations** | 10% overall | Batch API calls |

### 8.2 Scale Optimizations

| Strategy | When | Savings |
|----------|------|---------|
| **Negotiate Supabase Enterprise** | >100 customers | 20-30% |
| **Negotiate Vercel Enterprise** | >100 customers | 20-30% |
| **Anthropic volume pricing** | >$1K/month | 15-25% |
| **Reserved capacity** | Predictable load | 30-40% |

### 8.3 Architecture Optimizations

| Strategy | Impact | Effort |
|----------|--------|--------|
| **Single-region for non-EU** | -$25-600/mo | Low |
| **Self-hosted Supabase** | -40% on DB | High |
| **Move to AWS/GCP** | Variable | Very High |

---

## 9. Cost Monitoring & Alerts

### 9.1 Key Metrics to Track

```typescript
const COST_ALERTS = {
  // AI costs (biggest variable)
  ai_daily_spend: { warning: 50, critical: 100 },
  ai_cost_per_doc: { warning: 0.60, critical: 1.00 },

  // Database
  db_size_gb: { warning: 6, critical: 7.5 }, // Pro limit is 8GB
  db_connections: { warning: 80, critical: 95 },

  // Storage
  storage_gb: { warning: 80, critical: 95 },

  // Bandwidth
  bandwidth_gb: { warning: 800, critical: 950 }, // 1TB limit
};
```

### 9.2 Monthly Cost Review Checklist

- [ ] Review AI token usage by document type
- [ ] Check database size and egress
- [ ] Verify storage utilization
- [ ] Analyze bandwidth consumption
- [ ] Review Vercel function invocations
- [ ] Check for unused resources
- [ ] Compare actual vs projected

---

## 10. Recommendations

### 10.1 For MVP/Startup Phase

| Decision | Recommendation | Monthly Cost |
|----------|----------------|--------------|
| Supabase | Pro (2 regions) | $50 |
| Vercel | Pro (2 seats) | $40 |
| AI | Claude 3.5 Sonnet | $20-50 |
| Email | Resend Free | $0 |
| Monitoring | Free tiers | $0 |
| **Total Infrastructure** | | **~$150-200** |

### 10.2 For Growth Phase

| Decision | Recommendation | Monthly Cost |
|----------|----------------|--------------|
| Supabase | Pro → Team (EU) | $624 |
| Vercel | Pro (4 seats) | $80 |
| AI | Claude + caching | $100-200 |
| Email | Resend Starter | $20 |
| Monitoring | Paid tiers | $50 |
| **Total Infrastructure** | | **~$900-1,000** |

### 10.3 Key Takeaways

1. **AI costs are the main variable** - invest in caching and optimization early
2. **Infrastructure is cheap** - $150-200/month for MVP is very reasonable
3. **Team costs dominate** - infrastructure is <5% of total costs
4. **Break-even at ~80-100 customers** - achievable with good execution
5. **Gross margins are excellent** - 97%+ on infrastructure alone
6. **Supabase Pro is sufficient** for a long time - don't over-provision

---

## Appendix: Vendor Pricing Links

- [Supabase Pricing](https://supabase.com/pricing)
- [Vercel Pricing](https://vercel.com/pricing)
- [Anthropic Pricing](https://www.anthropic.com/api)
- [OpenAI Pricing](https://openai.com/pricing)
- [Resend Pricing](https://resend.com/pricing)
- [Sentry Pricing](https://sentry.io/pricing/)

---

**Last Updated:** 2024-12-29
