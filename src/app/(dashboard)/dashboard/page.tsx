import { Metadata } from 'next';
import Link from 'next/link';
import {
  Building2,
  AlertTriangle,
  Calendar,
  Plus,
  FileText,
  ClipboardCheck,
  Shield,
} from 'lucide-react';

// Dashboard components
import { ComplianceGauge, type CompliancePillar } from '@/components/dashboard/compliance-gauge';
import { VendorsByRiskCard } from '@/components/dashboard/vendors-by-risk-card';
import { PendingDeadlinesCard } from '@/components/dashboard/pending-deadlines-card';
import { RecentActivityCard } from '@/components/dashboard/recent-activity-card';
import { ActionRequired, type ActionItem } from '@/components/dashboard/action-required';

// Helper to build pillars (server-side version)
function buildDORAPillars(scores?: {
  ictRisk?: number;
  incidents?: number;
  testing?: number;
  tprm?: number;
  infoSharing?: number;
}): CompliancePillar[] {
  return [
    {
      id: 'ict-risk',
      name: 'ICT Risk Management',
      shortName: 'ICT Risk Mgmt',
      score: scores?.ictRisk ?? 75,
      href: '/compliance/trends?pillar=ict-risk',
    },
    {
      id: 'incidents',
      name: 'Incident Management',
      shortName: 'Incident Mgmt',
      score: scores?.incidents ?? 60,
      href: '/compliance/trends?pillar=incidents',
    },
    {
      id: 'testing',
      name: 'Resilience Testing',
      shortName: 'Resilience',
      score: scores?.testing ?? 40,
      href: '/compliance/trends?pillar=testing',
    },
    {
      id: 'tprm',
      name: 'Third Party Risk Management',
      shortName: 'TPRM',
      score: scores?.tprm ?? 80,
      href: '/compliance/trends?pillar=tprm',
    },
    {
      id: 'info-sharing',
      name: 'Information Sharing',
      shortName: 'Info Sharing',
      score: scores?.infoSharing ?? 55,
      href: '/compliance/trends?pillar=info-sharing',
    },
  ];
}

export const metadata: Metadata = {
  title: 'Dashboard | DORA Comply',
  description: 'Your DORA compliance command center',
};

// ============================================================================
// Safe Data Fetching
// ============================================================================

