/**
 * Remediation Dashboard Page
 *
 * Dashboard for managing remediation plans and actions to close compliance gaps.
 */

import { Suspense } from 'react';
import { getRemediationPlans, getRemediationStats } from '@/lib/remediation/queries';
import { RemediationClient } from './remediation-client';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Remediation | Compliance Platform',
  description: 'Manage remediation plans and actions for compliance gaps',
};

async function RemediationContent() {
  const [plansResult, stats] = await Promise.all([
    getRemediationPlans({ includeCompleted: false }),
    getRemediationStats(),
  ]);

  return (
    <RemediationClient
      initialPlans={plansResult.plans}
      initialTotal={plansResult.total}
      initialStats={stats}
    />
  );
}

export default function RemediationPage() {
  return (
    <div className="space-y-6">
      <Suspense fallback={<RemediationLoading />}>
        <RemediationContent />
      </Suspense>
    </div>
  );
}

function RemediationLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Stats skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>

      {/* Tabs skeleton */}
      <Skeleton className="h-10 w-64" />

      {/* Plan list skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    </div>
  );
}
