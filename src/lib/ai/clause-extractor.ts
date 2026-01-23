/**
 * Contract Clause Extractor Service
 *
 * AI-powered clause extraction from contracts using Claude
 * Extracts key clauses like termination, liability, indemnification, etc.
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  ClauseType,
  ClauseRiskLevel,
  ContractClause,
} from '@/lib/contracts/types';

// ============================================================================
// Constants
// ============================================================================

const EXTRACTION_MODEL = 'claude-sonnet-4-20250514';

// ============================================================================
// Types
// ============================================================================

export interface ExtractedClause {
  clause_type: ClauseType;
  title: string;
  summary: string;
  full_text: string;
  location: string | null;
  risk_level: ClauseRiskLevel;
  risk_notes: string | null;
  dora_relevant: boolean;
  nis2_relevant: boolean;
  gdpr_relevant: boolean;
  ai_confidence: number;
  // Specific clause data
  liability_cap: number | null;
  liability_cap_currency: string | null;
  notice_period_days: number | null;
  key_obligations: string[];
  key_dates: { type: string; date: string; description: string }[];
}

export interface ClauseExtractionResult {
  clauses: ExtractedClause[];
  extraction_model: string;
  processing_time_ms: number;
  confidence_score: number;
}

// ============================================================================
// Prompts
// ============================================================================

const CLAUSE_EXTRACTION_SYSTEM_PROMPT = `You are an expert legal analyst specializing in contract clause extraction.

## CRITICAL INSTRUCTIONS

### Rule 1: DOCUMENT-ONLY SOURCING
Extract ONLY clauses that are explicitly present in the document.
- NEVER infer or fabricate clause content
- If a clause type is not found, do not include it in the output
- Extract verbatim text from the document

### Rule 2: MANDATORY CITATIONS
For every clause, provide:
- **location**: Page number and section reference (e.g., "Page 5, Section 3.2")
- **full_text**: Verbatim text of the clause (truncate with [...] if very long)

### Rule 3: RISK ASSESSMENT
Assess risk level for each clause:
- **critical**: Clauses that could cause severe financial or legal harm
- **high**: Significant risk that needs attention
- **medium**: Moderate risk, standard review needed
- **low**: Low risk, standard terms

### Rule 4: REGULATORY RELEVANCE
Mark clauses as relevant to:
- **DORA**: Digital Operational Resilience Act (ICT risk, data handling, audit rights, exit strategies)
- **NIS2**: Network and Information Security (cybersecurity, incident reporting, supply chain)
- **GDPR**: General Data Protection Regulation (personal data, data processing, transfers)

## Clause Types to Extract

1. **termination**: Termination rights, conditions, and procedures
2. **liability**: Liability limitations, caps, and exclusions
3. **indemnification**: Indemnity obligations and coverage
4. **confidentiality**: Confidentiality and non-disclosure terms
5. **data_protection**: Data handling, processing, and protection
6. **audit_rights**: Audit, inspection, and access rights
7. **subcontracting**: Subcontractor requirements and restrictions
8. **exit_strategy**: Exit planning, transition, and data return
9. **service_levels**: SLAs, performance targets, and penalties
10. **business_continuity**: BCM, disaster recovery, and resilience
11. **security_requirements**: Security measures, controls, and standards
12. **incident_notification**: Incident reporting and notification requirements
13. **intellectual_property**: IP ownership, licenses, and rights
14. **governing_law**: Jurisdiction and governing law
15. **dispute_resolution**: Dispute handling, arbitration, mediation
16. **force_majeure**: Force majeure and extraordinary circumstances
17. **insurance**: Insurance requirements and coverage
18. **other**: Other significant clauses`;

const CLAUSE_EXTRACTION_USER_PROMPT = `Analyze the attached PDF document and extract all significant contract clauses.

## Required JSON Output

Return a JSON object with this structure:

\`\`\`json
{
  "clauses": [
    {
      "clause_type": "termination|liability|indemnification|confidentiality|data_protection|audit_rights|subcontracting|exit_strategy|service_levels|business_continuity|security_requirements|incident_notification|intellectual_property|governing_law|dispute_resolution|force_majeure|insurance|other",
      "title": "Termination for Convenience",
      "summary": "Brief summary of the clause (1-2 sentences)",
      "full_text": "Verbatim text from the document [...truncated if long]",
      "location": "Page X, Section Y.Z",
      "risk_level": "low|medium|high|critical",
      "risk_notes": "Explanation of any risks or concerns",
      "dora_relevant": true|false,
      "nis2_relevant": true|false,
      "gdpr_relevant": true|false,
      "ai_confidence": 0.0-1.0,
      "liability_cap": null or number (for liability clauses only),
      "liability_cap_currency": null or "EUR"|"USD"|"GBP" etc,
      "notice_period_days": null or number (for termination/notice clauses),
      "key_obligations": ["Party A must...", "Party B shall..."],
      "key_dates": [{"type": "effective|expiry|notice", "date": "YYYY-MM-DD", "description": "..."}]
    }
  ],
  "confidence_score": 0.0-1.0
}
\`\`\`

## Instructions

1. Read the ENTIRE document thoroughly
2. Identify and extract ALL significant clauses (aim for 10-25 clauses typically)
3. For each clause:
   - Determine the most appropriate clause_type
   - Write a clear, concise title
   - Summarize the key points
   - Extract the verbatim full text (truncate long clauses with [...])
   - Cite the exact location
   - Assess risk level with justification
   - Mark regulatory relevance
   - Extract specific values (liability caps, notice periods, etc.) where applicable

4. Calculate overall confidence based on:
   - Document quality and readability
   - Clarity of clause boundaries
   - Completeness of extraction

Respond with ONLY the JSON object. No text before or after.`;

// ============================================================================
// Main Extraction Function
// ============================================================================

export interface ExtractClausesOptions {
  pdfBuffer: Buffer;
  apiKey: string;
  contractId?: string;
}

export async function extractClauses(
  options: ExtractClausesOptions
): Promise<ClauseExtractionResult> {
  const startTime = Date.now();

  const client = new Anthropic({
    apiKey: options.apiKey,
  });

  console.log('[Clause Extraction] Starting extraction, PDF size:', options.pdfBuffer.length, 'bytes');

  // Convert PDF to base64
  const pdfBase64 = options.pdfBuffer.toString('base64');

  const response = await client.messages.create({
    model: EXTRACTION_MODEL,
    max_tokens: 16384,
    system: CLAUSE_EXTRACTION_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: pdfBase64,
            },
          },
          {
            type: 'text',
            text: CLAUSE_EXTRACTION_USER_PROMPT,
          },
        ],
      },
    ],
  });

  // Extract text content from response
  const textContent = response.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  console.log('[Clause Extraction] Response received, parsing JSON...');

  // Parse JSON response
  let parsedResponse: { clauses: ExtractedClause[]; confidence_score: number };
  try {
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[Clause Extraction] No JSON in response:', textContent.text.slice(0, 500));
      throw new Error('No JSON found in response');
    }
    parsedResponse = JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('[Clause Extraction] Failed to parse response:', textContent.text.slice(0, 1000));
    throw new Error('Failed to parse AI response as JSON');
  }

  const processingTimeMs = Date.now() - startTime;

  console.log(
    '[Clause Extraction] Complete in',
    processingTimeMs,
    'ms. Found',
    parsedResponse.clauses?.length || 0,
    'clauses'
  );

  return {
    clauses: parsedResponse.clauses || [],
    extraction_model: EXTRACTION_MODEL,
    processing_time_ms: processingTimeMs,
    confidence_score: parsedResponse.confidence_score || 0,
  };
}

// ============================================================================
// Helper: Convert Extracted Clause to Database Format
// ============================================================================

export function mapExtractedClauseToDb(
  clause: ExtractedClause,
  contractId: string,
  organizationId: string
): Omit<ContractClause, 'id' | 'created_at' | 'updated_at'> {
  // Extract dates from key_dates if available
  const effectiveDate = clause.key_dates.find(d => d.type === 'effective')?.date || null;
  const expiryDate = clause.key_dates.find(d => d.type === 'expiry')?.date || null;

  return {
    organization_id: organizationId,
    contract_id: contractId,
    clause_type: clause.clause_type,
    title: clause.title,
    summary: clause.summary,
    full_text: clause.full_text,
    location: clause.location,
    ai_extracted: true,
    ai_confidence: clause.ai_confidence,
    extracted_at: new Date().toISOString(),
    risk_level: clause.risk_level,
    risk_notes: clause.risk_notes,
    effective_date: effectiveDate,
    expiry_date: expiryDate,
    notice_period_days: clause.notice_period_days,
    liability_cap: clause.liability_cap,
    liability_cap_currency: clause.liability_cap_currency || 'EUR',
    dora_relevant: clause.dora_relevant,
    nis2_relevant: clause.nis2_relevant,
    gdpr_relevant: clause.gdpr_relevant,
    review_status: 'pending',
    review_notes: null,
    reviewed_by: null,
    reviewed_at: null,
  };
}

// ============================================================================
// Export
// ============================================================================

export { EXTRACTION_MODEL };
