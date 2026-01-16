'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  FileText,
  Users,
  ScrollText,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Activity,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { HealthScoreGauge } from '@/components/ui/health-score-gauge';
import { TrendIndicator } from '@/components/ui/trend-indicator';
import { DataFreshnessBadge } from '@/components/ui/data-freshness-badge';
import { ActionCard, ActionList, type ActionCardProps } from '@/components/ui/action-card';
import type { VendorWithRelations } from '@/lib/vendors/types';

// ============================================================================
// Types
// ============================================================================

export interface VendorHealthDimension {
  id: string;
  label: string;
  score: number;
  maxScore: number;
  trend?: number;
  status: 'good' | 'warning' | 'critical' | 'unknown';
  details?: string;
}

export interface VendorAction {
  id: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description?: string;
  dueDate?: string;
  href?: string;
  onClick?: () => void;
}

export interface VendorSummaryDashboardProps {
  vendor: VendorWithRelations;
  healthScore?: number;
  healthDimensions?: VendorHealthDimension[];
  nextActions?: VendorAction[];
  onActionClick?: (action: VendorAction) => void;
  onDismissAction?: (actionId: string) => void;
  className?: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

function calculateHealthScore(vendor: VendorWithRelations): {
  score: number;
  dimensions: VendorHealthDimension[];
} {
  const dimensions: VendorHealthDimension[] = [];

  // 1. Documentation Score (0-25)
  const docScore = Math.min(25, (vendor.documents_count || 0) * 5);
  dimensions.push({
    id: 'documentation',
    label: 'Documentation',
    score: docScore,
    maxScore: 25,
    status: docScore >= 20 ? 'good' : docScore >= 10 ? 'warning' : 'critical',
    details: `${vendor.documents_count || 0} documents uploaded`,
  });

  // 2. Compliance Score (0-25)
  let complianceScore = 0;
  if (vendor.lei) complianceScore += 10;
  if (vendor.lei_verified_at) complianceScore += 5;
  if (vendor.has_parsed_soc2) complianceScore += 10;
  dimensions.push({
    id: 'compliance',
    label: 'Compliance',
    score: complianceScore,
    maxScore: 25,
    status: complianceScore >= 20 ? 'good' : complianceScore >= 10 ? 'warning' : 'critical',
    details: vendor.has_parsed_soc2 ? 'SOC 2 report on file' : 'SOC 2 report needed',
  });

  // 3. Risk Score (0-25) - inverted (lower risk = higher health)
  const riskScoreRaw = vendor.risk_score ?? 50;
  const riskHealthScore = Math.round(25 * (1 - riskScoreRaw / 100));
  dimensions.push({
    id: 'risk',
    label: 'Risk',
    score: riskHealthScore,
    maxScore: 25,
    status: riskHealthScore >= 18 ? 'good' : riskHealthScore >= 10 ? 'warning' : 'critical',
    details: vendor.risk_score !== null ? `Risk score: ${vendor.risk_score}/100` : 'Not assessed',
  });

  // 4. Contracts Score (0-25)
  const hasContracts = (vendor.contracts_count || 0) > 0;
  const contractScore = hasContracts ? 25 : 0;
  dimensions.push({
    id: 'contracts',
    label: 'Contractual',
    score: contractScore,
    maxScore: 25,
    status: hasContracts ? 'good' : 'critical',
    details: `${vendor.contracts_count || 0} contracts on file`,
  });

  const totalScore = dimensions.reduce((sum, d) => sum + d.score, 0);

  return { score: totalScore, dimensions };
}

function generateNextActions(vendor: VendorWithRelations): VendorAction[] {
  const actions: VendorAction[] = [];

  // Check for missing SOC 2 report
  if (!vendor.has_parsed_soc2 && (vendor.tier === 'critical' || vendor.tier === 'important')) {
    actions.push({
      id: 'upload-soc2',
      priority: vendor.tier === 'critical' ? 'critical' : 'high',
      title: 'Upload SOC 2 Report',
      description: 'Required for DORA compliance assessment',
      href: `/vendors/${vendor.id}?tab=documents`,
    });
  }

  // Check for missing LEI verification
  if (vendor.lei && !vendor.lei_verified_at) {
    actions.push({
      id: 'verify-lei',
      priority: 'medium',
      title: 'Verify LEI with GLEIF',
      description: 'Confirm legal entity information',
      href: `/vendors/${vendor.id}?tab=enrichment`,
    });
  }

  // Check for missing contacts
  if (!vendor.contacts || vendor.contacts.length === 0) {
    actions.push({
      id: 'add-contacts',
      priority: 'medium',
      title: 'Add Primary Contact',
      description: 'Required for incident reporting',
      href: `/vendors/${vendor.id}?tab=contacts`,
    });
  }

  // Check for missing contracts
  if (!vendor.contracts || vendor.contracts.length === 0) {
    actions.push({
      id: 'add-contract',
      priority: vendor.tier === 'critical' ? 'high' : 'medium',
      title: 'Add Contract',
      description: 'Required for DORA Article 30 compliance',
      href: `/vendors/${vendor.id}?tab=contracts`,
    });
  }

  // Check for high risk score
  if (vendor.risk_score != null && vendor.risk_score >= 70) {
    actions.push({
      id: 'review-risk',
      priority: 'high',
      title: 'Review Risk Assessment',
      description: `Risk score is ${vendor.risk_score}/100`,
      href: `/vendors/${vendor.id}?tab=monitoring`,
    });
  }

  // Check for stale assessment
  if (vendor.last_assessment_date) {
    const daysSince = Math.floor(
      (Date.now() - new Date(vendor.last_assessment_date).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSince > 365) {
      actions.push({
        id: 'schedule-assessment',
        priority: 'medium',
        title: 'Schedule Annual Assessment',
        description: `Last assessed ${Math.floor(daysSince / 30)} months ago`,
        href: `/vendors/${vendor.id}?tab=dora`,
      });
    }
  } else if (vendor.tier === 'critical' || vendor.tier === 'important') {
    actions.push({
      id: 'initial-assessment',
      priority: 'high',
      title: 'Complete Initial Assessment',
      description: 'Never assessed - required for critical vendors',
      href: `/vendors/${vendor.id}?tab=dora`,
    });
  }

  // Check for missing monitoring for critical vendors
  if (vendor.tier === 'critical' && !vendor.monitoring_enabled) {
    actions.push({
      id: 'enable-monitoring',
      priority: 'medium',
      title: 'Enable External Monitoring',
      description: 'Recommended for critical vendors',
      href: `/vendors/${vendor.id}?tab=monitoring`,
    });
  }

  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

// ============================================================================
// Components
// ============================================================================

function DimensionBar({
  dimension,
}: {
  dimension: VendorHealthDimension;
}) {
  const percentage = (dimension.score / dimension.maxScore) * 100;

  const statusColors = {
    good: 'bg-emerald-500',
    warning: 'bg-amber-500',
    critical: 'bg-red-500',
    unknown: 'bg-muted',
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">{dimension.label}</span>
        <span className="text-muted-foreground">
          {dimension.score}/{dimension.maxScore}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-muted/50">
        <div
          className={cn(
            'h-full rounded-full transition-all',
            statusColors[dimension.status]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/**
 * VendorSummaryDashboard - Summary-first view for vendor detail page
 *
 * Features:
 * - Health score gauge with dimensional breakdown
 * - Next actions list with priority coloring
 * - Quick stats with trends
 * - Data freshness indicators
 */
export function VendorSummaryDashboard({
  vendor,
  healthScore: customHealthScore,
  healthDimensions: customDimensions,
  nextActions: customActions,
  onActionClick,
  onDismissAction,
  className,
}: VendorSummaryDashboardProps) {
  // Calculate health score and dimensions if not provided
  const { score, dimensions } = useMemo(() => {
    if (customHealthScore !== undefined && customDimensions) {
      return { score: customHealthScore, dimensions: customDimensions };
    }
    return calculateHealthScore(vendor);
  }, [vendor, customHealthScore, customDimensions]);

  // Generate next actions if not provided
  const actions = useMemo(() => {
    return customActions || generateNextActions(vendor);
  }, [vendor, customActions]);

  // Convert actions to ActionCardProps format
  const actionCardProps: Array<Omit<ActionCardProps, 'size'>> = actions.slice(0, 4).map((action) => ({
    priority: action.priority,
    title: action.title,
    description: action.description,
    dueDate: action.dueDate,
    primaryAction: action.href
      ? { label: 'View', href: action.href }
      : { label: 'Action', onClick: () => onActionClick?.(action) },
    onDismiss: onDismissAction ? () => onDismissAction(action.id) : undefined,
  }));

  return (
    <div className={cn('grid gap-6 lg:grid-cols-3', className)}>
      {/* Health Score Card - Takes 1/3 */}
      <Card className="card-premium">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              Vendor Health
            </span>
            <DataFreshnessBadge
              lastUpdated={vendor.updated_at}
              size="xs"
              warningThresholdDays={30}
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center">
            <HealthScoreGauge
              score={score}
              maxScore={100}
              size="lg"
              breakdown={dimensions.map((d) => ({
                label: d.label,
                value: d.score,
                max: d.maxScore,
              }))}
            />

            {/* Dimension Breakdown */}
            <div className="w-full mt-6 space-y-3">
              {dimensions.map((dim) => (
                <DimensionBar key={dim.id} dimension={dim} />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Actions Card - Takes 2/3 */}
      <Card className="card-premium lg:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              Next Actions
              {actions.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">
                  {actions.length}
                </Badge>
              )}
            </span>
            {actions.length > 4 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" asChild>
                <Link href={`/vendors/${vendor.id}?tab=dora`}>
                  View all
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {actions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="rounded-full bg-emerald-500/10 p-3 mb-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              </div>
              <h4 className="font-medium text-sm">All tasks completed!</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
                This vendor is fully compliant with no pending actions.
              </p>
            </div>
          ) : (
            <ActionList
              actions={actionCardProps}
              maxItems={4}
              cardSize="sm"
              emptyMessage="No pending actions"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * VendorQuickMetrics - Compact metrics row for vendor detail
 */
export interface VendorQuickMetricsProps {
  vendor: VendorWithRelations;
  className?: string;
}

export function VendorQuickMetrics({ vendor, className }: VendorQuickMetricsProps) {
  const metrics = [
    {
      id: 'documents',
      label: 'Documents',
      value: vendor.documents_count || 0,
      icon: FileText,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      id: 'contracts',
      label: 'Contracts',
      value: vendor.contracts_count || 0,
      icon: ScrollText,
      color: 'text-info',
      bgColor: 'bg-info/10',
    },
    {
      id: 'contacts',
      label: 'Contacts',
      value: vendor.contacts?.length || 0,
      icon: Users,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      id: 'risk',
      label: 'Risk Score',
      value: vendor.risk_score !== null ? vendor.risk_score : '—',
      icon: Shield,
      color: vendor.risk_score && vendor.risk_score >= 70 ? 'text-red-500' : 'text-muted-foreground',
      bgColor: vendor.risk_score && vendor.risk_score >= 70 ? 'bg-red-500/10' : 'bg-muted/50',
    },
  ];

  return (
    <div className={cn('grid gap-3 sm:grid-cols-2 lg:grid-cols-4', className)}>
      {metrics.map((metric) => (
        <Card key={metric.id} className="card-elevated">
          <CardContent className="flex items-center gap-3 p-4">
            <div className={cn('rounded-lg p-2', metric.bgColor)}>
              <metric.icon className={cn('h-5 w-5', metric.color)} />
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums">{metric.value}</p>
              <p className="text-xs text-muted-foreground">{metric.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
