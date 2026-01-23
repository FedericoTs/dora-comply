'use server';

/**
 * Contract Server Actions
 * Server-side actions for contract CRUD operations
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  createContractSchema,
  updateContractSchema,
  type CreateContractFormData,
  type UpdateContractFormData,
} from './schema';
import type {
  Contract,
  ContractWithVendor,
  DoraProvisions,
} from './types';
import {
  createAppError,
  mapDomainDatabaseError,
  type AppError,
  type ContractErrorCode,
} from '@/lib/errors';
import { getCurrentUserOrganization } from '@/lib/auth/organization';

// ============================================================================
// Types
// ============================================================================

export type { ContractErrorCode } from '@/lib/errors';

export type ContractError = AppError<ContractErrorCode>;

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: ContractError;
}

// ============================================================================
// Helper Functions
// ============================================================================

function createContractError(
  code: ContractErrorCode,
  message: string,
  field?: string
): ContractError {
  return createAppError(code, message, field);
}

function mapDatabaseError(error: { message: string; code?: string }): ContractError {
  return mapDomainDatabaseError<ContractErrorCode>(error, 'contract');
}

async function verifyVendorOwnership(vendorId: string, organizationId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id')
    .eq('id', vendorId)
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .single();

  return !!vendor;
}

function mapContractFromDatabase(row: Record<string, unknown>): Contract {
  return {
    id: row.id as string,
    organization_id: row.organization_id as string,
    vendor_id: row.vendor_id as string,
    contract_ref: row.contract_ref as string,
    contract_type: row.contract_type as Contract['contract_type'],
    signature_date: row.signature_date as string | null,
    effective_date: row.effective_date as string,
    expiry_date: row.expiry_date as string | null,
    auto_renewal: row.auto_renewal as boolean,
    termination_notice_days: row.termination_notice_days as number | null,
    last_renewal_date: row.last_renewal_date as string | null,
    dora_provisions: (row.dora_provisions as DoraProvisions) || {
      article_30_2: {
        service_description: { status: 'missing' },
        data_locations: { status: 'missing' },
        data_protection: { status: 'missing' },
        availability_guarantees: { status: 'missing' },
        incident_support: { status: 'missing' },
        authority_cooperation: { status: 'missing' },
        termination_rights: { status: 'missing' },
        subcontracting_conditions: { status: 'missing' },
      },
    },
    annual_value: row.annual_value as number | null,
    total_value: row.total_value as number | null,
    currency: row.currency as string,
    document_ids: (row.document_ids as string[]) || [],
    status: row.status as Contract['status'],
    notes: row.notes as string | null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

// ============================================================================
// Create Contract
// ============================================================================

export async function createContract(
  formData: CreateContractFormData
): Promise<ActionResult<Contract>> {
  // Validate input
  const result = createContractSchema.safeParse(formData);
  if (!result.success) {
    const firstError = result.error.issues[0];
    return {
      success: false,
      error: createContractError(
        'VALIDATION_ERROR',
        firstError.message,
        firstError.path.join('.')
      ),
    };
  }

  const supabase = await createClient();

  // Get current user's organization
  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) {
    return {
      success: false,
      error: createContractError('UNAUTHORIZED', 'You must be logged in to create a contract'),
    };
  }

  const data = result.data;

  // Verify vendor ownership
  const isOwner = await verifyVendorOwnership(data.vendor_id, organizationId);
  if (!isOwner) {
    return {
      success: false,
      error: createContractError('NOT_FOUND', 'Vendor not found'),
    };
  }

  // Check for duplicate contract reference
  const { data: existingContract } = await supabase
    .from('contracts')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('contract_ref', data.contract_ref)
    .single();

  if (existingContract) {
    return {
      success: false,
      error: createContractError(
        'DUPLICATE_REF',
        'A contract with this reference already exists',
        'contract_ref'
      ),
    };
  }

  // Insert contract with default DORA provisions
  const { data: contract, error } = await supabase
    .from('contracts')
    .insert({
      organization_id: organizationId,
      vendor_id: data.vendor_id,
      contract_ref: data.contract_ref.trim(),
      contract_type: data.contract_type,
      signature_date: data.signature_date || null,
      effective_date: data.effective_date,
      expiry_date: data.expiry_date || null,
      auto_renewal: data.auto_renewal || false,
      termination_notice_days: data.termination_notice_days || null,
      annual_value: data.annual_value || null,
      total_value: data.total_value || null,
      currency: data.currency || 'EUR',
      status: 'draft',
      notes: data.notes || null,
      dora_provisions: {
        article_30_2: {
          service_description: { status: 'missing' },
          data_locations: { status: 'missing' },
          data_protection: { status: 'missing' },
          availability_guarantees: { status: 'missing' },
          incident_support: { status: 'missing' },
          authority_cooperation: { status: 'missing' },
          termination_rights: { status: 'missing' },
          subcontracting_conditions: { status: 'missing' },
        },
      },
      document_ids: [],
    })
    .select()
    .single();

  if (error) {
    console.error('Create contract error:', error);
    return {
      success: false,
      error: mapDatabaseError(error),
    };
  }

  // Log activity
  await supabase.from('activity_log').insert({
    organization_id: organizationId,
    action: 'created',
    entity_type: 'contract',
    entity_id: contract.id,
    entity_name: contract.contract_ref,
    details: { vendor_id: data.vendor_id, contract_type: contract.contract_type },
  });

  revalidatePath(`/vendors/${data.vendor_id}`);
  revalidatePath('/contracts');

  return {
    success: true,
    data: mapContractFromDatabase(contract),
  };
}

// ============================================================================
// Update Contract
// ============================================================================

export async function updateContract(
  contractId: string,
  formData: UpdateContractFormData
): Promise<ActionResult<Contract>> {
  // Validate input
  const result = updateContractSchema.safeParse(formData);
  if (!result.success) {
    const firstError = result.error.issues[0];
    return {
      success: false,
      error: createContractError(
        'VALIDATION_ERROR',
        firstError.message,
        firstError.path.join('.')
      ),
    };
  }

  const supabase = await createClient();

  // Get current user's organization
  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) {
    return {
      success: false,
      error: createContractError('UNAUTHORIZED', 'You must be logged in to update a contract'),
    };
  }

  // Get existing contract
  const { data: existingContract, error: fetchError } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', contractId)
    .eq('organization_id', organizationId)
    .single();

  if (fetchError || !existingContract) {
    return {
      success: false,
      error: createContractError('NOT_FOUND', 'Contract not found'),
    };
  }

  const data = result.data;

  // Check for duplicate contract reference if changing
  if (data.contract_ref && data.contract_ref !== existingContract.contract_ref) {
    const { data: duplicateRef } = await supabase
      .from('contracts')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('contract_ref', data.contract_ref)
      .neq('id', contractId)
      .single();

    if (duplicateRef) {
      return {
        success: false,
        error: createContractError(
          'DUPLICATE_REF',
          'A contract with this reference already exists',
          'contract_ref'
        ),
      };
    }
  }

  // Build update object
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (data.contract_ref !== undefined) updateData.contract_ref = data.contract_ref.trim();
  if (data.contract_type !== undefined) updateData.contract_type = data.contract_type;
  if (data.signature_date !== undefined) updateData.signature_date = data.signature_date;
  if (data.effective_date !== undefined) updateData.effective_date = data.effective_date;
  if (data.expiry_date !== undefined) updateData.expiry_date = data.expiry_date;
  if (data.auto_renewal !== undefined) updateData.auto_renewal = data.auto_renewal;
  if (data.termination_notice_days !== undefined) updateData.termination_notice_days = data.termination_notice_days;
  if (data.last_renewal_date !== undefined) updateData.last_renewal_date = data.last_renewal_date;
  if (data.annual_value !== undefined) updateData.annual_value = data.annual_value;
  if (data.total_value !== undefined) updateData.total_value = data.total_value;
  if (data.currency !== undefined) updateData.currency = data.currency;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.notes !== undefined) updateData.notes = data.notes;

  // Update contract
  const { data: contract, error } = await supabase
    .from('contracts')
    .update(updateData)
    .eq('id', contractId)
    .select()
    .single();

  if (error) {
    console.error('Update contract error:', error);
    return {
      success: false,
      error: mapDatabaseError(error),
    };
  }

  // Log activity
  await supabase.from('activity_log').insert({
    organization_id: organizationId,
    action: 'updated',
    entity_type: 'contract',
    entity_id: contract.id,
    entity_name: contract.contract_ref,
    details: { updated_fields: Object.keys(updateData).filter(k => k !== 'updated_at') },
  });

  revalidatePath(`/vendors/${contract.vendor_id}`);
  revalidatePath(`/contracts/${contractId}`);
  revalidatePath('/contracts');

  return {
    success: true,
    data: mapContractFromDatabase(contract),
  };
}

// ============================================================================
// Update DORA Provisions
// ============================================================================

export async function updateDoraProvisions(
  contractId: string,
  provisions: DoraProvisions
): Promise<ActionResult<Contract>> {
  const supabase = await createClient();

  // Get current user's organization
  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) {
    return {
      success: false,
      error: createContractError('UNAUTHORIZED', 'You must be logged in'),
    };
  }

  // Get existing contract
  const { data: existingContract, error: fetchError } = await supabase
    .from('contracts')
    .select('*')
    .eq('id', contractId)
    .eq('organization_id', organizationId)
    .single();

  if (fetchError || !existingContract) {
    return {
      success: false,
      error: createContractError('NOT_FOUND', 'Contract not found'),
    };
  }

  // Update provisions
  const { data: contract, error } = await supabase
    .from('contracts')
    .update({
      dora_provisions: provisions,
      updated_at: new Date().toISOString(),
    })
    .eq('id', contractId)
    .select()
    .single();

  if (error) {
    console.error('Update DORA provisions error:', error);
    return {
      success: false,
      error: mapDatabaseError(error),
    };
  }

  // Log activity
  await supabase.from('activity_log').insert({
    organization_id: organizationId,
    action: 'updated',
    entity_type: 'contract',
    entity_id: contract.id,
    entity_name: contract.contract_ref,
    details: { updated: 'dora_provisions' },
  });

  revalidatePath(`/vendors/${contract.vendor_id}`);
  revalidatePath(`/contracts/${contractId}`);

  return {
    success: true,
    data: mapContractFromDatabase(contract),
  };
}

// ============================================================================
// Delete Contract
// ============================================================================

export async function deleteContract(contractId: string): Promise<ActionResult> {
  const supabase = await createClient();

  // Get current user's organization
  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) {
    return {
      success: false,
      error: createContractError('UNAUTHORIZED', 'You must be logged in to delete a contract'),
    };
  }

  // Get existing contract
  const { data: existingContract, error: fetchError } = await supabase
    .from('contracts')
    .select('id, vendor_id, contract_ref')
    .eq('id', contractId)
    .eq('organization_id', organizationId)
    .single();

  if (fetchError || !existingContract) {
    return {
      success: false,
      error: createContractError('NOT_FOUND', 'Contract not found'),
    };
  }

  // Delete contract
  const { error } = await supabase
    .from('contracts')
    .delete()
    .eq('id', contractId);

  if (error) {
    console.error('Delete contract error:', error);
    return {
      success: false,
      error: mapDatabaseError(error),
    };
  }

  // Log activity
  await supabase.from('activity_log').insert({
    organization_id: organizationId,
    action: 'deleted',
    entity_type: 'contract',
    entity_id: contractId,
    entity_name: existingContract.contract_ref,
  });

  revalidatePath(`/vendors/${existingContract.vendor_id}`);
  revalidatePath('/contracts');

  return { success: true };
}

// ============================================================================
// Get Contracts for Vendor
// ============================================================================

export async function getVendorContracts(vendorId: string): Promise<Contract[]> {
  const supabase = await createClient();

  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) {
    return [];
  }

  // Verify vendor ownership
  const isOwner = await verifyVendorOwnership(vendorId, organizationId);
  if (!isOwner) {
    return [];
  }

  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('effective_date', { ascending: false });

  if (error) {
    console.error('Get contracts error:', error);
    return [];
  }

  return (data || []).map(mapContractFromDatabase);
}

// ============================================================================
// Get Single Contract
// ============================================================================

export async function getContract(contractId: string): Promise<ContractWithVendor | null> {
  const supabase = await createClient();

  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) {
    return null;
  }

  const { data, error } = await supabase
    .from('contracts')
    .select(`
      *,
      vendors!inner(id, name, lei, tier)
    `)
    .eq('id', contractId)
    .eq('organization_id', organizationId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    ...mapContractFromDatabase(data),
    vendor: data.vendors as ContractWithVendor['vendor'],
  };
}

// ============================================================================
// AI Clause Extraction
// ============================================================================

export interface ClauseExtractionResult {
  success: boolean;
  clausesExtracted: number;
  processingTimeMs: number;
  error?: string;
}

export async function extractContractClauses(
  contractId: string,
  documentId: string
): Promise<ClauseExtractionResult> {
  const supabase = await createClient();

  // Get current user's organization
  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) {
    return {
      success: false,
      clausesExtracted: 0,
      processingTimeMs: 0,
      error: 'You must be logged in',
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
      clausesExtracted: 0,
      processingTimeMs: 0,
      error: 'Contract not found',
    };
  }

  // Get document and download file
  const { data: document, error: docError } = await supabase
    .from('documents')
    .select('id, file_path, file_name')
    .eq('id', documentId)
    .eq('organization_id', organizationId)
    .single();

  if (docError || !document) {
    return {
      success: false,
      clausesExtracted: 0,
      processingTimeMs: 0,
      error: 'Document not found',
    };
  }

  // Download the PDF file
  const { data: fileData, error: downloadError } = await supabase
    .storage
    .from('documents')
    .download(document.file_path);

  if (downloadError || !fileData) {
    console.error('Download error:', downloadError);
    return {
      success: false,
      clausesExtracted: 0,
      processingTimeMs: 0,
      error: 'Failed to download document',
    };
  }

  // Convert blob to buffer
  const arrayBuffer = await fileData.arrayBuffer();
  const pdfBuffer = Buffer.from(arrayBuffer);

  // Get API key from environment
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      clausesExtracted: 0,
      processingTimeMs: 0,
      error: 'AI service not configured',
    };
  }

  try {
    // Import clause extractor dynamically to avoid bundling issues
    const { extractClauses, mapExtractedClauseToDb } = await import('@/lib/ai/clause-extractor');

    // Run extraction
    const result = await extractClauses({
      pdfBuffer,
      apiKey,
      contractId,
    });

    // Delete existing AI-extracted clauses for this contract
    await supabase
      .from('contract_clauses')
      .delete()
      .eq('contract_id', contractId)
      .eq('ai_extracted', true);

    // Insert new clauses
    if (result.clauses.length > 0) {
      const clausesToInsert = result.clauses.map((clause) =>
        mapExtractedClauseToDb(clause, contractId, organizationId)
      );

      const { error: insertError } = await supabase
        .from('contract_clauses')
        .insert(clausesToInsert);

      if (insertError) {
        console.error('Insert clauses error:', insertError);
        return {
          success: false,
          clausesExtracted: 0,
          processingTimeMs: result.processing_time_ms,
          error: 'Failed to save extracted clauses',
        };
      }
    }

    // Update contract with AI analysis timestamp
    await supabase
      .from('contracts')
      .update({
        ai_analyzed_at: new Date().toISOString(),
        clauses_extracted: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', contractId);

    // Log activity
    await supabase.from('activity_log').insert({
      organization_id: organizationId,
      action: 'ai_analyzed',
      entity_type: 'contract',
      entity_id: contractId,
      details: {
        clauses_extracted: result.clauses.length,
        processing_time_ms: result.processing_time_ms,
        confidence_score: result.confidence_score,
      },
    });

    revalidatePath(`/contracts/${contractId}`);
    revalidatePath('/contracts');

    return {
      success: true,
      clausesExtracted: result.clauses.length,
      processingTimeMs: result.processing_time_ms,
    };
  } catch (error) {
    console.error('Clause extraction error:', error);
    return {
      success: false,
      clausesExtracted: 0,
      processingTimeMs: 0,
      error: error instanceof Error ? error.message : 'Unknown error during extraction',
    };
  }
}

// ============================================================================
// Contract Renewals
// ============================================================================

export interface CreateRenewalData {
  contractId: string;
  renewalType: 'extension' | 'renewal' | 'amendment' | 'termination';
  previousExpiryDate: string;
  newExpiryDate?: string;
  valueChange?: number;
  valueChangePercent?: number;
  termsChanged: boolean;
  termsChangeSummary?: string;
  dueDate?: string;
}

export async function createRenewal(data: CreateRenewalData): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();

  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) {
    return {
      success: false,
      error: createContractError('UNAUTHORIZED', 'You must be logged in'),
    };
  }

  // Verify contract ownership and get current renewal count
  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select('id, vendor_id, contract_ref')
    .eq('id', data.contractId)
    .eq('organization_id', organizationId)
    .single();

  if (contractError || !contract) {
    return {
      success: false,
      error: createContractError('NOT_FOUND', 'Contract not found'),
    };
  }

  // Get next renewal number
  const { count } = await supabase
    .from('contract_renewals')
    .select('id', { count: 'exact', head: true })
    .eq('contract_id', data.contractId);

  const renewalNumber = (count || 0) + 1;

  // Create renewal record
  const { data: renewal, error } = await supabase
    .from('contract_renewals')
    .insert({
      organization_id: organizationId,
      contract_id: data.contractId,
      renewal_number: renewalNumber,
      renewal_type: data.renewalType,
      status: 'pending',
      previous_expiry_date: data.previousExpiryDate,
      new_expiry_date: data.newExpiryDate || null,
      value_change: data.valueChange || null,
      value_change_percent: data.valueChangePercent || null,
      terms_changed: data.termsChanged,
      terms_change_summary: data.termsChangeSummary || null,
      due_date: data.dueDate || null,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Create renewal error:', error);
    return {
      success: false,
      error: mapDatabaseError(error),
    };
  }

  // Log activity
  await supabase.from('activity_log').insert({
    organization_id: organizationId,
    action: 'created',
    entity_type: 'contract_renewal',
    entity_id: renewal.id,
    entity_name: `Renewal #${renewalNumber} for ${contract.contract_ref}`,
    details: { contract_id: data.contractId, renewal_type: data.renewalType },
  });

  revalidatePath(`/contracts/${data.contractId}`);
  revalidatePath('/contracts');

  return {
    success: true,
    data: { id: renewal.id },
  };
}

export async function approveRenewal(
  renewalId: string,
  notes?: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) {
    return {
      success: false,
      error: createContractError('UNAUTHORIZED', 'You must be logged in'),
    };
  }

  // Verify renewal ownership
  const { data: renewal, error: fetchError } = await supabase
    .from('contract_renewals')
    .select('id, contract_id, renewal_number, new_expiry_date')
    .eq('id', renewalId)
    .eq('organization_id', organizationId)
    .single();

  if (fetchError || !renewal) {
    return {
      success: false,
      error: createContractError('NOT_FOUND', 'Renewal not found'),
    };
  }

  // Update renewal status
  const { error: updateError } = await supabase
    .from('contract_renewals')
    .update({
      status: 'approved',
      decision_date: new Date().toISOString(),
      decision_notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', renewalId);

  if (updateError) {
    console.error('Approve renewal error:', updateError);
    return {
      success: false,
      error: mapDatabaseError(updateError),
    };
  }

  // If renewal has a new expiry date, update the contract
  if (renewal.new_expiry_date) {
    await supabase
      .from('contracts')
      .update({
        expiry_date: renewal.new_expiry_date,
        last_renewal_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', renewal.contract_id);
  }

  // Log activity
  await supabase.from('activity_log').insert({
    organization_id: organizationId,
    action: 'approved',
    entity_type: 'contract_renewal',
    entity_id: renewalId,
    entity_name: `Renewal #${renewal.renewal_number}`,
    details: { decision_notes: notes },
  });

  revalidatePath(`/contracts/${renewal.contract_id}`);
  revalidatePath('/contracts');

  return { success: true };
}

export async function rejectRenewal(
  renewalId: string,
  notes?: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) {
    return {
      success: false,
      error: createContractError('UNAUTHORIZED', 'You must be logged in'),
    };
  }

  // Verify renewal ownership
  const { data: renewal, error: fetchError } = await supabase
    .from('contract_renewals')
    .select('id, contract_id, renewal_number')
    .eq('id', renewalId)
    .eq('organization_id', organizationId)
    .single();

  if (fetchError || !renewal) {
    return {
      success: false,
      error: createContractError('NOT_FOUND', 'Renewal not found'),
    };
  }

  // Update renewal status
  const { error: updateError } = await supabase
    .from('contract_renewals')
    .update({
      status: 'rejected',
      decision_date: new Date().toISOString(),
      decision_notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', renewalId);

  if (updateError) {
    console.error('Reject renewal error:', updateError);
    return {
      success: false,
      error: mapDatabaseError(updateError),
    };
  }

  // Log activity
  await supabase.from('activity_log').insert({
    organization_id: organizationId,
    action: 'rejected',
    entity_type: 'contract_renewal',
    entity_id: renewalId,
    entity_name: `Renewal #${renewal.renewal_number}`,
    details: { decision_notes: notes },
  });

  revalidatePath(`/contracts/${renewal.contract_id}`);
  revalidatePath('/contracts');

  return { success: true };
}

export async function completeRenewal(renewalId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) {
    return {
      success: false,
      error: createContractError('UNAUTHORIZED', 'You must be logged in'),
    };
  }

  // Verify renewal ownership
  const { data: renewal, error: fetchError } = await supabase
    .from('contract_renewals')
    .select('id, contract_id, renewal_number, status')
    .eq('id', renewalId)
    .eq('organization_id', organizationId)
    .single();

  if (fetchError || !renewal) {
    return {
      success: false,
      error: createContractError('NOT_FOUND', 'Renewal not found'),
    };
  }

  if (renewal.status !== 'approved') {
    return {
      success: false,
      error: createContractError('VALIDATION_ERROR', 'Only approved renewals can be completed'),
    };
  }

  // Update renewal status
  const { error: updateError } = await supabase
    .from('contract_renewals')
    .update({
      status: 'completed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', renewalId);

  if (updateError) {
    console.error('Complete renewal error:', updateError);
    return {
      success: false,
      error: mapDatabaseError(updateError),
    };
  }

  // Log activity
  await supabase.from('activity_log').insert({
    organization_id: organizationId,
    action: 'completed',
    entity_type: 'contract_renewal',
    entity_id: renewalId,
    entity_name: `Renewal #${renewal.renewal_number}`,
  });

  revalidatePath(`/contracts/${renewal.contract_id}`);
  revalidatePath('/contracts');

  return { success: true };
}

// ============================================================================
// Contract Alerts
// ============================================================================

import type { AlertType, AlertPriority } from './types';

export interface CreateAlertData {
  contractId: string;
  alertType: AlertType;
  title: string;
  description?: string;
  priority: AlertPriority;
  triggerDate: string;
  assignedTo?: string;
}

export async function createAlert(data: CreateAlertData): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();

  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) {
    return {
      success: false,
      error: createContractError('UNAUTHORIZED', 'You must be logged in'),
    };
  }

  // Verify contract ownership
  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select('id, contract_ref')
    .eq('id', data.contractId)
    .eq('organization_id', organizationId)
    .single();

  if (contractError || !contract) {
    return {
      success: false,
      error: createContractError('NOT_FOUND', 'Contract not found'),
    };
  }

  // Create alert
  const { data: alert, error } = await supabase
    .from('contract_alerts')
    .insert({
      organization_id: organizationId,
      contract_id: data.contractId,
      alert_type: data.alertType,
      title: data.title,
      description: data.description || null,
      priority: data.priority,
      trigger_date: data.triggerDate,
      status: 'scheduled',
      assigned_to: data.assignedTo || null,
      notification_sent: false,
      email_sent: false,
      snooze_count: 0,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Create alert error:', error);
    return {
      success: false,
      error: mapDatabaseError(error),
    };
  }

  revalidatePath(`/contracts/${data.contractId}`);
  revalidatePath('/contracts');

  return {
    success: true,
    data: { id: alert.id },
  };
}

export async function acknowledgeAlert(alertId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) {
    return {
      success: false,
      error: createContractError('UNAUTHORIZED', 'You must be logged in'),
    };
  }

  const { data: user } = await supabase.auth.getUser();

  // Verify alert ownership
  const { data: alert, error: fetchError } = await supabase
    .from('contract_alerts')
    .select('id, contract_id')
    .eq('id', alertId)
    .eq('organization_id', organizationId)
    .single();

  if (fetchError || !alert) {
    return {
      success: false,
      error: createContractError('NOT_FOUND', 'Alert not found'),
    };
  }

  // Update alert
  const { error } = await supabase
    .from('contract_alerts')
    .update({
      status: 'acknowledged',
      acknowledged_by: user?.user?.id || null,
      acknowledged_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', alertId);

  if (error) {
    console.error('Acknowledge alert error:', error);
    return {
      success: false,
      error: mapDatabaseError(error),
    };
  }

  revalidatePath(`/contracts/${alert.contract_id}`);
  revalidatePath('/contracts');

  return { success: true };
}

export async function resolveAlert(
  alertId: string,
  resolutionNotes?: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) {
    return {
      success: false,
      error: createContractError('UNAUTHORIZED', 'You must be logged in'),
    };
  }

  const { data: user } = await supabase.auth.getUser();

  // Verify alert ownership
  const { data: alert, error: fetchError } = await supabase
    .from('contract_alerts')
    .select('id, contract_id')
    .eq('id', alertId)
    .eq('organization_id', organizationId)
    .single();

  if (fetchError || !alert) {
    return {
      success: false,
      error: createContractError('NOT_FOUND', 'Alert not found'),
    };
  }

  // Update alert
  const { error } = await supabase
    .from('contract_alerts')
    .update({
      status: 'resolved',
      resolved_by: user?.user?.id || null,
      resolved_at: new Date().toISOString(),
      resolution_notes: resolutionNotes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', alertId);

  if (error) {
    console.error('Resolve alert error:', error);
    return {
      success: false,
      error: mapDatabaseError(error),
    };
  }

  revalidatePath(`/contracts/${alert.contract_id}`);
  revalidatePath('/contracts');

  return { success: true };
}

export async function dismissAlert(alertId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) {
    return {
      success: false,
      error: createContractError('UNAUTHORIZED', 'You must be logged in'),
    };
  }

  // Verify alert ownership
  const { data: alert, error: fetchError } = await supabase
    .from('contract_alerts')
    .select('id, contract_id')
    .eq('id', alertId)
    .eq('organization_id', organizationId)
    .single();

  if (fetchError || !alert) {
    return {
      success: false,
      error: createContractError('NOT_FOUND', 'Alert not found'),
    };
  }

  // Update alert
  const { error } = await supabase
    .from('contract_alerts')
    .update({
      status: 'dismissed',
      updated_at: new Date().toISOString(),
    })
    .eq('id', alertId);

  if (error) {
    console.error('Dismiss alert error:', error);
    return {
      success: false,
      error: mapDatabaseError(error),
    };
  }

  revalidatePath(`/contracts/${alert.contract_id}`);
  revalidatePath('/contracts');

  return { success: true };
}

export async function snoozeAlert(
  alertId: string,
  snoozeDays: number
): Promise<ActionResult> {
  const supabase = await createClient();

  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) {
    return {
      success: false,
      error: createContractError('UNAUTHORIZED', 'You must be logged in'),
    };
  }

  // Verify alert ownership
  const { data: alert, error: fetchError } = await supabase
    .from('contract_alerts')
    .select('id, contract_id, snooze_count')
    .eq('id', alertId)
    .eq('organization_id', organizationId)
    .single();

  if (fetchError || !alert) {
    return {
      success: false,
      error: createContractError('NOT_FOUND', 'Alert not found'),
    };
  }

  // Calculate snooze until date
  const snoozeUntil = new Date();
  snoozeUntil.setDate(snoozeUntil.getDate() + snoozeDays);

  // Update alert
  const { error } = await supabase
    .from('contract_alerts')
    .update({
      status: 'snoozed',
      snoozed_until: snoozeUntil.toISOString(),
      snooze_count: (alert.snooze_count || 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', alertId);

  if (error) {
    console.error('Snooze alert error:', error);
    return {
      success: false,
      error: mapDatabaseError(error),
    };
  }

  revalidatePath(`/contracts/${alert.contract_id}`);
  revalidatePath('/contracts');

  return { success: true };
}

// ============================================================================
// Generate Expiry Alerts (for cron job)
// ============================================================================

/**
 * Generate expiry alerts for contracts approaching their expiry date
 * This function should be called by a scheduled job (cron)
 */
