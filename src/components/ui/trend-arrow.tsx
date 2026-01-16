'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrendArrowProps {
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

const SIZE_CONFIG = {
  sm: { icon: 'h-3 w-3', text: 'text-xs', gap: 'gap-0.5' },
  md: { icon: 'h-4 w-4', text: 'text-sm', gap: 'gap-1' },
  lg: { icon: 'h-5 w-5', text: 'text-base', gap: 'gap-1.5' },
};

export function TrendArrow({
  value,
  showValue = true,
  isPercentage = false,
  invertColors = false,
  size = 'md',
  className,
}: TrendArrowProps) {
  const sizeConfig = SIZE_CONFIG[size];

  const isUp = value > 0;
  const isDown = value < 0;
  const isStable = value === 0;

  // Determine color based on direction and inversion
  const getColor = () => {
    if (isStable) return 'text-muted-foreground';
    if (invertColors) {
      return isUp ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400';
    }
    return isUp ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400';
  };

  const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;

  const formattedValue = isPercentage
    ? `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
    : `${value > 0 ? '+' : ''}${value}`;

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium',
        sizeConfig.gap,
        getColor(),
        className
      )}
    >
      <Icon className={sizeConfig.icon} />
      {showValue && (
        <span className={sizeConfig.text}>
          {isStable ? 'stable' : formattedValue}
        </span>
      )}
    </span>
  );
}

// Simplified variant for compact displays
export function TrendIndicator({
  direction,
  size = 'sm',
  className,
}: {
  direction: 'up' | 'down' | 'stable';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeConfig = SIZE_CONFIG[size];

  const config = {
    up: { icon: TrendingUp, color: 'text-emerald-600 dark:text-emerald-400' },
    down: { icon: TrendingDown, color: 'text-red-600 dark:text-red-400' },
    stable: { icon: Minus, color: 'text-muted-foreground' },
  };

  const { icon: Icon, color } = config[direction];

  return (
    <Icon className={cn(sizeConfig.icon, color, className)} />
  );
}
