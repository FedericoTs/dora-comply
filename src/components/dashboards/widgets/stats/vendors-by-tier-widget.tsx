'use client';

import { useEffect, useState } from 'react';
import { Layers } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { WidgetConfig } from '@/lib/dashboards/types';

interface VendorsByTierWidgetProps {
  title?: string | null;
  config: WidgetConfig;
}

interface TierData {
  critical: number;
  important: number;
  standard: number;
  total: number;
}

export function VendorsByTierWidget({ title, config }: VendorsByTierWidgetProps) {
  const [data, setData] = useState<TierData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/dashboard/widgets/vendors-by-tier');
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
      <div className="space-y-3 animate-pulse">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="h-3 w-16 bg-muted rounded" />
            <div className="h-2 w-full bg-muted rounded" />
          </div>
        ))}
      </div>
    );
  }

  const tiers = [
    { key: 'critical', label: 'Critical', color: 'bg-red-500', count: data?.critical ?? 0 },
    { key: 'important', label: 'Important', color: 'bg-amber-500', count: data?.important ?? 0 },
    { key: 'standard', label: 'Standard', color: 'bg-slate-400', count: data?.standard ?? 0 },
  ];

  const total = data?.total || 1;

  return (
    <div>
      <div className="flex items-center gap-2 text-muted-foreground mb-3">
        <Layers className="h-4 w-4" />
        <span className="text-sm font-medium">{title || 'Vendors by Tier'}</span>
      </div>
      <div className="space-y-3">
        {tiers.map((tier) => (
          <div key={tier.key}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">{tier.label}</span>
              <span className="font-medium">{tier.count}</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${tier.color} transition-all`}
                style={{ width: `${(tier.count / total) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
