import { Metadata } from 'next';
import { getCurrentUser } from '@/lib/auth';
import { getVendorStats } from '@/lib/vendors/queries';
import { fetchAllTemplateStats } from '@/lib/roi/queries';
import { getRecentActivity } from '@/lib/activity/queries';
import { getIncidentStatsEnhanced, getPendingDeadlines } from '@/lib/incidents/queries';
import { getTestingStats } from '@/lib/testing/queries';
import { getOrganizationContext } from '@/lib/org/context';
import { getDocumentStats } from '@/lib/documents/queries';
import { getEnabledFrameworks } from '@/lib/licensing/check-access-server';
import { IncidentMetricsCard } from '@/components/incidents/dashboard';
import { StatCard, StatCardGrid } from '@/components/ui/stat-card';
import { KPI_HELP } from '@/components/ui/help-tooltip';
import {
  GettingStartedCard,
  IncidentStatCard,
  TestingStatCard,
  AlertBanners,
  DeadlineCard,
  AhaMomentCard,
  DashboardHeader,
  VendorsByRiskCard,
  PendingDeadlinesCard,
  RecentActivityCard,
  OnboardingDashboard,
  FrameworkOverviewCard,
} from '@/components/dashboard';

export const metadata: Metadata = {
  title: 'Dashboard | DORA Comply',
  description: 'Your DORA compliance dashboard',
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const firstName = user?.fullName?.split(' ')[0] || '';

  // Fetch real data including organization context for entity classification
  const [vendorStats, roiStats, recentActivity, incidentStatsResult, pendingDeadlinesResult, testingStatsResult, orgContext, documentStats] = await Promise.all([
    getVendorStats(),
    fetchAllTemplateStats(),
    getRecentActivity(5),
    getIncidentStatsEnhanced(),
    getPendingDeadlines(5),
    getTestingStats(),
    getOrganizationContext(),
    getDocumentStats(),
  ]);

  const incidentStats = incidentStatsResult.data;
  const pendingDeadlines = pendingDeadlinesResult.data;
  const testingStats = testingStatsResult.data;

  // Entity classification determines TLPT requirements
  const classification = orgContext?.classification;
  const tlptRequired = classification?.tlptRequired ?? false;
  const simplifiedFramework = classification?.simplifiedFramework ?? false;

  // Get enabled frameworks for the organization
  const enabledFrameworks = orgContext?.organization?.id
    ? await getEnabledFrameworks(orgContext.organization.id)
    : [];

  // Calculate RoI readiness (average completeness across templates with data)
  const templatesWithData = roiStats.filter(s => s.rowCount > 0);
  const avgRoiCompleteness = templatesWithData.length > 0
    ? Math.round(templatesWithData.reduce((sum, s) => sum + s.completeness, 0) / templatesWithData.length)
    : 0;

  // Calculate days to deadline (April 30, 2026 for first RoI submission)
  const deadline = new Date('2026-04-30');
  const today = new Date();
  const daysToDeadline = Math.max(0, Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

  // Calculate total vendors
  const totalVendors = vendorStats.total;
  const criticalRisks = vendorStats.by_risk.critical;

  // Check for overdue items
  const overdueReports = incidentStats?.overdue_reports ?? 0;
  const tlptOverdue = testingStats?.tlpt_overdue ?? 0;
  const tlptDueSoon = testingStats?.tlpt_due_soon ?? 0;

  // Determine onboarding progress
  const onboardingSteps = [
    { done: totalVendors > 0, label: 'Add first vendor' },
    { done: documentStats.total > 0, label: 'Upload documents' },
    { done: (incidentStats?.total ?? 0) > 0, label: 'Set up incidents' },
    { done: avgRoiCompleteness > 0, label: 'Start RoI' },
  ];
  const completedSteps = onboardingSteps.filter(s => s.done).length;
  const isNewUser = completedSteps < 2;

  // Focused Onboarding Dashboard for new users
  if (isNewUser) {
    return (
      <OnboardingDashboard
        firstName={firstName}
        onboardingSteps={onboardingSteps}
        completedSteps={completedSteps}
        daysToDeadline={daysToDeadline}
        totalVendors={totalVendors}
        totalDocuments={documentStats.total}
      />
    );
  }

  // Full Dashboard for returning users
  return (
    <>
      {/* Alert Banners */}
      <AlertBanners
        overdueReports={overdueReports}
        tlptRequired={tlptRequired}
        tlptOverdue={tlptOverdue}
        tlptDueSoon={tlptDueSoon}
        simplifiedFramework={simplifiedFramework}
      />

      {/* Page Header */}
      <DashboardHeader firstName={firstName} />

      {/* Stats Grid */}
      <StatCardGrid columns={6} className="mb-8 stagger" data-tour="stats-grid">
        <StatCard
          label="Total Vendors"
          value={totalVendors}
          trend={totalVendors > 0 ? 'up' : 'neutral'}
          trendLabel={`${totalVendors} total`}
          href="/vendors"
          size="compact"
          tooltip={KPI_HELP.totalVendors}
        />
        <StatCard
          label="RoI Readiness"
          value={`${avgRoiCompleteness}%`}
          progress={avgRoiCompleteness}
          description={avgRoiCompleteness > 0 ? `${templatesWithData.length} templates` : 'No data yet'}
          href="/roi"
          size="compact"
          tooltip={KPI_HELP.roiReadiness}
        />
        <StatCard
          label="Critical Risks"
          value={criticalRisks}
          variant={criticalRisks > 0 ? 'error' : 'success'}
          trend={criticalRisks === 0 ? 'neutral' : 'down'}
          trendLabel={criticalRisks === 0 ? 'None' : `${criticalRisks} vendors`}
          href="/vendors?risk=critical"
          size="compact"
          tooltip={KPI_HELP.criticalRisks}
        />
        {incidentStats ? (
          <IncidentMetricsCard stats={incidentStats} />
        ) : (
          <IncidentStatCard major={0} significant={0} pending={0} />
        )}
        <TestingStatCard
          testTypeCoverage={testingStats?.test_type_coverage ?? 0}
          openFindings={testingStats?.critical_open_findings ?? 0}
          tlptStatus={tlptOverdue > 0 ? 'overdue' : tlptDueSoon > 0 ? 'due_soon' : 'compliant'}
          tlptRequired={tlptRequired}
        />
        <StatCard
          label="Days to Deadline"
          value={daysToDeadline}
          description="April 30, 2026"
          variant={daysToDeadline <= 30 ? 'warning' : 'default'}
          href="/roi/submissions"
          size="compact"
          tooltip={KPI_HELP.daysToDeadline}
        />
      </StatCardGrid>

      {/* Aha Moment Card */}
      {totalVendors === 1 && documentStats.total === 0 && (
        <AhaMomentCard />
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <RecentActivityCard
          recentActivity={recentActivity}
          totalVendors={totalVendors}
        />

        {/* Deadline Card */}
        <DeadlineCard
          daysToDeadline={daysToDeadline}
          avgRoiCompleteness={avgRoiCompleteness}
          totalVendors={totalVendors}
        />

        {/* Framework Overview */}
        <FrameworkOverviewCard enabledFrameworks={enabledFrameworks} />

        {/* Vendors by Risk */}
        <VendorsByRiskCard
          vendorStats={vendorStats}
          totalVendors={totalVendors}
        />

        {/* Pending Report Deadlines */}
        <PendingDeadlinesCard pendingDeadlines={pendingDeadlines} />

        {/* Getting Started */}
        <GettingStartedCard
          stepsCompleted={[
            totalVendors > 0,
            documentStats.total > 0,
            (incidentStats?.total ?? 0) > 0,
            avgRoiCompleteness > 0,
          ]}
        />
      </div>
    </>
  );
}
