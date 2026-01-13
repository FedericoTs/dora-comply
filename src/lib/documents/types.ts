/**
 * Document Management Types
 *
 * These types align with the database schema defined in:
 * - 001_initial_schema.sql (documents table)
 */

// ============================================
// ENUMS
// ============================================

export type DocumentType = 'soc2' | 'iso27001' | 'pentest' | 'contract' | 'other';

export type ParsingStatus = 'pending' | 'processing' | 'completed' | 'failed';

// ============================================
// CORE TYPES
// ============================================

export interface Document {
  id: string;
  organization_id: string;
  vendor_id: string | null;

  // Document info
  type: DocumentType;
  filename: string;
  storage_path: string;
  file_size: number;
  mime_type: string;

  // AI Parsing (Phase 2)
  parsing_status: ParsingStatus;
  parsing_error: string | null;
  parsed_at: string | null;
  parsing_confidence: number | null;

  // Metadata
  metadata: DocumentMetadata;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface DocumentMetadata {
  // Document validity
  valid_from?: string;
  valid_until?: string;
  expiry_date?: string;

  // SOC 2 specific
  soc2_type?: '1' | '2';
  report_period_start?: string;
  report_period_end?: string;
  auditor_name?: string;

  // ISO 27001 specific
  certification_body?: string;
  certificate_number?: string;

  // Pentest specific
  tester_company?: string;
  test_date?: string;
  scope?: string;
  findings_count?: number;
  critical_findings?: number;

  // Contract specific
  contract_start?: string;
  contract_end?: string;
  renewal_type?: 'auto' | 'manual' | 'none';

  // General
  description?: string;
  version?: string;
  tags?: string[];
  uploaded_by?: string;

  // Custom fields
  [key: string]: unknown;
}

// ============================================
// AGGREGATED TYPES
// ============================================

export interface DocumentWithVendor extends Document {
  vendor?: {
    id: string;
    name: string;
    tier: string;
  } | null;
}

export interface DocumentStats {
  total: number;
  by_type: Record<DocumentType, number>;
  by_status: Record<ParsingStatus, number>;
  expiring_soon: number; // Documents expiring in 30 days
  expired: number;
}

// ============================================
// FILTER & PAGINATION
// ============================================

export interface DocumentFilters {
  search?: string;
  type?: DocumentType[];
  vendor_id?: string;
  parsing_status?: ParsingStatus[];
  expiring_before?: string;
  uploaded_after?: string;
  uploaded_before?: string;
}

export interface DocumentSortOptions {
  field: 'filename' | 'created_at' | 'type' | 'file_size' | 'valid_until';
  direction: 'asc' | 'desc';
}

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// ============================================
// INPUT TYPES (for forms)
// ============================================

export interface CreateDocumentInput {
  vendor_id?: string;
  type: DocumentType;
  file: File;
  metadata?: Partial<DocumentMetadata>;
}

export interface UpdateDocumentInput {
  type?: DocumentType;
  metadata?: Partial<DocumentMetadata>;
}

// ============================================
// UPLOAD TYPES
// ============================================

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  success: boolean;
  document?: Document;
  error?: string;
}

// ============================================
// UI HELPER TYPES & CONSTANTS
// ============================================

export const DOCUMENT_TYPE_INFO: Record<
  DocumentType,
  { label: string; description: string; icon: string; color: string }
> = {
  soc2: {
    label: 'SOC 2 Report',
    description: 'Service Organization Control 2 audit report',
    icon: 'Shield',
    color: 'bg-blue-500',
  },
  iso27001: {
    label: 'ISO 27001',
    description: 'Information security management certificate',
    icon: 'Award',
    color: 'bg-green-500',
  },
  pentest: {
    label: 'Penetration Test',
    description: 'Security penetration testing report',
    icon: 'Bug',
    color: 'bg-orange-500',
  },
  contract: {
    label: 'Contract',
    description: 'Service agreement or legal document',
    icon: 'FileText',
    color: 'bg-purple-500',
  },
  other: {
    label: 'Other',
    description: 'General compliance documentation',
    icon: 'File',
    color: 'bg-gray-500',
  },
};

export const PARSING_STATUS_INFO: Record<
  ParsingStatus,
  { label: string; color: string }
> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-800' },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
  failed: { label: 'Failed', color: 'bg-red-100 text-red-800' },
};

export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/gif',
  'image/webp',
  'text/plain',
  'text/csv',
] as const;

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function isDocumentExpiring(document: Document, days: number = 30): boolean {
  const expiryDate = document.metadata?.valid_until || document.metadata?.expiry_date;
  if (!expiryDate) return false;

  const expiry = new Date(expiryDate);
  const threshold = new Date();
  threshold.setDate(threshold.getDate() + days);

  return expiry <= threshold && expiry >= new Date();
}

export function isDocumentExpired(document: Document): boolean {
  const expiryDate = document.metadata?.valid_until || document.metadata?.expiry_date;
  if (!expiryDate) return false;

  return new Date(expiryDate) < new Date();
}

// ============================================
// UI FILTER & SORT CONSTANTS
// ============================================

export type StatusFilter = 'all' | 'active' | 'expiring' | 'expired' | 'processing' | 'failed';
export type SortField = 'filename' | 'created_at' | 'file_size' | 'type' | 'vendor';
export type SortDirection = 'asc' | 'desc';
export type ViewMode = 'table' | 'card';
export type GroupBy = 'none' | 'vendor' | 'type' | 'status';

export const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'created_at', label: 'Upload Date' },
  { value: 'filename', label: 'Filename' },
  { value: 'file_size', label: 'File Size' },
  { value: 'type', label: 'Document Type' },
  { value: 'vendor', label: 'Vendor Name' },
];

/**
 * Determine the display status of a document based on parsing status and expiry
 */
export function getDocumentStatus(doc: Document | DocumentWithVendor): StatusFilter {
  if (doc.parsing_status === 'processing' || doc.parsing_status === 'pending') return 'processing';
  if (doc.parsing_status === 'failed') return 'failed';
  if (isDocumentExpired(doc)) return 'expired';
  if (isDocumentExpiring(doc)) return 'expiring';
  return 'active';
}
