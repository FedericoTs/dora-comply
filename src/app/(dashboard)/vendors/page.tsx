import { Suspense } from 'react';
import { Metadata } from 'next';
import { getVendors, getVendorStats } from '@/lib/vendors/queries';
import { VendorListClient } from './vendor-list-client';
import { VendorStatsDashboardClient } from './vendor-stats-dashboard-client';
import { VendorInsightsClient } from './vendor-insights-client';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { getActiveFrameworkFromCookie } from '@/lib/context/framework-cookie';

export const metadata: Metadata = {
  title: 'Third Parties | DORA Comply',
  description: 'Manage your ICT third-party service providers',
};

// Stats Dashboard Section - fetches data server-side
async function StatsDashboardSection() {
  const stats = await getVendorStats();
  return <VendorStatsDashboardClient stats={stats} />;
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
      expiringSoonCount={0}
    />
  );
}

export default function VendorsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Third Parties</h1>
        <p className="text-muted-foreground mt-1">
          Manage your ICT third-party service providers and track DORA compliance
        </p>
      </div>

      {/* Stats Dashboard + AI Insights Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Stats Dashboard - Takes 2/3 */}
        <div className="lg:col-span-2">
          <Suspense
            fallback={
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
            }
          >
            <StatsDashboardSection />
          </Suspense>
        </div>

        {/* AI Insights - Takes 1/3 */}
        <div className="lg:col-span-1">
          <VendorInsightsClient maxItems={3} />
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
