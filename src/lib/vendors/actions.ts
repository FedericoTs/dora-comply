'use server';

/**
 * Vendor Server Actions
 * Server-side actions for vendor CRUD operations
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  createVendorSchema,
  updateVendorSchema,
  type CreateVendorFormData,
  type UpdateVendorFormData,
} from './schemas';
import type {
  Vendor,
  VendorWithRelations,
  VendorFilters,
  VendorSortOptions,
  PaginationOptions,
  PaginatedResult,
  GLEIFEnrichedEntity,
} from './types';
import { lookupLEIEnriched } from '@/lib/external/gleif';
import {
  calculateVendorRiskScore,
  calculateBatchRiskScores,
  getRiskDistribution,
  type RiskScoreInput,
  type RiskScoreResult,
} from './risk-scoring';

// ============================================================================
// Types
// ============================================================================

export type VendorErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'DUPLICATE_LEI'
  | 'DATABASE_ERROR'
  | 'UNKNOWN_ERROR';

export interface VendorError {
  code: VendorErrorCode;
  message: string;
  field?: string;
}

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: VendorError;
  /** Indicates vendor was auto-added to RoI B_05.01 (ICT Providers) */
  roiPopulated?: boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

function createVendorError(
  code: VendorErrorCode,
  message: string,
  field?: string
): VendorError {
  return { code, message, field };
}

