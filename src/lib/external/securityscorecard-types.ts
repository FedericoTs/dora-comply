/**
 * SecurityScorecard API Types
 *
 * Type definitions for SecurityScorecard continuous monitoring integration.
 * Based on SecurityScorecard API v2 documentation.
 */

// =============================================================================
// CORE TYPES
// =============================================================================

/**
 * SecurityScorecard letter grades (A-F)
 */
export type SSCGrade = 'A' | 'B' | 'C' | 'D' | 'F';

/**
 * Risk factor categories tracked by SecurityScorecard
 */
export type SSCFactorName =
  | 'network_security'
  | 'dns_health'
  | 'patching_cadence'
  | 'endpoint_security'
  | 'ip_reputation'
  | 'application_security'
  | 'cubit_score'
  | 'hacker_chatter'
  | 'leaked_credentials'
  | 'social_engineering';

/**
 * Human-readable factor names mapping
 */
export const SSC_FACTOR_LABELS: Record<SSCFactorName, string> = {
  network_security: 'Network Security',
  dns_health: 'DNS Health',
  patching_cadence: 'Patching Cadence',
  endpoint_security: 'Endpoint Security',
  ip_reputation: 'IP Reputation',
  application_security: 'Application Security',
  cubit_score: 'Cubit Score',
  hacker_chatter: 'Hacker Chatter',
  leaked_credentials: 'Leaked Credentials',
  social_engineering: 'Social Engineering',
};

/**
 * Factor descriptions for UI tooltips
 */
export const SSC_FACTOR_DESCRIPTIONS: Record<SSCFactorName, string> = {
  network_security: 'Open ports, SSL certificates, and network configuration',
  dns_health: 'DNS configuration security including SPF, DKIM, DMARC',
  patching_cadence: 'How quickly vulnerabilities are patched',
  endpoint_security: 'Security of employee devices and endpoints',
  ip_reputation: 'Association with malicious IP addresses',
  application_security: 'Web application security vulnerabilities',
  cubit_score: 'Proprietary threat intelligence score',
  hacker_chatter: 'Mentions in hacker forums and dark web',
  leaked_credentials: 'Employee credentials found in breaches',
  social_engineering: 'Susceptibility to phishing and social attacks',
};

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

/**
 * Individual risk factor with score and details
 */
