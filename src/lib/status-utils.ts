/**
 * Centralized status styling utilities
 *
 * This module provides consistent status-to-style mappings across the application.
 * All status display should use these utilities to ensure visual consistency.
 *
 * Design system colors:
 * - Success/Low Risk: emerald (--success: #10B981)
 * - Warning/Medium Risk: amber (--warning: #F59E0B)
 * - Error/High Risk: orange (--risk-high: #F97316)
 * - Critical: red (--error: #EF4444)
 * - Info: blue (--info: #3B82F6)
 * - Neutral: gray
 */

// =============================================================================
// CORE STATUS TYPES
// =============================================================================

export type StatusLevel = 'success' | 'warning' | 'error' | 'critical' | 'info' | 'neutral' | 'pending';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

// =============================================================================
// STATUS CONFIG TYPES
// =============================================================================

export interface StatusConfig {
  label: string;
  color: string;           // Text color class
  bgColor: string;         // Background color class
  borderColor?: string;    // Optional border color
  dotColor?: string;       // For status dots
  hexColor?: string;       // For charts/exports
}

// =============================================================================
// RISK LEVEL CONFIGURATION
// Single source of truth for risk level styling (consolidates 3 implementations)
// =============================================================================

export const RISK_LEVEL_CONFIG: Record<RiskLevel, StatusConfig> = {
  low: {
    label: 'Low',
    color: 'text-emerald-700 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    dotColor: 'bg-emerald-500',
    hexColor: '#10B981',
  },
  medium: {
    label: 'Medium',
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
    dotColor: 'bg-amber-500',
    hexColor: '#F59E0B',
  },
  high: {
    label: 'High',
    color: 'text-orange-700 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    borderColor: 'border-orange-200 dark:border-orange-800',
    dotColor: 'bg-orange-500',
    hexColor: '#F97316',
  },
  critical: {
    label: 'Critical',
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    borderColor: 'border-red-200 dark:border-red-800',
    dotColor: 'bg-red-500',
    hexColor: '#EF4444',
  },
};

// =============================================================================
// GENERAL STATUS CONFIGURATION
// For generic success/warning/error states
// =============================================================================

export const GENERAL_STATUS_CONFIG: Record<StatusLevel, StatusConfig> = {
  success: {
    label: 'Success',
    color: 'text-emerald-700 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    dotColor: 'bg-emerald-500',
    hexColor: '#10B981',
  },
  warning: {
    label: 'Warning',
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    dotColor: 'bg-amber-500',
    hexColor: '#F59E0B',
  },
  error: {
    label: 'Error',
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    dotColor: 'bg-red-500',
    hexColor: '#EF4444',
  },
  critical: {
    label: 'Critical',
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    dotColor: 'bg-red-600',
    hexColor: '#DC2626',
  },
  info: {
    label: 'Info',
    color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    dotColor: 'bg-blue-500',
    hexColor: '#3B82F6',
  },
  neutral: {
    label: 'Neutral',
    color: 'text-gray-700 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    dotColor: 'bg-gray-400',
    hexColor: '#9CA3AF',
  },
  pending: {
    label: 'Pending',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    dotColor: 'bg-gray-400',
    hexColor: '#9CA3AF',
  },
};

// =============================================================================
// COMPLIANCE STATUS CONFIGURATION
// =============================================================================

export type ComplianceStatus = 'compliant' | 'partial' | 'gap' | 'not_assessed';

export const COMPLIANCE_STATUS_CONFIG: Record<ComplianceStatus, StatusConfig> = {
  compliant: {
    label: 'Compliant',
    color: 'text-emerald-700 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    dotColor: 'bg-emerald-500',
    hexColor: '#10B981',
  },
  partial: {
    label: 'Partial',
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    dotColor: 'bg-amber-500',
    hexColor: '#F59E0B',
  },
  gap: {
    label: 'Gap',
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    dotColor: 'bg-red-500',
    hexColor: '#EF4444',
  },
  not_assessed: {
    label: 'Not Assessed',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    dotColor: 'bg-gray-400',
    hexColor: '#9CA3AF',
  },
};

