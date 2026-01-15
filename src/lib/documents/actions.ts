'use server';

/**
 * Document Server Actions
 * Server-side actions for document CRUD operations
 */

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import {
  createDocumentSchema,
  updateDocumentSchema,
  type UpdateDocumentFormData,
} from './schemas';
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
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from './types';
import {
  createAppError,
  mapDatabaseError as mapBaseDatabaseError,
  type AppError,
  type DocumentErrorCode,
} from '@/lib/errors';
import { getCurrentUserOrganization, getCurrentUserId } from '@/lib/auth/organization';

// ============================================================================
// Types
// ============================================================================

export type { DocumentErrorCode } from '@/lib/errors';

export type DocumentError = AppError<DocumentErrorCode>;

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: DocumentError;
}

// ============================================================================
// Helper Functions
// ============================================================================

function createDocumentError(
  code: DocumentErrorCode,
  message: string,
  field?: string
): DocumentError {
  return createAppError(code, message, field);
}

function mapDatabaseError(error: { message: string; code?: string }): DocumentError {
  return mapBaseDatabaseError<DocumentErrorCode>(error, 'DATABASE_ERROR');
}

/**
 * Generate a unique storage path for a document
 */
function generateStoragePath(
  organizationId: string,
  vendorId: string | null,
  filename: string
): string {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');

  if (vendorId) {
    return `${organizationId}/${vendorId}/${timestamp}-${randomId}-${safeFilename}`;
  }
  return `${organizationId}/general/${timestamp}-${randomId}-${safeFilename}`;
}

// ============================================================================
// Upload Document
// ============================================================================

