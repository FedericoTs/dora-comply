'use client';

import dynamic from 'next/dynamic';
import type { VendorStats } from '@/lib/vendors/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

// Dynamic import with ssr:false to prevent hydration issues
const VendorStatsDashboard = dynamic(
  () => import('@/components/vendors/vendor-stats-dashboard').then(mod => mod.VendorStatsDashboard),
  {
    ssr: false,
    loading: () => (
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-12" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }
);

interface VendorStatsDashboardClientProps {
  stats: VendorStats;
}

export function VendorStatsDashboardClient({ stats }: VendorStatsDashboardClientProps) {
  return (
    <VendorStatsDashboard
      stats={stats}
      showBenchmark={true}
      benchmarkPercentile={73}
    />
  );
}
