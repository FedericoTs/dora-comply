import { Suspense } from 'react';
import { Metadata } from 'next';
import { Skeleton } from '@/components/ui/skeleton';
import { MaturityTrendsDashboard } from './maturity-trends-dashboard';

export const metadata: Metadata = {
  title: 'Compliance Trends | DORA Comply',
  description: 'Track DORA compliance maturity trends and historical progress over time',
};

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div>
            <Skeleton className="h-7 w-64 mb-2" />
            <Skeleton className="h-4 w-80" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-40" />
        </div>
      </div>

      {/* Summary Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>

      {/* Main Chart Skeleton */}
      <Skeleton className="h-[400px] rounded-xl" />

      {/* Pillar Grid Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>

      {/* History Table Skeleton */}
      <Skeleton className="h-[300px] rounded-xl" />
    </div>
  );
}

export default function ComplianceTrendsPage() {
  return (
    <div className="flex-1 p-6 md:p-8">
      <Suspense fallback={<LoadingSkeleton />}>
        <MaturityTrendsDashboard />
      </Suspense>
    </div>
  );
}
