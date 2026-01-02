/**
 * SOC 2 Report Parser
 *
 * AI-powered extraction of SOC 2 Type I/II report data
 * using Claude 3.5 Sonnet for comprehensive compliance analysis.
 *
 * Key features:
 * - Extracts all Trust Services Criteria controls
 * - Identifies exceptions and management responses
 * - Maps subservice organizations (4th parties)
 * - Extracts CUECs for customer responsibilities
 * - Provides DORA compliance mapping
 */

import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import {
  SOC2_EXTRACTION_SYSTEM_PROMPT,
  SOC2_EXTRACTION_USER_PROMPT,
} from './soc2-prompts';
import type {
  ParsedSOC2Report,
  ExtractedSOC2Control,
  ExtractedSOC2Exception,
  ExtractedSubserviceOrg,
  ExtractedCUEC,
  SOC2DatabaseRecord,
  SOC2ToDORAMapping,
} from './types';

// ============================================================================
// Constants
// ============================================================================

const PARSER_VERSION = '1.0.0';
const PARSER_MODEL = 'claude-sonnet-4-20250514'; // Best for complex document analysis
const MAX_RETRIES = 2;

// ============================================================================
// DORA Mapping Reference (SOC 2 → DORA Articles)
// ============================================================================

const SOC2_TO_DORA_MAP: Record<
  string,
  { article: string; controlName: string; coverage: 'full' | 'partial' }[]
> = {
  // Control Environment
  CC1: [
    { article: 'Art.5', controlName: 'ICT Risk Management Framework', coverage: 'partial' },
  ],

  // Risk Assessment
  CC3: [
    { article: 'Art.5', controlName: 'ICT Risk Management Framework', coverage: 'full' },
    { article: 'Art.6', controlName: 'ICT Systems Documentation', coverage: 'partial' },
  ],

  // Monitoring
  CC4: [
    { article: 'Art.8', controlName: 'Detection of Anomalous Activities', coverage: 'full' },
  ],

  // Control Activities
  CC5: [
    { article: 'Art.7', controlName: 'ICT Systems Protection', coverage: 'partial' },
  ],

  // Logical and Physical Access
  CC6: [
    { article: 'Art.7', controlName: 'ICT Systems Protection', coverage: 'full' },
    { article: 'Art.30', controlName: 'Contractual Requirements', coverage: 'partial' },
  ],

  // System Operations
  CC7: [
    { article: 'Art.9', controlName: 'Response and Recovery', coverage: 'full' },
    { article: 'Art.10', controlName: 'Backup Policies', coverage: 'full' },
    { article: 'Art.17', controlName: 'Incident Classification', coverage: 'partial' },
    { article: 'Art.19', controlName: 'Major Incident Reporting', coverage: 'partial' },
  ],

  // Change Management
  CC8: [
    { article: 'Art.7', controlName: 'ICT Systems Protection', coverage: 'partial' },
  ],

  // Risk Mitigation
  CC9: [
    { article: 'Art.5', controlName: 'ICT Risk Management Framework', coverage: 'partial' },
    { article: 'Art.28', controlName: 'General Principles on TPRM', coverage: 'full' },
    { article: 'Art.29', controlName: 'Register of Information', coverage: 'partial' },
  ],

  // Availability
  A: [
    { article: 'Art.24', controlName: 'General Testing Requirements', coverage: 'full' },
    { article: 'Art.30', controlName: 'Contractual Requirements', coverage: 'partial' },
  ],

  // Confidentiality
  C: [
    { article: 'Art.30', controlName: 'Contractual Requirements', coverage: 'partial' },
  ],
};

// ============================================================================
// Types for Raw AI Response
// ============================================================================

