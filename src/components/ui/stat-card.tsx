'use client';

/**
 * Unified StatCard Component
 *
 * A flexible stat card component that consolidates the various
 * stat display patterns across the application.
 *
 * Supports:
 * - Basic stats (value + label)
 * - Stats with icons
 * - Stats with trends
 * - Stats with progress bars
 * - Stats with badges
 * - Clickable stats (links)
 */

import * as React from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HelpTooltip } from '@/components/ui/help-tooltip';

// ============================================================================
// Types
// ============================================================================

export type StatTrend = 'up' | 'down' | 'neutral';

export type StatVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

export interface StatCardProps {
  /** Main value to display (e.g., "42", "85%", "$1,234") */
  value: string | number;
  /** Label describing the stat */
  label: string;
  /** Optional description or subtitle */
  description?: string;
  /** Optional icon to display */
  icon?: LucideIcon;
  /** Trend indicator */
  trend?: StatTrend;
  /** Trend label (e.g., "+12%", "-5 this week") */
  trendLabel?: string;
  /** Progress value (0-100) - shows progress bar when provided */
  progress?: number;
  /** Badge text (e.g., "Critical", "Overdue") */
  badge?: string;
  /** Badge variant for styling */
  badgeVariant?: StatVariant;
  /** Card variant for background styling */
  variant?: StatVariant;
  /** Makes the entire card clickable as a link */
  href?: string;
  /** Additional className for the card */
  className?: string;
  /** Size variant */
  size?: 'default' | 'compact' | 'large';
  /** Tooltip content explaining the KPI - shows info icon when provided */
  tooltip?: React.ReactNode;
  /** Children for custom content in footer area */
  children?: React.ReactNode;
}

// ============================================================================
// Helpers
// ============================================================================

const variantStyles: Record<StatVariant, { bg: string; border: string; icon: string }> = {
  default: {
    bg: 'bg-card',
    border: 'border-border hover:border-primary/20',
    icon: 'bg-muted text-foreground',
  },
  success: {
    bg: 'bg-success/5',
    border: 'border-success/20 hover:border-success/40',
    icon: 'bg-success/10 text-success',
  },
  warning: {
    bg: 'bg-warning/5',
    border: 'border-warning/20 hover:border-warning/40',
    icon: 'bg-warning/10 text-warning',
  },
  error: {
    bg: 'bg-error/5',
    border: 'border-error/20 hover:border-error/40',
    icon: 'bg-error/10 text-error',
  },
  info: {
    bg: 'bg-info/5',
    border: 'border-info/20 hover:border-info/40',
    icon: 'bg-info/10 text-info',
  },
};

const badgeStyles: Record<StatVariant, string> = {
  default: 'bg-muted text-muted-foreground',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error',
  info: 'bg-info/10 text-info',
};

const trendIcons: Record<StatTrend, LucideIcon> = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
};

const trendColors: Record<StatTrend, string> = {
  up: 'text-success',
  down: 'text-error',
  neutral: 'text-muted-foreground',
};

const progressColors = {
  low: 'bg-error',
  medium: 'bg-warning',
  high: 'bg-success',
};

function getProgressColor(value: number): string {
  if (value >= 80) return progressColors.high;
  if (value >= 50) return progressColors.medium;
  return progressColors.low;
}

// ============================================================================
// Component
// ============================================================================

export function StatCard({
  value,
  label,
  description,
  icon: Icon,
  trend,
  trendLabel,
  progress,
  badge,
  badgeVariant = 'default',
  variant = 'default',
  href,
  className,
  size = 'default',
  tooltip,
  children,
}: StatCardProps) {
  const styles = variantStyles[variant];
  const TrendIcon = trend ? trendIcons[trend] : null;

  const sizeStyles = {
    compact: {
      padding: 'p-4',
      value: 'text-2xl',
      label: 'text-xs',
      icon: 'h-4 w-4',
      iconContainer: 'p-1.5 rounded-lg',
    },
    default: {
      padding: 'p-5',
      value: 'text-3xl',
      label: 'text-sm',
      icon: 'h-5 w-5',
      iconContainer: 'p-2.5 rounded-xl',
    },
    large: {
      padding: 'p-6',
      value: 'text-4xl',
      label: 'text-base',
      icon: 'h-6 w-6',
      iconContainer: 'p-3 rounded-xl',
    },
  };

  const s = sizeStyles[size];

  const cardContent = (
    <>
      {/* Header with icon and badge */}
      <div className="flex items-start justify-between gap-3">
        {Icon && (
          <div className={cn(s.iconContainer, styles.icon)}>
            <Icon className={s.icon} />
          </div>
        )}
        {badge && (
          <span
            className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full',
              badgeStyles[badgeVariant]
            )}
          >
            {badge}
          </span>
        )}
      </div>

      {/* Value and label */}
      <div className={cn('space-y-1', Icon ? 'mt-4' : '')}>
        <p className={cn('font-semibold tracking-tight', s.value)}>
          {value}
        </p>
        <p className={cn('text-muted-foreground flex items-center gap-1', s.label)}>
          {label}
          {tooltip && <HelpTooltip content={tooltip} iconClassName="h-3.5 w-3.5" />}
        </p>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </div>

      {/* Trend indicator */}
      {trend && TrendIcon && (
        <div className={cn('flex items-center gap-1.5 mt-3', trendColors[trend])}>
          <TrendIcon className="h-4 w-4" />
          {trendLabel && (
            <span className="text-sm font-medium">{trendLabel}</span>
          )}
        </div>
      )}

      {/* Progress bar */}
      {typeof progress === 'number' && (
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', getProgressColor(progress))}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        </div>
      )}

      {/* Custom footer content */}
      {children && <div className="mt-4">{children}</div>}
    </>
  );

  const cardClasses = cn(
    'rounded-xl border transition-all duration-200',
    s.padding,
    styles.bg,
    styles.border,
    href && 'cursor-pointer hover:shadow-md group',
    className
  );

  if (href) {
    return (
      <Link href={href} className={cardClasses}>
        {cardContent}
      </Link>
    );
  }

  return <div className={cardClasses}>{cardContent}</div>;
}

// ============================================================================
// Compound Components for Advanced Use Cases
// ============================================================================

export function StatCardGrid({
  children,
  columns = 4,
  className,
  ...props
}: {
  children: React.ReactNode;
  columns?: 2 | 3 | 4 | 5 | 6;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  const columnClasses: Record<number, string> = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
  };

  return (
    <div className={cn('grid gap-4', columnClasses[columns], className)} {...props}>
      {children}
    </div>
  );
}

// ============================================================================
// Preset Stat Cards
// ============================================================================

interface QuickStatProps {
  value: string | number;
  label: string;
  href?: string;
  tooltip?: React.ReactNode;
}

export function VendorStat({ value, label, href, tooltip }: QuickStatProps) {
  return (
    <StatCard
      value={value}
      label={label}
      href={href}
      tooltip={tooltip}
      size="compact"
    />
  );
}

export function ProgressStat({
  value,
  label,
  progress,
  href,
  tooltip,
}: QuickStatProps & { progress: number }) {
  return (
    <StatCard
      value={value}
      label={label}
      progress={progress}
      href={href}
      tooltip={tooltip}
    />
  );
}

export function TrendStat({
  value,
  label,
  trend,
  trendLabel,
  href,
  tooltip,
}: QuickStatProps & { trend: StatTrend; trendLabel?: string }) {
  return (
    <StatCard
      value={value}
      label={label}
      trend={trend}
      trendLabel={trendLabel}
      href={href}
      tooltip={tooltip}
    />
  );
}