function mapDatabaseError(error: { message: string; code?: string }): VendorError {
  const message = error.message.toLowerCase();

  if (message.includes('duplicate') || message.includes('unique')) {
    if (message.includes('lei')) {
      return createVendorError('DUPLICATE_LEI', 'A vendor with this LEI already exists');
    }
    return createVendorError('DATABASE_ERROR', 'A record with this value already exists');
  }

  if (message.includes('foreign key') || message.includes('violates')) {
    return createVendorError('DATABASE_ERROR', 'Invalid reference to related record');
  }

  if (message.includes('permission') || message.includes('policy')) {
    return createVendorError('UNAUTHORIZED', 'You do not have permission to perform this action');
  }

  return createVendorError('DATABASE_ERROR', error.message);
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

/**
 * Build enrichment data from GLEIF entity for database insert
 */
function buildGLEIFEnrichmentData(gleifEntity: GLEIFEnrichedEntity): Record<string, unknown> {
  return {
    // Auto-populated from GLEIF
    name: gleifEntity.legalName,
    headquarters_country: gleifEntity.headquartersAddress?.country || gleifEntity.legalAddress.country,
    jurisdiction: gleifEntity.jurisdiction || null,
    registration_number: gleifEntity.registeredAs || null,

    // LEI verification data
    lei_status: gleifEntity.registrationStatus,
    lei_verified_at: new Date().toISOString(),
    lei_next_renewal: gleifEntity.nextRenewalDate || null,
    entity_status: gleifEntity.entityStatus || null,
    registration_authority_id: gleifEntity.registeredAt || null,
    legal_form_code: gleifEntity.legalFormCode || null,
    entity_creation_date: gleifEntity.entityCreationDate || null,

    // Full addresses
    legal_address: gleifEntity.legalAddress,
    headquarters_address: gleifEntity.headquartersAddress || null,

    // Parent companies (from Level 2)
    direct_parent_lei: gleifEntity.directParent?.lei || null,
    direct_parent_name: gleifEntity.directParent?.legalName || null,
    direct_parent_country: gleifEntity.directParent?.country || null,
    ultimate_parent_lei: gleifEntity.ultimateParent?.lei || null,
    ultimate_parent_name: gleifEntity.ultimateParent?.legalName || null,
    ultimate_parent_country: gleifEntity.ultimateParent?.country || null,
    parent_exception_reason: gleifEntity.parentException || null,

    // Cache full GLEIF response
    gleif_data: gleifEntity,
    gleif_fetched_at: new Date().toISOString(),
  };
}

// ============================================================================
// Create Vendor
// ============================================================================

export async function createVendor(
  formData: CreateVendorFormData
): Promise<ActionResult<Vendor>> {
  // Validate input
  const result = createVendorSchema.safeParse(formData);
  if (!result.success) {
    const firstError = result.error.issues[0];
    return {
      success: false,
      error: createVendorError(
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
      error: createVendorError('UNAUTHORIZED', 'You must be logged in to create a vendor'),
    };
  }

  const data = result.data;

  // Check for duplicate LEI if provided
  if (data.lei) {
    const { data: existingVendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('lei', data.lei.toUpperCase())
      .is('deleted_at', null)
      .single();

    if (existingVendor) {
      return {
        success: false,
        error: createVendorError('DUPLICATE_LEI', 'A vendor with this LEI already exists in your organization', 'lei'),
      };
    }
  }

  // Fetch GLEIF enrichment data if LEI provided
  let gleifEnrichment: Record<string, unknown> = {};
  if (data.lei) {
    try {
      const gleifEntity = await lookupLEIEnriched(data.lei.toUpperCase());
      if (gleifEntity) {
        gleifEnrichment = buildGLEIFEnrichmentData(gleifEntity);
      }
    } catch (error) {
      console.warn('GLEIF enrichment failed:', error);
      // Continue without enrichment - not a blocking error
    }
  }

  // Build insert data - merge user input with GLEIF enrichment
  // User input takes precedence for fields they explicitly provided
  const insertData = {
    organization_id: organizationId,
    // Use GLEIF name if available, otherwise user input
    name: (gleifEnrichment.name as string) || data.name.trim(),
    lei: data.lei?.toUpperCase() || null,
    tier: data.tier,
    status: 'pending' as const, // New vendors start as pending
    provider_type: data.provider_type || null,
    // Use GLEIF headquarters country if available
    headquarters_country: (gleifEnrichment.headquarters_country as string) || data.headquarters_country?.toUpperCase() || null,
    jurisdiction: (gleifEnrichment.jurisdiction as string) || null,
    service_types: data.service_types || [],
    supports_critical_function: data.supports_critical_function || false,
    critical_functions: data.critical_functions || [],
    is_intra_group: data.is_intra_group || false,
    primary_contact: data.primary_contact || {},
    notes: data.notes || null,
    // Default expense_currency to EUR for RoI B_05.01 completeness
    expense_currency: 'EUR',
    metadata: {},
    // GLEIF enrichment fields
    registration_number: gleifEnrichment.registration_number || null,
    lei_status: gleifEnrichment.lei_status || null,
    lei_verified_at: gleifEnrichment.lei_verified_at || null,
    lei_next_renewal: gleifEnrichment.lei_next_renewal || null,
    entity_status: gleifEnrichment.entity_status || null,
    registration_authority_id: gleifEnrichment.registration_authority_id || null,
    legal_form_code: gleifEnrichment.legal_form_code || null,
    entity_creation_date: gleifEnrichment.entity_creation_date || null,
    legal_address: gleifEnrichment.legal_address || {},
    headquarters_address: gleifEnrichment.headquarters_address || {},
    // Parent company data (Level 2)
    direct_parent_lei: gleifEnrichment.direct_parent_lei || null,
    direct_parent_name: gleifEnrichment.direct_parent_name || null,
    direct_parent_country: gleifEnrichment.direct_parent_country || null,
    ultimate_parent_lei: gleifEnrichment.ultimate_parent_lei || null,
    ultimate_parent_name: gleifEnrichment.ultimate_parent_name || null,
    ultimate_parent_country: gleifEnrichment.ultimate_parent_country || null,
    parent_exception_reason: gleifEnrichment.parent_exception_reason || null,
    // Cache full GLEIF response
    gleif_data: gleifEnrichment.gleif_data || {},
    gleif_fetched_at: gleifEnrichment.gleif_fetched_at || null,
  };

  // Insert vendor
  const { data: vendor, error } = await supabase
    .from('vendors')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('Create vendor error:', error);
    return {
      success: false,
      error: mapDatabaseError(error),
    };
  }

  // Log activity
  await supabase.from('activity_log').insert({
    organization_id: organizationId,
    action: 'created',
    entity_type: 'vendor',
    entity_id: vendor.id,
    entity_name: vendor.name,
    details: { tier: vendor.tier, lei: vendor.lei },
  });

  revalidatePath('/vendors');
  revalidatePath('/dashboard');
  revalidatePath('/roi'); // RoI dashboard will show updated vendor count

  // Vendor with LEI and headquarters_country will appear in RoI B_05.01
  const roiPopulated = !!(vendor.lei && vendor.headquarters_country);

  return {
    success: true,
    data: mapVendorFromDatabase(vendor),
    roiPopulated,
  };
}

// ============================================================================
// Update Vendor
// ============================================================================

export async function updateVendor(
  vendorId: string,
  formData: UpdateVendorFormData
): Promise<ActionResult<Vendor>> {
  // Validate input
  const result = updateVendorSchema.safeParse(formData);
  if (!result.success) {
    const firstError = result.error.issues[0];
    return {
      success: false,
      error: createVendorError(
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
      error: createVendorError('UNAUTHORIZED', 'You must be logged in to update a vendor'),
    };
  }

  // Check vendor exists and belongs to organization
  const { data: existingVendor, error: fetchError } = await supabase
    .from('vendors')
    .select('id, name, lei')
    .eq('id', vendorId)
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .single();

  if (fetchError || !existingVendor) {
    return {
      success: false,
      error: createVendorError('NOT_FOUND', 'Vendor not found'),
    };
  }

  const data = result.data;

  // Check for duplicate LEI if being changed
  if (data.lei && data.lei !== existingVendor.lei) {
    const { data: duplicateLei } = await supabase
      .from('vendors')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('lei', data.lei.toUpperCase())
      .neq('id', vendorId)
      .is('deleted_at', null)
      .single();

    if (duplicateLei) {
      return {
        success: false,
        error: createVendorError('DUPLICATE_LEI', 'Another vendor with this LEI already exists', 'lei'),
      };
    }
  }

  // Build update object (only include fields that were provided)
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.lei !== undefined) updateData.lei = data.lei?.toUpperCase() || null;
  if (data.tier !== undefined) updateData.tier = data.tier;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.provider_type !== undefined) updateData.provider_type = data.provider_type;
  if (data.headquarters_country !== undefined) {
    updateData.headquarters_country = data.headquarters_country?.toUpperCase() || null;
  }
  if (data.jurisdiction !== undefined) updateData.jurisdiction = data.jurisdiction;
  if (data.service_types !== undefined) updateData.service_types = data.service_types;
  if (data.supports_critical_function !== undefined) {
    updateData.supports_critical_function = data.supports_critical_function;
  }
  if (data.critical_functions !== undefined) updateData.critical_functions = data.critical_functions;
  if (data.is_intra_group !== undefined) updateData.is_intra_group = data.is_intra_group;
  if (data.primary_contact !== undefined) updateData.primary_contact = data.primary_contact;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.metadata !== undefined) updateData.metadata = data.metadata;

  // Update vendor
  const { data: vendor, error } = await supabase
    .from('vendors')
    .update(updateData)
    .eq('id', vendorId)
    .select()
    .single();

  if (error) {
    console.error('Update vendor error:', error);
    return {
      success: false,
      error: mapDatabaseError(error),
    };
  }

  // Log activity
  await supabase.from('activity_log').insert({
    organization_id: organizationId,
    action: 'updated',
    entity_type: 'vendor',
    entity_id: vendor.id,
    entity_name: vendor.name,
    details: { updated_fields: Object.keys(updateData).filter(k => k !== 'updated_at') },
  });

  revalidatePath('/vendors');
  revalidatePath(`/vendors/${vendorId}`);
  revalidatePath('/dashboard');

  return {
    success: true,
    data: mapVendorFromDatabase(vendor),
  };
}