export async function generateExpiryAlerts(organizationId: string): Promise<{
  success: boolean;
  alertsCreated: number;
  error?: string;
}> {
  const supabase = await createClient();

  const today = new Date();
  const alertThresholds = [
    { days: 90, type: 'expiry_90_days' as AlertType, priority: 'low' as AlertPriority },
    { days: 60, type: 'expiry_60_days' as AlertType, priority: 'medium' as AlertPriority },
    { days: 30, type: 'expiry_30_days' as AlertType, priority: 'high' as AlertPriority },
    { days: 14, type: 'expiry_14_days' as AlertType, priority: 'high' as AlertPriority },
    { days: 7, type: 'expiry_7_days' as AlertType, priority: 'critical' as AlertPriority },
  ];

  let alertsCreated = 0;

  try {
    for (const threshold of alertThresholds) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + threshold.days);
      const targetDateStr = targetDate.toISOString().split('T')[0];

      // Find contracts expiring on the target date
      const { data: contracts, error: queryError } = await supabase
        .from('contracts')
        .select('id, contract_ref, vendor_id, vendors!inner(name)')
        .eq('organization_id', organizationId)
        .eq('expiry_date', targetDateStr)
        .in('status', ['active', 'expiring']);

      if (queryError) {
        console.error('Query contracts error:', queryError);
        continue;
      }

      for (const contract of contracts || []) {
        // Check if alert already exists
        const { data: existingAlert } = await supabase
          .from('contract_alerts')
          .select('id')
          .eq('contract_id', contract.id)
          .eq('alert_type', threshold.type)
          .single();

        if (existingAlert) {
          continue; // Alert already exists
        }

        const vendorName = (contract.vendors as unknown as { name: string }).name;

        // Create the alert
        const { error: insertError } = await supabase
          .from('contract_alerts')
          .insert({
            organization_id: organizationId,
            contract_id: contract.id,
            alert_type: threshold.type,
            title: `Contract expires in ${threshold.days} days`,
            description: `Contract "${contract.contract_ref}" with ${vendorName} expires on ${targetDateStr}`,
            priority: threshold.priority,
            trigger_date: today.toISOString().split('T')[0],
            status: 'triggered',
            triggered_at: new Date().toISOString(),
            notification_sent: false,
            email_sent: false,
            snooze_count: 0,
          });

        if (insertError) {
          console.error('Insert alert error:', insertError);
          continue;
        }

        alertsCreated++;
      }
    }

    // Also check for auto-renewal notice deadlines
    const { data: autoRenewalContracts } = await supabase
      .from('contracts')
      .select('id, contract_ref, expiry_date, termination_notice_days, vendors!inner(name)')
      .eq('organization_id', organizationId)
      .eq('auto_renewal', true)
      .not('termination_notice_days', 'is', null)
      .not('expiry_date', 'is', null)
      .in('status', ['active', 'expiring']);

    for (const contract of autoRenewalContracts || []) {
      if (!contract.expiry_date || !contract.termination_notice_days) continue;

      const expiryDate = new Date(contract.expiry_date);
      const noticeDeadline = new Date(expiryDate);
      noticeDeadline.setDate(noticeDeadline.getDate() - contract.termination_notice_days);

      const daysUntilNotice = Math.ceil(
        (noticeDeadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Create alert if notice deadline is within 14 days
      if (daysUntilNotice >= 0 && daysUntilNotice <= 14) {
        // Check if alert already exists
        const { data: existingAlert } = await supabase
          .from('contract_alerts')
          .select('id')
          .eq('contract_id', contract.id)
          .eq('alert_type', 'auto_renewal_notice')
          .single();

        if (existingAlert) continue;

        const vendorName = (contract.vendors as unknown as { name: string }).name;

        const { error: insertError } = await supabase
          .from('contract_alerts')
          .insert({
            organization_id: organizationId,
            contract_id: contract.id,
            alert_type: 'auto_renewal_notice',
            title: `Termination notice deadline in ${daysUntilNotice} days`,
            description: `Contract "${contract.contract_ref}" with ${vendorName} will auto-renew unless terminated by ${noticeDeadline.toISOString().split('T')[0]}`,
            priority: daysUntilNotice <= 7 ? 'critical' : 'high',
            trigger_date: today.toISOString().split('T')[0],
            status: 'triggered',
            triggered_at: new Date().toISOString(),
            notification_sent: false,
            email_sent: false,
            snooze_count: 0,
          });

        if (!insertError) {
          alertsCreated++;
        }
      }
    }

    return {
      success: true,
      alertsCreated,
    };
  } catch (error) {
    console.error('Generate expiry alerts error:', error);
    return {
      success: false,
      alertsCreated,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