interface RawSOC2Extraction {
  reportType: 'type1' | 'type2';
  auditFirm: string;
  auditFirmContact?: string | null;
  opinion: 'unqualified' | 'qualified' | 'adverse';
  periodStart: string;
  periodEnd: string;
  reportDate: string;
  serviceOrgName: string;
  serviceOrgDescription?: string | null;
  trustServicesCriteria: string[];
  systemDescription: string;
  systemBoundaries?: string | null;
  infrastructureComponents?: string[];
  softwareComponents?: string[];
  dataCategories?: string[];
  controls: Array<{
    controlId: string;
    controlArea: string;
    tscCategory: string;
    description: string;
    testResult: 'operating_effectively' | 'exception' | 'not_tested';
    testingProcedure?: string | null;
    exceptionDescription?: string | null;
    managementResponse?: string | null;
    location?: string | null;
    confidence: number;
  }>;
  exceptions: Array<{
    controlId: string;
    controlArea?: string | null;
    exceptionDescription: string;
    exceptionType?: string | null;
    managementResponse?: string | null;
    remediationDate?: string | null;
    remediationVerified?: boolean | null;
    impact: 'low' | 'medium' | 'high';
    location?: string | null;
  }>;
  subserviceOrgs: Array<{
    name: string;
    serviceDescription: string;
    inclusionMethod: 'inclusive' | 'carve_out';
    controlsSupported?: string[];
    relatedCuecs?: string[];
    hasOwnSoc2?: boolean | null;
    location?: string | null;
  }>;
  cuecs: Array<{
    id?: string | null;
    description: string;
    relatedControl?: string | null;
    customerResponsibility: string;
    category?: string | null;
    location?: string | null;
  }>;
  totalControls: number;
  controlsOperatingEffectively: number;
  controlsWithExceptions: number;
  controlsNotTested: number;
  confidenceScores: {
    overall: number;
    metadata: number;
    controls: number;
    exceptions: number;
    subserviceOrgs: number;
    cuecs: number;
  };
}

// ============================================================================
// Parse Options
// ============================================================================

export interface ParseSOC2Options {
  /** PDF buffer of the SOC 2 report */
  pdfBuffer: Buffer;
  /** Optional API key override */
  apiKey?: string;
  /** Document ID for database linking */
  documentId?: string;
  /** Enable verbose logging */
  verbose?: boolean;
}

export interface ParseSOC2Result {
  success: boolean;
  data?: ParsedSOC2Report;
  databaseRecord?: SOC2DatabaseRecord;
  doraMapping?: SOC2ToDORAMapping[];
  error?: string;
  processingTimeMs: number;
}

// ============================================================================
// Main Parser Function
// ============================================================================

/**
 * Parse a SOC 2 report PDF and extract structured compliance data
 *
 * @param options - Parsing options including PDF buffer
 * @returns Parsed SOC 2 data with DORA mappings
 */
export async function parseSOC2Report(
  options: ParseSOC2Options
): Promise<ParseSOC2Result> {
  const startTime = Date.now();
  const { pdfBuffer, documentId, verbose = false } = options;

  if (verbose) {
    console.log('[SOC2 Parser] Starting extraction...');
    console.log('[SOC2 Parser] PDF size:', pdfBuffer.length, 'bytes');
  }

  // Convert buffer to base64 for AI SDK
  const pdfBase64 = pdfBuffer.toString('base64');

  let lastError: Error | null = null;

  // Retry loop for robustness
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (verbose && attempt > 0) {
        console.log(`[SOC2 Parser] Retry attempt ${attempt}/${MAX_RETRIES}`);
      }

      // Call Claude with the PDF
      // CRITICAL: temperature: 0 ensures deterministic extraction
      // This is essential for compliance - same document must yield same results
      const result = await generateText({
        model: anthropic(PARSER_MODEL),
        system: SOC2_EXTRACTION_SYSTEM_PROMPT,
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
                text: SOC2_EXTRACTION_USER_PROMPT,
              },
            ],
          },
        ],
        maxOutputTokens: 16384, // SOC 2 reports can be large
        temperature: 0, // Deterministic output for consistent compliance extraction
      });

      if (verbose) {
        console.log('[SOC2 Parser] AI response received');
        console.log('[SOC2 Parser] Response length:', result.text.length);
      }

      // Parse JSON from response
      const jsonMatch = result.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const rawExtraction = JSON.parse(jsonMatch[0]) as RawSOC2Extraction;

      // Transform to typed format
      const parsedReport = transformToTypedReport(rawExtraction, startTime);

      // Generate DORA mappings
      const doraMapping = generateDORAMappings(parsedReport.controls);

      // Create database record if document ID provided
      const databaseRecord = documentId
        ? createDatabaseRecord(documentId, parsedReport)
        : undefined;

      const processingTimeMs = Date.now() - startTime;

      if (verbose) {
        console.log('[SOC2 Parser] Extraction complete');
        console.log('[SOC2 Parser] Controls extracted:', parsedReport.totalControls);
        console.log('[SOC2 Parser] Exceptions found:', parsedReport.exceptions.length);
        console.log('[SOC2 Parser] Subservice orgs:', parsedReport.subserviceOrgs.length);
        console.log('[SOC2 Parser] Processing time:', processingTimeMs, 'ms');
      }

      return {
        success: true,
        data: parsedReport,
        databaseRecord,
        doraMapping,
        processingTimeMs,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`[SOC2 Parser] Attempt ${attempt + 1} failed:`, lastError.message);

      if (attempt < MAX_RETRIES) {
        // Wait before retry with exponential backoff
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || 'Unknown error during parsing',
    processingTimeMs: Date.now() - startTime,
  };
}

