'use client';

import { useCallback, useMemo } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

/**
 * Hook for persisting filter state in URL search params.
 * Enables shareable/bookmarkable filtered views.
 *
 * @example
 * const { getParam, setParam, setParams, clearParams } = useUrlFilters();
 *
 * // Read a param
 * const search = getParam('q');
 *
 * // Set a param
 * setParam('tier', 'critical');
 *
 * // Set multiple params
 * setParams({ tier: 'critical', status: 'active' });
 *
 * // Clear all params
 * clearParams();
 */
export function useUrlFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get a single param value
  const getParam = useCallback(
    (key: string): string | null => {
      return searchParams.get(key);
    },
    [searchParams]
  );

  // Get array param (comma-separated)
  const getArrayParam = useCallback(
    (key: string): string[] => {
      const value = searchParams.get(key);
      return value ? value.split(',').filter(Boolean) : [];
    },
    [searchParams]
  );

  // Get boolean param
  const getBoolParam = useCallback(
    (key: string): boolean | undefined => {
      const value = searchParams.get(key);
      if (value === 'true') return true;
      if (value === 'false') return false;
      return undefined;
    },
    [searchParams]
  );

  // Get number param
  const getNumberParam = useCallback(
    (key: string, defaultValue?: number): number | undefined => {
      const value = searchParams.get(key);
      if (value === null) return defaultValue;
      const num = parseInt(value, 10);
      return isNaN(num) ? defaultValue : num;
    },
    [searchParams]
  );

  // Create new URLSearchParams from current
  const createParams = useCallback(() => {
    return new URLSearchParams(searchParams.toString());
  }, [searchParams]);

  // Set a single param
  const setParam = useCallback(
    (key: string, value: string | number | boolean | string[] | null | undefined) => {
      const params = createParams();

      if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
        params.delete(key);
      } else if (Array.isArray(value)) {
        params.set(key, value.join(','));
      } else {
        params.set(key, String(value));
      }

      const queryString = params.toString();
      router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    },
    [router, pathname, createParams]
  );

  // Set multiple params at once
  const setParams = useCallback(
    (updates: Record<string, string | number | boolean | string[] | null | undefined>) => {
      const params = createParams();

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
          params.delete(key);
        } else if (Array.isArray(value)) {
          params.set(key, value.join(','));
        } else {
          params.set(key, String(value));
        }
      });

      const queryString = params.toString();
      router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    },
    [router, pathname, createParams]
  );

  // Clear all params
  const clearParams = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [router, pathname]);

  // Check if any params are set
  const hasParams = useMemo(() => {
    return searchParams.toString().length > 0;
  }, [searchParams]);

  return {
    getParam,
    getArrayParam,
    getBoolParam,
    getNumberParam,
    setParam,
    setParams,
    clearParams,
    hasParams,
    searchParams,
  };
}
