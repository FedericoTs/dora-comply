/**
 * NIS2 Questionnaire AI Extraction Prompts
 *
 * Prompts for extracting questionnaire answers from security documents
 */

import type { TemplateQuestion } from '../types';

/**
 * System prompt for NIS2 questionnaire extraction
 */
export const EXTRACTION_SYSTEM_PROMPT = `You are an expert security analyst specializing in extracting information from security documents for NIS2 compliance assessments.

Your task is to analyze uploaded security documents (SOC 2 reports, ISO 27001 certificates, security policies, etc.) and extract relevant information to answer NIS2 Article 21 security questionnaire questions.

## CRITICAL RULES:

1. **Document-Only Sourcing**: ONLY extract information that is explicitly stated in the provided documents. NEVER infer, assume, or generate information from general knowledge.

2. **Mandatory Citations**: For every extracted answer, provide the exact location in the document:
   - Page number (e.g., "Page 12")
   - Section reference (e.g., "Section 3.2 - Access Controls")
   - Paragraph context (e.g., "under 'Authentication Requirements'")

3. **Confidence Scoring**: Assign a confidence score (0.0-1.0) based on:
   - 1.0: Explicit, unambiguous statement directly answering the question
   - 0.8-0.9: Clear information with minor interpretation required
   - 0.6-0.7: Information present but requires context
   - 0.4-0.5: Partially visible or indirect evidence
   - 0.0-0.3: Limited or tangential information

4. **Answer Format**: Match the expected answer format:
   - For boolean questions: Return "true" or "false"
   - For select questions: Return the exact value from the options
   - For multiselect: Return an array of matching values
   - For text/textarea: Return the extracted text

5. **Missing Information**: If information is not found, mark confidence as 0.0 and explain what was searched for.

## OUTPUT FORMAT:

Return a JSON array of extracted answers:
\`\`\`json
{
  "extractions": [
    {
      "question_id": "uuid",
      "answer": "extracted answer value",
      "confidence": 0.85,
      "citation": "Page 15, Section 4.1 - Security Controls",
      "extraction_notes": "Optional notes about the extraction"
    }
  ],
  "summary": {
    "total_questions": 10,
    "extracted_count": 8,
    "high_confidence_count": 5,
    "pages_analyzed": 45
  }
}
\`\`\``;

/**
 * Generate extraction prompt for a set of questions
 */
export function generateExtractionPrompt(
  questions: TemplateQuestion[],
  documentType: string
): string {
  const questionsJson = questions.map((q) => ({
    id: q.id,
    question: q.question_text,
    type: q.question_type,
    options: q.options,
    keywords: q.ai_extraction_keywords,
    category: q.category,
  }));

  return `## DOCUMENT TYPE
${documentType.toUpperCase()} Document

## QUESTIONS TO ANSWER
${JSON.stringify(questionsJson, null, 2)}

## INSTRUCTIONS

1. Analyze the entire document carefully
2. For each question, search for relevant information using the provided keywords
3. Extract precise answers with exact citations
4. Apply appropriate confidence scores
5. Return results in the specified JSON format

Focus on NIS2 Article 21 categories:
- Policies on risk analysis and information system security
- Incident handling
- Business continuity and crisis management
- Supply chain security
- Security in network and information systems acquisition, development and maintenance
- Policies and procedures to assess the effectiveness of cybersecurity risk-management measures
- Basic cyber hygiene practices and cybersecurity training
- Policies and procedures regarding the use of cryptography
- Human resources security and access control policies
- Use of multi-factor authentication

Extract ALL relevant information for each question. If a question cannot be answered from the document, indicate this clearly.`;
}

/**
 * Generate keyword search prompt for initial document analysis
 */
export function generateKeywordSearchPrompt(questions: TemplateQuestion[]): string {
  // Collect all unique keywords
  const allKeywords = new Set<string>();
  questions.forEach((q) => {
    q.ai_extraction_keywords?.forEach((k) => allKeywords.add(k.toLowerCase()));
  });

  return `## KEYWORD ANALYSIS

Search the document for the following security-related keywords and concepts:

${Array.from(allKeywords)
  .map((k) => `- ${k}`)
  .join('\n')}

For each keyword found, note:
1. The page number
2. The surrounding context (1-2 sentences)
3. Relevance to security questionnaire questions

This analysis will guide the detailed extraction phase.`;
}

/**
 * SOC 2 specific extraction prompt
 */
