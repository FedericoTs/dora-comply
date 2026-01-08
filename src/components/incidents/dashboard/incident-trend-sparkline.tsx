'use client';

import { useMemo } from 'react';
import type { IncidentTrendPoint } from '@/lib/incidents/types';

interface IncidentTrendSparklineProps {
  data: IncidentTrendPoint[];
  width?: number;
  height?: number;
  showMajor?: boolean;
  className?: string;
}

/**
 * Compact sparkline showing incident trend over time
 * Uses SVG for efficient rendering without external chart libraries
 */
export function IncidentTrendSparkline({
  data,
  width = 80,
  height = 24,
  showMajor = false,
  className,
}: IncidentTrendSparklineProps) {
  const chartData = useMemo(() => {
    if (!data || data.length < 2) return null;

    const totals = data.map((d) => d.total);
    const majors = data.map((d) => d.major);

    const max = Math.max(...totals, 1); // At least 1 to avoid division by zero
    const min = 0; // Always start from 0 for incidents

    return {
      totals,
      majors,
      max,
      min,
    };
  }, [data]);

  if (!chartData) {
    return (
      <div className={className} style={{ width, height }}>
        <span className="text-[10px] text-muted-foreground">No data</span>
      </div>
    );
  }

  const { totals, majors, max } = chartData;
  const padding = 1;
  const effectiveWidth = width - padding * 2;
  const effectiveHeight = height - padding * 2;

  // Generate path for total incidents
  const totalPoints = totals.map((value, i) => {
    const x = padding + (i / (totals.length - 1)) * effectiveWidth;
    const y = padding + effectiveHeight - (value / max) * effectiveHeight;
    return `${x},${y}`;
  });
  const totalPath = `M ${totalPoints.join(' L ')}`;

  // Generate area path for gradient fill
  const areaPath = `M ${padding},${height - padding} L ${totalPoints.join(' L ')} L ${width - padding},${height - padding} Z`;

  // Generate major incidents path (if enabled)
  const majorPoints = showMajor
    ? majors.map((value, i) => {
        const x = padding + (i / (majors.length - 1)) * effectiveWidth;
        const y = padding + effectiveHeight - (value / max) * effectiveHeight;
        return `${x},${y}`;
      })
    : [];
  const majorPath = majorPoints.length > 0 ? `M ${majorPoints.join(' L ')}` : '';

  // Calculate trend color based on recent change
  const recentTrend = totals.slice(-7).reduce((a, b) => a + b, 0);
  const previousTrend = totals.slice(-14, -7).reduce((a, b) => a + b, 0);
  const trendColor =
    recentTrend > previousTrend
      ? 'hsl(var(--destructive))' // Increasing incidents = bad
      : recentTrend < previousTrend
      ? 'hsl(var(--success))' // Decreasing = good
      : 'hsl(var(--muted-foreground))'; // Stable

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      style={{ width, height }}
      preserveAspectRatio="none"
    >
      {/* Gradient definition */}
      <defs>
        <linearGradient id="incidentTrendGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={trendColor} stopOpacity="0.2" />
          <stop offset="100%" stopColor={trendColor} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Fill area */}
      <path d={areaPath} fill="url(#incidentTrendGradient)" />

      {/* Total line */}
      <path
        d={totalPath}
        fill="none"
        stroke={trendColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Major incidents line (if enabled) */}
      {showMajor && majorPath && (
        <path
          d={majorPath}
          fill="none"
          stroke="hsl(var(--destructive))"
          strokeWidth="1"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="2,2"
        />
      )}

      {/* Current point indicator */}
      <circle
        cx={width - padding}
        cy={padding + effectiveHeight - (totals[totals.length - 1] / max) * effectiveHeight}
        r="2"
        fill={trendColor}
      />
    </svg>
  );
}

/**
 * Larger trend chart with labels for detailed view
 */
export function IncidentTrendChart({
  data,
  className,
}: {
  data: IncidentTrendPoint[];
  className?: string;
}) {
  if (!data || data.length < 7) {
    return (
      <div className={className}>
        <p className="text-sm text-muted-foreground text-center py-4">
          Not enough data for trend analysis
        </p>
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.total), 1);
  const width = 100;
  const height = 40;
  const padding = 4;
  const effectiveWidth = width - padding * 2;
  const effectiveHeight = height - padding * 2;

  // Generate paths for each classification
  const generatePath = (values: number[]) => {
    const points = values.map((value, i) => {
      const x = padding + (i / (values.length - 1)) * effectiveWidth;
      const y = padding + effectiveHeight - (value / max) * effectiveHeight;
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  };

  const totalPath = generatePath(data.map((d) => d.total));
  const majorPath = generatePath(data.map((d) => d.major));
  const significantPath = generatePath(data.map((d) => d.significant));

  // Calculate totals for legend
  const totalIncidents = data.reduce((sum, d) => sum + d.total, 0);
  const majorTotal = data.reduce((sum, d) => sum + d.major, 0);
  const significantTotal = data.reduce((sum, d) => sum + d.significant, 0);

  return (
    <div className={className}>
      <div className="relative h-24">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
          {/* Grid lines */}
          <line
            x1={padding}
            y1={padding}
            x2={width - padding}
            y2={padding}
            stroke="currentColor"
            strokeOpacity="0.1"
            strokeWidth="0.5"
          />
          <line
            x1={padding}
            y1={height / 2}
            x2={width - padding}
            y2={height / 2}
            stroke="currentColor"
            strokeOpacity="0.1"
            strokeWidth="0.5"
          />
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="currentColor"
            strokeOpacity="0.1"
            strokeWidth="0.5"
          />

          {/* Total line */}
          <path
            d={totalPath}
            fill="none"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Significant line */}
          <path
            d={significantPath}
            fill="none"
            stroke="hsl(var(--warning))"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity="0.7"
          />

          {/* Major line */}
          <path
            d={majorPath}
            fill="none"
            stroke="hsl(var(--destructive))"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-muted-foreground">
          <span>{max}</span>
          <span>{Math.round(max / 2)}</span>
          <span>0</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs mt-2">
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-muted-foreground rounded" />
          <span className="text-muted-foreground">Total ({totalIncidents})</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-destructive rounded" />
          <span className="text-muted-foreground">Major ({majorTotal})</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-0.5 bg-warning rounded" />
          <span className="text-muted-foreground">Significant ({significantTotal})</span>
        </div>
      </div>
    </div>
  );
}
