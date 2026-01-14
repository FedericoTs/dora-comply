'use client';

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { ConcentrationThresholds, ConcentrationSeverity } from './types';

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  threshold: ConcentrationThresholds;
}

export function MetricCard({ icon, title, value, threshold }: MetricCardProps) {
  const severity: ConcentrationSeverity =
    value >= threshold.critical ? 'critical' :
    value >= threshold.warning ? 'warning' : 'ok';

  return (
    <div
      className={cn('p-4 rounded-lg border', {
        'bg-red-500/10 border-red-500/30': severity === 'critical',
        'bg-amber-500/10 border-amber-500/30': severity === 'warning',
        'bg-muted/30 border-border': severity === 'ok',
      })}
    >
      <div className="flex items-center gap-2 mb-2">
        <div
          className={cn('p-1.5 rounded', {
            'bg-red-500/20 text-red-600': severity === 'critical',
            'bg-amber-500/20 text-amber-600': severity === 'warning',
            'bg-muted text-muted-foreground': severity === 'ok',
          })}
        >
          {icon}
        </div>
        <span className="text-sm font-medium">{title}</span>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-2xl font-bold">{value.toFixed(0)}%</span>
        <Badge
          variant="outline"
          className={cn('text-xs', {
            'border-red-500 text-red-600': severity === 'critical',
            'border-amber-500 text-amber-600': severity === 'warning',
            'border-emerald-500 text-emerald-600': severity === 'ok',
          })}
        >
          {severity === 'ok' ? 'OK' : severity}
        </Badge>
      </div>
      <Progress
        value={value}
        className={cn('mt-2 h-1.5', {
          '[&>div]:bg-red-500': severity === 'critical',
          '[&>div]:bg-amber-500': severity === 'warning',
          '[&>div]:bg-emerald-500': severity === 'ok',
        })}
      />
    </div>
  );
}
