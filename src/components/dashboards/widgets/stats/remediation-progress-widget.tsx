'use client';

import { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { WidgetConfig } from '@/lib/dashboards/types';

interface RemediationProgressWidgetProps {
  title?: string | null;
  config: WidgetConfig;
}

interface ProgressData {
  completed: number;
  total: number;
  percentage: number;
  byPriority: {
    critical: { completed: number; total: number };
    high: { completed: number; total: number };
    medium: { completed: number; total: number };
    low: { completed: number; total: number };
  };
}

const PRIORITY_CONFIG = [
  { key: 'critical', label: 'Critical', color: 'bg-red-500', progressColor: 'bg-red-500' },
  { key: 'high', label: 'High', color: 'bg-orange-500', progressColor: 'bg-orange-500' },
  { key: 'medium', label: 'Medium', color: 'bg-amber-500', progressColor: 'bg-amber-500' },
  { key: 'low', label: 'Low', color: 'bg-emerald-500', progressColor: 'bg-emerald-500' },
];

export function RemediationProgressWidget({ title, config }: RemediationProgressWidgetProps) {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/dashboard/widgets/remediation-progress');
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
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-24 bg-muted rounded" />
        <div className="h-16 bg-muted rounded" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-6 bg-muted rounded" />
          ))}
        </div>
      </div>
    );
  }

  const percentage = data?.percentage ?? 0;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 text-muted-foreground mb-3">
        <TrendingUp className="h-4 w-4" />
        <span className="text-sm font-medium">{title || 'Remediation Progress'}</span>
      </div>

      {/* Main Progress */}
      <div className="p-3 rounded-lg bg-muted/50 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Overall Completion</span>
          <span
            className={cn(
              'text-lg font-bold',
              percentage >= 80
                ? 'text-emerald-600'
                : percentage >= 50
                  ? 'text-amber-600'
                  : 'text-red-600'
            )}
          >
            {percentage}%
          </span>
        </div>
        <Progress value={percentage} className="h-2" />
        <p className="text-xs text-muted-foreground mt-1">
          {data?.completed ?? 0} of {data?.total ?? 0} actions completed
        </p>
      </div>

      {/* By Priority */}
      <div className="flex-1 space-y-2 overflow-auto">
        {PRIORITY_CONFIG.map((priority) => {
          const priorityData =
            data?.byPriority?.[priority.key as keyof typeof data.byPriority];
          const total = priorityData?.total ?? 0;
          const completed = priorityData?.completed ?? 0;
          const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

          if (total === 0) return null;

          return (
            <div key={priority.key} className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${priority.color}`} />
              <span className="text-xs text-muted-foreground flex-1">{priority.label}</span>
              <span className="text-xs font-medium tabular-nums">
                {completed}/{total}
              </span>
              <div className="w-16">
                <Progress
                  value={pct}
                  className="h-1.5"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
