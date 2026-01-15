/**
 * Document Queries
 * Server-side queries for fetching documents
 */

import { createClient } from '@/lib/supabase/server';
import { getCurrentUserOrganization } from '@/lib/auth/organization';
import type {
  Document,
  DocumentWithVendor,
  DocumentFilters,
  DocumentSortOptions,
  PaginationOptions,
  PaginatedResult,
  DocumentStats,
  DocumentType,
  ParsingStatus,
} from './types';

// ============================================================================
// Helper Functions
// ============================================================================

function mapDocumentFromDatabase(row: Record<string, unknown>): Document {
  return {
    id: row.id as string,
    organization_id: row.organization_id as string,
    vendor_id: row.vendor_id as string | null,
    type: row.type as Document['type'],
    filename: row.filename as string,
    storage_path: row.storage_path as string,
    file_size: row.file_size as number,
    mime_type: row.mime_type as string,
    parsing_status: row.parsing_status as Document['parsing_status'],
    parsing_error: row.parsing_error as string | null,
    parsed_at: row.parsed_at as string | null,
    parsing_confidence: row.parsing_confidence as number | null,
    metadata: (row.metadata as Document['metadata']) || {},
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

function mapDocumentWithVendorFromDatabase(row: Record<string, unknown>): DocumentWithVendor {
  const doc = mapDocumentFromDatabase(row);
  return {
    ...doc,
    vendor: row.vendor as DocumentWithVendor['vendor'],
  };
}

// ============================================================================
// Get Single Document
// ============================================================================

export async function getDocument(documentId: string): Promise<Document | null> {
  const supabase = await createClient();

  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) return null;

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .eq('organization_id', organizationId)
    .single();

  if (error || !data) {
    return null;
  }

  return mapDocumentFromDatabase(data);
}

export async function getDocumentWithVendor(documentId: string): Promise<DocumentWithVendor | null> {
  console.log('[getDocumentWithVendor] Called with documentId:', documentId);
  const supabase = await createClient();

  // Get auth user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  console.log('[getDocumentWithVendor] auth.getUser result:', {
    hasUser: !!user,
    userId: user?.id,
    email: user?.email,
    error: authError?.message
  });

  if (!user) {
    console.log('[getDocumentWithVendor] No user from auth.getUser - trying session fallback');
    // Try getting session as fallback
    const { data: sessionData } = await supabase.auth.getSession();
    console.log('[getDocumentWithVendor] session fallback:', {
      hasSession: !!sessionData?.session,
      hasUser: !!sessionData?.session?.user,
      userId: sessionData?.session?.user?.id
    });

    if (!sessionData?.session?.user) {
      console.log('[getDocumentWithVendor] No user - returning null');
      return null;
    }
  }

  const userId = user?.id;
  if (!userId) {
    return null;
  }

  // Use service role to bypass RLS for user lookup
  const { createServiceRoleClient } = await import('@/lib/supabase/service-role');
  const serviceClient = createServiceRoleClient();

  const { data: userData, error: userError } = await serviceClient
    .from('users')
    .select('organization_id')
    .eq('id', userId)
    .single();

  console.log('[getDocumentWithVendor] userData (service role):', userData?.organization_id, userError?.message);

  const organizationId = userData?.organization_id;
  if (!organizationId) {
    console.log('[getDocumentWithVendor] No organizationId - returning null');
    return null;
  }

  // Use service role for document lookup too (bypass RLS)
  const { data, error } = await serviceClient
    .from('documents')
    .select(`
      *,
      vendor:vendors!documents_vendor_id_fkey(id, name, tier)
    `)
    .eq('id', documentId)
    .eq('organization_id', organizationId)
    .single();

  console.log('[getDocumentWithVendor] Document query result (service role):', data?.id, error?.message);

  if (error || !data) {
    console.log('[getDocumentWithVendor] No data - returning null');
    return null;
  }

  return mapDocumentWithVendorFromDatabase(data);
}

// ============================================================================
// Get Documents List
// ============================================================================

interface GetDocumentsOptions {
  filters?: DocumentFilters;
  sort?: DocumentSortOptions;
  pagination?: PaginationOptions;
}

export async function getDocuments(
  options: GetDocumentsOptions = {}
): Promise<PaginatedResult<DocumentWithVendor>> {
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
    .from('documents')
    .select(`
      *,
      vendor:vendors!documents_vendor_id_fkey(id, name, tier)
    `, { count: 'exact' })
    .eq('organization_id', organizationId);

  // Apply filters
  if (filters.search) {
    query = query.ilike('filename', `%${filters.search}%`);
  }

  if (filters.type && filters.type.length > 0) {
    query = query.in('type', filters.type);
  }

  if (filters.vendor_id) {
    query = query.eq('vendor_id', filters.vendor_id);
  }

  if (filters.parsing_status && filters.parsing_status.length > 0) {
    query = query.in('parsing_status', filters.parsing_status);
  }

  if (filters.uploaded_after) {
    query = query.gte('created_at', filters.uploaded_after);
  }

  if (filters.uploaded_before) {
    query = query.lte('created_at', filters.uploaded_before);
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
    console.error('Get documents error:', error);
    return { data: [], total: 0, page: pagination.page, limit: pagination.limit, total_pages: 0 };
  }

  const total = count || 0;
  const totalPages = Math.ceil(total / pagination.limit);

  return {
    data: (data || []).map(mapDocumentWithVendorFromDatabase),
    total,
    page: pagination.page,
    limit: pagination.limit,
    total_pages: totalPages,
  };
}

