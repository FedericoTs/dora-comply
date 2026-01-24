/**
 * Remediation Kanban Board Page
 *
 * Visual Kanban board for managing remediation actions across status columns.
 */

import { Suspense } from 'react';
import { getKanbanData, getRemediationPlans } from '@/lib/remediation/queries';
import { KanbanBoardClient } from './kanban-board-client';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Kanban Board | Remediation',
  description: 'Visual Kanban board for managing remediation actions',
};

interface PageProps {
  searchParams: Promise<{ planId?: string }>;
}

async function KanbanContent({ searchParams }: PageProps) {
  const params = await searchParams;
  const planId = params.planId;

  const [kanbanData, plansResult] = await Promise.all([
    getKanbanData(planId),
    getRemediationPlans({ includeCompleted: false }, 1, 100),
  ]);

  return (
    <KanbanBoardClient
      initialData={kanbanData}
      plans={plansResult.plans}
      selectedPlanId={planId}
    />
  );
}

export default async function KanbanPage({ searchParams }: PageProps) {
  return (
    <div className="h-full">
      <Suspense fallback={<KanbanLoading />}>
        <KanbanContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

function KanbanLoading() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-40 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      {/* Board skeleton */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-72">
            <Skeleton className="h-10 mb-3" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, j) => (
                <Skeleton key={j} className="h-24" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
