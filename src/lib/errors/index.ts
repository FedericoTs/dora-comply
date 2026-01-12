/**
 * Shared Error Handling Module
 * Centralized error types and factory functions for consistent error handling
 */

// ============================================================================
// Base Error Types
// ============================================================================

/** Common error codes shared across all modules */
export type BaseErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'DATABASE_ERROR'
  | 'UNKNOWN_ERROR';

/** Domain-specific error codes */
export type VendorErrorCode = BaseErrorCode | 'DUPLICATE_LEI';
export type DocumentErrorCode = BaseErrorCode | 'UPLOAD_ERROR' | 'STORAGE_ERROR' | 'FILE_TOO_LARGE' | 'INVALID_FILE_TYPE';
export type ContractErrorCode = BaseErrorCode | 'DUPLICATE_REF';
export type ContactErrorCode = BaseErrorCode;
export type IncidentErrorCode = BaseErrorCode | 'INVALID_CLASSIFICATION';
export type ROIErrorCode = BaseErrorCode | 'VALIDATION_FAILED' | 'TEMPLATE_NOT_FOUND';
export type SearchErrorCode = BaseErrorCode;
export type WebhookErrorCode = BaseErrorCode | 'INVALID_SIGNATURE' | 'DELIVERY_FAILED';
export type AIErrorCode = BaseErrorCode | 'RATE_LIMITED' | 'MODEL_ERROR';

/** Union of all error codes */
export type AppErrorCode =
  | VendorErrorCode
  | DocumentErrorCode
  | ContractErrorCode
  | ContactErrorCode
  | IncidentErrorCode
  | ROIErrorCode
  | SearchErrorCode
  | WebhookErrorCode
  | AIErrorCode;

// ============================================================================
// Error Interface
// ============================================================================

/**
 * Generic error interface used across all modules
 * @template TCode - The specific error code type for the domain
 */
export interface AppError<TCode extends string = AppErrorCode> {
  code: TCode;
  message: string;
  field?: string;
  details?: Record<string, unknown>;
}

// ============================================================================
// Error Factory
// ============================================================================

/**
 * Creates a typed error object
 * @template TCode - The error code type
 * @param code - The error code
 * @param message - Human-readable error message
 * @param field - Optional field name for validation errors
 * @param details - Optional additional error details
 */
export function createAppError<TCode extends string>(
  code: TCode,
  message: string,
  field?: string,
  details?: Record<string, unknown>
): AppError<TCode> {
  return {
    code,
    message,
    ...(field && { field }),
    ...(details && { details }),
  };
}

// ============================================================================
// Database Error Mapper
// ============================================================================

interface DatabaseErrorInput {
  message: string;
  code?: string;
  details?: string;
}

interface DatabaseErrorMapping {
  pattern: RegExp;
  code: BaseErrorCode;
  getMessage: (match: RegExpMatchArray | null, original: string) => string;
}

const DATABASE_ERROR_MAPPINGS: DatabaseErrorMapping[] = [
  {
    pattern: /permission|policy|denied/i,
    code: 'UNAUTHORIZED',
    getMessage: () => 'You do not have permission to perform this action',
  },
  {
    pattern: /foreign key|violates.*constraint/i,
    code: 'DATABASE_ERROR',
    getMessage: () => 'Invalid reference to related record',
  },
  {
    pattern: /duplicate|unique/i,
    code: 'DATABASE_ERROR',
    getMessage: () => 'A record with this value already exists',
  },
  {
    pattern: /not found|no rows/i,
    code: 'NOT_FOUND',
    getMessage: () => 'The requested resource was not found',
  },
];

/**
 * Maps database errors to app errors with consistent messaging
 * @param error - The database error object
 * @param defaultCode - Default error code if no pattern matches
 */
export function mapDatabaseError<TCode extends string = BaseErrorCode>(
  error: DatabaseErrorInput,
  defaultCode: TCode = 'DATABASE_ERROR' as TCode
): AppError<TCode> {
  const message = error.message.toLowerCase();

  for (const mapping of DATABASE_ERROR_MAPPINGS) {
    const match = message.match(mapping.pattern);
    if (match) {
      return createAppError(
        mapping.code as TCode,
        mapping.getMessage(match, error.message)
      );
    }
  }

  return createAppError(defaultCode, error.message);
}

/**
 * Extended database error mapper with domain-specific handling
 * @param error - The database error
 * @param domain - The domain for specialized error handling
 */
export function mapDomainDatabaseError<TCode extends string>(
  error: DatabaseErrorInput,
  domain: 'vendor' | 'document' | 'contract' | 'contact' | 'incident' | 'roi'
): AppError<TCode> {
  const message = error.message.toLowerCase();

  // Domain-specific mappings
  if (domain === 'vendor' && message.includes('lei')) {
    if (message.includes('duplicate') || message.includes('unique')) {
      return createAppError('DUPLICATE_LEI' as TCode, 'A vendor with this LEI already exists');
    }
  }

  if (domain === 'contract' && (message.includes('duplicate') || message.includes('unique'))) {
    return createAppError('DUPLICATE_REF' as TCode, 'A contract with this reference already exists');
  }

  // Fall back to generic mapping
  return mapDatabaseError(error);
}

// ============================================================================
// Error Type Guards
// ============================================================================

/**
 * Type guard to check if a value is an AppError
 */
export function isAppError(value: unknown): value is AppError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'code' in value &&
    'message' in value &&
    typeof (value as AppError).code === 'string' &&
    typeof (value as AppError).message === 'string'
  );
}

/**
 * Type guard for specific error codes
 */
export function hasErrorCode<TCode extends AppErrorCode>(
  error: AppError<AppErrorCode>,
  code: TCode
): error is AppError<TCode> {
  return error.code === code;
}

// ============================================================================
// Common Error Creators
// ============================================================================

export const AppErrors = {
  unauthorized: (message = 'You must be logged in to perform this action') =>
    createAppError('UNAUTHORIZED', message),

  notFound: (resource = 'Resource') =>
    createAppError('NOT_FOUND', `${resource} not found`),

  validationError: (message: string, field?: string) =>
    createAppError('VALIDATION_ERROR', message, field),

  databaseError: (message: string) =>
    createAppError('DATABASE_ERROR', message),

  unknownError: (message = 'An unexpected error occurred') =>
    createAppError('UNKNOWN_ERROR', message),
} as const;