// ============================================================================
// Delete Vendor (Soft Delete)
// ============================================================================

export async function deleteVendor(vendorId: string): Promise<ActionResult> {
  const supabase = await createClient();

  // Get current user's organization
  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) {
    return {
      success: false,
      error: createVendorError('UNAUTHORIZED', 'You must be logged in to delete a vendor'),
    };
  }

  // Use the SECURITY DEFINER function to perform soft delete
  // This bypasses RLS issues while maintaining authorization checks
  const { data, error } = await supabase.rpc('soft_delete_vendor', {
    p_vendor_id: vendorId,
  });

  if (error) {
    console.error('Delete vendor error:', error);
    return {
      success: false,
      error: mapDatabaseError(error),
    };
  }

  // Check the function result
  const result = data as { success: boolean; error?: string; vendor_name?: string };
  if (!result.success) {
    return {
      success: false,
      error: createVendorError(
        result.error === 'Vendor not found' ? 'NOT_FOUND' : 'UNAUTHORIZED',
        result.error || 'Failed to delete vendor'
      ),
    };
  }

  // Log activity
  await supabase.from('activity_log').insert({
    organization_id: organizationId,
    action: 'deleted',
    entity_type: 'vendor',
    entity_id: vendorId,
    entity_name: result.vendor_name || 'Unknown',
  });

  revalidatePath('/vendors');
  revalidatePath('/dashboard');

  return { success: true };
}

