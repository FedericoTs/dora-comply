/**
 * Shared Validation Schemas
 *
 * Common Zod schemas used across multiple modules.
 * Import from here instead of defining inline to maintain consistency.
 */

import { z } from 'zod';

/**
 * Flexible date schema that accepts various date string formats.
 * Validates that the string can be parsed as a valid date.
 * Returns the original string (optional field).
 *
 * @example
 * flexibleDateSchema.parse('2024-01-15') // '2024-01-15'
 * flexibleDateSchema.parse('Jan 15, 2024') // 'Jan 15, 2024'
 */
export const flexibleDateSchema = z
  .string()
  .refine((val) => !Number.isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  })
  .optional();

/**
 * Flexible datetime schema that accepts various datetime string formats.
 * Validates and transforms to ISO 8601 format.
 *
 * @example
 * flexibleDatetimeSchema.parse('2024-01-15T10:30:00Z') // '2024-01-15T10:30:00.000Z'
 * flexibleDatetimeSchema.parse('Jan 15, 2024 10:30 AM') // '2024-01-15T10:30:00.000Z'
 */
export const flexibleDatetimeSchema = z
  .string()
  .refine((val) => !Number.isNaN(Date.parse(val)), {
    message: 'Invalid datetime format',
  })
  .transform((val) => new Date(val).toISOString());

/**
 * Optional flexible datetime schema.
 * Same as flexibleDatetimeSchema but allows undefined/null.
 */
export const optionalFlexibleDatetimeSchema = z
  .string()
  .refine((val) => !Number.isNaN(Date.parse(val)), {
    message: 'Invalid datetime format',
  })
  .transform((val) => new Date(val).toISOString())
  .optional()
  .nullable();

/**
 * Required date string schema (non-optional).
 * Validates that the string can be parsed as a valid date.
 */
export const requiredDateSchema = z
  .string()
  .refine((val) => !Number.isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  });