// =============================================================================
// VENDOR TIER CONFIGURATION
// =============================================================================

export type VendorTier = 'critical' | 'important' | 'standard';

export const VENDOR_TIER_CONFIG: Record<VendorTier, StatusConfig> = {
  critical: {
    label: 'Critical',
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    dotColor: 'bg-red-500',
    hexColor: '#EF4444',
  },
  important: {
    label: 'Important',
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    dotColor: 'bg-amber-500',
    hexColor: '#F59E0B',
  },
  standard: {
    label: 'Standard',
    color: 'text-gray-700 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    dotColor: 'bg-gray-400',
    hexColor: '#9CA3AF',
  },
};

// =============================================================================
// VENDOR STATUS CONFIGURATION
// =============================================================================

export type VendorStatus = 'active' | 'pending' | 'inactive' | 'offboarding';

export const VENDOR_STATUS_CONFIG: Record<VendorStatus, StatusConfig> = {
  active: {
    label: 'Active',
    color: 'text-emerald-700 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    dotColor: 'bg-emerald-500',
    hexColor: '#10B981',
  },
  pending: {
    label: 'Pending',
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    dotColor: 'bg-amber-500',
    hexColor: '#F59E0B',
  },
  inactive: {
    label: 'Inactive',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    dotColor: 'bg-gray-400',
    hexColor: '#9CA3AF',
  },
  offboarding: {
    label: 'Offboarding',
    color: 'text-orange-700 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    dotColor: 'bg-orange-500',
    hexColor: '#F97316',
  },
};

// =============================================================================
// CONTRACT STATUS CONFIGURATION
// =============================================================================

export type ContractStatus = 'draft' | 'active' | 'expiring' | 'expired' | 'terminated';

export const CONTRACT_STATUS_CONFIG: Record<ContractStatus, StatusConfig> = {
  draft: {
    label: 'Draft',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    dotColor: 'bg-gray-400',
    hexColor: '#9CA3AF',
  },
  active: {
    label: 'Active',
    color: 'text-emerald-700 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    dotColor: 'bg-emerald-500',
    hexColor: '#10B981',
  },
  expiring: {
    label: 'Expiring Soon',
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    dotColor: 'bg-amber-500',
    hexColor: '#F59E0B',
  },
  expired: {
    label: 'Expired',
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    dotColor: 'bg-red-500',
    hexColor: '#EF4444',
  },
  terminated: {
    label: 'Terminated',
    color: 'text-gray-700 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    dotColor: 'bg-gray-500',
    hexColor: '#6B7280',
  },
};

// =============================================================================
// DOCUMENT STATUS CONFIGURATION
// =============================================================================

export type DocumentStatus = 'active' | 'expiring' | 'expired' | 'processing' | 'failed' | 'pending';

export const DOCUMENT_STATUS_CONFIG: Record<DocumentStatus, StatusConfig> = {
  active: {
    label: 'Active',
    color: 'text-emerald-700 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    dotColor: 'bg-emerald-500',
    hexColor: '#10B981',
  },
  expiring: {
    label: 'Expiring Soon',
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    dotColor: 'bg-amber-500',
    hexColor: '#F59E0B',
  },
  expired: {
    label: 'Expired',
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    dotColor: 'bg-red-500',
    hexColor: '#EF4444',
  },
  processing: {
    label: 'Processing',
    color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    dotColor: 'bg-blue-500',
    hexColor: '#3B82F6',
  },
  failed: {
    label: 'Failed',
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    dotColor: 'bg-red-500',
    hexColor: '#EF4444',
  },
  pending: {
    label: 'Pending',
    color: 'text-gray-600 dark:text-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    dotColor: 'bg-gray-400',
    hexColor: '#9CA3AF',
  },
};