// ============================================================================
// Restore Vendor
// ============================================================================

export async function restoreVendor(vendorId: string): Promise<ActionResult<Vendor>> {
  const supabase = await createClient();

  // Get current user's organization
  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) {
    return {
      success: false,
      error: createVendorError('UNAUTHORIZED', 'You must be logged in to restore a vendor'),
    };
  }

  // Check vendor exists (including soft-deleted)
  const { data: existingVendor, error: fetchError } = await supabase
    .from('vendors')
    .select('id, name, deleted_at')
    .eq('id', vendorId)
    .eq('organization_id', organizationId)
    .single();

  if (fetchError || !existingVendor) {
    return {
      success: false,
      error: createVendorError('NOT_FOUND', 'Vendor not found'),
    };
  }

  if (!existingVendor.deleted_at) {
    return {
      success: false,
      error: createVendorError('VALIDATION_ERROR', 'Vendor is not deleted'),
    };
  }

  // Restore
  const { data: vendor, error } = await supabase
    .from('vendors')
    .update({
      deleted_at: null,
      status: 'pending',
      updated_at: new Date().toISOString(),
    })
    .eq('id', vendorId)
    .select()
    .single();

  if (error) {
    console.error('Restore vendor error:', error);
    return {
      success: false,
      error: mapDatabaseError(error),
    };
  }

  // Log activity
  await supabase.from('activity_log').insert({
    organization_id: organizationId,
    action: 'restored',
    entity_type: 'vendor',
    entity_id: vendorId,
    entity_name: vendor.name,
  });

  revalidatePath('/vendors');
  revalidatePath('/dashboard');

  return {
    success: true,
    data: mapVendorFromDatabase(vendor),
  };
}

// ============================================================================
// Update Vendor Status
// ============================================================================

export async function updateVendorStatus(
  vendorId: string,
  status: 'active' | 'pending' | 'inactive' | 'offboarding'
): Promise<ActionResult<Vendor>> {
  return updateVendor(vendorId, { status });
}

// ============================================================================
// Bulk Delete Vendors
// ============================================================================

export async function bulkDeleteVendors(
  vendorIds: string[]
): Promise<ActionResult<{ deleted: number; failed: number }>> {
  if (vendorIds.length === 0) {
    return {
      success: false,
      error: createVendorError('VALIDATION_ERROR', 'No vendors specified'),
    };
  }

  const supabase = await createClient();

  // Get current user's organization
  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) {
    return {
      success: false,
      error: createVendorError('UNAUTHORIZED', 'You must be logged in'),
    };
  }

  // Soft delete all matching vendors
  const { data: deletedVendors, error } = await supabase
    .from('vendors')
    .update({
      deleted_at: new Date().toISOString(),
      status: 'inactive',
    })
    .eq('organization_id', organizationId)
    .in('id', vendorIds)
    .is('deleted_at', null)
    .select('id, name');

  if (error) {
    console.error('Bulk delete error:', error);
    return {
      success: false,
      error: mapDatabaseError(error),
    };
  }

  const deletedCount = deletedVendors?.length || 0;

  // Log activity
  if (deletedCount > 0) {
    await supabase.from('activity_log').insert({
      organization_id: organizationId,
      action: 'bulk_deleted',
      entity_type: 'vendor',
      details: {
        count: deletedCount,
        vendor_ids: deletedVendors?.map(v => v.id),
      },
    });
  }

  revalidatePath('/vendors');
  revalidatePath('/dashboard');

  return {
    success: true,
    data: {
      deleted: deletedCount,
      failed: vendorIds.length - deletedCount,
    },
  };
}