export interface SSCFactor {
  name: SSCFactorName;
  score: number;           // 0-100
  grade: SSCGrade;
  issueCount: number;
  issueSeverity?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Company scorecard response
 */
export interface SSCScorecard {
  domain: string;
  name: string;
  score: number;           // 0-100
  grade: SSCGrade;
  industry: string;
  industryAverage?: number;
  size?: 'small' | 'medium' | 'large' | 'enterprise';
  factors: SSCFactor[];
  lastUpdated: string;     // ISO timestamp
  scoreHistory?: SSCHistoryEntry[];
}

/**
 * Company lookup response (basic info)
 */
export interface SSCCompany {
  domain: string;
  name: string;
  industry: string;
  size?: string;
  headquarters?: {
    country: string;
    city?: string;
  };
  employeeCount?: number;
  website?: string;
}

/**
 * Historical score entry
 */
export interface SSCHistoryEntry {
  date: string;            // ISO date
  score: number;
  grade: SSCGrade;
  factors?: SSCFactor[];
}

/**
 * Issue/finding from SecurityScorecard
 */
export interface SSCIssue {
  id: string;
  type: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  factorName: SSCFactorName;
  title: string;
  description?: string;
  firstSeen: string;
  lastSeen: string;
  status: 'active' | 'resolved';
  affectedAssets?: string[];
}

// =============================================================================
// CLIENT TYPES
// =============================================================================

/**
 * API client configuration
 */
export interface SSCClientConfig {
  apiKey: string;
  baseUrl?: string;
  timeout?: number;
  cacheTTL?: number;       // Cache time-to-live in ms
}

/**
 * API error response
 */
export interface SSCApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Result wrapper for API calls
 */
export interface SSCResult<T> {
  success: boolean;
  data?: T;
  error?: SSCApiError;
  cached?: boolean;
  cachedAt?: string;
}

// =============================================================================
// MONITORING TYPES
// =============================================================================

/**
 * Monitoring alert types
 */
export type MonitoringAlertType =
  | 'score_drop'
  | 'grade_change'
  | 'threshold_breach'
  | 'critical_finding'
  | 'score_improvement';

/**
 * Alert severity levels
 */
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

/**
 * Monitoring alert for score changes
 */
export interface MonitoringAlert {
  id: string;
  vendorId: string;
  vendorName: string;
  alertType: MonitoringAlertType;
  severity: AlertSeverity;
  previousScore: number;
  currentScore: number;
  previousGrade: SSCGrade;
  currentGrade: SSCGrade;
  scoreChange: number;
  title: string;
  message: string;
  createdAt: string;
  status: 'active' | 'acknowledged' | 'resolved' | 'dismissed';
}

/**
 * Vendor monitoring configuration
 */
export interface VendorMonitoringConfig {
  vendorId: string;
  domain: string;
  enabled: boolean;
  alertThreshold: number;
  lastSync?: string;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate grade from numeric score
 */
export function scoreToGrade(score: number): SSCGrade {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

/**
 * Get color for grade (for UI)
 */
export function gradeToColor(grade: SSCGrade): string {
  const colors: Record<SSCGrade, string> = {
    A: '#10B981', // Green
    B: '#3B82F6', // Blue
    C: '#F59E0B', // Amber
    D: '#F97316', // Orange
    F: '#EF4444', // Red
  };
  return colors[grade];
}

/**
 * Get descriptive label for grade
 */
export function gradeToLabel(grade: SSCGrade): string {
  const labels: Record<SSCGrade, string> = {
    A: 'Excellent',
    B: 'Good',
    C: 'Average',
    D: 'Below Average',
    F: 'Poor',
  };
  return labels[grade];
}

/**
 * Get Tailwind color class for grade
 */
export function gradeToTailwindColor(grade: SSCGrade): string {
  const colors: Record<SSCGrade, string> = {
    A: 'text-green-500',
    B: 'text-blue-500',
    C: 'text-amber-500',
    D: 'text-orange-500',
    F: 'text-red-500',
  };
  return colors[grade];
}

/**
 * Get background color class for grade
 */
export function gradeToBgColor(grade: SSCGrade): string {
  const colors: Record<SSCGrade, string> = {
    A: 'bg-green-500/10',
    B: 'bg-blue-500/10',
    C: 'bg-amber-500/10',
    D: 'bg-orange-500/10',
    F: 'bg-red-500/10',
  };
  return colors[grade];
}

/**
 * Format score change with arrow indicator
 */
export function formatScoreChange(change: number): string {
  if (change > 0) return `↑ +${change}`;
  if (change < 0) return `↓ ${change}`;
  return '→ 0';
}

/**
 * Determine alert severity from score/grade changes
 */
export function calculateAlertSeverity(
  oldScore: number,
  newScore: number,
  oldGrade: SSCGrade,
  newGrade: SSCGrade
): AlertSeverity {
  const scoreDrop = oldScore - newScore;
  const gradeOrder: SSCGrade[] = ['A', 'B', 'C', 'D', 'F'];
  const oldIndex = gradeOrder.indexOf(oldGrade);
  const newIndex = gradeOrder.indexOf(newGrade);
  const gradeDrop = newIndex - oldIndex;

  // Critical: Grade dropped 2+ levels or score dropped 20+
  if (gradeDrop >= 2 || scoreDrop >= 20) return 'critical';
  // High: Grade dropped 1 level or score dropped 15+
  if (gradeDrop >= 1 || scoreDrop >= 15) return 'high';
  // Medium: Score dropped 10+
  if (scoreDrop >= 10) return 'medium';
  // Low: Minor changes
  return 'low';
}

// Alias for backward compatibility
export const FACTOR_DESCRIPTIONS = SSC_FACTOR_DESCRIPTIONS;
