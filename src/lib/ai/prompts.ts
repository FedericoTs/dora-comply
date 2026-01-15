/**
 * AI Contract Analysis Prompts
 *
 * Optimized prompts for Claude to extract DORA Article 30 provisions from contracts
 * with strict document-only sourcing and precise citations
 */

// ============================================================================
// DORA Full Analysis Prompt (Claude Sonnet)
// ============================================================================

export const DORA_ANALYSIS_SYSTEM_PROMPT = `You are an expert legal analyst specializing in EU financial services regulation, specifically the Digital Operational Resilience Act (DORA).

## CRITICAL INSTRUCTIONS - READ CAREFULLY

### Rule 1: DOCUMENT-ONLY SOURCING
You must extract information EXCLUSIVELY from the provided document text.
- NEVER infer, assume, or add information not explicitly stated in the document
- NEVER use your general knowledge to fill gaps
- If information is not in the document, mark it as "missing" - do not guess
- If information is ambiguous or unclear, mark it as "unclear"

### Rule 2: MANDATORY CITATIONS
For EVERY piece of information you extract, you MUST provide:
- **Exact page number** (e.g., "Page 5")
- **Section reference** (e.g., "Section 3.2", "Clause 7.1", "Schedule A")
- **Paragraph or line context** (e.g., "first paragraph", "under heading 'Data Protection'")

Citation format: "Page X, Section Y.Z, [context]"
Example: "Page 12, Section 8.1, under 'Service Levels'"

If page numbers are not visible in the text, use relative positions like:
- "Beginning of document, Section 1"
- "Approximately 30% through document, under 'Liability'"

### Rule 3: VERBATIM EXCERPTS
When providing excerpts:
- Quote EXACTLY as written in the document
- Include enough context for verification (typically 1-3 sentences)
- Never paraphrase or summarize in excerpts
- Truncate long passages with [...] but keep key terms

### Rule 4: CONFIDENCE SCORING
Your confidence score (0.0-1.0) must reflect:
- 1.0: Explicit, clear statement with exact terms
- 0.7-0.9: Clear intent but not using exact regulatory language
- 0.4-0.6: Implied or indirect coverage
- 0.1-0.3: Tangentially related only
- 0.0: Not found at all

## DORA Article 30 Requirements

### Article 30.2 (Required for ALL ICT contracts):
1. **service_description**: Clear description of all ICT services to be provided (30.2a)
2. **data_locations**: Locations where data will be processed and stored, including subcontractors (30.2b)
3. **data_protection**: Provisions on data protection, confidentiality, and security of data (30.2c)
4. **availability_guarantees**: Provisions on service availability, including recovery objectives (30.2d)
5. **incident_support**: Obligation to provide assistance in case of ICT incidents (30.2e)
6. **authority_cooperation**: Obligation to cooperate with competent authorities and resolution authorities (30.2f)
7. **termination_rights**: Termination rights including notice periods and transition assistance (30.2g)
8. **subcontracting_conditions**: Conditions for subcontracting and chain oversight (30.2h)

### Article 30.3 (Additional for critical/important functions):
1. **sla_targets**: Full service level descriptions with precise quantitative/qualitative performance targets (30.3a)
2. **notice_periods**: Notice periods and reporting obligations for service changes (30.3b)
3. **business_continuity**: ICT business continuity provisions and disaster recovery testing (30.3c)
4. **ict_security**: ICT security measures including encryption, access control, vulnerability management (30.3d)
5. **tlpt_participation**: Rights to participate in and contribute to threat-led penetration testing (30.3e)
6. **audit_rights**: Unrestricted rights of access, inspection, and audit by the financial entity (30.3f)
7. **exit_strategy**: Exit strategies, transition periods, and data portability guarantees (30.3g)
8. **performance_access**: Full access to performance data, operational metrics, and reports (30.3h)

## Output Requirements

For each provision, provide:
- **status**: "present" | "partial" | "missing" | "unclear"
- **confidence**: 0.0 to 1.0
- **excerpts**: Array of verbatim quotes (max 3, most relevant)
- **location**: MANDATORY - "Page X, Section Y, [context]" format
- **analysis**: Brief assessment explaining your determination
- **gaps**: If partial, list specific missing elements

REMEMBER: If you cannot find clear evidence in the document, the provision is MISSING. Do not invent or assume.`;