export async function uploadDocument(
  formData: FormData
): Promise<ActionResult<Document>> {
  const supabase = await createClient();

  // Get current user's organization
  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) {
    return {
      success: false,
      error: createDocumentError('UNAUTHORIZED', 'You must be logged in to upload documents'),
    };
  }

  const userId = await getCurrentUserId();

  // Extract form data
  const file = formData.get('file') as File | null;
  const type = formData.get('type') as string;
  const vendorId = formData.get('vendor_id') as string | null;
  const metadataStr = formData.get('metadata') as string | null;

  // Validate file
  if (!file) {
    return {
      success: false,
      error: createDocumentError('VALIDATION_ERROR', 'No file provided', 'file'),
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: createDocumentError(
        'FILE_TOO_LARGE',
        `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
        'file'
      ),
    };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.type as typeof ALLOWED_MIME_TYPES[number])) {
    return {
      success: false,
      error: createDocumentError(
        'INVALID_FILE_TYPE',
        'File type not allowed. Supported formats: PDF, Word, Excel, Images, Text, CSV',
        'file'
      ),
    };
  }

  // Validate other fields
  const validationResult = createDocumentSchema.safeParse({
    vendor_id: vendorId || null,
    type,
    metadata: metadataStr ? JSON.parse(metadataStr) : {},
  });

  if (!validationResult.success) {
    const firstError = validationResult.error.issues[0];
    return {
      success: false,
      error: createDocumentError(
        'VALIDATION_ERROR',
        firstError.message,
        firstError.path.join('.')
      ),
    };
  }

  const data = validationResult.data;

  // Verify vendor belongs to organization if provided
  if (data.vendor_id) {
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('id', data.vendor_id)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .single();

    if (vendorError || !vendor) {
      return {
        success: false,
        error: createDocumentError('VALIDATION_ERROR', 'Vendor not found', 'vendor_id'),
      };
    }
  }

  // Generate storage path
  const storagePath = generateStoragePath(organizationId, data.vendor_id || null, file.name);

  // Use service role client for storage operations (bypasses RLS)
  const storageClient = createServiceRoleClient();

  // Upload file to storage
  const { error: uploadError } = await storageClient.storage
    .from('documents')
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    return {
      success: false,
      error: createDocumentError('UPLOAD_ERROR', `Failed to upload file: ${uploadError.message}`),
    };
  }

  // Create database record
  const { data: document, error: dbError } = await supabase
    .from('documents')
    .insert({
      organization_id: organizationId,
      vendor_id: data.vendor_id || null,
      type: data.type,
      filename: file.name,
      storage_path: storagePath,
      file_size: file.size,
      mime_type: file.type,
      parsing_status: 'pending',
      metadata: {
        ...data.metadata,
        uploaded_by: userId,
      },
    })
    .select()
    .single();

  if (dbError) {
    // Try to clean up uploaded file using service role client
    await storageClient.storage.from('documents').remove([storagePath]);

    console.error('Database error:', dbError);
    return {
      success: false,
      error: mapDatabaseError(dbError),
    };
  }

  // Log activity
  await supabase.from('activity_log').insert({
    organization_id: organizationId,
    user_id: userId,
    action: 'uploaded',
    entity_type: 'document',
    entity_id: document.id,
    entity_name: file.name,
    details: { type: data.type, vendor_id: data.vendor_id, file_size: file.size },
  });

  revalidatePath('/documents');
  if (data.vendor_id) {
    revalidatePath(`/vendors/${data.vendor_id}`);
  }
  revalidatePath('/dashboard');

  return {
    success: true,
    data: mapDocumentFromDatabase(document),
  };
}

// ============================================================================
// Update Document
// ============================================================================

export async function updateDocument(
  documentId: string,
  formData: UpdateDocumentFormData
): Promise<ActionResult<Document>> {
  // Validate input
  const result = updateDocumentSchema.safeParse(formData);
  if (!result.success) {
    const firstError = result.error.issues[0];
    return {
      success: false,
      error: createDocumentError(
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
      error: createDocumentError('UNAUTHORIZED', 'You must be logged in to update documents'),
    };
  }

  // Check document exists and belongs to organization
  const { data: existingDoc, error: fetchError } = await supabase
    .from('documents')
    .select('id, filename, metadata')
    .eq('id', documentId)
    .eq('organization_id', organizationId)
    .single();

  if (fetchError || !existingDoc) {
    return {
      success: false,
      error: createDocumentError('NOT_FOUND', 'Document not found'),
    };
  }

  const data = result.data;

  // Build update object
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (data.type !== undefined) updateData.type = data.type;
  if (data.metadata !== undefined) {
    updateData.metadata = {
      ...existingDoc.metadata,
      ...data.metadata,
    };
  }

  // Update document
  const { data: document, error } = await supabase
    .from('documents')
    .update(updateData)
    .eq('id', documentId)
    .select()
    .single();

  if (error) {
    console.error('Update document error:', error);
    return {
      success: false,
      error: mapDatabaseError(error),
    };
  }

  // Log activity
  await supabase.from('activity_log').insert({
    organization_id: organizationId,
    action: 'updated',
    entity_type: 'document',
    entity_id: document.id,
    entity_name: document.filename,
    details: { updated_fields: Object.keys(updateData).filter(k => k !== 'updated_at') },
  });

  revalidatePath('/documents');
  revalidatePath(`/documents/${documentId}`);
  if (document.vendor_id) {
    revalidatePath(`/vendors/${document.vendor_id}`);
  }

  return {
    success: true,
    data: mapDocumentFromDatabase(document),
  };
}

// ============================================================================
// Delete Document
// ============================================================================

export async function deleteDocument(documentId: string): Promise<ActionResult> {
  const supabase = await createClient();

  // Get current user's organization
  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) {
    return {
      success: false,
      error: createDocumentError('UNAUTHORIZED', 'You must be logged in to delete documents'),
    };
  }

  // Check document exists
  const { data: existingDoc, error: fetchError } = await supabase
    .from('documents')
    .select('id, filename, storage_path, vendor_id')
    .eq('id', documentId)
    .eq('organization_id', organizationId)
    .single();

  if (fetchError || !existingDoc) {
    return {
      success: false,
      error: createDocumentError('NOT_FOUND', 'Document not found'),
    };
  }

  // Delete from storage using service role client (bypasses RLS)
  const storageClient = createServiceRoleClient();
  const { error: storageError } = await storageClient.storage
    .from('documents')
    .remove([existingDoc.storage_path]);

  if (storageError) {
    console.error('Storage delete error:', storageError);
    // Continue with database deletion even if storage fails
  }

  // Delete from database
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId);

  if (error) {
    console.error('Delete document error:', error);
    return {
      success: false,
      error: mapDatabaseError(error),
    };
  }

  // Log activity
  await supabase.from('activity_log').insert({
    organization_id: organizationId,
    action: 'deleted',
    entity_type: 'document',
    entity_id: documentId,
    entity_name: existingDoc.filename,
  });

  revalidatePath('/documents');
  if (existingDoc.vendor_id) {
    revalidatePath(`/vendors/${existingDoc.vendor_id}`);
  }
  revalidatePath('/dashboard');

  return { success: true };
}

// ============================================================================
// Get Document Download URL
// ============================================================================

export async function getDocumentDownloadUrl(
  documentId: string
): Promise<ActionResult<{ url: string; filename: string }>> {
  const supabase = await createClient();

  // Get current user's organization
  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) {
    return {
      success: false,
      error: createDocumentError('UNAUTHORIZED', 'You must be logged in to download documents'),
    };
  }

  // Get document
  const { data: document, error: fetchError } = await supabase
    .from('documents')
    .select('storage_path, filename')
    .eq('id', documentId)
    .eq('organization_id', organizationId)
    .single();

  if (fetchError || !document) {
    return {
      success: false,
      error: createDocumentError('NOT_FOUND', 'Document not found'),
    };
  }

  // Create signed URL (valid for 1 hour) using service role client (bypasses RLS)
  const storageClient = createServiceRoleClient();
  const { data: signedUrl, error: urlError } = await storageClient.storage
    .from('documents')
    .createSignedUrl(document.storage_path, 3600, {
      download: document.filename,
    });

  if (urlError || !signedUrl) {
    console.error('Signed URL error:', urlError);
    return {
      success: false,
      error: createDocumentError('STORAGE_ERROR', 'Failed to generate download URL'),
    };
  }

  return {
    success: true,
    data: {
      url: signedUrl.signedUrl,
      filename: document.filename,
    },
  };
}

// ============================================================================
// Fetch Documents Action (for client components)
// ============================================================================

interface FetchDocumentsOptions {
  filters?: DocumentFilters;
  sort?: DocumentSortOptions;
  pagination?: PaginationOptions;
}

export async function fetchDocumentsAction(
  options: FetchDocumentsOptions = {}
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
  if (sort.field === 'valid_until') {
    query = query.order('metadata->valid_until', { ascending: sortOrder, nullsFirst: false });
  } else {
    query = query.order(sort.field, { ascending: sortOrder });
  }

  // Apply pagination
  const from = (pagination.page - 1) * pagination.limit;
  const to = from + pagination.limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    console.error('Fetch documents error:', error);
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

  // Get counts
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
    const expiryDate = doc.metadata?.valid_until || doc.metadata?.expiry_date;
    if (expiryDate) {
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
// Get Documents for Vendor
// ============================================================================

export async function getDocumentsForVendor(
  vendorId: string
): Promise<Document[]> {
  const supabase = await createClient();

  const organizationId = await getCurrentUserOrganization();
  if (!organizationId) {
    return [];
  }

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
// Database Mapping Helpers
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
