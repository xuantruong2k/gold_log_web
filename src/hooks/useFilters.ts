import { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import type { TransactionFilters } from '@/types/filter.types';
import { queryStringToFilters, filtersToQueryString } from '@/utils/filterUtils';

export function useFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const [filters, setFilters] = useState<TransactionFilters>(() => {
    return queryStringToFilters(searchParams.toString());
  });
  const isInitialMount = useRef(true);

  // Sync filters to URL (skip initial mount and OAuth callback routes)
  useEffect(() => {
    // Skip OAuth callback routes entirely
    if (location.pathname.includes('/auth/callback/')) {
      return;
    }

    // Skip the first render to avoid interfering with any URL params
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const queryString = filtersToQueryString(filters);
    setSearchParams(queryString ? `?${queryString}` : '', { replace: true });
  }, [filters, setSearchParams, location.pathname]);

  const updateFilter = useCallback((key: keyof TransactionFilters, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const removeFilter = useCallback((key: keyof TransactionFilters) => {
    setFilters((prev) => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({});
  }, []);

  const setMultipleFilters = useCallback((newFilters: Partial<TransactionFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
  }, []);

  return {
    filters,
    updateFilter,
    removeFilter,
    clearAllFilters,
    setMultipleFilters,
  };
}
