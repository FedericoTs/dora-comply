'use client';

import { cn } from '@/lib/utils';

interface ProgressMiniProps {
  /** Progress value (0-100) */
  value: number;
  /** Show percentage text */
  showValue?: boolean;
  /** Size variant */
  size?: 'xs' | 'sm' | 'md';
  /** Color variant - auto will pick based on value */
  variant?: 'auto' | 'primary' | 'success' | 'warning' | 'error';
  /** Width of the progress bar */
  width?: string;
  className?: string;
}

const SIZE_CONFIG = {
  xs: { bar: 'h-1', text: 'text-[10px]', gap: 'gap-1' },
  sm: { bar: 'h-1.5', text: 'text-xs', gap: 'gap-1.5' },
  md: { bar: 'h-2', text: 'text-sm', gap: 'gap-2' },
};

function getAutoColor(value: number): string {
  if (value >= 80) return 'bg-emerald-500';
  if (value >= 60) return 'bg-teal-500';
  if (value >= 40) return 'bg-amber-500';
  if (value >= 20) return 'bg-orange-500';
  return 'bg-red-500';
}

const VARIANT_COLORS = {
  primary: 'bg-primary',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
};

export function ProgressMini({
  value,
  showValue = true,
  size = 'sm',
  variant = 'auto',
  width = 'w-16',
  className,
}: ProgressMiniProps) {
  const sizeConfig = SIZE_CONFIG[size];
  const clampedValue = Math.max(0, Math.min(100, value));
  const barColor = variant === 'auto' ? getAutoColor(clampedValue) : VARIANT_COLORS[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center',
        sizeConfig.gap,
        className
      )}
    >
      <span
        className={cn(
          'relative overflow-hidden rounded-full bg-muted',
          sizeConfig.bar,
          width
        )}
      >
        <span
          className={cn(
            'absolute left-0 top-0 h-full rounded-full transition-all duration-300',
            barColor
          )}
          style={{ width: `${clampedValue}%` }}
        />
      </span>
      {showValue && (
        <span className={cn('font-medium tabular-nums', sizeConfig.text)}>
          {Math.round(clampedValue)}%
        </span>
      )}
    </span>
  );
}

// Block-style progress for larger displays (shows segments)
export function ProgressBlocks({
  value,
  blocks = 5,
  showValue = false,
  size = 'sm',
  className,
}: {
  value: number;
  blocks?: number;
  showValue?: boolean;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}) {
  const sizeConfig = SIZE_CONFIG[size];
  const filledBlocks = Math.round((value / 100) * blocks);

  return (
    <span
      className={cn(
        'inline-flex items-center',
        sizeConfig.gap,
        className
      )}
    >
      <span className="inline-flex gap-0.5">
        {Array.from({ length: blocks }, (_, i) => (
          <span
            key={i}
            className={cn(
              'rounded-sm',
              size === 'xs' ? 'h-2 w-1' : size === 'sm' ? 'h-2.5 w-1.5' : 'h-3 w-2',
              i < filledBlocks
                ? getAutoColor(value)
                : 'bg-muted'
            )}
          />
        ))}
      </span>
      {showValue && (
        <span className={cn('font-medium tabular-nums', sizeConfig.text)}>
          {Math.round(value)}%
        </span>
      )}
    </span>
  );
}
