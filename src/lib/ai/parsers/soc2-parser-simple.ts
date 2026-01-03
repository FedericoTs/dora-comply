/**
 * SOC 2 Report Parser - Simple Single-Pass Version
 *
 * Designed to complete within Vercel's 60s timeout.
 * Uses a single API call for extraction instead of chunked approach.
 */

import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import type {
  ParsedSOC2Report,
  ExtractedSOC2Control,
  SOC2DatabaseRecord,
  SOC2ToDORAMapping,
  TrustServicesCriteria,
} from './types';

export const PARSER_VERSION_SIMPLE = '2.1.0';
const MODEL = 'gemini-2.0-flash';

// Valid Trust Services Criteria values
const VALID_TSC: TrustServicesCriteria[] = [
  'security',
  'availability',
  'processing_integrity',
  'confidentiality',
  'privacy',
];

function validateTrustServicesCriteria(
  input: string[] | undefined
): TrustServicesCriteria[] {
  if (!input || !Array.isArray(input)) return ['security'];
  const validated = input
    .map((s) => s.toLowerCase().replace(/\s+/g, '_'))
    .filter((s): s is TrustServicesCriteria =>
      VALID_TSC.includes(s as TrustServicesCriteria)
    );
  return validated.length > 0 ? validated : ['security'];
}

export interface SimpleParseOptions {
  pdfBuffer: Buffer;
  documentId?: string;
  onProgress?: (message: string, percentage: number) => void;
}

export interface SimpleParseResult {
  success: boolean;
  data?: ParsedSOC2Report;
  databaseRecord?: SOC2DatabaseRecord;
  doraMapping?: SOC2ToDORAMapping[];
  error?: string;
  processingTimeMs: number;
}

const EXTRACTION_PROMPT = `You are an expert SOC 2 auditor analyzing a SOC 2 Type I or Type II report.

Extract ALL of the following information from this document:

1. METADATA:
   - Report type (type1 or type2)
   - Audit firm name
   - Service organization name
   - Opinion (unqualified, qualified, or adverse)
   - Audit period (start and end dates)
   - Trust Services Criteria in scope

2. CONTROLS:
   Extract EVERY control from Section IV (or equivalent). For each control:
   - Control ID (e.g., CC1.1, CC6.4, A1.2)
   - Control area/category
   - TSC category (CC1-CC9, A, PI, C, P)
   - Full description
   - Test result (operating_effectively, exception, or not_tested)
   - Testing procedure performed
   - Page location

3. EXCEPTIONS:
   Any control exceptions or deviations noted

4. SUBSERVICE ORGANIZATIONS:
   Third parties mentioned (AWS, Azure, etc.)

5. CUECs (Complementary User Entity Controls):
   Controls that must be implemented by the customer

IMPORTANT: Extract ALL controls, not just a sample. Count every control in Section IV.

RESPOND WITH ONLY VALID JSON:
{
  "metadata": {
    "reportType": "type2",
    "auditFirm": "Firm name",
    "serviceOrgName": "Company name",
    "opinion": "unqualified",
    "periodStart": "YYYY-MM-DD",
    "periodEnd": "YYYY-MM-DD",
    "reportDate": "YYYY-MM-DD",
    "trustServicesCriteria": ["security", "availability"],
    "systemDescription": "Brief system description"
  },
  "controls": [
    {
      "controlId": "CC1.1",
      "controlArea": "Control Environment",
      "tscCategory": "CC1",
      "description": "Full control description",
      "testResult": "operating_effectively",
      "testingProcedure": "Testing procedure",
      "location": "Page X"
    }
  ],
  "exceptions": [
    {
      "controlId": "CC6.5",
      "description": "Exception description",
      "managementResponse": "Response if any"
    }
  ],
  "subserviceOrgs": [
    {
      "name": "AWS",
      "serviceDescription": "Cloud infrastructure",
      "inclusionMethod": "carve_out"
    }
  ],
  "cuecs": [
    {
      "id": "CUEC-1",
      "description": "User control description",
      "relatedControl": "CC6.1"
    }
  ],
  "extractionStats": {
    "totalControlsFound": 135,
    "controlsEffective": 130,
    "controlsWithException": 3,
    "controlsNotTested": 2
  }
}`;

