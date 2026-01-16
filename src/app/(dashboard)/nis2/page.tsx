import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">NIS2 Compliance</h1>
            <p className="text-muted-foreground">
              Network and Information Security Directive 2 (EU 2022/2555)
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-emerald-600">In Effect</span>
              </p>
            </div>
          </div>
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
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">NIS2 Compliance</h1>
            <p className="text-muted-foreground">
              Network and Information Security Directive 2 (EU 2022/2555)
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="text-emerald-600">In Effect</span>
              </p>
            </div>
          </div>
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

  // NIS2 enforcement date was October 17, 2024
  const enforcementDate = new Date('2024-10-17');
  const now = new Date();
  const isEnforced = now >= enforcementDate;
  const daysSinceEnforcement = Math.floor((now.getTime() - enforcementDate.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">NIS2 Compliance</h1>
          <p className="text-muted-foreground">
            Network and Information Security Directive 2 (EU 2022/2555)
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            {isEnforced ? (
              <>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="font-medium flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span className="text-emerald-600">In Effect</span>
                </p>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">Enforcement Date</p>
                <p className="font-medium flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {Math.ceil((enforcementDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))} days
                </p>
              </>
            )}
          </div>
          <Button asChild>
            <Link href="/compliance/trends">
              View Trends
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Info badge */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Badge variant="outline">{NIS2_REQUIREMENTS.length} requirements</Badge>
        <Badge variant="outline">6 categories</Badge>
        {isEnforced && (
          <Badge variant="secondary" className="text-amber-600 bg-amber-100">
            <Clock className="h-3 w-3 mr-1" />
            {daysSinceEnforcement} days since enforcement
          </Badge>
        )}
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
