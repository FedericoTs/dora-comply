'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { WidgetConfig } from '@/lib/dashboards/types';

interface OpenIncidentsWidgetProps {
  title?: string | null;
  config: WidgetConfig;
}

interface IncidentItem {
  id: string;
  title: string;
  severity: 'critical' | 'major' | 'minor';
  status: string;
  detected_at: string;
}

export function OpenIncidentsWidget({ title, config }: OpenIncidentsWidgetProps) {
  const [data, setData] = useState<IncidentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const limit = config.limit ?? 5;

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/dashboard/widgets/open-incidents?limit=${limit}`);
        if (res.ok) {
          const json = await res.json();
          setData(json.incidents || []);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [limit]);

  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-12 bg-muted rounded" />
        ))}
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'major':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      default:
        return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div>
      <div className="flex items-center gap-2 text-muted-foreground mb-3">
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm font-medium">{title || 'Open Incidents'}</span>
      </div>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No open incidents</p>
      ) : (
        <div className="space-y-2">
          {data.map((incident) => (
            <Link
              key={incident.id}
              href={`/incidents/${incident.id}`}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{incident.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className={`text-xs capitalize ${getSeverityColor(incident.severity)}`}>
                    {incident.severity}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(incident.detected_at)}
                  </span>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
