'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

export interface SparklineProps {
  /** Array of numeric values to plot */
  data: number[];
  /** Width of the sparkline in pixels */
  width?: number;
  /** Height of the sparkline in pixels */
  height?: number;
  /** Color theme - 'auto' picks based on trend direction */
  color?: 'auto' | 'primary' | 'success' | 'warning' | 'error' | 'muted';
  /** Show a dot at the endpoint */
  showEndpoint?: boolean;
  /** Show filled area under the line */
  showArea?: boolean;
  /** Line stroke width */
  strokeWidth?: number;
  /** Additional class names */
  className?: string;
}

/**
 * Sparkline - Mini inline chart for trend visualization
 *
 * Usage:
 * ```tsx
 * <Sparkline data={[10, 15, 12, 18, 22, 20]} />
 * <Sparkline data={values} color="auto" showEndpoint />
 * ```
 */
export function Sparkline({
  data,
  width = 80,
  height = 24,
  color = 'primary',
  showEndpoint = false,
  showArea = false,
  strokeWidth = 1.5,
  className,
}: SparklineProps) {
  const { path, areaPath, endPoint, strokeColor, fillColor } = useMemo(() => {
    if (!data || data.length < 2) {
      return { path: '', areaPath: '', endPoint: null, strokeColor: '', fillColor: '' };
    }

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    // Padding to prevent clipping
    const padding = 2;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Generate points
    const points = data.map((value, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = padding + chartHeight - ((value - min) / range) * chartHeight;
      return { x, y };
    });

    // Create SVG path
    const pathData = points
      .map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
      .join(' ');

    // Create area path (for filled version)
    const areaPathData = [
      ...points.map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`),
      `L ${points[points.length - 1].x.toFixed(2)} ${height - padding}`,
      `L ${padding} ${height - padding}`,
      'Z',
    ].join(' ');

    // Determine trend for auto color
    const firstValue = data[0];
    const lastValue = data[data.length - 1];
    const trend = lastValue > firstValue ? 'up' : lastValue < firstValue ? 'down' : 'flat';

    // Color mapping
    let resolvedColor = color;
    if (color === 'auto') {
      resolvedColor = trend === 'up' ? 'success' : trend === 'down' ? 'error' : 'muted';
    }

    const colorMap: Record<string, { stroke: string; fill: string }> = {
      primary: { stroke: 'stroke-primary', fill: 'fill-primary/20' },
      success: { stroke: 'stroke-emerald-500', fill: 'fill-emerald-500/20' },
      warning: { stroke: 'stroke-amber-500', fill: 'fill-amber-500/20' },
      error: { stroke: 'stroke-red-500', fill: 'fill-red-500/20' },
      muted: { stroke: 'stroke-muted-foreground', fill: 'fill-muted-foreground/20' },
    };

    const colors = colorMap[resolvedColor] || colorMap.primary;

    return {
      path: pathData,
      areaPath: areaPathData,
      endPoint: points[points.length - 1],
      strokeColor: colors.stroke,
      fillColor: colors.fill,
    };
  }, [data, width, height, color]);

  if (!data || data.length < 2) {
    return (
      <div
        className={cn('flex items-center justify-center text-muted-foreground', className)}
        style={{ width, height }}
      >
        <span className="text-xs">—</span>
      </div>
    );
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('overflow-visible', className)}
      aria-label={`Sparkline showing trend from ${data[0]} to ${data[data.length - 1]}`}
    >
      {/* Area fill */}
      {showArea && (
        <path
          d={areaPath}
          className={fillColor}
          strokeWidth={0}
        />
      )}

      {/* Line */}
      <path
        d={path}
        fill="none"
        className={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Endpoint dot */}
      {showEndpoint && endPoint && (
        <circle
          cx={endPoint.x}
          cy={endPoint.y}
          r={3}
          className={cn(strokeColor.replace('stroke-', 'fill-'))}
        />
      )}
    </svg>
  );
}

/**
 * SparklineWithValue - Sparkline with current value displayed
 */
export interface SparklineWithValueProps extends SparklineProps {
  /** Current value to display */
  value?: number | string;
  /** Format function for the value */
  formatValue?: (value: number | string) => string;
  /** Position of the value */
  valuePosition?: 'left' | 'right';
}

export function SparklineWithValue({
  value,
  formatValue,
  valuePosition = 'left',
  ...sparklineProps
}: SparklineWithValueProps) {
  const displayValue = formatValue ? formatValue(value ?? sparklineProps.data[sparklineProps.data.length - 1]) : value;

  return (
    <div className="flex items-center gap-2">
      {valuePosition === 'left' && displayValue !== undefined && (
        <span className="text-sm font-medium tabular-nums">{displayValue}</span>
      )}
      <Sparkline {...sparklineProps} />
      {valuePosition === 'right' && displayValue !== undefined && (
        <span className="text-sm font-medium tabular-nums">{displayValue}</span>
      )}
    </div>
  );
}
