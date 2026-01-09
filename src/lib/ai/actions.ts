'use server';

/**
 * AI Analysis Server Actions
 *
 * Server-side actions for triggering and managing AI contract analysis
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { analyzeContract, EXTRACTION_MODEL, EXTRACTION_VERSION } from './contract-analyzer';
import { parseSOC2Simple } from './parsers/soc2-parser-simple';
import { parseISO27001 } from './parsers/iso27001-parser';
import { parsePentestReport } from './parsers/pentest-parser';
import type { DocumentType } from '@/lib/documents/types';
import type {
  ContractAnalysisResult,
  ParsedContractRecord,
  ExtractedArticle30_2,
  ExtractedArticle30_3,
} from './types';
import type { DoraProvisions, DoraProvisionStatus } from '@/lib/contracts/types';

// ============================================================================
// Types
// ============================================================================

export type AnalysisErrorCode =
  | 'UNAUTHORIZED'
  | 'DOCUMENT_NOT_FOUND'
  | 'INVALID_DOCUMENT_TYPE'
  | 'EXTRACTION_FAILED'
  | 'API_KEY_MISSING'
  | 'ANALYSIS_IN_PROGRESS'
  | 'DATABASE_ERROR';

export interface AnalysisError {
  code: AnalysisErrorCode;
  message: string;
}

export interface AnalysisActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: AnalysisError;
}

// ============================================================================
// Helper Functions
// ============================================================================

function createError(code: AnalysisErrorCode, message: string): AnalysisError {
  return { code, message };
}

async function getCurrentUserOrganization(): Promise<string | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  return userData?.organization_id || null;
}

function mapProvisionStatusToDora(status: string): DoraProvisionStatus {
  switch (status) {
    case 'present':
      return 'present';
    case 'partial':
      return 'partial';
    case 'missing':
    case 'unclear':
    case 'not_analyzed':
    default:
      return 'missing';
  }
}

function mapAnalysisToDoraProvisions(
  article30_2: ExtractedArticle30_2,
  article30_3: ExtractedArticle30_3,
  includeCritical: boolean
): DoraProvisions {
  const provisions: DoraProvisions = {
    article_30_2: {
      service_description: {
        status: mapProvisionStatusToDora(article30_2.service_description.status),
        location: article30_2.service_description.location || undefined,
        notes: article30_2.service_description.analysis || undefined,
      },
      data_locations: {
        status: mapProvisionStatusToDora(article30_2.data_locations.status),
        location: article30_2.data_locations.location || undefined,
        notes: article30_2.data_locations.analysis || undefined,
      },
      data_protection: {
        status: mapProvisionStatusToDora(article30_2.data_protection.status),
        location: article30_2.data_protection.location || undefined,
        notes: article30_2.data_protection.analysis || undefined,
      },
      availability_guarantees: {
        status: mapProvisionStatusToDora(article30_2.availability_guarantees.status),
        location: article30_2.availability_guarantees.location || undefined,
        notes: article30_2.availability_guarantees.analysis || undefined,
      },
      incident_support: {
        status: mapProvisionStatusToDora(article30_2.incident_support.status),
        location: article30_2.incident_support.location || undefined,
        notes: article30_2.incident_support.analysis || undefined,
      },
      authority_cooperation: {
        status: mapProvisionStatusToDora(article30_2.authority_cooperation.status),
        location: article30_2.authority_cooperation.location || undefined,
        notes: article30_2.authority_cooperation.analysis || undefined,
      },
      termination_rights: {
        status: mapProvisionStatusToDora(article30_2.termination_rights.status),
        location: article30_2.termination_rights.location || undefined,
        notes: article30_2.termination_rights.analysis || undefined,
      },
      subcontracting_conditions: {
        status: mapProvisionStatusToDora(article30_2.subcontracting_conditions.status),
        location: article30_2.subcontracting_conditions.location || undefined,
        notes: article30_2.subcontracting_conditions.analysis || undefined,
      },
    },
    last_assessment_date: new Date().toISOString().split('T')[0],
  };

  if (includeCritical) {
    provisions.article_30_3 = {
      sla_targets: {
        status: mapProvisionStatusToDora(article30_3.sla_targets.status),
        location: article30_3.sla_targets.location || undefined,
        notes: article30_3.sla_targets.analysis || undefined,
      },
      notice_periods: {
        status: mapProvisionStatusToDora(article30_3.notice_periods.status),
        location: article30_3.notice_periods.location || undefined,
        notes: article30_3.notice_periods.analysis || undefined,
      },
      business_continuity: {
        status: mapProvisionStatusToDora(article30_3.business_continuity.status),
        location: article30_3.business_continuity.location || undefined,
        notes: article30_3.business_continuity.analysis || undefined,
      },
      ict_security: {
        status: mapProvisionStatusToDora(article30_3.ict_security.status),
        location: article30_3.ict_security.location || undefined,
        notes: article30_3.ict_security.analysis || undefined,
      },
      tlpt_participation: {
        status: mapProvisionStatusToDora(article30_3.tlpt_participation.status),
        location: article30_3.tlpt_participation.location || undefined,
        notes: article30_3.tlpt_participation.analysis || undefined,
      },
      audit_rights: {
        status: mapProvisionStatusToDora(article30_3.audit_rights.status),
        location: article30_3.audit_rights.location || undefined,
        notes: article30_3.audit_rights.analysis || undefined,
      },
      exit_strategy: {
        status: mapProvisionStatusToDora(article30_3.exit_strategy.status),
        location: article30_3.exit_strategy.location || undefined,
        notes: article30_3.exit_strategy.analysis || undefined,
      },
      performance_access: {
        status: mapProvisionStatusToDora(article30_3.performance_access.status),
        location: article30_3.performance_access.location || undefined,
        notes: article30_3.performance_access.analysis || undefined,
      },
    };
  }

  return provisions;
}

// ============================================================================
// Main Analysis Action
// ============================================================================

export async function analyzeContractDocument(
  documentId: string,
  contractId?: string,
  includeCriticalProvisions: boolean = true
): Promise<AnalysisActionResult<ParsedContractRecord>> {
  const supabase = await createClient();

  // Verify authentication
  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) {
    return {
      success: false,
      error: createError('UNAUTHORIZED', 'You must be logged in to analyze documents'),
    };
  }

  // Check API key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      error: createError('API_KEY_MISSING', 'AI analysis is not configured'),
    };
  }

  // Get document
  const { data: document, error: docError } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .eq('organization_id', organizationId)
    .single();

  if (docError || !document) {
    return {
      success: false,
      error: createError('DOCUMENT_NOT_FOUND', 'Document not found'),
    };
  }

  // Validate document type
  if (document.mime_type !== 'application/pdf') {
    return {
      success: false,
      error: createError('INVALID_DOCUMENT_TYPE', 'Only PDF documents can be analyzed'),
    };
  }

  // Check for existing analysis in progress
  const { data: existingAnalysis } = await supabase
    .from('parsed_contracts')
    .select('id, status')
    .eq('document_id', documentId)
    .eq('status', 'processing')
    .single();

  if (existingAnalysis) {
    return {
      success: false,
      error: createError('ANALYSIS_IN_PROGRESS', 'Analysis is already in progress for this document'),
    };
  }

  // Create processing record
  const { data: processingRecord, error: insertError } = await supabase
    .from('parsed_contracts')
    .insert({
      document_id: documentId,
      contract_id: contractId || null,
      organization_id: organizationId,
      status: 'processing',
      extraction_model: EXTRACTION_MODEL,
      extraction_version: EXTRACTION_VERSION,
    })
    .select()
    .single();

  if (insertError || !processingRecord) {
    console.error('Failed to create processing record:', insertError);
    return {
      success: false,
      error: createError('DATABASE_ERROR', 'Failed to start analysis'),
    };
  }

  try {
    // Download PDF from storage using service role client
    const serviceClient = createServiceRoleClient();
    const { data: fileData, error: downloadError } = await serviceClient.storage
      .from('documents')
      .download(document.storage_path);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download document: ${downloadError?.message}`);
    }

    // Convert blob to buffer
    const arrayBuffer = await fileData.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    // Run analysis
    const result = await analyzeContract({
      documentId,
      pdfBuffer,
      apiKey,
    });

    // Update record with results
    const { data: updatedRecord, error: updateError } = await supabase
      .from('parsed_contracts')
      .update({
        status: 'completed',
        raw_text: null, // Don't store raw text to save space
        page_count: result.pageCount,
        word_count: result.wordCount,
        identified_contract_type: result.contractType,
        identified_parties: result.parties,
        identified_effective_date: result.effectiveDate,
        identified_expiry_date: result.expiryDate,
        identified_governing_law: result.governingLaw,
        article_30_2: result.article30_2,
        article_30_3: result.article30_3,
        key_dates: result.keyDates,
        financial_terms: result.financialTerms,
        risk_flags: result.riskFlags,
        compliance_gaps: result.complianceGaps,
        overall_compliance_score: result.overallComplianceScore,
        article_30_2_score: result.article30_2Score,
        article_30_3_score: result.article30_3Score,
        confidence_score: result.confidenceScore,
        processing_time_ms: result.processingTimeMs,
        extracted_at: new Date().toISOString(),
      })
      .eq('id', processingRecord.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to save analysis results: ${updateError.message}`);
    }

    // If contractId provided, update the contract's dora_provisions
    if (contractId) {
      const doraProvisions = mapAnalysisToDoraProvisions(
        result.article30_2,
        result.article30_3,
        includeCriticalProvisions
      );
      doraProvisions.overall_compliance_score = result.overallComplianceScore;

      await supabase
        .from('contracts')
        .update({
          dora_provisions: doraProvisions,
          updated_at: new Date().toISOString(),
        })
        .eq('id', contractId)
        .eq('organization_id', organizationId);
    }

    // Update document parsing status AND metadata with extracted info
    // Build metadata from AI analysis results
    const extractedMetadata: Record<string, unknown> = {
      ...document.metadata, // Preserve existing metadata
    };

    // Add extracted contract details
    if (result.contractType) {
      extractedMetadata.description = result.contractType;
    }
    if (result.effectiveDate) {
      extractedMetadata.valid_from = result.effectiveDate;
      extractedMetadata.contract_start = result.effectiveDate;
    }
    if (result.expiryDate) {
      extractedMetadata.valid_until = result.expiryDate;
      extractedMetadata.expiry_date = result.expiryDate;
      extractedMetadata.contract_end = result.expiryDate;
    }
    if (result.governingLaw) {
      extractedMetadata.governing_law = result.governingLaw;
    }
    if (result.parties && result.parties.length > 0) {
      extractedMetadata.parties = result.parties;
      // Extract provider and customer names
      const provider = result.parties.find(p => p.role === 'provider');
      const customer = result.parties.find(p => p.role === 'customer');
      if (provider) extractedMetadata.provider_name = provider.name;
      if (customer) extractedMetadata.customer_name = customer.name;
    }
    // Add analysis metadata
    extractedMetadata.ai_analyzed = true;
    extractedMetadata.ai_analysis_date = new Date().toISOString();
    extractedMetadata.ai_compliance_score = result.overallComplianceScore;
    extractedMetadata.page_count = result.pageCount;
    extractedMetadata.word_count = result.wordCount;

    await supabase
      .from('documents')
      .update({
        parsing_status: 'completed',
        parsed_at: new Date().toISOString(),
        parsing_confidence: result.confidenceScore,
        metadata: extractedMetadata,
      })
      .eq('id', documentId);

    // Log activity
    await supabase.from('activity_log').insert({
      organization_id: organizationId,
      action: 'analyzed',
      entity_type: 'document',
      entity_id: documentId,
      entity_name: document.filename,
      details: {
        analysis_id: processingRecord.id,
        compliance_score: result.overallComplianceScore,
        processing_time_ms: result.processingTimeMs,
      },
    });

    // Revalidate paths
    revalidatePath('/documents');
    if (contractId) {
      revalidatePath(`/contracts/${contractId}`);
    }
    if (document.vendor_id) {
      revalidatePath(`/vendors/${document.vendor_id}`);
    }

    return {
      success: true,
      data: updatedRecord as ParsedContractRecord,
    };
  } catch (error) {
    // Update record with error
    await supabase
      .from('parsed_contracts')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('id', processingRecord.id);

    // Update document status
    await supabase
      .from('documents')
      .update({
        parsing_status: 'failed',
        parsing_error: error instanceof Error ? error.message : 'Unknown error',
      })
      .eq('id', documentId);

    console.error('Contract analysis failed:', error);
    return {
      success: false,
      error: createError(
        'EXTRACTION_FAILED',
        error instanceof Error ? error.message : 'Analysis failed'
      ),
    };
  }
}

// ============================================================================
// Get Analysis Result
// ============================================================================

export async function getContractAnalysis(
  documentId: string
): Promise<ParsedContractRecord | null> {
  const supabase = await createClient();

  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) return null;

  const { data, error } = await supabase
    .from('parsed_contracts')
    .select('*')
    .eq('document_id', documentId)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;

  return data as ParsedContractRecord;
}

// ============================================================================
// Apply Analysis to Contract
// ============================================================================

export async function applyAnalysisToContract(
  analysisId: string,
  contractId: string,
  includeCriticalProvisions: boolean = true
): Promise<AnalysisActionResult> {
  const supabase = await createClient();

  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) {
    return {
      success: false,
      error: createError('UNAUTHORIZED', 'You must be logged in'),
    };
  }

  // Get analysis
  const { data: analysis, error: analysisError } = await supabase
    .from('parsed_contracts')
    .select('*')
    .eq('id', analysisId)
    .eq('organization_id', organizationId)
    .single();

  if (analysisError || !analysis) {
    return {
      success: false,
      error: createError('DOCUMENT_NOT_FOUND', 'Analysis not found'),
    };
  }

  // Verify contract ownership
  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select('id, vendor_id')
    .eq('id', contractId)
    .eq('organization_id', organizationId)
    .single();

  if (contractError || !contract) {
    return {
      success: false,
      error: createError('DOCUMENT_NOT_FOUND', 'Contract not found'),
    };
  }

  // Map and apply provisions
  const doraProvisions = mapAnalysisToDoraProvisions(
    analysis.article_30_2 as ExtractedArticle30_2,
    analysis.article_30_3 as ExtractedArticle30_3,
    includeCriticalProvisions
  );
  doraProvisions.overall_compliance_score = analysis.overall_compliance_score;

  const { error: updateError } = await supabase
    .from('contracts')
    .update({
      dora_provisions: doraProvisions,
      updated_at: new Date().toISOString(),
    })
    .eq('id', contractId);

  if (updateError) {
    return {
      success: false,
      error: createError('DATABASE_ERROR', 'Failed to update contract'),
    };
  }

  // Link analysis to contract
  await supabase
    .from('parsed_contracts')
    .update({ contract_id: contractId })
    .eq('id', analysisId);

  revalidatePath(`/contracts/${contractId}`);
  revalidatePath(`/vendors/${contract.vendor_id}`);

  return { success: true };
}

// ============================================================================
// Sign-off Actions
// ============================================================================

export interface SignOffInput {
  analysisId: string;
  reviewerName: string;
  reviewNotes?: string;
  confirmations: {
    reviewedProvisions: boolean;
    reviewedRisks: boolean;
    reviewedGaps: boolean;
    understandsLimitations: boolean;
  };
}

export async function signOffAnalysis(
  input: SignOffInput
): Promise<AnalysisActionResult<{ reviewedAt: string }>> {
  const supabase = await createClient();

  // Verify authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return {
      success: false,
      error: createError('UNAUTHORIZED', 'You must be logged in to sign off on analysis'),
    };
  }

  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) {
    return {
      success: false,
      error: createError('UNAUTHORIZED', 'Organization not found'),
    };
  }

  // Validate all confirmations are checked
  const { confirmations } = input;
  if (
    !confirmations.reviewedProvisions ||
    !confirmations.reviewedRisks ||
    !confirmations.reviewedGaps ||
    !confirmations.understandsLimitations
  ) {
    return {
      success: false,
      error: createError(
        'EXTRACTION_FAILED',
        'All confirmation checkboxes must be checked to sign off'
      ),
    };
  }

  // Get analysis record
  const { data: analysis, error: analysisError } = await supabase
    .from('parsed_contracts')
    .select('*')
    .eq('id', input.analysisId)
    .eq('organization_id', organizationId)
    .single();

  if (analysisError || !analysis) {
    return {
      success: false,
      error: createError('DOCUMENT_NOT_FOUND', 'Analysis not found'),
    };
  }

  // Check if already signed off
  if (analysis.review_confirmed) {
    return {
      success: false,
      error: createError(
        'EXTRACTION_FAILED',
        'This analysis has already been signed off'
      ),
    };
  }

  // Update with sign-off
  const reviewedAt = new Date().toISOString();
  const { error: updateError } = await supabase
    .from('parsed_contracts')
    .update({
      reviewed_by: user.id,
      reviewed_at: reviewedAt,
      review_confirmed: true,
      reviewer_name: input.reviewerName,
      review_notes: input.reviewNotes || null,
      legal_acknowledgment_accepted: true,
      updated_at: reviewedAt,
    })
    .eq('id', input.analysisId);

  if (updateError) {
    console.error('Failed to sign off analysis:', updateError);
    return {
      success: false,
      error: createError('DATABASE_ERROR', 'Failed to record sign-off'),
    };
  }

  // Log activity
  await supabase.from('activity_log').insert({
    organization_id: organizationId,
    user_id: user.id,
    action: 'signed_off',
    entity_type: 'parsed_contract',
    entity_id: input.analysisId,
    entity_name: `AI Analysis Sign-off by ${input.reviewerName}`,
    details: {
      reviewer_name: input.reviewerName,
      review_notes: input.reviewNotes,
      document_id: analysis.document_id,
    },
  });

  revalidatePath('/documents');

  return {
    success: true,
    data: { reviewedAt },
  };
}

// Updated applyAnalysisToContract to require sign-off
export async function applySignedOffAnalysisToContract(
  analysisId: string,
  contractId: string,
  includeCriticalProvisions: boolean = true
): Promise<AnalysisActionResult> {
  const supabase = await createClient();

  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) {
    return {
      success: false,
      error: createError('UNAUTHORIZED', 'You must be logged in'),
    };
  }

  // Get analysis and verify sign-off
  const { data: analysis, error: analysisError } = await supabase
    .from('parsed_contracts')
    .select('*')
    .eq('id', analysisId)
    .eq('organization_id', organizationId)
    .single();

  if (analysisError || !analysis) {
    return {
      success: false,
      error: createError('DOCUMENT_NOT_FOUND', 'Analysis not found'),
    };
  }

  // CRITICAL: Require sign-off before applying to contract
  if (!analysis.review_confirmed) {
    return {
      success: false,
      error: createError(
        'EXTRACTION_FAILED',
        'Analysis must be formally reviewed and signed off before applying to a contract. Please complete the sign-off process first.'
      ),
    };
  }

  // Verify contract ownership
  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select('id, vendor_id')
    .eq('id', contractId)
    .eq('organization_id', organizationId)
    .single();

  if (contractError || !contract) {
    return {
      success: false,
      error: createError('DOCUMENT_NOT_FOUND', 'Contract not found'),
    };
  }

  // Map and apply provisions
  const doraProvisions = mapAnalysisToDoraProvisions(
    analysis.article_30_2 as ExtractedArticle30_2,
    analysis.article_30_3 as ExtractedArticle30_3,
    includeCriticalProvisions
  );
  doraProvisions.overall_compliance_score = analysis.overall_compliance_score;
  doraProvisions.ai_analysis_id = analysisId;
  doraProvisions.ai_reviewed_by = analysis.reviewer_name;
  doraProvisions.ai_reviewed_at = analysis.reviewed_at;

  const { error: updateError } = await supabase
    .from('contracts')
    .update({
      dora_provisions: doraProvisions,
      updated_at: new Date().toISOString(),
    })
    .eq('id', contractId);

  if (updateError) {
    return {
      success: false,
      error: createError('DATABASE_ERROR', 'Failed to update contract'),
    };
  }

  // Link analysis to contract
  await supabase
    .from('parsed_contracts')
    .update({ contract_id: contractId })
    .eq('id', analysisId);

  // Log activity
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from('activity_log').insert({
    organization_id: organizationId,
    user_id: user?.id,
    action: 'applied_analysis',
    entity_type: 'contract',
    entity_id: contractId,
    entity_name: 'Applied AI Analysis',
    details: {
      analysis_id: analysisId,
      signed_off_by: analysis.reviewer_name,
      signed_off_at: analysis.reviewed_at,
    },
  });

  revalidatePath(`/contracts/${contractId}`);
  revalidatePath(`/vendors/${contract.vendor_id}`);

  return { success: true };
}

// Get sign-off status for an analysis
export async function getAnalysisSignOffStatus(
  analysisId: string
): Promise<{
  isSignedOff: boolean;
  reviewerName: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
} | null> {
  const supabase = await createClient();

  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) return null;

  const { data, error } = await supabase
    .from('parsed_contracts')
    .select('review_confirmed, reviewer_name, reviewed_at, review_notes')
    .eq('id', analysisId)
    .eq('organization_id', organizationId)
    .single();

  if (error || !data) return null;

  return {
    isSignedOff: data.review_confirmed || false,
    reviewerName: data.reviewer_name,
    reviewedAt: data.reviewed_at,
    reviewNotes: data.review_notes,
  };
}

// ============================================================================
// Unified Document Parsing
// ============================================================================

export interface DocumentParseResult {
  success: boolean;
  documentType: DocumentType;
  parserVersion: string;
  processingTimeMs: number;
  data?: unknown;
  error?: string;
}

/**
 * Parse any document type using the appropriate AI parser
 * Dispatches to SOC2, ISO 27001, Pentest, or Contract parser based on type
 */
