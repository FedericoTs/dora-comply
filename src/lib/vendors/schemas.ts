/**
 * Vendor Validation Schemas
 *
 * Zod schemas for form validation and API input validation.
 */

import { z } from 'zod';

// ============================================
// ENUM SCHEMAS
// ============================================

export const vendorTierSchema = z.enum(['critical', 'important', 'standard']);

export const vendorStatusSchema = z.enum(['active', 'pending', 'inactive', 'offboarding']);

export const providerTypeSchema = z.enum([
  'ict_service_provider',
  'cloud_service_provider',
  'data_centre',
  'network_provider',
  'other',
]);

export const serviceTypeSchema = z.enum([
  'cloud_computing',
  'software_as_service',
  'platform_as_service',
  'infrastructure_as_service',
  'data_analytics',
  'data_management',
  'network_services',
  'security_services',
  'payment_services',
  'hardware',
  'other',
]);

export const contactTypeSchema = z.enum([
  'primary',
  'technical',
  'security',
  'commercial',
  'escalation',
]);

// ============================================
// LEI VALIDATION
// ============================================

/**
 * LEI (Legal Entity Identifier) format:
 * - 20 characters
 * - First 4: Prefix (LOU identifier)
 * - Characters 5-6: Reserved (00)
 * - Characters 7-18: Entity-specific
 * - Characters 19-20: Checksum
 * - Alphanumeric only (A-Z, 0-9)
 */
export const leiSchema = z
  .string()
  .regex(/^[A-Z0-9]{20}$/, 'LEI must be exactly 20 alphanumeric characters')
  .optional()
  .or(z.literal(''));

/**
 * Validate LEI checksum using ISO 17442 algorithm (MOD 97-10)
 */
export function validateLEIChecksum(lei: string): boolean {
  if (!lei || lei.length !== 20) return false;

  // Convert letters to numbers (A=10, B=11, etc.)
  const converted = lei
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0);
      // Numbers 0-9
      if (code >= 48 && code <= 57) return char;
      // Letters A-Z (A=10, B=11, ..., Z=35)
      if (code >= 65 && code <= 90) return (code - 55).toString();
      return '';
    })
    .join('');

  // Calculate MOD 97
  let remainder = 0;
  for (let i = 0; i < converted.length; i++) {
    remainder = (remainder * 10 + parseInt(converted[i], 10)) % 97;
  }

  return remainder === 1;
}

// ============================================
// CONTACT SCHEMA
// ============================================

export const vendorContactSchema = z.object({
  name: z.string().min(1, 'Contact name is required').max(200),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().max(50).optional().or(z.literal('')),
  title: z.string().max(200).optional().or(z.literal('')),
});

// ============================================
// CREATE VENDOR SCHEMA
// ============================================

export const createVendorSchema = z.object({
  // Step 1: Basic Info
  name: z
    .string()
    .min(1, 'Vendor name is required')
    .max(500, 'Name must be less than 500 characters')
    .trim(),
  lei: leiSchema,

  // Step 2: Classification
  tier: vendorTierSchema,
  provider_type: providerTypeSchema.optional(),
  headquarters_country: z
    .string()
    .length(2, 'Country code must be 2 characters (ISO 3166-1)')
    .optional()
    .or(z.literal('')),
  service_types: z.array(serviceTypeSchema).default([]),

  // Step 3: DORA Specifics
  supports_critical_function: z.boolean().default(false),
  critical_functions: z.array(z.string()).default([]),
  is_intra_group: z.boolean().default(false),

  // Optional
  primary_contact: vendorContactSchema.optional(),
  notes: z.string().max(5000).optional().or(z.literal('')),
});

// Output type (after defaults applied) - use for API/server actions
export type CreateVendorFormData = z.infer<typeof createVendorSchema>;

// Input type (before defaults) - use for form state
export type CreateVendorFormInput = z.input<typeof createVendorSchema>;

// ============================================
// UPDATE VENDOR SCHEMA
// ============================================

export const updateVendorSchema = z.object({
  name: z.string().min(1).max(500).trim().optional(),
  lei: leiSchema,
  tier: vendorTierSchema.optional(),
  status: vendorStatusSchema.optional(),
  provider_type: providerTypeSchema.optional().nullable(),
  headquarters_country: z.string().length(2).optional().or(z.literal('')).nullable(),
  jurisdiction: z.string().max(100).optional().or(z.literal('')).nullable(),
  service_types: z.array(serviceTypeSchema).optional(),
  supports_critical_function: z.boolean().optional(),
  critical_functions: z.array(z.string()).optional(),
  is_intra_group: z.boolean().optional(),
  primary_contact: vendorContactSchema.optional(),
  notes: z.string().max(5000).optional().or(z.literal('')).nullable(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type UpdateVendorFormData = z.infer<typeof updateVendorSchema>;

// ============================================
// FILTER SCHEMA
// ============================================

export const vendorFiltersSchema = z.object({
  search: z.string().optional(),
  tier: z.array(vendorTierSchema).optional(),
  status: z.array(vendorStatusSchema).optional(),
  provider_type: z.array(providerTypeSchema).optional(),
  risk_min: z.number().min(0).max(100).optional(),
  risk_max: z.number().min(0).max(100).optional(),
  has_lei: z.boolean().optional(),
  supports_critical_function: z.boolean().optional(),
});

export type VendorFiltersFormData = z.infer<typeof vendorFiltersSchema>;

// ============================================
// BULK IMPORT SCHEMA
// ============================================

export const bulkImportRowSchema = z.object({
  name: z.string().min(1),
  lei: leiSchema,
  tier: vendorTierSchema.optional().default('standard'),
  provider_type: providerTypeSchema.optional(),
  headquarters_country: z.string().length(2).optional(),
  service_types: z.string().optional(), // Comma-separated
  supports_critical_function: z.union([z.boolean(), z.string()]).optional(),
  contact_name: z.string().optional(),
  contact_email: z.string().email().optional(),
  notes: z.string().optional(),
});

export type BulkImportRow = z.infer<typeof bulkImportRowSchema>;

// ============================================
// VENDOR CONTACT RECORD SCHEMA
// ============================================

export const createVendorContactSchema = z.object({
  vendor_id: z.string().uuid(),
  contact_type: contactTypeSchema,
  name: z.string().min(1).max(200),
  title: z.string().max(200).optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(50).optional().or(z.literal('')),
});

export type CreateVendorContactFormData = z.infer<typeof createVendorContactSchema>;

// ============================================
// STEP VALIDATION HELPERS
// ============================================

/**
 * Validate only Step 1 fields (name and LEI lookup)
 */
export const step1Schema = createVendorSchema.pick({
  name: true,
  lei: true,
});

/**
 * Validate Step 2 fields (classification)
 */
export const step2Schema = createVendorSchema.pick({
  tier: true,
  provider_type: true,
  headquarters_country: true,
  service_types: true,
});

/**
 * Validate Step 3 fields (DORA specifics)
 */
export const step3Schema = createVendorSchema.pick({
  supports_critical_function: true,
  critical_functions: true,
  is_intra_group: true,
  primary_contact: true,
  notes: true,
});
