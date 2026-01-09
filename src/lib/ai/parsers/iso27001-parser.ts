/**
 * ISO 27001 Certificate Parser
 *
 * Extracts structured data from ISO 27001 certificates including:
 * - Certification details (body, scope, validity)
 * - Statement of Applicability (SoA) controls
 * - ISMS scope and boundaries
 * - Maps to DORA requirements
 */

import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

export const ISO27001_PARSER_VERSION = '1.0.0';
const MODEL = 'gemini-2.0-flash';

// =============================================================================
// Types
// =============================================================================

export interface ISO27001Control {
  clauseId: string; // e.g., "A.5.1", "5.1"
  controlName: string;
  controlObjective?: string;
  applicability: 'applicable' | 'not_applicable' | 'partially_applicable';
  implementation: 'implemented' | 'planned' | 'not_implemented' | 'unknown';
  justification?: string; // For not applicable controls
  evidence?: string;
}

export interface ParsedISO27001Certificate {
  // Certificate details
  certificateNumber: string;
  certificationBody: string;
  accreditationBody?: string;
  certifiedOrganization: string;
  organizationAddress?: string;

  // Validity
  initialCertificationDate?: string;
  issueDate: string;
  expiryDate: string;
  lastAuditDate?: string;
  nextSurveillanceDate?: string;

  // Scope
  scopeStatement: string;
  ismsScope?: string;
  exclusions?: string[];
  locations?: string[];

  // Standard version
  standardVersion: 'ISO/IEC 27001:2022' | 'ISO/IEC 27001:2013' | string;

  // Controls (from SoA if available)
  controls: ISO27001Control[];
  totalControls: number;
  applicableControls: number;
  implementedControls: number;

  // DORA mapping
  doraCoverage: {
    ictRiskManagement: number; // % coverage
    incidentManagement: number;
    operationalResilience: number;
    thirdPartyRisk: number;
    overall: number;
  };

  // Metadata
  confidenceScore: number;
  parserVersion: string;
  processedAt: string;
  processingTimeMs: number;
}

export interface ISO27001DatabaseRecord {
  document_id: string;
  certificate_number: string;
  certification_body: string;
  certified_organization: string;
  issue_date: string;
  expiry_date: string;
  scope_statement: string;
  standard_version: string;
  controls: ISO27001Control[];
  dora_coverage: ParsedISO27001Certificate['doraCoverage'];
  raw_extraction: ParsedISO27001Certificate;
  confidence_score: number;
}

export interface ISO27001ParseOptions {
  pdfBuffer: Buffer;
  documentId?: string;
  onProgress?: (message: string, percentage: number) => void;
}

export interface ISO27001ParseResult {
  success: boolean;
  data?: ParsedISO27001Certificate;
  databaseRecord?: ISO27001DatabaseRecord;
  error?: string;
  processingTimeMs: number;
}

// =============================================================================
// Extraction Prompt
// =============================================================================

const EXTRACTION_PROMPT = `You are an expert ISO 27001 auditor analyzing an ISO 27001 certificate or Statement of Applicability (SoA).

Extract ALL of the following information from this document:

1. CERTIFICATE DETAILS:
   - Certificate number
   - Certification body (e.g., BSI, TÜV, DNV, Bureau Veritas)
   - Accreditation body (e.g., UKAS, DAkkS)
   - Certified organization name
   - Organization address

2. VALIDITY DATES:
   - Initial certification date (first achieved)
   - Issue date (current certificate)
   - Expiry date
   - Last audit date
   - Next surveillance audit date

3. SCOPE:
   - Scope statement (exactly as written)
   - ISMS scope boundaries
   - Any exclusions from scope
   - Physical locations covered

4. STANDARD:
   - Standard version (ISO/IEC 27001:2022 or ISO/IEC 27001:2013)

5. CONTROLS (if Statement of Applicability is included):
   Extract controls from Annex A. For ISO 27001:2022, there are 93 controls in 4 themes.
   For ISO 27001:2013, there are 114 controls in 14 domains.

   For each control:
   - Clause ID (e.g., "A.5.1", "5.1")
   - Control name
   - Applicability status
   - Implementation status
   - Justification for exclusions

RESPOND WITH ONLY VALID JSON:
{
  "certificate": {
    "certificateNumber": "IS 123456",
    "certificationBody": "BSI",
    "accreditationBody": "UKAS",
    "certifiedOrganization": "Company Name Ltd",
    "organizationAddress": "123 Street, City, Country",
    "standardVersion": "ISO/IEC 27001:2022"
  },
  "validity": {
    "initialCertificationDate": "YYYY-MM-DD",
    "issueDate": "YYYY-MM-DD",
    "expiryDate": "YYYY-MM-DD",
    "lastAuditDate": "YYYY-MM-DD",
    "nextSurveillanceDate": "YYYY-MM-DD"
  },
  "scope": {
    "scopeStatement": "The ISMS applies to...",
    "ismsScope": "Development and operations of...",
    "exclusions": ["Clause X.Y excluded because..."],
    "locations": ["London, UK", "Dublin, Ireland"]
  },
  "controls": [
    {
      "clauseId": "A.5.1",
      "controlName": "Policies for information security",
      "applicability": "applicable",
      "implementation": "implemented",
      "justification": null,
      "evidence": "Information security policy documented"
    }
  ],
  "stats": {
    "totalControls": 93,
    "applicableControls": 90,
    "implementedControls": 88,
    "notApplicable": 3
  }
}`;

