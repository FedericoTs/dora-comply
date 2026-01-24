'use client';

import { useEffect, useState } from 'react';
import { CheckSquare } from 'lucide-react';
import type { WidgetConfig } from '@/lib/dashboards/types';

interface TasksCountWidgetProps {
  title?: string | null;
  config: WidgetConfig;
}

export function TasksCountWidget({ title, config }: TasksCountWidgetProps) {
  const [data, setData] = useState<{ total: number; completed: number; pending: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/dashboard/widgets/tasks-count');
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
      <div className="animate-pulse">
        <div className="h-4 w-24 bg-muted rounded mb-2" />
        <div className="h-8 w-16 bg-muted rounded" />
      </div>
    );
  }

  const pending = data?.pending ?? 0;
  const completed = data?.completed ?? 0;
  const total = data?.total ?? 0;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div>
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        <CheckSquare className="h-4 w-4" />
        <span className="text-sm font-medium">{title || 'Open Tasks'}</span>
      </div>
      <div className="flex items-baseline gap-3">
        <div>
          <span className="text-3xl font-bold">{pending}</span>
          <p className="text-xs text-muted-foreground">Pending</p>
        </div>
        <div className="text-emerald-600">
          <span className="text-lg font-medium">{completionRate}%</span>
          <p className="text-xs">Complete</p>
        </div>
      </div>
    </div>
  );
}
