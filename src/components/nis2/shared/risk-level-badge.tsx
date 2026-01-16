'use client';

/**
 * Risk Level Badge Component
 *
 * Displays a colored badge for risk levels (Low, Medium, High, Critical).
 */

import { cn } from '@/lib/utils';
import type { RiskLevel } from '@/lib/nis2/types';
import { RISK_LEVEL_CONFIG } from '@/lib/nis2/types';

interface RiskLevelBadgeProps {
  level: RiskLevel;
  score?: number;
  showScore?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function RiskLevelBadge({
  level,
  score,
  showScore = false,
  size = 'md',
  className,
}: RiskLevelBadgeProps) {
  const config = RISK_LEVEL_CONFIG[level];

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        config.bgColor,
        config.textColor,
        sizeClasses[size],
        className
      )}
    >
      {showScore && score !== undefined && (
        <span className="font-bold">{score}</span>
      )}
      <span>{config.label}</span>
    </span>
  );
}

interface RiskScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function RiskScoreBadge({
  score,
  size = 'md',
  className,
}: RiskScoreBadgeProps) {
  const level: RiskLevel =
    score >= 16 ? 'critical' :
    score >= 10 ? 'high' :
    score >= 5 ? 'medium' :
    'low';

  return (
    <RiskLevelBadge
      level={level}
      score={score}
      showScore={true}
      size={size}
      className={className}
    />
  );
}

interface RiskLevelIndicatorProps {
  level: RiskLevel;
  size?: 'sm' | 'md';
  className?: string;
}

export function RiskLevelIndicator({
  level,
  size = 'md',
  className,
}: RiskLevelIndicatorProps) {
  const config = RISK_LEVEL_CONFIG[level];

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
  };

  return (
    <span
      className={cn(
        'inline-block rounded-full',
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: config.color }}
      title={config.label}
    />
  );
}
