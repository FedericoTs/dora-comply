'use client';

/**
 * Maturity Level Badge Component
 *
 * Displays DORA compliance maturity level (L0-L4)
 * Uses COBIT/CMMI-style maturity model instead of misleading percentages
 */

import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import {
  MaturityLevel,
  MaturityLevelLabels,
  MaturityLevelDescriptions,
} from '@/lib/compliance/dora-types';

interface MaturityLevelBadgeProps {
  level: MaturityLevel;
  showDescription?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const levelColors: Record<MaturityLevel, string> = {
  [MaturityLevel.L0_NOT_PERFORMED]: 'bg-slate-500 text-white hover:bg-slate-600',
  [MaturityLevel.L1_INFORMAL]: 'bg-red-500 text-white hover:bg-red-600',
  [MaturityLevel.L2_PLANNED]: 'bg-amber-500 text-white hover:bg-amber-600',
  [MaturityLevel.L3_WELL_DEFINED]: 'bg-emerald-500 text-white hover:bg-emerald-600',
  [MaturityLevel.L4_QUANTITATIVE]: 'bg-blue-600 text-white hover:bg-blue-700',
};

const sizeClasses: Record<string, string> = {
  sm: 'text-[10px] px-1.5 py-0.5',
  md: 'text-xs px-2 py-1',
  lg: 'text-sm px-3 py-1.5',
};

export function MaturityLevelBadge({
  level,
  showDescription = false,
  size = 'md',
  className,
}: MaturityLevelBadgeProps) {
  const badge = (
    <Badge
      className={cn(
        'font-semibold rounded-md transition-colors cursor-default',
        levelColors[level],
        sizeClasses[size],
        className
      )}
    >
      L{level} · {MaturityLevelLabels[level]}
    </Badge>
  );

  if (showDescription) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <p className="font-medium">Level {level}: {MaturityLevelLabels[level]}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {MaturityLevelDescriptions[level]}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}

// Compact version just showing L0-L4
export function MaturityLevelIndicator({
  level,
  className,
}: {
  level: MaturityLevel;
  className?: string;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm cursor-default',
              levelColors[level],
              className
            )}
          >
            L{level}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="font-medium">{MaturityLevelLabels[level]}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {MaturityLevelDescriptions[level]}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Progress bar showing maturity level
export function MaturityProgressBar({
  level,
  showLabels = true,
  className,
}: {
  level: MaturityLevel;
  showLabels?: boolean;
  className?: string;
}) {
  const percentage = (level / 4) * 100;

  return (
    <div className={cn('w-full', className)}>
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('absolute left-0 top-0 h-full rounded-full transition-all duration-500', {
            'bg-slate-500': level === 0,
            'bg-red-500': level === 1,
            'bg-amber-500': level === 2,
            'bg-emerald-500': level === 3,
            'bg-blue-600': level === 4,
          })}
          style={{ width: `${percentage}%` }}
        />
        {/* Markers */}
        <div className="absolute inset-0 flex justify-between items-center px-0">
          {[0, 1, 2, 3, 4].map((l) => (
            <div
              key={l}
              className={cn(
                'w-1 h-3 rounded-full transition-colors',
                l <= level ? 'bg-white/50' : 'bg-muted-foreground/30'
              )}
            />
          ))}
        </div>
      </div>
      {showLabels && (
        <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
          <span>L0</span>
          <span>L1</span>
          <span>L2</span>
          <span>L3</span>
          <span>L4</span>
        </div>
      )}
    </div>
  );
}

// Status indicator (compliant/partial/non-compliant)
export function ComplianceStatusBadge({
  status,
  className,
}: {
  status: 'compliant' | 'partial' | 'non_compliant' | 'not_assessed';
  className?: string;
}) {
  const statusConfig = {
    compliant: {
      label: 'DORA Ready',
      color: 'bg-emerald-500 text-white',
      icon: '✓',
    },
    partial: {
      label: 'Partial Compliance',
      color: 'bg-amber-500 text-white',
      icon: '⚠',
    },
    non_compliant: {
      label: 'Gaps Identified',
      color: 'bg-red-500 text-white',
      icon: '✗',
    },
    not_assessed: {
      label: 'Not Assessed',
      color: 'bg-slate-500 text-white',
      icon: '?',
    },
  };

  const config = statusConfig[status];

  return (
    <Badge className={cn('font-medium gap-1', config.color, className)}>
      <span>{config.icon}</span>
      {config.label}
    </Badge>
  );
}
