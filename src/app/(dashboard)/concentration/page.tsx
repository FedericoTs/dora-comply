import { Suspense } from 'react';
import { Metadata } from 'next';
import { Network, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ConcentrationDashboard } from './concentration-dashboard';

export const metadata: Metadata = {
  title: 'Concentration Risk | DORA Comply',
  description: 'Monitor and manage ICT third-party concentration risk per DORA Article 28-29',
};

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Alert Banner Skeleton */}
      <Skeleton className="h-24 w-full rounded-xl" />

      {/* Overview Cards Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
        <div>
          <Skeleton className="h-[400px] rounded-xl" />
        </div>
      </div>

      {/* Metrics Grid Skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function ConcentrationPage() {
  return (
    <div className="flex-1 space-y-6 p-6 md:p-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
            <Network className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Concentration Risk
            </h1>
            <p className="text-muted-foreground">
              DORA Article 28-29 ICT third-party concentration monitoring
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
          <Button size="sm">
            Export Report
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Suspense fallback={<LoadingSkeleton />}>
        <ConcentrationDashboard />
      </Suspense>
    </div>
  );
}
