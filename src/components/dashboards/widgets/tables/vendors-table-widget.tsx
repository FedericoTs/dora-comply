'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Table2, ChevronRight, ArrowUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { WidgetConfig } from '@/lib/dashboards/types';

interface VendorsTableWidgetProps {
  title?: string | null;
  config: WidgetConfig;
}

interface Vendor {
  id: string;
  name: string;
  tier: 'critical' | 'important' | 'standard';
  risk_score: number | null;
  status: string;
}

type SortField = 'name' | 'tier' | 'risk_score';
type SortDir = 'asc' | 'desc';

const TIER_COLORS: Record<string, string> = {
  critical: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  important: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  standard: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

export function VendorsTableWidget({ title, config }: VendorsTableWidgetProps) {
  const [data, setData] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<SortField>('risk_score');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const limit = config.limit ?? 5;

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(
          `/api/dashboard/widgets/vendors-table?limit=${limit}&sort=${sortField}&dir=${sortDir}`
        );
        if (res.ok) {
          const json = await res.json();
          setData(json.vendors || []);
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

  const getRiskColor = (score: number | null) => {
    if (score === null) return 'text-muted-foreground';
    if (score >= 80) return 'text-red-600';
    if (score >= 60) return 'text-orange-600';
    if (score >= 30) return 'text-amber-600';
    return 'text-emerald-600';
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-2 text-muted-foreground mb-3">
        <Table2 className="h-4 w-4" />
        <span className="text-sm font-medium">{title || 'Vendors'}</span>
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th
                className="text-left py-2 font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                onClick={() => toggleSort('name')}
              >
                <div className="flex items-center gap-1">
                  Name
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                className="text-left py-2 font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                onClick={() => toggleSort('tier')}
              >
                <div className="flex items-center gap-1">
                  Tier
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th
                className="text-right py-2 font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                onClick={() => toggleSort('risk_score')}
              >
                <div className="flex items-center justify-end gap-1">
                  Risk
                  <ArrowUpDown className="h-3 w-3" />
                </div>
              </th>
              <th className="w-6"></th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-4 text-muted-foreground">
                  No vendors found
                </td>
              </tr>
            ) : (
              data.map((vendor) => (
                <tr key={vendor.id} className="border-b last:border-0 group">
                  <td className="py-2">
                    <Link
                      href={`/vendors/${vendor.id}`}
                      className="font-medium hover:underline truncate block max-w-[150px]"
                    >
                      {vendor.name}
                    </Link>
                  </td>
                  <td className="py-2">
                    <Badge
                      variant="outline"
                      className={cn('text-xs capitalize', TIER_COLORS[vendor.tier])}
                    >
                      {vendor.tier}
                    </Badge>
                  </td>
                  <td
                    className={cn(
                      'py-2 text-right font-bold tabular-nums',
                      getRiskColor(vendor.risk_score)
                    )}
                  >
                    {vendor.risk_score ?? '-'}
                  </td>
                  <td className="py-2">
                    <Link href={`/vendors/${vendor.id}`}>
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
