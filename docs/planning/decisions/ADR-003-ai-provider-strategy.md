# ADR-003: AI Provider Strategy

## Metadata

| Field | Value |
|-------|-------|
| **Status** | Accepted |
| **Date** | 2024-12-28 |
| **Author** | Engineering Team |
| **Deciders** | Founder |

---

## Context

We needed to decide on the AI provider strategy for document parsing: single provider, multi-provider, or custom model.

## Decision

**Claude (Anthropic) as primary, GPT-4 as fallback.**

- **Primary**: Anthropic Claude (claude-3-5-sonnet or opus for complex docs)
- **Fallback**: OpenAI GPT-4 Vision for OCR-heavy or failed parses
- **Future**: Evaluate custom fine-tuned models once we have training data

## Rationale

1. **Claude strengths**: Superior reasoning for structured extraction, longer context
2. **GPT-4V strengths**: Better OCR for scanned/image-heavy PDFs
3. **Redundancy**: If one provider has outage, we can failover
4. **No vendor lock-in**: Abstraction layer allows provider switching
5. **Data privacy**: Both providers offer no-retention API terms

## Implementation

```typescript
interface AIProvider {
  parse(document: Buffer, type: DocumentType): Promise<ParsedResult>;
}

class DocumentParser {
  private primary: AIProvider = new ClaudeProvider();
  private fallback: AIProvider = new GPT4Provider();

  async parse(doc: Buffer, type: DocumentType): Promise<ParsedResult> {
    try {
      return await this.primary.parse(doc, type);
    } catch (error) {
      console.warn('Primary AI failed, trying fallback', error);
      return await this.fallback.parse(doc, type);
    }
  }
}
```

## Consequences

### Positive
- High accuracy with Claude's reasoning capabilities
- Fallback ensures availability
- Flexibility to optimize per document type

### Negative
- Two API integrations to maintain
- Prompt engineering for two models
- Slightly higher complexity

---

**Decision Date:** 2024-12-28
