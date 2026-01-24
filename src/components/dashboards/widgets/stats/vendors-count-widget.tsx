'use client';

import { useEffect, useState } from 'react';
import { Building2, TrendingUp, TrendingDown } from 'lucide-react';
import type { WidgetConfig } from '@/lib/dashboards/types';

interface VendorsCountWidgetProps {
  title?: string | null;
  config: WidgetConfig;
}

export function VendorsCountWidget({ title, config }: VendorsCountWidgetProps) {
  const [data, setData] = useState<{ total: number; change?: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/dashboard/widgets/vendors-count');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch {
        // Silently fail - show placeholder
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
  const change = data?.change;

  return (
    <div>
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        <Building2 className="h-4 w-4" />
        <span className="text-sm font-medium">{title || 'Total Vendors'}</span>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold">{total}</span>
        {change !== undefined && change !== 0 && (
          <span
            className={`flex items-center text-sm ${
              change > 0 ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {change > 0 ? (
              <TrendingUp className="h-3 w-3 mr-0.5" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-0.5" />
            )}
            {Math.abs(change)}
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-1">Active third parties</p>
    </div>
  );
}