// ============================================================================
// Transform Raw Extraction to Typed Report
// ============================================================================

function transformToTypedReport(
  raw: RawSOC2Extraction,
  startTime: number
): ParsedSOC2Report {
  // Transform controls
  const controls: ExtractedSOC2Control[] = raw.controls.map((c) => ({
    controlId: c.controlId,
    controlArea: c.controlArea,
    tscCategory: c.tscCategory,
    description: c.description,
    testResult: c.testResult,
    testingProcedure: c.testingProcedure ?? undefined,
    exceptionDescription: c.exceptionDescription ?? undefined,
    managementResponse: c.managementResponse ?? undefined,
    location: c.location ?? undefined,
    confidence: c.confidence,
  }));

  // Transform exceptions
  const exceptions: ExtractedSOC2Exception[] = raw.exceptions.map((e) => ({
    controlId: e.controlId,
    controlArea: e.controlArea ?? undefined,
    exceptionDescription: e.exceptionDescription,
    exceptionType: e.exceptionType as ExtractedSOC2Exception['exceptionType'],
    managementResponse: e.managementResponse ?? undefined,
    remediationDate: e.remediationDate ?? undefined,
    remediationVerified: e.remediationVerified ?? undefined,
    impact: e.impact,
    location: e.location ?? undefined,
  }));

  // Transform subservice orgs
  const subserviceOrgs: ExtractedSubserviceOrg[] = raw.subserviceOrgs.map((s) => ({
    name: s.name,
    serviceDescription: s.serviceDescription,
    inclusionMethod: s.inclusionMethod,
    controlsSupported: s.controlsSupported || [],
    relatedCuecs: s.relatedCuecs,
    hasOwnSoc2: s.hasOwnSoc2 ?? undefined,
    location: s.location ?? undefined,
  }));

  // Transform CUECs
  const cuecs: ExtractedCUEC[] = raw.cuecs.map((c) => ({
    id: c.id ?? undefined,
    description: c.description,
    relatedControl: c.relatedControl ?? undefined,
    customerResponsibility: c.customerResponsibility,
    category: c.category as ExtractedCUEC['category'],
    location: c.location ?? undefined,
  }));

  // Normalize trust services criteria
  const validCriteria = [
    'security',
    'availability',
    'processing_integrity',
    'confidentiality',
    'privacy',
  ] as const;

  const trustServicesCriteria = raw.trustServicesCriteria
    .map((c) => c.toLowerCase().replace(/\s+/g, '_'))
    .filter((c): c is (typeof validCriteria)[number] =>
      validCriteria.includes(c as (typeof validCriteria)[number])
    );

  return {
    reportType: raw.reportType,
    auditFirm: raw.auditFirm,
    auditFirmContact: raw.auditFirmContact ?? undefined,
    opinion: raw.opinion,
    periodStart: raw.periodStart,
    periodEnd: raw.periodEnd,
    reportDate: raw.reportDate,
    serviceOrgName: raw.serviceOrgName,
    serviceOrgDescription: raw.serviceOrgDescription ?? undefined,
    trustServicesCriteria,
    systemDescription: raw.systemDescription,
    systemBoundaries: raw.systemBoundaries ?? undefined,
    infrastructureComponents: raw.infrastructureComponents,
    softwareComponents: raw.softwareComponents,
    dataCategories: raw.dataCategories,
    controls,
    exceptions,
    subserviceOrgs,
    cuecs,
    totalControls: raw.totalControls,
    controlsOperatingEffectively: raw.controlsOperatingEffectively,
    controlsWithExceptions: raw.controlsWithExceptions,
    controlsNotTested: raw.controlsNotTested,
    confidenceScores: raw.confidenceScores,
    parserVersion: PARSER_VERSION,
    processedAt: new Date().toISOString(),
    processingTimeMs: Date.now() - startTime,
  };
}

