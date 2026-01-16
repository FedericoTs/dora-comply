'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { TrendArrow } from '@/components/ui/trend-arrow';
import { ProgressMini, ProgressBlocks } from '@/components/ui/progress-mini';
import { type LucideIcon } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface KPICardProps {
  /** Card title/label */
  label: string;
  /** Main value to display */
  value: string | number;
  /** Optional subtitle or description */
  subtitle?: string;
  /** Trend value (positive = up, negative = down) */
  trend?: number;
  /** Whether to invert trend colors (good when down) */
  invertTrend?: boolean;
  /** Progress value (0-100) for progress bar */
  progress?: number;
  /** Use block-style progress instead of bar */
  progressBlocks?: boolean;
  /** Link destination when card is clicked */
  href?: string;
  /** Icon to display */
  icon?: LucideIcon;
  /** Color variant */
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// Configuration
// ============================================================================

const VARIANT_CONFIG = {
  default: {
    iconBg: 'bg-muted',
    iconColor: 'text-muted-foreground',
  },
  success: {
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  warning: {
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  error: {
    iconBg: 'bg-red-100 dark:bg-red-900/30',
    iconColor: 'text-red-600 dark:text-red-400',
  },
  info: {
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
};

// ============================================================================
// Component
// ============================================================================

export function KPICard({
  label,
  value,
  subtitle,
  trend,
  invertTrend = false,
  progress,
  progressBlocks = false,
  href,
  icon: Icon,
  variant = 'default',
  className,
}: KPICardProps) {
  const config = VARIANT_CONFIG[variant];

  const content = (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border bg-card p-4 transition-all',
        href && 'cursor-pointer hover:shadow-md hover:border-primary/20',
        className
      )}
    >
      {/* Top row: Icon + Trend */}
      <div className="flex items-start justify-between mb-3">
        {Icon && (
          <div className={cn('p-2 rounded-lg', config.iconBg)}>
            <Icon className={cn('h-5 w-5', config.iconColor)} />
          </div>
        )}
        {trend !== undefined && (
          <TrendArrow
            value={trend}
            invertColors={invertTrend}
            size="sm"
            showValue={trend !== 0}
          />
        )}
      </div>

      {/* Value */}
      <div className="text-2xl font-bold tracking-tight">{value}</div>

      {/* Label */}
      <div className="text-sm text-muted-foreground mt-0.5">{label}</div>

      {/* Subtitle or Progress */}
      {progress !== undefined ? (
        <div className="mt-3">
          {progressBlocks ? (
            <ProgressBlocks value={progress} blocks={5} showValue size="sm" />
          ) : (
            <ProgressMini value={progress} size="sm" width="w-full" />
          )}
        </div>
      ) : subtitle ? (
        <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>
      ) : null}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

// ============================================================================
// KPI Card Grid
// ============================================================================

export function KPICardGrid({
  children,
  columns = 4,
  className,
}: {
  children: React.ReactNode;
  columns?: 2 | 3 | 4 | 5 | 6;
  className?: string;
}) {
  const colClasses = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5',
    6: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
  };

  return (
    <div className={cn('grid gap-4', colClasses[columns], className)}>
      {children}
    </div>
  );
}
