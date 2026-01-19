import { Metadata } from 'next';
import {
  Building2,
  Shield,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { getVendorStats } from '@/lib/vendors/queries';
import { fetchAllTemplateStats } from '@/lib/roi/queries';
import { getRecentActivity } from '@/lib/activity/queries';
import { getIncidentStatsEnhanced, getPendingDeadlines } from '@/lib/incidents/queries';
import { getTestingStats } from '@/lib/testing/queries';
import { getOrganizationContext } from '@/lib/org/context';
import { getDocumentStats } from '@/lib/documents/queries';
import { getLatestSnapshot } from '@/lib/compliance/maturity-history';
import {
  AlertBanners,
  DashboardHeader,
  RecentActivityCard,
  OnboardingDashboard,
  ActionRequired,
  KPICard,
  KPICardGrid,
  ComplianceGauge,
  getDefaultDORAPillars,
  RiskHeatMapMini,
  type ActionItem,
  type RiskCount,
} from '@/components/dashboard';

export const metadata: Metadata = {
  title: 'Dashboard | DORA Comply',
  description: 'Your DORA compliance command center',
};

// Default/fallback values for when queries fail
const DEFAULT_VENDOR_STATS = {
  total: 0,
  by_status: { active: 0, inactive: 0, pending_review: 0, offboarding: 0 },
  by_tier: { critical: 0, important: 0, standard: 0 },
  by_risk: { critical: 0, high: 0, medium: 0, low: 0 },
  pending_reviews: 0,
};

const DEFAULT_DOCUMENT_STATS = { total: 0, by_type: {}, by_status: {} };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const firstName = user?.fullName?.split(' ')[0] || '';

  // Fetch all data in parallel with error handling
  let vendorStats = DEFAULT_VENDOR_STATS;
  let roiStats: Awaited<ReturnType<typeof fetchAllTemplateStats>> = [];
  let recentActivity: Awaited<ReturnType<typeof getRecentActivity>> = [];
  let incidentStatsResult: Awaited<ReturnType<typeof getIncidentStatsEnhanced>> = { data: null, error: null };
  let pendingDeadlinesResult: Awaited<ReturnType<typeof getPendingDeadlines>> = { data: null, error: null };
  let testingStatsResult: Awaited<ReturnType<typeof getTestingStats>> = { data: null, error: null };
  let orgContext: Awaited<ReturnType<typeof getOrganizationContext>> = null;
  let documentStats = DEFAULT_DOCUMENT_STATS;
  let maturitySnapshot: Awaited<ReturnType<typeof getLatestSnapshot>> = { data: null, error: null };

  try {
    const results = await Promise.allSettled([
      getVendorStats(),
      fetchAllTemplateStats(),
      getRecentActivity(5),
      getIncidentStatsEnhanced(),
      getPendingDeadlines(5),
      getTestingStats(),
      getOrganizationContext(),
      getDocumentStats(),
      getLatestSnapshot(),
    ]);

    // Extract results with fallbacks
    if (results[0].status === 'fulfilled') vendorStats = results[0].value;
    if (results[1].status === 'fulfilled') roiStats = results[1].value;
    if (results[2].status === 'fulfilled') recentActivity = results[2].value;
    if (results[3].status === 'fulfilled') incidentStatsResult = results[3].value;
    if (results[4].status === 'fulfilled') pendingDeadlinesResult = results[4].value;
    if (results[5].status === 'fulfilled') testingStatsResult = results[5].value;
    if (results[6].status === 'fulfilled') orgContext = results[6].value;
    if (results[7].status === 'fulfilled') documentStats = results[7].value;
    if (results[8].status === 'fulfilled') maturitySnapshot = results[8].value;

    // Log any failures for debugging
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const queryNames = ['vendorStats', 'roiStats', 'recentActivity', 'incidentStats', 'pendingDeadlines', 'testingStats', 'orgContext', 'documentStats', 'maturitySnapshot'];
        console.error(`Dashboard query failed [${queryNames[index]}]:`, result.reason);
      }
    });
  } catch (error) {
    console.error('Dashboard data fetch failed:', error);
  }

  const incidentStats = incidentStatsResult.data;
  const pendingDeadlines = pendingDeadlinesResult.data;
  const testingStats = testingStatsResult.data;

  // Entity classification
  const classification = orgContext?.classification;
  const tlptRequired = classification?.tlptRequired ?? false;
  const simplifiedFramework = classification?.simplifiedFramework ?? false;

  // Calculate RoI readiness
  const templatesWithData = roiStats.filter(s => s.rowCount > 0);
  const avgRoiCompleteness = templatesWithData.length > 0
    ? Math.round(templatesWithData.reduce((sum, s) => sum + s.completeness, 0) / templatesWithData.length)
    : 0;

  // Calculate days to deadline (April 30, 2026)
  const deadline = new Date('2026-04-30');
  const today = new Date();
  const daysToDeadline = Math.max(0, Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

  // Vendor stats
  const totalVendors = vendorStats.total;
  const criticalRisks = vendorStats.by_risk.critical + vendorStats.by_risk.high;
  const vendorTrend = totalVendors > 0 ? Math.round((vendorStats.by_risk.low / totalVendors) * 100 - 50) : 0;

  // Incident stats
  const overdueReports = incidentStats?.overdue_reports ?? 0;
  // Active incidents = total - closed - draft
  const activeIncidents = incidentStats
    ? (incidentStats.total - (incidentStats.by_status?.closed ?? 0) - (incidentStats.by_status?.draft ?? 0))
    : 0;

  // Testing stats
  const tlptOverdue = testingStats?.tlpt_overdue ?? 0;
  const tlptDueSoon = testingStats?.tlpt_due_soon ?? 0;
  const openFindings = testingStats?.critical_open_findings ?? 0;

  // Calculate overall compliance score from maturity snapshot
  const snapshot = maturitySnapshot?.data;
  const complianceScore = snapshot?.overall_readiness_percent ?? 0;
  const pillarScores = {
    ictRisk: snapshot?.pillar_ict_risk_mgmt_percent ?? 0,
    incidents: snapshot?.pillar_incident_reporting_percent ?? 0,
    testing: snapshot?.pillar_resilience_testing_percent ?? 0,
    tprm: snapshot?.pillar_third_party_risk_percent ?? 0,
    infoSharing: snapshot?.pillar_info_sharing_percent ?? 0,
  };

  // Onboarding progress
  const onboardingSteps = [
    { done: totalVendors > 0, label: 'Add first vendor' },
    { done: documentStats.total > 0, label: 'Upload documents' },
    { done: (incidentStats?.total ?? 0) > 0, label: 'Set up incidents' },
    { done: avgRoiCompleteness > 0, label: 'Start RoI' },
  ];
  const completedSteps = onboardingSteps.filter(s => s.done).length;
  const isNewUser = completedSteps < 2;

  // New user dashboard
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

  // Build action items
  const actionItems = buildActionItems({
    overdueReports,
    activeIncidents,
    criticalRisks,
    openFindings,
    tlptOverdue,
    tlptDueSoon,
    tlptRequired,
    pendingDeadlines,
  });

  // Build risk heat map data from vendor stats
  const riskHeatMapData = buildRiskHeatMapData(vendorStats);

  // Full Dashboard - Command Center layout
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

      {/* KPI Cards Row */}
      <KPICardGrid columns={4} className="mb-6">
        <KPICard
          label="DORA Score"
          value={`${Math.round(complianceScore)}%`}
          progress={complianceScore}
          progressBlocks
          href="/compliance/trends"
          icon={Shield}
          variant={complianceScore >= 60 ? 'success' : complianceScore >= 40 ? 'warning' : 'error'}
        />
        <KPICard
          label="Third Parties"
          value={totalVendors}
          subtitle={totalVendors > 0 ? `${criticalRisks} need attention` : 'Add vendors to start'}
          trend={vendorTrend}
          href="/vendors"
          icon={Building2}
          variant={criticalRisks > 3 ? 'warning' : 'default'}
        />
        <KPICard
          label="Risk Exposure"
          value={criticalRisks}
          subtitle={criticalRisks > 0 ? `${criticalRisks} critical/high risks` : 'No critical risks'}
          trend={-criticalRisks}
          invertTrend
          href="/vendors?risk=critical,high"
          icon={AlertTriangle}
          variant={criticalRisks > 0 ? 'error' : 'success'}
        />
        <KPICard
          label="Days to Deadline"
          value={daysToDeadline}
          subtitle="April 30, 2026"
          href="/roi"
          icon={Calendar}
          variant={daysToDeadline <= 90 ? 'warning' : 'info'}
        />
      </KPICardGrid>

      {/* Main Grid - 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Action Required Widget */}
          <ActionRequired items={actionItems} maxItems={5} />

          {/* Risk Heat Map */}
          <RiskHeatMapMini
            risks={riskHeatMapData}
            href="/risks"
            title="Risk Distribution"
          />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Compliance Gauge */}
          <ComplianceGauge
            score={complianceScore}
            label="DORA Compliance"
            pillars={getDefaultDORAPillars(pillarScores)}
            href="/compliance/trends"
          />

          {/* Recent Activity */}
          <RecentActivityCard
            recentActivity={recentActivity}
            totalVendors={totalVendors}
          />
        </div>
      </div>
    </>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

