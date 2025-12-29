# ADR-002: Multi-Tenant Architecture

## Metadata

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Date** | 2024-12-28 |
| **Author** | Engineering Team |
| **Deciders** | Founder |

---

## Context

We needed to decide between multi-tenant (shared infrastructure with logical isolation) vs. dedicated instances per customer for data isolation.

## Decision

**We will use multi-tenant architecture with Row-Level Security (RLS).**

All customers share the same Supabase instances (per region), with strict RLS policies ensuring data isolation at the database level.

## Rationale

1. **Cost efficiency**: Single infrastructure to maintain and scale
2. **Faster onboarding**: No instance provisioning per customer
3. **Simpler operations**: One deployment, one monitoring stack
4. **Supabase RLS**: Battle-tested isolation mechanism
5. **Regional separation**: US and EU instances provide sufficient isolation for data residency

## Implementation

```sql
-- All tenant-scoped tables use RLS
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org isolation" ON vendors
  FOR ALL USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );
```

## Consequences

### Positive
- Lower infrastructure costs
- Faster time to market
- Simpler deployments and updates

### Negative
- Cannot offer dedicated instances to enterprise (yet)
- Noisy neighbor risk (mitigated by Supabase pooling)
- Some enterprise buyers may require dedicated (defer to future)

## Future Consideration

If enterprise demand for dedicated instances materializes, we can offer "Dedicated Cloud" tier with isolated Supabase projects, charging premium pricing.

---

**Decision Date:** 2024-12-28