// =============================================================================
// Parser Function
// =============================================================================

export async function parseISO27001(
  options: ISO27001ParseOptions
): Promise<ISO27001ParseResult> {
  const startTime = Date.now();
  const { pdfBuffer, documentId, onProgress } = options;

  try {
    onProgress?.('Starting ISO 27001 extraction...', 5);

    const pdfBase64 = pdfBuffer.toString('base64');

    onProgress?.('Sending certificate to AI for analysis...', 15);

    const result = await generateText({
      model: google(MODEL),
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'file',
              data: pdfBase64,
              mediaType: 'application/pdf',
            },
            {
              type: 'text',
              text: EXTRACTION_PROMPT,
            },
          ],
        },
      ],
      maxOutputTokens: 16384,
      temperature: 0,
    });

    onProgress?.('Parsing AI response...', 70);

    // Parse JSON response
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    onProgress?.('Processing extracted data...', 80);

    // Build controls array
    const controls: ISO27001Control[] = (parsed.controls || []).map(
      (c: Record<string, unknown>) => ({
        clauseId: c.clauseId as string || '',
        controlName: c.controlName as string || '',
        controlObjective: c.controlObjective as string | undefined,
        applicability: (c.applicability as ISO27001Control['applicability']) || 'applicable',
        implementation: (c.implementation as ISO27001Control['implementation']) || 'unknown',
        justification: c.justification as string | undefined,
        evidence: c.evidence as string | undefined,
      })
    );

    onProgress?.('Calculating DORA coverage...', 90);

    // Calculate DORA coverage from ISO 27001 controls
    const doraCoverage = calculateDORACoverage(controls);

    const cert = parsed.certificate || {};
    const validity = parsed.validity || {};
    const scope = parsed.scope || {};
    const stats = parsed.stats || {};

    const parsedCertificate: ParsedISO27001Certificate = {
      certificateNumber: cert.certificateNumber || 'Unknown',
      certificationBody: cert.certificationBody || 'Unknown',
      accreditationBody: cert.accreditationBody,
      certifiedOrganization: cert.certifiedOrganization || 'Unknown',
      organizationAddress: cert.organizationAddress,

      initialCertificationDate: validity.initialCertificationDate,
      issueDate: validity.issueDate || '',
      expiryDate: validity.expiryDate || '',
      lastAuditDate: validity.lastAuditDate,
      nextSurveillanceDate: validity.nextSurveillanceDate,

      scopeStatement: scope.scopeStatement || '',
      ismsScope: scope.ismsScope,
      exclusions: scope.exclusions || [],
      locations: scope.locations || [],

      standardVersion: cert.standardVersion || 'ISO/IEC 27001:2022',

      controls,
      totalControls: controls.length || stats.totalControls || 0,
      applicableControls: stats.applicableControls || controls.filter(c => c.applicability === 'applicable').length,
      implementedControls: stats.implementedControls || controls.filter(c => c.implementation === 'implemented').length,

      doraCoverage,

      confidenceScore: controls.length > 0 ? 0.9 : 0.7,
      parserVersion: ISO27001_PARSER_VERSION,
      processedAt: new Date().toISOString(),
      processingTimeMs: Date.now() - startTime,
    };

    onProgress?.(`Extraction complete! Found ${controls.length} controls.`, 100);

    // Build database record
    const databaseRecord: ISO27001DatabaseRecord | undefined = documentId
      ? {
          document_id: documentId,
          certificate_number: parsedCertificate.certificateNumber,
          certification_body: parsedCertificate.certificationBody,
          certified_organization: parsedCertificate.certifiedOrganization,
          issue_date: parsedCertificate.issueDate,
          expiry_date: parsedCertificate.expiryDate,
          scope_statement: parsedCertificate.scopeStatement,
          standard_version: parsedCertificate.standardVersion,
          controls: parsedCertificate.controls,
          dora_coverage: parsedCertificate.doraCoverage,
          raw_extraction: parsedCertificate,
          confidence_score: parsedCertificate.confidenceScore,
        }
      : undefined;

    return {
      success: true,
      data: parsedCertificate,
      databaseRecord,
      processingTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ISO 27001 Parser] Error:', errorMessage);

    return {
      success: false,
      error: errorMessage,
      processingTimeMs: Date.now() - startTime,
    };
  }
}

// =============================================================================
// DORA Coverage Calculation
// =============================================================================

/**
 * Map ISO 27001 controls to DORA requirements
 * ISO 27001:2022 themes:
 * - 5-8: Organizational (A.5-A.8)
 * - Theme 1: People controls
 * - Theme 2: Physical controls
 * - Theme 3: Technological controls
 */
