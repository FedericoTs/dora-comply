'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertTriangle,
  Clock,
  Calendar,
  Building2,
  TrendingDown,
  AlertCircle,
  Sparkles,
  History,
  FileWarning,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export type SmartFilterId =
  | 'all'
  | 'critical'
  | 'needs_review'
  | 'expiring_soon'
  | 'at_risk'
  | 'action_needed'
  | 'score_dropping'
  | 'new_this_week'
  | 'stale_data';

export interface SmartFilterOption {
  id: SmartFilterId;
  label: string;
  shortLabel?: string;
  count?: number;
  icon: React.ElementType;
  iconColor?: string;
  description?: string;
  priority?: 'high' | 'medium' | 'low';
  isNew?: boolean;
}

export interface SmartFilterStats {
  total: number;
  critical: number;
  needsReview: number;
  expiringSoon: number;
  atRisk: number;
  actionNeeded: number;
  scoreDropping: number;
  newThisWeek: number;
  staleData: number;
}

interface VendorQuickFiltersPlusProps {
  stats: SmartFilterStats;
  activeFilter: SmartFilterId;
  onFilterChange: (filterId: SmartFilterId) => void;
  showAdvanced?: boolean;
  compact?: boolean;
  className?: string;
}

// ============================================================================
// Filter Factory
// ============================================================================

export function createSmartFilters(stats: SmartFilterStats): SmartFilterOption[] {
  return [
    {
      id: 'all',
      label: 'All Vendors',
      shortLabel: 'All',
      count: stats.total,
      icon: Building2,
      iconColor: 'text-muted-foreground',
      description: 'View all vendors in your portfolio',
    },
    {
      id: 'critical',
      label: 'Critical Tier',
      shortLabel: 'Critical',
      count: stats.critical,
      icon: AlertTriangle,
      iconColor: 'text-error',
      description: 'Vendors designated as critical tier',
      priority: 'high',
    },
    {
      id: 'at_risk',
      label: 'At Risk',
      shortLabel: 'At Risk',
      count: stats.atRisk,
      icon: AlertCircle,
      iconColor: 'text-orange-500',
      description: 'Risk score below 60 or downward trend',
      priority: 'high',
    },
    {
      id: 'action_needed',
      label: 'Action Needed',
      shortLabel: 'Actions',
      count: stats.actionNeeded,
      icon: FileWarning,
      iconColor: 'text-amber-500',
      description: 'Missing documents, contacts, or assessments',
      priority: 'medium',
    },
    {
      id: 'score_dropping',
      label: 'Score Dropping',
      shortLabel: 'Dropping',
      count: stats.scoreDropping,
      icon: TrendingDown,
      iconColor: 'text-red-500',
      description: 'Risk score decreased in last 30 days',
      priority: 'high',
    },
    {
      id: 'needs_review',
      label: 'Needs Review',
      shortLabel: 'Review',
      count: stats.needsReview,
      icon: Clock,
      iconColor: 'text-warning',
      description: 'Vendors pending review or approval',
      priority: 'medium',
    },
    {
      id: 'expiring_soon',
      label: 'Expiring Soon',
      shortLabel: 'Expiring',
      count: stats.expiringSoon,
      icon: Calendar,
      iconColor: 'text-info',
      description: 'Contracts expiring within 60 days',
      priority: 'medium',
    },
    {
      id: 'new_this_week',
      label: 'New This Week',
      shortLabel: 'New',
      count: stats.newThisWeek,
      icon: Sparkles,
      iconColor: 'text-emerald-500',
      description: 'Vendors added in the last 7 days',
      isNew: true,
    },
    {
      id: 'stale_data',
      label: 'Stale Data',
      shortLabel: 'Stale',
      count: stats.staleData,
      icon: History,
      iconColor: 'text-gray-500',
      description: 'Not updated in 90+ days',
      priority: 'low',
    },
  ];
}

// ============================================================================
// Component
// ============================================================================

