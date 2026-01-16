'use client';

/**
 * Unified Gap Analysis Component
 *
 * Aggregated view of compliance gaps across all frameworks.
 * Highlights controls that would satisfy multiple frameworks when remediated.
 */

import { useState, useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Filter,
  Layers,
  Shield,
  FileText,
  Target,
  ArrowUpRight,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FrameworkCode,
  FRAMEWORK_NAMES,
} from '@/lib/compliance/framework-types';

// =============================================================================
// Types
// =============================================================================

export interface UnifiedGapItem {
  id: string;
  requirementId: string;
  framework: FrameworkCode;
  articleNumber: string;
  title: string;
  description: string;
  category: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'in_progress' | 'remediated';
  remediationGuidance?: string;
  estimatedEffort?: string;
  crossFrameworkImpact: number; // Number of other frameworks this gap affects
  relatedFrameworks: FrameworkCode[];
}

interface UnifiedGapAnalysisProps {
  gaps: UnifiedGapItem[];
  onUpdateStatus?: (gapId: string, status: UnifiedGapItem['status']) => void;
  className?: string;
}

interface GapWithImpactProps {
  gap: UnifiedGapItem;
  expanded: boolean;
  onToggle: () => void;
  onUpdateStatus?: (status: UnifiedGapItem['status']) => void;
}

// =============================================================================
// Constants
// =============================================================================

const FRAMEWORK_ICONS: Record<FrameworkCode, typeof Shield> = {
  dora: Shield,
  nis2: Layers,
  gdpr: FileText,
  iso27001: Target,
};

const FRAMEWORK_COLORS: Record<FrameworkCode, string> = {
  dora: 'bg-blue-500',
  nis2: 'bg-purple-500',
  gdpr: 'bg-green-500',
  iso27001: 'bg-orange-500',
};

const PRIORITY_COLORS = {
  critical: 'bg-red-500 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-amber-500 text-white',
  low: 'bg-blue-500 text-white',
};

const STATUS_COLORS = {
  open: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  in_progress: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  remediated: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
};

const STATUS_LABELS = {
  open: 'Open',
  in_progress: 'In Progress',
  remediated: 'Remediated',
};

// =============================================================================
// Gap Card with Cross-Framework Impact
// =============================================================================

