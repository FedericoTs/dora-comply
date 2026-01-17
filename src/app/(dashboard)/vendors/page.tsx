import { Suspense } from 'react';
import { Metadata } from 'next';
import { getVendors, getVendorStats } from '@/lib/vendors/queries';
import { VendorListClient } from './vendor-list-client';
import { VendorStatsClient } from './vendor-stats-client';
import { VendorInsightsClient } from './vendor-insights-client';
import { generateMockInsights } from '@/components/vendors';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { getActiveFrameworkFromCookie } from '@/lib/context/framework-cookie';

export const metadata: Metadata = {
  title: 'Third Parties | DORA Comply',
  description: 'Manage your ICT third-party service providers',
};

// Stats dashboard loading skeleton
function StatsDashboardSkeleton() {
  return (
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
  );
}

// AI Insights loading skeleton
function AIInsightsSkeleton() {
  return (
    <Card className="card-premium">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Stats dashboard server component
async function VendorStatsDashboardSection() {
  const stats = await getVendorStats();

  // Generate mock trend data for now - in production this would come from a query
  const mockTrends = {
    total: [40, 42, 43, 44, 45, 46, stats.total],
    critical: [8, 9, 10, 10, 11, 11, stats.by_tier.critical],
    riskScore: [55, 52, 50, 48, 47, 46, stats.avg_risk_score ?? 45],
    roiReady: [60, 65, 68, 72, 74, 76, stats.roi_ready_percentage],
    alerts: [8, 7, 6, 5, 5, 4, stats.by_risk.critical + stats.by_risk.high],
  };

  const mockDeltas = {
    total: 3,
    critical: 2,
    riskScore: stats.avg_risk_score ? -5 : 0,
    roiReady: 5,
    alerts: -2,
  };

  return (
    <VendorStatsClient
      stats={stats}
      trends={mockTrends}
      trendDeltas={mockDeltas}
      period="30d"
      showBenchmark={true}
      benchmarkPercentile={73}
    />
  );
}

// AI Insights server component
async function VendorAIInsightsSection() {
  // In production, this would call an AI service to generate insights
  // For now, use mock data that varies based on actual stats
  const stats = await getVendorStats();

  // Filter mock insights based on actual data
  const baseInsights = generateMockInsights();
  const relevantInsights = baseInsights.filter(insight => {
    // Only show concentration risk if we have critical vendors
    if (insight.type === 'concentration_risk' && stats.by_tier.critical === 0) {
      return false;
    }
    // Only show compliance gap if we have vendors
    if (insight.type === 'compliance_gap' && stats.total < 5) {
      return false;
    }
    return true;
  });

  return (
    <VendorInsightsClient
      insights={relevantInsights}
      maxItems={4}
    />
  );
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Third Parties</h1>
        <p className="text-muted-foreground mt-1">
          Manage your ICT third-party service providers and track DORA compliance
        </p>
      </div>

      {/* Stats Dashboard + AI Insights Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Stats Dashboard - Takes 2/3 width on large screens */}
        <div className="lg:col-span-2">
          <Suspense fallback={<StatsDashboardSkeleton />}>
            <VendorStatsDashboardSection />
          </Suspense>
        </div>

        {/* AI Insights - Takes 1/3 width on large screens */}
        <div className="lg:col-span-1">
          <Suspense fallback={<AIInsightsSkeleton />}>
            <VendorAIInsightsSection />
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
