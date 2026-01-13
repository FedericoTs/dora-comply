/**
 * UI Constants
 *
 * Shared styling constants, color mappings, and animation timings.
 * Import these instead of defining inline to maintain consistency.
 */

// ============================================================================
// Animation Timing
// ============================================================================

/** Standard animation delays for staggered reveals */
export const ANIMATION_DELAYS = {
  /** First element (badge, icon) */
  first: 0.1,
  /** Second element (heading) */
  second: 0.2,
  /** Third element (subheading, description) */
  third: 0.3,
  /** Fourth element (CTA, action) */
  fourth: 0.4,
  /** Fifth element (trust indicators, secondary) */
  fifth: 0.5,
  /** Sixth element */
  sixth: 0.6,
} as const;

/** Animation delay sequence for list items */
export const LIST_STAGGER_DELAY = 0.1; // 100ms between items

/** Standard animation durations in seconds */
export const ANIMATION_DURATIONS = {
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
  slower: 0.7,
} as const;

/** Get stagger delay for list item by index */
export function getStaggerDelay(index: number, baseDelay = 0): number {
  return baseDelay + index * LIST_STAGGER_DELAY;
}

// ============================================================================
// Status Colors & Badges
// ============================================================================

export type StatusType = 'success' | 'warning' | 'error' | 'info' | 'neutral';

/** Status color configuration */
export interface StatusConfig {
  bgClass: string;
  textClass: string;
  borderClass: string;
  dotClass: string;
}

export const STATUS_COLORS: Record<StatusType, StatusConfig> = {
  success: {
    bgClass: 'bg-success/10',
    textClass: 'text-success',
    borderClass: 'border-success/30',
    dotClass: 'bg-success',
  },
  warning: {
    bgClass: 'bg-warning/10',
    textClass: 'text-warning',
    borderClass: 'border-warning/30',
    dotClass: 'bg-warning',
  },
  error: {
    bgClass: 'bg-destructive/10',
    textClass: 'text-destructive',
    borderClass: 'border-destructive/30',
    dotClass: 'bg-destructive',
  },
  info: {
    bgClass: 'bg-info/10',
    textClass: 'text-info',
    borderClass: 'border-info/30',
    dotClass: 'bg-info',
  },
  neutral: {
    bgClass: 'bg-muted',
    textClass: 'text-muted-foreground',
    borderClass: 'border-border',
    dotClass: 'bg-muted-foreground',
  },
};

/** Get combined classes for a status badge */
export function getStatusBadgeClasses(status: StatusType): string {
  const config = STATUS_COLORS[status];
  return `${config.bgClass} ${config.textClass}`;
}

// ============================================================================
// Risk Level Colors
// ============================================================================

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low';

export interface RiskConfig {
  bgClass: string;
  textClass: string;
  borderClass: string;
  label: string;
}

export const RISK_COLORS: Record<RiskLevel, RiskConfig> = {
  critical: {
    bgClass: 'bg-red-500/10 dark:bg-red-500/20',
    textClass: 'text-red-700 dark:text-red-400',
    borderClass: 'border-red-500/30',
    label: 'Critical',
  },
  high: {
    bgClass: 'bg-orange-500/10 dark:bg-orange-500/20',
    textClass: 'text-orange-700 dark:text-orange-400',
    borderClass: 'border-orange-500/30',
    label: 'High',
  },
  medium: {
    bgClass: 'bg-yellow-500/10 dark:bg-yellow-500/20',
    textClass: 'text-yellow-700 dark:text-yellow-400',
    borderClass: 'border-yellow-500/30',
    label: 'Medium',
  },
  low: {
    bgClass: 'bg-blue-500/10 dark:bg-blue-500/20',
    textClass: 'text-blue-700 dark:text-blue-400',
    borderClass: 'border-blue-500/30',
    label: 'Low',
  },
};

// ============================================================================
// Vendor Tiers
// ============================================================================

export type VendorTier = 'critical' | 'important' | 'standard';

export interface TierConfig {
  label: string;
  description: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
}

export const VENDOR_TIER_CONFIG: Record<VendorTier, TierConfig> = {
  critical: {
    label: 'Critical',
    description: 'Essential ICT services - immediate business impact if unavailable',
    bgClass: 'bg-red-500/10',
    textClass: 'text-red-700 dark:text-red-400',
    borderClass: 'border-red-500/30',
  },
  important: {
    label: 'Important',
    description: 'Significant services - material impact within 24-72 hours',
    bgClass: 'bg-orange-500/10',
    textClass: 'text-orange-700 dark:text-orange-400',
    borderClass: 'border-orange-500/30',
  },
  standard: {
    label: 'Standard',
    description: 'Support services - limited immediate impact',
    bgClass: 'bg-blue-500/10',
    textClass: 'text-blue-700 dark:text-blue-400',
    borderClass: 'border-blue-500/30',
  },
};

// ============================================================================
// Document Types
// ============================================================================

export type DocumentType = 'soc2' | 'iso27001' | 'pentest' | 'contract' | 'other';

export interface DocumentTypeConfig {
  label: string;
  description: string;
  bgClass: string;
  textClass: string;
}

export const DOCUMENT_TYPE_CONFIG: Record<DocumentType, DocumentTypeConfig> = {
  soc2: {
    label: 'SOC 2 Report',
    description: 'Service Organization Control Type 2',
    bgClass: 'bg-purple-500/10',
    textClass: 'text-purple-700 dark:text-purple-400',
  },
  iso27001: {
    label: 'ISO 27001',
    description: 'Information Security Management System',
    bgClass: 'bg-blue-500/10',
    textClass: 'text-blue-700 dark:text-blue-400',
  },
  pentest: {
    label: 'Penetration Test',
    description: 'Security assessment report',
    bgClass: 'bg-orange-500/10',
    textClass: 'text-orange-700 dark:text-orange-400',
  },
  contract: {
    label: 'Contract',
    description: 'Legal agreement document',
    bgClass: 'bg-green-500/10',
    textClass: 'text-green-700 dark:text-green-400',
  },
  other: {
    label: 'Other',
    description: 'Miscellaneous document',
    bgClass: 'bg-gray-500/10',
    textClass: 'text-gray-700 dark:text-gray-400',
  },
};

// ============================================================================
// Breakpoints (match Tailwind defaults)
// ============================================================================

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

// ============================================================================
// Common Sizes
// ============================================================================

export const ICON_SIZES = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8',
} as const;

export const AVATAR_SIZES = {
  xs: 'h-6 w-6',
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
} as const;
