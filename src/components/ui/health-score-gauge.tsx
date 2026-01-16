'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface HealthScoreGaugeProps {
  /** Score value (0-100) */
  score: number;
  /** Maximum score (default: 100) */
  maxScore?: number;
  /** Label to show below the score */
  label?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show breakdown on hover */
  showBreakdown?: boolean;
  /** Score breakdown for tooltip */
  breakdown?: { label: string; value: number; max: number }[];
  /** Additional class names */
  className?: string;
}

type HealthLevel = 'excellent' | 'good' | 'fair' | 'poor' | 'critical';

/**
 * HealthScoreGauge - Semi-circular gauge showing overall health/score
 *
 * Usage:
 * ```tsx
 * <HealthScoreGauge score={82} label="Health Score" />
 * <HealthScoreGauge score={45} breakdown={[{ label: "Compliance", value: 60, max: 100 }]} />
 * ```
 */
export function HealthScoreGauge({
  score,
  maxScore = 100,
  label,
  size = 'md',
  showBreakdown = true,
  breakdown,
  className,
}: HealthScoreGaugeProps) {
  const normalizedScore = Math.max(0, Math.min(score, maxScore));
  const percentage = (normalizedScore / maxScore) * 100;

  // Size configurations
  const sizeConfig = {
    sm: { width: 100, height: 60, strokeWidth: 8, fontSize: 'text-lg', labelSize: 'text-xs' },
    md: { width: 140, height: 80, strokeWidth: 10, fontSize: 'text-2xl', labelSize: 'text-sm' },
    lg: { width: 180, height: 100, strokeWidth: 12, fontSize: 'text-3xl', labelSize: 'text-base' },
  };

  const config = sizeConfig[size];

  // Calculate health level
  const healthLevel = useMemo((): HealthLevel => {
    if (percentage >= 80) return 'excellent';
    if (percentage >= 60) return 'good';
    if (percentage >= 40) return 'fair';
    if (percentage >= 20) return 'poor';
    return 'critical';
  }, [percentage]);

  // Health level labels
  const healthLabels: Record<HealthLevel, string> = {
    excellent: 'Excellent',
    good: 'Good',
    fair: 'Fair',
    poor: 'Poor',
    critical: 'Critical',
  };

  // Color mapping
  const colorConfig: Record<HealthLevel, { stroke: string; text: string; bg: string }> = {
    excellent: {
      stroke: '#10B981', // emerald-500
      text: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    good: {
      stroke: '#84CC16', // lime-500
      text: 'text-lime-600 dark:text-lime-400',
      bg: 'bg-lime-500/10',
    },
    fair: {
      stroke: '#F59E0B', // amber-500
      text: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10',
    },
    poor: {
      stroke: '#F97316', // orange-500
      text: 'text-orange-600 dark:text-orange-400',
      bg: 'bg-orange-500/10',
    },
    critical: {
      stroke: '#EF4444', // red-500
      text: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-500/10',
    },
  };

  const colors = colorConfig[healthLevel];

  // SVG arc calculations
  const { arcPath, backgroundPath } = useMemo(() => {
    const centerX = config.width / 2;
    const centerY = config.height - 5;
    const radius = Math.min(centerX, centerY) - config.strokeWidth / 2 - 2;

    // Arc spans from -135° to +135° (270° total)
    const startAngle = -135 * (Math.PI / 180);
    const endAngle = 135 * (Math.PI / 180);
    const totalAngle = endAngle - startAngle;

    // Calculate end angle based on percentage
    const valueAngle = startAngle + (percentage / 100) * totalAngle;

    // Generate arc paths
    const describeArc = (start: number, end: number): string => {
      const startX = centerX + radius * Math.cos(start);
      const startY = centerY + radius * Math.sin(start);
      const endX = centerX + radius * Math.cos(end);
      const endY = centerY + radius * Math.sin(end);
      const largeArc = end - start > Math.PI ? 1 : 0;

      return `M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`;
    };

    return {
      backgroundPath: describeArc(startAngle, endAngle),
      arcPath: describeArc(startAngle, valueAngle),
    };
  }, [config.width, config.height, config.strokeWidth, percentage]);

  const gauge = (
    <div className={cn('relative flex flex-col items-center', className)}>
      <svg
        width={config.width}
        height={config.height}
        viewBox={`0 0 ${config.width} ${config.height}`}
        className="overflow-visible"
      >
        {/* Background arc */}
        <path
          d={backgroundPath}
          fill="none"
          stroke="currentColor"
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          className="text-muted/30"
        />

        {/* Value arc */}
        <path
          d={arcPath}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={config.strokeWidth}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>

      {/* Score display */}
      <div
        className="absolute flex flex-col items-center"
        style={{ bottom: size === 'sm' ? '4px' : '8px' }}
      >
        <span className={cn('font-bold tabular-nums', config.fontSize, colors.text)}>
          {Math.round(normalizedScore)}
        </span>
        {label ? (
          <span className={cn('text-muted-foreground', config.labelSize)}>
            {label}
          </span>
        ) : (
          <span className={cn('font-medium', config.labelSize, colors.text)}>
            {healthLabels[healthLevel]}
          </span>
        )}
      </div>
    </div>
  );

  // Wrap in tooltip if breakdown provided
  if (showBreakdown && breakdown && breakdown.length > 0) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>
            <div className="cursor-help">{gauge}</div>
          </TooltipTrigger>
          <TooltipContent className="p-3">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Score Breakdown</p>
              {breakdown.map((item, index) => (
                <div key={index} className="flex items-center justify-between gap-4 text-sm">
                  <span>{item.label}</span>
                  <span className="font-medium tabular-nums">
                    {item.value}/{item.max}
                  </span>
                </div>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return gauge;
}

/**
 * HealthScoreBar - Horizontal progress bar variant
 */
export interface HealthScoreBarProps {
  /** Score value (0-100) */
  score: number;
  /** Maximum score (default: 100) */
  maxScore?: number;
  /** Show the numeric value */
  showValue?: boolean;
  /** Show the health label */
  showLabel?: boolean;
  /** Height variant */
  height?: 'sm' | 'md' | 'lg';
  /** Additional class names */
  className?: string;
}

export function HealthScoreBar({
  score,
  maxScore = 100,
  showValue = true,
  showLabel = false,
  height = 'md',
  className,
}: HealthScoreBarProps) {
  const normalizedScore = Math.max(0, Math.min(score, maxScore));
  const percentage = (normalizedScore / maxScore) * 100;

  // Calculate health level
  let healthLevel: HealthLevel;
  if (percentage >= 80) healthLevel = 'excellent';
  else if (percentage >= 60) healthLevel = 'good';
  else if (percentage >= 40) healthLevel = 'fair';
  else if (percentage >= 20) healthLevel = 'poor';
  else healthLevel = 'critical';

  const healthLabels: Record<HealthLevel, string> = {
    excellent: 'Excellent',
    good: 'Good',
    fair: 'Fair',
    poor: 'Poor',
    critical: 'Critical',
  };

  const colorConfig: Record<HealthLevel, string> = {
    excellent: 'bg-emerald-500',
    good: 'bg-lime-500',
    fair: 'bg-amber-500',
    poor: 'bg-orange-500',
    critical: 'bg-red-500',
  };

  const heightConfig = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className={cn('flex-1 rounded-full bg-muted/30', heightConfig[height])}>
        <div
          className={cn(
            'rounded-full transition-all duration-500',
            heightConfig[height],
            colorConfig[healthLevel]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showValue && (
        <span className="text-sm font-medium tabular-nums w-8 text-right">
          {Math.round(normalizedScore)}
        </span>
      )}
      {showLabel && (
        <span className="text-sm text-muted-foreground">
          {healthLabels[healthLevel]}
        </span>
      )}
    </div>
  );
}
