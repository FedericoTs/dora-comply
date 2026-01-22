/**
 * Centralized date formatting utilities
 *
 * This module provides consistent date formatting across the application.
 * All date display should use these utilities to ensure locale consistency.
 *
 * Default locale: 'en-GB' (European format for DORA/NIS2 compliance focus)
 */

// Default locale for the application (EU-focused for DORA/NIS2)
const DEFAULT_LOCALE = 'en-GB';

/**
 * Converts a Date or ISO string to YYYY-MM-DD format
 * Replaces 80+ occurrences of .toISOString().split('T')[0]
 */
export function toDateString(date: Date | string | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

/**
 * Converts a Date or ISO string to YYYY-MM-DD format, returns null if invalid
 * For database fields and regulatory exports where null is meaningful
 */
export function toDateStringOrNull(date: Date | string | null | undefined): string | null {
  if (!date) return null;
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
}

/**
 * Formats a date for display (e.g., "22 Jan 2026")
 * Consistent locale-based formatting for user-facing dates
 */
export function formatDisplayDate(
  date: Date | string | null | undefined,
  options?: {
    locale?: string;
    includeYear?: boolean;
    includeTime?: boolean;
  }
): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  const locale = options?.locale ?? DEFAULT_LOCALE;
  const includeYear = options?.includeYear ?? true;
  const includeTime = options?.includeTime ?? false;

  const dateOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    ...(includeYear && { year: 'numeric' }),
    ...(includeTime && { hour: '2-digit', minute: '2-digit' }),
  };

  return d.toLocaleDateString(locale, dateOptions);
}

/**
 * Formats a date with full datetime (e.g., "22 Jan 2026, 14:30:00")
 * Used for detailed timestamps in exports and reports
 */
export function formatDateTime(
  date: Date | string | null | undefined,
  options?: { locale?: string; includeSeconds?: boolean }
): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  const locale = options?.locale ?? DEFAULT_LOCALE;
  const includeSeconds = options?.includeSeconds ?? true;

  return d.toLocaleString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...(includeSeconds && { second: '2-digit' }),
  });
}

/**
 * Formats an ISO string for HTML datetime-local input
 * Takes first 16 characters (YYYY-MM-DDTHH:MM)
 */
export function formatDateTimeLocal(isoString?: string | null): string {
  if (!isoString) return '';
  // Handle both ISO strings and already formatted datetime-local values
  if (isoString.length === 16 && !isoString.includes('Z')) {
    return isoString;
  }
  return isoString.slice(0, 16);
}

/**
 * Converts datetime-local input value to ISO string
 */
export function dateTimeLocalToISO(value: string): string {
  if (!value) return '';
  // If already ISO format, return as-is
  if (value.includes('Z') || value.includes('+')) {
    return value;
  }
  // Convert datetime-local (YYYY-MM-DDTHH:MM) to ISO
  return new Date(value).toISOString();
}

/**
 * Calculates relative time from now (e.g., "2 days ago", "in 3 hours")
 * Consolidates 3 separate implementations across the codebase
 */
export function formatRelativeTime(
  date: Date | string | null | undefined,
  options?: { addSuffix?: boolean }
): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffSeconds = Math.floor(Math.abs(diffMs) / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  const isPast = diffMs < 0;
  const addSuffix = options?.addSuffix ?? true;

  let relativeStr: string;

  if (diffSeconds < 60) {
    relativeStr = 'just now';
    return relativeStr;
  } else if (diffMinutes < 60) {
    relativeStr = diffMinutes === 1 ? '1 minute' : `${diffMinutes} minutes`;
  } else if (diffHours < 24) {
    relativeStr = diffHours === 1 ? '1 hour' : `${diffHours} hours`;
  } else if (diffDays < 7) {
    relativeStr = diffDays === 1 ? '1 day' : `${diffDays} days`;
  } else if (diffWeeks < 4) {
    relativeStr = diffWeeks === 1 ? '1 week' : `${diffWeeks} weeks`;
  } else if (diffMonths < 12) {
    relativeStr = diffMonths === 1 ? '1 month' : `${diffMonths} months`;
  } else {
    relativeStr = diffYears === 1 ? '1 year' : `${diffYears} years`;
  }

  if (!addSuffix) {
    return relativeStr;
  }

  return isPast ? `${relativeStr} ago` : `in ${relativeStr}`;
}

/**
 * Gets the number of days until a date (positive = future, negative = past)
 */
export function getDaysUntil(date: Date | string | null | undefined): number | null {
  if (!date) return null;
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return null;

  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Formats countdown for deadlines (e.g., "2d 4h remaining")
 */
export function formatCountdown(
  targetDate: Date | string | null | undefined
): string {
  if (!targetDate) return '';
  const d = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
  if (isNaN(d.getTime())) return '';

  const now = new Date();
  const diffMs = d.getTime() - now.getTime();

  if (diffMs <= 0) return 'Overdue';

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  if (days > 0) {
    return `${days}d ${remainingHours}h remaining`;
  }
  return `${remainingHours}h remaining`;
}

/**
 * Formats hours for display (e.g., "12.5 hours" or "< 1 hour")
 */
export function formatHours(hours: number | null | undefined): string {
  if (hours === null || hours === undefined) return 'N/A';
  if (hours < 1) return '< 1 hour';
  if (hours === 1) return '1 hour';
  return `${hours.toFixed(1)} hours`;
}

/**
 * Checks if a date is in the past
 */
export function isPastDate(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return false;
  return d < new Date();
}

/**
 * Checks if a date is within N days from now
 */
export function isWithinDays(
  date: Date | string | null | undefined,
  days: number
): boolean {
  if (!date) return false;
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return false;

  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return d <= futureDate && d >= now;
}

/**
 * Gets start of day for a given date
 */
export function startOfDay(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Gets end of day for a given date
 */
export function endOfDay(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/**
 * Gets a date N days ago from now
 */
export function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

/**
 * Gets a date N days from now
 */
export function daysFromNow(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}
