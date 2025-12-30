import { Suspense } from 'react';
import { Metadata } from 'next';
import { getVendors, getVendorStats } from '@/lib/vendors/queries';
import { VendorListClient } from './vendor-list-client';
import { VendorStatsCards } from '@/components/vendors';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Vendors | DORA Comply',
  description: 'Manage your ICT third-party service providers',
};

// Stats loading skeleton
function StatsSkeletonLoader() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-24 rounded-lg" />
      ))}
    </div>
  );
}

// Stats server component
async function VendorStatsSection() {
  const stats = await getVendorStats();
  return <VendorStatsCards stats={stats} />;
}

// Initial data loader
async function VendorListSection() {
  const [vendorsResult, stats] = await Promise.all([
    getVendors({
      pagination: { page: 1, limit: 20 },
      sort: { field: 'created_at', direction: 'desc' },
    }),
    getVendorStats(),
  ]);

  return (
    <VendorListClient
      initialVendors={vendorsResult.data}
      initialTotal={vendorsResult.total}
      initialTotalPages={vendorsResult.total_pages}
      hasVendors={stats.total > 0}
    />
  );
}

export default function VendorsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Vendors</h1>
        <p className="text-muted-foreground">
          Manage your ICT third-party service providers and their DORA compliance status.
        </p>
      </div>

      {/* Stats Section */}
      <Suspense fallback={<StatsSkeletonLoader />}>
        <VendorStatsSection />
      </Suspense>

      {/* Vendor List */}
      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-10 w-32" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-lg" />
              ))}
            </div>
          </div>
        }
      >
        <VendorListSection />
      </Suspense>
    </div>
  );
}