// ============================================================================
// Generate DORA Mappings from Controls
// ============================================================================

function generateDORAMappings(
  controls: ExtractedSOC2Control[]
): SOC2ToDORAMapping[] {
  const mappings: SOC2ToDORAMapping[] = [];

  for (const control of controls) {
    // Extract TSC category (e.g., "CC6" from "CC6.1")
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
              : control.confidence * 0.7, // Reduce confidence for exceptions
        });
      }
    }
  }

  return mappings;
}

// ============================================================================
// Create Database Record
// ============================================================================

function createDatabaseRecord(
  documentId: string,
  report: ParsedSOC2Report
): SOC2DatabaseRecord {
  return {
    document_id: documentId,
    report_type: report.reportType,
    audit_firm: report.auditFirm,
    opinion: report.opinion,
    period_start: report.periodStart,
    period_end: report.periodEnd,
    criteria: report.trustServicesCriteria,
    system_description: report.systemDescription,
    controls: report.controls,
    exceptions: report.exceptions,
    subservice_orgs: report.subserviceOrgs,
    cuecs: report.cuecs,
    raw_extraction: report,
    confidence_scores: report.confidenceScores,
  };
}

// ============================================================================
// Utility: Calculate DORA Coverage Score
// ============================================================================

export function calculateDORACoverageScore(
  mappings: SOC2ToDORAMapping[]
): {
  overall: number;
  byPillar: Record<string, number>;
  gaps: string[];
} {
  // Group by DORA article
  const byArticle = new Map<string, SOC2ToDORAMapping[]>();
  for (const mapping of mappings) {
    const existing = byArticle.get(mapping.doraArticle) || [];
    existing.push(mapping);
    byArticle.set(mapping.doraArticle, existing);
  }

  // Calculate coverage per article
  const articleScores = new Map<string, number>();
  for (const [article, articleMappings] of byArticle) {
    // Get best coverage for this article
    const bestCoverage = Math.max(
      ...articleMappings.map((m) =>
        m.coverageLevel === 'full' ? 100 : m.coverageLevel === 'partial' ? 50 : 0
      )
    );
    articleScores.set(article, bestCoverage);
  }

  // Key DORA articles that should be covered
  const keyArticles = [
    'Art.5',
    'Art.6',
    'Art.7',
    'Art.8',
    'Art.9',
    'Art.10',
    'Art.17',
    'Art.19',
    'Art.24',
    'Art.28',
    'Art.29',
    'Art.30',
  ];

  // Calculate overall score
  let totalScore = 0;
  const gaps: string[] = [];

  for (const article of keyArticles) {
    const score = articleScores.get(article) || 0;
    totalScore += score;
    if (score < 50) {
      gaps.push(article);
    }
  }

  const overall = totalScore / keyArticles.length;

  // Group by pillar (simplified)
  const byPillar: Record<string, number> = {
    ICT_RISK: 0,
    INCIDENT: 0,
    RESILIENCE: 0,
    TPRM: 0,
  };

  const pillarArticles: Record<string, string[]> = {
    ICT_RISK: ['Art.5', 'Art.6', 'Art.7', 'Art.8', 'Art.9', 'Art.10'],
    INCIDENT: ['Art.17', 'Art.19'],
    RESILIENCE: ['Art.24'],
    TPRM: ['Art.28', 'Art.29', 'Art.30'],
  };

  for (const [pillar, articles] of Object.entries(pillarArticles)) {
    let pillarTotal = 0;
    for (const article of articles) {
      pillarTotal += articleScores.get(article) || 0;
    }
    byPillar[pillar] = pillarTotal / articles.length;
  }

  return { overall, byPillar, gaps };
}

// ============================================================================
// Export
// ============================================================================

export { PARSER_VERSION, PARSER_MODEL };
