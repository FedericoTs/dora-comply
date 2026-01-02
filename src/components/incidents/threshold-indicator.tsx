'use client';

import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { ThresholdStatus } from '@/lib/incidents/types';
import { formatThresholdValue } from '@/lib/incidents/validation';

interface ThresholdIndicatorProps {
  threshold: ThresholdStatus;
  showProgress?: boolean;
  compact?: boolean;
}

/**
 * Visual indicator for a single DORA threshold
 * Shows whether the threshold is triggered and the current vs threshold value
 */
export function ThresholdIndicator({
  threshold,
  showProgress = false,
  compact = false,
}: ThresholdIndicatorProps) {
  const isMajor = threshold.classification === 'major';
  const formattedValue = formatThresholdValue(threshold);

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-2 text-sm',
          threshold.triggered
            ? isMajor
              ? 'text-destructive'
              : 'text-warning'
            : 'text-muted-foreground'
        )}
      >
        {threshold.triggered ? (
          <CheckCircle2 className="h-4 w-4 shrink-0" />
        ) : (
          <Circle className="h-4 w-4 shrink-0" />
        )}
        <span className="truncate">{threshold.label}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-lg border p-3 transition-colors',
        threshold.triggered
          ? isMajor
            ? 'border-destructive/50 bg-destructive/5'
            : 'border-warning/50 bg-warning/5'
          : 'border-border bg-muted/30'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          {threshold.triggered ? (
            <CheckCircle2
              className={cn(
                'h-5 w-5 shrink-0 mt-0.5',
                isMajor ? 'text-destructive' : 'text-warning'
              )}
            />
          ) : (
            <Circle className="h-5 w-5 shrink-0 mt-0.5 text-muted-foreground" />
          )}
          <div>
            <p
              className={cn(
                'font-medium text-sm',
                threshold.triggered
                  ? isMajor
                    ? 'text-destructive'
                    : 'text-warning'
                  : 'text-foreground'
              )}
            >
              {threshold.label}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {threshold.description}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-sm font-medium">{formattedValue}</p>
          <p className="text-xs text-muted-foreground">
            Threshold: {threshold.thresholdValue}
          </p>
        </div>
      </div>

      {showProgress && typeof threshold.currentValue === 'number' && (
        <ThresholdProgressBar threshold={threshold} />
      )}
    </div>
  );
}

interface ThresholdProgressBarProps {
  threshold: ThresholdStatus;
}

/**
 * Progress bar showing current value against threshold
 */
function ThresholdProgressBar({ threshold }: ThresholdProgressBarProps) {
  const currentValue = threshold.currentValue as number;
  const thresholdValue = parseThresholdValue(threshold.thresholdValue);

  if (!thresholdValue || thresholdValue === 0) return null;

  // Calculate percentage (cap at 150% for visual purposes)
  const percentage = Math.min((currentValue / thresholdValue) * 100, 150);
  const isMajor = threshold.classification === 'major';
  const isTriggered = threshold.triggered;

  return (
    <div className="mt-3 space-y-1">
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full transition-all duration-500 ease-out rounded-full',
            isTriggered
              ? isMajor
                ? 'bg-destructive'
                : 'bg-warning'
              : 'bg-primary/60'
          )}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
        {/* Threshold marker */}
        <div
          className="absolute top-0 h-full w-0.5 bg-foreground/50"
          style={{ left: `${Math.min((100 / 150) * 100, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>0</span>
        <span className="text-foreground/70">{threshold.thresholdValue}</span>
      </div>
    </div>
  );
}

/**
 * Parse threshold value string to number
 */
function parseThresholdValue(value: string | number): number | null {
  if (typeof value === 'number') return value;

  // Handle percentage values like "≥10%"
  const percentMatch = value.match(/≥?(\d+(?:\.\d+)?)%?/);
  if (percentMatch) return parseFloat(percentMatch[1]);

  // Handle currency values like "≥€1M" or "≥€100K"
  const currencyMatch = value.match(/≥?€(\d+(?:\.\d+)?)(M|K)?/i);
  if (currencyMatch) {
    const num = parseFloat(currencyMatch[1]);
    const multiplier = currencyMatch[2]?.toUpperCase() === 'M' ? 1000000 : currencyMatch[2]?.toUpperCase() === 'K' ? 1000 : 1;
    return num * multiplier;
  }

  // Handle hour values like "≥2h"
  const hourMatch = value.match(/≥?(\d+(?:\.\d+)?)h?/);
  if (hourMatch) return parseFloat(hourMatch[1]);

  return null;
}

interface ThresholdListProps {
  thresholds: ThresholdStatus[];
  title?: string;
  showAll?: boolean;
  compact?: boolean;
}

/**
 * List of threshold indicators
 */
export function ThresholdList({
  thresholds,
  title,
  showAll = true,
  compact = false,
}: ThresholdListProps) {
  const displayThresholds = showAll
    ? thresholds
    : thresholds.filter((t) => t.triggered);

  if (displayThresholds.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        No thresholds {showAll ? 'defined' : 'triggered'}
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {title && (
        <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
      )}
      <div className={cn('space-y-2', compact && 'space-y-1')}>
        {displayThresholds.map((threshold) => (
          <ThresholdIndicator
            key={threshold.key}
            threshold={threshold}
            compact={compact}
          />
        ))}
      </div>
    </div>
  );
}

interface ClassificationBadgeProps {
  classification: 'major' | 'significant' | 'minor';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

/**
 * Classification badge with appropriate styling
 */
export function ClassificationBadge({
  classification,
  size = 'md',
  showIcon = true,
}: ClassificationBadgeProps) {
  const config = {
    major: {
      label: 'Major',
      className: 'bg-destructive text-destructive-foreground',
      icon: AlertTriangle,
    },
    significant: {
      label: 'Significant',
      className: 'bg-warning text-warning-foreground',
      icon: AlertTriangle,
    },
    minor: {
      label: 'Minor',
      className: 'bg-secondary text-secondary-foreground',
      icon: Circle,
    },
  };

  const { label, className, icon: Icon } = config[classification];

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        className,
        sizeClasses[size]
      )}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {label}
    </span>
  );
}
