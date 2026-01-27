/**
 * Have I Been Pwned (HIBP) Types
 *
 * Type definitions for HIBP breach exposure checking.
 * Used to assess vendor domain exposure in known data breaches.
 */

// =============================================================================
// CORE TYPES
// =============================================================================

/**
 * Data breach information from HIBP
 */
export interface HIBPBreach {
  Name: string;              // Breach identifier (e.g., "Adobe")
  Title: string;             // Human-readable name
  Domain: string;            // Domain of the breached site
  BreachDate: string;        // Date breach occurred (YYYY-MM-DD)
  AddedDate: string;         // Date added to HIBP
  ModifiedDate: string;      // Last modification date
  PwnCount: number;          // Number of accounts exposed
  Description: string;       // HTML description
  LogoPath: string;          // Path to breach logo
  DataClasses: string[];     // Types of data exposed
  IsVerified: boolean;       // Whether breach is verified
  IsFabricated: boolean;     // Whether breach is known fabrication
  IsSensitive: boolean;      // Whether breach is sensitive
  IsRetired: boolean;        // Whether breach has been retired
  IsSpamList: boolean;       // Whether breach is a spam list
  IsMalware: boolean;        // Whether breach was via malware
  IsSubscriptionFree: boolean; // Available in free subscription
}

/**
 * Simplified breach for display
 */
export interface BreachSummary {
  name: string;
  domain: string;
  breachDate: string;
  pwnCount: number;
  dataClasses: string[];
  severity: BreachSeverity;
  isVerified: boolean;
}

/**
 * Breach severity levels
 */
export type BreachSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Data classes that indicate high severity
 */
export const HIGH_SEVERITY_DATA_CLASSES = [
  'Passwords',
  'Password hints',
  'Credit cards',
  'Bank account numbers',
  'Social security numbers',
  'Government issued IDs',
  'Passport numbers',
  'Biometric data',
  'Security questions and answers',
];

/**
 * Data classes that indicate medium severity
 */
export const MEDIUM_SEVERITY_DATA_CLASSES = [
  'Email addresses',
  'Phone numbers',
  'Physical addresses',
  'Dates of birth',
  'Employment',
  'Education',
  'Income levels',
  'Purchases',
];

// =============================================================================
// RESULT TYPES
// =============================================================================

/**
 * Domain breach check result
 */
export interface DomainBreachResult {
  domain: string;
  breachCount: number;
  totalPwned: number;
  breaches: BreachSummary[];
  severity: BreachSeverity;
  checkedAt: string;
  fromCache: boolean;
}

/**
 * API error response
 */
export interface HIBPApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Result wrapper for API calls
 */
export interface HIBPResult<T> {
  success: boolean;
  data?: T;
  error?: HIBPApiError;
  cached?: boolean;
  cachedAt?: string;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate breach severity based on data classes and count
 */
export function calculateBreachSeverity(
  dataClasses: string[],
  pwnCount: number
): BreachSeverity {
  // Check for critical data
  const hasCriticalData = dataClasses.some((dc) =>
    HIGH_SEVERITY_DATA_CLASSES.includes(dc)
  );

  // Large breach with critical data = critical
  if (hasCriticalData && pwnCount > 1000000) {
    return 'critical';
  }

  // Critical data = high
  if (hasCriticalData) {
    return 'high';
  }

  // Large breach = high
  if (pwnCount > 10000000) {
    return 'high';
  }

  // Medium-sized breach or sensitive data = medium
  const hasMediumData = dataClasses.some((dc) =>
    MEDIUM_SEVERITY_DATA_CLASSES.includes(dc)
  );
  if (hasMediumData || pwnCount > 100000) {
    return 'medium';
  }

  return 'low';
}

/**
 * Calculate overall severity from multiple breaches
 */
export function calculateOverallSeverity(
  breaches: BreachSummary[]
): BreachSeverity {
  if (breaches.length === 0) return 'low';

  const severityOrder: BreachSeverity[] = ['low', 'medium', 'high', 'critical'];
  let maxIndex = 0;

  for (const breach of breaches) {
    const index = severityOrder.indexOf(breach.severity);
    if (index > maxIndex) {
      maxIndex = index;
    }
  }

  // Increase severity based on breach count
  if (breaches.length >= 5 && maxIndex < 3) {
    maxIndex = Math.min(maxIndex + 1, 3);
  }

  return severityOrder[maxIndex];
}

/**
 * Get Tailwind color for severity
 */
export function severityToColor(severity: BreachSeverity): string {
  const colors: Record<BreachSeverity, string> = {
    low: 'text-green-600',
    medium: 'text-yellow-600',
    high: 'text-orange-600',
    critical: 'text-red-600',
  };
  return colors[severity];
}

/**
 * Get background color for severity
 */
export function severityToBgColor(severity: BreachSeverity): string {
  const colors: Record<BreachSeverity, string> = {
    low: 'bg-green-500/10',
    medium: 'bg-yellow-500/10',
    high: 'bg-orange-500/10',
    critical: 'bg-red-500/10',
  };
  return colors[severity];
}

/**
 * Get severity label
 */
export function severityToLabel(severity: BreachSeverity): string {
  const labels: Record<BreachSeverity, string> = {
    low: 'Low Risk',
    medium: 'Medium Risk',
    high: 'High Risk',
    critical: 'Critical Risk',
  };
  return labels[severity];
}

/**
 * Format breach count for display
 */
export function formatPwnCount(count: number): string {
  if (count >= 1000000000) {
    return `${(count / 1000000000).toFixed(1)}B`;
  }
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

/**
 * Get icon for data class
 */
export function dataClassToIcon(dataClass: string): string {
  const iconMap: Record<string, string> = {
    Passwords: 'key',
    'Email addresses': 'mail',
    'Phone numbers': 'phone',
    'Physical addresses': 'map-pin',
    'Credit cards': 'credit-card',
    'Bank account numbers': 'building-bank',
    'Dates of birth': 'calendar',
    Usernames: 'user',
    Names: 'user',
    'IP addresses': 'globe',
    'Social security numbers': 'id-card',
    'Government issued IDs': 'id-card',
  };
  return iconMap[dataClass] || 'file';
}

/**
 * Sort breaches by severity and date
 */
export function sortBreaches(breaches: BreachSummary[]): BreachSummary[] {
  const severityOrder: BreachSeverity[] = ['critical', 'high', 'medium', 'low'];

  return [...breaches].sort((a, b) => {
    // Sort by severity first
    const severityDiff =
      severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity);
    if (severityDiff !== 0) return severityDiff;

    // Then by date (newest first)
    return new Date(b.breachDate).getTime() - new Date(a.breachDate).getTime();
  });
}

/**
 * Filter to only verified, non-spam breaches
 */
export function filterRelevantBreaches(breaches: HIBPBreach[]): HIBPBreach[] {
  return breaches.filter(
    (b) => b.IsVerified && !b.IsSpamList && !b.IsFabricated && !b.IsRetired
  );
}
