'use client';

/**
 * Risk Workflow Status Badge Component
 *
 * Displays a badge for risk workflow status (identified, assessed, treating, monitoring, closed).
 * This is specific to NIS2 risk register workflow states.
 *
 * Note: For general status badges, use @/components/ui/status-badge.tsx instead.
 */

import { cn } from '@/lib/utils';
import type { RiskStatus } from '@/lib/nis2/types';

const WORKFLOW_STATUS_CONFIG: Record<RiskStatus, { label: string; color: string; dotColor: string }> = {
  identified: {
    label: 'Identified',
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300',
    dotColor: 'bg-slate-500',
  },
  assessed: {
    label: 'Assessed',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    dotColor: 'bg-blue-500',
  },
  treating: {
    label: 'Treating',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    dotColor: 'bg-amber-500',
  },
  monitoring: {
    label: 'Monitoring',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    dotColor: 'bg-purple-500',
  },
  closed: {
    label: 'Closed',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    dotColor: 'bg-emerald-500',
  },
};

interface RiskWorkflowBadgeProps {
  status: RiskStatus;
  showDot?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function RiskWorkflowBadge({
  status,
  showDot = true,
  size = 'md',
  className,
}: RiskWorkflowBadgeProps) {
  const config = WORKFLOW_STATUS_CONFIG[status];

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-xs',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        config.color,
        sizeClasses[size],
        className
      )}
    >
      {showDot && (
        <span className={cn('h-1.5 w-1.5 rounded-full', config.dotColor)} />
      )}
      {config.label}
    </span>
  );
}

export function getWorkflowStatusLabel(status: RiskStatus): string {
  return WORKFLOW_STATUS_CONFIG[status]?.label ?? status;
}

// Backward compatibility aliases
/** @deprecated Use RiskWorkflowBadge instead */
export const StatusBadge = RiskWorkflowBadge;
/** @deprecated Use getWorkflowStatusLabel instead */
export const getStatusLabel = getWorkflowStatusLabel;
