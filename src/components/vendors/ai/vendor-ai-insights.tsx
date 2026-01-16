'use client';

import { useState } from 'react';
import {
  Sparkles,
  AlertTriangle,
  TrendingDown,
  FileWarning,
  Users,
  Clock,
  ChevronRight,
  Loader2,
  RefreshCw,
  X,
  Lightbulb,
  Shield,
  Building2,
} from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export type InsightType =
  | 'concentration_risk'
  | 'compliance_gap'
  | 'score_deterioration'
  | 'contract_risk'
  | 'data_staleness'
  | 'recommendation';

export type InsightPriority = 'critical' | 'high' | 'medium' | 'low';

export interface AIInsight {
  id: string;
  type: InsightType;
  priority: InsightPriority;
  title: string;
  summary: string;
  details?: string;
  affectedVendorIds: string[];
  affectedVendorNames?: string[];
  suggestedAction: string;
  actionHref?: string;
  createdAt: string;
  isDismissed?: boolean;
}

export interface VendorAIInsightsProps {
  insights: AIInsight[];
  isLoading?: boolean;
  isGenerating?: boolean;
  onRefresh?: () => void;
  onDismiss?: (insightId: string) => void;
  onActionClick?: (insight: AIInsight) => void;
  maxItems?: number;
  showHeader?: boolean;
  className?: string;
}

// ============================================================================
// Configuration
// ============================================================================

const INSIGHT_CONFIG: Record<InsightType, {
  icon: typeof AlertTriangle;
  label: string;
  colorClass: string;
  bgClass: string;
}> = {
  concentration_risk: {
    icon: Building2,
    label: 'Concentration Risk',
    colorClass: 'text-red-500',
    bgClass: 'bg-red-500/10',
  },
  compliance_gap: {
    icon: FileWarning,
    label: 'Compliance Gap',
    colorClass: 'text-amber-500',
    bgClass: 'bg-amber-500/10',
  },
  score_deterioration: {
    icon: TrendingDown,
    label: 'Score Drop',
    colorClass: 'text-orange-500',
    bgClass: 'bg-orange-500/10',
  },
  contract_risk: {
    icon: Clock,
    label: 'Contract Risk',
    colorClass: 'text-purple-500',
    bgClass: 'bg-purple-500/10',
  },
  data_staleness: {
    icon: Clock,
    label: 'Stale Data',
    colorClass: 'text-blue-500',
    bgClass: 'bg-blue-500/10',
  },
  recommendation: {
    icon: Lightbulb,
    label: 'Recommendation',
    colorClass: 'text-emerald-500',
    bgClass: 'bg-emerald-500/10',
  },
};

const PRIORITY_CONFIG: Record<InsightPriority, {
  label: string;
  dotColor: string;
  badgeVariant: 'destructive' | 'default' | 'secondary' | 'outline';
}> = {
  critical: {
    label: 'Critical',
    dotColor: 'bg-red-500',
    badgeVariant: 'destructive',
  },
  high: {
    label: 'High',
    dotColor: 'bg-orange-500',
    badgeVariant: 'default',
  },
  medium: {
    label: 'Medium',
    dotColor: 'bg-amber-500',
    badgeVariant: 'secondary',
  },
  low: {
    label: 'Low',
    dotColor: 'bg-blue-500',
    badgeVariant: 'outline',
  },
};

// ============================================================================
// Components
// ============================================================================

