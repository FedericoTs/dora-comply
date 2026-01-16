'use client';

/**
 * Risk Status Badge Component
 *
 * Displays a badge for risk status (identified, assessed, treating, accepted, closed).
 */

import { cn } from '@/lib/utils';
import type { RiskStatus } from '@/lib/nis2/types';

const STATUS_CONFIG: Record<RiskStatus, { label: string; color: string; dotColor: string }> = {
  identified: {
    label: 'Identified',
    color: 'bg-slate-100 text-slate-700',
    dotColor: 'bg-slate-500',
  },
  assessed: {
    label: 'Assessed',
    color: 'bg-blue-100 text-blue-700',
    dotColor: 'bg-blue-500',
  },
  treating: {
    label: 'Treating',
    color: 'bg-amber-100 text-amber-700',
    dotColor: 'bg-amber-500',
  },
  accepted: {
    label: 'Accepted',
    color: 'bg-purple-100 text-purple-700',
    dotColor: 'bg-purple-500',
  },
  closed: {
    label: 'Closed',
    color: 'bg-emerald-100 text-emerald-700',
    dotColor: 'bg-emerald-500',
  },
};

interface StatusBadgeProps {
  status: RiskStatus;
  showDot?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusBadge({
  status,
  showDot = true,
  size = 'md',
  className,
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

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

export function getStatusLabel(status: RiskStatus): string {
  return STATUS_CONFIG[status]?.label ?? status;
}
