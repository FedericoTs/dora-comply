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

// ============================================================================
// Types
// ============================================================================

export type ContractErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'DUPLICATE_REF'
  | 'DATABASE_ERROR'
  | 'UNKNOWN_ERROR';

export interface ContractError {
  code: ContractErrorCode;
  message: string;
  field?: string;
}

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
  return { code, message, field };
}

function mapDatabaseError(error: { message: string; code?: string }): ContractError {
  const message = error.message.toLowerCase();

  if (message.includes('duplicate') || message.includes('unique')) {
    return createContractError('DUPLICATE_REF', 'A contract with this reference already exists');
  }

  if (message.includes('foreign key') || message.includes('violates')) {
    return createContractError('DATABASE_ERROR', 'Invalid vendor reference');
  }

  if (message.includes('permission') || message.includes('policy')) {
    return createContractError('UNAUTHORIZED', 'You do not have permission to perform this action');
  }

  return createContractError('DATABASE_ERROR', error.message);
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
