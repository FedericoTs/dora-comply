'use client';

import dynamic from 'next/dynamic';
import type { VendorStats } from '@/lib/vendors/types';
import type { VendorTrendData, TimePeriod } from '@/components/vendors/vendor-stats-dashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

// Dynamic import with ssr:false to prevent hydration issues
const VendorStatsDashboard = dynamic(
  () => import('@/components/vendors/vendor-stats-dashboard').then(mod => mod.VendorStatsDashboard),
  {
    ssr: false,
    loading: () => (
      <Card className="card-premium">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-8 w-28" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }
);

interface VendorStatsClientProps {
  stats: VendorStats;
  trends?: VendorTrendData;
  trendDeltas?: {
    total: number;
    critical: number;
    riskScore: number;
    roiReady: number;
    alerts: number;
  };
  period?: TimePeriod;
  showBenchmark?: boolean;
  benchmarkPercentile?: number;
}

export function VendorStatsClient({
  stats,
  trends,
  trendDeltas,
  period = '30d',
  showBenchmark = false,
  benchmarkPercentile,
}: VendorStatsClientProps) {
  return (
    <VendorStatsDashboard
      stats={stats}
      trends={trends}
      trendDeltas={trendDeltas}
      period={period}
      showBenchmark={showBenchmark}
      benchmarkPercentile={benchmarkPercentile}
    />
  );
}
