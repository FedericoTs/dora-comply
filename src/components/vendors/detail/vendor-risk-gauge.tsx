'use client';

import { cn } from '@/lib/utils';
import type { RiskLevel } from '@/lib/vendors/types';

interface VendorRiskGaugeProps {
  score?: number | null;
  level?: RiskLevel | null;
}

const RISK_CONFIG: Record<RiskLevel, {
  color: string;
  bgColor: string;
  label: string;
}> = {
  low: {
    color: 'text-success',
    bgColor: 'bg-success',
    label: 'Low Risk',
  },
  medium: {
    color: 'text-warning',
    bgColor: 'bg-warning',
    label: 'Medium Risk',
  },
  high: {
    color: 'text-orange-500',
    bgColor: 'bg-orange-500',
    label: 'High Risk',
  },
  critical: {
    color: 'text-error',
    bgColor: 'bg-error',
    label: 'Critical Risk',
  },
};

export function VendorRiskGauge({ score, level }: VendorRiskGaugeProps) {
  const displayScore = score ?? 0;
  const displayLevel = level ?? 'low';
  const config = RISK_CONFIG[displayLevel];

  // Calculate the arc path for SVG gauge
  // The gauge spans from -135deg to 135deg (270 degrees total)
  const percentage = Math.min(100, Math.max(0, displayScore));
  const startAngle = -135;
  const totalAngle = 270;
  const currentAngle = startAngle + (percentage / 100) * totalAngle;

  // Convert to radians for SVG path calculation
  const toRadians = (deg: number) => (deg * Math.PI) / 180;
  const radius = 40;
  const centerX = 50;
  const centerY = 50;

  // Calculate arc end point
  const endX = centerX + radius * Math.cos(toRadians(currentAngle));
  const endY = centerY + radius * Math.sin(toRadians(currentAngle));

  // Calculate start point
  const startX = centerX + radius * Math.cos(toRadians(startAngle));
  const startY = centerY + radius * Math.sin(toRadians(startAngle));

  // Determine if arc is greater than 180 degrees
  const largeArcFlag = percentage > 50 ? 1 : 0;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-20">
        <svg
          viewBox="0 0 100 60"
          className="w-full h-full"
        >
          {/* Background arc */}
          <path
            d={`M ${centerX + radius * Math.cos(toRadians(startAngle))} ${centerY + radius * Math.sin(toRadians(startAngle))}
                A ${radius} ${radius} 0 1 1 ${centerX + radius * Math.cos(toRadians(startAngle + totalAngle))} ${centerY + radius * Math.sin(toRadians(startAngle + totalAngle))}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            className="text-muted/30"
          />

          {/* Value arc */}
          {percentage > 0 && (
            <path
              d={`M ${startX} ${startY}
                  A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              className={config.color}
            />
          )}
        </svg>

        {/* Score display */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <span className={cn('text-2xl font-bold', config.color)}>
            {score !== null ? displayScore : '—'}
          </span>
        </div>
      </div>

      {/* Label */}
      <div className="mt-1 text-center">
        <span className={cn('text-sm font-medium', config.color)}>
          {config.label}
        </span>
        <p className="text-xs text-muted-foreground">Risk Score</p>
      </div>
    </div>
  );
}