// ============================================================================
// Get Documents for Vendor
// ============================================================================

export async function getVendorDocuments(vendorId: string): Promise<Document[]> {
  const supabase = await createClient();

  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) return [];

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Get vendor documents error:', error);
    return [];
  }

  return (data || []).map(mapDocumentFromDatabase);
}

// ============================================================================
// Get Document Stats
// ============================================================================

export async function getDocumentStats(): Promise<DocumentStats> {
  const supabase = await createClient();

  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) {
    return {
      total: 0,
      by_type: { soc2: 0, iso27001: 0, pentest: 0, contract: 0, other: 0 },
      by_status: { pending: 0, processing: 0, completed: 0, failed: 0 },
      expiring_soon: 0,
      expired: 0,
    };
  }

  const { data: documents, error } = await supabase
    .from('documents')
    .select('type, parsing_status, metadata')
    .eq('organization_id', organizationId);

  if (error || !documents) {
    console.error('Get document stats error:', error);
    return {
      total: 0,
      by_type: { soc2: 0, iso27001: 0, pentest: 0, contract: 0, other: 0 },
      by_status: { pending: 0, processing: 0, completed: 0, failed: 0 },
      expiring_soon: 0,
      expired: 0,
    };
  }

  const now = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const stats: DocumentStats = {
    total: documents.length,
    by_type: { soc2: 0, iso27001: 0, pentest: 0, contract: 0, other: 0 },
    by_status: { pending: 0, processing: 0, completed: 0, failed: 0 },
    expiring_soon: 0,
    expired: 0,
  };

  for (const doc of documents) {
    // Count by type
    if (doc.type in stats.by_type) {
      stats.by_type[doc.type as DocumentType]++;
    }

    // Count by status
    if (doc.parsing_status in stats.by_status) {
      stats.by_status[doc.parsing_status as ParsingStatus]++;
    }

    // Check expiry
    const metadata = doc.metadata as Record<string, unknown> | null;
    const expiryDate = metadata?.valid_until || metadata?.expiry_date;
    if (expiryDate && typeof expiryDate === 'string') {
      const expiry = new Date(expiryDate);
      if (expiry < now) {
        stats.expired++;
      } else if (expiry <= thirtyDaysFromNow) {
        stats.expiring_soon++;
      }
    }
  }

  return stats;
}

// ============================================================================
// Get Recent Documents
// ============================================================================

export async function getRecentDocuments(limit: number = 5): Promise<DocumentWithVendor[]> {
  const supabase = await createClient();

  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) return [];

  const { data, error } = await supabase
    .from('documents')
    .select(`
      *,
      vendor:vendors!documents_vendor_id_fkey(id, name, tier)
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Get recent documents error:', error);
    return [];
  }

  return (data || []).map(mapDocumentWithVendorFromDatabase);
}

// ============================================================================
// Get Expiring Documents
// ============================================================================

export async function getExpiringDocuments(days: number = 30): Promise<DocumentWithVendor[]> {
  const supabase = await createClient();

  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) return [];

  const now = new Date();
  const threshold = new Date();
  threshold.setDate(threshold.getDate() + days);

  // Fetch all documents and filter in code since JSONB date comparison is complex
  const { data, error } = await supabase
    .from('documents')
    .select(`
      *,
      vendor:vendors!documents_vendor_id_fkey(id, name, tier)
    `)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Get expiring documents error:', error);
    return [];
  }

  const expiring = (data || []).filter((doc) => {
    const metadata = doc.metadata as Record<string, unknown> | null;
    const expiryDate = metadata?.valid_until || metadata?.expiry_date;
    if (!expiryDate || typeof expiryDate !== 'string') return false;

    const expiry = new Date(expiryDate);
    return expiry >= now && expiry <= threshold;
  });

  return expiring.map(mapDocumentWithVendorFromDatabase);
}

// ============================================================================
// Get Document Count for Vendor
// ============================================================================

export async function getVendorDocumentCount(vendorId: string): Promise<number> {
  const supabase = await createClient();

  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) return 0;

  const { count, error } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('vendor_id', vendorId);

  if (error) {
    console.error('Get vendor document count error:', error);
    return 0;
  }

  return count || 0;
}
