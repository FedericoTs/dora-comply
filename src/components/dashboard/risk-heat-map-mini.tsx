'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ============================================================================
// Types
// ============================================================================

export interface RiskCount {
  /** Number of risks at this position */
  count: number;
  /** Likelihood (1-5) */
  likelihood: number;
  /** Impact (1-5) */
  impact: number;
}

interface RiskHeatMapMiniProps {
  /** Risk counts at each position */
  risks: RiskCount[];
  /** Show legend */
  showLegend?: boolean;
  /** Link when clicking the heat map */
  href?: string;
  /** Card title */
  title?: string;
  className?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getCellColor(likelihood: number, impact: number): string {
  const score = likelihood * impact;

  if (score >= 16) return 'bg-red-500 dark:bg-red-600'; // Critical
  if (score >= 10) return 'bg-orange-500 dark:bg-orange-600'; // High
  if (score >= 5) return 'bg-amber-400 dark:bg-amber-500'; // Medium
  return 'bg-emerald-400 dark:bg-emerald-500'; // Low
}

function getCellOpacity(count: number, maxCount: number): number {
  if (count === 0) return 0.15;
  return Math.max(0.4, Math.min(1, count / Math.max(maxCount, 1)));
}

// ============================================================================
// Component
// ============================================================================

export function RiskHeatMapMini({
  risks,
  showLegend = true,
  href,
  title = 'Risk Heat Map',
  className,
}: RiskHeatMapMiniProps) {
  // Create 5x5 grid with counts
  const grid: number[][] = Array(5)
    .fill(null)
    .map(() => Array(5).fill(0));

  // Populate grid
  for (const risk of risks) {
    const li = risk.likelihood - 1; // 0-indexed
    const im = risk.impact - 1;
    if (li >= 0 && li < 5 && im >= 0 && im < 5) {
      grid[4 - li][im] = risk.count; // Flip Y axis (5 at top)
    }
  }

  // Find max count for opacity scaling
  const maxCount = Math.max(...risks.map((r) => r.count), 1);

  // Total risks
  const totalRisks = risks.reduce((sum, r) => sum + r.count, 0);

  // Count by level
  const criticalCount = risks
    .filter((r) => r.likelihood * r.impact >= 16)
    .reduce((sum, r) => sum + r.count, 0);
  const highCount = risks
    .filter((r) => {
      const score = r.likelihood * r.impact;
      return score >= 10 && score < 16;
    })
    .reduce((sum, r) => sum + r.count, 0);

  const heatMapContent = (
    <div className="space-y-4">
      {/* Grid */}
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

      {/* Axis labels */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="transform -rotate-90 origin-left translate-y-4">
          Likelihood →
        </span>
        <span className="text-center flex-1">Impact →</span>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex items-center justify-center gap-3 text-xs">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
            <span className="text-muted-foreground">Low</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-400" />
            <span className="text-muted-foreground">Med</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-orange-500" />
            <span className="text-muted-foreground">High</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-500" />
            <span className="text-muted-foreground">Crit</span>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="flex items-center justify-between text-xs border-t pt-3">
        <span className="text-muted-foreground">
          {totalRisks} total risks
        </span>
        {criticalCount + highCount > 0 && (
          <span className="text-orange-600 dark:text-orange-400 font-medium">
            {criticalCount + highCount} need attention
          </span>
        )}
      </div>
    </div>
  );

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {href ? (
          <Link href={href} className="block hover:opacity-90 transition-opacity">
            {heatMapContent}
          </Link>
        ) : (
          heatMapContent
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Sample Data Generator
// ============================================================================

export function generateSampleRiskData(): RiskCount[] {
  // Generate sample risk distribution
  const risks: RiskCount[] = [];

  // Low risks (bottom-left quadrant)
  risks.push({ likelihood: 1, impact: 1, count: 5 });
  risks.push({ likelihood: 1, impact: 2, count: 3 });
  risks.push({ likelihood: 2, impact: 1, count: 4 });
  risks.push({ likelihood: 2, impact: 2, count: 6 });

  // Medium risks
  risks.push({ likelihood: 2, impact: 3, count: 3 });
  risks.push({ likelihood: 3, impact: 2, count: 4 });
  risks.push({ likelihood: 3, impact: 3, count: 2 });

  // High risks
  risks.push({ likelihood: 3, impact: 4, count: 2 });
  risks.push({ likelihood: 4, impact: 3, count: 1 });
  risks.push({ likelihood: 4, impact: 4, count: 1 });

  // Critical risks
  risks.push({ likelihood: 4, impact: 5, count: 1 });
  risks.push({ likelihood: 5, impact: 4, count: 1 });

  return risks;
}
