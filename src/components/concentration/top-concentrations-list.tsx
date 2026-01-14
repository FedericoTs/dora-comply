'use client';

import { Badge } from '@/components/ui/badge';
import type { ConcentrationMetrics } from './types';

interface TopConcentrationsListProps {
  metrics: ConcentrationMetrics;
}

export function TopConcentrationsList({ metrics }: TopConcentrationsListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
      <div>
        <h4 className="text-sm font-medium mb-2">Top Countries</h4>
        <div className="space-y-2">
          {metrics.topCountries.slice(0, 3).map((c) => (
            <div key={c.country} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{c.country}</span>
              <Badge variant="secondary">{c.percentage.toFixed(0)}%</Badge>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h4 className="text-sm font-medium mb-2">Top Services</h4>
        <div className="space-y-2">
          {metrics.topServices.slice(0, 3).map((s) => (
            <div key={s.service} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground truncate">{s.service}</span>
              <Badge variant="secondary">{s.percentage.toFixed(0)}%</Badge>
            </div>
          ))}
        </div>
      </div>
      <div>
        <h4 className="text-sm font-medium mb-2">Critical Vendors</h4>
        <div className="space-y-2">
          {metrics.topVendors.slice(0, 3).map((v) => (
            <div key={v.name} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground truncate">{v.name}</span>
              <Badge variant="outline">Critical</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
