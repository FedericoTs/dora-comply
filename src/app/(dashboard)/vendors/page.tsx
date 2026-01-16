import { Suspense } from 'react';
import { Metadata } from 'next';
import { getVendors, getVendorStats } from '@/lib/vendors/queries';
import { VendorListClient } from './vendor-list-client';
import { VendorStatsCompact } from '@/components/vendors';
import { Skeleton } from '@/components/ui/skeleton';
import { getActiveFrameworkFromCookie } from '@/lib/context/framework-cookie';

export const metadata: Metadata = {
  title: 'Third Parties | DORA Comply',
  description: 'Manage your ICT third-party service providers',
};

// Stats loading skeleton
function StatsSkeletonLoader() {
  return <Skeleton className="h-10 w-64" />;
}

// Stats server component
async function VendorStatsSection() {
  const stats = await getVendorStats();
  return <VendorStatsCompact stats={stats} />;
}

// Initial data loader
async function VendorListSection() {
  // Get framework from cookie for server-side filtering
  const framework = await getActiveFrameworkFromCookie();

  const [vendorsResult, stats] = await Promise.all([
    getVendors({
      pagination: { page: 1, limit: 20 },
      sort: { field: 'created_at', direction: 'desc' },
      filters: framework ? { framework } : undefined,
    }),
    getVendorStats(),
  ]);

  return (
    <VendorListClient
      initialVendors={vendorsResult.data}
      initialTotal={vendorsResult.total}
      initialTotalPages={vendorsResult.total_pages}
      hasVendors={stats.total > 0}
      criticalCount={stats.by_tier.critical}
      needsReviewCount={stats.pending_reviews}
      expiringSoonCount={0} // TODO: Get from contracts when available
    />
  );
}

export default function VendorsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Third Parties</h1>
          <Suspense fallback={<StatsSkeletonLoader />}>
            <VendorStatsSection />
          </Suspense>
        </div>
      </div>

      {/* Vendor List with Quick Filters */}
      <Suspense
        fallback={
          <div className="space-y-4">
            {/* Quick filter skeleton */}
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-24 rounded-md" />
              ))}
            </div>
            {/* Toolbar skeleton */}
            <div className="flex items-center justify-between">
              <Skeleton className="h-10 w-64" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
            {/* Table skeleton */}
            <Skeleton className="h-96 w-full rounded-lg" />
          </div>
        }
      >
        <VendorListSection />
      </Suspense>
    </div>
  );
}
