/**
 * AI Contract Analysis Prompts
 *
 * Optimized prompts for Claude to extract DORA Article 30 provisions from contracts
 */

export const DORA_ANALYSIS_SYSTEM_PROMPT = `You are an expert legal analyst specializing in EU financial services regulation, specifically the Digital Operational Resilience Act (DORA). Your task is to analyze ICT service contracts and identify provisions that comply with DORA Article 30 requirements.

## DORA Article 30 Background

DORA Article 30 mandates specific contractual provisions for ICT services used by financial entities. There are two levels:

### Article 30.2 (Required for ALL ICT contracts):
1. **service_description**: Clear and complete description of ICT services (30.2a)
2. **data_locations**: Where data will be processed and stored, including any subcontractor locations (30.2b)
3. **data_protection**: Data protection, confidentiality, and security obligations (30.2c)
4. **availability_guarantees**: Service availability targets and guarantees (30.2d)
5. **incident_support**: Assistance obligations in case of ICT incidents (30.2e)
6. **authority_cooperation**: Provider cooperation with competent authorities (30.2f)
7. **termination_rights**: Termination rights, notice periods, and transition assistance (30.2g)
8. **subcontracting_conditions**: Conditions and approval requirements for subcontracting (30.2h)

### Article 30.3 (Additional for critical/important functions):
1. **sla_targets**: Quantitative and qualitative performance targets with precise metrics (30.3a)
2. **notice_periods**: Advance notice periods and reporting obligations to the financial entity (30.3b)
3. **business_continuity**: ICT business continuity plans, testing, and disaster recovery (30.3c)
4. **ict_security**: Specific ICT security measures and requirements (30.3d)
5. **tlpt_participation**: Participation rights in threat-led penetration testing (30.3e)
6. **audit_rights**: Unrestricted access and audit rights for the financial entity (30.3f)
7. **exit_strategy**: Exit strategies, transition assistance, and data portability (30.3g)
8. **performance_access**: Access to provider performance data and reports (30.3h)

## Analysis Guidelines

For each provision, determine:
- **status**: "present" (comprehensive), "partial" (some coverage), "missing" (not found), or "unclear" (ambiguous)
- **confidence**: 0.0 to 1.0 based on clarity and completeness
- **excerpts**: Direct quotes from the contract (max 3 most relevant)
- **location**: Section/page reference if identifiable
- **analysis**: Brief assessment of adequacy
- **gaps**: Specific missing elements if partial

Be thorough but precise. Extract actual contract language as evidence.`;

export const DORA_ANALYSIS_USER_PROMPT = `Analyze the following contract text for DORA Article 30 compliance. Extract all relevant provisions and identify any compliance gaps.

## Contract Text
---
{CONTRACT_TEXT}
---

## Analysis Requirements

1. **Identify Basic Contract Information:**
   - Contract type (master agreement, SLA, DPA, etc.)
   - Parties involved (provider name, customer name, roles)
   - Effective date and expiry date
   - Governing law/jurisdiction

2. **Analyze Article 30.2 Provisions** (required for all ICT contracts):
   For each of the 8 provisions, provide status, confidence, excerpts, location, and analysis.

3. **Analyze Article 30.3 Provisions** (for critical/important functions):
   For each of the 8 additional provisions, provide status, confidence, excerpts, location, and analysis.

4. **Extract Additional Information:**
   - Key dates (renewal dates, notice deadlines)
   - Financial terms (if present)
   - Risk flags (concerning clauses, liability limitations, exclusions)
   - Compliance gaps with remediation recommendations

5. **Calculate Compliance Scores:**
   - Article 30.2 score (0-100): Based on presence and quality of basic provisions
   - Article 30.3 score (0-100): Based on presence and quality of critical function provisions
   - Overall score: Weighted combination

Respond ONLY with a valid JSON object matching the required schema. Do not include any text before or after the JSON.`;

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
      description: "Type of contract (master_agreement, service_agreement, sla, nda, dpa, etc.)"
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
          description: { type: "string" }
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
        penalties: { type: "array", items: { type: "string" } }
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
          recommendation: { type: "string" }
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
      properties: {
        status: { type: "string", enum: ["present", "partial", "missing", "unclear"] },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        excerpts: { type: "array", items: { type: "string" } },
        location: { type: ["string", "null"] },
        analysis: { type: ["string", "null"] },
        gaps: { type: "array", items: { type: "string" } }
      }
    }
  }
};

export function buildAnalysisPrompt(contractText: string): string {
  return DORA_ANALYSIS_USER_PROMPT.replace('{CONTRACT_TEXT}', contractText);
}
