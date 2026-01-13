'use client';

import { useState } from 'react';
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  LayoutList,
  LayoutGrid,
  Upload,
  Sparkles,
  X,
  Download,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { cn } from '@/lib/utils';
import {
  type DocumentType,
  type StatusFilter,
  type SortField,
  type SortDirection,
  type ViewMode,
  type GroupBy,
  DOCUMENT_TYPE_INFO,
  SORT_OPTIONS,
} from '@/lib/documents/types';
import { STATUS_OPTIONS } from './constants';

interface SimpleVendor {
  id: string;
  name: string;
}

interface DocumentsToolbarProps {
  // Search
  search: string;
  onSearchChange: (value: string) => void;

  // Filters
  typeFilters: DocumentType[];
  onToggleTypeFilter: (type: DocumentType) => void;
  vendorFilter: string;
  onVendorFilterChange: (value: string) => void;
  statusFilter: StatusFilter;
  onStatusFilterChange: (value: StatusFilter) => void;
  vendors: SimpleVendor[];
  activeFilterCount: number;
  onApplyFilters: () => void;
  onClearAllFilters: () => void;

  // Sort
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  onSortDirectionChange: (direction: SortDirection) => void;

  // View
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  groupBy: GroupBy;
  onGroupByChange: (groupBy: GroupBy) => void;

  // Actions
  onUploadClick: () => void;
  onSmartImportClick: () => void;

  // Selection
  selectedCount: number;
  onBulkDownload: () => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;

  // Active filters display
  debouncedSearch: string;
  onClearSearch: () => void;
}

export function DocumentsToolbar({
  search,
  onSearchChange,
  typeFilters,
  onToggleTypeFilter,
  vendorFilter,
  onVendorFilterChange,
  statusFilter,
  onStatusFilterChange,
  vendors,
  activeFilterCount,
  onApplyFilters,
  onClearAllFilters,
  sortField,
  sortDirection,
  onSort,
  onSortDirectionChange,
  viewMode,
  onViewModeChange,
  groupBy,
  onGroupByChange,
  onUploadClick,
  onSmartImportClick,
  selectedCount,
  onBulkDownload,
  onBulkDelete,
  onClearSelection,
  debouncedSearch,
  onClearSearch,
}: DocumentsToolbarProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleApplyFilters = () => {
    setIsFilterOpen(false);
    onApplyFilters();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Top row: Search and Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-2 items-center">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              className="pl-8"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>

          {/* Advanced Filters */}
          <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="h-5 w-5 p-0 text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-4">
                <h4 className="font-medium">Filters</h4>

                {/* Document Type */}
                <div className="space-y-2">
                  <Label className="text-sm">Document Type</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(DOCUMENT_TYPE_INFO).map(([key, info]) => (
                      <Button
                        key={key}
                        variant={typeFilters.includes(key as DocumentType) ? 'default' : 'outline'}
                        size="sm"
                        className="justify-start text-xs"
                        onClick={() => onToggleTypeFilter(key as DocumentType)}
                      >
                        {info.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Vendor */}
                <div className="space-y-2">
                  <Label className="text-sm">Vendor</Label>
                  <Select value={vendorFilter} onValueChange={onVendorFilterChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Vendors" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Vendors</SelectItem>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label className="text-sm">Status</Label>
                  <Select value={statusFilter} onValueChange={(v) => onStatusFilterChange(v as StatusFilter)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <opt.icon className={cn('h-4 w-4', opt.color)} />
                            {opt.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={onClearAllFilters} className="flex-1">
                    Clear All
                  </Button>
                  <Button size="sm" onClick={handleApplyFilters} className="flex-1">
                    Apply Filters
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <ArrowUpDown className="h-4 w-4" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              {SORT_OPTIONS.map((opt) => (
                <DropdownMenuCheckboxItem
                  key={opt.value}
                  checked={sortField === opt.value}
                  onCheckedChange={() => onSort(opt.value)}
                >
                  {opt.label}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={sortDirection === 'asc'}
                onCheckedChange={() => onSortDirectionChange('asc')}
              >
                Ascending
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortDirection === 'desc'}
                onCheckedChange={() => onSortDirectionChange('desc')}
              >
                Descending
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Group */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <LayoutList className="h-4 w-4" />
                Group
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem
                checked={groupBy === 'none'}
                onCheckedChange={() => onGroupByChange('none')}
              >
                No Grouping
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={groupBy === 'vendor'}
                onCheckedChange={() => onGroupByChange('vendor')}
              >
                By Vendor
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={groupBy === 'type'}
                onCheckedChange={() => onGroupByChange('type')}
              >
                By Type
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={groupBy === 'status'}
                onCheckedChange={() => onGroupByChange('status')}
              >
                By Status
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View Toggle */}
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-r-none"
              onClick={() => onViewModeChange('table')}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'card' ? 'default' : 'ghost'}
              size="sm"
              className="rounded-l-none"
              onClick={() => onViewModeChange('card')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>

          <Button variant="outline" onClick={onSmartImportClick}>
            <Sparkles className="mr-2 h-4 w-4" />
            Smart Import
          </Button>
          <Button onClick={onUploadClick}>
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>
        </div>
      </div>

      {/* Active filters bar */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Filters:</span>
          {debouncedSearch && (
            <Badge variant="secondary" className="gap-1">
              Search: &quot;{debouncedSearch}&quot;
              <button onClick={onClearSearch} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {typeFilters.map(type => (
            <Badge key={type} variant="secondary" className="gap-1">
              {DOCUMENT_TYPE_INFO[type].label}
              <button onClick={() => onToggleTypeFilter(type)} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {vendorFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Vendor: {vendors.find(v => v.id === vendorFilter)?.name}
              <button onClick={() => onVendorFilterChange('all')} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {statusFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Status: {STATUS_OPTIONS.find(o => o.value === statusFilter)?.label}
              <button onClick={() => onStatusFilterChange('all')} className="ml-1 hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={onClearAllFilters} className="h-6 text-xs">
            Clear all
          </Button>
        </div>
      )}

      {/* Bulk actions bar */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-md">
          <span className="text-sm font-medium">{selectedCount} selected</span>
          <Separator orientation="vertical" className="h-4" />
          <Button variant="outline" size="sm" onClick={onBulkDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-error hover:text-error"
            onClick={onBulkDelete}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
          <Button variant="ghost" size="sm" onClick={onClearSelection}>
            Clear selection
          </Button>
        </div>
      )}
    </div>
  );
}
