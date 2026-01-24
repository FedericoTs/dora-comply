'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldOff, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { WidgetConfig } from '@/lib/dashboards/types';

interface HighRiskVendorsWidgetProps {
  title?: string | null;
  config: WidgetConfig;
}

interface VendorItem {
  id: string;
  name: string;
  risk_score: number;
  tier: 'critical' | 'important' | 'standard';
}

export function HighRiskVendorsWidget({ title, config }: HighRiskVendorsWidgetProps) {
  const [data, setData] = useState<VendorItem[]>([]);
  const [loading, setLoading] = useState(true);
  const limit = config.limit ?? 5;

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/dashboard/widgets/high-risk-vendors?limit=${limit}`);
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
  }, [limit]);

  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-10 bg-muted rounded" />
        ))}
      </div>
    );
  }

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-600 bg-red-100';
    if (score >= 60) return 'text-orange-600 bg-orange-100';
    return 'text-amber-600 bg-amber-100';
  };

  return (
    <div>
      <div className="flex items-center gap-2 text-muted-foreground mb-3">
        <ShieldOff className="h-4 w-4" />
        <span className="text-sm font-medium">{title || 'High Risk Vendors'}</span>
      </div>
      {data.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No high-risk vendors</p>
      ) : (
        <div className="space-y-2">
          {data.map((vendor) => (
            <Link
              key={vendor.id}
              href={`/vendors/${vendor.id}`}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{vendor.name}</p>
                  <Badge
                    variant="outline"
                    className="text-xs capitalize"
                  >
                    {vendor.tier}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold px-2 py-0.5 rounded ${getRiskColor(vendor.risk_score)}`}>
                  {vendor.risk_score}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
