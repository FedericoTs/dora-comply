'use client';

/**
 * NIS2 Compliance Dashboard Component
 *
 * Displays organization-level NIS2 compliance status including:
 * - Overall compliance score
 * - Category breakdown (Article 21 domains)
 * - Gap summary
 * - Progress metrics
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Link from 'next/link';
import {
  ShieldCheck,
  ShieldAlert,
  Shield,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  FileText,
  Users,
  Server,
  Link2,
  Bell,
  Clock,
} from 'lucide-react';
import type {
  NIS2ComplianceStatus,
  NIS2Category,
  NIS2CategoryScore,
  NIS2GapItem,
} from '@/lib/compliance/nis2-types';
import {
  NIS2StatusLabels,
  NIS2StatusColors,
  NIS2CategoryLabels,
  NIS2CategoryArticles,
  NIS2CategoryColors,
} from '@/lib/compliance/nis2-types';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

interface NIS2DashboardProps {
  overallScore: number;
  overallStatus: NIS2ComplianceStatus;
  categoryScores: Record<NIS2Category, NIS2CategoryScore>;
  criticalGaps: NIS2GapItem[];
  totalGaps: number;
  assessedCount: number;
  compliantCount: number;
  totalRequirements: number;
  estimatedRemediationWeeks: number;
  entityType: 'essential_entity' | 'important_entity';
}

// =============================================================================
// Category Icons
// =============================================================================

const CATEGORY_ICONS: Record<NIS2Category, typeof Shield> = {
  governance: Users,
  risk_management: ShieldCheck,
  incident_handling: AlertTriangle,
  business_continuity: Server,
  supply_chain: Link2,
  reporting: Bell,
};

// =============================================================================
// Helper Components
// =============================================================================

function StatusBadge({ status }: { status: NIS2ComplianceStatus }) {
  const variants: Record<NIS2ComplianceStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    compliant: 'default',
    partial: 'secondary',
    non_compliant: 'destructive',
    not_assessed: 'outline',
  };

  return (
    <Badge variant={variants[status]} className={cn(NIS2StatusColors[status])}>
      {NIS2StatusLabels[status]}
    </Badge>
  );
}

function ScoreGauge({ score, status }: { score: number; status: NIS2ComplianceStatus }) {
  const statusColors = {
    compliant: 'text-emerald-600',
    partial: 'text-amber-500',
    non_compliant: 'text-red-500',
    not_assessed: 'text-muted-foreground',
  };

  return (
    <div className="relative flex flex-col items-center">
      <div className="relative w-32 h-32">
        {/* Background circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="56"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            className="text-muted"
          />
          <circle
            cx="64"
            cy="64"
            r="56"
            fill="none"
            stroke="currentColor"
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 352} 352`}
            className={statusColors[status]}
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={cn('text-3xl font-bold', statusColors[status])}>
            {score}%
          </span>
        </div>
      </div>
      <StatusBadge status={status} />
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function NIS2Dashboard({
  overallScore,
  overallStatus,
  categoryScores,
  criticalGaps,
  totalGaps,
  assessedCount,
  compliantCount,
  totalRequirements,
  estimatedRemediationWeeks,
  entityType,
}: NIS2DashboardProps) {
  const categories: NIS2Category[] = [
    'governance',
    'risk_management',
    'incident_handling',
    'business_continuity',
    'supply_chain',
    'reporting',
  ];

  return (
    <div className="space-y-6">
      {/* Header Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Overall Score Card */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">NIS2 Compliance</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ScoreGauge score={overallScore} status={overallStatus} />
          </CardContent>
        </Card>

        {/* Progress Stats */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Assessment Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Assessed</span>
                <span className="font-medium">{assessedCount} / {totalRequirements}</span>
              </div>
              <Progress value={(assessedCount / totalRequirements) * 100} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">Compliant</span>
                <span className="font-medium">{compliantCount} / {totalRequirements}</span>
              </div>
              <Progress
                value={(compliantCount / totalRequirements) * 100}
                className="h-2 [&>div]:bg-emerald-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Gap Summary */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gaps Identified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20">
                <span className="text-2xl font-bold text-red-600">{totalGaps}</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-sm">
                    {criticalGaps.length} Critical
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-sm text-muted-foreground">
                    {totalGaps - criticalGaps.length} Other
                  </span>
                </div>
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="w-full mt-4">
              <Link href="/nis2/gaps">
                View All Gaps
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Remediation Estimate */}
        <Card className="md:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Remediation Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/20">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{estimatedRemediationWeeks}</p>
                <p className="text-sm text-muted-foreground">weeks estimated</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Based on gap analysis with 50% parallelization
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Entity Type Banner */}
      <Card className={cn(
        'border-l-4',
        entityType === 'essential_entity' ? 'border-l-purple-500' : 'border-l-blue-500'
      )}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className={cn(
                'h-5 w-5',
                entityType === 'essential_entity' ? 'text-purple-500' : 'text-blue-500'
              )} />
              <div>
                <p className="font-medium">
                  {entityType === 'essential_entity' ? 'Essential Entity' : 'Important Entity'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {entityType === 'essential_entity'
                    ? 'Subject to comprehensive supervisory regime including regular audits'
                    : 'Subject to ex-post supervisory regime based on evidence'}
                </p>
              </div>
            </div>
            <Badge variant="outline">
              {entityType === 'essential_entity' ? 'Article 32' : 'Article 33'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Compliance by Category
          </CardTitle>
          <CardDescription>
            NIS2 Article 21 risk management measures breakdown
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => {
              const score = categoryScores[category];
              const Icon = CATEGORY_ICONS[category];

              return (
                <Card key={category} className="border-l-4" style={{
                  borderLeftColor: NIS2CategoryColors[category].replace('bg-', '#').replace('-500', '')
                }}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={cn('p-2 rounded-lg', NIS2CategoryColors[category], 'text-white')}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{NIS2CategoryLabels[category]}</p>
                          <p className="text-xs text-muted-foreground">{NIS2CategoryArticles[category]}</p>
                        </div>
                      </div>
                      <StatusBadge status={score.status} />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Score</span>
                        <span className="font-medium">{score.percentage}%</span>
                      </div>
                      <Progress value={score.percentage} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{score.compliantCount} compliant</span>
                        <span>{score.totalCount} total</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Critical Gaps Section */}
      {criticalGaps.length > 0 && (
        <Card className="border-red-200 dark:border-red-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <ShieldAlert className="h-5 w-5" />
              Critical Gaps Requiring Immediate Attention
            </CardTitle>
            <CardDescription>
              These gaps represent significant compliance risks and should be prioritized
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalGaps.slice(0, 5).map((gap) => (
                <div
                  key={gap.requirementId}
                  className="flex items-start gap-3 p-3 rounded-lg border border-red-100 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10"
                >
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {gap.articleNumber}
                      </Badge>
                      <span className="font-medium text-sm">{gap.title}</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {gap.gapDescription}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {gap.estimatedEffort}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {NIS2CategoryLabels[gap.category]}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
              {criticalGaps.length > 5 && (
                <Button asChild variant="ghost" className="w-full">
                  <Link href="/nis2/gaps?priority=critical">
                    View all {criticalGaps.length} critical gaps
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Button asChild variant="outline" className="h-auto py-4">
          <Link href="/nis2/assessment">
            <div className="flex flex-col items-center gap-2">
              <CheckCircle2 className="h-6 w-6" />
              <span>Start Assessment</span>
            </div>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto py-4">
          <Link href="/nis2/gaps">
            <div className="flex flex-col items-center gap-2">
              <TrendingUp className="h-6 w-6" />
              <span>Gap Analysis</span>
            </div>
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto py-4">
          <Link href="/nis2/reports">
            <div className="flex flex-col items-center gap-2">
              <FileText className="h-6 w-6" />
              <span>Generate Report</span>
            </div>
          </Link>
        </Button>
      </div>
    </div>
  );
}

// =============================================================================
// Empty State
// =============================================================================

export function NIS2EmptyState() {
  return (
    <Card className="text-center py-12">
      <CardContent>
        <Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Begin Your NIS2 Assessment</h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Start by assessing your organization against the 42 NIS2 requirements
          across 6 categories to identify compliance gaps.
        </p>
        <Button asChild>
          <Link href="/nis2/assessment">
            Start Assessment
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