const ISO27001_TO_DORA_MAP: Record<string, {
  doraArea: 'ictRiskManagement' | 'incidentManagement' | 'operationalResilience' | 'thirdPartyRisk';
  coverage: number; // 0-1
}> = {
  // Information security policies → ICT Risk Management
  'A.5.1': { doraArea: 'ictRiskManagement', coverage: 0.8 },
  'A.5.2': { doraArea: 'ictRiskManagement', coverage: 0.6 },

  // Asset management → ICT Risk Management
  'A.5.9': { doraArea: 'ictRiskManagement', coverage: 0.7 },
  'A.5.10': { doraArea: 'ictRiskManagement', coverage: 0.6 },
  'A.5.11': { doraArea: 'ictRiskManagement', coverage: 0.5 },

  // Supplier relationships → Third Party Risk
  'A.5.19': { doraArea: 'thirdPartyRisk', coverage: 0.9 },
  'A.5.20': { doraArea: 'thirdPartyRisk', coverage: 0.9 },
  'A.5.21': { doraArea: 'thirdPartyRisk', coverage: 0.8 },
  'A.5.22': { doraArea: 'thirdPartyRisk', coverage: 0.7 },
  'A.5.23': { doraArea: 'thirdPartyRisk', coverage: 0.8 },

  // Incident management → Incident Management
  'A.5.24': { doraArea: 'incidentManagement', coverage: 0.9 },
  'A.5.25': { doraArea: 'incidentManagement', coverage: 0.8 },
  'A.5.26': { doraArea: 'incidentManagement', coverage: 0.7 },
  'A.5.27': { doraArea: 'incidentManagement', coverage: 0.6 },
  'A.5.28': { doraArea: 'incidentManagement', coverage: 0.5 },

  // Business continuity → Operational Resilience
  'A.5.29': { doraArea: 'operationalResilience', coverage: 0.9 },
  'A.5.30': { doraArea: 'operationalResilience', coverage: 0.9 },

  // Secure development → ICT Risk Management
  'A.8.25': { doraArea: 'ictRiskManagement', coverage: 0.6 },
  'A.8.26': { doraArea: 'ictRiskManagement', coverage: 0.6 },
  'A.8.27': { doraArea: 'ictRiskManagement', coverage: 0.7 },
  'A.8.28': { doraArea: 'ictRiskManagement', coverage: 0.5 },
  'A.8.29': { doraArea: 'ictRiskManagement', coverage: 0.6 },
  'A.8.30': { doraArea: 'ictRiskManagement', coverage: 0.5 },
  'A.8.31': { doraArea: 'operationalResilience', coverage: 0.5 },
  'A.8.32': { doraArea: 'ictRiskManagement', coverage: 0.6 },
  'A.8.33': { doraArea: 'operationalResilience', coverage: 0.7 },
  'A.8.34': { doraArea: 'operationalResilience', coverage: 0.8 },
};

function calculateDORACoverage(controls: ISO27001Control[]): ParsedISO27001Certificate['doraCoverage'] {
  const coverage = {
    ictRiskManagement: 0,
    incidentManagement: 0,
    operationalResilience: 0,
    thirdPartyRisk: 0,
    overall: 0,
  };

  const areaCounts = {
    ictRiskManagement: { total: 0, covered: 0 },
    incidentManagement: { total: 0, covered: 0 },
    operationalResilience: { total: 0, covered: 0 },
    thirdPartyRisk: { total: 0, covered: 0 },
  };

  // Count expected controls per area
  for (const [, mapping] of Object.entries(ISO27001_TO_DORA_MAP)) {
    areaCounts[mapping.doraArea].total += mapping.coverage;
  }

  // Count implemented controls
  for (const control of controls) {
    const normalizedId = normalizeClauseId(control.clauseId);
    const mapping = ISO27001_TO_DORA_MAP[normalizedId];

    if (mapping && control.implementation === 'implemented') {
      areaCounts[mapping.doraArea].covered += mapping.coverage;
    }
  }

  // Calculate percentages
  for (const area of Object.keys(areaCounts) as Array<keyof typeof areaCounts>) {
    if (areaCounts[area].total > 0) {
      coverage[area] = Math.round((areaCounts[area].covered / areaCounts[area].total) * 100);
    }
  }

  // Overall is weighted average
  coverage.overall = Math.round(
    (coverage.ictRiskManagement * 0.35 +
      coverage.incidentManagement * 0.25 +
      coverage.operationalResilience * 0.25 +
      coverage.thirdPartyRisk * 0.15)
  );

  return coverage;
}

function normalizeClauseId(clauseId: string): string {
  // Normalize different formats: "5.1", "A.5.1", "A5.1" → "A.5.1"
  const cleaned = clauseId.replace(/\s/g, '').toUpperCase();

  if (cleaned.startsWith('A.')) {
    return cleaned;
  }
  if (cleaned.startsWith('A') && !cleaned.startsWith('A.')) {
    return `A.${cleaned.slice(1)}`;
  }
  if (/^\d/.test(cleaned)) {
    return `A.${cleaned}`;
  }
  return cleaned;
}
