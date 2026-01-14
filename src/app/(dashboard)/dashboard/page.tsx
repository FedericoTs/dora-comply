import { Metadata } from 'next';
import Link from 'next/link';
import {
  FileText,
  ArrowUpRight,
  CheckCircle2,
  Calendar,
  Zap,
  Plus,
  MoreHorizontal,
  AlertTriangle,
  Clock,
  Target,
  Shield,
  Scale,
  PartyPopper,
  Upload,
  Building2,
  BookOpen,
} from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { getVendorStats } from '@/lib/vendors/queries';
import { fetchAllTemplateStats } from '@/lib/roi/queries';
import {
  getRecentActivity,
  formatActivityTitle,
  formatRelativeTime,
  mapActivityType,
} from '@/lib/activity/queries';
import { getIncidentStatsEnhanced, getPendingDeadlines } from '@/lib/incidents/queries';
import { getTestingStats } from '@/lib/testing/queries';
import { getOrganizationContext } from '@/lib/org/context';
import { getDocumentStats } from '@/lib/documents/queries';
import { BoardReportExport } from '@/components/reports/board-report-export';
import { IncidentMetricsCard } from '@/components/incidents/dashboard';
import { StatCard, StatCardGrid } from '@/components/ui/stat-card';
import { KPI_HELP } from '@/components/ui/help-tooltip';
import {
  ActivityItem,
  RiskRow,
  GettingStartedCard,
  IncidentStatCard,
  DeadlineItem,
  TestingStatCard,
} from '@/components/dashboard';

// Time-aware greeting
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

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
      <div data-tour="welcome" className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8 animate-in">
        <div>
          <h1 className="mb-1">{getGreeting()}{firstName ? `, ${firstName}` : ''}</h1>
          <p className="text-muted-foreground">
            Here&apos;s what&apos;s happening with your compliance program today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <BoardReportExport />
          <Link href="/vendors/new" className="btn-primary" data-tour="add-vendor">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add vendor</span>
            <span className="sm:hidden">Add</span>
          </Link>
        </div>
      </div>

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
        <div data-tour="recent-activity" className="col-span-1 lg:col-span-2 card-premium p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <h3>Recent Activity</h3>
            <Link
              href="/activity"
              className="text-sm text-primary font-medium hover:underline flex items-center gap-1"
            >
              View all
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="space-y-0">
            {recentActivity.length > 0 ? (
              recentActivity.map(activity => (
                <ActivityItem
                  key={activity.id}
                  title={formatActivityTitle(activity.action, activity.entity_type)}
                  description={activity.entity_name || ''}
                  time={formatRelativeTime(activity.created_at)}
                  type={mapActivityType(activity.action)}
                />
              ))
            ) : (
              <>
                <ActivityItem
                  title="Welcome to DORA Comply!"
                  description="Get started by adding your first vendor"
                  time="Just now"
                  type="info"
                />
                <ActivityItem
                  title="Complete your organization setup"
                  description="Add more details to your profile"
                  time="Today"
                  type="info"
                />
              </>
            )}
          </div>
          {totalVendors === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              <p className="text-sm">Add vendors to see activity here</p>
            </div>
          )}
        </div>

        {/* Deadline Card */}
        <DeadlineCard
          daysToDeadline={daysToDeadline}
          avgRoiCompleteness={avgRoiCompleteness}
          totalVendors={totalVendors}
        />

        {/* Vendors by Risk */}
        <div className="card-premium p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-6">
            <h3>Vendors by Risk</h3>
            <button className="icon-btn">
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-4">
            <RiskRow label="Critical" count={vendorStats.by_risk.critical} total={totalVendors} color="bg-error" />
            <RiskRow label="High" count={vendorStats.by_risk.high} total={totalVendors} color="bg-warning" />
            <RiskRow label="Medium" count={vendorStats.by_risk.medium} total={totalVendors} color="bg-chart-5" />
            <RiskRow label="Low" count={vendorStats.by_risk.low} total={totalVendors} color="bg-success" />
          </div>
        </div>

        {/* Pending Report Deadlines */}
        <div className="card-premium p-6 animate-slide-up">
          <div className="flex items-center gap-2 text-muted-foreground mb-4">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">Report Deadlines</span>
          </div>
          {pendingDeadlines.length > 0 ? (
            <div className="space-y-3">
              {pendingDeadlines.slice(0, 3).map((deadline) => (
                <DeadlineItem
                  key={`${deadline.incident_id}-${deadline.report_type}`}
                  incidentId={deadline.incident_id}
                  incidentRef={deadline.incident_ref}
                  title={deadline.incident_title}
                  reportType={deadline.report_type}
                  hoursRemaining={deadline.hours_remaining}
                  isOverdue={deadline.is_overdue}
                />
              ))}
              {pendingDeadlines.length > 3 && (
                <Link
                  href="/incidents"
                  className="block text-center text-sm text-primary font-medium hover:underline pt-2"
                >
                  View all {pendingDeadlines.length} deadlines
                </Link>
              )}
            </div>
          ) : (
            <div className="py-6 text-center">
              <CheckCircle2 className="h-8 w-8 mx-auto text-success mb-2" />
              <p className="text-sm font-medium text-success">All caught up!</p>
              <p className="text-xs text-muted-foreground">No pending report deadlines</p>
            </div>
          )}
        </div>

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

