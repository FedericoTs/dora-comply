/**
 * NIS2 Compliance Page
 *
 * Unified NIS2 compliance management with tabbed interface:
 * - Overview: Compliance dashboard with scores and category breakdown
 * - Gap Analysis: Detailed gap list with filtering and prioritization
 */

import { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { Clock, CheckCircle2, AlertTriangle, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { getNIS2Assessments } from '@/lib/compliance/nis2-queries';
import {
  calculateNIS2Compliance,
  getNIS2DashboardStats,
} from '@/lib/compliance/nis2-calculator';
import { NIS2Dashboard, NIS2EmptyState } from '@/components/compliance/nis2-dashboard';
import { NIS2GapList, NIS2GapEmptyState } from '@/components/compliance/nis2-gap-list';
import { NIS2_REQUIREMENTS } from '@/lib/compliance/nis2-requirements';

export const metadata: Metadata = {
  title: 'NIS2 Compliance | DORA Comply',
  description: 'NIS2 Directive compliance assessment and gap analysis',
};

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

export default async function NIS2Page() {
  // Fetch assessments
  const result = await getNIS2Assessments();

  // NIS2 enforcement date was October 17, 2024
  const enforcementDate = new Date('2024-10-17');
  const now = new Date();
  const isEnforced = now >= enforcementDate;
  const daysSinceEnforcement = Math.floor(
    (now.getTime() - enforcementDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Handle not authenticated or no organization
  if (!result) {
    return (
      <div className="space-y-6">
        <NIS2Header isEnforced={isEnforced} daysSinceEnforcement={daysSinceEnforcement} />
        <NIS2EmptyState />
      </div>
    );
  }

  const { assessments, entityType, organizationId } = result;

  // Handle no assessments
  if (assessments.length === 0) {
    return (
      <div className="space-y-6">
        <NIS2Header isEnforced={isEnforced} daysSinceEnforcement={daysSinceEnforcement} />
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
      <NIS2Header isEnforced={isEnforced} daysSinceEnforcement={daysSinceEnforcement} />

      {/* Info badges */}
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

      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="gaps" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Gap Analysis
            {complianceResult.totalGaps > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {complianceResult.totalGaps}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
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
        </TabsContent>

        {/* Gap Analysis Tab */}
        <TabsContent value="gaps">
          {complianceResult.allGaps.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-muted-foreground">
                  {complianceResult.totalGaps} gaps identified |{' '}
                  {complianceResult.criticalGaps.length} critical
                </p>
              </div>
              <NIS2GapList gaps={complianceResult.allGaps} />
            </>
          ) : (
            <NIS2GapEmptyState />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Header component for reuse
function NIS2Header({
  isEnforced,
  daysSinceEnforcement,
}: {
  isEnforced: boolean;
  daysSinceEnforcement: number;
}) {
  const enforcementDate = new Date('2024-10-17');
  const now = new Date();

  return (
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
                {Math.ceil(
                  (enforcementDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
                )}{' '}
                days
              </p>
            </>
          )}
        </div>
        <Button asChild>
          <Link href="/compliance/trends">View Trends</Link>
        </Button>
      </div>
    </div>
  );
}