export async function parseDocument(
  documentId: string
): Promise<AnalysisActionResult<DocumentParseResult>> {
  const supabase = await createClient();

  // Verify authentication
  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) {
    return {
      success: false,
      error: createError('UNAUTHORIZED', 'You must be logged in to parse documents'),
    };
  }

  // Get document
  const { data: document, error: docError } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .eq('organization_id', organizationId)
    .single();

  if (docError || !document) {
    return {
      success: false,
      error: createError('DOCUMENT_NOT_FOUND', 'Document not found'),
    };
  }

  // Validate document type
  if (document.mime_type !== 'application/pdf') {
    return {
      success: false,
      error: createError('INVALID_DOCUMENT_TYPE', 'Only PDF documents can be parsed'),
    };
  }

  // Download PDF from storage using service role client
  const serviceClient = createServiceRoleClient();
  const { data: fileData, error: downloadError } = await serviceClient.storage
    .from('documents')
    .download(document.storage_path);

  if (downloadError || !fileData) {
    return {
      success: false,
      error: createError('EXTRACTION_FAILED', `Failed to download document: ${downloadError?.message}`),
    };
  }

  // Convert blob to buffer
  const arrayBuffer = await fileData.arrayBuffer();
  const pdfBuffer = Buffer.from(arrayBuffer);

  // Update document status to processing
  await supabase
    .from('documents')
    .update({
      parsing_status: 'processing',
      parsing_error: null,
    })
    .eq('id', documentId);

  try {
    let result: DocumentParseResult;
    const docType = document.type as DocumentType;

    switch (docType) {
      case 'soc2': {
        const parseResult = await parseSOC2Simple({
          pdfBuffer,
          documentId,
        });

        if (!parseResult.success) {
          throw new Error(parseResult.error || 'SOC2 parsing failed');
        }

        // Save to parsed_soc2 table
        if (parseResult.databaseRecord) {
          await supabase
            .from('parsed_soc2')
            .upsert({
              ...parseResult.databaseRecord,
              organization_id: organizationId,
            }, {
              onConflict: 'document_id',
            });
        }

        result = {
          success: true,
          documentType: 'soc2',
          parserVersion: parseResult.data?.parserVersion || '2.1.0',
          processingTimeMs: parseResult.processingTimeMs,
          data: parseResult.data,
        };
        break;
      }

      case 'iso27001': {
        const parseResult = await parseISO27001({
          pdfBuffer,
          documentId,
        });

        if (!parseResult.success) {
          throw new Error(parseResult.error || 'ISO 27001 parsing failed');
        }

        // Save to parsed_iso27001 table (or metadata for now)
        // Note: May need to create a parsed_iso27001 table via migration
        const metadata = {
          ...document.metadata,
          parsed_iso27001: parseResult.databaseRecord,
          certification_body: parseResult.data?.certificationBody,
          certificate_number: parseResult.data?.certificateNumber,
          valid_from: parseResult.data?.issueDate,
          valid_until: parseResult.data?.expiryDate,
          expiry_date: parseResult.data?.expiryDate,
          dora_coverage: parseResult.data?.doraCoverage,
        };

        await supabase
          .from('documents')
          .update({ metadata })
          .eq('id', documentId);

        result = {
          success: true,
          documentType: 'iso27001',
          parserVersion: parseResult.data?.parserVersion || '1.0.0',
          processingTimeMs: parseResult.processingTimeMs,
          data: parseResult.data,
        };
        break;
      }

      case 'pentest': {
        const parseResult = await parsePentestReport({
          pdfBuffer,
          documentId,
        });

        if (!parseResult.success) {
          throw new Error(parseResult.error || 'Pentest report parsing failed');
        }

        // Save to metadata (or create parsed_pentest table)
        const metadata = {
          ...document.metadata,
          parsed_pentest: parseResult.databaseRecord,
          tester_company: parseResult.data?.testerCompany,
          test_date: parseResult.data?.testStartDate,
          findings_count: parseResult.data?.totalFindings,
          critical_findings: parseResult.data?.findingsBySeverity.critical,
          high_findings: parseResult.data?.findingsBySeverity.high,
          overall_risk: parseResult.data?.overallRiskRating,
          dora_testing_coverage: parseResult.data?.doraTestingCoverage,
        };

        await supabase
          .from('documents')
          .update({ metadata })
          .eq('id', documentId);

        result = {
          success: true,
          documentType: 'pentest',
          parserVersion: parseResult.data?.parserVersion || '1.0.0',
          processingTimeMs: parseResult.processingTimeMs,
          data: parseResult.data,
        };
        break;
      }

      case 'contract': {
        // Use existing contract analyzer
        const contractResult = await analyzeContractDocument(documentId);
        if (!contractResult.success) {
          throw new Error(contractResult.error?.message || 'Contract analysis failed');
        }

        result = {
          success: true,
          documentType: 'contract',
          parserVersion: EXTRACTION_VERSION,
          processingTimeMs: contractResult.data?.processing_time_ms || 0,
          data: contractResult.data,
        };
        break;
      }

      default: {
        // For 'other' type, try contract analysis as fallback
        const otherResult = await analyzeContractDocument(documentId);
        if (!otherResult.success) {
          throw new Error(otherResult.error?.message || 'Document analysis failed');
        }

        result = {
          success: true,
          documentType: 'other',
          parserVersion: EXTRACTION_VERSION,
          processingTimeMs: otherResult.data?.processing_time_ms || 0,
          data: otherResult.data,
        };
      }
    }

    // Update document with success status
    await supabase
      .from('documents')
      .update({
        parsing_status: 'completed',
        parsed_at: new Date().toISOString(),
        parsing_confidence: 0.9,
        parsing_error: null,
      })
      .eq('id', documentId);

    // Log activity
    await supabase.from('activity_log').insert({
      organization_id: organizationId,
      action: 'parsed',
      entity_type: 'document',
      entity_id: documentId,
      entity_name: document.filename,
      details: {
        document_type: docType,
        parser_version: result.parserVersion,
        processing_time_ms: result.processingTimeMs,
      },
    });

    revalidatePath('/documents');
    revalidatePath(`/documents/${documentId}`);
    if (document.vendor_id) {
      revalidatePath(`/vendors/${document.vendor_id}`);
    }

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Update document with error status
    await supabase
      .from('documents')
      .update({
        parsing_status: 'failed',
        parsing_error: errorMessage,
      })
      .eq('id', documentId);

    console.error(`Document parsing failed for ${documentId}:`, error);

    return {
      success: false,
      error: createError('EXTRACTION_FAILED', errorMessage),
    };
  }
}

/**
 * Batch parse multiple documents
 */
export async function parseDocuments(
  documentIds: string[]
): Promise<AnalysisActionResult<{
  successful: string[];
  failed: Array<{ id: string; error: string }>;
}>> {
  const successful: string[] = [];
  const failed: Array<{ id: string; error: string }> = [];

  for (const documentId of documentIds) {
    const result = await parseDocument(documentId);
    if (result.success) {
      successful.push(documentId);
    } else {
      failed.push({
        id: documentId,
        error: result.error?.message || 'Unknown error',
      });
    }
  }

  return {
    success: failed.length === 0,
    data: { successful, failed },
  };
}
