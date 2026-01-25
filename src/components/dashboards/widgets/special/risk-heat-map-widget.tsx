'use client';

import { useEffect, useState } from 'react';
import { Grid3X3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WidgetConfig } from '@/lib/dashboards/types';

interface RiskHeatMapWidgetProps {
  title?: string | null;
  config: WidgetConfig;
}

interface RiskCount {
  count: number;
  likelihood: number;
  impact: number;
}

interface RiskData {
  risks: RiskCount[];
  total: number;
  criticalCount: number;
  highCount: number;
}

function getCellColor(likelihood: number, impact: number): string {
  const score = likelihood * impact;

  if (score >= 16) return 'bg-red-500 dark:bg-red-600';
  if (score >= 10) return 'bg-orange-500 dark:bg-orange-600';
  if (score >= 5) return 'bg-amber-400 dark:bg-amber-500';
  return 'bg-emerald-400 dark:bg-emerald-500';
}

function getCellOpacity(count: number, maxCount: number): number {
  if (count === 0) return 0.15;
  return Math.max(0.4, Math.min(1, count / Math.max(maxCount, 1)));
}

export function RiskHeatMapWidget({ title, config }: RiskHeatMapWidgetProps) {
  const [data, setData] = useState<RiskData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/dashboard/widgets/risk-heat-map');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center animate-pulse">
        <div className="grid grid-cols-5 gap-1">
          {Array.from({ length: 25 }).map((_, i) => (
            <div key={i} className="w-6 h-6 bg-muted rounded-sm" />
          ))}
        </div>
      </div>
    );
  }

  const risks = data?.risks || [];

  // Create 5x5 grid with counts
  const grid: number[][] = Array(5)
    .fill(null)
    .map(() => Array(5).fill(0));

  // Populate grid
  for (const risk of risks) {
    const li = risk.likelihood - 1;
    const im = risk.impact - 1;
    if (li >= 0 && li < 5 && im >= 0 && im < 5) {
      grid[4 - li][im] = risk.count;
    }
  }

  const maxCount = Math.max(...risks.map((r) => r.count), 1);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <Grid3X3 className="h-4 w-4" />
        <span className="text-sm font-medium">{title || 'Risk Heat Map'}</span>
      </div>
      <div className="flex-1 flex flex-col justify-center">
        <div className="flex gap-1">
          {/* Y-axis label */}
          <div className="flex flex-col justify-between pr-1 text-[10px] text-muted-foreground">
            <span>5</span>
            <span>4</span>
            <span>3</span>
            <span>2</span>
            <span>1</span>
          </div>

          {/* Grid cells */}
          <div className="flex-1">
            <div className="grid grid-cols-5 gap-0.5">
              {grid.map((row, rowIdx) =>
                row.map((count, colIdx) => {
                  const likelihood = 5 - rowIdx;
                  const impact = colIdx + 1;
                  const baseColor = getCellColor(likelihood, impact);
                  const opacity = getCellOpacity(count, maxCount);

                  return (
                    <div
                      key={`${rowIdx}-${colIdx}`}
                      className={cn(
                        'aspect-square rounded-sm flex items-center justify-center text-[10px] font-medium transition-all',
                        baseColor,
                        count > 0 ? 'text-white' : 'text-transparent'
                      )}
                      style={{ opacity }}
                      title={`L${likelihood} x I${impact}: ${count} risks`}
                    >
                      {count > 0 ? count : ''}
                    </div>
                  );
                })
              )}
            </div>
            {/* X-axis label */}
            <div className="flex justify-between mt-1 text-[10px] text-muted-foreground px-0.5">
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-2 text-[10px] mt-3">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-emerald-400" />
            <span className="text-muted-foreground">Low</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-amber-400" />
            <span className="text-muted-foreground">Med</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-orange-500" />
            <span className="text-muted-foreground">High</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm bg-red-500" />
            <span className="text-muted-foreground">Crit</span>
          </div>
        </div>

        {/* Summary */}
        <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t">
          <span className="text-muted-foreground">{data?.total ?? 0} total risks</span>
          {(data?.criticalCount ?? 0) + (data?.highCount ?? 0) > 0 && (
            <span className="text-orange-600 dark:text-orange-400 font-medium">
              {(data?.criticalCount ?? 0) + (data?.highCount ?? 0)} need attention
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
