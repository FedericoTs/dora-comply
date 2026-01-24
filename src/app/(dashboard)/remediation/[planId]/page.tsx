/**
 * Remediation Plan Detail Page
 *
 * Shows a single remediation plan with its actions and progress.
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getRemediationPlanById, getActionsByPlan } from '@/lib/remediation/queries';
import { PlanDetailClient } from './plan-detail-client';
import { Skeleton } from '@/components/ui/skeleton';

interface PageProps {
  params: Promise<{ planId: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { planId } = await params;
  const plan = await getRemediationPlanById(planId);

  return {
    title: plan ? `${plan.plan_ref} - ${plan.title}` : 'Plan Not Found',
    description: plan?.description || 'Remediation plan details',
  };
}

async function PlanDetailContent({ planId }: { planId: string }) {
  const [plan, actions] = await Promise.all([
    getRemediationPlanById(planId),
    getActionsByPlan(planId, true), // Include evidence
  ]);

  if (!plan) {
    notFound();
  }

  return <PlanDetailClient plan={plan} initialActions={actions} />;
}

export default async function RemediationPlanPage({ params }: PageProps) {
  const { planId } = await params;

  return (
    <div className="space-y-6">
      <Suspense fallback={<PlanDetailLoading />}>
        <PlanDetailContent planId={planId} />
      </Suspense>
    </div>
  );
}

function PlanDetailLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-start justify-between">
        <div>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Progress skeleton */}
      <Skeleton className="h-24 w-full" />

      {/* Actions skeleton */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    </div>
  );
}
