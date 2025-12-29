# ADR-005: AI Model Strategy for Document Parsing

**Status:** Proposed
**Date:** 2024-12-29
**Decision Makers:** Engineering, Product

---

## Context

AI parsing costs are the main variable cost in our infrastructure. We need to decide whether to:
1. Use premium models (Claude 3.5 Sonnet) for everything
2. Use cheaper models (Haiku, GPT-4o-mini) for everything
3. Implement a hybrid routing strategy

The core tension: **Cost savings vs. accuracy in a compliance-critical domain.**

---

## Model Comparison

### Available Models (Dec 2024)

| Model | Input Cost | Output Cost | Context | Strengths |
|-------|------------|-------------|---------|-----------|
| **Claude 3.5 Sonnet** | $3/M | $15/M | 200K | Best reasoning, long docs |
| **Claude 3 Haiku** | $0.25/M | $1.25/M | 200K | Fast, cheap, good for simple |
| **GPT-4o** | $2.50/M | $10/M | 128K | Good vision/OCR |
| **GPT-4o-mini** | $0.15/M | $0.60/M | 128K | Very cheap, structured tasks |
| **Gemini 1.5 Flash** | $0.075/M | $0.30/M | 1M | Cheapest, long context |

### Cost Difference (Per SOC 2 Report ~150K input, 10K output)

| Model | Cost/Doc | vs Sonnet |
|-------|----------|-----------|
| Claude 3.5 Sonnet | $0.60 | baseline |
| Claude 3 Haiku | $0.05 | **12x cheaper** |
| GPT-4o-mini | $0.03 | **20x cheaper** |
| Gemini Flash | $0.01 | **60x cheaper** |

---

## Task Complexity Analysis

### Extraction Tasks by Difficulty

