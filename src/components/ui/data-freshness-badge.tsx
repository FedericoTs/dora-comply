'use client';

import { Clock, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface DataFreshnessBadgeProps {
  /** Last update timestamp (ISO string or Date) */
  lastUpdated: string | Date | null | undefined;
  /** Days until warning state (default: 30) */
  warningThresholdDays?: number;
  /** Days until critical state (default: 90) */
  criticalThresholdDays?: number;
  /** Show relative time (e.g., "3 days ago") vs absolute date */
  showRelativeTime?: boolean;
  /** Show icon */
  showIcon?: boolean;
  /** Size variant */
  size?: 'xs' | 'sm' | 'md';
  /** Optional refresh callback */
  onRefresh?: () => void;
  /** Whether refresh is in progress */
  isRefreshing?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * DataFreshnessBadge - Indicates how recent/stale data is
 *
 * Usage:
 * ```tsx
 * <DataFreshnessBadge lastUpdated={vendor.last_assessment_date} />
 * <DataFreshnessBadge lastUpdated={date} warningThresholdDays={7} onRefresh={handleRefresh} />
 * ```
 */
export function DataFreshnessBadge({
  lastUpdated,
  warningThresholdDays = 30,
  criticalThresholdDays = 90,
  showRelativeTime = true,
  showIcon = true,
  size = 'sm',
  onRefresh,
  isRefreshing = false,
  className,
}: DataFreshnessBadgeProps) {
  // Calculate freshness
  const { status, daysSince, displayText } = calculateFreshness(
    lastUpdated,
    warningThresholdDays,
    criticalThresholdDays,
    showRelativeTime
  );

  // Size configurations
  const sizeConfig = {
    xs: { text: 'text-xs', icon: 'h-3 w-3', padding: 'px-1.5 py-0.5', gap: 'gap-1' },
    sm: { text: 'text-sm', icon: 'h-3.5 w-3.5', padding: 'px-2 py-0.5', gap: 'gap-1' },
    md: { text: 'text-base', icon: 'h-4 w-4', padding: 'px-2.5 py-1', gap: 'gap-1.5' },
  };

  const config = sizeConfig[size];

  // Status styling
  const statusStyles = {
    fresh: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-600 dark:text-emerald-400',
      icon: CheckCircle2,
    },
    warning: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-600 dark:text-amber-400',
      icon: Clock,
    },
    stale: {
      bg: 'bg-red-500/10',
      text: 'text-red-600 dark:text-red-400',
      icon: AlertTriangle,
    },
    unknown: {
      bg: 'bg-muted',
      text: 'text-muted-foreground',
      icon: Clock,
    },
  };

  const currentStyle = statusStyles[status];
  const Icon = currentStyle.icon;

  const badge = (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        config.text,
        config.padding,
        config.gap,
        currentStyle.bg,
        currentStyle.text,
        className
      )}
    >
      {showIcon && !isRefreshing && <Icon className={config.icon} />}
      {isRefreshing && <RefreshCw className={cn(config.icon, 'animate-spin')} />}
      <span>{displayText}</span>
      {onRefresh && !isRefreshing && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRefresh();
          }}
          className="ml-1 rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          aria-label="Refresh data"
        >
          <RefreshCw className={cn(config.icon, 'h-3 w-3')} />
        </button>
      )}
    </span>
  );

  // Wrap in tooltip for more context
  if (lastUpdated && daysSince !== null) {
    const absoluteDate = new Date(lastUpdated).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">
              Last updated: {absoluteDate}
              <br />
              {daysSince} days ago
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}

// Helper function to calculate freshness
function calculateFreshness(
  lastUpdated: string | Date | null | undefined,
  warningThreshold: number,
  criticalThreshold: number,
  showRelative: boolean
): {
  status: 'fresh' | 'warning' | 'stale' | 'unknown';
  daysSince: number | null;
  displayText: string;
} {
  if (!lastUpdated) {
    return { status: 'unknown', daysSince: null, displayText: 'Never updated' };
  }

  const date = new Date(lastUpdated);
  if (isNaN(date.getTime())) {
    return { status: 'unknown', daysSince: null, displayText: 'Invalid date' };
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const daysSince = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let status: 'fresh' | 'warning' | 'stale';
  if (daysSince >= criticalThreshold) {
    status = 'stale';
  } else if (daysSince >= warningThreshold) {
    status = 'warning';
  } else {
    status = 'fresh';
  }

  let displayText: string;
  if (showRelative) {
    if (daysSince === 0) {
      displayText = 'Today';
    } else if (daysSince === 1) {
      displayText = 'Yesterday';
    } else if (daysSince < 7) {
      displayText = `${daysSince}d ago`;
    } else if (daysSince < 30) {
      const weeks = Math.floor(daysSince / 7);
      displayText = `${weeks}w ago`;
    } else if (daysSince < 365) {
      const months = Math.floor(daysSince / 30);
      displayText = `${months}mo ago`;
    } else {
      const years = Math.floor(daysSince / 365);
      displayText = `${years}y ago`;
    }
  } else {
    displayText = date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    });
  }

  return { status, daysSince, displayText };
}

/**
 * Simple text-only freshness indicator
 */
export function DataFreshnessText({
  lastUpdated,
  warningThresholdDays = 30,
  criticalThresholdDays = 90,
  className,
}: Pick<DataFreshnessBadgeProps, 'lastUpdated' | 'warningThresholdDays' | 'criticalThresholdDays' | 'className'>) {
  const { status, displayText } = calculateFreshness(
    lastUpdated,
    warningThresholdDays,
    criticalThresholdDays,
    true
  );

  const colorMap = {
    fresh: 'text-emerald-600 dark:text-emerald-400',
    warning: 'text-amber-600 dark:text-amber-400',
    stale: 'text-red-600 dark:text-red-400',
    unknown: 'text-muted-foreground',
  };

  return (
    <span className={cn('text-sm', colorMap[status], className)}>
      {displayText}
    </span>
  );
}
