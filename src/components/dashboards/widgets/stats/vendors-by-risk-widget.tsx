'use client';

import { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import type { WidgetConfig } from '@/lib/dashboards/types';

interface VendorsByRiskWidgetProps {
  title?: string | null;
  config: WidgetConfig;
}

interface RiskData {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

export function VendorsByRiskWidget({ title, config }: VendorsByRiskWidgetProps) {
  const [data, setData] = useState<RiskData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/dashboard/widgets/vendors-by-risk');
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

  const risks = [
    { key: 'critical', label: 'Critical', color: 'bg-red-500', textColor: 'text-red-600', count: data?.critical ?? 0 },
    { key: 'high', label: 'High', color: 'bg-orange-500', textColor: 'text-orange-600', count: data?.high ?? 0 },
    { key: 'medium', label: 'Medium', color: 'bg-amber-500', textColor: 'text-amber-600', count: data?.medium ?? 0 },
    { key: 'low', label: 'Low', color: 'bg-emerald-500', textColor: 'text-emerald-600', count: data?.low ?? 0 },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 text-muted-foreground mb-3">
        <ShieldAlert className="h-4 w-4" />
        <span className="text-sm font-medium">{title || 'Vendors by Risk'}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {risks.map((risk) => (
          <div
            key={risk.key}
            className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
          >
            <div className={`h-3 w-3 rounded-full ${risk.color}`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">{risk.label}</p>
              <p className={`text-lg font-bold ${risk.textColor}`}>{risk.count}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
