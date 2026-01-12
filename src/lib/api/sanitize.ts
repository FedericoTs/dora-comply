/**
 * API Input Sanitization Utilities
 *
 * Provides XSS protection, string normalization, and input sanitization
 * for API routes. Use these utilities to sanitize user input before
 * processing or storing in the database.
 *
 * @module lib/api/sanitize
 */

import { z } from 'zod';

// ============================================================================
// HTML/XSS Sanitization
// ============================================================================

/**
 * HTML entities to escape for XSS prevention
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * Escape HTML special characters to prevent XSS
 * @param input - The string to escape
 * @returns The escaped string
 */
export function escapeHtml(input: string): string {
  return input.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * Strip all HTML tags from a string
 * @param input - The string to strip
 * @returns The string with all HTML tags removed
 */
export function stripHtml(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags and content
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove style tags and content
    .replace(/<!--[\s\S]*?-->/g, '') // Remove HTML comments
    .replace(/<[^>]+>/g, '') // Remove remaining HTML tags
    .replace(/&nbsp;/gi, ' ') // Replace non-breaking spaces
    .trim();
}

/**
 * Remove potentially dangerous content patterns
 * @param input - The string to clean
 * @returns The sanitized string
 */
export function removeDangerousPatterns(input: string): string {
  return input
    // Remove javascript: protocol
    .replace(/javascript\s*:/gi, '')
    // Remove data: protocol (except for images if needed)
    .replace(/data\s*:\s*(?!image\/(png|jpeg|gif|webp))/gi, '')
    // Remove vbscript: protocol
    .replace(/vbscript\s*:/gi, '')
    // Remove on* event handlers
    .replace(/\bon\w+\s*=/gi, '')
    // Remove expression() (IE CSS)
    .replace(/expression\s*\(/gi, '')
    // Remove url() with javascript
    .replace(/url\s*\(\s*['"]?\s*javascript/gi, 'url(')
    // Remove import statements in CSS
    .replace(/@import/gi, '')
    // Remove binding: (Mozilla)
    .replace(/-moz-binding/gi, '');
}

// ============================================================================
// String Sanitization
// ============================================================================

/**
 * Normalize whitespace in a string
 * - Trims leading/trailing whitespace
 * - Collapses multiple spaces to single space
 * - Removes control characters
 * @param input - The string to normalize
 * @returns The normalized string
 */
export function normalizeWhitespace(input: string): string {
  return input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars (except \t, \n, \r)
    .replace(/\s+/g, ' ') // Collapse whitespace
    .trim();
}

/**
 * Sanitize a string for safe storage and display
 * Applies: whitespace normalization, HTML stripping, dangerous pattern removal
 * @param input - The string to sanitize
 * @param options - Sanitization options
 * @returns The sanitized string
 */
export function sanitizeString(
  input: string,
  options: {
    /** Escape HTML instead of stripping (default: false - strips HTML) */
    escapeHtml?: boolean;
    /** Allow newlines (default: false - converts to spaces) */
    allowNewlines?: boolean;
    /** Maximum length (default: no limit) */
    maxLength?: number;
    /** Trim the string (default: true) */
    trim?: boolean;
  } = {}
): string {
  const { escapeHtml: escape = false, allowNewlines = false, maxLength, trim = true } = options;

  let result = input;

  // Remove dangerous patterns first
  result = removeDangerousPatterns(result);

  // Handle HTML
  if (escape) {
    result = escapeHtml(result);
  } else {
    result = stripHtml(result);
  }

  // Handle whitespace
  if (allowNewlines) {
    // Normalize but preserve newlines
    result = result
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      .replace(/[^\S\n\r]+/g, ' ')
      .replace(/\n\s*\n\s*\n/g, '\n\n'); // Max 2 consecutive newlines
  } else {
    result = normalizeWhitespace(result);
  }

  // Trim
  if (trim) {
    result = result.trim();
  }

  // Truncate if needed
  if (maxLength && result.length > maxLength) {
    result = result.substring(0, maxLength);
  }

  return result;
}

/**
 * Sanitize text that allows multiple lines (notes, descriptions)
 * @param input - The text to sanitize
 * @param maxLength - Maximum length (default: 5000)
 * @returns The sanitized text
 */
export function sanitizeMultilineText(input: string, maxLength = 5000): string {
  return sanitizeString(input, { allowNewlines: true, maxLength });
}

/**
 * Sanitize a single-line text field (names, titles)
 * @param input - The text to sanitize
 * @param maxLength - Maximum length (default: 500)
 * @returns The sanitized text
 */
export function sanitizeSingleLineText(input: string, maxLength = 500): string {
  return sanitizeString(input, { allowNewlines: false, maxLength });
}

// ============================================================================
// Field-Specific Sanitization
// ============================================================================

/**
 * Sanitize an email address
 * @param email - The email to sanitize
 * @returns The sanitized email (lowercase, trimmed)
 */
export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * Sanitize a URL
 * @param url - The URL to sanitize
 * @returns The sanitized URL or empty string if invalid
 */
export function sanitizeUrl(url: string): string {
  const trimmed = url.trim();

  // Check for dangerous protocols
  const lowerUrl = trimmed.toLowerCase();
  if (
    lowerUrl.startsWith('javascript:') ||
    lowerUrl.startsWith('data:') ||
    lowerUrl.startsWith('vbscript:')
  ) {
    return '';
  }

  // Must start with http:// or https://
  if (!lowerUrl.startsWith('http://') && !lowerUrl.startsWith('https://')) {
    // If it looks like a valid URL without protocol, add https://
    if (/^[\w-]+(\.[\w-]+)+/.test(trimmed)) {
      return `https://${trimmed}`;
    }
    return '';
  }

  return trimmed;
}

/**
 * Sanitize a phone number (keep only digits and common separators)
 * @param phone - The phone number to sanitize
 * @returns The sanitized phone number
 */
export function sanitizePhone(phone: string): string {
  // Keep digits, +, spaces, dashes, parentheses
  return phone.replace(/[^\d+\s\-().]/g, '').trim();
}

/**
 * Sanitize an LEI code (uppercase, alphanumeric only)
 * @param lei - The LEI to sanitize
 * @returns The sanitized LEI
 */
export function sanitizeLei(lei: string): string {
  return lei.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Sanitize a country code (uppercase, 2 chars)
 * @param code - The country code to sanitize
 * @returns The sanitized country code
 */
export function sanitizeCountryCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 2);
}

// ============================================================================
// Object Sanitization
// ============================================================================

/**
 * Recursively sanitize an object's string values
 * @param obj - The object to sanitize
 * @param options - Sanitization options
 * @returns A new object with sanitized string values
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  options: {
    /** Fields that allow multiline text */
    multilineFields?: string[];
    /** Fields to skip sanitization (e.g., passwords) */
    skipFields?: string[];
    /** Maximum string length per field */
    maxLength?: number;
  } = {}
): T {
  const { multilineFields = [], skipFields = [], maxLength = 10000 } = options;

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (skipFields.includes(key)) {
      result[key] = value;
      continue;
    }

    if (typeof value === 'string') {
      if (multilineFields.includes(key)) {
        result[key] = sanitizeMultilineText(value, maxLength);
      } else {
        result[key] = sanitizeSingleLineText(value, maxLength);
      }
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) => {
        if (typeof item === 'string') {
          return sanitizeSingleLineText(item, maxLength);
        }
        if (typeof item === 'object' && item !== null) {
          return sanitizeObject(item as Record<string, unknown>, options);
        }
        return item;
      });
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeObject(value as Record<string, unknown>, options);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

// ============================================================================
// Zod Preprocessors
// ============================================================================

/**
 * Zod preprocessor that sanitizes strings
 * Usage: z.preprocess(zodSanitizeString, z.string())
 */
export const zodSanitizeString = (val: unknown): unknown => {
  if (typeof val === 'string') {
    return sanitizeSingleLineText(val);
  }
  return val;
};

/**
 * Zod preprocessor for multiline text
 * Usage: z.preprocess(zodSanitizeMultiline, z.string())
 */
export const zodSanitizeMultiline = (val: unknown): unknown => {
  if (typeof val === 'string') {
    return sanitizeMultilineText(val);
  }
  return val;
};

/**
 * Zod preprocessor for email addresses
 * Usage: z.preprocess(zodSanitizeEmail, z.string().email())
 */
export const zodSanitizeEmail = (val: unknown): unknown => {
  if (typeof val === 'string') {
    return sanitizeEmail(val);
  }
  return val;
};

/**
 * Zod preprocessor for URLs
 * Usage: z.preprocess(zodSanitizeUrl, z.string().url())
 */
export const zodSanitizeUrl = (val: unknown): unknown => {
  if (typeof val === 'string') {
    return sanitizeUrl(val);
  }
  return val;
};

/**
 * Create a sanitized string schema
 * @param options - Schema options
 * @returns A Zod schema that sanitizes input
 */
export function createSanitizedStringSchema(options?: {
  minLength?: number;
  maxLength?: number;
  multiline?: boolean;
}) {
  const { minLength = 0, maxLength = 500, multiline = false } = options || {};

  return z.preprocess(
    multiline ? zodSanitizeMultiline : zodSanitizeString,
    z.string().min(minLength).max(maxLength)
  );
}

// ============================================================================
// API Route Helpers
// ============================================================================

export interface SanitizedBody<T> {
  data: T;
  sanitized: boolean;
  warnings: string[];
}

/**
 * Parse and sanitize a JSON request body
 * @param request - The incoming request
 * @param schema - Zod schema for validation
 * @param options - Sanitization options
 * @returns The validated and sanitized data
 */
export async function parseAndSanitizeBody<T extends z.ZodType>(
  request: Request,
  schema: T,
  options?: {
    multilineFields?: string[];
    skipFields?: string[];
  }
): Promise<
  | { success: true; data: z.infer<T> }
  | { success: false; error: { message: string; details?: z.ZodError['issues'] } }
> {
  try {
    const body = await request.json();

    // Sanitize the raw body first
    const sanitized =
      typeof body === 'object' && body !== null
        ? sanitizeObject(body, {
            multilineFields: options?.multilineFields || ['notes', 'description', 'content', 'message'],
            skipFields: options?.skipFields || ['password', 'token', 'secret'],
          })
        : body;

    // Then validate with Zod
    const result = schema.safeParse(sanitized);

    if (!result.success) {
      return {
        success: false,
        error: {
          message: 'Invalid request data',
          details: result.error.issues,
        },
      };
    }

    return { success: true, data: result.data };
  } catch (error) {
    if (error instanceof SyntaxError) {
      return {
        success: false,
        error: { message: 'Invalid JSON in request body' },
      };
    }
    throw error;
  }
}

// ============================================================================
// SQL Injection Prevention (Additional Layer)
// ============================================================================

/**
 * Check if a string contains potential SQL injection patterns
 * Note: This is a secondary check - always use parameterized queries
 * @param input - The string to check
 * @returns true if suspicious patterns detected
 */
export function hasSqlInjectionPatterns(input: string): boolean {
  const patterns = [
    /'\s*OR\s+'?\d*'?\s*=\s*'?\d*'?/i, // ' OR '1'='1
    /'\s*OR\s+1\s*=\s*1/i, // ' OR 1=1
    /;\s*(DROP|DELETE|UPDATE|INSERT|ALTER|TRUNCATE)\s/i, // SQL commands
    /UNION\s+(ALL\s+)?SELECT/i, // UNION injection
    /--\s*$/, // SQL comment at end
    /\/\*[\s\S]*?\*\//, // SQL block comment
    /'\s*;\s*--/, // Comment injection
    /xp_cmdshell/i, // SQL Server command execution
    /EXEC\s*\(/i, // Execute command
  ];

  return patterns.some((pattern) => pattern.test(input));
}

/**
 * Validate that input doesn't contain SQL injection patterns
 * Throws an error if suspicious patterns are detected
 * @param input - The string to validate
 * @param fieldName - The field name for error messages
 */
export function validateNoSqlInjection(input: string, fieldName = 'Input'): void {
  if (hasSqlInjectionPatterns(input)) {
    throw new Error(`${fieldName} contains invalid characters`);
  }
}

// ============================================================================
// Export Types
// ============================================================================

export type SanitizeOptions = {
  escapeHtml?: boolean;
  allowNewlines?: boolean;
  maxLength?: number;
  trim?: boolean;
};

export type ObjectSanitizeOptions = {
  multilineFields?: string[];
  skipFields?: string[];
  maxLength?: number;
};
