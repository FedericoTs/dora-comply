'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TrendIndicatorProps {
  /** The delta value (positive = up, negative = down, 0 = flat) */
  value: number;
  /** How to format the value */
  format?: 'percent' | 'number' | 'grade' | 'points';
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Whether to show the numeric value */
  showValue?: boolean;
  /** Whether to show the icon */
  showIcon?: boolean;
  /** Invert colors (for metrics where down is good, like risk) */
  invertColors?: boolean;
  /** Additional class names */
  className?: string;
}

/**
 * TrendIndicator - Shows trend direction with optional value
 *
 * Usage:
 * ```tsx
 * <TrendIndicator value={5} format="percent" />
 * <TrendIndicator value={-10} format="points" invertColors />
 * ```
 */
export function TrendIndicator({
  value,
  format = 'number',
  size = 'sm',
  showValue = true,
  showIcon = true,
  invertColors = false,
  className,
}: TrendIndicatorProps) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const isNeutral = value === 0;

  // Determine color based on direction and inversion
  let colorClass: string;
  if (isNeutral) {
    colorClass = 'text-muted-foreground';
  } else if (invertColors) {
    // Inverted: down is good (green), up is bad (red)
    colorClass = isPositive ? 'text-red-500' : 'text-emerald-500';
  } else {
    // Normal: up is good (green), down is bad (red)
    colorClass = isPositive ? 'text-emerald-500' : 'text-red-500';
  }

  // Size configurations
  const sizeConfig = {
    xs: { text: 'text-xs', icon: 'h-3 w-3', gap: 'gap-0.5' },
    sm: { text: 'text-sm', icon: 'h-3.5 w-3.5', gap: 'gap-1' },
    md: { text: 'text-base', icon: 'h-4 w-4', gap: 'gap-1' },
    lg: { text: 'text-lg', icon: 'h-5 w-5', gap: 'gap-1.5' },
  };

  const config = sizeConfig[size];

  // Format the display value
  const formatValue = (val: number): string => {
    const absVal = Math.abs(val);
    const prefix = val > 0 ? '+' : val < 0 ? '-' : '';

    switch (format) {
      case 'percent':
        return `${prefix}${absVal}%`;
      case 'points':
        return `${prefix}${absVal} pts`;
      case 'grade':
        return `${prefix}${absVal}`;
      case 'number':
      default:
        return `${prefix}${absVal}`;
    }
  };

  // Select icon
  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

  if (!showValue && !showIcon) {
    return null;
  }

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium',
        config.gap,
        config.text,
        colorClass,
        className
      )}
      aria-label={`Trend: ${formatValue(value)}`}
    >
      {showIcon && <Icon className={config.icon} />}
      {showValue && <span className="tabular-nums">{formatValue(value)}</span>}
    </span>
  );
}

/**
 * TrendBadge - Trend indicator in a badge/pill format
 */
export interface TrendBadgeProps extends TrendIndicatorProps {
  /** Background style */
  variant?: 'subtle' | 'solid';
}

export function TrendBadge({
  variant = 'subtle',
  className,
  ...props
}: TrendBadgeProps) {
  const isPositive = props.value > 0;
  const isNegative = props.value < 0;
  const invertColors = props.invertColors ?? false;

  let bgClass: string;
  if (props.value === 0) {
    bgClass = variant === 'solid' ? 'bg-muted' : 'bg-muted/50';
  } else if (invertColors) {
    bgClass = isPositive
      ? variant === 'solid' ? 'bg-red-500/20' : 'bg-red-500/10'
      : variant === 'solid' ? 'bg-emerald-500/20' : 'bg-emerald-500/10';
  } else {
    bgClass = isPositive
      ? variant === 'solid' ? 'bg-emerald-500/20' : 'bg-emerald-500/10'
      : variant === 'solid' ? 'bg-red-500/20' : 'bg-red-500/10';
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5',
        bgClass,
        className
      )}
    >
      <TrendIndicator {...props} />
    </span>
  );
}

/**
 * TrendArrow - Simplified trend indicator with arrow icon
 * Backwards-compatible alias for components that used trend-arrow.tsx
 */
export interface TrendArrowProps {
  /** Numeric change value (positive = up, negative = down, 0 = stable) */
  value: number;
  /** Show the numeric value */
  showValue?: boolean;
  /** Format the value as percentage */
  isPercentage?: boolean;
  /** Invert colors (green for down is good, e.g., for costs/risks) */
  invertColors?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function TrendArrow({
  value,
  showValue = true,
  isPercentage = false,
  invertColors = false,
  size = 'md',
  className,
}: TrendArrowProps) {
  // Map size to TrendIndicator sizes
  const sizeMap = { sm: 'sm', md: 'md', lg: 'lg' } as const;

  return (
    <TrendIndicator
      value={value}
      format={isPercentage ? 'percent' : 'number'}
      size={sizeMap[size]}
      showValue={showValue}
      showIcon={true}
      invertColors={invertColors}
      className={className}
    />
  );
}

/**
 * TrendDirectionIndicator - Icon-only trend indicator
 * For compact displays where only direction matters
 */
export interface TrendDirectionIndicatorProps {
  direction: 'up' | 'down' | 'stable';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Invert colors (green for down) */
  invertColors?: boolean;
  className?: string;
}

export function TrendDirectionIndicator({
  direction,
  size = 'sm',
  invertColors = false,
  className,
}: TrendDirectionIndicatorProps) {
  const sizeConfig = {
    xs: 'h-3 w-3',
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const getColor = () => {
    if (direction === 'stable') return 'text-muted-foreground';
    if (invertColors) {
      return direction === 'up'
        ? 'text-red-500'
        : 'text-emerald-500';
    }
    return direction === 'up'
      ? 'text-emerald-500'
      : 'text-red-500';
  };

  const Icon = direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus;

  return <Icon className={cn(sizeConfig[size], getColor(), className)} />;
}