export async function parseSOC2Simple(
  options: SimpleParseOptions
): Promise<SimpleParseResult> {
  const startTime = Date.now();
  const { pdfBuffer, documentId, onProgress } = options;

  try {
    onProgress?.('Starting extraction...', 5);

    const pdfBase64 = pdfBuffer.toString('base64');

    onProgress?.('Sending document to AI for analysis...', 15);

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
      maxOutputTokens: 16384, // Large output for all controls
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
    const controls: ExtractedSOC2Control[] = (parsed.controls || []).map(
      (c: Record<string, unknown>) => ({
        controlId: c.controlId as string,
        controlArea: c.controlArea as string,
        tscCategory: c.tscCategory as string,
        description: c.description as string,
        testResult: (c.testResult as string) || 'operating_effectively',
        testingProcedure: c.testingProcedure as string,
        location: c.location as string,
        confidence: 0.9,
      })
    );

    onProgress?.('Mapping to DORA requirements...', 90);

    // Generate DORA mappings
    const doraMapping = generateDORAMappings(controls);

    // Build parsed report
    const metadata = parsed.metadata || {};
    const stats = parsed.extractionStats || {};

    const parsedReport: ParsedSOC2Report = {
      reportType: metadata.reportType || 'type2',
      auditFirm: metadata.auditFirm || 'Unknown',
      auditFirmContact: metadata.auditFirmContact,
      opinion: metadata.opinion || 'unqualified',
      periodStart: metadata.periodStart || '',
      periodEnd: metadata.periodEnd || '',
      reportDate: metadata.reportDate || '',
      serviceOrgName: metadata.serviceOrgName || 'Unknown',
      serviceOrgDescription: metadata.serviceOrgDescription,
      trustServicesCriteria: validateTrustServicesCriteria(
        metadata.trustServicesCriteria
      ),
      systemDescription: metadata.systemDescription || '',
      systemBoundaries: metadata.systemBoundaries,
      controls,
      exceptions: parsed.exceptions || [],
      subserviceOrgs: parsed.subserviceOrgs || [],
      cuecs: parsed.cuecs || [],
      totalControls: controls.length,
      controlsOperatingEffectively:
        stats.controlsEffective ||
        controls.filter((c) => c.testResult === 'operating_effectively').length,
      controlsWithExceptions:
        stats.controlsWithException ||
        controls.filter((c) => c.testResult === 'exception').length,
      controlsNotTested:
        stats.controlsNotTested ||
        controls.filter((c) => c.testResult === 'not_tested').length,
      confidenceScores: {
        overall: 0.9,
        metadata: 0.95,
        controls: controls.length > 50 ? 0.95 : 0.8,
        exceptions: 0.9,
        subserviceOrgs: 0.9,
        cuecs: 0.85,
      },
      parserVersion: PARSER_VERSION_SIMPLE,
      processedAt: new Date().toISOString(),
      processingTimeMs: Date.now() - startTime,
    };

    onProgress?.(`Extraction complete! Found ${controls.length} controls.`, 100);

    // Build database record
    const databaseRecord: SOC2DatabaseRecord | undefined = documentId
      ? {
          document_id: documentId,
          report_type: parsedReport.reportType,
          audit_firm: parsedReport.auditFirm,
          opinion: parsedReport.opinion,
          period_start: parsedReport.periodStart,
          period_end: parsedReport.periodEnd,
          criteria: parsedReport.trustServicesCriteria,
          system_description: parsedReport.systemDescription,
          controls: parsedReport.controls,
          exceptions: parsedReport.exceptions,
          subservice_orgs: parsedReport.subserviceOrgs,
          cuecs: parsedReport.cuecs,
          raw_extraction: parsedReport,
          confidence_scores: parsedReport.confidenceScores,
        }
      : undefined;

    return {
      success: true,
      data: parsedReport,
      databaseRecord,
      doraMapping,
      processingTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[SOC2 Parser Simple] Error:', errorMessage);

    return {
      success: false,
      error: errorMessage,
      processingTimeMs: Date.now() - startTime,
    };
  }
}

// DORA mapping (same as v2)
const SOC2_TO_DORA_MAP: Record<
  string,
  { article: string; controlName: string; coverage: 'full' | 'partial' }[]
> = {
  CC1: [
    { article: 'Art.5', controlName: 'ICT Risk Management Framework', coverage: 'partial' },
  ],
  CC3: [
    { article: 'Art.5', controlName: 'ICT Risk Management Framework', coverage: 'full' },
    { article: 'Art.6', controlName: 'ICT Systems Documentation', coverage: 'partial' },
  ],
  CC4: [
    { article: 'Art.8', controlName: 'Detection of Anomalous Activities', coverage: 'full' },
  ],
  CC5: [
    { article: 'Art.7', controlName: 'ICT Systems Protection', coverage: 'partial' },
  ],
  CC6: [
    { article: 'Art.7', controlName: 'ICT Systems Protection', coverage: 'full' },
    { article: 'Art.30', controlName: 'Contractual Requirements', coverage: 'partial' },
  ],
  CC7: [
    { article: 'Art.9', controlName: 'Response and Recovery', coverage: 'full' },
    { article: 'Art.10', controlName: 'Backup Policies', coverage: 'full' },
    { article: 'Art.17', controlName: 'Incident Classification', coverage: 'partial' },
    { article: 'Art.19', controlName: 'Major Incident Reporting', coverage: 'partial' },
  ],
  CC8: [
    { article: 'Art.7', controlName: 'ICT Systems Protection', coverage: 'partial' },
  ],
  CC9: [
    { article: 'Art.5', controlName: 'ICT Risk Management Framework', coverage: 'partial' },
    { article: 'Art.28', controlName: 'General Principles on TPRM', coverage: 'full' },
    { article: 'Art.29', controlName: 'Register of Information', coverage: 'partial' },
  ],
  A: [
    { article: 'Art.24', controlName: 'General Testing Requirements', coverage: 'full' },
    { article: 'Art.30', controlName: 'Contractual Requirements', coverage: 'partial' },
  ],
  C: [{ article: 'Art.30', controlName: 'Contractual Requirements', coverage: 'partial' }],
};

function generateDORAMappings(controls: ExtractedSOC2Control[]): SOC2ToDORAMapping[] {
  const mappings: SOC2ToDORAMapping[] = [];

  for (const control of controls) {
    const categoryMatch = control.controlId.match(/^([A-Z]+\d*)/i);
    if (!categoryMatch) continue;

    const category = categoryMatch[1].toUpperCase();
    const doraMappings = SOC2_TO_DORA_MAP[category];

    if (doraMappings) {
      for (const dora of doraMappings) {
        mappings.push({
          soc2ControlId: control.controlId,
          soc2ControlName: control.controlArea,
          doraArticle: dora.article,
          doraControlId: dora.article,
          doraControlName: dora.controlName,
          coverageLevel: dora.coverage,
          mappingNotes:
            control.testResult === 'operating_effectively'
              ? 'Control operating effectively'
              : control.testResult === 'exception'
                ? 'Control has exceptions - review required'
                : 'Control not tested',
          confidence:
            control.testResult === 'operating_effectively'
              ? control.confidence
              : (control.confidence || 0.9) * 0.7,
        });
      }
    }
  }

  return mappings;
}