// ============================================================================
// Sub-components
// ============================================================================

function OnboardingDashboard({
  firstName,
  onboardingSteps,
  completedSteps,
  daysToDeadline,
  totalVendors,
  totalDocuments,
}: {
  firstName: string;
  onboardingSteps: { done: boolean; label: string }[];
  completedSteps: number;
  daysToDeadline: number;
  totalVendors: number;
  totalDocuments: number;
}) {
  const nextStep = onboardingSteps.find(s => !s.done);
  const nextStepConfig = {
    'Add first vendor': {
      title: 'Add your first ICT provider',
      description: 'Start building your Register of Information by adding the vendors your organization relies on.',
      href: '/vendors/new',
      cta: 'Add Vendor',
      icon: Building2,
      time: '~2 min',
    },
    'Upload documents': {
      title: 'Upload vendor documentation',
      description: 'Add contracts, certifications, and SLAs to automatically extract compliance data.',
      href: '/documents',
      cta: 'Upload Documents',
      icon: FileText,
      time: '~3 min',
    },
    'Set up incidents': {
      title: 'Configure incident reporting',
      description: 'Set up your incident workflow to meet DORA\'s 4-hour initial reporting requirement.',
      href: '/incidents',
      cta: 'View Incidents',
      icon: AlertTriangle,
      time: '~2 min',
    },
    'Start RoI': {
      title: 'Complete your Register of Information',
      description: 'Review and finalize your RoI data for submission to regulators.',
      href: '/roi',
      cta: 'Open RoI',
      icon: BookOpen,
      time: '~5 min',
    },
  }[nextStep?.label || 'Add first vendor']!;

  const NextIcon = nextStepConfig.icon;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Welcome Header */}
      <div className="text-center mb-8 animate-in">
        <h1 className="text-2xl font-semibold mb-2">
          {getGreeting()}{firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="text-muted-foreground">
          Let&apos;s get your DORA compliance program set up.
        </p>
      </div>

      {/* Progress Overview */}
      <div className="mb-8 animate-in">
        <div className="flex items-center justify-between text-sm mb-3">
          <span className="text-muted-foreground">Setup Progress</span>
          <span className="font-medium">{completedSteps} of {onboardingSteps.length} steps</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${(completedSteps / onboardingSteps.length) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          {onboardingSteps.map((step, i) => (
            <div key={i} className="flex items-center gap-1.5">
              {step.done ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : (
                <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
              )}
              <span className={`text-xs ${step.done ? 'text-success' : 'text-muted-foreground'}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Next Step Hero Card */}
      <div className="card-premium p-8 mb-8 animate-slide-up bg-gradient-to-br from-primary/5 via-transparent to-transparent border-primary/20">
        <div className="flex items-center gap-2 text-primary mb-4">
          <Target className="h-5 w-5" />
          <span className="text-sm font-medium">Your Next Step</span>
          <span className="text-xs text-muted-foreground ml-auto">{nextStepConfig.time}</span>
        </div>

        <div className="flex items-start gap-6">
          <div className="hidden sm:flex h-16 w-16 rounded-2xl bg-primary/10 items-center justify-center shrink-0">
            <NextIcon className="h-8 w-8 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold mb-2">{nextStepConfig.title}</h2>
            <p className="text-muted-foreground mb-6">{nextStepConfig.description}</p>
            <Link href={nextStepConfig.href} className="btn-primary inline-flex">
              {nextStepConfig.cta}
              <ArrowUpRight className="h-4 w-4 ml-2" />
            </Link>
          </div>
        </div>
      </div>

      {/* Deadline Reminder */}
      <div className="card-elevated p-6 mb-8 animate-slide-up">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-warning/10 flex items-center justify-center">
              <Calendar className="h-6 w-6 text-warning" />
            </div>
            <div>
              <p className="font-medium">RoI Submission Deadline</p>
              <p className="text-sm text-muted-foreground">April 30, 2026</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-semibold">{daysToDeadline}</p>
            <p className="text-sm text-muted-foreground">days left</p>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-4 animate-slide-up">
        <Link href="/vendors" className="card-elevated p-4 hover:border-primary/50 transition-colors group">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            <div>
              <p className="font-medium text-sm">Vendors</p>
              <p className="text-xs text-muted-foreground">{totalVendors} registered</p>
            </div>
          </div>
        </Link>
        <Link href="/documents" className="card-elevated p-4 hover:border-primary/50 transition-colors group">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            <div>
              <p className="font-medium text-sm">Documents</p>
              <p className="text-xs text-muted-foreground">{totalDocuments} uploaded</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Help Text */}
      <p className="text-center text-sm text-muted-foreground mt-8 animate-in">
        Need help? Use the <span className="font-medium">AI Copilot</span> in the bottom right corner.
      </p>
    </div>
  );
}

function AlertBanners({
  overdueReports,
  tlptRequired,
  tlptOverdue,
  tlptDueSoon,
  simplifiedFramework,
}: {
  overdueReports: number;
  tlptRequired: boolean;
  tlptOverdue: number;
  tlptDueSoon: number;
  simplifiedFramework: boolean;
}) {
  return (
    <>
      {/* Overdue Reports Alert Banner */}
      {overdueReports > 0 && (
        <div className="mb-4 p-4 rounded-lg border border-destructive/50 bg-destructive/10 animate-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/20">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="font-semibold text-destructive">
                  {overdueReports} incident report{overdueReports === 1 ? '' : 's'} overdue
                </p>
                <p className="text-sm text-muted-foreground">
                  DORA requires timely submission to avoid regulatory penalties
                </p>
              </div>
            </div>
            <Link
              href="/incidents?filter=overdue"
              className="btn-primary bg-destructive hover:bg-destructive/90 text-destructive-foreground shrink-0"
            >
              Review Overdue
              <ArrowUpRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>
      )}

      {/* TLPT Overdue Alert Banner */}
      {tlptRequired && tlptOverdue > 0 && (
        <div className="mb-4 p-4 rounded-lg border border-amber-500/50 bg-amber-500/10 animate-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/20">
                <Target className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-amber-700 dark:text-amber-500">
                  TLPT testing overdue
                </p>
                <p className="text-sm text-muted-foreground">
                  DORA Article 26 requires threat-led penetration testing every 3 years for significant entities
                </p>
              </div>
            </div>
            <Link
              href="/testing/tlpt"
              className="btn-primary bg-amber-600 hover:bg-amber-700 text-white shrink-0"
            >
              Schedule TLPT
              <ArrowUpRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>
      )}

      {/* TLPT Due Soon Warning */}
      {tlptRequired && tlptOverdue === 0 && tlptDueSoon > 0 && (
        <div className="mb-4 p-4 rounded-lg border border-blue-500/50 bg-blue-500/10 animate-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/20">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-blue-700 dark:text-blue-400">
                  TLPT testing due within 6 months
                </p>
                <p className="text-sm text-muted-foreground">
                  Plan your next threat-led penetration test to maintain compliance
                </p>
              </div>
            </div>
            <Link href="/testing/tlpt" className="btn-secondary shrink-0">
              View TLPT Schedule
              <ArrowUpRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>
      )}

      {/* Simplified Framework Banner */}
      {simplifiedFramework && (
        <div className="mb-4 p-4 rounded-lg border border-success/50 bg-success/10 animate-in">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/20">
              <Scale className="h-5 w-5 text-success" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-success">
                Simplified ICT Risk Framework (Article 16)
              </p>
              <p className="text-sm text-muted-foreground">
                Your organization qualifies for proportionate DORA requirements. TLPT is not mandatory.
              </p>
            </div>
            <Link
              href="/settings/organization"
              className="btn-ghost text-success hover:text-success/80"
            >
              View Classification
              <ArrowUpRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

function DeadlineCard({
  daysToDeadline,
  avgRoiCompleteness,
  totalVendors,
}: {
  daysToDeadline: number;
  avgRoiCompleteness: number;
  totalVendors: number;
}) {
  return (
    <div data-tour="deadline" className="card-premium p-6 animate-slide-up">
      <div className="flex items-center gap-2 text-muted-foreground mb-4">
        <Calendar className="h-4 w-4" />
        <span className="text-sm font-medium">RoI Submission</span>
      </div>
      <div className="mb-6">
        <div className="text-5xl font-semibold tracking-tight mb-1">{daysToDeadline}</div>
        <div className="text-muted-foreground">days remaining</div>
      </div>
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{avgRoiCompleteness}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${avgRoiCompleteness}%` }} />
        </div>
      </div>
      <div className="p-4 rounded-lg bg-accent">
        <div className="flex items-start gap-3">
          <Zap className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium mb-1">
              {totalVendors === 0 ? 'Get started' : 'Keep going!'}
            </p>
            <p className="text-xs text-muted-foreground">
              {totalVendors === 0
                ? 'Add your first vendor to begin tracking progress.'
                : `${totalVendors} vendor${totalVendors === 1 ? '' : 's'} registered. Continue building your RoI.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function AhaMomentCard() {
  return (
    <div className="mb-8 animate-in">
      <div className="card-premium p-6 bg-gradient-to-br from-primary/5 via-primary/10 to-transparent border-primary/20">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <PartyPopper className="h-7 w-7 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold mb-1">
              Great start! Your first vendor is registered
            </h3>
            <p className="text-muted-foreground">
              You&apos;re on your way to DORA compliance. Next, upload contracts and certifications to build your Register of Information.
            </p>
          </div>
          <Link href="/documents" className="btn-primary shrink-0">
            <Upload className="h-4 w-4 mr-2" />
            Upload Documents
          </Link>
        </div>
      </div>
    </div>
  );
}
