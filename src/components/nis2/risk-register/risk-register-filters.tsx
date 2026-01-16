'use client';

import { Search, X, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { NIS2_CATEGORIES } from '@/lib/compliance/nis2-types';
import type { NIS2Category } from '@/lib/compliance/nis2-types';
import type { RiskLevel, RiskStatus, TreatmentStrategy } from '@/lib/nis2/types';

export interface RiskFilters {
  search?: string;
  category?: NIS2Category;
  status?: RiskStatus;
  risk_level?: RiskLevel;
  treatment_strategy?: TreatmentStrategy;
}

interface RiskRegisterFiltersProps {
  filters: RiskFilters;
  onFiltersChange: (filters: RiskFilters) => void;
  totalCount?: number;
  filteredCount?: number;
}

const RISK_LEVELS: { value: RiskLevel; label: string }[] = [
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const RISK_STATUSES: { value: RiskStatus; label: string }[] = [
  { value: 'identified', label: 'Identified' },
  { value: 'assessed', label: 'Assessed' },
  { value: 'treating', label: 'Treating' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'closed', label: 'Closed' },
];

const TREATMENT_STRATEGIES: { value: TreatmentStrategy; label: string }[] = [
  { value: 'mitigate', label: 'Mitigate' },
  { value: 'accept', label: 'Accept' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'avoid', label: 'Avoid' },
];

export function RiskRegisterFilters({
  filters,
  onFiltersChange,
  totalCount,
  filteredCount,
}: RiskRegisterFiltersProps) {
  const activeFilterCount = Object.values(filters).filter(Boolean).length - (filters.search ? 1 : 0);

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value || undefined });
  };

  const handleCategoryChange = (value: string) => {
    onFiltersChange({
      ...filters,
      category: value === 'all' ? undefined : (value as NIS2Category),
    });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      status: value === 'all' ? undefined : (value as RiskStatus),
    });
  };

  const handleRiskLevelChange = (value: string) => {
    onFiltersChange({
      ...filters,
      risk_level: value === 'all' ? undefined : (value as RiskLevel),
    });
  };

  const handleTreatmentChange = (value: string) => {
    onFiltersChange({
      ...filters,
      treatment_strategy: value === 'all' ? undefined : (value as TreatmentStrategy),
    });
  };

  const clearFilters = () => {
    onFiltersChange({ search: filters.search });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search risks..."
            value={filters.search ?? ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
          {filters.search && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={() => handleSearchChange('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Filter button with popover for mobile */}
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 sm:hidden">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Filters</span>
                  {activeFilterCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                      Clear all
                    </Button>
                  )}
                </div>
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm text-muted-foreground">Category</label>
                    <Select value={filters.category ?? 'all'} onValueChange={handleCategoryChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All categories</SelectItem>
                        {NIS2_CATEGORIES.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm text-muted-foreground">Risk Level</label>
                    <Select value={filters.risk_level ?? 'all'} onValueChange={handleRiskLevelChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="All levels" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All levels</SelectItem>
                        {RISK_LEVELS.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm text-muted-foreground">Status</label>
                    <Select value={filters.status ?? 'all'} onValueChange={handleStatusChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        {RISK_STATUSES.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm text-muted-foreground">Treatment</label>
                    <Select value={filters.treatment_strategy ?? 'all'} onValueChange={handleTreatmentChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="All treatments" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All treatments</SelectItem>
                        {TREATMENT_STRATEGIES.map((strategy) => (
                          <SelectItem key={strategy.value} value={strategy.value}>
                            {strategy.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Desktop filters */}
          <div className="hidden sm:flex gap-2">
            <Select value={filters.category ?? 'all'} onValueChange={handleCategoryChange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {NIS2_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.risk_level ?? 'all'} onValueChange={handleRiskLevelChange}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Risk Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All levels</SelectItem>
                {RISK_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.status ?? 'all'} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {RISK_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10 px-2">
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Results count */}
      {totalCount !== undefined && (
        <div className="text-sm text-muted-foreground">
          {filteredCount !== undefined && filteredCount !== totalCount ? (
            <>
              Showing <span className="font-medium text-foreground">{filteredCount}</span> of{' '}
              <span className="font-medium text-foreground">{totalCount}</span> risks
            </>
          ) : (
            <>
              <span className="font-medium text-foreground">{totalCount}</span> risks
            </>
          )}
        </div>
      )}
    </div>
  );
}
