/**
 * Vendor Data Fetching Queries
 *
 * Server-side data fetching functions for vendors.
 * These are designed for use in Server Components.
 */

import { createClient } from '@/lib/supabase/server';
import { getCurrentUserOrganization } from '@/lib/auth/organization';
import type {
  Vendor,
  VendorWithRelations,
  VendorFilters,
  VendorSortOptions,
  PaginationOptions,
  PaginatedResult,
  VendorStats,
} from './types';

// ============================================================================
// Types
// ============================================================================

interface QueryOptions {
  filters?: VendorFilters;
  sort?: VendorSortOptions;
  pagination?: PaginationOptions;
  includeDeleted?: boolean;
}

// ============================================================================
// Helper Functions
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
    risk_score: row.risk_score as number | null,
    last_assessment_date: row.last_assessment_date as string | null,
    primary_contact: (row.primary_contact as Vendor['primary_contact']) || { name: '' },
    notes: row.notes as string | null,
    metadata: (row.metadata as Record<string, unknown>) || {},
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    deleted_at: row.deleted_at as string | null,

    // LEI Enrichment Fields (GLEIF API)
    lei_status: row.lei_status as Vendor['lei_status'],
    lei_verified_at: row.lei_verified_at as string | null,
    lei_next_renewal: row.lei_next_renewal as string | null,
    entity_status: row.entity_status as Vendor['entity_status'],
    registration_authority_id: row.registration_authority_id as string | null,
    legal_form_code: row.legal_form_code as string | null,
    entity_creation_date: row.entity_creation_date as string | null,
    legal_address: row.legal_address as Vendor['legal_address'],
    headquarters_address: row.headquarters_address as Vendor['headquarters_address'],
    gleif_data: row.gleif_data as Record<string, unknown> | null,
    gleif_fetched_at: row.gleif_fetched_at as string | null,

    // Parent Company Fields (GLEIF Level 2)
    direct_parent_lei: row.direct_parent_lei as string | null,
    direct_parent_name: row.direct_parent_name as string | null,
    direct_parent_country: row.direct_parent_country as string | null,
    ultimate_parent_lei: row.ultimate_parent_lei as string | null,
    ultimate_parent_name: row.ultimate_parent_name as string | null,
    ultimate_parent_country: row.ultimate_parent_country as string | null,

    // ESA Fields
    esa_register_id: row.esa_register_id as string | null,
    substitutability_assessment: row.substitutability_assessment as Vendor['substitutability_assessment'],
    total_annual_expense: row.total_annual_expense as number | null,
    expense_currency: row.expense_currency as string | null,
  };
}

// ============================================================================
// Get Vendors List (Paginated)
// ============================================================================

export async function getVendors(
  options: QueryOptions = {}
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
    includeDeleted = false,
  } = options;

  // Build query
  // Note: Framework filtering via vendor_gap_analysis removed - table was never populated
  // Future: Use vendor_framework_compliance for framework-based filtering
  let query = supabase
    .from('vendors')
    .select('*', { count: 'exact' })
    .eq('organization_id', organizationId);

  // Exclude soft-deleted unless requested
  if (!includeDeleted) {
    query = query.is('deleted_at', null);
  }

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
  const sortOrder = sort.direction === 'asc' ? true : false;
  query = query.order(sort.field, { ascending: sortOrder });

  // Apply pagination
  const from = (pagination.page - 1) * pagination.limit;
  const to = from + pagination.limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error('Get vendors error:', error);
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
// Get Single Vendor
// ============================================================================

export async function getVendor(vendorId: string): Promise<Vendor | null> {
  const supabase = await createClient();

  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) {
    return null;
  }

  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('id', vendorId)
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .single();

  if (error || !data) {
    return null;
  }

  return mapVendorFromDatabase(data);
}

// ============================================================================
// Get Vendor With Relations
// ============================================================================