export const DORA_ANALYSIS_USER_PROMPT = `Analyze the attached PDF document for DORA Article 30 compliance.

## CRITICAL: JSON STRUCTURE
You MUST respond with a valid JSON object using EXACTLY these field names. Do not add or change field names.

## Required JSON Structure

\`\`\`json
{
  "contract_type": "string or null",
  "parties": [{"name": "string", "role": "provider|customer|other", "jurisdiction": "string or null"}],
  "effective_date": "YYYY-MM-DD or null",
  "expiry_date": "YYYY-MM-DD or null",
  "governing_law": "string or null",
  "article_30_2": {
    "service_description": {"status": "present|partial|missing", "confidence": 0.0-1.0, "excerpts": ["..."], "location": "Page X, Section Y", "analysis": "..."},
    "data_locations": {"status": "...", "confidence": 0.0, "excerpts": [], "location": null, "analysis": null},
    "data_protection": {"status": "...", "confidence": 0.0, "excerpts": [], "location": null, "analysis": null},
    "availability_guarantees": {"status": "...", "confidence": 0.0, "excerpts": [], "location": null, "analysis": null},
    "incident_support": {"status": "...", "confidence": 0.0, "excerpts": [], "location": null, "analysis": null},
    "authority_cooperation": {"status": "...", "confidence": 0.0, "excerpts": [], "location": null, "analysis": null},
    "termination_rights": {"status": "...", "confidence": 0.0, "excerpts": [], "location": null, "analysis": null},
    "subcontracting_conditions": {"status": "...", "confidence": 0.0, "excerpts": [], "location": null, "analysis": null}
  },
  "article_30_3": {
    "sla_targets": {"status": "...", "confidence": 0.0, "excerpts": [], "location": null, "analysis": null},
    "notice_periods": {"status": "...", "confidence": 0.0, "excerpts": [], "location": null, "analysis": null},
    "business_continuity": {"status": "...", "confidence": 0.0, "excerpts": [], "location": null, "analysis": null},
    "ict_security": {"status": "...", "confidence": 0.0, "excerpts": [], "location": null, "analysis": null},
    "tlpt_participation": {"status": "...", "confidence": 0.0, "excerpts": [], "location": null, "analysis": null},
    "audit_rights": {"status": "...", "confidence": 0.0, "excerpts": [], "location": null, "analysis": null},
    "exit_strategy": {"status": "...", "confidence": 0.0, "excerpts": [], "location": null, "analysis": null},
    "performance_access": {"status": "...", "confidence": 0.0, "excerpts": [], "location": null, "analysis": null}
  },
  "key_dates": [{"type": "effective|expiry|renewal|notice", "date": "YYYY-MM-DD", "description": "...", "location": "..."}],
  "financial_terms": {"currency": null, "annual_value": null, "total_value": null, "payment_terms": null, "location": null},
  "risk_flags": [{"severity": "low|medium|high|critical", "category": "...", "description": "...", "recommendation": "...", "location": "..."}],
  "compliance_gaps": [{"provision": "...", "article": "30.2|30.3", "description": "...", "remediation": "...", "priority": "low|medium|high"}],
  "article_30_2_score": 0-100,
  "article_30_3_score": 0-100,
  "overall_score": 0-100,
  "confidence_score": 0.0-1.0,
  "page_count": 5,
  "word_count": 3000
}
\`\`\`

## Field Definitions for Article 30.2 (Use EXACTLY these keys)

- **service_description**: Description of ICT services provided (DORA 30.2a)
- **data_locations**: Where data is processed/stored, including subcontractors (DORA 30.2b)
- **data_protection**: Data protection, confidentiality, security provisions (DORA 30.2c)
- **availability_guarantees**: Service availability, recovery time objectives (DORA 30.2d)
- **incident_support**: Assistance during ICT incidents (DORA 30.2e)
- **authority_cooperation**: Cooperation with competent authorities (DORA 30.2f)
- **termination_rights**: Termination clauses, notice periods, transition (DORA 30.2g)
- **subcontracting_conditions**: Subcontracting rules and oversight (DORA 30.2h)

## Field Definitions for Article 30.3 (Use EXACTLY these keys)

- **sla_targets**: Quantitative/qualitative SLA performance targets (DORA 30.3a)
- **notice_periods**: Notice and reporting for service changes (DORA 30.3b)
- **business_continuity**: BCM and disaster recovery testing (DORA 30.3c)
- **ict_security**: Security measures, encryption, access control (DORA 30.3d)
- **tlpt_participation**: Threat-led penetration testing rights (DORA 30.3e)
- **audit_rights**: Access, inspection, audit rights (DORA 30.3f)
- **exit_strategy**: Exit plans, transition, data portability (DORA 30.3g)
- **performance_access**: Access to performance metrics/reports (DORA 30.3h)

## Instructions

1. Read the ENTIRE PDF document thoroughly
2. For each of the 16 provisions above, search for relevant clauses
3. Set status to "present" if clearly addressed, "partial" if incomplete, "missing" if not found
4. Include verbatim excerpts where found
5. Calculate scores: (present provisions * 12.5) + (partial provisions * 6.25)

Respond with ONLY the JSON object. No markdown code blocks, no text before or after.`;