interface ActionBuilderParams {
  overdueReports: number;
  activeIncidents: number;
  criticalRisks: number;
  openFindings: number;
  tlptOverdue: number;
  tlptDueSoon: number;
  tlptRequired: boolean;
  pendingDeadlines: Array<{
    incident_id: string;
    incident_title: string;
    deadline: string;
  }> | null;
}

function buildActionItems(params: ActionBuilderParams): ActionItem[] {
  const items: ActionItem[] = [];

  // Overdue incident reports (Critical)
  if (params.overdueReports > 0) {
    items.push({
      id: 'overdue-reports',
      priority: 'critical',
      type: 'overdue',
      icon: 'document',
      title: 'Overdue incident reports',
      subtitle: `${params.overdueReports} report${params.overdueReports > 1 ? 's' : ''} past deadline`,
      href: '/incidents?filter=overdue',
      count: params.overdueReports,
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    });
  }

  // Active incidents (High)
  if (params.activeIncidents > 0) {
    items.push({
      id: 'active-incidents',
      priority: 'high',
      type: 'pending',
      icon: 'alert',
      title: 'Active incidents',
      subtitle: `${params.activeIncidents} incident${params.activeIncidents > 1 ? 's' : ''} require attention`,
      href: '/incidents?status=active',
      count: params.activeIncidents,
    });
  }

  // Critical vendor risks (High)
  if (params.criticalRisks > 0) {
    items.push({
      id: 'critical-vendors',
      priority: 'high',
      type: 'pending',
      icon: 'vendor',
      title: 'High-risk vendors',
      subtitle: `${params.criticalRisks} vendor${params.criticalRisks > 1 ? 's' : ''} need risk mitigation`,
      href: '/vendors?risk=critical,high',
      count: params.criticalRisks,
    });
  }

  // Open critical findings (Medium)
  if (params.openFindings > 0) {
    items.push({
      id: 'open-findings',
      priority: 'medium',
      type: 'pending',
      icon: 'testing',
      title: 'Open test findings',
      subtitle: `${params.openFindings} critical finding${params.openFindings > 1 ? 's' : ''} unresolved`,
      href: '/testing/findings?severity=critical',
      count: params.openFindings,
    });
  }

  // TLPT overdue (Critical if required)
  if (params.tlptRequired && params.tlptOverdue > 0) {
    items.push({
      id: 'tlpt-overdue',
      priority: 'critical',
      type: 'overdue',
      icon: 'testing',
      title: 'TLPT overdue',
      subtitle: 'Threat-led penetration test past due date',
      href: '/testing/tlpt',
    });
  }

  // TLPT due soon (Medium)
  if (params.tlptRequired && params.tlptDueSoon > 0 && params.tlptOverdue === 0) {
    items.push({
      id: 'tlpt-due-soon',
      priority: 'low',
      type: 'due_soon',
      icon: 'testing',
      title: 'TLPT due soon',
      subtitle: 'Schedule next threat-led penetration test',
      href: '/testing/tlpt',
      dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    });
  }

  // Pending deadlines from incidents
  if (params.pendingDeadlines && params.pendingDeadlines.length > 0) {
    const upcomingDeadlines = params.pendingDeadlines.slice(0, 2);
    for (const deadline of upcomingDeadlines) {
      const dueDate = new Date(deadline.deadline);
      const daysUntil = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

      if (daysUntil <= 7) {
        items.push({
          id: `deadline-${deadline.incident_id}`,
          priority: daysUntil <= 2 ? 'high' : 'medium',
          type: daysUntil <= 0 ? 'overdue' : 'due_soon',
          icon: 'clock',
          title: deadline.incident_title,
          subtitle: `Report deadline approaching`,
          href: `/incidents/${deadline.incident_id}`,
          dueDate,
        });
      }
    }
  }

  return items;
}

