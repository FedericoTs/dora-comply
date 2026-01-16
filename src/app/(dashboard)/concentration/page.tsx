/**
 * Concentration Risk Dashboard
 *
 * ICT third-party concentration risk monitoring per DORA Articles 28-29
 * Requires DORA Professional license for access.
 */

import { Suspense } from 'react';
import { Metadata } from 'next';
import { Skeleton } from '@/components/ui/skeleton';
import { ConcentrationDashboard } from './concentration-dashboard';
import { getOrganization } from '@/lib/org/context';
import { hasModuleAccess } from '@/lib/licensing/check-access-server';
import { LockedModule } from '@/components/licensing/locked-module';

export const metadata: Metadata = {
  title: 'Concentration Risk | DORA Comply',
  description: 'Monitor and manage ICT third-party concentration risk per DORA Article 28-29',
};

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div>
            <Skeleton className="h-7 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

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

// Locked state component
function ConcentrationLockedState() {
  return (
    <LockedModule
      framework="dora"
      moduleName="Concentration Risk"
      features={[
        'ICT third-party concentration analysis',
        'HHI (Herfindahl-Hirschman Index) calculation',
        'Critical provider identification',
        'Spend distribution visualization',
        'Geographic & service concentration metrics',
        'Exit strategy risk assessment',
      ]}
      upgradeTier="professional"
    />
  );
}

export default async function ConcentrationPage() {
  // Check license access
  const org = await getOrganization();
  if (!org) {
    return <ConcentrationLockedState />;
  }

  const hasAccess = await hasModuleAccess(org.id, 'dora', 'tprm');
  if (!hasAccess) {
    return <ConcentrationLockedState />;
  }

  return (
    <div className="flex-1 p-6 md:p-8">
      <Suspense fallback={<LoadingSkeleton />}>
        <ConcentrationDashboard />
      </Suspense>
    </div>
  );
}
