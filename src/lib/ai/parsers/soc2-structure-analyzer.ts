/**
 * SOC 2 Document Structure Analyzer
 *
 * Uses Claude Haiku (cheap, fast) to analyze SOC 2 report structure
 * and create an extraction plan before expensive data extraction.
 *
 * This reduces costs by:
 * 1. Identifying exactly which pages contain controls
 * 2. Counting expected controls per section
 * 3. Creating targeted extraction plan
 */

import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

// ============================================================================
// Types
// ============================================================================

export interface DocumentSection {
  name: string;
  startPage: number;
  endPage: number;
  controlCount?: number;
  description?: string;
}

export interface SOC2DocumentStructure {
  totalPages: number;
  reportType: 'type1' | 'type2';
  auditFirm: string;
  serviceOrgName: string;
  trustServicesCriteria: string[];

  // Section boundaries
  sections: {
    auditorReport: DocumentSection | null;
    managementAssertion: DocumentSection | null;
    systemDescription: DocumentSection | null;
    controlsAndTests: DocumentSection | null; // Section IV - main extraction target
    additionalInfo: DocumentSection | null;
  };

  // Extraction plan
  extractionPlan: {
    totalExpectedControls: number;
    pageRanges: Array<{
      startPage: number;
      endPage: number;
      expectedControls: number;
      tscCategories: string[];
    }>;
  };

  // Analysis metadata
  analysisConfidence: number;
  analysisTimeMs: number;
}

// ============================================================================
// Constants
// ============================================================================

// Gemini 2.0 Flash: Fast, cheap, native PDF support
// Rate limit: 1,000,000 TPM vs Anthropic's 30,000 TPM
const ANALYZER_MODEL = 'gemini-2.0-flash';

const STRUCTURE_ANALYSIS_PROMPT = `You are analyzing a SOC 2 Type I or Type II audit report to identify its structure.

Analyze this document and extract:
1. Total number of pages
2. Report type (Type I or Type II)
3. Audit firm name
4. Service organization name
5. Trust Services Criteria in scope (Security, Availability, Processing Integrity, Confidentiality, Privacy)
6. Section boundaries (identify page numbers for each major section)
7. Count of controls per section (especially Section IV which contains the control matrix)

Focus on finding Section IV (or equivalent) which contains "Trust Services Criteria, Related Controls, and Tests of Controls" - this is where all the individual controls are listed.

RESPOND WITH ONLY VALID JSON in this exact format:
{
  "totalPages": 56,
  "reportType": "type2",
  "auditFirm": "CertPro",
  "serviceOrgName": "Example Corp",
  "trustServicesCriteria": ["security", "availability", "confidentiality"],
  "sections": {
    "auditorReport": { "name": "Independent Auditor's Report", "startPage": 1, "endPage": 4 },
    "managementAssertion": { "name": "Management Assertion", "startPage": 5, "endPage": 6 },
    "systemDescription": { "name": "System Description", "startPage": 7, "endPage": 14 },
    "controlsAndTests": { "name": "Trust Services Criteria and Controls", "startPage": 15, "endPage": 52, "controlCount": 135 },
    "additionalInfo": { "name": "Additional Information", "startPage": 53, "endPage": 56 }
  },
  "extractionPlan": {
    "totalExpectedControls": 135,
    "pageRanges": [
      { "startPage": 15, "endPage": 22, "expectedControls": 20, "tscCategories": ["CC1", "CC2"] },
      { "startPage": 23, "endPage": 30, "expectedControls": 25, "tscCategories": ["CC3", "CC4", "CC5"] },
      { "startPage": 31, "endPage": 40, "expectedControls": 35, "tscCategories": ["CC6"] },
      { "startPage": 41, "endPage": 48, "expectedControls": 30, "tscCategories": ["CC7", "CC8", "CC9"] },
      { "startPage": 49, "endPage": 52, "expectedControls": 25, "tscCategories": ["A", "C"] }
    ]
  },
  "analysisConfidence": 0.95
}

IMPORTANT:
- Count EVERY control in Section IV, not just a sample
- The controlCount should be the actual number of controls you can identify
- Break pageRanges into chunks of ~5-10 pages for efficient extraction`;

