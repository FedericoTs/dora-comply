'use client';

/**
 * DORA Compliance Dashboard Component
 *
 * Displays comprehensive DORA compliance status using maturity levels (L0-L4)
 * Replaces the misleading "100% effectiveness" with precise compliance scoring
 *
 * Features:
 * - Overall maturity level with visual indicator
 * - Per-pillar breakdown with gap indicators
 * - Critical gaps summary
 * - Remediation timeline estimate
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Shield,
  AlertCircle,
  TestTube2,
  Building2,
  Share2,
  ChevronRight,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  MaturityLevelBadge,
  MaturityProgressBar,
  ComplianceStatusBadge,
} from './maturity-level-badge';
import type {
  DORAComplianceResult,
  DORAPillar,
  PillarScore,
  MaturityLevel,
} from '@/lib/compliance/dora-types';
import { DORAPillarLabels } from '@/lib/compliance/dora-types';

interface DORAComplianceDashboardProps {
  compliance: DORAComplianceResult;
  onPillarClick?: (pillar: DORAPillar) => void;
  onGapClick?: (requirementId: string) => void;
  className?: string;
}

// Pillar icons
const PillarIcons: Record<DORAPillar, React.ReactNode> = {
  ICT_RISK: <Shield className="h-4 w-4" />,
  INCIDENT: <AlertCircle className="h-4 w-4" />,
  TESTING: <TestTube2 className="h-4 w-4" />,
  TPRM: <Building2 className="h-4 w-4" />,
  SHARING: <Share2 className="h-4 w-4" />,
};

export function DORAComplianceDashboard({
  compliance,
  onPillarClick,
  onGapClick,
  className,
}: DORAComplianceDashboardProps) {
  const {
    overallMaturity,
    overallStatus,
    overallPercentage,
    pillars,
    criticalGaps,
    totalGaps,
    evidenceSummary,
    estimatedRemediationMonths,
    sourceDocuments,
  } = compliance;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Overall Status Card */}
      <Card className="border-2">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                DORA Compliance Readiness
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-sm">
                      <p className="font-medium mb-1">Maturity-Based Scoring</p>
                      <p className="text-xs text-muted-foreground">
                        DORA compliance is measured using a 5-level maturity model (L0-L4)
                        based on COBIT/CMMI standards. This provides a more accurate and
                        actionable assessment than simple percentages.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
              <CardDescription>
                Based on SOC 2 report analysis and DORA requirement mapping
              </CardDescription>
            </div>
            <ComplianceStatusBadge status={overallStatus} className="text-sm" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Overall Maturity */}
            <div className="flex flex-col items-center justify-center p-4 bg-muted/30 rounded-lg">
              <span className="text-sm text-muted-foreground mb-2">Overall Maturity</span>
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'flex items-center justify-center w-16 h-16 rounded-full text-2xl font-bold text-white',
                    {
                      'bg-slate-500': overallMaturity === 0,
                      'bg-red-500': overallMaturity === 1,
                      'bg-amber-500': overallMaturity === 2,
                      'bg-emerald-500': overallMaturity === 3,
                      'bg-blue-600': overallMaturity === 4,
                    }
                  )}
                >
                  L{overallMaturity}
                </div>
                <div className="text-left">
                  <p className="font-semibold">
                    {overallMaturity === 0 && 'Not Performed'}
                    {overallMaturity === 1 && 'Informal'}
                    {overallMaturity === 2 && 'Planned & Tracked'}
                    {overallMaturity === 3 && 'Well-Defined'}
                    {overallMaturity === 4 && 'Quantitative'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {overallPercentage}% requirements covered
                  </p>
                </div>
              </div>
              <MaturityProgressBar level={overallMaturity} className="mt-4 w-full" />
            </div>

            {/* Evidence Summary */}
            <div className="p-4 bg-muted/30 rounded-lg">
              <span className="text-sm text-muted-foreground">Evidence Summary</span>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    Sufficient
                  </span>
                  <span className="font-semibold">{evidenceSummary.sufficient}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    Partial
                  </span>
                  <span className="font-semibold">{evidenceSummary.partial}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    Insufficient
                  </span>
                  <span className="font-semibold">{evidenceSummary.insufficient}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>Total Requirements</span>
                  <span>{evidenceSummary.total}</span>
                </div>
              </div>
            </div>

            {/* Remediation Estimate */}
            <div className="p-4 bg-muted/30 rounded-lg">
              <span className="text-sm text-muted-foreground">Remediation Estimate</span>
              <div className="mt-3">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <span className="text-2xl font-bold">
                    {estimatedRemediationMonths === 0
                      ? 'Minimal'
                      : `${estimatedRemediationMonths} months`}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p className="flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                    {criticalGaps.length} critical gaps
                  </p>
                  <p className="mt-1">
                    {totalGaps} total gaps to address
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" />
                  Based on {sourceDocuments.length} document(s)
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pillar Breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Pillar Breakdown</CardTitle>
          <CardDescription>
            DORA compliance status across 5 regulatory pillars
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(Object.entries(pillars) as [DORAPillar, PillarScore][]).map(
              ([pillar, score]) => (
                <PillarRow
                  key={pillar}
                  pillar={pillar}
                  score={score}
                  onClick={() => onPillarClick?.(pillar)}
                />
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Critical Gaps */}
      {criticalGaps.length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Critical Gaps ({criticalGaps.length})
            </CardTitle>
            <CardDescription>
              High-priority items requiring immediate attention for DORA compliance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {criticalGaps.slice(0, 5).map((gap) => (
                <div
                  key={gap.requirementId}
                  className={cn(
                    'p-3 rounded-lg border border-destructive/30 bg-destructive/5',
                    'hover:bg-destructive/10 cursor-pointer transition-colors'
                  )}
                  onClick={() => onGapClick?.(gap.requirementId)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive" className="text-xs">
                          {gap.articleNumber}
                        </Badge>
                        <span className="font-medium text-sm">{gap.articleTitle}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {gap.gapDescription}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge
                        variant="outline"
                        className={cn('text-xs', {
                          'border-red-500 text-red-500': gap.soc2Coverage === 'none',
                          'border-amber-500 text-amber-500': gap.soc2Coverage === 'partial',
                        })}
                      >
                        {gap.soc2Coverage === 'none' ? 'No SOC 2' : 'Partial SOC 2'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {gap.estimatedEffort}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {criticalGaps.length > 5 && (
                <button
                  className="w-full text-center text-sm text-primary hover:underline py-2"
                  onClick={() => onGapClick?.('')}
                >
                  View all {criticalGaps.length} critical gaps →
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Pillar row component
function PillarRow({
  pillar,
  score,
  onClick,
}: {
  pillar: DORAPillar;
  score: PillarScore;
  onClick?: () => void;
}) {
  const { maturityLevel, percentageScore, requirementsMet, requirementsTotal, gaps, status } =
    score;

  return (
    <div
      className={cn(
        'flex items-center gap-4 p-3 rounded-lg border transition-colors',
        'hover:bg-muted/50 cursor-pointer',
        {
          'border-emerald-500/30 bg-emerald-500/5': status === 'compliant',
          'border-amber-500/30 bg-amber-500/5': status === 'partial',
          'border-red-500/30 bg-red-500/5': status === 'non_compliant',
        }
      )}
      onClick={onClick}
    >
      {/* Icon */}
      <div
        className={cn('flex items-center justify-center w-10 h-10 rounded-lg', {
          'bg-emerald-500/20 text-emerald-600': status === 'compliant',
          'bg-amber-500/20 text-amber-600': status === 'partial',
          'bg-red-500/20 text-red-600': status === 'non_compliant',
        })}
      >
        {PillarIcons[pillar]}
      </div>

      {/* Label */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">{DORAPillarLabels[pillar]}</span>
          {gaps.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {gaps.length} gap{gaps.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {requirementsMet} of {requirementsTotal} requirements met
        </p>
      </div>

      {/* Score */}
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <div className="text-sm font-semibold">{percentageScore}%</div>
          <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full', {
                'bg-emerald-500': status === 'compliant',
                'bg-amber-500': status === 'partial',
                'bg-red-500': status === 'non_compliant',
              })}
              style={{ width: `${percentageScore}%` }}
            />
          </div>
        </div>
        <MaturityLevelBadge level={maturityLevel} size="sm" showDescription />
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
}

// Compact version for sidebar/summary views
export function DORAComplianceSummary({
  compliance,
  className,
}: {
  compliance: DORAComplianceResult;
  className?: string;
}) {
  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium">DORA Readiness</span>
        <ComplianceStatusBadge status={compliance.overallStatus} className="text-xs" />
      </div>
      <div className="flex items-center gap-3">
        <div
          className={cn('flex items-center justify-center w-12 h-12 rounded-full text-xl font-bold text-white', {
            'bg-slate-500': compliance.overallMaturity === 0,
            'bg-red-500': compliance.overallMaturity === 1,
            'bg-amber-500': compliance.overallMaturity === 2,
            'bg-emerald-500': compliance.overallMaturity === 3,
            'bg-blue-600': compliance.overallMaturity === 4,
          })}
        >
          L{compliance.overallMaturity}
        </div>
        <div className="flex-1">
          <MaturityProgressBar level={compliance.overallMaturity} showLabels={false} />
          <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
            <span>{compliance.overallPercentage}% covered</span>
            <span>{compliance.criticalGaps.length} critical gaps</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
