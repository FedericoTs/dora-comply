'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { scoreToGrade, gradeToColor } from '@/lib/external/securityscorecard-types';
import { cn } from '@/lib/utils';

interface ScoreHistoryEntry {
  id: string;
  score: number;
  grade: string;
  recorded_at: string;
}

interface ScoreTrendChartProps {
  history: ScoreHistoryEntry[];
  className?: string;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function TrendIndicator({ change }: { change: number }) {
  if (change === 0) {
    return (
      <Badge variant="outline" className="gap-1">
        <Minus className="h-3 w-3" />
        Stable
      </Badge>
    );
  }

  const isPositive = change > 0;
  return (
    <Badge
      variant="outline"
      className={cn('gap-1', isPositive ? 'text-success border-success/30' : 'text-error border-error/30')}
    >
      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {isPositive ? '+' : ''}{change} pts
    </Badge>
  );
}

export function ScoreTrendChart({ history, className }: ScoreTrendChartProps) {
  const chartData = useMemo(() => {
    if (!history || history.length === 0) return null;

    // Take last 30 entries and reverse for chronological order
    const entries = [...history].slice(0, 30).reverse();
    const scores = entries.map(e => e.score);
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const range = max - min || 10; // Avoid division by zero

    // Calculate trend
    const firstScore = scores[0];
    const lastScore = scores[scores.length - 1];
    const change = lastScore - firstScore;

    return {
      entries,
      scores,
      min: Math.max(0, min - 5),
      max: Math.min(100, max + 5),
      range,
      change,
    };
  }, [history]);

  if (!chartData || chartData.entries.length < 2) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground text-center py-4">
            Not enough history for trend analysis
          </p>
        </CardContent>
      </Card>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { entries, min, max, range, change } = chartData;

  // Generate SVG path for the line chart
  const width = 100;
  const height = 40;
  const padding = 2;
  const effectiveWidth = width - (padding * 2);
  const effectiveHeight = height - (padding * 2);

  const points = entries.map((entry, i) => {
    const x = padding + (i / (entries.length - 1)) * effectiveWidth;
    const y = padding + effectiveHeight - ((entry.score - min) / (max - min)) * effectiveHeight;
    return `${x},${y}`;
  });

  const linePath = `M ${points.join(' L ')}`;

  // Generate gradient area path
  const areaPath = `M ${padding},${height - padding} L ${points.join(' L ')} L ${width - padding},${height - padding} Z`;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Score Trend</CardTitle>
          <TrendIndicator change={change} />
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {/* Mini Chart */}
        <div className="relative h-24 mb-3">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
            {/* Grid lines */}
            <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" />
            <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" />
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="currentColor" strokeOpacity="0.1" strokeWidth="0.5" />

            {/* Gradient area */}
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#scoreGradient)" />

            {/* Line */}
            <path
              d={linePath}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Current point */}
            <circle
              cx={width - padding}
              cy={padding + effectiveHeight - ((entries[entries.length - 1].score - min) / (max - min)) * effectiveHeight}
              r="2"
              fill="hsl(var(--primary))"
            />
          </svg>

          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] text-muted-foreground pr-1">
            <span>{max}</span>
            <span>{Math.round((max + min) / 2)}</span>
            <span>{min}</span>
          </div>
        </div>

        {/* Recent entries */}
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground font-medium">Recent Changes</p>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {entries.slice(-7).map((entry, i, arr) => {
              const prevScore = i > 0 ? arr[i - 1].score : entry.score;
              const diff = entry.score - prevScore;
              const grade = scoreToGrade(entry.score);

              return (
                <div
                  key={entry.id}
                  className="flex flex-col items-center px-2 py-1.5 rounded bg-muted/50 min-w-[48px]"
                >
                  <span
                    className="text-xs font-semibold"
                    style={{ color: gradeToColor(grade) }}
                  >
                    {entry.score}
                  </span>
                  {i > 0 && diff !== 0 && (
                    <span className={cn(
                      'text-[10px]',
                      diff > 0 ? 'text-success' : 'text-error'
                    )}>
                      {diff > 0 ? '+' : ''}{diff}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground mt-0.5">
                    {formatDate(entry.recorded_at)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-3 pt-3 border-t">
          <span>
            {entries.length} data points
          </span>
          <span>
            {formatDate(entries[0].recorded_at)} - {formatDate(entries[entries.length - 1].recorded_at)}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// Compact sparkline version
export function ScoreSparkline({ history }: { history: ScoreHistoryEntry[] }) {
  if (!history || history.length < 2) {
    return null;
  }

  const entries = [...history].slice(0, 14).reverse();
  const scores = entries.map(e => e.score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);

  const width = 60;
  const height = 20;

  const points = entries.map((entry, i) => {
    const x = (i / (entries.length - 1)) * width;
    const y = height - ((entry.score - min) / (max - min || 1)) * height;
    return `${x},${y}`;
  });

  const linePath = `M ${points.join(' L ')}`;

  const change = scores[scores.length - 1] - scores[0];
  const strokeColor = change >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))';

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-16 h-5">
      <path
        d={linePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
