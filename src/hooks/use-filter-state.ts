'use client';

import { useState, useCallback, useMemo } from 'react';
import { useDebounce } from './use-debounce';

/**
 * Generic filter state management hook
 *
 * Provides unified state for search, filters, and sorting with:
 * - Debounced search input
 * - Type-safe filter object management
 * - Sort field and direction tracking
 * - Filter panel open/close state
 * - Helper to check if any filters are active
 * - One-click clear all functionality
 *
 * @example
 * // Basic usage with typed filters
 * interface MyFilters {
 *   status: 'all' | 'active' | 'pending';
 *   type: string[];
 *   vendorId: string | null;
 * }
 *
 * const {
 *   search,
 *   setSearch,
 *   debouncedSearch,
 *   filters,
 *   setFilter,
 *   setFilters,
 *   sortField,
 *   sortDirection,
 *   setSort,
 *   toggleSortDirection,
 *   isFilterPanelOpen,
 *   setFilterPanelOpen,
 *   hasActiveFilters,
 *   clearAll,
 * } = useFilterState<MyFilters, 'name' | 'date'>({
 *   defaultFilters: { status: 'all', type: [], vendorId: null },
 *   defaultSort: { field: 'date', direction: 'desc' },
 *   debounceMs: 300,
 * });
 */

export type SortDirection = 'asc' | 'desc';

export interface UseFilterStateOptions<
  TFilters extends Record<string, unknown>,
  TSortField extends string = string
> {
  /** Default filter values */
  defaultFilters: TFilters;
  /** Default sort configuration */
  defaultSort?: {
    field: TSortField;
    direction: SortDirection;
  };
  /** Debounce delay for search in milliseconds (default: 300) */
  debounceMs?: number;
  /** Initial search value */
  initialSearch?: string;
  /** Initial filter panel open state */
  initialFilterPanelOpen?: boolean;
}

export interface UseFilterStateReturn<
  TFilters extends Record<string, unknown>,
  TSortField extends string = string
> {
  // Search
  search: string;
  setSearch: (value: string) => void;
  debouncedSearch: string;

  // Filters
  filters: TFilters;
  setFilter: <K extends keyof TFilters>(key: K, value: TFilters[K]) => void;
  setFilters: (updates: Partial<TFilters>) => void;
  resetFilters: () => void;

  // Sort
  sortField: TSortField;
  sortDirection: SortDirection;
  setSort: (field: TSortField, direction?: SortDirection) => void;
  toggleSortDirection: () => void;

  // Filter panel
  isFilterPanelOpen: boolean;
  setFilterPanelOpen: (open: boolean) => void;
  toggleFilterPanel: () => void;

  // Utilities
  hasActiveFilters: boolean;
  activeFilterCount: number;
  clearAll: () => void;
}

export function useFilterState<
  TFilters extends Record<string, unknown>,
  TSortField extends string = string
>(
  options: UseFilterStateOptions<TFilters, TSortField>
): UseFilterStateReturn<TFilters, TSortField> {
  const {
    defaultFilters,
    defaultSort,
    debounceMs = 300,
    initialSearch = '',
    initialFilterPanelOpen = false,
  } = options;

  // Search state
  const [search, setSearch] = useState(initialSearch);
  const debouncedSearch = useDebounce(search, debounceMs);

  // Filter state
  const [filters, setFiltersState] = useState<TFilters>(defaultFilters);

  // Sort state
  const [sortField, setSortField] = useState<TSortField>(
    defaultSort?.field ?? ('' as TSortField)
  );
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    defaultSort?.direction ?? 'desc'
  );

  // Filter panel state
  const [isFilterPanelOpen, setFilterPanelOpen] = useState(initialFilterPanelOpen);

  // Set a single filter
  const setFilter = useCallback(<K extends keyof TFilters>(key: K, value: TFilters[K]) => {
    setFiltersState((prev) => ({ ...prev, [key]: value }));
  }, []);

  // Set multiple filters at once
  const setFilters = useCallback((updates: Partial<TFilters>) => {
    setFiltersState((prev) => ({ ...prev, ...updates }));
  }, []);

  // Reset filters to defaults
  const resetFilters = useCallback(() => {
    setFiltersState(defaultFilters);
  }, [defaultFilters]);

  // Set sort field and optionally direction
  const setSort = useCallback((field: TSortField, direction?: SortDirection) => {
    setSortField(field);
    if (direction) {
      setSortDirection(direction);
    }
  }, []);

  // Toggle sort direction
  const toggleSortDirection = useCallback(() => {
    setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  }, []);

  // Toggle filter panel
  const toggleFilterPanel = useCallback(() => {
    setFilterPanelOpen((prev) => !prev);
  }, []);

  // Check if any filters are active (different from defaults)
  const hasActiveFilters = useMemo(() => {
    if (search.trim()) return true;

    return Object.keys(filters).some((key) => {
      const currentValue = filters[key as keyof TFilters];
      const defaultValue = defaultFilters[key as keyof TFilters];

      // Handle arrays
      if (Array.isArray(currentValue) && Array.isArray(defaultValue)) {
        return currentValue.length !== defaultValue.length ||
          !currentValue.every((v, i) => v === defaultValue[i]);
      }

      return currentValue !== defaultValue;
    });
  }, [search, filters, defaultFilters]);

  // Count active filters (excluding search)
  const activeFilterCount = useMemo(() => {
    let count = 0;

    Object.keys(filters).forEach((key) => {
      const currentValue = filters[key as keyof TFilters];
      const defaultValue = defaultFilters[key as keyof TFilters];

      if (Array.isArray(currentValue)) {
        if (currentValue.length > 0 && currentValue.length !== (defaultValue as unknown[])?.length) {
          count += currentValue.length;
        }
      } else if (currentValue !== defaultValue && currentValue !== 'all' && currentValue !== null) {
        count += 1;
      }
    });

    return count;
  }, [filters, defaultFilters]);

  // Clear all filters and search
  const clearAll = useCallback(() => {
    setSearch('');
    setFiltersState(defaultFilters);
    if (defaultSort) {
      setSortField(defaultSort.field);
      setSortDirection(defaultSort.direction);
    }
  }, [defaultFilters, defaultSort]);

  return {
    // Search
    search,
    setSearch,
    debouncedSearch,

    // Filters
    filters,
    setFilter,
    setFilters,
    resetFilters,

    // Sort
    sortField,
    sortDirection,
    setSort,
    toggleSortDirection,

    // Filter panel
    isFilterPanelOpen,
    setFilterPanelOpen,
    toggleFilterPanel,

    // Utilities
    hasActiveFilters,
    activeFilterCount,
    clearAll,
  };
}