export function generateSOC2ExtractionPrompt(questions: TemplateQuestion[]): string {
  return `## SOC 2 REPORT ANALYSIS

This is a SOC 2 (System and Organization Controls 2) audit report. Focus on these key sections:

1. **Management's Description of the System** - Contains information about:
   - Service organization's environment
   - Security infrastructure
   - Control environment

2. **Trust Services Criteria Coverage** - Look for controls related to:
   - Security (CC series)
   - Availability (A series)
   - Processing Integrity (PI series)
   - Confidentiality (C series)
   - Privacy (P series)

3. **Description of Tests and Results** - Contains:
   - Control descriptions
   - Test procedures
   - Test results and exceptions

4. **Subservice Organizations** - Information about:
   - Third-party providers
   - Carve-out vs. inclusive methods

## MAPPING TO QUESTIONNAIRE

${questions
  .map(
    (q) => `Question: "${q.question_text}"
Keywords: ${q.ai_extraction_keywords?.join(', ') || 'none specified'}
Look in: ${getSuggestedSOC2Section(q.category)}`
  )
  .join('\n\n')}

Extract answers by matching SOC 2 controls to questionnaire questions.`;
}

/**
 * ISO 27001 specific extraction prompt
 */
export function generateISO27001ExtractionPrompt(questions: TemplateQuestion[]): string {
  return `## ISO 27001 CERTIFICATE/AUDIT REPORT ANALYSIS

This is an ISO/IEC 27001 Information Security Management System document. Key areas to analyze:

1. **Scope of Certification** - What systems/processes are covered
2. **Statement of Applicability (SoA)** - Which controls are implemented
3. **ISMS Documentation** - Policies and procedures in place
4. **Control Implementation** - Specific control measures

## ISO 27001 ANNEX A CONTROLS MAPPING

- A.5: Information Security Policies
- A.6: Organization of Information Security
- A.7: Human Resource Security
- A.8: Asset Management
- A.9: Access Control
- A.10: Cryptography
- A.11: Physical and Environmental Security
- A.12: Operations Security
- A.13: Communications Security
- A.14: System Acquisition, Development and Maintenance
- A.15: Supplier Relationships
- A.16: Information Security Incident Management
- A.17: Business Continuity Management
- A.18: Compliance

## QUESTIONS TO ANSWER

${questions
  .map(
    (q) => `Question: "${q.question_text}"
Relevant Controls: ${getRelevantISO27001Controls(q.category)}
Keywords: ${q.ai_extraction_keywords?.join(', ') || 'none'}`
  )
  .join('\n\n')}`;
}

/**
 * Get suggested SOC 2 section for a NIS2 category
 */
function getSuggestedSOC2Section(category: string): string {
  const mapping: Record<string, string> = {
    policies: 'CC1 (Control Environment), CC2 (Communication and Information)',
    incident_handling: 'CC7 (System Operations), A1 (Availability)',
    business_continuity: 'CC9 (Risk Mitigation), A1 (Availability)',
    supply_chain: 'Subservice Organizations section, CC9',
    access_control: 'CC5 (Control Activities), CC6 (Logical and Physical Access)',
    cryptography: 'CC6 (Logical Access), System Description',
    vulnerability_management: 'CC7 (System Operations), CC8 (Change Management)',
    security_awareness: 'CC1 (Control Environment), CC2 (Communication)',
    asset_management: 'System Description, CC3 (Risk Assessment)',
    hr_security: 'CC1 (Control Environment), CC5 (Control Activities)',
  };
  return mapping[category] || 'All sections';
}

/**
 * Get relevant ISO 27001 controls for a NIS2 category
 */
function getRelevantISO27001Controls(category: string): string {
  const mapping: Record<string, string> = {
    policies: 'A.5 (Information Security Policies)',
    incident_handling: 'A.16 (Incident Management)',
    business_continuity: 'A.17 (Business Continuity)',
    supply_chain: 'A.15 (Supplier Relationships)',
    access_control: 'A.9 (Access Control)',
    cryptography: 'A.10 (Cryptography)',
    vulnerability_management: 'A.12 (Operations Security), A.14 (Development)',
    security_awareness: 'A.7 (Human Resource Security)',
    asset_management: 'A.8 (Asset Management)',
    hr_security: 'A.7 (Human Resource Security)',
  };
  return mapping[category] || 'All Annex A controls';
}

/**
 * Validate extraction results
 */
export function validateExtractionResult(result: unknown): boolean {
  if (!result || typeof result !== 'object') return false;

  const obj = result as Record<string, unknown>;
  if (!Array.isArray(obj.extractions)) return false;

  for (const extraction of obj.extractions) {
    if (typeof extraction !== 'object' || extraction === null) return false;
    const ext = extraction as Record<string, unknown>;
    if (typeof ext.question_id !== 'string') return false;
    if (typeof ext.confidence !== 'number') return false;
    if (ext.confidence < 0 || ext.confidence > 1) return false;
  }

  return true;
}
