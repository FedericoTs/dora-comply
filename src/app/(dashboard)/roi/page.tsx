/**
 * RoI Dashboard Page
 *
 * Main dashboard for Register of Information management
 */

import { Suspense } from 'react';
import { fetchAllTemplateStats } from '@/lib/roi';
import { RoiProgressCard } from './components/roi-progress-card';
import { TemplateGrid } from './components/template-grid';
import { ExportControls } from './components/export-controls';
import { DeadlineCountdown } from './components/deadline-countdown';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Register of Information | DORA Comply',
  description: 'ESA DORA Register of Information management and export',
};

async function RoiDashboardContent() {
  const stats = await fetchAllTemplateStats();

  // Calculate summary metrics
  const totalRows = stats.reduce((sum, s) => sum + s.rowCount, 0);
  const templatesWithData = stats.filter(s => s.hasData).length;
  const avgCompleteness = stats.length > 0
    ? Math.round(stats.reduce((sum, s) => sum + s.completeness, 0) / stats.length)
    : 0;

  // Days until deadline
  const deadline = new Date('2025-04-30');
  const today = new Date();
  const daysUntilDeadline = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Register of Information</h1>
          <p className="text-muted-foreground">
            ESA DORA RoI with 15 templates ready for submission
          </p>
        </div>
        <ExportControls />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <RoiProgressCard
          title="Overall Completeness"
          value={avgCompleteness}
          suffix="%"
          description="Average across all templates"
          variant="progress"
        />
        <RoiProgressCard
          title="Templates Ready"
          value={templatesWithData}
          suffix={`/ ${stats.length}`}
          description="Templates with data"
          variant="default"
        />
        <RoiProgressCard
          title="Total Records"
          value={totalRows}
          description="Across all templates"
          variant="default"
        />
        <DeadlineCountdown
          deadline={deadline}
          daysRemaining={daysUntilDeadline}
        />
      </div>

      {/* Template Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Templates</h2>
        <TemplateGrid templates={stats} />
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>

      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function RoiDashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <RoiDashboardContent />
    </Suspense>
  );
}