export async function getVendorWithRelations(
  vendorId: string
): Promise<VendorWithRelations | null> {
  const supabase = await createClient();

  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) {
    return null;
  }

  // Fetch vendor
  const { data: vendor, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('id', vendorId)
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .single();

  if (error || !vendor) {
    return null;
  }

  // Fetch related data in parallel
  const [contactsResult, contractsResult, countsResult] = await Promise.all([
    // Contacts
    supabase
      .from('vendor_contacts')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: true }),

    // Contracts
    supabase
      .from('contracts')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('effective_date', { ascending: false }),

    // Counts
    Promise.all([
      supabase
        .from('documents')
        .select('id', { count: 'exact', head: true })
        .eq('vendor_id', vendorId),
      supabase
        .from('contracts')
        .select('id', { count: 'exact', head: true })
        .eq('vendor_id', vendorId),
      supabase
        .from('ict_services')
        .select('id', { count: 'exact', head: true })
        .eq('vendor_id', vendorId),
      // Check if any document has parsed SOC 2 data
      supabase
        .from('documents')
        .select('id, parsed_soc2!inner(id)')
        .eq('vendor_id', vendorId)
        .limit(1),
    ]),
  ]);

  const baseVendor = mapVendorFromDatabase(vendor);

  return {
    ...baseVendor,
    contacts: contactsResult.data || [],
    contracts: contractsResult.data?.map(c => ({
      id: c.id,
      organization_id: c.organization_id,
      vendor_id: c.vendor_id,
      contract_ref: c.contract_ref,
      contract_type: c.contract_type,
      signature_date: c.signature_date,
      effective_date: c.effective_date,
      expiry_date: c.expiry_date,
      auto_renewal: c.auto_renewal,
      termination_notice_days: c.termination_notice_days,
      last_renewal_date: c.last_renewal_date,
      dora_provisions: c.dora_provisions || {
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
      annual_value: c.annual_value,
      total_value: c.total_value,
      currency: c.currency,
      document_ids: c.document_ids || [],
      status: c.status,
      notes: c.notes,
      created_at: c.created_at,
      updated_at: c.updated_at,
    })) || [],
    documents_count: countsResult[0].count || 0,
    contracts_count: countsResult[1].count || 0,
    services_count: countsResult[2].count || 0,
    has_parsed_soc2: (countsResult[3].data?.length || 0) > 0,
  };
}

// ============================================================================
// Get Vendor Stats
// ============================================================================

export async function getVendorStats(): Promise<VendorStats> {
  const supabase = await createClient();

  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) {
    return {
      total: 0,
      by_tier: { critical: 0, important: 0, standard: 0 },
      by_status: { active: 0, pending: 0, inactive: 0, offboarding: 0 },
      by_risk: { critical: 0, high: 0, medium: 0, low: 0 },
      pending_reviews: 0,
      roi_ready_percentage: 0,
      avg_risk_score: null,
    };
  }

  // Get all vendors for stats
  const { data: vendors, error } = await supabase
    .from('vendors')
    .select('tier, status, risk_score, lei, supports_critical_function')
    .eq('organization_id', organizationId)
    .is('deleted_at', null);

  if (error || !vendors) {
    return {
      total: 0,
      by_tier: { critical: 0, important: 0, standard: 0 },
      by_status: { active: 0, pending: 0, inactive: 0, offboarding: 0 },
      by_risk: { critical: 0, high: 0, medium: 0, low: 0 },
      pending_reviews: 0,
      roi_ready_percentage: 0,
      avg_risk_score: null,
    };
  }

  // Calculate stats
  const total = vendors.length;

  const byTier = {
    critical: vendors.filter(v => v.tier === 'critical').length,
    important: vendors.filter(v => v.tier === 'important').length,
    standard: vendors.filter(v => v.tier === 'standard').length,
  };

  const byStatus = {
    active: vendors.filter(v => v.status === 'active').length,
    pending: vendors.filter(v => v.status === 'pending').length,
    inactive: vendors.filter(v => v.status === 'inactive').length,
    offboarding: vendors.filter(v => v.status === 'offboarding').length,
  };

  // Risk breakdown (based on RISK_THRESHOLDS: critical 81-100, high 61-80, medium 31-60, low 0-30)
  const byRisk = {
    critical: vendors.filter(v => (v.risk_score ?? 0) >= 81).length,
    high: vendors.filter(v => (v.risk_score ?? 0) >= 61 && (v.risk_score ?? 0) < 81).length,
    medium: vendors.filter(v => (v.risk_score ?? 0) >= 31 && (v.risk_score ?? 0) < 61).length,
    low: vendors.filter(v => (v.risk_score ?? 0) < 31 || v.risk_score === null).length,
  };

  // Pending reviews = critical/important vendors without recent assessment
  const pendingReviews = vendors.filter(v =>
    (v.tier === 'critical' || v.tier === 'important') && v.status === 'pending'
  ).length;

  // RoI ready = has LEI + is active
  const roiReady = vendors.filter(v => v.lei && v.status === 'active').length;
  const roiReadyPercentage = total > 0 ? Math.round((roiReady / total) * 100) : 0;

  // Average risk score (only for vendors with scores)
  const vendorsWithRisk = vendors.filter(v => v.risk_score !== null);
  const avgRiskScore = vendorsWithRisk.length > 0
    ? Math.round(vendorsWithRisk.reduce((sum, v) => sum + (v.risk_score || 0), 0) / vendorsWithRisk.length)
    : null;

  return {
    total,
    by_tier: byTier,
    by_status: byStatus,
    by_risk: byRisk,
    pending_reviews: pendingReviews,
    roi_ready_percentage: roiReadyPercentage,
    avg_risk_score: avgRiskScore,
  };
}

