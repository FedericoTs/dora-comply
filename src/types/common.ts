/**
 * Common Type Definitions
 * Shared types used across multiple modules in the application
 */

import type { AppError } from '@/lib/errors';

// ============================================================================
// Action Results
// ============================================================================

/**
 * Generic result type for server actions
 * @template T - The data type returned on success
 * @template TError - The error type (defaults to AppError)
 */
export interface ActionResult<T = void, TError extends AppError = AppError> {
  success: boolean;
  data?: T;
  error?: TError;
  /** Optional metadata about the action */
  meta?: Record<string, unknown>;
}

/**
 * Creates a successful action result
 */
export function successResult<T>(data: T, meta?: Record<string, unknown>): ActionResult<T> {
  return {
    success: true,
    data,
    ...(meta && { meta }),
  };
}

/**
 * Creates a failed action result
 */
export function errorResult<TError extends AppError = AppError>(
  error: TError,
  meta?: Record<string, unknown>
): ActionResult<never, TError> {
  return {
    success: false,
    error,
    ...(meta && { meta }),
  };
}

// ============================================================================
// Pagination
// ============================================================================

/**
 * Pagination request options
 */
export interface PaginationOptions {
  page?: number;
  pageSize?: number;
  /** Cursor-based pagination alternative */
  cursor?: string;
}

/**
 * Paginated result wrapper
 * @template T - The type of items in the results
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  /** For cursor-based pagination */
  nextCursor?: string;
}

/**
 * Creates a paginated result from items and options
 */
export function createPaginatedResult<T>(
  items: T[],
  total: number,
  options: Required<Pick<PaginationOptions, 'page' | 'pageSize'>>
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / options.pageSize);
  return {
    items,
    total,
    page: options.page,
    pageSize: options.pageSize,
    totalPages,
    hasNextPage: options.page < totalPages,
    hasPreviousPage: options.page > 1,
  };
}

// ============================================================================
// Sorting
// ============================================================================

/**
 * Generic sort options
 */
export interface SortOptions<TField extends string = string> {
  field: TField;
  direction: 'asc' | 'desc';
}

// ============================================================================
// Filtering
// ============================================================================

/**
 * Base filter interface that all domain filters extend
 */
export interface BaseFilters {
  search?: string;
  createdAfter?: Date | string;
  createdBefore?: Date | string;
}

// ============================================================================
// Entity Types
// ============================================================================

/**
 * Base entity interface with common audit fields
 */
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
  organization_id: string;
}

/**
 * Soft-deletable entity
 */
export interface SoftDeletableEntity extends BaseEntity {
  deleted_at?: string | null;
  deleted_by?: string | null;
}

// ============================================================================
// Status Types
// ============================================================================

/**
 * Common status type used across modules
 */
export type Status = 'active' | 'inactive' | 'pending' | 'archived';

/**
 * Generic status with label for display
 */
export interface StatusInfo {
  value: Status;
  label: string;
  color: 'success' | 'warning' | 'error' | 'info' | 'default';
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Field validation error
 */
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

/**
 * Validation result with multiple field errors
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// ============================================================================
// API Types
// ============================================================================

/**
 * Standard API response envelope
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta?: {
    requestId?: string;
    timestamp?: string;
    [key: string]: unknown;
  };
}

/**
 * Standard list API response
 */
export interface ApiListResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Make all properties in T optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Extract only the keys of T that have values assignable to V
 */
export type KeysOfType<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];

/**
 * Make specific keys required
 */
export type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Omit keys that are never
 */
export type OmitNever<T> = {
  [K in keyof T as T[K] extends never ? never : K]: T[K];
};

// ============================================================================
// Date/Time
// ============================================================================

/**
 * ISO date string type for better type safety
 */
export type ISODateString = string & { readonly __brand: 'ISODateString' };

/**
 * Date range for filtering
 */
export interface DateRange {
  from?: Date | string;
  to?: Date | string;
}
