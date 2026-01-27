/**
 * Framework Deadline Utilities
 *
 * Provides deadline information for each compliance framework.
 * Used by the dashboard to show countdown or enforcement status.
 */

import type { FrameworkCode } from '@/lib/licensing/types';

// =============================================================================
// Types
// =============================================================================

export interface FrameworkDeadlineConfig {
  /** Enforcement/compliance date (null if ongoing) */
  date: Date | null;
  /** Whether the deadline has passed and regulation is enforced */
  isEnforced: boolean | null;
  /** Short label for the deadline */
  label: string;
  /** Days before deadline to show warning styling */
  urgentThreshold: number;
}

export interface DeadlineInfo {
  date: Date | null;
  isEnforced: boolean;
  daysRemaining: number;
  displayText: string;
  urgencyLevel: 'critical' | 'warning' | 'normal' | 'enforced' | 'none';
}

// =============================================================================
// Framework Deadline Configuration
// =============================================================================

export const FRAMEWORK_DEADLINES: Record<FrameworkCode, FrameworkDeadlineConfig> = {
  dora: {
    date: new Date('2026-01-17'),
    isEnforced: false,
    label: 'DORA Deadline',
    urgentThreshold: 90,
  },
  nis2: {
    date: new Date('2024-10-17'),
    isEnforced: true,
    label: 'NIS2 Enforced',
    urgentThreshold: 0,
  },
  gdpr: {
    date: new Date('2018-05-25'),
    isEnforced: true,
    label: 'GDPR Active',
    urgentThreshold: 0,
  },
  iso27001: {
    date: null,
    isEnforced: null,
    label: 'Certification-Based',
    urgentThreshold: 0,
  },
};

// =============================================================================
// Deadline Calculation Functions
// =============================================================================

/**
 * Get comprehensive deadline information for a framework
 */
export function getFrameworkDeadline(framework: FrameworkCode): DeadlineInfo {
  const config = FRAMEWORK_DEADLINES[framework];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Handle frameworks without deadlines (ISO 27001)
  if (config.date === null || config.isEnforced === null) {
    return {
      date: null,
      isEnforced: false,
      daysRemaining: 0,
      displayText: config.label,
      urgencyLevel: 'none',
    };
  }

  // Handle already enforced regulations
  if (config.isEnforced) {
    return {
      date: config.date,
      isEnforced: true,
      daysRemaining: 0,
      displayText: config.label,
      urgencyLevel: 'enforced',
    };
  }

  // Calculate days remaining for upcoming deadlines
  const deadlineDate = new Date(config.date);
  deadlineDate.setHours(0, 0, 0, 0);

  const diffMs = deadlineDate.getTime() - today.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  // Determine urgency level
  let urgencyLevel: DeadlineInfo['urgencyLevel'];
  if (daysRemaining <= 0) {
    urgencyLevel = 'enforced';
  } else if (daysRemaining <= 30) {
    urgencyLevel = 'critical';
  } else if (daysRemaining <= config.urgentThreshold) {
    urgencyLevel = 'warning';
  } else {
    urgencyLevel = 'normal';
  }

  // Build display text
  let displayText: string;
  if (daysRemaining <= 0) {
    displayText = `${config.label} - Now Enforced`;
  } else if (daysRemaining === 1) {
    displayText = `1 day to ${config.label}`;
  } else {
    displayText = `${daysRemaining} days to ${config.label}`;
  }

  return {
    date: config.date,
    isEnforced: daysRemaining <= 0,
    daysRemaining,
    displayText,
    urgencyLevel,
  };
}

/**
 * Get deadline display styling classes based on urgency
 */
export function getDeadlineStyles(urgencyLevel: DeadlineInfo['urgencyLevel']): {
  bg: string;
  text: string;
  border: string;
  icon: string;
} {
  switch (urgencyLevel) {
    case 'critical':
      return {
        bg: 'bg-red-50 dark:bg-red-950/30',
        text: 'text-red-800 dark:text-red-200',
        border: 'border-red-200 dark:border-red-800',
        icon: 'text-red-600 dark:text-red-400',
      };
    case 'warning':
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/30',
        text: 'text-amber-800 dark:text-amber-200',
        border: 'border-amber-200 dark:border-amber-800',
        icon: 'text-amber-600 dark:text-amber-400',
      };
    case 'enforced':
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/30',
        text: 'text-emerald-800 dark:text-emerald-200',
        border: 'border-emerald-200 dark:border-emerald-800',
        icon: 'text-emerald-600 dark:text-emerald-400',
      };
    case 'none':
      return {
        bg: 'bg-muted',
        text: 'text-muted-foreground',
        border: 'border-border',
        icon: 'text-muted-foreground',
      };
    case 'normal':
    default:
      return {
        bg: 'bg-blue-50 dark:bg-blue-950/30',
        text: 'text-blue-800 dark:text-blue-200',
        border: 'border-blue-200 dark:border-blue-800',
        icon: 'text-blue-600 dark:text-blue-400',
      };
  }
}

/**
 * Get the formatted deadline date string
 */
export function formatDeadlineDate(framework: FrameworkCode): string {
  const config = FRAMEWORK_DEADLINES[framework];

  if (!config.date) {
    return 'No fixed deadline';
  }

  return config.date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Check if deadline should be shown (hide for enforced/no-deadline frameworks)
 */
export function shouldShowDeadlineCountdown(framework: FrameworkCode): boolean {
  const config = FRAMEWORK_DEADLINES[framework];
  return config.date !== null && !config.isEnforced;
}
