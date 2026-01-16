'use client';

import { cn } from '@/lib/utils';

export type StatusLevel = 'critical' | 'high' | 'medium' | 'low' | 'none' | 'info';

interface StatusDotProps {
  status: StatusLevel;
  /** Show label next to dot */
  showLabel?: boolean;
  /** Custom label override */
  label?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Pulse animation for active/critical states */
  pulse?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<StatusLevel, { color: string; bg: string; label: string }> = {
  critical: {
    color: 'bg-red-500',
    bg: 'bg-red-100 dark:bg-red-900/30',
    label: 'Critical',
  },
  high: {
    color: 'bg-orange-500',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    label: 'High',
  },
  medium: {
    color: 'bg-amber-500',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    label: 'Medium',
  },
  low: {
    color: 'bg-emerald-500',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    label: 'Low',
  },
  none: {
    color: 'bg-gray-400',
    bg: 'bg-gray-100 dark:bg-gray-800/30',
    label: 'None',
  },
  info: {
    color: 'bg-blue-500',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    label: 'Info',
  },
};

const SIZE_CONFIG = {
  sm: { dot: 'h-2 w-2', text: 'text-xs', gap: 'gap-1' },
  md: { dot: 'h-2.5 w-2.5', text: 'text-sm', gap: 'gap-1.5' },
  lg: { dot: 'h-3 w-3', text: 'text-base', gap: 'gap-2' },
};

export function StatusDot({
  status,
  showLabel = false,
  label,
  size = 'md',
  pulse = false,
  className,
}: StatusDotProps) {
  const config = STATUS_CONFIG[status];
  const sizeConfig = SIZE_CONFIG[size];

  return (
    <span
      className={cn(
        'inline-flex items-center',
        sizeConfig.gap,
        className
      )}
    >
      <span className="relative flex">
        <span
          className={cn(
            'rounded-full',
            sizeConfig.dot,
            config.color,
            pulse && 'animate-pulse'
          )}
        />
        {pulse && (
          <span
            className={cn(
              'absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping',
              config.color
            )}
          />
        )}
      </span>
      {showLabel && (
        <span className={cn('font-medium', sizeConfig.text)}>
          {label || config.label}
        </span>
      )}
    </span>
  );
}

// Utility function to convert numeric risk score to status level
export function scoreToStatus(score: number, max: number = 25): StatusLevel {
  const percentage = (score / max) * 100;
  if (percentage >= 80) return 'critical';
  if (percentage >= 60) return 'high';
  if (percentage >= 40) return 'medium';
  if (percentage >= 20) return 'low';
  return 'none';
}

// Risk level based on raw score (1-25 scale)
export function riskScoreToStatus(score: number): StatusLevel {
  if (score >= 16) return 'critical';
  if (score >= 10) return 'high';
  if (score >= 5) return 'medium';
  if (score >= 1) return 'low';
  return 'none';
}