// ============================================================================
// Quick Document Scan Prompt (Claude Haiku - fast & cheap)
// ============================================================================

export const QUICK_SCAN_SYSTEM_PROMPT = `You are a document classification assistant. Your job is to quickly identify document type and extract basic metadata.

RULES:
1. Only extract information explicitly visible in the document
2. If information is not clear, use null
3. Be fast and concise - this is a quick scan, not deep analysis
4. Provide page/section references where possible`;

export const QUICK_SCAN_USER_PROMPT = `Quickly scan this document and identify:

## Document Text (First ~5000 characters)
---
{DOCUMENT_TEXT}
---

Extract and return as JSON:
{
  "document_type": "contract" | "sla" | "dpa" | "nda" | "master_agreement" | "amendment" | "soc2_report" | "iso_certificate" | "pentest_report" | "policy" | "other",
  "document_type_confidence": 0.0-1.0,
  "title": "Document title if visible" | null,
  "parties": [
    { "name": "Party name", "role": "provider" | "customer" | "other" }
  ],
  "effective_date": "YYYY-MM-DD" | null,
  "expiry_date": "YYYY-MM-DD" | null,
  "governing_law": "Jurisdiction" | null,
  "is_ict_contract": true | false,
  "likely_critical_function": true | false,
  "key_services_mentioned": ["service1", "service2"],
  "scan_notes": "Brief notes about what was found"
}

Only include information you can see. Return valid JSON only.`;

// ============================================================================
// Output Schema
// ============================================================================

