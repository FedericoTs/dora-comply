/**
 * Document Validation Schemas
 *
 * Zod schemas for form validation and API input validation.
 */

import { z } from 'zod';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from './types';

// ============================================
// ENUM SCHEMAS
// ============================================

export const documentTypeSchema = z.enum(['soc2', 'iso27001', 'pentest', 'contract', 'other']);

export const parsingStatusSchema = z.enum(['pending', 'processing', 'completed', 'failed']);

// ============================================
// METADATA SCHEMAS
// ============================================

export const documentMetadataSchema = z.object({
  // Document validity
  valid_from: z.string().optional(),
  valid_until: z.string().optional(),
  expiry_date: z.string().optional(),

  // SOC 2 specific
  soc2_type: z.enum(['1', '2']).optional(),
  report_period_start: z.string().optional(),
  report_period_end: z.string().optional(),
  auditor_name: z.string().max(200).optional(),

  // ISO 27001 specific
  certification_body: z.string().max(200).optional(),
  certificate_number: z.string().max(100).optional(),

  // Pentest specific
  tester_company: z.string().max(200).optional(),
  test_date: z.string().optional(),
  scope: z.string().max(1000).optional(),
  findings_count: z.number().int().min(0).optional(),
  critical_findings: z.number().int().min(0).optional(),

  // Contract specific
  contract_start: z.string().optional(),
  contract_end: z.string().optional(),
  renewal_type: z.enum(['auto', 'manual', 'none']).optional(),

  // General
  description: z.string().max(2000).optional(),
  version: z.string().max(50).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
}).passthrough(); // Allow additional fields

export type DocumentMetadataFormData = z.infer<typeof documentMetadataSchema>;

// ============================================
// FILE VALIDATION
// ============================================

/**
 * Validate file on the client side before upload
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    };
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type as typeof ALLOWED_MIME_TYPES[number])) {
    return {
      valid: false,
      error: 'File type not allowed. Supported formats: PDF, Word, Excel, Images, Text, CSV',
    };
  }

  // Check filename
  if (file.name.length > 255) {
    return {
      valid: false,
      error: 'Filename is too long (max 255 characters)',
    };
  }

  // Check for suspicious characters in filename
  const suspiciousChars = /[<>:"|?*\\]/;
  if (suspiciousChars.test(file.name)) {
    return {
      valid: false,
      error: 'Filename contains invalid characters',
    };
  }

  return { valid: true };
}

// ============================================
// CREATE DOCUMENT SCHEMA
// ============================================

export const createDocumentSchema = z.object({
  vendor_id: z.string().uuid('Invalid vendor ID').optional().nullable(),
  type: documentTypeSchema,
  metadata: documentMetadataSchema.optional().default({}),
});

export type CreateDocumentFormData = z.infer<typeof createDocumentSchema>;

// ============================================
// UPDATE DOCUMENT SCHEMA
// ============================================

export const updateDocumentSchema = z.object({
  type: documentTypeSchema.optional(),
  metadata: documentMetadataSchema.optional(),
});

export type UpdateDocumentFormData = z.infer<typeof updateDocumentSchema>;

// ============================================
// FILTER SCHEMA
// ============================================

export const documentFiltersSchema = z.object({
  search: z.string().optional(),
  type: z.array(documentTypeSchema).optional(),
  vendor_id: z.string().uuid().optional(),
  parsing_status: z.array(parsingStatusSchema).optional(),
  expiring_before: z.string().optional(),
  uploaded_after: z.string().optional(),
  uploaded_before: z.string().optional(),
});

export type DocumentFiltersFormData = z.infer<typeof documentFiltersSchema>;

// ============================================
// TYPE-SPECIFIC METADATA SCHEMAS
// ============================================

/**
 * SOC 2 Report metadata schema
 */
export const soc2MetadataSchema = documentMetadataSchema.extend({
  soc2_type: z.enum(['1', '2']).optional(),
  report_period_start: z.string().optional(),
  report_period_end: z.string().optional(),
  auditor_name: z.string().max(200).optional(),
  valid_from: z.string().optional(),
  valid_until: z.string().optional(),
});

/**
 * ISO 27001 Certificate metadata schema
 */
export const iso27001MetadataSchema = documentMetadataSchema.extend({
  certification_body: z.string().max(200).optional(),
  certificate_number: z.string().max(100).optional(),
  valid_from: z.string().optional(),
  valid_until: z.string().optional(),
});

/**
 * Penetration Test Report metadata schema
 */
export const pentestMetadataSchema = documentMetadataSchema.extend({
  tester_company: z.string().max(200).optional(),
  test_date: z.string().optional(),
  scope: z.string().max(1000).optional(),
  findings_count: z.number().int().min(0).optional(),
  critical_findings: z.number().int().min(0).optional(),
});

/**
 * Contract metadata schema
 */
export const contractMetadataSchema = documentMetadataSchema.extend({
  contract_start: z.string().optional(),
  contract_end: z.string().optional(),
  renewal_type: z.enum(['auto', 'manual', 'none']).optional(),
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get the appropriate metadata schema based on document type
 */
export function getMetadataSchemaForType(type: string) {
  switch (type) {
    case 'soc2':
      return soc2MetadataSchema;
    case 'iso27001':
      return iso27001MetadataSchema;
    case 'pentest':
      return pentestMetadataSchema;
    case 'contract':
      return contractMetadataSchema;
    default:
      return documentMetadataSchema;
  }
}