async function safeGetCurrentUser() {
  try {
    const { getCurrentUser } = await import('@/lib/auth');
    return await getCurrentUser();
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
}

async function safeGetVendorStats() {
  try {
    const { getVendorStats } = await import('@/lib/vendors/queries');
    return await getVendorStats();
  } catch (error) {
    console.error('Failed to get vendor stats:', error);
    return {
      total: 0,
      by_status: { active: 0, inactive: 0, pending_review: 0, offboarding: 0 },
      by_tier: { critical: 0, important: 0, standard: 0 },
      by_risk: { critical: 0, high: 0, medium: 0, low: 0 },
      pending_reviews: 0,
    };
  }
}

async function safeGetDocumentStats() {
  try {
    const { getDocumentStats } = await import('@/lib/documents/queries');
    return await getDocumentStats();
  } catch (error) {
    console.error('Failed to get document stats:', error);
    return { total: 0, by_type: {}, by_status: {} };
  }
}

async function safeGetIncidentStats() {
  try {
    const { getIncidentStatsEnhanced } = await import('@/lib/incidents/queries');
    return await getIncidentStatsEnhanced();
  } catch (error) {
    console.error('Failed to get incident stats:', error);
    return { data: null, error: null };
  }
}

async function safeGetPendingDeadlines() {
  try {
    const { getPendingDeadlines } = await import('@/lib/incidents/queries');
    return await getPendingDeadlines(5);
  } catch (error) {
    console.error('Failed to get pending deadlines:', error);
    return { data: [], error: null };
  }
}

async function safeGetRecentActivity() {
  try {
    const { getRecentActivity } = await import('@/lib/activity/queries');
    return await getRecentActivity(5);
  } catch (error) {
    console.error('Failed to get recent activity:', error);
    return [];
  }
}

async function safeGetMaturitySnapshot() {
  try {
    const { getLatestSnapshot } = await import('@/lib/compliance/maturity-history');
    return await getLatestSnapshot();
  } catch (error) {
    console.error('Failed to get maturity snapshot:', error);
    return { data: null, error: null };
  }
}

async function safeGetTaskStats() {
  try {
    const { getTaskStats } = await import('@/lib/tasks/queries');
    return await getTaskStats();
  } catch (error) {
    console.error('Failed to get task stats:', error);
    return null;
  }
}

// ============================================================================
// Action Items Builder
// ============================================================================

function buildActionItems(
  vendorStats: Awaited<ReturnType<typeof safeGetVendorStats>>,
  incidentStats: { data: { by_status?: Record<string, number>; overdue_reports?: number } | null } | null,
  taskStats: { overdue: number; due_this_week: number } | null,
  pendingDeadlines: { data: Array<{ is_overdue: boolean }> }
): ActionItem[] {
  const items: ActionItem[] = [];

  // Critical: Overdue incident reports
  const overdueDeadlines = pendingDeadlines.data?.filter(d => d.is_overdue).length || 0;
  if (overdueDeadlines > 0) {
    items.push({
      id: 'overdue-reports',
      priority: 'critical',
      type: 'overdue',
      icon: 'alert',
      title: 'Overdue incident reports',
      subtitle: `${overdueDeadlines} report(s) past deadline`,
      href: '/incidents?filter=overdue',
      count: overdueDeadlines,
    });
  }

  // High: Critical/High risk vendors
  const criticalVendors = vendorStats.by_risk.critical;
  if (criticalVendors > 0) {
    items.push({
      id: 'critical-vendors',
      priority: 'high',
      type: 'pending',
      icon: 'vendor',
      title: 'Critical risk vendors',
      subtitle: 'Require immediate attention',
      href: '/vendors?risk=critical',
      count: criticalVendors,
    });
  }

  // High: Vendors pending review
  if (vendorStats.pending_reviews > 0) {
    items.push({
      id: 'pending-reviews',
      priority: 'high',
      type: 'pending',
      icon: 'vendor',
      title: 'Vendors pending review',
      subtitle: 'Need assessment completion',
      href: '/vendors?status=pending_review',
      count: vendorStats.pending_reviews,
    });
  }

  // Medium: Open incidents (non-closed)
  const openIncidents = incidentStats?.data?.by_status
    ? Object.entries(incidentStats.data.by_status)
        .filter(([status]) => status !== 'closed')
        .reduce((sum, [, count]) => sum + count, 0)
    : 0;
  if (openIncidents > 0) {
    items.push({
      id: 'open-incidents',
      priority: 'medium',
      type: 'pending',
      icon: 'alert',
      title: 'Open incidents',
      subtitle: 'Require investigation',
      href: '/incidents?status=detected',
      count: openIncidents,
    });
  }

  // Medium: Overdue tasks
  const overdueTasks = taskStats?.overdue || 0;
  if (overdueTasks > 0) {
    items.push({
      id: 'overdue-tasks',
      priority: 'medium',
      type: 'overdue',
      icon: 'clock',
      title: 'Overdue tasks',
      subtitle: 'Past due date',
      href: '/tasks?filter=overdue',
      count: overdueTasks,
    });
  }

  return items;
}

// ============================================================================
// Main Page Component
// ============================================================================

export default async function DashboardPage() {
  // Fetch all data in parallel
  const [
    user,
    vendorStats,
    documentStats,
    incidentStatsResult,
    pendingDeadlinesResult,
    recentActivity,
    maturitySnapshot,
    taskStats,
  ] = await Promise.all([
    safeGetCurrentUser(),
    safeGetVendorStats(),
    safeGetDocumentStats(),
    safeGetIncidentStats(),
    safeGetPendingDeadlines(),
    safeGetRecentActivity(),
    safeGetMaturitySnapshot(),
    safeGetTaskStats(),
  ]);

  const firstName = user?.fullName?.split(' ')[0] || '';
  const incidentStats = incidentStatsResult?.data;

  // Calculate stats
  const totalVendors = vendorStats.total;
  const criticalRisks = vendorStats.by_risk.critical + vendorStats.by_risk.high;

  // Calculate days to deadline (April 30, 2026)
  const deadline = new Date('2026-04-30');
  const today = new Date();
  const daysToDeadline = Math.max(0, Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

  // Compliance score from maturity snapshot
  const snapshot = maturitySnapshot?.data;
  const complianceScore = snapshot?.overall_readiness_percent ?? 0;

  // Calculate open incidents (all non-closed incidents)
  const openIncidents = incidentStats?.by_status
    ? Object.entries(incidentStats.by_status)
        .filter(([status]) => status !== 'closed')
        .reduce((sum, [, count]) => sum + count, 0)
    : 0;

  // Build pillar scores (use snapshot data if available, otherwise defaults)
  const pillars = buildDORAPillars({
    ictRisk: complianceScore > 0 ? Math.round(complianceScore * 0.9) : undefined,
    incidents: incidentStats ? Math.round(100 - (openIncidents / Math.max(incidentStats.total, 1)) * 100) : undefined,
    testing: undefined,
    tprm: totalVendors > 0 ? Math.round(100 - (criticalRisks / totalVendors) * 100) : undefined,
    infoSharing: undefined,
  });

  // Build action items
  const actionItems = buildActionItems(
    vendorStats,
    incidentStatsResult,
    taskStats,
    pendingDeadlinesResult
  );

  // Pending deadlines for component
  const pendingDeadlines = pendingDeadlinesResult.data || [];

  // Onboarding check
  const onboardingSteps = [
    { done: totalVendors > 0, label: 'Add first vendor' },
    { done: documentStats.total > 0, label: 'Upload documents' },
    { done: (incidentStats?.total ?? 0) > 0, label: 'Set up incidents' },
  ];
  const completedSteps = onboardingSteps.filter(s => s.done).length;
  const isNewUser = completedSteps < 2;

  // ============================================================================
  // Onboarding View (New Users)
  // ============================================================================

  if (isNewUser) {
    return (
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">
            Welcome{firstName ? `, ${firstName}` : ''}!
          </h1>
          <p className="text-muted-foreground">
            Let&apos;s get your compliance program set up.
          </p>
        </div>

        <div className="p-6 bg-card rounded-lg border">
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
          <div className="grid grid-cols-3 gap-4 mt-4">
            {onboardingSteps.map((step, i) => (
              <div key={i} className="text-center">
                <div className={`text-sm ${step.done ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                  {step.done ? '✓' : '○'} {step.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Start Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/vendors/new"
            className="flex flex-col items-center gap-3 p-6 bg-card rounded-lg border hover:border-primary/50 hover:shadow-md transition-all"
          >
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="font-medium">Add First Vendor</span>
            <span className="text-sm text-muted-foreground text-center">Start tracking your third parties</span>
          </Link>
          <Link
            href="/documents"
            className="flex flex-col items-center gap-3 p-6 bg-card rounded-lg border hover:border-primary/50 hover:shadow-md transition-all"
          >
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30">
              <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="font-medium">Upload Documents</span>
            <span className="text-sm text-muted-foreground text-center">SOC 2 reports, contracts, policies</span>
          </Link>
          <Link
            href="/incidents/new"
            className="flex flex-col items-center gap-3 p-6 bg-card rounded-lg border hover:border-primary/50 hover:shadow-md transition-all"
          >
            <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/30">
              <AlertTriangle className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <span className="font-medium">Report Incident</span>
            <span className="text-sm text-muted-foreground text-center">Track ICT incidents</span>
          </Link>
        </div>

        <div className="text-center p-6 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
          <p className="text-amber-800 dark:text-amber-200 font-medium">
            {daysToDeadline} days until DORA deadline
          </p>
          <p className="text-amber-700 dark:text-amber-300 text-sm mt-1">
            January 17, 2026
          </p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Full Dashboard (Existing Users)
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back{firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s your compliance overview
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
          <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
            {daysToDeadline} days to DORA deadline
          </span>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-card rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">Compliance Score</span>
          </div>
          <p className="text-2xl font-bold">{Math.round(complianceScore)}%</p>
        </div>
        <div className="p-4 bg-card rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="h-5 w-5 text-blue-500" />
            <span className="text-sm text-muted-foreground">Third Parties</span>
          </div>
          <p className="text-2xl font-bold">{totalVendors}</p>
        </div>
        <div className="p-4 bg-card rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <span className="text-sm text-muted-foreground">Risk Exposure</span>
          </div>
          <p className="text-2xl font-bold">{criticalRisks}</p>
        </div>
        <div className="p-4 bg-card rounded-lg border">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-5 w-5 text-purple-500" />
            <span className="text-sm text-muted-foreground">Documents</span>
          </div>
          <p className="text-2xl font-bold">{documentStats.total}</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Compliance & Risk */}
        <div className="lg:col-span-2 space-y-6">
          {/* Compliance Gauge */}
          <ComplianceGauge
            score={complianceScore}
            label="DORA Readiness"
            pillars={pillars}
            href="/compliance"
          />

          {/* Vendors by Risk */}
          <VendorsByRiskCard
            vendorStats={vendorStats}
            totalVendors={totalVendors}
          />
        </div>

        {/* Right Column - Actions & Deadlines */}
        <div className="space-y-6">
          {/* Action Required */}
          <ActionRequired items={actionItems} maxItems={5} />

          {/* Pending Deadlines */}
          <PendingDeadlinesCard pendingDeadlines={pendingDeadlines} />
        </div>
      </div>

      {/* Recent Activity - Full Width */}
      <RecentActivityCard
        recentActivity={recentActivity}
        totalVendors={totalVendors}
      />

      {/* Quick Actions - Compact row */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/vendors/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm font-medium"
        >
          <Plus className="h-4 w-4" />
          Add Vendor
        </Link>
        <Link
          href="/incidents/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors text-sm font-medium"
        >
          <AlertTriangle className="h-4 w-4" />
          Report Incident
        </Link>
        <Link
          href="/documents"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors text-sm font-medium"
        >
          <FileText className="h-4 w-4" />
          Upload Document
        </Link>
        <Link
          href="/questionnaires"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors text-sm font-medium"
        >
          <ClipboardCheck className="h-4 w-4" />
          Send Questionnaire
        </Link>
      </div>
    </div>
  );
}
