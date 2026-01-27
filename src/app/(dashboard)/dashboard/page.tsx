import { Metadata } from 'next';
import { getActiveFrameworkFromCookie } from '@/lib/context/framework-cookie';
import { DashboardClient, type DashboardClientProps } from '@/components/dashboard/dashboard-client';
import { type ActionItem } from '@/components/dashboard/action-required';

// =============================================================================
// Dynamic Metadata
// =============================================================================

export async function generateMetadata(): Promise<Metadata> {
  const framework = await getActiveFrameworkFromCookie() || 'nis2';
  const frameworkName = framework === 'nis2' ? 'NIS2' : framework === 'dora' ? 'DORA' : 'Compliance';

  return {
    title: `Dashboard | ${frameworkName} Comply`,
    description: `Your ${frameworkName} compliance command center`,
  };
}

// =============================================================================
// Safe Data Fetching
// =============================================================================

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
      by_status: { active: 0, pending: 0, inactive: 0, offboarding: 0 },
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

async function safeGetNIS2Compliance() {
  try {
    const { getNIS2Assessments } = await import('@/lib/compliance/nis2-queries');
    const { calculateNIS2Compliance } = await import('@/lib/compliance/nis2-calculator');

    const result = await getNIS2Assessments();
    if (!result || result.assessments.length === 0) {
      return null;
    }

    const complianceResult = calculateNIS2Compliance({
      organizationId: result.organizationId,
      entityType: result.entityType,
      assessments: result.assessments,
    });

    return {
      overallPercentage: complianceResult.score.overallPercentage,
      categories: complianceResult.score.categories,
    };
  } catch (error) {
    console.error('Failed to get NIS2 compliance:', error);
    return null;
  }
}

// =============================================================================
// Action Items Builder
// =============================================================================

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

// =============================================================================
// Main Page Component
// =============================================================================

export default async function DashboardPage() {
  // Fetch all data in parallel (both DORA and NIS2)
  const [
    user,
    vendorStats,
    documentStats,
    incidentStatsResult,
    pendingDeadlinesResult,
    recentActivity,
    maturitySnapshot,
    taskStats,
    nis2Compliance,
  ] = await Promise.all([
    safeGetCurrentUser(),
    safeGetVendorStats(),
    safeGetDocumentStats(),
    safeGetIncidentStats(),
    safeGetPendingDeadlines(),
    safeGetRecentActivity(),
    safeGetMaturitySnapshot(),
    safeGetTaskStats(),
    safeGetNIS2Compliance(),
  ]);

  const firstName = user?.fullName?.split(' ')[0] || '';
  const incidentStats = incidentStatsResult?.data;

  // Calculate derived stats
  const totalVendors = vendorStats.total;
  const criticalRisks = vendorStats.by_risk.critical + vendorStats.by_risk.high;

  // Calculate open incidents (all non-closed incidents)
  const openIncidents = incidentStats?.by_status
    ? Object.entries(incidentStats.by_status)
        .filter(([status]) => status !== 'closed')
        .reduce((sum, [, count]) => sum + count, 0)
    : 0;

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

  // Prepare props for client component
  const clientProps: DashboardClientProps = {
    firstName,
    vendorStats,
    documentStats,
    incidentStats: incidentStats || null,
    taskStats,
    maturitySnapshot: maturitySnapshot?.data || null,
    nis2Compliance: nis2Compliance ? {
      overallPercentage: nis2Compliance.overallPercentage ?? 0,
      categories: nis2Compliance.categories ?? {},
    } : null,
    pendingDeadlines,
    recentActivity,
    actionItems,
    totalVendors,
    criticalRisks,
    openIncidents,
    isNewUser,
    onboardingSteps,
    completedSteps,
  };

  return <DashboardClient {...clientProps} />;
}