// =============================================================================
// INCIDENT STATUS CONFIGURATION
// =============================================================================

export type IncidentStatus = 'detected' | 'contained' | 'investigating' | 'remediated' | 'closed';

export const INCIDENT_STATUS_CONFIG: Record<IncidentStatus, StatusConfig> = {
  detected: {
    label: 'Detected',
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    dotColor: 'bg-red-500',
    hexColor: '#EF4444',
  },
  contained: {
    label: 'Contained',
    color: 'text-orange-700 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    dotColor: 'bg-orange-500',
    hexColor: '#F97316',
  },
  investigating: {
    label: 'Investigating',
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    dotColor: 'bg-amber-500',
    hexColor: '#F59E0B',
  },
  remediated: {
    label: 'Remediated',
    color: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    dotColor: 'bg-blue-500',
    hexColor: '#3B82F6',
  },
  closed: {
    label: 'Closed',
    color: 'text-emerald-700 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    dotColor: 'bg-emerald-500',
    hexColor: '#10B981',
  },
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Converts a numeric score (0-100) to a risk level
 */
export function scoreToRiskLevel(score: number): RiskLevel {
  if (score >= 80) return 'low';
  if (score >= 60) return 'medium';
  if (score >= 40) return 'high';
  return 'critical';
}

/**
 * Converts a numeric score (0-100) to a status level
 */
export function scoreToStatusLevel(score: number): StatusLevel {
  if (score >= 80) return 'success';
  if (score >= 60) return 'warning';
  return 'error';
}

/**
 * Converts a numeric score (0-100) to a letter grade
 */
export function scoreToGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

/**
 * Gets the status config for a given score
 */
export function getScoreConfig(score: number): StatusConfig {
  const level = scoreToStatusLevel(score);
  return GENERAL_STATUS_CONFIG[level];
}

/**
 * Gets the risk config for a given score
 */
export function getRiskConfig(score: number): StatusConfig {
  const level = scoreToRiskLevel(score);
  return RISK_LEVEL_CONFIG[level];
}

/**
 * Get status config with fallback for unknown values
 */
export function getStatusConfig<T extends string>(
  config: Record<T, StatusConfig>,
  status: T | string | null | undefined,
  fallback: T
): StatusConfig {
  if (!status || !(status in config)) {
    return config[fallback];
  }
  return config[status as T];
}

/**
 * Gets combined badge classes for a status config
 */
export function getBadgeClasses(config: StatusConfig): string {
  return `${config.bgColor} ${config.color}`;
}

/**
 * Gets combined dot classes for a status config
 */
export function getDotClasses(config: StatusConfig, size: 'sm' | 'md' | 'lg' = 'md'): string {
  const sizeClasses = {
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
    lg: 'h-3 w-3',
  };
  return `${config.dotColor} ${sizeClasses[size]} rounded-full`;
}

// =============================================================================
// CHART COLOR EXPORTS (for Recharts, etc.)
// =============================================================================

export const CHART_COLORS = {
  risk: {
    low: '#10B981',      // emerald-500
    medium: '#F59E0B',   // amber-500
    high: '#F97316',     // orange-500
    critical: '#EF4444', // red-500
  },
  status: {
    success: '#10B981',  // emerald-500
    warning: '#F59E0B',  // amber-500
    error: '#EF4444',    // red-500
    info: '#3B82F6',     // blue-500
    neutral: '#9CA3AF',  // gray-400
  },
  compliance: {
    compliant: '#10B981',    // emerald-500
    partial: '#F59E0B',      // amber-500
    gap: '#EF4444',          // red-500
    not_assessed: '#9CA3AF', // gray-400
  },
  tier: {
    critical: '#EF4444',  // red-500
    important: '#F59E0B', // amber-500
    standard: '#9CA3AF',  // gray-400
  },
} as const;
