'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { WidgetConfig } from '@/lib/dashboards/types';

interface IncidentsCountWidgetProps {
  title?: string | null;
  config: WidgetConfig;
}

export function IncidentsCountWidget({ title, config }: IncidentsCountWidgetProps) {
  const [data, setData] = useState<{ total: number; open: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/dashboard/widgets/incidents-count');
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

  const total = data?.total ?? 0;
  const open = data?.open ?? 0;

  return (
    <div>
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        <AlertTriangle className="h-4 w-4" />
        <span className="text-sm font-medium">{title || 'Incidents'}</span>
      </div>
      <div className="flex items-baseline gap-3">
        <div>
          <span className="text-3xl font-bold">{total}</span>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        {open > 0 && (
          <div className="text-amber-600">
            <span className="text-xl font-bold">{open}</span>
            <p className="text-xs">Open</p>
          </div>
        )}
      </div>
    </div>
  );
}
