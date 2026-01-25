'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Table2, ChevronRight, ArrowUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { WidgetConfig } from '@/lib/dashboards/types';

interface IncidentsTableWidgetProps {
  title?: string | null;
  config: WidgetConfig;
}

interface Incident {
  id: string;
  reference_number: string;
  title: string;
  severity: 'critical' | 'major' | 'significant' | 'minor';
  status: string;
  created_at: string;
}

type SortField = 'reference_number' | 'severity' | 'created_at';
type SortDir = 'asc' | 'desc';

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  major: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  significant: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  minor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  investigating: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  resolved: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  closed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

export function IncidentsTableWidget({ title, config }: IncidentsTableWidgetProps) {
  const [data, setData] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const limit = config.limit ?? 5;

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(
          `/api/dashboard/widgets/incidents-table?limit=${limit}&sort=${sortField}&dir=${sortDir}`
        );
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
  }, [limit, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        <div className="h-8 bg-muted rounded" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-10 bg-muted rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 text-muted-foreground mb-3">
        <Table2 className="h-4 w-4" />
        <span className="text-sm font-medium">{title || 'Incidents'}</span>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th
                className="text-left py-2 font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                onClick={() => toggleSort('reference_number')}
              >
                <div className="flex items-center gap-1">
                  Ref
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="text-left py-2 font-medium text-muted-foreground">Title</th>
              <th
                className="text-left py-2 font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                onClick={() => toggleSort('severity')}
              >
                <div className="flex items-center gap-1">
                  Severity
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="text-left py-2 font-medium text-muted-foreground">Status</th>
              <th className="w-6"></th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-4 text-muted-foreground">
                  No incidents found
                </td>
              </tr>
            ) : (
              data.map((incident) => (
                <tr key={incident.id} className="border-b last:border-0 group">
                  <td className="py-2">
                    <Link
                      href={`/incidents/${incident.id}`}
                      className="font-mono text-xs hover:underline"
                    >
                      {incident.reference_number}
                    </Link>
                  </td>
                  <td className="py-2">
                    <span className="truncate block max-w-[120px]" title={incident.title}>
                      {incident.title}
                    </span>
                  </td>
                  <td className="py-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs capitalize',
                        SEVERITY_COLORS[incident.severity] || SEVERITY_COLORS.minor
                      )}
                    >
                      {incident.severity}
                    </Badge>
                  </td>
                  <td className="py-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs capitalize',
                        STATUS_COLORS[incident.status?.toLowerCase()] || STATUS_COLORS.open
                      )}
                    >
                      {incident.status}
                    </Badge>
                  </td>
                  <td className="py-2">
                    <Link href={`/incidents/${incident.id}`}>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
