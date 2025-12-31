/**
 * Document Scanner Service
 *
 * Quick document classification using Claude Haiku for fast, cheap scanning
 * to identify document type before full analysis
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  QUICK_SCAN_SYSTEM_PROMPT,
  buildQuickScanPrompt,
} from './prompts';
import { extractTextFromPdf } from './contract-analyzer';

// ============================================================================
// Constants
// ============================================================================

const SCANNER_MODEL = 'claude-3-5-haiku-20241022';

// ============================================================================
// Types
// ============================================================================

export type ScannedDocumentType =
  | 'contract'
  | 'sla'
  | 'dpa'
  | 'nda'
  | 'master_agreement'
  | 'amendment'
  | 'soc2_report'
  | 'iso_certificate'
  | 'pentest_report'
  | 'policy'
  | 'other';

export interface ScannedParty {
  name: string;
  role: 'provider' | 'customer' | 'other';
}

export interface DocumentScanResult {
  // Document classification
  documentType: ScannedDocumentType;
  documentTypeConfidence: number;
  title: string | null;

  // Parties
  parties: ScannedParty[];

  // Key dates
  effectiveDate: string | null;
  expiryDate: string | null;

  // Contract metadata
  governingLaw: string | null;
  isIctContract: boolean;
  likelyCriticalFunction: boolean;

  // Services
  keyServicesMentioned: string[];

  // Scan metadata
  scanNotes: string | null;
  scanModel: string;
  processingTimeMs: number;
}

// ============================================================================
// Claude Quick Scan
// ============================================================================

interface ClaudeScanResponse {
  document_type: ScannedDocumentType;
  document_type_confidence: number;
  title: string | null;
  parties: Array<{ name: string; role: 'provider' | 'customer' | 'other' }>;
  effective_date: string | null;
  expiry_date: string | null;
  governing_law: string | null;
  is_ict_contract: boolean;
  likely_critical_function: boolean;
  key_services_mentioned: string[];
  scan_notes: string | null;
}

async function scanWithClaude(
  documentText: string,
  apiKey: string
): Promise<ClaudeScanResponse> {
  const client = new Anthropic({
    apiKey,
  });

  const userPrompt = buildQuickScanPrompt(documentText);

  const response = await client.messages.create({
    model: SCANNER_MODEL,
    max_tokens: 1024,
    system: QUICK_SCAN_SYSTEM_PROMPT,
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
    return JSON.parse(jsonMatch[0]) as ClaudeScanResponse;
  } catch (parseError) {
    console.error('Failed to parse Claude scan response:', textContent.text);
    throw new Error('Failed to parse AI scan response as JSON');
  }
}

// ============================================================================
// Main Scan Function
// ============================================================================

export interface ScanDocumentOptions {
  pdfBuffer: Buffer;
  apiKey: string;
}

export async function scanDocument(
  options: ScanDocumentOptions
): Promise<DocumentScanResult> {
  const startTime = Date.now();

  // Step 1: Extract text from PDF (uses first ~5000 chars in prompt)
  console.log('[Document Scanner] Extracting text from PDF...');
  const { text } = await extractTextFromPdf(options.pdfBuffer);
  console.log('[Document Scanner] Extracted', text.length, 'characters');

  if (!text || text.trim().length < 50) {
    throw new Error('Document text too short or empty - may be a scanned image PDF');
  }

  // Step 2: Quick scan with Claude Haiku
  console.log('[Document Scanner] Calling Claude Haiku...');
  const scan = await scanWithClaude(text, options.apiKey);
  console.log('[Document Scanner] Claude response received');

  // Step 3: Map results
  const processingTimeMs = Date.now() - startTime;

  return {
    documentType: scan.document_type || 'other',
    documentTypeConfidence: scan.document_type_confidence || 0,
    title: scan.title,
    parties: scan.parties || [],
    effectiveDate: scan.effective_date,
    expiryDate: scan.expiry_date,
    governingLaw: scan.governing_law,
    isIctContract: scan.is_ict_contract ?? false,
    likelyCriticalFunction: scan.likely_critical_function ?? false,
    keyServicesMentioned: scan.key_services_mentioned || [],
    scanNotes: scan.scan_notes,
    scanModel: SCANNER_MODEL,
    processingTimeMs,
  };
}

// ============================================================================
// Helper: Check if document needs full DORA analysis
// ============================================================================

export function shouldAnalyzeForDora(scanResult: DocumentScanResult): boolean {
  // ICT contracts should always be analyzed
  if (scanResult.isIctContract) {
    return true;
  }

  // Contract-type documents should be analyzed
  const contractTypes: ScannedDocumentType[] = [
    'contract',
    'sla',
    'dpa',
    'master_agreement',
    'amendment',
  ];

  if (contractTypes.includes(scanResult.documentType)) {
    return true;
  }

  return false;
}

// ============================================================================
// Helper: Map scan result to contract form fields
// ============================================================================

export interface ContractFormSuggestions {
  name: string | null;
  contractType: string | null;
  effectiveDate: string | null;
  expiryDate: string | null;
  providerName: string | null;
  services: string[];
  isCriticalFunction: boolean;
}

export function mapScanToContractForm(
  scanResult: DocumentScanResult
): ContractFormSuggestions {
  // Find the provider from parties
  const provider = scanResult.parties.find((p) => p.role === 'provider');

  // Map document type to contract type
  const typeMapping: Record<ScannedDocumentType, string> = {
    contract: 'service_agreement',
    sla: 'sla',
    dpa: 'dpa',
    nda: 'other',
    master_agreement: 'master_agreement',
    amendment: 'amendment',
    soc2_report: 'other',
    iso_certificate: 'other',
    pentest_report: 'other',
    policy: 'other',
    other: 'other',
  };

  return {
    name: scanResult.title,
    contractType: typeMapping[scanResult.documentType],
    effectiveDate: scanResult.effectiveDate,
    expiryDate: scanResult.expiryDate,
    providerName: provider?.name || null,
    services: scanResult.keyServicesMentioned,
    isCriticalFunction: scanResult.likelyCriticalFunction,
  };
}

// ============================================================================
// Export
// ============================================================================

export { SCANNER_MODEL };
