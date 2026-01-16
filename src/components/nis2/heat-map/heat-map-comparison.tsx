'use client';

import { useMemo } from 'react';
import { ArrowRight, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { NIS2Risk } from '@/lib/nis2/types';
import { generateHeatMapComparison } from '@/lib/nis2/heat-map-utils';

interface HeatMapComparisonProps {
  risks: NIS2Risk[];
  toleranceThreshold?: number;
  className?: string;
}

export function HeatMapComparison({
  risks,
  toleranceThreshold = 9,
  className,
}: HeatMapComparisonProps) {
  const comparison = useMemo(() => {
    return generateHeatMapComparison(risks, toleranceThreshold);
  }, [risks, toleranceThreshold]);

  const { improvement } = comparison;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-emerald-600" />
          Risk Reduction Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-6">
          {/* Risks reduced */}
          <div className="text-center">
            <div className="text-3xl font-bold text-emerald-600">
              {improvement.risks_reduced > 0 ? `-${improvement.risks_reduced}` : improvement.risks_reduced}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              High/Critical risks reduced
            </div>
          </div>

          {/* Score reduction */}
          <div className="text-center border-x">
            <div className="text-3xl font-bold">
              {improvement.avg_score_reduction > 0 ? `-${improvement.avg_score_reduction}` : improvement.avg_score_reduction}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Avg. score reduction
            </div>
          </div>

          {/* Percentage reduction */}
          <div className="text-center">
            <div className={cn(
              'text-3xl font-bold',
              improvement.percentage_reduction > 0 ? 'text-emerald-600' : 'text-muted-foreground'
            )}>
              {improvement.percentage_reduction > 0 ? `-${improvement.percentage_reduction}%` : `${improvement.percentage_reduction}%`}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Overall risk reduction
            </div>
          </div>
        </div>

        {/* Visual comparison */}
        <div className="mt-6 pt-6 border-t">
          <div className="flex items-center justify-center gap-8">
            <MiniHeatMap
              matrix={comparison.inherent}
              label="Inherent Risk"
            />
            <div className="flex flex-col items-center gap-1">
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Controls</span>
            </div>
            <MiniHeatMap
              matrix={comparison.residual}
              label="Residual Risk"
            />
          </div>
        </div>

        {improvement.percentage_reduction > 0 && (
          <p className="text-center text-sm text-muted-foreground mt-4">
            Your controls have reduced overall risk exposure by{' '}
            <span className="font-medium text-emerald-600">{improvement.percentage_reduction}%</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// Mini heat map for comparison view
interface MiniHeatMapProps {
  matrix: import('@/lib/nis2/types').HeatMapData;
  label: string;
}

function MiniHeatMap({ matrix, label }: MiniHeatMapProps) {
  const getCellColor = (level: string, hasRisks: boolean) => {
    const colors: Record<string, { empty: string; filled: string }> = {
      low: { empty: 'bg-emerald-50', filled: 'bg-emerald-200' },
      medium: { empty: 'bg-amber-50', filled: 'bg-amber-200' },
      high: { empty: 'bg-orange-50', filled: 'bg-orange-200' },
      critical: { empty: 'bg-red-50', filled: 'bg-red-200' },
    };
    return hasRisks ? colors[level].filled : colors[level].empty;
  };

  return (
    <div className="flex flex-col items-center">
      <div className="grid grid-cols-5 gap-0.5">
        {matrix.flatMap((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={cn(
                'w-4 h-4 rounded-sm border border-border/50',
                getCellColor(cell.level, cell.risk_count > 0)
              )}
              title={`${cell.risk_count} risks`}
            >
              {cell.risk_count > 0 && (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-[8px] font-medium">{cell.risk_count}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      <span className="text-xs text-muted-foreground mt-2">{label}</span>
    </div>
  );
}