| Task | Complexity | Risk if Wrong | Recommended Model |
|------|------------|---------------|-------------------|
| **Document type classification** | Low | Low | Haiku/Mini |
| **Basic metadata** (dates, names, cert #) | Low | Medium | Haiku/Mini |
| **Audit opinion extraction** | Low | High | Sonnet (critical) |
| **Control list extraction** | Medium | Medium | Haiku + validation |
| **Control description parsing** | Medium | Medium | Haiku/Sonnet |
| **Exception identification** | High | High | **Sonnet required** |
| **Exception root cause analysis** | High | High | **Sonnet required** |
| **Subservice org detection** | Medium | High | Sonnet (compliance) |
| **CUEC extraction** | Medium | Medium | Haiku + review |
| **DORA provision analysis** | High | Critical | **Sonnet required** |
| **Contract clause interpretation** | High | Critical | **Sonnet required** |
| **ISO 27001 SoA mapping** | Medium | Medium | Haiku + validation |

### Risk Assessment

**What happens if we get it wrong?**

| Error Type | Impact | Frequency Risk (cheap model) |
|------------|--------|------------------------------|
| Wrong audit opinion | Customer submits incorrect RoI | Low but catastrophic |
| Missed exception | Vendor risk understated | Medium |
| Missed subservice org | 4th party risk invisible | Medium |
| Wrong control mapping | Gap analysis inaccurate | High |
| Missed DORA provision | Contract non-compliant | Medium |

---

## Empirical Testing Recommendations

Before deciding, we should run benchmarks:

### Test Protocol

```typescript
// Benchmark structure
interface ModelBenchmark {
  model: string;
  document_type: 'soc2' | 'iso27001' | 'contract';
  task: string;

  // Metrics
  accuracy: number;        // vs human-verified ground truth
  latency_ms: number;
  cost_per_doc: number;

  // Quality dimensions
  completeness: number;    // Did it find all items?
  precision: number;       // Are found items correct?
  format_compliance: number; // Did it follow schema?
}
```

### Suggested Test Set

1. **10 diverse SOC 2 reports** (Big 4, regional firms, different formats)
2. **10 ISO 27001 certificates** (different certification bodies)
3. **10 contracts** (varying complexity and length)
4. **Ground truth:** Human-verified extractions

### Key Questions to Answer

1. Does Haiku miss exceptions that Sonnet catches?
2. Does Haiku misclassify control test results?
3. Can GPT-4o-mini handle unstructured SOC 2 formats?
4. What's the false negative rate for subservice orgs?

---

## Proposed Hybrid Strategy

### Tier 1: Always Use Sonnet (Non-Negotiable)

These tasks are too critical for cheaper models:

```typescript
const SONNET_REQUIRED_TASKS = [
  'audit_opinion_extraction',      // Wrong opinion = regulatory risk
  'exception_detection',           // Missing exceptions = understated risk
  'exception_analysis',            // Root cause requires reasoning
  'dora_provision_analysis',       // Contract compliance is critical
  'critical_function_assessment',  // Affects RoI classification
  'data_breach_detection',         // Incident reporting trigger
];
```

**Rationale:** These directly impact regulatory compliance. A $0.55 savings is not worth a compliance failure.

### Tier 2: Use Haiku with Validation

These tasks can use cheaper models IF we validate:

```typescript
const HAIKU_WITH_VALIDATION = [
  'control_list_extraction',       // Validate count against expected
  'control_description_parsing',   // Spot-check confidence
  'iso_soa_control_mapping',       // Cross-reference with standard
  'subservice_org_detection',      // Flag for human review
  'cuec_extraction',               // Validate against control refs
];

// Validation strategy
async function extractWithValidation(task: string, doc: Document) {
  const result = await callHaiku(task, doc);

  // Automatic validation
  const validation = await validateExtraction(result, task);

  if (validation.confidence < 0.85 || validation.anomalies.length > 0) {
    // Escalate to Sonnet
    return await callSonnet(task, doc);
  }

  return result;
}
```

**Expected outcome:** 70-80% stay with Haiku, 20-30% escalate to Sonnet

### Tier 3: Always Use Haiku/Mini (Safe)

These tasks are simple enough for cheap models:

```typescript
const CHEAP_MODEL_SAFE = [
  'document_type_classification',  // Simple classification
  'basic_metadata_extraction',     // Dates, names, cert numbers
  'page_count_verification',       // Trivial
  'language_detection',            // Trivial
  'table_of_contents_parsing',     // Structured
];
```

---

## Cost Impact Analysis

### Scenario: 1,000 documents/month (Scale phase)

**Current (All Sonnet):**
| Documents | Cost/Doc | Total |
|-----------|----------|-------|
| 1,000 | $0.60 | **$600/month** |

**Hybrid Strategy:**
| Tier | % of Work | Model | Cost/Doc | Total |
|------|-----------|-------|----------|-------|
| Tier 1 (Sonnet) | 30% | Sonnet | $0.60 | $180 |
| Tier 2 (Haiku + 25% escalation) | 50% | Mixed | $0.18 | $90 |
| Tier 3 (Haiku) | 20% | Haiku | $0.05 | $10 |
| **Total** | | | | **$280/month** |

**Savings: ~53% ($320/month at scale)**

### Break-Even on Development

| Investment | Cost |
|------------|------|
| Build routing logic | 20 dev hours (~$2K) |
| Build validation layer | 30 dev hours (~$3K) |
| Benchmark testing | 20 dev hours (~$2K) |
| **Total** | **~$7K** |

**Payback period:** ~2-3 months at scale

---

## Risk Mitigation

### 1. Confidence Scoring (Required)

Every extraction must include confidence scores:

```typescript
interface ExtractionResult {
  data: ExtractedData;
  confidence: {
    overall: number;          // 0-1
    per_field: Record<string, number>;
    model_used: string;
    escalated: boolean;
  };
  review_required: boolean;   // Auto-flag if confidence < 0.85
}
```

### 2. Human Review Queue

Low-confidence extractions go to review queue:

```
Extraction Pipeline:

Document → Classify → Route to Model → Extract → Validate
                                            ↓
                                    Confidence < 85%?
                                      ↓ Yes      ↓ No
                                Review Queue   Store
                                      ↓
                                Human Review
                                      ↓
                              Store (corrected)
```

### 3. Continuous Monitoring

Track accuracy by model over time:

```typescript
const ACCURACY_ALERTS = {
  // Alert if model accuracy drops
  haiku_exception_detection: { min_accuracy: 0.90, alert: 'slack' },
  haiku_control_extraction: { min_accuracy: 0.92, alert: 'slack' },

  // Alert if escalation rate spikes
  haiku_escalation_rate: { max_rate: 0.35, alert: 'pagerduty' },
};
```

### 4. A/B Testing Framework

Randomly route 10% to Sonnet for comparison:

```typescript
async function extractWithShadow(task: string, doc: Document) {
  const primaryResult = await callHaiku(task, doc);

  // 10% shadow with Sonnet
  if (Math.random() < 0.10) {
    const shadowResult = await callSonnet(task, doc);
    await logComparison(primaryResult, shadowResult);
  }

  return primaryResult;
}
```

---

## Recommendation

### Phase 1 (MVP): Conservative Approach

**Use Sonnet for everything initially.**

Rationale:
- We need to establish accuracy baselines
- Compliance is too important to risk early
- Cost difference is ~$400/month at startup scale
- Focus on product-market fit, not cost optimization

### Phase 2 (Post-100 customers): Implement Hybrid

Once we have:
- Ground truth dataset from human reviews
- Confidence in our validation logic
- Customer trust established

Then implement:
1. Tier 3 (cheap) for simple tasks
2. Tier 2 (Haiku + validation) with monitoring
3. Keep Tier 1 (Sonnet) for critical tasks

### Phase 3 (Scale): Optimize Aggressively

With data:
- Fine-tune routing thresholds
- Consider fine-tuned models
- Evaluate new models as released

---

## Decision

**Recommended:** Start with Sonnet-only, implement hybrid at 100+ customers.

| Phase | Strategy | Monthly AI Cost (1K docs) |
|-------|----------|---------------------------|
| MVP | All Sonnet | $600 |
| Growth | Hybrid (conservative) | $400 |
| Scale | Hybrid (optimized) | $280 |

**The $320/month savings is not worth risking product quality or customer trust in the early stages.**

---

## Appendix: Model Selection Decision Tree

```
                    ┌─────────────────────┐
                    │   Extraction Task   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ Is it compliance    │
                    │ critical?           │
                    └──────────┬──────────┘
                               │
              ┌────────────────┴────────────────┐
              │ Yes                             │ No
              ▼                                 ▼
    ┌─────────────────┐              ┌─────────────────┐
    │ Use Sonnet      │              │ Is it simple    │
    │ (no exceptions) │              │ structured data?│
    └─────────────────┘              └────────┬────────┘
                                              │
                            ┌─────────────────┴─────────────────┐
                            │ Yes                               │ No
                            ▼                                   ▼
                  ┌─────────────────┐              ┌─────────────────┐
                  │ Use Haiku/Mini  │              │ Use Haiku with  │
                  │ (cost optimize) │              │ validation      │
                  └─────────────────┘              └────────┬────────┘
                                                           │
                                                  ┌────────▼────────┐
                                                  │ Confidence      │
                                                  │ < 85%?          │
                                                  └────────┬────────┘
                                                           │
                                            ┌──────────────┴──────────────┐
                                            │ Yes                         │ No
                                            ▼                             ▼
                                  ┌─────────────────┐          ┌─────────────────┐
                                  │ Escalate to     │          │ Accept Haiku    │
                                  │ Sonnet          │          │ result          │
                                  └─────────────────┘          └─────────────────┘
```

---

**Last Updated:** 2024-12-29