interface VendorStats {
  by_risk: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

function buildRiskHeatMapData(vendorStats: VendorStats): RiskCount[] {
  // Map vendor risk levels to heat map positions
  // This is a simplified mapping - in production, you'd use actual L*I scores
  const risks: RiskCount[] = [];

  // Critical risks -> high likelihood, high impact
  if (vendorStats.by_risk.critical > 0) {
    risks.push({ likelihood: 5, impact: 5, count: Math.ceil(vendorStats.by_risk.critical / 2) });
    risks.push({ likelihood: 4, impact: 5, count: Math.floor(vendorStats.by_risk.critical / 2) });
  }

  // High risks -> medium-high likelihood, high impact
  if (vendorStats.by_risk.high > 0) {
    risks.push({ likelihood: 4, impact: 4, count: Math.ceil(vendorStats.by_risk.high / 2) });
    risks.push({ likelihood: 3, impact: 4, count: Math.floor(vendorStats.by_risk.high / 2) });
  }

  // Medium risks -> medium likelihood, medium impact
  if (vendorStats.by_risk.medium > 0) {
    risks.push({ likelihood: 3, impact: 3, count: Math.ceil(vendorStats.by_risk.medium / 2) });
    risks.push({ likelihood: 2, impact: 3, count: Math.floor(vendorStats.by_risk.medium / 2) });
  }

  // Low risks -> low likelihood, low impact
  if (vendorStats.by_risk.low > 0) {
    risks.push({ likelihood: 2, impact: 2, count: Math.ceil(vendorStats.by_risk.low / 2) });
    risks.push({ likelihood: 1, impact: 2, count: Math.floor(vendorStats.by_risk.low / 2) });
  }

  return risks;
}
