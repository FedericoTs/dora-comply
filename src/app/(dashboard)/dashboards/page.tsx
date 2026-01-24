import { Suspense } from 'react';
import { Metadata } from 'next';
import { getDashboards, getTemplateDashboards } from '@/lib/dashboards/queries';
import { DashboardListClient } from './dashboard-list-client';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Custom Dashboards | NIS2 Comply',
  description: 'Create and manage custom dashboards with drag-and-drop widgets',
};

async function DashboardListSection() {
  const [dashboards, templates] = await Promise.all([
    getDashboards(),
    getTemplateDashboards(),
  ]);

  return (
    <DashboardListClient
      initialDashboards={dashboards}
      templates={templates}
    />
  );
}

function DashboardListSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Dashboard grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function DashboardsPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Custom Dashboards</h1>
        <p className="text-muted-foreground mt-1">
          Create personalized dashboards with drag-and-drop widgets to visualize your compliance data
        </p>
      </div>

      {/* Dashboard List */}
      <Suspense fallback={<DashboardListSkeleton />}>
        <DashboardListSection />
      </Suspense>
    </div>
  );
}