function InsightCard({
  insight,
  onDismiss,
  onActionClick,
}: {
  insight: AIInsight;
  onDismiss?: (id: string) => void;
  onActionClick?: (insight: AIInsight) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const config = INSIGHT_CONFIG[insight.type];
  const priorityConfig = PRIORITY_CONFIG[insight.priority];
  const Icon = config.icon;

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div
        className={cn(
          'group relative rounded-lg border transition-all',
          'hover:border-primary/30 hover:shadow-sm',
          insight.priority === 'critical' && 'border-red-500/30 bg-red-500/5',
          insight.priority === 'high' && 'border-orange-500/30 bg-orange-500/5',
          insight.priority === 'medium' && 'border-amber-500/30 bg-amber-500/5',
          insight.priority === 'low' && 'border-border bg-background'
        )}
      >
        {/* Priority indicator bar */}
        <div
          className={cn(
            'absolute left-0 top-0 bottom-0 w-1 rounded-l-lg',
            priorityConfig.dotColor
          )}
        />

        <div className="p-3 pl-4">
          {/* Header */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0">
              <div className={cn('rounded-md p-1.5 mt-0.5', config.bgClass)}>
                <Icon className={cn('h-4 w-4', config.colorClass)} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-medium text-sm leading-snug">
                    {insight.title}
                  </h4>
                  <Badge
                    variant={priorityConfig.badgeVariant}
                    className="text-[10px] px-1.5 py-0"
                  >
                    {priorityConfig.label}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {insight.summary}
                </p>
              </div>
            </div>

            {onDismiss && (
              <button
                type="button"
                onClick={() => onDismiss(insight.id)}
                className="shrink-0 p-1 -m-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                aria-label="Dismiss"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Affected vendors preview */}
          {insight.affectedVendorNames && insight.affectedVendorNames.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>
                {insight.affectedVendorNames.length <= 3
                  ? insight.affectedVendorNames.join(', ')
                  : `${insight.affectedVendorNames.slice(0, 2).join(', ')} +${insight.affectedVendorNames.length - 2} more`}
              </span>
            </div>
          )}

          {/* Expand/Actions */}
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1">
                {isExpanded ? 'Show less' : 'Show details'}
                <ChevronRight
                  className={cn(
                    'h-3 w-3 transition-transform',
                    isExpanded && 'rotate-90'
                  )}
                />
              </Button>
            </CollapsibleTrigger>

            {insight.actionHref ? (
              <Button size="sm" className="h-7 text-xs" asChild>
                <Link href={insight.actionHref}>
                  {insight.suggestedAction}
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            ) : (
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={() => onActionClick?.(insight)}
              >
                {insight.suggestedAction}
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            )}
          </div>
        </div>

        {/* Expanded details */}
        <CollapsibleContent>
          <div className="px-4 pb-3 pt-1 border-t border-border/50">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {insight.details || insight.summary}
            </p>
            {insight.affectedVendorIds.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {insight.affectedVendorNames?.slice(0, 5).map((name, idx) => (
                  <Badge key={insight.affectedVendorIds[idx]} variant="outline" className="text-[10px]">
                    {name}
                  </Badge>
                ))}
                {insight.affectedVendorNames && insight.affectedVendorNames.length > 5 && (
                  <Badge variant="outline" className="text-[10px]">
                    +{insight.affectedVendorNames.length - 5} more
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

/**
 * VendorAIInsights - AI-powered recommendations panel for vendor management
 *
 * Displays portfolio-level insights including:
 * - Concentration risk warnings
 * - Compliance gaps
 * - Score deterioration alerts
 * - Contract expiration risks
 * - Data staleness warnings
 */
export function VendorAIInsights({
  insights,
  isLoading = false,
  isGenerating = false,
  onRefresh,
  onDismiss,
  onActionClick,
  maxItems = 5,
  showHeader = true,
  className,
}: VendorAIInsightsProps) {
  // Filter out dismissed insights and sort by priority
  const activeInsights = insights
    .filter((i) => !i.isDismissed)
    .sort((a, b) => {
      const priorityOrder: InsightPriority[] = ['critical', 'high', 'medium', 'low'];
      return priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority);
    })
    .slice(0, maxItems);

  const hiddenCount = insights.filter((i) => !i.isDismissed).length - maxItems;

  if (isLoading) {
    return (
      <Card className={cn('card-premium', className)}>
        {showHeader && (
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Insights
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('card-premium', className)}>
      {showHeader && (
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Insights
            {activeInsights.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeInsights.length}
              </Badge>
            )}
          </CardTitle>
          {onRefresh && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5"
              onClick={onRefresh}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <RefreshCw className="h-3.5 w-3.5" />
                  Refresh
                </>
              )}
            </Button>
          )}
        </CardHeader>
      )}
      <CardContent>
        {activeInsights.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-emerald-500/10 p-3 mb-3">
              <Shield className="h-6 w-6 text-emerald-500" />
            </div>
            <h4 className="font-medium text-sm">Looking good!</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">
              No critical insights or recommendations at this time.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeInsights.map((insight) => (
              <InsightCard
                key={insight.id}
                insight={insight}
                onDismiss={onDismiss}
                onActionClick={onActionClick}
              />
            ))}

            {hiddenCount > 0 && (
              <Button variant="ghost" size="sm" className="w-full text-xs">
                View {hiddenCount} more insight{hiddenCount > 1 ? 's' : ''}
                <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * VendorAIInsightsBanner - Compact banner version for page headers
 */
export interface VendorAIInsightsBannerProps {
  criticalCount: number;
  highCount: number;
  onViewAll?: () => void;
  className?: string;
}

export function VendorAIInsightsBanner({
  criticalCount,
  highCount,
  onViewAll,
  className,
}: VendorAIInsightsBannerProps) {
  const totalAlerts = criticalCount + highCount;

  if (totalAlerts === 0) return null;

  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-lg px-4 py-2.5 border',
        criticalCount > 0
          ? 'bg-red-500/10 border-red-500/30'
          : 'bg-amber-500/10 border-amber-500/30',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'rounded-full p-1.5',
            criticalCount > 0 ? 'bg-red-500/20' : 'bg-amber-500/20'
          )}
        >
          <Sparkles
            className={cn(
              'h-4 w-4',
              criticalCount > 0 ? 'text-red-500' : 'text-amber-500'
            )}
          />
        </div>
        <div className="text-sm">
          <span className="font-medium">AI Analysis:</span>{' '}
          <span className="text-muted-foreground">
            {criticalCount > 0 && (
              <>
                <span className="font-medium text-red-600 dark:text-red-400">
                  {criticalCount} critical
                </span>
                {highCount > 0 && ' and '}
              </>
            )}
            {highCount > 0 && (
              <span className="font-medium text-amber-600 dark:text-amber-400">
                {highCount} high priority
              </span>
            )}{' '}
            insight{totalAlerts > 1 ? 's' : ''} detected
          </span>
        </div>
      </div>
      {onViewAll && (
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={onViewAll}>
          View all
          <ChevronRight className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// Mock Data Generator (for development)
// ============================================================================

export function generateMockInsights(): AIInsight[] {
  return [
    {
      id: '1',
      type: 'concentration_risk',
      priority: 'critical',
      title: '3 critical vendors share AWS infrastructure',
      summary: 'High concentration risk detected. Multiple critical vendors depend on the same cloud provider.',
      details: 'Vendors Acme Cloud, Beta SaaS, and DataFlow Inc all use AWS eu-west-1 as their primary infrastructure. An AWS outage could simultaneously impact all three critical services.',
      affectedVendorIds: ['v1', 'v2', 'v3'],
      affectedVendorNames: ['Acme Cloud', 'Beta SaaS', 'DataFlow Inc'],
      suggestedAction: 'Review exit plans',
      actionHref: '/vendors?filter=concentration',
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      type: 'compliance_gap',
      priority: 'high',
      title: '12 vendors missing SOC 2 reports',
      summary: 'SOC 2 Type II reports are expiring or missing for multiple vendors.',
      details: 'DORA requires up-to-date compliance documentation. 12 vendors have SOC 2 reports that are either expired or were never uploaded.',
      affectedVendorIds: Array.from({ length: 12 }, (_, i) => `v${i + 10}`),
      affectedVendorNames: ['Vendor A', 'Vendor B', 'Vendor C', 'Vendor D', 'Vendor E', 'Vendor F'],
      suggestedAction: 'Request reports',
      actionHref: '/vendors?filter=missing_soc2',
      createdAt: new Date().toISOString(),
    },
    {
      id: '3',
      type: 'score_deterioration',
      priority: 'high',
      title: 'Vendor X security score dropped 15 points',
      summary: 'SecurityScorecard rating decreased from B to C in the last 30 days.',
      details: 'The score drop is primarily due to newly detected vulnerabilities in their public-facing infrastructure and outdated SSL certificates.',
      affectedVendorIds: ['v20'],
      affectedVendorNames: ['Vendor X'],
      suggestedAction: 'Investigate',
      actionHref: '/vendors/v20/monitoring',
      createdAt: new Date().toISOString(),
    },
    {
      id: '4',
      type: 'contract_risk',
      priority: 'medium',
      title: '5 contracts expire within 60 days',
      summary: 'Upcoming contract expirations require attention for renewal or exit planning.',
      details: 'These contracts include 2 critical tier vendors. Review exit clauses and renewal terms.',
      affectedVendorIds: ['v30', 'v31', 'v32', 'v33', 'v34'],
      affectedVendorNames: ['Contract Co', 'Service Ltd', 'Tech Partner', 'Cloud Nine', 'Data Systems'],
      suggestedAction: 'Review contracts',
      actionHref: '/vendors?filter=expiring_contracts',
      createdAt: new Date().toISOString(),
    },
    {
      id: '5',
      type: 'data_staleness',
      priority: 'low',
      title: '8 vendors not assessed in 12+ months',
      summary: 'Regular assessments ensure ongoing compliance. These vendors are overdue.',
      affectedVendorIds: Array.from({ length: 8 }, (_, i) => `v${i + 40}`),
      affectedVendorNames: ['Old Vendor 1', 'Old Vendor 2', 'Old Vendor 3'],
      suggestedAction: 'Schedule review',
      actionHref: '/vendors?filter=stale',
      createdAt: new Date().toISOString(),
    },
  ];
}
