import { Metadata } from 'next';
import Link from 'next/link';
import {
  FileText,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
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
import { HelpTooltip, KPI_HELP } from '@/components/ui/help-tooltip';

// ============================================================================
// Time-aware greeting
// ============================================================================
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
  const isNewUser = completedSteps < 2; // Show focused view until 2 steps done

  // =========================================================================
  // FOCUSED ONBOARDING DASHBOARD - Simplified view for new users
  // =========================================================================
  if (isNewUser) {
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
                <p className="text-xs text-muted-foreground">{documentStats.total} uploaded</p>
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

  // =========================================================================
  // FULL DASHBOARD - For users who have completed initial setup
  // =========================================================================
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

      {/* TLPT Overdue Alert Banner - Only for significant entities */}
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

      {/* TLPT Due Soon Warning - Only for significant entities */}
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
            <Link
              href="/testing/tlpt"
              className="btn-secondary shrink-0"
            >
              View TLPT Schedule
              <ArrowUpRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>
      )}

      {/* Simplified Framework Banner - For Art. 16 entities */}
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
          <IncidentStatCard
            major={0}
            significant={0}
            pending={0}
          />
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

      {/* Aha Moment Card - Celebrates first vendor and guides next step */}
      {totalVendors === 1 && documentStats.total === 0 && (
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
              <Link
                href="/documents"
                className="btn-primary shrink-0"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Documents
              </Link>
            </div>
          </div>
        </div>
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

/* ============================================
   COMPONENTS
   ============================================ */

function ActivityItem({
  title,
  description,
  time,
  type,
}: {
  title: string;
  description: string;
  time: string;
  type: 'success' | 'warning' | 'info' | 'security';
}) {
  const icons = {
    success: CheckCircle2,
    warning: AlertCircle,
    info: FileText,
    security: Shield,
  };
  const colors = {
    success: 'text-success',
    warning: 'text-warning',
    info: 'text-info',
    security: 'text-primary',
  };
  const Icon = icons[type];

  return (
    <div className="flex items-center gap-4 py-4 border-b border-border last:border-0">
      <div className={colors[type]}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground truncate">{description}</p>
      </div>
      <p className="text-sm text-muted-foreground whitespace-nowrap">{time}</p>
    </div>
  );
}

function RiskRow({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-sm text-muted-foreground">{count}</span>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function StepItem({
  step,
  title,
  href,
  completed,
}: {
  step: number;
  title: string;
  href: string;
  completed: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 p-3 -mx-3 rounded-lg hover:bg-muted/50 transition-colors group"
    >
      <div
        className={`
          h-8 w-8 rounded-full border-2 flex items-center justify-center text-sm font-medium
          ${completed
            ? 'bg-primary border-primary text-primary-foreground'
            : 'border-border text-muted-foreground group-hover:border-primary group-hover:text-primary'
          }
        `}
      >
        {completed ? <CheckCircle2 className="h-4 w-4" /> : step}
      </div>
      <span className="flex-1 text-sm font-medium">{title}</span>
      <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}

const STEPS = [
  { step: 1, title: 'Add your first ICT third-party provider', href: '/vendors/new' },
  { step: 2, title: 'Upload vendor contracts and certifications', href: '/documents' },
  { step: 3, title: 'Set up incident reporting workflows', href: '/incidents' },
  { step: 4, title: 'Complete your Register of Information', href: '/roi' },
];

function GettingStartedCard({ stepsCompleted }: { stepsCompleted: boolean[] }) {
  const completedCount = stepsCompleted.filter(Boolean).length;
  const allCompleted = completedCount === STEPS.length;

  if (allCompleted) {
    return (
      <div data-tour="getting-started" className="col-span-1 lg:col-span-2 card-premium p-6 animate-slide-up">
        <div className="py-8 text-center">
          <div className="relative inline-block mb-4">
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center animate-bounce">
              <span className="text-xs">🎉</span>
            </div>
          </div>
          <h3 className="text-xl font-semibold mb-2">Setup Complete!</h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            You&apos;ve completed all the essential steps. Your DORA compliance journey is off to a great start.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/compliance/trends" className="btn-primary">
              View Compliance Trends
            </Link>
            <Link href="/vendors" className="btn-secondary">
              Manage Vendors
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-tour="getting-started" className="col-span-1 lg:col-span-2 card-premium p-6 animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <h3>Getting Started</h3>
        <span className="badge badge-default">
          {completedCount}/{STEPS.length} completed
        </span>
      </div>
      <div className="space-y-4">
        {STEPS.map((step, index) => (
          <StepItem
            key={step.step}
            step={step.step}
            title={step.title}
            href={step.href}
            completed={stepsCompleted[index]}
          />
        ))}
      </div>
      {completedCount > 0 && (
        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-primary">
              {Math.round((completedCount / STEPS.length) * 100)}%
            </span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${(completedCount / STEPS.length) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function IncidentStatCard({
  major,
  significant,
  pending,
}: {
  major: number;
  significant: number;
  pending: number;
}) {
  const total = major + significant;
  const hasCritical = major > 0;

  return (
    <Link href="/incidents" className="stat-card group hover:border-primary/50 transition-colors">
      <p className="stat-label mb-2 flex items-center gap-1">
        Active Incidents
        <HelpTooltip content={KPI_HELP.activeIncidents} iconClassName="h-3.5 w-3.5" />
      </p>
      <div className="flex items-baseline gap-2">
        <p className={`stat-value ${hasCritical ? 'text-destructive' : ''}`}>{total}</p>
        {hasCritical && (
          <span className="text-xs font-medium text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
            {major} major
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5 mt-2">
        {pending > 0 ? (
          <>
            <AlertTriangle className="h-4 w-4 text-warning" />
            <span className="text-sm text-warning font-medium">{pending} pending</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span className="text-sm text-success font-medium">All reported</span>
          </>
        )}
      </div>
    </Link>
  );
}

function DeadlineItem({
  incidentId,
  incidentRef,
  title,
  reportType,
  hoursRemaining,
  isOverdue,
}: {
  incidentId: string;
  incidentRef: string;
  title: string;
  reportType: string;
  hoursRemaining: number;
  isOverdue: boolean;
}) {
  const reportTypeLabel = {
    initial: 'Initial (4h)',
    intermediate: 'Intermediate (72h)',
    final: 'Final (30d)',
  }[reportType] || reportType;

  const getUrgencyStyles = () => {
    if (isOverdue) return 'bg-destructive/10 border-destructive/30 text-destructive';
    if (hoursRemaining <= 4) return 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400';
    if (hoursRemaining <= 24) return 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400';
    return 'bg-card border-border';
  };

  const formatTimeRemaining = () => {
    if (isOverdue) {
      const overdueDays = Math.abs(Math.floor(hoursRemaining / 24));
      const overdueHours = Math.abs(hoursRemaining % 24);
      if (overdueDays > 0) return `${overdueDays}d ${overdueHours}h overdue`;
      return `${Math.abs(hoursRemaining)}h overdue`;
    }
    if (hoursRemaining >= 24) {
      const days = Math.floor(hoursRemaining / 24);
      const hours = hoursRemaining % 24;
      return `${days}d ${hours}h remaining`;
    }
    return `${hoursRemaining}h remaining`;
  };

  return (
    <Link href={`/incidents/${incidentId}`}>
      <div className={`p-3 rounded-lg border transition-colors hover:bg-accent/50 ${getUrgencyStyles()}`}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-mono text-muted-foreground">{incidentRef}</span>
          <span className="text-xs font-medium">{reportTypeLabel}</span>
        </div>
        <p className="text-sm font-medium truncate mb-1">{title}</p>
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">{formatTimeRemaining()}</span>
        </div>
      </div>
    </Link>
  );
}

function TestingStatCard({
  testTypeCoverage,
  openFindings,
  tlptStatus,
  tlptRequired,
}: {
  testTypeCoverage: number;
  openFindings: number;
  tlptStatus: 'overdue' | 'due_soon' | 'compliant';
  tlptRequired: boolean;
}) {
  const getStatusDisplay = () => {
    // If TLPT is not required (non-significant entity), show different status
    if (!tlptRequired) {
      return { label: 'TLPT N/A', color: 'text-muted-foreground', bgColor: 'bg-muted' };
    }
    switch (tlptStatus) {
      case 'overdue':
        return { label: 'TLPT Overdue', color: 'text-destructive', bgColor: 'bg-destructive/10' };
      case 'due_soon':
        return { label: 'TLPT Due Soon', color: 'text-amber-600', bgColor: 'bg-amber-500/10' };
      default:
        return { label: 'TLPT Compliant', color: 'text-success', bgColor: 'bg-success/10' };
    }
  };

  const status = getStatusDisplay();

  return (
    <Link href="/testing" className="stat-card group hover:border-primary/50 transition-colors">
      <p className="stat-label mb-2 flex items-center gap-1">
        {tlptRequired ? 'Testing & TLPT' : 'Resilience Testing'}
        <HelpTooltip content={KPI_HELP.testingCoverage} iconClassName="h-3.5 w-3.5" />
      </p>
      <div className="flex items-baseline gap-2">
        <p className="stat-value">{testTypeCoverage}%</p>
        <span className="text-xs text-muted-foreground">coverage</span>
      </div>
      <div className="flex items-center gap-2 mt-2">
        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${status.color} ${status.bgColor}`}>
          {status.label}
        </span>
        {openFindings > 0 && (
          <span className="text-xs text-muted-foreground">
            {openFindings} critical
          </span>
        )}
      </div>
    </Link>
  );
}
