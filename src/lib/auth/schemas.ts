/**
 * Auth Schemas
 * Zod validation schemas for authentication forms
 * Shared between client and server for consistent validation
 */

import { z } from 'zod';

// ============================================================================
// Password Schema
// ============================================================================

/**
 * Password requirements:
 * - Minimum 12 characters (configurable)
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * - zxcvbn score >= 3 (validated separately)
 */
export const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
    'Password must contain at least one special character'
  );

// ============================================================================
// Email Schema
// ============================================================================

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Please enter a valid email address')
  .max(255, 'Email must be at most 255 characters')
  .toLowerCase()
  .trim();

// ============================================================================
// Login Schema
// ============================================================================

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean(),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ============================================================================
// Register Schema
// ============================================================================

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    fullName: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be at most 100 characters')
      .regex(/^[a-zA-Z\s\-']+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
      .trim(),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms and conditions',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

// ============================================================================
// Reset Password Schema
// ============================================================================

export const resetPasswordSchema = z.object({
  email: emailSchema,
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// ============================================================================
// New Password Schema
// ============================================================================

export const newPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type NewPasswordInput = z.infer<typeof newPasswordSchema>;

// ============================================================================
// Onboarding Schema
// ============================================================================

export const entityTypes = [
  'financial_entity',
  'credit_institution',
  'investment_firm',
  'insurance_undertaking',
  'payment_institution',
  'ict_service_provider',
] as const;

export const teamSizes = ['solo', 'small', 'medium', 'large'] as const;

export const primaryUseCases = [
  'vendor_assessment',
  'roi_generation',
  'incident_reporting',
  'full_compliance',
] as const;

export const onboardingSchema = z.object({
  organizationName: z
    .string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(200, 'Organization name must be at most 200 characters')
    .trim(),
  lei: z
    .string()
    .length(20, 'LEI must be exactly 20 characters')
    .regex(/^[A-Z0-9]+$/, 'LEI must contain only uppercase letters and numbers')
    .optional()
    .or(z.literal('')),
  entityType: z.enum(entityTypes, {
    message: 'Please select an entity type',
  }),
  jurisdiction: z
    .string()
    .min(2, 'Jurisdiction is required')
    .max(100, 'Jurisdiction must be at most 100 characters'),
  teamSize: z.enum(teamSizes, {
    message: 'Please select a team size',
  }),
  primaryUseCase: z.enum(primaryUseCases, {
    message: 'Please select a primary use case',
  }),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

// ============================================================================
// MFA Schema
// ============================================================================

export const mfaCodeSchema = z.object({
  code: z
    .string()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d+$/, 'Code must contain only numbers'),
});

export type MfaCodeInput = z.infer<typeof mfaCodeSchema>;

// ============================================================================
// Profile Update Schema
// ============================================================================

export const profileUpdateSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters')
    .regex(/^[a-zA-Z\s\-']+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
    .trim()
    .optional(),
  avatarUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