// ============================================================================
// Main Function
// ============================================================================

/**
 * Analyze SOC 2 document structure using Haiku (cheap)
 * Returns extraction plan for targeted control extraction
 */
export async function analyzeSOC2Structure(
  pdfBuffer: Buffer,
  options: { verbose?: boolean } = {}
): Promise<SOC2DocumentStructure> {
  const startTime = Date.now();
  const { verbose = false } = options;

  if (verbose) {
    console.log('[SOC2 Structure Analyzer] Starting analysis with Haiku...');
    console.log('[SOC2 Structure Analyzer] PDF size:', pdfBuffer.length, 'bytes');
  }

  // Convert buffer to base64
  const pdfBase64 = pdfBuffer.toString('base64');

  try {
    const result = await generateText({
      model: google(ANALYZER_MODEL),
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
              text: STRUCTURE_ANALYSIS_PROMPT,
            },
          ],
        },
      ],
      maxOutputTokens: 4096,
      temperature: 0, // Deterministic
    });

    // Parse JSON response
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in structure analysis response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const analysisTimeMs = Date.now() - startTime;

    if (verbose) {
      console.log('[SOC2 Structure Analyzer] Analysis complete');
      console.log('[SOC2 Structure Analyzer] Total pages:', parsed.totalPages);
      console.log('[SOC2 Structure Analyzer] Expected controls:', parsed.extractionPlan?.totalExpectedControls);
      console.log('[SOC2 Structure Analyzer] Time:', analysisTimeMs, 'ms');
    }

    return {
      ...parsed,
      analysisTimeMs,
    };
  } catch (error) {
    console.error('[SOC2 Structure Analyzer] Error:', error);
    throw error;
  }
}

/**
 * Create optimized extraction chunks from structure analysis
 * Ensures each chunk is ~5-8 pages for efficient processing
 */
export function createExtractionChunks(
  structure: SOC2DocumentStructure,
  maxPagesPerChunk: number = 8
): Array<{
  chunkIndex: number;
  startPage: number;
  endPage: number;
  expectedControls: number;
  tscCategories: string[];
}> {
  const chunks: Array<{
    chunkIndex: number;
    startPage: number;
    endPage: number;
    expectedControls: number;
    tscCategories: string[];
  }> = [];

  // Use extraction plan from structure analysis
  if (structure.extractionPlan?.pageRanges) {
    let chunkIndex = 0;
    for (const range of structure.extractionPlan.pageRanges) {
      // Split large ranges into smaller chunks
      const rangePages = range.endPage - range.startPage + 1;
      if (rangePages <= maxPagesPerChunk) {
        chunks.push({
          chunkIndex: chunkIndex++,
          ...range,
        });
      } else {
        // Split into smaller chunks
        let currentStart = range.startPage;
        const controlsPerPage = range.expectedControls / rangePages;
        while (currentStart <= range.endPage) {
          const currentEnd = Math.min(currentStart + maxPagesPerChunk - 1, range.endPage);
          const pagesInChunk = currentEnd - currentStart + 1;
          chunks.push({
            chunkIndex: chunkIndex++,
            startPage: currentStart,
            endPage: currentEnd,
            expectedControls: Math.ceil(controlsPerPage * pagesInChunk),
            tscCategories: range.tscCategories,
          });
          currentStart = currentEnd + 1;
        }
      }
    }
  } else {
    // Fallback: use controls section boundaries
    const controlsSection = structure.sections?.controlsAndTests;
    if (controlsSection) {
      let currentStart = controlsSection.startPage;
      let chunkIndex = 0;
      while (currentStart <= controlsSection.endPage) {
        const currentEnd = Math.min(currentStart + maxPagesPerChunk - 1, controlsSection.endPage);
        chunks.push({
          chunkIndex: chunkIndex++,
          startPage: currentStart,
          endPage: currentEnd,
          expectedControls: 15, // Estimate
          tscCategories: [],
        });
        currentStart = currentEnd + 1;
      }
    }
  }

  return chunks;
}
