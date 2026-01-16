/**
 * Framework Constants
 *
 * Centralized constants for framework context and cookie management.
 * Shared between server-side (framework-cookie.ts) and client-side (framework-context.tsx).
 */

import type { FrameworkCode } from '@/lib/licensing/types';

/** Cookie name for storing the active framework selection */
export const FRAMEWORK_COOKIE_NAME = 'active-framework';

/** LocalStorage key for persisting framework selection on client */
export const FRAMEWORK_STORAGE_KEY = 'active-framework';

/** Valid framework codes that can be selected */
export const VALID_FRAMEWORKS: readonly FrameworkCode[] = [
  'nis2',
  'dora',
  'gdpr',
  'iso27001',
] as const;

/**
 * Type guard to check if a value is a valid framework code
 */
export function isValidFramework(value: unknown): value is FrameworkCode {
  return typeof value === 'string' && VALID_FRAMEWORKS.includes(value as FrameworkCode);
}
