'use client';

/**
 * Effectiveness Bar Component
 *
 * Displays control effectiveness as a visual bar.
 */

import { cn } from '@/lib/utils';
import { getEffectivenessLabel } from '@/lib/nis2/risk-calculator';

interface EffectivenessBarProps {
  value: number; // 0-100
  showLabel?: boolean;
  showPercentage?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function EffectivenessBar({
  value,
  showLabel = false,
  showPercentage = true,
  size = 'md',
  className,
}: EffectivenessBarProps) {
  const normalizedValue = Math.max(0, Math.min(100, value));

  const getColor = (v: number): string => {
    if (v >= 75) return 'bg-emerald-500';
    if (v >= 50) return 'bg-amber-500';
    if (v >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn('flex-1 bg-muted rounded-full overflow-hidden', sizeClasses[size])}>
        <div
          className={cn('h-full rounded-full transition-all', getColor(normalizedValue))}
          style={{ width: `${normalizedValue}%` }}
        />
      </div>
      {showPercentage && (
        <span className="text-xs font-medium tabular-nums w-10 text-right">
          {normalizedValue}%
        </span>
      )}
      {showLabel && (
        <span className="text-xs text-muted-foreground">
          {getEffectivenessLabel(normalizedValue)}
        </span>
      )}
    </div>
  );
}

interface EffectivenessValueProps {
  value: number;
  className?: string;
}

export function EffectivenessValue({ value, className }: EffectivenessValueProps) {
  const normalizedValue = Math.max(0, Math.min(100, value));

  const getColorClass = (v: number): string => {
    if (v >= 75) return 'text-emerald-600';
    if (v >= 50) return 'text-amber-600';
    if (v >= 25) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <span className={cn('font-medium tabular-nums', getColorClass(normalizedValue), className)}>
      {normalizedValue}%
    </span>
  );
}
