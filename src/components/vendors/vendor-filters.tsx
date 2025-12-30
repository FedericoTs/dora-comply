'use client';

import { useState } from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { VendorFilters } from '@/lib/vendors/types';
import {
  TIER_INFO,
  STATUS_INFO,
  PROVIDER_TYPE_LABELS,
  type VendorTier,
  type VendorStatus,
  type ProviderType,
} from '@/lib/vendors/types';

interface VendorFiltersProps {
  filters: VendorFilters;
  onChange: (filters: VendorFilters) => void;
}

export function VendorFiltersDropdown({ filters, onChange }: VendorFiltersProps) {
  const [open, setOpen] = useState(false);

  const activeFilterCount = [
    filters.tier?.length || 0,
    filters.status?.length || 0,
    filters.provider_type?.length || 0,
    filters.has_lei !== undefined ? 1 : 0,
    filters.supports_critical_function !== undefined ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const handleTierChange = (tier: VendorTier, checked: boolean) => {
    const current = filters.tier || [];
    const updated = checked
      ? [...current, tier]
      : current.filter((t) => t !== tier);
    onChange({ ...filters, tier: updated.length > 0 ? updated : undefined });
  };

  const handleStatusChange = (status: VendorStatus, checked: boolean) => {
    const current = filters.status || [];
    const updated = checked
      ? [...current, status]
      : current.filter((s) => s !== status);
    onChange({ ...filters, status: updated.length > 0 ? updated : undefined });
  };

  const handleProviderTypeChange = (type: ProviderType, checked: boolean) => {
    const current = filters.provider_type || [];
    const updated = checked
      ? [...current, type]
      : current.filter((t) => t !== type);
    onChange({ ...filters, provider_type: updated.length > 0 ? updated : undefined });
  };

  const handleClearAll = () => {
    onChange({});
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 min-w-5 rounded-full px-1.5">
              {activeFilterCount}
            </Badge>
          )}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72 p-4" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-4">
          {/* Tier Filter */}
          <div>
            <Label className="text-xs font-medium uppercase text-muted-foreground">
              Tier
            </Label>
            <div className="mt-2 space-y-2">
              {(Object.keys(TIER_INFO) as VendorTier[]).map((tier) => (
                <div key={tier} className="flex items-center gap-2">
                  <Checkbox
                    id={`tier-${tier}`}
                    checked={filters.tier?.includes(tier) || false}
                    onCheckedChange={(checked) =>
                      handleTierChange(tier, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={`tier-${tier}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {TIER_INFO[tier].label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Status Filter */}
          <div>
            <Label className="text-xs font-medium uppercase text-muted-foreground">
              Status
            </Label>
            <div className="mt-2 space-y-2">
              {(Object.keys(STATUS_INFO) as VendorStatus[]).map((status) => (
                <div key={status} className="flex items-center gap-2">
                  <Checkbox
                    id={`status-${status}`}
                    checked={filters.status?.includes(status) || false}
                    onCheckedChange={(checked) =>
                      handleStatusChange(status, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={`status-${status}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {STATUS_INFO[status].label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Provider Type Filter */}
          <div>
            <Label className="text-xs font-medium uppercase text-muted-foreground">
              Provider Type
            </Label>
            <div className="mt-2 space-y-2">
              {(Object.keys(PROVIDER_TYPE_LABELS) as ProviderType[]).map((type) => (
                <div key={type} className="flex items-center gap-2">
                  <Checkbox
                    id={`provider-${type}`}
                    checked={filters.provider_type?.includes(type) || false}
                    onCheckedChange={(checked) =>
                      handleProviderTypeChange(type, checked as boolean)
                    }
                  />
                  <Label
                    htmlFor={`provider-${type}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {PROVIDER_TYPE_LABELS[type]}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Boolean Filters */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="has-lei"
                checked={filters.has_lei === true}
                onCheckedChange={(checked) =>
                  onChange({
                    ...filters,
                    has_lei: checked ? true : undefined,
                  })
                }
              />
              <Label htmlFor="has-lei" className="text-sm font-normal cursor-pointer">
                Has LEI
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="critical-function"
                checked={filters.supports_critical_function === true}
                onCheckedChange={(checked) =>
                  onChange({
                    ...filters,
                    supports_critical_function: checked ? true : undefined,
                  })
                }
              />
              <Label
                htmlFor="critical-function"
                className="text-sm font-normal cursor-pointer"
              >
                Supports Critical Function
              </Label>
            </div>
          </div>

          {activeFilterCount > 0 && (
            <>
              <Separator />
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={handleClearAll}
              >
                <X className="mr-2 h-4 w-4" />
                Clear All Filters
              </Button>
            </>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Active Filter Tags
export function VendorFilterTags({
  filters,
  onChange,
}: VendorFiltersProps) {
  const tags: { label: string; onRemove: () => void }[] = [];

  filters.tier?.forEach((tier) => {
    tags.push({
      label: `Tier: ${TIER_INFO[tier].label}`,
      onRemove: () =>
        onChange({
          ...filters,
          tier: filters.tier?.filter((t) => t !== tier),
        }),
    });
  });

  filters.status?.forEach((status) => {
    tags.push({
      label: `Status: ${STATUS_INFO[status].label}`,
      onRemove: () =>
        onChange({
          ...filters,
          status: filters.status?.filter((s) => s !== status),
        }),
    });
  });

  filters.provider_type?.forEach((type) => {
    tags.push({
      label: PROVIDER_TYPE_LABELS[type],
      onRemove: () =>
        onChange({
          ...filters,
          provider_type: filters.provider_type?.filter((t) => t !== type),
        }),
    });
  });

  if (filters.has_lei) {
    tags.push({
      label: 'Has LEI',
      onRemove: () => onChange({ ...filters, has_lei: undefined }),
    });
  }

  if (filters.supports_critical_function) {
    tags.push({
      label: 'Critical Function',
      onRemove: () => onChange({ ...filters, supports_critical_function: undefined }),
    });
  }

  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag, index) => (
        <Badge
          key={index}
          variant="secondary"
          className="gap-1 pr-1"
        >
          {tag.label}
          <button
            onClick={tag.onRemove}
            className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-xs"
        onClick={() => onChange({})}
      >
        Clear all
      </Button>
    </div>
  );
}