export function VendorQuickFiltersPlus({
  stats,
  activeFilter,
  onFilterChange,
  showAdvanced = true,
  compact = false,
  className,
}: VendorQuickFiltersPlusProps) {
  const allFilters = createSmartFilters(stats);

  // Split into primary and advanced filters
  const primaryFilters = allFilters.filter(f =>
    ['all', 'critical', 'at_risk', 'action_needed'].includes(f.id)
  );
  const advancedFilters = allFilters.filter(f =>
    ['score_dropping', 'needs_review', 'expiring_soon', 'new_this_week', 'stale_data'].includes(f.id)
  );

  const filtersToShow = showAdvanced ? allFilters : primaryFilters;

  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn('flex flex-col gap-2', className)}>
        {/* Primary filters row */}
        <div className="flex items-center gap-2 flex-wrap">
          {filtersToShow.map((filter) => {
            const isActive = activeFilter === filter.id;
            const Icon = filter.icon;
            const showCount = filter.count !== undefined && filter.count > 0;
            const hasHighPriority = filter.priority === 'high' && filter.count && filter.count > 0;

            return (
              <Tooltip key={filter.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant={isActive ? 'default' : 'outline'}
                    size={compact ? 'sm' : 'default'}
                    className={cn(
                      'gap-2 transition-all relative',
                      !isActive && 'hover:bg-muted/50',
                      isActive && 'shadow-sm',
                      hasHighPriority && !isActive && 'border-orange-300 dark:border-orange-700'
                    )}
                    onClick={() => onFilterChange(filter.id)}
                  >
                    <Icon
                      className={cn(
                        compact ? 'h-3.5 w-3.5' : 'h-4 w-4',
                        isActive ? 'text-current' : filter.iconColor
                      )}
                    />
                    <span className={compact ? 'text-xs' : 'text-sm'}>
                      {compact ? filter.shortLabel || filter.label : filter.label}
                    </span>
                    {showCount && (
                      <Badge
                        variant={isActive ? 'secondary' : 'outline'}
                        className={cn(
                          'px-1.5 py-0 text-xs font-medium min-w-[1.25rem] justify-center',
                          isActive
                            ? 'bg-primary-foreground/20 text-primary-foreground border-transparent'
                            : hasHighPriority
                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border-orange-300 dark:border-orange-700'
                            : ''
                        )}
                      >
                        {filter.count}
                      </Badge>
                    )}
                    {/* New indicator */}
                    {filter.isNew && filter.count && filter.count > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="font-medium">{filter.label}</p>
                  {filter.description && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {filter.description}
                    </p>
                  )}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Divider and advanced filters for non-compact mode */}
        {!compact && showAdvanced && advancedFilters.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium">Quick insights:</span>
            {advancedFilters.map((filter) => {
              if (!filter.count || filter.count === 0) return null;
              const Icon = filter.icon;
              return (
                <button
                  key={filter.id}
                  onClick={() => onFilterChange(filter.id)}
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 rounded-full transition-colors',
                    activeFilter === filter.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  )}
                >
                  <Icon className={cn('h-3 w-3', activeFilter !== filter.id && filter.iconColor)} />
                  <span>{filter.count} {filter.shortLabel?.toLowerCase()}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

// ============================================================================
// Stats Helper - Calculates stats from vendor data
// ============================================================================

export function calculateSmartFilterStats(
  vendors: Array<{
    tier?: string;
    status?: string;
    risk_score?: number | null;
    last_assessment_date?: string | null;
    created_at: string;
    updated_at: string;
    documents_count?: number;
    contracts_count?: number;
  }>,
  options: {
    contractsExpiringSoon?: number;
    /** Count of vendors whose score dropped in last 30 days (from vendor_score_history) */
    scoreDropping?: number;
  } = {}
): SmartFilterStats {
  const { contractsExpiringSoon = 0, scoreDropping = 0 } = options;
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  return {
    total: vendors.length,
    critical: vendors.filter(v => v.tier === 'critical').length,
    needsReview: vendors.filter(v => v.status === 'pending').length,
    expiringSoon: contractsExpiringSoon,
    atRisk: vendors.filter(v => (v.risk_score ?? 100) < 60).length,
    actionNeeded: vendors.filter(v =>
      !v.documents_count ||
      !v.last_assessment_date ||
      v.status === 'pending'
    ).length,
    scoreDropping,
    newThisWeek: vendors.filter(v => new Date(v.created_at) > oneWeekAgo).length,
    staleData: vendors.filter(v => new Date(v.updated_at) < ninetyDaysAgo).length,
  };
}
