/**
 * Contract Analyzer Service
 *
 * AI-powered contract clause extraction using Claude
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  DORA_ANALYSIS_SYSTEM_PROMPT,
  buildAnalysisPrompt,
} from './prompts';
import type {
  ContractAnalysisResult,
  ExtractedArticle30_2,
  ExtractedArticle30_3,
  ExtractedProvision,
  ExtractedParty,
  ExtractedKeyDate,
  ExtractedFinancialTerms,
  RiskFlag,
  ComplianceGap,
} from './types';

// ============================================================================
// Constants
// ============================================================================

const EXTRACTION_MODEL = 'claude-sonnet-4-20250514';
const EXTRACTION_VERSION = '1.1'; // Updated: Direct PDF analysis (no separate extraction)

// Default provision structure
const DEFAULT_PROVISION: ExtractedProvision = {
  status: 'not_analyzed',
  confidence: 0,
  excerpts: [],
  location: null,
  analysis: null,
};

// ============================================================================
// PDF Metadata Extraction (lightweight - just count pages/estimate size)
// ============================================================================

export function extractPdfMetadata(pdfBuffer: Buffer): {
  estimatedPageCount: number;
  fileSizeKb: number;
} {
  const fileSizeKb = Math.round(pdfBuffer.length / 1024);
  // Rough estimate: ~50KB per page for text-heavy PDFs
  const estimatedPageCount = Math.max(1, Math.ceil(fileSizeKb / 50));

  console.log('[PDF Metadata] Size:', fileSizeKb, 'KB, estimated pages:', estimatedPageCount);

  return { estimatedPageCount, fileSizeKb };
}

// ============================================================================
// Claude Analysis (with native PDF support)
// ============================================================================

interface ClaudeAnalysisResponse {
  contract_type: string | null;
  parties: ExtractedParty[];
  effective_date: string | null;
  expiry_date: string | null;
  governing_law: string | null;
  article_30_2: Record<string, ExtractedProvision>;
  article_30_3: Record<string, ExtractedProvision>;
  key_dates: ExtractedKeyDate[];
  financial_terms: ExtractedFinancialTerms;
  risk_flags: RiskFlag[];
  compliance_gaps: ComplianceGap[];
  article_30_2_score: number;
  article_30_3_score: number;
  overall_score: number;
  confidence_score: number;
  extracted_text_summary?: string;
  page_count?: number;
  word_count?: number;
}

async function analyzeWithClaude(
  pdfBuffer: Buffer,
  apiKey: string
): Promise<ClaudeAnalysisResponse> {
  const client = new Anthropic({
    apiKey,
  });

  console.log('[Claude Analysis] Sending PDF directly to Sonnet, size:', pdfBuffer.length, 'bytes');

  // Convert PDF to base64
  const pdfBase64 = pdfBuffer.toString('base64');

  const response = await client.messages.create({
    model: EXTRACTION_MODEL,
    max_tokens: 16384, // Increased for comprehensive analysis
    system: DORA_ANALYSIS_SYSTEM_PROMPT,
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
            text: buildAnalysisPrompt(''), // Empty string - PDF is sent directly
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

  console.log('[Claude Analysis] Response received, parsing JSON...');

  // Parse JSON response
  try {
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[Claude Analysis] No JSON in response:', textContent.text.slice(0, 500));
      throw new Error('No JSON found in response');
    }
    return JSON.parse(jsonMatch[0]) as ClaudeAnalysisResponse;
  } catch {
    console.error('[Claude Analysis] Failed to parse response:', textContent.text.slice(0, 1000));
    throw new Error('Failed to parse AI response as JSON');
  }
}

// ============================================================================
// Confidence Calculation
// ============================================================================

interface ConfidenceFactors {
  provisionCoverage: number;      // % of provisions with status != missing
  averageProvisionConfidence: number; // Mean of provision confidence scores
  extractionQuality: number;      // Based on excerpts and locations found
  documentCompleteness: number;   // Based on parties, dates, governing law
}

function calculateConfidence(
  article30_2: Record<string, ExtractedProvision>,
  article30_3: Record<string, ExtractedProvision>,
  parties: unknown[],
  effectiveDate: string | null,
  governingLaw: string | null
): { score: number; factors: ConfidenceFactors } {
  const allProvisions = [
    ...Object.values(article30_2 || {}),
    ...Object.values(article30_3 || {}),
  ];

  // Factor 1: Provision Coverage (how many provisions were found)
  const foundProvisions = allProvisions.filter(
    p => p.status === 'present' || p.status === 'partial'
  ).length;
  const provisionCoverage = allProvisions.length > 0
    ? foundProvisions / allProvisions.length
    : 0;

  // Factor 2: Average Provision Confidence
  const confidenceSum = allProvisions.reduce((sum, p) => sum + (p.confidence || 0), 0);
  const averageProvisionConfidence = allProvisions.length > 0
    ? confidenceSum / allProvisions.length
    : 0;

  // Factor 3: Extraction Quality (excerpts and locations)
  const withExcerpts = allProvisions.filter(
    p => p.excerpts && p.excerpts.length > 0
  ).length;
  const withLocations = allProvisions.filter(
    p => p.location && p.location !== null
  ).length;
  const extractionQuality = allProvisions.length > 0
    ? ((withExcerpts + withLocations) / (allProvisions.length * 2))
    : 0;

  // Factor 4: Document Completeness (basic metadata)
  let completenessScore = 0;
  if (parties && parties.length >= 2) completenessScore += 0.4;
  else if (parties && parties.length === 1) completenessScore += 0.2;
  if (effectiveDate) completenessScore += 0.3;
  if (governingLaw) completenessScore += 0.3;
  const documentCompleteness = Math.min(completenessScore, 1);

  // Weighted combination
  const score = (
    provisionCoverage * 0.30 +          // 30% weight on coverage
    averageProvisionConfidence * 0.35 + // 35% weight on confidence
    extractionQuality * 0.20 +          // 20% weight on extraction quality
    documentCompleteness * 0.15         // 15% weight on completeness
  );

  return {
    score: Math.round(score * 100) / 100, // Round to 2 decimals
    factors: {
      provisionCoverage,
      averageProvisionConfidence,
      extractionQuality,
      documentCompleteness,
    },
  };
}

// ============================================================================
// Result Mapping
// ============================================================================

function mapArticle30_2(raw: Record<string, ExtractedProvision>): ExtractedArticle30_2 {
  const keys: (keyof ExtractedArticle30_2)[] = [
    'service_description',
    'data_locations',
    'data_protection',
    'availability_guarantees',
    'incident_support',
    'authority_cooperation',
    'termination_rights',
    'subcontracting_conditions',
  ];

  const result: ExtractedArticle30_2 = {} as ExtractedArticle30_2;
  for (const key of keys) {
    result[key] = raw[key] || { ...DEFAULT_PROVISION };
  }
  return result;
}

function mapArticle30_3(raw: Record<string, ExtractedProvision>): ExtractedArticle30_3 {
  const keys: (keyof ExtractedArticle30_3)[] = [
    'sla_targets',
    'notice_periods',
    'business_continuity',
    'ict_security',
    'tlpt_participation',
    'audit_rights',
    'exit_strategy',
    'performance_access',
  ];

  const result: ExtractedArticle30_3 = {} as ExtractedArticle30_3;
  for (const key of keys) {
    result[key] = raw[key] || { ...DEFAULT_PROVISION };
  }
  return result;
}

// ============================================================================
// Main Analysis Function
// ============================================================================

export interface AnalyzeContractOptions {
  documentId: string;
  pdfBuffer: Buffer;
  apiKey: string;
}

export async function analyzeContract(
  options: AnalyzeContractOptions
): Promise<ContractAnalysisResult> {
  const startTime = Date.now();

  // Step 1: Get PDF metadata (lightweight)
  const { estimatedPageCount, fileSizeKb } = extractPdfMetadata(options.pdfBuffer);

  if (fileSizeKb < 1) {
    throw new Error('PDF file is empty or corrupted');
  }

  console.log('[Contract Analysis] Starting analysis of', fileSizeKb, 'KB document');

  // Step 2: Analyze with Claude (PDF sent directly - no separate extraction needed)
  const analysis = await analyzeWithClaude(options.pdfBuffer, options.apiKey);

  // Step 3: Map results
  const processingTimeMs = Date.now() - startTime;

  // Use page/word count from Claude if provided, otherwise use estimates
  const pageCount = analysis.page_count || estimatedPageCount;
  const wordCount = analysis.word_count || Math.round(fileSizeKb * 150); // Rough estimate

  // Map the article provisions
  const article30_2 = mapArticle30_2(analysis.article_30_2 || {});
  const article30_3 = mapArticle30_3(analysis.article_30_3 || {});

  // Step 4: Calculate confidence ourselves (more reliable than Claude's estimate)
  const { score: calculatedConfidence, factors } = calculateConfidence(
    analysis.article_30_2 || {},
    analysis.article_30_3 || {},
    analysis.parties || [],
    analysis.effective_date,
    analysis.governing_law
  );

  console.log('[Contract Analysis] Complete in', processingTimeMs, 'ms');
  console.log('[Contract Analysis] Scores - Compliance:', analysis.overall_score, '%, Confidence:', calculatedConfidence);
  console.log('[Contract Analysis] Confidence factors:', JSON.stringify(factors));

  return {
    documentId: options.documentId,
    pageCount,
    wordCount,
    contractType: analysis.contract_type,
    parties: analysis.parties || [],
    effectiveDate: analysis.effective_date,
    expiryDate: analysis.expiry_date,
    governingLaw: analysis.governing_law,
    article30_2,
    article30_3,
    keyDates: analysis.key_dates || [],
    financialTerms: analysis.financial_terms || {},
    riskFlags: analysis.risk_flags || [],
    complianceGaps: analysis.compliance_gaps || [],
    overallComplianceScore: analysis.overall_score || 0,
    article30_2Score: analysis.article_30_2_score || 0,
    article30_3Score: analysis.article_30_3_score || 0,
    // Use our calculated confidence - more reliable and transparent
    confidenceScore: calculatedConfidence,
    extractionModel: EXTRACTION_MODEL,
    processingTimeMs,
  };
}

// ============================================================================
// Export
// ============================================================================

export { EXTRACTION_MODEL, EXTRACTION_VERSION };
