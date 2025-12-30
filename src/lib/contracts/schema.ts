/**
 * Contract Validation Schema
 *
 * Zod schemas for validating contract data
 */

import { z } from 'zod';
import { CONTRACT_TYPES, CONTRACT_STATUSES } from './types';

const contractTypeSchema = z.enum(CONTRACT_TYPES as [string, ...string[]]);
const contractStatusSchema = z.enum(CONTRACT_STATUSES as [string, ...string[]]);

export const createContractSchema = z.object({
  vendor_id: z.string().uuid('Invalid vendor ID'),
  contract_ref: z
    .string()
    .min(1, 'Contract reference is required')
    .max(100, 'Contract reference must be less than 100 characters'),
  contract_type: contractTypeSchema,
  signature_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
    .optional()
    .or(z.literal('')),
  effective_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  expiry_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
    .optional()
    .or(z.literal('')),
  auto_renewal: z.boolean(),
  termination_notice_days: z
    .number()
    .int()
    .min(0, 'Notice days must be positive')
    .max(365, 'Notice days cannot exceed 365')
    .optional()
    .nullable(),
  annual_value: z
    .number()
    .min(0, 'Annual value must be positive')
    .optional()
    .nullable(),
  total_value: z
    .number()
    .min(0, 'Total value must be positive')
    .optional()
    .nullable(),
  currency: z.string().length(3, 'Currency must be 3-letter code'),
  notes: z
    .string()
    .max(2000, 'Notes must be less than 2000 characters')
    .optional()
    .or(z.literal('')),
}).refine(
  (data) => {
    if (data.expiry_date && data.effective_date) {
      return new Date(data.expiry_date) > new Date(data.effective_date);
    }
    return true;
  },
  {
    message: 'Expiry date must be after effective date',
    path: ['expiry_date'],
  }
);

export const updateContractSchema = z.object({
  contract_ref: z
    .string()
    .min(1, 'Contract reference is required')
    .max(100, 'Contract reference must be less than 100 characters')
    .optional(),
  contract_type: contractTypeSchema.optional(),
  signature_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
    .optional()
    .nullable(),
  effective_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
    .optional(),
  expiry_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
    .optional()
    .nullable(),
  auto_renewal: z.boolean().optional(),
  termination_notice_days: z
    .number()
    .int()
    .min(0, 'Notice days must be positive')
    .max(365, 'Notice days cannot exceed 365')
    .optional()
    .nullable(),
  last_renewal_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format')
    .optional()
    .nullable(),
  annual_value: z
    .number()
    .min(0, 'Annual value must be positive')
    .optional()
    .nullable(),
  total_value: z
    .number()
    .min(0, 'Total value must be positive')
    .optional()
    .nullable(),
  currency: z
    .string()
    .length(3, 'Currency must be 3-letter code')
    .optional(),
  status: contractStatusSchema.optional(),
  notes: z
    .string()
    .max(2000, 'Notes must be less than 2000 characters')
    .optional()
    .nullable(),
});

export type CreateContractFormData = z.infer<typeof createContractSchema>;
export type UpdateContractFormData = z.infer<typeof updateContractSchema>;
