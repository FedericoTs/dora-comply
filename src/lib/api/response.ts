/**
 * API Response Helpers
 *
 * Standardized response formatting for API routes.
 *
 * @module lib/api/response
 */

import { NextResponse } from 'next/server';
import type { ZodError } from 'zod';

// ============================================================================
// Response Types
// ============================================================================

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    [key: string]: unknown;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ============================================================================
// Success Responses
// ============================================================================

/**
 * Create a success response
 * @param data - The response data
 * @param meta - Optional metadata (pagination, etc.)
 * @param status - HTTP status code (default: 200)
 */
export function successResponse<T>(
  data: T,
  meta?: ApiSuccessResponse<T>['meta'],
  status = 200
): NextResponse<ApiSuccessResponse<T>> {
  const body: ApiSuccessResponse<T> = { success: true, data };
  if (meta) body.meta = meta;

  return NextResponse.json(body, { status });
}

/**
 * Create a 201 Created response
 */
export function createdResponse<T>(data: T): NextResponse<ApiSuccessResponse<T>> {
  return successResponse(data, undefined, 201);
}

/**
 * Create a 204 No Content response
 */
export function noContentResponse(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

// ============================================================================
// Error Responses
// ============================================================================

/**
 * Create an error response
 * @param message - Error message
 * @param status - HTTP status code
 * @param code - Error code for client handling
 * @param details - Additional error details
 */
export function errorResponse(
  message: string,
  status = 500,
  code?: string,
  details?: unknown
): NextResponse<ApiErrorResponse> {
  const body: ApiErrorResponse = {
    success: false,
    error: { message },
  };

  if (code) body.error.code = code;
  if (details) body.error.details = details;

  return NextResponse.json(body, { status });
}

/**
 * 400 Bad Request response
 */
export function badRequestResponse(
  message = 'Bad request',
  details?: unknown
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 400, 'BAD_REQUEST', details);
}

/**
 * 401 Unauthorized response
 */
export function unauthorizedResponse(
  message = 'Unauthorized'
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 401, 'UNAUTHORIZED');
}

/**
 * 403 Forbidden response
 */
export function forbiddenResponse(
  message = 'Forbidden'
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 403, 'FORBIDDEN');
}

/**
 * 404 Not Found response
 */
export function notFoundResponse(
  message = 'Resource not found'
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 404, 'NOT_FOUND');
}

/**
 * 409 Conflict response
 */
export function conflictResponse(
  message = 'Resource conflict',
  code = 'CONFLICT'
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 409, code);
}

/**
 * 422 Unprocessable Entity (validation error)
 */
export function validationErrorResponse(
  message = 'Validation failed',
  details?: unknown
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 422, 'VALIDATION_ERROR', details);
}

/**
 * 429 Too Many Requests
 */
export function rateLimitResponse(
  message = 'Too many requests',
  retryAfter?: number
): NextResponse<ApiErrorResponse> {
  const response = errorResponse(message, 429, 'RATE_LIMITED');

  if (retryAfter) {
    response.headers.set('Retry-After', retryAfter.toString());
  }

  return response;
}

/**
 * 500 Internal Server Error
 */
export function internalErrorResponse(
  message = 'Internal server error'
): NextResponse<ApiErrorResponse> {
  return errorResponse(message, 500, 'INTERNAL_ERROR');
}

// ============================================================================
// Zod Error Formatting
// ============================================================================

/**
 * Format Zod validation errors into a user-friendly response
 */
export function zodErrorResponse(
  error: ZodError,
  message = 'Invalid request data'
): NextResponse<ApiErrorResponse> {
  const details = error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }));

  return validationErrorResponse(message, details);
}

// ============================================================================
// Error Handling Wrapper
// ============================================================================

/**
 * Wrap an API handler with error handling
 * Catches errors and returns appropriate responses
 */
export function withErrorHandling<T>(
  handler: () => Promise<NextResponse<T>>
): Promise<NextResponse<T | ApiErrorResponse>> {
  return handler().catch((error: unknown) => {
    console.error('API Error:', error);

    if (error instanceof Error) {
      // Don't expose internal error details
      return internalErrorResponse(
        process.env.NODE_ENV === 'development'
          ? error.message
          : 'An unexpected error occurred'
      );
    }

    return internalErrorResponse();
  });
}
