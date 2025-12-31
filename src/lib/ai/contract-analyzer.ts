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

const MAX_CONTRACT_TEXT_LENGTH = 100000; // ~25k tokens
const EXTRACTION_MODEL = 'claude-sonnet-4-20250514';
const EXTRACTION_VERSION = '1.0';

// Default provision structure
const DEFAULT_PROVISION: ExtractedProvision = {
  status: 'not_analyzed',
  confidence: 0,
  excerpts: [],
  location: null,
  analysis: null,
};

// ============================================================================
// PDF Text Extraction (using AI SDK with native PDF support)
// ============================================================================

import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

export async function extractTextFromPdf(pdfBuffer: Buffer): Promise<{
  text: string;
  pageCount: number;
  wordCount: number;
}> {
  console.log('[PDF Extract] Starting extraction with AI SDK, buffer size:', pdfBuffer.length);

  try {
    const pdfBase64 = pdfBuffer.toString('base64');

    const result = await generateText({
      model: anthropic('claude-3-5-haiku-20241022'),
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
              text: 'Extract all the text content from this PDF document. Return only the text, no commentary.',
            },
          ],
        },
      ],
      maxOutputTokens: 16000,
    });

    const text = result.text || '';
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    // Estimate page count from text length (roughly 500 words per page)
    const pageCount = Math.max(1, Math.ceil(wordCount / 500));

    console.log('[PDF Extract] Success - estimated pages:', pageCount, 'words:', wordCount);

    return {
      text: text.slice(0, MAX_CONTRACT_TEXT_LENGTH),
      pageCount,
      wordCount,
    };
  } catch (error) {
    console.error('[PDF Extract] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to extract text from PDF: ${errorMessage}`);
  }
}

// ============================================================================
// Claude Analysis
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
}

async function analyzeWithClaude(
  contractText: string,
  apiKey: string
): Promise<ClaudeAnalysisResponse> {
  const client = new Anthropic({
    apiKey,
  });

  const userPrompt = buildAnalysisPrompt(contractText);

  const response = await client.messages.create({
    model: EXTRACTION_MODEL,
    max_tokens: 8192,
    system: DORA_ANALYSIS_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  });

  // Extract text content from response
  const textContent = response.content.find((c) => c.type === 'text');
  if (!textContent || textContent.type !== 'text') {
    throw new Error('No text response from Claude');
  }

  // Parse JSON response
  try {
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }
    return JSON.parse(jsonMatch[0]) as ClaudeAnalysisResponse;
  } catch (parseError) {
    console.error('Failed to parse Claude response:', textContent.text);
    throw new Error('Failed to parse AI response as JSON');
  }
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

  // Step 1: Extract text from PDF
  const { text, pageCount, wordCount } = await extractTextFromPdf(options.pdfBuffer);

  if (!text || text.trim().length < 100) {
    throw new Error('Contract text too short or empty - may be a scanned image PDF');
  }

  // Step 2: Analyze with Claude
  const analysis = await analyzeWithClaude(text, options.apiKey);

  // Step 3: Map results
  const processingTimeMs = Date.now() - startTime;

  return {
    documentId: options.documentId,
    pageCount,
    wordCount,
    contractType: analysis.contract_type,
    parties: analysis.parties || [],
    effectiveDate: analysis.effective_date,
    expiryDate: analysis.expiry_date,
    governingLaw: analysis.governing_law,
    article30_2: mapArticle30_2(analysis.article_30_2 || {}),
    article30_3: mapArticle30_3(analysis.article_30_3 || {}),
    keyDates: analysis.key_dates || [],
    financialTerms: analysis.financial_terms || {},
    riskFlags: analysis.risk_flags || [],
    complianceGaps: analysis.compliance_gaps || [],
    overallComplianceScore: analysis.overall_score || 0,
    article30_2Score: analysis.article_30_2_score || 0,
    article30_3Score: analysis.article_30_3_score || 0,
    confidenceScore: analysis.confidence_score || 0,
    extractionModel: EXTRACTION_MODEL,
    processingTimeMs,
  };
}

// ============================================================================
// Export
// ============================================================================

export { EXTRACTION_MODEL, EXTRACTION_VERSION };
