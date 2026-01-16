'use client';

/**
 * NIS2 Gap List Component
 *
 * Displays a filterable list of NIS2 compliance gaps with
 * detailed information and remediation guidance.
 */

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertTriangle,
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  Clock,
  Filter,
  Search,
  Shield,
  X,
} from 'lucide-react';
import type { NIS2GapItem, NIS2Category } from '@/lib/compliance/nis2-types';
import { NIS2CategoryLabels, NIS2CategoryColors } from '@/lib/compliance/nis2-types';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

interface NIS2GapListProps {
  gaps: NIS2GapItem[];
  onUpdateStatus?: (requirementId: string, status: NIS2GapItem['status']) => void;
}

type PriorityFilter = 'all' | 'critical' | 'high' | 'medium' | 'low';
type StatusFilter = 'all' | 'open' | 'in_progress' | 'resolved';
type CategoryFilter = 'all' | NIS2Category;

// =============================================================================
// Constants
// =============================================================================

const PRIORITY_COLORS = {
  critical: 'bg-red-500 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-amber-500 text-white',
  low: 'bg-blue-500 text-white',
} as const;

const STATUS_COLORS = {
  open: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  in_progress: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  resolved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
} as const;

const STATUS_LABELS = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
} as const;

// =============================================================================
// Gap Card Component
// =============================================================================

interface GapCardProps {
  gap: NIS2GapItem;
  expanded: boolean;
  onToggle: () => void;
  onUpdateStatus?: (status: NIS2GapItem['status']) => void;
}

function GapCard({ gap, expanded, onToggle, onUpdateStatus }: GapCardProps) {
  return (
    <Card className={cn(
      'transition-all',
      gap.priority === 'critical' && 'border-red-200 dark:border-red-900',
      expanded && 'ring-2 ring-primary/20'
    )}>
      <CardContent className="pt-4">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {gap.priority === 'critical' && (
              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            )}
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
              </div>
              <h3 className="font-medium">{gap.title}</h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {gap.gapDescription}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                'text-xs whitespace-nowrap',
                NIS2CategoryColors[gap.category].replace('bg-', 'border-').replace('-500', '-300')
              )}
            >
              {NIS2CategoryLabels[gap.category]}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Expanded Details */}
        {expanded && (
          <div className="mt-4 pt-4 border-t space-y-4">
            {/* Remediation Guidance */}
            <div>
              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                <ArrowUpRight className="h-4 w-4" />
                Remediation Guidance
              </h4>
              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                {gap.remediationGuidance}
              </p>
            </div>

            {/* Meta Information */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Est. effort: {gap.estimatedEffort}
                </span>
                {gap.dueDate && (
                  <span>Due: {new Date(gap.dueDate).toLocaleDateString()}</span>
                )}
              </div>

              {/* Status Update Actions */}
              {onUpdateStatus && gap.status !== 'resolved' && (
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
                      onClick={() => onUpdateStatus('resolved')}
                    >
                      Mark Resolved
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
// Main Component
// =============================================================================

export function NIS2GapList({ gaps, onUpdateStatus }: NIS2GapListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filter gaps
  const filteredGaps = useMemo(() => {
    return gaps.filter(gap => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          gap.title.toLowerCase().includes(query) ||
          gap.gapDescription.toLowerCase().includes(query) ||
          gap.articleNumber.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }

      // Priority filter
      if (priorityFilter !== 'all' && gap.priority !== priorityFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && gap.status !== statusFilter) {
        return false;
      }

      // Category filter
      if (categoryFilter !== 'all' && gap.category !== categoryFilter) {
        return false;
      }

      return true;
    });
  }, [gaps, searchQuery, priorityFilter, statusFilter, categoryFilter]);

  // Count by priority
  const priorityCounts = useMemo(() => ({
    critical: gaps.filter(g => g.priority === 'critical').length,
    high: gaps.filter(g => g.priority === 'high').length,
    medium: gaps.filter(g => g.priority === 'medium').length,
    low: gaps.filter(g => g.priority === 'low').length,
  }), [gaps]);

  // Check if any filters are active
  const hasActiveFilters = searchQuery || priorityFilter !== 'all' ||
    statusFilter !== 'all' || categoryFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setPriorityFilter('all');
    setStatusFilter('all');
    setCategoryFilter('all');
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card
          className={cn(
            'cursor-pointer transition-all',
            priorityFilter === 'critical' && 'ring-2 ring-red-500'
          )}
          onClick={() => setPriorityFilter(priorityFilter === 'critical' ? 'all' : 'critical')}
        >
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold text-red-600">{priorityCounts.critical}</p>
              </div>
              <Shield className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'cursor-pointer transition-all',
            priorityFilter === 'high' && 'ring-2 ring-orange-500'
          )}
          onClick={() => setPriorityFilter(priorityFilter === 'high' ? 'all' : 'high')}
        >
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High</p>
                <p className="text-2xl font-bold text-orange-600">{priorityCounts.high}</p>
              </div>
              <Shield className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'cursor-pointer transition-all',
            priorityFilter === 'medium' && 'ring-2 ring-amber-500'
          )}
          onClick={() => setPriorityFilter(priorityFilter === 'medium' ? 'all' : 'medium')}
        >
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Medium</p>
                <p className="text-2xl font-bold text-amber-600">{priorityCounts.medium}</p>
              </div>
              <Shield className="h-8 w-8 text-amber-200" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'cursor-pointer transition-all',
            priorityFilter === 'low' && 'ring-2 ring-blue-500'
          )}
          onClick={() => setPriorityFilter(priorityFilter === 'low' ? 'all' : 'low')}
        >
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low</p>
                <p className="text-2xl font-bold text-blue-600">{priorityCounts.low}</p>
              </div>
              <Shield className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search gaps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as StatusFilter)}
            >
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={categoryFilter}
              onValueChange={(value) => setCategoryFilter(value as CategoryFilter)}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="governance">Governance</SelectItem>
                <SelectItem value="risk_management">Risk Management</SelectItem>
                <SelectItem value="incident_handling">Incident Handling</SelectItem>
                <SelectItem value="business_continuity">Business Continuity</SelectItem>
                <SelectItem value="supply_chain">Supply Chain</SelectItem>
                <SelectItem value="reporting">Reporting</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
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
              <Filter className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No gaps found</h3>
              <p className="text-muted-foreground">
                {hasActiveFilters
                  ? 'Try adjusting your filters to see more results.'
                  : 'No compliance gaps have been identified yet.'}
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
            </div>
            {filteredGaps.map((gap) => (
              <GapCard
                key={gap.requirementId}
                gap={gap}
                expanded={expandedId === gap.requirementId}
                onToggle={() => setExpandedId(
                  expandedId === gap.requirementId ? null : gap.requirementId
                )}
                onUpdateStatus={onUpdateStatus
                  ? (status) => onUpdateStatus(gap.requirementId, status)
                  : undefined}
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

export function NIS2GapEmptyState() {
  return (
    <Card className="text-center py-12">
      <CardContent>
        <Shield className="h-16 w-16 mx-auto text-emerald-500 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">No Gaps Identified</h2>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Complete your NIS2 compliance assessment to identify any gaps
          that need to be addressed.
        </p>
      </CardContent>
    </Card>
  );
}
