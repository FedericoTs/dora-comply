'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, Calendar, Building2 } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export type QuickFilterId = 'all' | 'critical' | 'needs_review' | 'expiring_soon';

export interface QuickFilterOption {
  id: QuickFilterId;
  label: string;
  count?: number;
  icon?: React.ElementType;
  iconColor?: string;
}

interface QuickFiltersProps {
  filters: QuickFilterOption[];
  activeFilter: QuickFilterId;
  onFilterChange: (filterId: QuickFilterId) => void;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function QuickFilters({
  filters,
  activeFilter,
  onFilterChange,
  className,
}: QuickFiltersProps) {
  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      {filters.map((filter) => {
        const isActive = activeFilter === filter.id;
        const Icon = filter.icon;
        const showCount = filter.count !== undefined && filter.count > 0;

        return (
          <Button
            key={filter.id}
            variant={isActive ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'gap-2 transition-all',
              !isActive && 'hover:bg-muted/50',
              isActive && 'shadow-sm'
            )}
            onClick={() => onFilterChange(filter.id)}
          >
            {Icon && (
              <Icon
                className={cn(
                  'h-4 w-4',
                  isActive ? 'text-current' : filter.iconColor
                )}
              />
            )}
            <span>{filter.label}</span>
            {showCount && (
              <span
                className={cn(
                  'inline-flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium',
                  isActive
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {filter.count}
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );
}

// ============================================================================
// Default Vendor Filters Factory
// ============================================================================

export function createVendorQuickFilters(stats: {
  total: number;
  critical: number;
  needsReview: number;
  expiringSoon: number;
}): QuickFilterOption[] {
  return [
    {
      id: 'all',
      label: 'All',
      count: stats.total,
      icon: Building2,
      iconColor: 'text-muted-foreground',
    },
    {
      id: 'critical',
      label: 'Critical',
      count: stats.critical,
      icon: AlertTriangle,
      iconColor: 'text-error',
    },
    {
      id: 'needs_review',
      label: 'Needs Review',
      count: stats.needsReview,
      icon: Clock,
      iconColor: 'text-warning',
    },
    {
      id: 'expiring_soon',
      label: 'Expiring Soon',
      count: stats.expiringSoon,
      icon: Calendar,
      iconColor: 'text-info',
    },
  ];
}
