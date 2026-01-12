/**
 * API Utilities
 *
 * Centralized exports for API route helpers.
 *
 * @module lib/api
 */

// Sanitization utilities
export {
  // HTML/XSS
  escapeHtml,
  stripHtml,
  removeDangerousPatterns,
  // String sanitization
  normalizeWhitespace,
  sanitizeString,
  sanitizeMultilineText,
  sanitizeSingleLineText,
  // Field-specific
  sanitizeEmail,
  sanitizeUrl,
  sanitizePhone,
  sanitizeLei,
  sanitizeCountryCode,
  // Object sanitization
  sanitizeObject,
  // Zod preprocessors
  zodSanitizeString,
  zodSanitizeMultiline,
  zodSanitizeEmail,
  zodSanitizeUrl,
  createSanitizedStringSchema,
  // API helpers
  parseAndSanitizeBody,
  // SQL injection
  hasSqlInjectionPatterns,
  validateNoSqlInjection,
  // Types
  type SanitizeOptions,
  type ObjectSanitizeOptions,
  type SanitizedBody,
} from './sanitize';

// Response helpers
export {
  // Success responses
  successResponse,
  createdResponse,
  noContentResponse,
  // Error responses
  errorResponse,
  badRequestResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  conflictResponse,
  validationErrorResponse,
  rateLimitResponse,
  internalErrorResponse,
  // Zod helpers
  zodErrorResponse,
  // Error handling
  withErrorHandling,
  // Types
  type ApiSuccessResponse,
  type ApiErrorResponse,
  type ApiResponse,
} from './response';
