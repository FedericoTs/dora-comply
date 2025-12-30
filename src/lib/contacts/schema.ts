/**
 * Vendor Contact Validation Schema
 *
 * Zod schemas for validating vendor contact data
 */

import { z } from 'zod';
import { CONTACT_TYPES } from './types';

export const contactTypeSchema = z.enum(CONTACT_TYPES as [string, ...string[]]);

export const createContactSchema = z.object({
  vendor_id: z.string().uuid('Invalid vendor ID'),
  contact_type: contactTypeSchema,
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  title: z
    .string()
    .max(100, 'Title must be less than 100 characters')
    .optional()
    .nullable(),
  email: z
    .string()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters')
    .optional()
    .nullable()
    .or(z.literal('')),
  phone: z
    .string()
    .max(50, 'Phone must be less than 50 characters')
    .optional()
    .nullable()
    .or(z.literal('')),
});

export const updateContactSchema = z.object({
  contact_type: contactTypeSchema.optional(),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters')
    .optional(),
  title: z
    .string()
    .max(100, 'Title must be less than 100 characters')
    .optional()
    .nullable(),
  email: z
    .string()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters')
    .optional()
    .nullable()
    .or(z.literal('')),
  phone: z
    .string()
    .max(50, 'Phone must be less than 50 characters')
    .optional()
    .nullable()
    .or(z.literal('')),
});

export type CreateContactFormData = z.infer<typeof createContactSchema>;
export type UpdateContactFormData = z.infer<typeof updateContactSchema>;
