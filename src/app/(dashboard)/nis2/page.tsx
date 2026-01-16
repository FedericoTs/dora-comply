import { Metadata } from 'next';
import { getNIS2Assessments } from '@/lib/compliance/nis2-queries';
import {
  calculateNIS2Compliance,
  getNIS2DashboardStats,
} from '@/lib/compliance/nis2-calculator';
import { NIS2Dashboard, NIS2EmptyState } from '@/components/compliance/nis2-dashboard';
import { NIS2_REQUIREMENTS } from '@/lib/compliance/nis2-requirements';

export const metadata: Metadata = {
  title: 'NIS2 Compliance | DORA Comply',
  description: 'NIS2 Directive compliance assessment and gap analysis',
};

export default async function NIS2Page() {
  // Fetch assessments
  const result = await getNIS2Assessments();

  if (!result) {
    // Not authenticated or no organization
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">NIS2 Compliance</h1>
          <p className="text-muted-foreground mt-1">
            Network and Information Security Directive 2 (EU 2022/2555)
          </p>
        </div>
        <NIS2EmptyState />
      </div>
    );
  }

  const { assessments, entityType, organizationId } = result;

  // Calculate compliance if we have assessments
  if (assessments.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">NIS2 Compliance</h1>
          <p className="text-muted-foreground mt-1">
            Network and Information Security Directive 2 (EU 2022/2555)
          </p>
        </div>
        <NIS2EmptyState />
      </div>
    );
  }

  // Calculate full compliance result
  const complianceResult = calculateNIS2Compliance({
    organizationId,
    entityType,
    assessments,
  });

  // Get dashboard stats
  const stats = getNIS2DashboardStats(complianceResult);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">NIS2 Compliance</h1>
          <p className="text-muted-foreground mt-1">
            Network and Information Security Directive 2 (EU 2022/2555)
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {NIS2_REQUIREMENTS.length} requirements | 6 categories
        </div>
      </div>

      {/* Dashboard */}
      <NIS2Dashboard
        overallScore={stats.overallScore}
        overallStatus={stats.overallStatus}
        categoryScores={complianceResult.score.categories}
        criticalGaps={complianceResult.criticalGaps}
        totalGaps={complianceResult.totalGaps}
        assessedCount={stats.progressMetrics.assessed}
        compliantCount={stats.progressMetrics.compliant}
        totalRequirements={stats.progressMetrics.total}
        estimatedRemediationWeeks={complianceResult.estimatedRemediationWeeks}
        entityType={entityType}
      />
    </div>
  );
}
