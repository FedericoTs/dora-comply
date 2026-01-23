/**
 * Organization Branding Types and Schema
 * Used for vendor portal customization
 */

import { z } from 'zod';

// ============================================================================
// Types
// ============================================================================

export type LogoPosition = 'left' | 'center' | 'right';

export interface OrganizationBranding {
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  portalWelcomeTitle: string;
  portalWelcomeMessage: string;
  portalFooterText: string | null;
  portalSupportEmail: string | null;
  portalLogoPosition: LogoPosition;
}

// ============================================================================
// Validation Schema
// ============================================================================

// Hex color regex - allows 3 or 6 digit hex colors
const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

export const brandingSchema = z.object({
  primaryColor: z
    .string()
    .regex(hexColorRegex, 'Invalid hex color format (e.g., #059669)'),
  accentColor: z
    .string()
    .regex(hexColorRegex, 'Invalid hex color format (e.g., #10B981)'),
  portalWelcomeTitle: z
    .string()
    .min(1, 'Welcome title is required')
    .max(100, 'Title must be 100 characters or less'),
  portalWelcomeMessage: z
    .string()
    .min(1, 'Welcome message is required')
    .max(500, 'Message must be 500 characters or less'),
  portalFooterText: z
    .string()
    .max(200, 'Footer text must be 200 characters or less')
    .nullable()
    .optional(),
  portalSupportEmail: z
    .string()
    .email('Invalid email format')
    .nullable()
    .optional()
    .or(z.literal('')),
  portalLogoPosition: z.enum(['left', 'center', 'right']),
});

// Explicit form data type for better type inference with react-hook-form
export interface BrandingFormData {
  primaryColor: string;
  accentColor: string;
  portalWelcomeTitle: string;
  portalWelcomeMessage: string;
  portalFooterText?: string | null;
  portalSupportEmail?: string | null;
  portalLogoPosition: 'left' | 'center' | 'right';
}

// ============================================================================
// Defaults
// ============================================================================

export const DEFAULT_BRANDING: OrganizationBranding = {
  logoUrl: null,
  primaryColor: '#059669',
  accentColor: '#10B981',
  portalWelcomeTitle: 'Welcome to our Vendor Portal',
  portalWelcomeMessage: 'Please complete the requested questionnaire to help us assess compliance and security.',
  portalFooterText: null,
  portalSupportEmail: null,
  portalLogoPosition: 'left',
};

// ============================================================================
// Color Presets
// ============================================================================

export const COLOR_PRESETS = [
  { name: 'Emerald', primary: '#059669', accent: '#10B981' },
  { name: 'Blue', primary: '#2563EB', accent: '#3B82F6' },
  { name: 'Purple', primary: '#7C3AED', accent: '#8B5CF6' },
  { name: 'Rose', primary: '#E11D48', accent: '#F43F5E' },
  { name: 'Orange', primary: '#EA580C', accent: '#F97316' },
  { name: 'Teal', primary: '#0D9488', accent: '#14B8A6' },
  { name: 'Indigo', primary: '#4F46E5', accent: '#6366F1' },
  { name: 'Slate', primary: '#475569', accent: '#64748B' },
] as const;