function GapWithImpactCard({
  gap,
  expanded,
  onToggle,
  onUpdateStatus,
}: GapWithImpactProps) {
  const FrameworkIcon = FRAMEWORK_ICONS[gap.framework];
  const hasHighImpact = gap.crossFrameworkImpact >= 2;

  return (
    <Card
      className={cn(
        'transition-all',
        gap.priority === 'critical' && 'border-red-200 dark:border-red-900',
        hasHighImpact && 'ring-2 ring-primary/20'
      )}
    >
      <CardContent className="pt-4">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={cn('p-2 rounded-lg shrink-0', FRAMEWORK_COLORS[gap.framework])}>
              <FrameworkIcon className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <Badge variant="outline" className="text-xs font-mono">
                  {gap.articleNumber}
                </Badge>
                <Badge className={cn('text-xs', PRIORITY_COLORS[gap.priority])}>
                  {gap.priority}
                </Badge>
                <Badge className={cn('text-xs', STATUS_COLORS[gap.status])}>
                  {STATUS_LABELS[gap.status]}
                </Badge>
                {hasHighImpact && (
                  <Badge
                    variant="outline"
                    className="text-xs bg-primary/10 border-primary/30"
                  >
                    <Zap className="h-3 w-3 mr-1" />
                    High Impact
                  </Badge>
                )}
              </div>
              <h3 className="font-medium">{gap.title}</h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {gap.description}
              </p>
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={onToggle}>
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Cross-Framework Impact Summary */}
        {gap.relatedFrameworks.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center gap-2 text-sm">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Also affects:</span>
              <div className="flex gap-1">
                {gap.relatedFrameworks.map((fw) => {
                  const FwIcon = FRAMEWORK_ICONS[fw];
                  return (
                    <Badge
                      key={fw}
                      variant="outline"
                      className="text-xs flex items-center gap-1"
                    >
                      <div className={cn('p-0.5 rounded', FRAMEWORK_COLORS[fw])}>
                        <FwIcon className="h-2.5 w-2.5 text-white" />
                      </div>
                      {FRAMEWORK_NAMES[fw]}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Expanded Details */}
        {expanded && (
          <div className="mt-4 pt-4 border-t space-y-4">
            {/* Remediation Guidance */}
            {gap.remediationGuidance && (
              <div>
                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4" />
                  Remediation Guidance
                </h4>
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  {gap.remediationGuidance}
                </p>
              </div>
            )}

            {/* Meta and Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {gap.estimatedEffort && (
                  <span>Est. effort: {gap.estimatedEffort}</span>
                )}
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-4 w-4" />
                  Impacts {gap.crossFrameworkImpact + 1} framework
                  {gap.crossFrameworkImpact > 0 ? 's' : ''}
                </span>
              </div>

              {onUpdateStatus && gap.status !== 'remediated' && (
                <div className="flex items-center gap-2">
                  {gap.status === 'open' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onUpdateStatus('in_progress')}
                    >
                      Start Working
                    </Button>
                  )}
                  {gap.status === 'in_progress' && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => onUpdateStatus('remediated')}
                    >
                      Mark Remediated
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Main Unified Gap Analysis Component
// =============================================================================

export function UnifiedGapAnalysis({
  gaps,
  onUpdateStatus,
  className,
}: UnifiedGapAnalysisProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [frameworkFilter, setFrameworkFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'priority' | 'impact'>('impact');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filter and sort gaps
  const filteredGaps = useMemo(() => {
    const result = gaps.filter((gap) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          gap.title.toLowerCase().includes(query) ||
          gap.description.toLowerCase().includes(query) ||
          gap.articleNumber.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Priority filter
      if (priorityFilter !== 'all' && gap.priority !== priorityFilter) {
        return false;
      }

      // Framework filter
      if (frameworkFilter !== 'all' && gap.framework !== frameworkFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && gap.status !== statusFilter) {
        return false;
      }

      return true;
    });

    // Sort
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    if (sortBy === 'impact') {
      result.sort((a, b) => {
        // First by cross-framework impact (descending)
        if (b.crossFrameworkImpact !== a.crossFrameworkImpact) {
          return b.crossFrameworkImpact - a.crossFrameworkImpact;
        }
        // Then by priority
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
    } else {
      result.sort((a, b) => {
        // First by priority
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        // Then by impact
        return b.crossFrameworkImpact - a.crossFrameworkImpact;
      });
    }

    return result;
  }, [gaps, searchQuery, priorityFilter, frameworkFilter, statusFilter, sortBy]);

  // Summary statistics
  const stats = useMemo(() => {
    const openGaps = gaps.filter((g) => g.status === 'open');
    const highImpactGaps = gaps.filter((g) => g.crossFrameworkImpact >= 2);
    const criticalGaps = gaps.filter((g) => g.priority === 'critical' && g.status !== 'remediated');

    return {
      total: gaps.length,
      open: openGaps.length,
      highImpact: highImpactGaps.length,
      critical: criticalGaps.length,
      byFramework: {
        dora: gaps.filter((g) => g.framework === 'dora').length,
        nis2: gaps.filter((g) => g.framework === 'nis2').length,
        gdpr: gaps.filter((g) => g.framework === 'gdpr').length,
        iso27001: gaps.filter((g) => g.framework === 'iso27001').length,
      },
    };
  }, [gaps]);

  const hasActiveFilters =
    searchQuery ||
    priorityFilter !== 'all' ||
    frameworkFilter !== 'all' ||
    statusFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setPriorityFilter('all');
    setFrameworkFilter('all');
    setStatusFilter('all');
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Gaps</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-muted-foreground/20" />
            </div>
          </CardContent>
        </Card>

        <Card className={stats.critical > 0 ? 'border-red-200' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
              </div>
              <Shield className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>

        <Card className={stats.highImpact > 0 ? 'border-primary/50' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High Impact</p>
                <p className="text-2xl font-bold text-primary">{stats.highImpact}</p>
              </div>
              <Zap className="h-8 w-8 text-primary/20" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Affects 2+ frameworks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open</p>
                <p className="text-2xl font-bold">{stats.open}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-muted-foreground/20" />
            </div>
            <Progress
              value={((stats.total - stats.open) / stats.total) * 100}
              className="h-1.5 mt-2"
            />
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search gaps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={frameworkFilter} onValueChange={setFrameworkFilter}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Framework" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Frameworks</SelectItem>
                <SelectItem value="dora">DORA</SelectItem>
                <SelectItem value="nis2">NIS2</SelectItem>
                <SelectItem value="gdpr">GDPR</SelectItem>
                <SelectItem value="iso27001">ISO 27001</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-[140px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="remediated">Remediated</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as 'priority' | 'impact')}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="impact">Cross-Impact</SelectItem>
                <SelectItem value="priority">Priority</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Gap List */}
      <div className="space-y-4">
        {filteredGaps.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {hasActiveFilters ? 'No Gaps Match Filters' : 'No Gaps Identified'}
              </h3>
              <p className="text-muted-foreground">
                {hasActiveFilters
                  ? 'Try adjusting your filters to see more results.'
                  : 'Complete your compliance assessments to identify gaps.'}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" className="mt-4" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="text-sm text-muted-foreground">
              Showing {filteredGaps.length} of {gaps.length} gaps
              {sortBy === 'impact' && ' (sorted by cross-framework impact)'}
            </div>
            {filteredGaps.map((gap) => (
              <GapWithImpactCard
                key={gap.id}
                gap={gap}
                expanded={expandedId === gap.id}
                onToggle={() =>
                  setExpandedId(expandedId === gap.id ? null : gap.id)
                }
                onUpdateStatus={
                  onUpdateStatus
                    ? (status) => onUpdateStatus(gap.id, status)
                    : undefined
                }
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Empty State
// =============================================================================

export function UnifiedGapEmptyState() {
  return (
    <Card className="text-center py-12">
      <CardContent>
        <CheckCircle2 className="h-16 w-16 mx-auto text-emerald-500 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">No Compliance Gaps</h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Complete your framework assessments to identify and track compliance gaps
          across DORA, NIS2, GDPR, and ISO 27001.
        </p>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// High Impact Gaps Summary (for dashboards)
// =============================================================================

interface HighImpactGapsSummaryProps {
  gaps: UnifiedGapItem[];
  maxItems?: number;
  className?: string;
}

export function HighImpactGapsSummary({
  gaps,
  maxItems = 5,
  className,
}: HighImpactGapsSummaryProps) {
  // Get high-impact gaps sorted by impact then priority
  const highImpactGaps = useMemo(() => {
    return gaps
      .filter((g) => g.crossFrameworkImpact >= 1 && g.status !== 'remediated')
      .sort((a, b) => {
        if (b.crossFrameworkImpact !== a.crossFrameworkImpact) {
          return b.crossFrameworkImpact - a.crossFrameworkImpact;
        }
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
      .slice(0, maxItems);
  }, [gaps, maxItems]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          High-Impact Gaps
        </CardTitle>
        <CardDescription>
          Remediate these to improve multiple frameworks at once
        </CardDescription>
      </CardHeader>
      <CardContent>
        {highImpactGaps.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No high-impact gaps identified
          </p>
        ) : (
          <div className="space-y-3">
            {highImpactGaps.map((gap) => {
              const FrameworkIcon = FRAMEWORK_ICONS[gap.framework];
              return (
                <div
                  key={gap.id}
                  className="flex items-center gap-3 p-2 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className={cn('p-1.5 rounded', FRAMEWORK_COLORS[gap.framework])}>
                    <FrameworkIcon className="h-3 w-3 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{gap.title}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{gap.articleNumber}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Layers className="h-3 w-3" />
                        {gap.crossFrameworkImpact + 1} frameworks
                      </span>
                    </div>
                  </div>
                  <Badge className={cn('text-xs shrink-0', PRIORITY_COLORS[gap.priority])}>
                    {gap.priority}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