export const CONTRACT_ANALYSIS_OUTPUT_SCHEMA = {
  type: "object",
  required: [
    "contract_type",
    "parties",
    "effective_date",
    "expiry_date",
    "governing_law",
    "article_30_2",
    "article_30_3",
    "key_dates",
    "financial_terms",
    "risk_flags",
    "compliance_gaps",
    "article_30_2_score",
    "article_30_3_score",
    "overall_score",
    "confidence_score"
  ],
  properties: {
    contract_type: {
      type: ["string", "null"],
      description: "Type of contract as explicitly stated in the document"
    },
    parties: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          role: { type: "string", enum: ["provider", "customer", "other"] },
          jurisdiction: { type: ["string", "null"] }
        }
      }
    },
    effective_date: { type: ["string", "null"] },
    expiry_date: { type: ["string", "null"] },
    governing_law: { type: ["string", "null"] },
    article_30_2: {
      type: "object",
      properties: {
        service_description: { $ref: "#/$defs/provision" },
        data_locations: { $ref: "#/$defs/provision" },
        data_protection: { $ref: "#/$defs/provision" },
        availability_guarantees: { $ref: "#/$defs/provision" },
        incident_support: { $ref: "#/$defs/provision" },
        authority_cooperation: { $ref: "#/$defs/provision" },
        termination_rights: { $ref: "#/$defs/provision" },
        subcontracting_conditions: { $ref: "#/$defs/provision" }
      }
    },
    article_30_3: {
      type: "object",
      properties: {
        sla_targets: { $ref: "#/$defs/provision" },
        notice_periods: { $ref: "#/$defs/provision" },
        business_continuity: { $ref: "#/$defs/provision" },
        ict_security: { $ref: "#/$defs/provision" },
        tlpt_participation: { $ref: "#/$defs/provision" },
        audit_rights: { $ref: "#/$defs/provision" },
        exit_strategy: { $ref: "#/$defs/provision" },
        performance_access: { $ref: "#/$defs/provision" }
      }
    },
    key_dates: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["effective", "expiry", "renewal", "notice", "other"] },
          date: { type: "string" },
          description: { type: "string" },
          location: { type: "string", description: "Page and section reference" }
        }
      }
    },
    financial_terms: {
      type: "object",
      properties: {
        currency: { type: ["string", "null"] },
        annual_value: { type: ["number", "null"] },
        total_value: { type: ["number", "null"] },
        payment_terms: { type: ["string", "null"] },
        penalties: { type: "array", items: { type: "string" } },
        location: { type: ["string", "null"], description: "Page and section reference" }
      }
    },
    risk_flags: {
      type: "array",
      items: {
        type: "object",
        properties: {
          severity: { type: "string", enum: ["low", "medium", "high", "critical"] },
          category: { type: "string" },
          description: { type: "string" },
          recommendation: { type: "string" },
          location: { type: "string", description: "Page and section reference where issue was found" }
        }
      }
    },
    compliance_gaps: {
      type: "array",
      items: {
        type: "object",
        properties: {
          provision: { type: "string" },
          article: { type: "string" },
          description: { type: "string" },
          remediation: { type: "string" },
          priority: { type: "string", enum: ["low", "medium", "high"] }
        }
      }
    },
    article_30_2_score: { type: "number", minimum: 0, maximum: 100 },
    article_30_3_score: { type: "number", minimum: 0, maximum: 100 },
    overall_score: { type: "number", minimum: 0, maximum: 100 },
    confidence_score: { type: "number", minimum: 0, maximum: 1 }
  },
  $defs: {
    provision: {
      type: "object",
      required: ["status", "confidence", "location"],
      properties: {
        status: {
          type: "string",
          enum: ["present", "partial", "missing", "unclear"],
          description: "Based ONLY on explicit document text"
        },
        confidence: {
          type: "number",
          minimum: 0,
          maximum: 1,
          description: "Confidence based on clarity of source text"
        },
        excerpts: {
          type: "array",
          items: { type: "string" },
          description: "VERBATIM quotes from the document"
        },
        location: {
          type: ["string", "null"],
          description: "MANDATORY: Page X, Section Y format"
        },
        analysis: {
          type: ["string", "null"],
          description: "Assessment based only on document content"
        },
        gaps: {
          type: "array",
          items: { type: "string" },
          description: "Specific elements missing from the document"
        }
      }
    }
  }
};

export const QUICK_SCAN_OUTPUT_SCHEMA = {
  type: "object",
  required: ["document_type", "document_type_confidence", "is_ict_contract"],
  properties: {
    document_type: {
      type: "string",
      enum: ["contract", "sla", "dpa", "nda", "master_agreement", "amendment", "soc2_report", "iso_certificate", "pentest_report", "policy", "other"]
    },
    document_type_confidence: { type: "number", minimum: 0, maximum: 1 },
    title: { type: ["string", "null"] },
    parties: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          role: { type: "string", enum: ["provider", "customer", "other"] }
        }
      }
    },
    effective_date: { type: ["string", "null"] },
    expiry_date: { type: ["string", "null"] },
    governing_law: { type: ["string", "null"] },
    is_ict_contract: { type: "boolean" },
    likely_critical_function: { type: "boolean" },
    key_services_mentioned: { type: "array", items: { type: "string" } },
    scan_notes: { type: ["string", "null"] }
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

export function buildAnalysisPrompt(): string {
  // For direct PDF analysis, we don't need to insert contract text
  // The PDF is sent as a document attachment alongside this prompt
  return DORA_ANALYSIS_USER_PROMPT;
}

export function buildQuickScanPrompt(documentText: string): string {
  // Use first ~5000 chars for quick scan
  const truncatedText = documentText.slice(0, 5000);
  return QUICK_SCAN_USER_PROMPT.replace('{DOCUMENT_TEXT}', truncatedText);
}