// ============================================================================
// Get Recent Vendors
// ============================================================================

export async function getRecentVendors(limit: number = 5): Promise<Vendor[]> {
  const result = await getVendors({
    sort: { field: 'created_at', direction: 'desc' },
    pagination: { page: 1, limit },
  });

  return result.data;
}

// ============================================================================
// Get Critical Vendors
// ============================================================================

export async function getCriticalVendors(): Promise<Vendor[]> {
  const result = await getVendors({
    filters: { tier: ['critical'] },
    sort: { field: 'name', direction: 'asc' },
    pagination: { page: 1, limit: 100 },
  });

  return result.data;
}

// ============================================================================
// Get Vendors Needing Review
// ============================================================================

export async function getVendorsNeedingReview(): Promise<Vendor[]> {
  const result = await getVendors({
    filters: {
      tier: ['critical', 'important'],
      status: ['pending'],
    },
    sort: { field: 'created_at', direction: 'asc' },
    pagination: { page: 1, limit: 50 },
  });

  return result.data;
}

// ============================================================================
// Search Vendors (Lightweight)
// ============================================================================

export async function searchVendors(
  query: string,
  limit: number = 10
): Promise<Pick<Vendor, 'id' | 'name' | 'lei' | 'tier' | 'status'>[]> {
  if (!query || query.length < 2) {
    return [];
  }

  const supabase = await createClient();

  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) {
    return [];
  }

  const { data, error } = await supabase
    .from('vendors')
    .select('id, name, lei, tier, status')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .or(`name.ilike.%${query}%,lei.ilike.%${query}%`)
    .order('name', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Search vendors error:', error);
    return [];
  }

  return data || [];
}

// ============================================================================
// Check Vendor Exists by LEI
// ============================================================================

export async function checkVendorExistsByLei(lei: string): Promise<boolean> {
  if (!lei) return false;

  const supabase = await createClient();

  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) {
    return false;
  }

  const { data, error } = await supabase
    .from('vendors')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('lei', lei.toUpperCase())
    .is('deleted_at', null)
    .single();

  return !error && !!data;
}

// ============================================================================
// Get Vendors for Export (RoI)
// ============================================================================

export async function getVendorsForExport(): Promise<VendorWithRelations[]> {
  const supabase = await createClient();

  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) {
    return [];
  }

  // Get all active vendors with their relations
  const { data: vendors, error } = await supabase
    .from('vendors')
    .select(`
      *,
      vendor_contacts (*),
      contracts (id, contract_ref, effective_date, expiry_date, status),
      ict_services (id, service_name, service_type, criticality_level)
    `)
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .is('deleted_at', null)
    .order('name', { ascending: true });

  if (error || !vendors) {
    console.error('Get vendors for export error:', error);
    return [];
  }

  return vendors.map(v => ({
    ...mapVendorFromDatabase(v),
    contacts: v.vendor_contacts || [],
    contracts_count: v.contracts?.length || 0,
    services_count: v.ict_services?.length || 0,
  }));
}
