/**
 * Document Scanner Service
 *
 * Quick document classification using Claude Haiku for fast, cheap scanning
 * to identify document type before full analysis.
 *
 * Uses Vercel AI SDK for native PDF support in serverless environments.
 */

import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { QUICK_SCAN_SYSTEM_PROMPT } from './prompts';

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
// Claude Quick Scan Response
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

// ============================================================================
// Main Scan Function using AI SDK
// ============================================================================

export interface ScanDocumentOptions {
  pdfBuffer: Buffer;
  apiKey: string;
}

export async function scanDocument(
  options: ScanDocumentOptions
): Promise<DocumentScanResult> {
  const startTime = Date.now();

  console.log('[Document Scanner] Starting PDF scan with AI SDK...');
  console.log('[Document Scanner] PDF buffer size:', options.pdfBuffer.length);

  // Convert Buffer to base64 for AI SDK
  const pdfBase64 = options.pdfBuffer.toString('base64');
  console.log('[Document Scanner] Converted to base64, length:', pdfBase64.length);

  const userPrompt = `Analyze this PDF document and extract the following information. Respond ONLY with a valid JSON object, no other text.

Required JSON structure:
{
  "document_type": "contract" | "sla" | "dpa" | "nda" | "master_agreement" | "amendment" | "soc2_report" | "iso_certificate" | "pentest_report" | "policy" | "other",
  "document_type_confidence": 0.0-1.0,
  "title": "document title or null",
  "parties": [{"name": "Company Name", "role": "provider" | "customer" | "other"}],
  "effective_date": "YYYY-MM-DD or null",
  "expiry_date": "YYYY-MM-DD or null",
  "governing_law": "jurisdiction or null",
  "is_ict_contract": true/false (is this an ICT/technology services contract?),
  "likely_critical_function": true/false (does this support critical business functions?),
  "key_services_mentioned": ["service1", "service2"],
  "scan_notes": "brief notes about the document or null"
}`;

  try {
    console.log('[Document Scanner] Calling Claude via AI SDK...');

    const result = await generateText({
      model: anthropic(SCANNER_MODEL),
      system: QUICK_SCAN_SYSTEM_PROMPT,
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
              text: userPrompt,
            },
          ],
        },
      ],
      maxOutputTokens: 1024,
    });

    console.log('[Document Scanner] AI SDK response received');

    // Parse JSON response
    const responseText = result.text;
    console.log('[Document Scanner] Response text length:', responseText.length);

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[Document Scanner] No JSON found in response:', responseText);
      throw new Error('No JSON found in AI response');
    }

    const scan = JSON.parse(jsonMatch[0]) as ClaudeScanResponse;
    console.log('[Document Scanner] Parsed scan result, type:', scan.document_type);

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
  } catch (error) {
    console.error('[Document Scanner] Error:', error);
    console.error('[Document Scanner] Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('[Document Scanner] Error message:', error instanceof Error ? error.message : String(error));
    throw error;
  }
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
