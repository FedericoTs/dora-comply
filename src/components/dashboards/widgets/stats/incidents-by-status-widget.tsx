'use client';

import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import type { WidgetConfig } from '@/lib/dashboards/types';

interface IncidentsByStatusWidgetProps {
  title?: string | null;
  config: WidgetConfig;
}

interface StatusData {
  open: number;
  investigating: number;
  resolved: number;
  closed: number;
  total: number;
}

const STATUS_CONFIG = [
  { key: 'open', label: 'Open', color: 'bg-red-500', textColor: 'text-red-600' },
  { key: 'investigating', label: 'Investigating', color: 'bg-orange-500', textColor: 'text-orange-600' },
  { key: 'resolved', label: 'Resolved', color: 'bg-blue-500', textColor: 'text-blue-600' },
  { key: 'closed', label: 'Closed', color: 'bg-emerald-500', textColor: 'text-emerald-600' },
];

export function IncidentsByStatusWidget({ title, config }: IncidentsByStatusWidgetProps) {
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/dashboard/widgets/incidents-by-status');
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
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 text-muted-foreground mb-3">
        <Activity className="h-4 w-4" />
        <span className="text-sm font-medium">{title || 'Incidents by Status'}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {STATUS_CONFIG.map((status) => (
          <div
            key={status.key}
            className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
          >
            <div className={`h-3 w-3 rounded-full ${status.color}`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">{status.label}</p>
              <p className={`text-lg font-bold ${status.textColor}`}>
                {data?.[status.key as keyof StatusData] ?? 0}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-2 border-t text-center">
        <span className="text-xs text-muted-foreground">
          {data?.total ?? 0} total incidents
        </span>
      </div>
    </div>
  );
}
