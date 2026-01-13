/**
 * RoI Dashboard Page
 *
 * Action-oriented dashboard for Register of Information management
 */

import { Suspense } from 'react';
import Link from 'next/link';
import { Wand2, Send, GitBranch } from 'lucide-react';
import {
  fetchAllTemplateStats,
  getNextActions,
  getPopulatableDocuments,
  getTemplatesWithStatus,
  getOnboardingProgress,
} from '@/lib/roi';
import { RoiProgressCard } from './components/roi-progress-card';
import { ExportControls } from './components/export-controls';
import { DeadlineCountdown } from './components/deadline-countdown';
import { NextActionsPanel } from './components/next-actions-panel';
import { AiPopulationWrapper } from './components/ai-population-wrapper';
import { TemplateStatusTabs } from './components/template-status-tabs';
import { OnboardingCompleteBanner } from './components/onboarding-complete-banner';
import { DORAGapsSummary } from './components/dora-gaps-summary';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { HelpTooltip, KPI_HELP } from '@/components/ui/help-tooltip';

export const metadata = {
  title: 'Register of Information | DORA Comply',
  description: 'ESA DORA Register of Information management and export',
};

interface RoiDashboardContentProps {
  populateDocId?: string;
}

async function RoiDashboardContent({ populateDocId }: RoiDashboardContentProps) {
  // Fetch all data in parallel
  const [stats, nextActions, populatableDocs, templatesWithStatus, onboardingProgress] = await Promise.all([
    fetchAllTemplateStats(),
    getNextActions(),
    getPopulatableDocuments(),
    getTemplatesWithStatus(),
    getOnboardingProgress(),
  ]);

  const showWizardPrompt = !onboardingProgress?.isComplete;

  // Calculate summary metrics
  const totalRows = stats.reduce((sum, s) => sum + s.rowCount, 0);
  const templatesWithData = stats.filter(s => s.hasData).length;
  const avgCompleteness = stats.length > 0
    ? Math.round(stats.reduce((sum, s) => sum + s.completeness, 0) / stats.length)
    : 0;

  // Calculate total fields (approximate)
  const totalFields = stats.reduce((sum, s) => sum + (s.rowCount * 10), 0); // ~10 fields per row average
  const completedFields = Math.round(totalFields * (avgCompleteness / 100));

  // Days until deadline (annual ESA RoI submission)
  const deadline = new Date('2026-04-30');
  const today = new Date();
  const daysUntilDeadline = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Find first incomplete template for onboarding banner
  const firstIncomplete = templatesWithStatus.find(t => t.completeness < 100);
  const firstIncompleteTemplate = firstIncomplete
    ? { id: firstIncomplete.templateId, name: firstIncomplete.templateId }
    : null;

  return (
    <div className="space-y-6">
      {/* Onboarding Complete Banner - Shows after wizard completion */}
      <OnboardingCompleteBanner firstIncompleteTemplate={firstIncompleteTemplate} />

      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Register of Information</h1>
          <p className="text-muted-foreground">
            Track your DORA RoI submission progress
          </p>
        </div>
        <div className="flex gap-2">
          {showWizardPrompt && (
            <Button variant="outline" asChild>
              <Link href="/roi/onboarding">
                <Wand2 className="mr-2 h-4 w-4" />
                Setup Wizard
              </Link>
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href="/roi/relationships">
              <GitBranch className="mr-2 h-4 w-4" />
              Relationships
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/roi/submissions">
              <Send className="mr-2 h-4 w-4" />
              Submissions
            </Link>
          </Button>
          <ExportControls />
        </div>
      </div>

      {/* Overall Progress + Deadline Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium flex items-center gap-1">
                Overall Progress
                <HelpTooltip content={KPI_HELP.completeness} iconClassName="h-3.5 w-3.5" />
              </h3>
              <span className="text-2xl font-bold">{avgCompleteness}%</span>
            </div>
            <Progress value={avgCompleteness} className="h-3 mb-4" />
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground flex items-center gap-1">
                  Templates
                  <HelpTooltip content={KPI_HELP.templatesReady} iconClassName="h-3 w-3" />
                </p>
                <p className="font-medium">{templatesWithData} of {stats.length} ready</p>
              </div>
              <div>
                <p className="text-muted-foreground flex items-center gap-1">
                  Records
                  <HelpTooltip content={KPI_HELP.totalRecords} iconClassName="h-3 w-3" />
                </p>
                <p className="font-medium">{totalRows} total</p>
              </div>
              <div>
                <p className="text-muted-foreground flex items-center gap-1">
                  Fields
                  <HelpTooltip content={KPI_HELP.fieldsCompleted} iconClassName="h-3 w-3" />
                </p>
                <p className="font-medium">~{completedFields} completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <DeadlineCountdown
          deadline={deadline}
          daysRemaining={daysUntilDeadline}
        />
      </div>

      {/* AI Population Panel - Prominent Position */}
      <AiPopulationWrapper
        initialDocuments={populatableDocs}
        highlightDocumentId={populateDocId}
      />

      {/* DORA Gaps Summary - Quick access to gap remediation */}
      <DORAGapsSummary />

      {/* Two Column Layout: Actions + Stats */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Next Actions - 2 columns */}
        <div className="lg:col-span-2">
          <NextActionsPanel actions={nextActions} />
        </div>

        {/* Stats Cards - 3 columns */}
        <div className="lg:col-span-3 grid gap-4 sm:grid-cols-3">
          <RoiProgressCard
            title="High Priority"
            value={nextActions.filter(a => a.priority === 'high').length}
            description="Actions need attention"
            variant={nextActions.filter(a => a.priority === 'high').length > 0 ? 'warning' : 'default'}
          />
          <RoiProgressCard
            title="Quick Wins"
            value={nextActions.filter(a => a.type === 'quick_win').length}
            description="Templates almost complete"
            variant="default"
          />
          <RoiProgressCard
            title="AI Available"
            value={populatableDocs.filter(d => !d.isPopulated).length}
            description="Docs ready to populate"
            variant={populatableDocs.filter(d => !d.isPopulated).length > 0 ? 'highlight' : 'default'}
          />
        </div>
      </div>

      {/* Template Grid with Status Tabs */}
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Templates by Status</h2>
        <TemplateStatusTabs templates={templatesWithStatus} />
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

      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-36 lg:col-span-2" />
        <Skeleton className="h-36" />
      </div>

      <Skeleton className="h-48" />

      <div className="grid gap-6 lg:grid-cols-5">
        <Skeleton className="h-64 lg:col-span-2" />
        <div className="lg:col-span-3 grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      </div>

      <div className="space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    </div>
  );
}

interface RoiDashboardPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function RoiDashboardPage({ searchParams }: RoiDashboardPageProps) {
  const resolvedParams = await searchParams;
  const populateDocId = typeof resolvedParams.populateDoc === 'string'
    ? resolvedParams.populateDoc
    : undefined;

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <RoiDashboardContent populateDocId={populateDocId} />
    </Suspense>
  );
}
