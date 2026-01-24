import { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDashboard } from '@/lib/dashboards/queries';
import { DashboardBuilderClient } from './dashboard-builder-client';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const dashboard = await getDashboard(id);

  if (!dashboard) {
    return { title: 'Dashboard Not Found | NIS2 Comply' };
  }

  return {
    title: `${dashboard.name} | NIS2 Comply`,
    description: dashboard.description || 'Custom dashboard with drag-and-drop widgets',
  };
}

async function DashboardBuilderSection({ id }: { id: string }) {
  const dashboard = await getDashboard(id);

  if (!dashboard) {
    notFound();
  }

  return <DashboardBuilderClient dashboard={dashboard} />;
}

function DashboardBuilderSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
      {/* Widget grid */}
      <div className="grid grid-cols-12 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="col-span-4">
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function DashboardPage({ params }: Props) {
  const { id } = await params;

  return (
    <Suspense fallback={<DashboardBuilderSkeleton />}>
      <DashboardBuilderSection id={id} />
    </Suspense>
  );
}