// ============================================================================
// Fetch Vendors Action (for client components)
// ============================================================================

interface FetchVendorsOptions {
  filters?: VendorFilters;
  sort?: VendorSortOptions;
  pagination?: PaginationOptions;
}

export async function fetchVendorsAction(
  options: FetchVendorsOptions = {}
): Promise<PaginatedResult<Vendor>> {
  const supabase = await createClient();

  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) {
    return { data: [], total: 0, page: 1, limit: 20, total_pages: 0 };
  }

  const {
    filters = {},
    sort = { field: 'created_at', direction: 'desc' },
    pagination = { page: 1, limit: 20 },
  } = options;

  // Build query
  let query = supabase
    .from('vendors')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId)
    .is('deleted_at', null);

  // Apply filters
  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,lei.ilike.%${filters.search}%`);
  }

  if (filters.tier && filters.tier.length > 0) {
    query = query.in('tier', filters.tier);
  }

  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }

  if (filters.provider_type && filters.provider_type.length > 0) {
    query = query.in('provider_type', filters.provider_type);
  }

  if (filters.has_lei !== undefined) {
    if (filters.has_lei) {
      query = query.not('lei', 'is', null);
    } else {
      query = query.is('lei', null);
    }
  }

  if (filters.supports_critical_function !== undefined) {
    query = query.eq('supports_critical_function', filters.supports_critical_function);
  }

  if (filters.risk_min !== undefined) {
    query = query.gte('risk_score', filters.risk_min);
  }

  if (filters.risk_max !== undefined) {
    query = query.lte('risk_score', filters.risk_max);
  }

  // Apply sorting
  const sortOrder = sort.direction === 'asc';
  query = query.order(sort.field, { ascending: sortOrder });

  // Apply pagination
  const from = (pagination.page - 1) * pagination.limit;
  const to = from + pagination.limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error('Fetch vendors error:', error);
    return { data: [], total: 0, page: pagination.page, limit: pagination.limit, total_pages: 0 };
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / pagination.limit);

  return {
    data: (data || []).map(mapVendorFromDatabase),
    total,
    page: pagination.page,
    limit: pagination.limit,
    total_pages: totalPages,
  };
}

// ============================================================================
// Refresh Vendor GLEIF Data
// ============================================================================

/**
 * Refresh vendor's GLEIF data from the API
 * Use this to update vendor info or if parent company data was missing
 */
export async function refreshVendorGLEIF(vendorId: string): Promise<ActionResult<Vendor>> {
  const supabase = await createClient();

  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) {
    return {
      success: false,
      error: createVendorError('UNAUTHORIZED', 'You must be logged in'),
    };
  }

  // Get vendor and check LEI exists
  const { data: existingVendor, error: fetchError } = await supabase
    .from('vendors')
    .select('id, lei')
    .eq('id', vendorId)
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .single();

  if (fetchError || !existingVendor) {
    return {
      success: false,
      error: createVendorError('NOT_FOUND', 'Vendor not found'),
    };
  }

  if (!existingVendor.lei) {
    return {
      success: false,
      error: createVendorError('VALIDATION_ERROR', 'Vendor has no LEI to refresh'),
    };
  }

  // Fetch fresh GLEIF data
  const gleifEntity = await lookupLEIEnriched(existingVendor.lei);
  if (!gleifEntity) {
    return {
      success: false,
      error: createVendorError('VALIDATION_ERROR', 'LEI not found in GLEIF database'),
    };
  }

  const enrichmentData = buildGLEIFEnrichmentData(gleifEntity);

  // Update vendor with fresh GLEIF data
  const { data: vendor, error } = await supabase
    .from('vendors')
    .update({
      ...enrichmentData,
      updated_at: new Date().toISOString(),
    })
    .eq('id', vendorId)
    .select()
    .single();

  if (error) {
    console.error('Refresh GLEIF error:', error);
    return {
      success: false,
      error: mapDatabaseError(error),
    };
  }

  // Log activity
  await supabase.from('activity_log').insert({
    organization_id: organizationId,
    action: 'refreshed_gleif',
    entity_type: 'vendor',
    entity_id: vendorId,
    entity_name: vendor.name,
    details: {
      lei: existingVendor.lei,
      has_parent: !!gleifEntity.ultimateParent,
    },
  });

  revalidatePath('/vendors');
  revalidatePath(`/vendors/${vendorId}`);

  return {
    success: true,
    data: mapVendorFromDatabase(vendor),
  };
}

// ============================================================================
// Calculate & Update Vendor Risk Score
// ============================================================================

/**
 * Calculate risk score for a single vendor and save to database
 */
export async function calculateAndSaveRiskScore(
  vendorId: string
): Promise<ActionResult<RiskScoreResult>> {
  const supabase = await createClient();

  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) {
    return {
      success: false,
      error: createVendorError('UNAUTHORIZED', 'You must be logged in'),
    };
  }

  // Fetch vendor with all data needed for risk calculation
  const { data: vendor, error: vendorError } = await supabase
    .from('vendors')
    .select('*')
    .eq('id', vendorId)
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .single();

  if (vendorError || !vendor) {
    return {
      success: false,
      error: createVendorError('NOT_FOUND', 'Vendor not found'),
    };
  }

  // Fetch additional data for risk calculation
  const [doraComplianceResult, documentsResult, concentrationResult] = await Promise.all([
    // DORA compliance data
    supabase
      .from('vendor_dora_compliance')
      .select('overall_maturity_level, overall_percentage')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    // Documents (SOC2 reports)
    supabase
      .from('documents')
      .select('id, type, metadata')
      .eq('vendor_id', vendorId)
      .eq('organization_id', organizationId)
      .is('deleted_at', null),
    // Concentration alerts
    supabase
      .from('concentration_alerts')
      .select('id')
      .eq('organization_id', organizationId)
      .contains('affected_vendors', [vendorId]),
  ]);

  // Prepare input for risk calculation
  const hasSOC2 = documentsResult.data?.some(d => d.type === 'soc2') ?? false;
  const soc2Doc = documentsResult.data?.find(d => d.type === 'soc2');
  const soc2Metadata = soc2Doc?.metadata as { opinion?: string; exception_count?: number } | null;

  // Check if vendor is SPOF (simplified check - full check would query concentration analysis)
  const isSPOF = vendor.supports_critical_function &&
    vendor.substitutability_assessment === 'not_substitutable';

  const input: RiskScoreInput = {
    vendor: mapVendorFromDatabase(vendor),
    doraMaturityLevel: doraComplianceResult.data?.overall_maturity_level ?? null,
    doraCompliancePercentage: doraComplianceResult.data?.overall_percentage ?? null,
    hasSOC2Report: hasSOC2,
    soc2Opinion: soc2Metadata?.opinion as RiskScoreInput['soc2Opinion'],
    soc2ExceptionCount: soc2Metadata?.exception_count,
    concentrationAlertCount: concentrationResult.data?.length ?? 0,
    isSinglePointOfFailure: isSPOF,
  };

  // Calculate risk score
  const result = calculateVendorRiskScore(input);

  // Update vendor with new risk score
  const { error: updateError } = await supabase
    .from('vendors')
    .update({
      risk_score: result.totalScore,
      last_assessment_date: new Date().toISOString(),
      metadata: {
        ...vendor.metadata,
        risk_breakdown: result.components,
        risk_recommendations: result.recommendations,
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', vendorId);

  if (updateError) {
    console.error('Update risk score error:', updateError);
    return {
      success: false,
      error: mapDatabaseError(updateError),
    };
  }

  // Log activity
  await supabase.from('activity_log').insert({
    organization_id: organizationId,
    action: 'risk_score_calculated',
    entity_type: 'vendor',
    entity_id: vendorId,
    entity_name: vendor.name,
    details: {
      previous_score: vendor.risk_score,
      new_score: result.totalScore,
      risk_level: result.riskLevel,
    },
  });

  revalidatePath('/vendors');
  revalidatePath(`/vendors/${vendorId}`);
  revalidatePath('/dashboard');

  return {
    success: true,
    data: result,
  };
}

/**
 * Calculate risk scores for all vendors in organization
 */
export async function calculateAllVendorRiskScores(): Promise<ActionResult<{
  updated: number;
  distribution: ReturnType<typeof getRiskDistribution>;
}>> {
  const supabase = await createClient();

  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) {
    return {
      success: false,
      error: createVendorError('UNAUTHORIZED', 'You must be logged in'),
    };
  }

  // Fetch all active vendors
  const { data: vendors, error: vendorsError } = await supabase
    .from('vendors')
    .select('*')
    .eq('organization_id', organizationId)
    .is('deleted_at', null);

  if (vendorsError || !vendors) {
    return {
      success: false,
      error: mapDatabaseError(vendorsError || { message: 'Failed to fetch vendors' }),
    };
  }

  if (vendors.length === 0) {
    return {
      success: true,
      data: {
        updated: 0,
        distribution: { low: 0, medium: 0, high: 0, critical: 0, average: 0 },
      },
    };
  }

  // Fetch additional data in batch
  const vendorIds = vendors.map(v => v.id);

  const [doraResults, docsResults] = await Promise.all([
    supabase
      .from('vendor_dora_compliance')
      .select('vendor_id, overall_maturity_level, overall_percentage')
      .in('vendor_id', vendorIds),
    supabase
      .from('documents')
      .select('vendor_id, type, metadata')
      .in('vendor_id', vendorIds)
      .eq('organization_id', organizationId)
      .is('deleted_at', null),
  ]);

  // Build additional data map
  const additionalData = new Map<string, Partial<Omit<RiskScoreInput, 'vendor'>>>();

  for (const vendor of vendors) {
    const doraData = doraResults.data?.find(d => d.vendor_id === vendor.id);
    const vendorDocs = docsResults.data?.filter(d => d.vendor_id === vendor.id) || [];
    const soc2Doc = vendorDocs.find(d => d.type === 'soc2');
    const soc2Metadata = soc2Doc?.metadata as { opinion?: string; exception_count?: number } | null;

    additionalData.set(vendor.id, {
      doraMaturityLevel: doraData?.overall_maturity_level ?? null,
      doraCompliancePercentage: doraData?.overall_percentage ?? null,
      hasSOC2Report: vendorDocs.some(d => d.type === 'soc2'),
      soc2Opinion: soc2Metadata?.opinion as RiskScoreInput['soc2Opinion'],
      soc2ExceptionCount: soc2Metadata?.exception_count,
    });
  }

  // Calculate all scores
  const mappedVendors = vendors.map(mapVendorFromDatabase);
  const results = calculateBatchRiskScores(mappedVendors, additionalData);
  const distribution = getRiskDistribution(results);

  // Update all vendors in database
  let updated = 0;
  for (const vendor of vendors) {
    const result = results.get(vendor.id);
    if (!result) continue;

    const { error } = await supabase
      .from('vendors')
      .update({
        risk_score: result.totalScore,
        last_assessment_date: new Date().toISOString(),
        metadata: {
          ...vendor.metadata,
          risk_breakdown: result.components,
          risk_recommendations: result.recommendations,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', vendor.id);

    if (!error) updated++;
  }

  // Log activity
  await supabase.from('activity_log').insert({
    organization_id: organizationId,
    action: 'bulk_risk_score_calculated',
    entity_type: 'vendor',
    entity_id: null,
    entity_name: 'All vendors',
    details: {
      vendors_updated: updated,
      distribution,
    },
  });

  revalidatePath('/vendors');
  revalidatePath('/dashboard');

  return {
    success: true,
    data: { updated, distribution },
  };
}

/**
 * Get risk score breakdown for a vendor (without recalculating)
 */
export async function getVendorRiskBreakdown(
  vendorId: string
): Promise<ActionResult<RiskScoreResult | null>> {
  const supabase = await createClient();

  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) {
    return {
      success: false,
      error: createVendorError('UNAUTHORIZED', 'You must be logged in'),
    };
  }

  const { data: vendor, error } = await supabase
    .from('vendors')
    .select('risk_score, last_assessment_date, metadata')
    .eq('id', vendorId)
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .single();

  if (error || !vendor) {
    return {
      success: false,
      error: createVendorError('NOT_FOUND', 'Vendor not found'),
    };
  }

  // Extract cached breakdown from metadata
  const metadata = vendor.metadata as {
    risk_breakdown?: RiskScoreResult['components'];
    risk_recommendations?: string[];
  } | null;

  if (!metadata?.risk_breakdown || vendor.risk_score === null) {
    return {
      success: true,
      data: null, // No cached breakdown, need to calculate
    };
  }

  // Reconstruct result from cached data
  const riskLevel = vendor.risk_score <= 30 ? 'low' :
    vendor.risk_score <= 60 ? 'medium' :
    vendor.risk_score <= 80 ? 'high' : 'critical';

  return {
    success: true,
    data: {
      totalScore: vendor.risk_score,
      riskLevel,
      components: metadata.risk_breakdown,
      recommendations: metadata.risk_recommendations || [],
      lastCalculated: vendor.last_assessment_date || new Date().toISOString(),
    },
  };
}

// ============================================================================
// Database Mapping Helper
// ============================================================================

function mapVendorFromDatabase(row: Record<string, unknown>): Vendor {
  return {
    id: row.id as string,
    organization_id: row.organization_id as string,
    name: row.name as string,
    lei: row.lei as string | null,
    tier: row.tier as Vendor['tier'],
    status: row.status as Vendor['status'],
    provider_type: row.provider_type as Vendor['provider_type'],
    headquarters_country: row.headquarters_country as string | null,
    jurisdiction: row.jurisdiction as string | null,
    service_types: (row.service_types as string[]) || [],
    supports_critical_function: row.supports_critical_function as boolean,
    critical_functions: (row.critical_functions as string[]) || [],
    is_intra_group: row.is_intra_group as boolean,
    parent_provider_id: row.parent_provider_id as string | null,
    registration_number: row.registration_number as string | null,
    regulatory_authorizations: (row.regulatory_authorizations as string[]) || [],
    // ESA/DORA B_05.01 fields
    ultimate_parent_lei: row.ultimate_parent_lei as string | null,
    ultimate_parent_name: row.ultimate_parent_name as string | null,
    esa_register_id: row.esa_register_id as string | null,
    substitutability_assessment: row.substitutability_assessment as Vendor['substitutability_assessment'],
    total_annual_expense: row.total_annual_expense as number | null,
    expense_currency: row.expense_currency as string | null,
    // LEI verification fields
    lei_status: row.lei_status as Vendor['lei_status'],
    lei_verified_at: row.lei_verified_at as string | null,
    lei_next_renewal: row.lei_next_renewal as string | null,
    entity_status: row.entity_status as Vendor['entity_status'],
    registration_authority_id: row.registration_authority_id as string | null,
    legal_form_code: row.legal_form_code as string | null,
    legal_address: row.legal_address as Vendor['legal_address'],
    headquarters_address: row.headquarters_address as Vendor['headquarters_address'],
    entity_creation_date: row.entity_creation_date as string | null,
    gleif_data: row.gleif_data as Record<string, unknown> | null,
    gleif_fetched_at: row.gleif_fetched_at as string | null,
    // Risk
    risk_score: row.risk_score as number | null,
    last_assessment_date: row.last_assessment_date as string | null,
    primary_contact: (row.primary_contact as Vendor['primary_contact']) || { name: '' },
    notes: row.notes as string | null,
    metadata: (row.metadata as Record<string, unknown>) || {},
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    deleted_at: row.deleted_at as string | null,
  };
}
