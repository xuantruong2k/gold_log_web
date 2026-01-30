import type { TransactionFilters, DatePreset } from '@/types/filter.types';

/**
 * Get date range for preset periods
 */
export function getDateRangeFromPreset(preset: DatePreset): {
  startDate?: string;
  endDate?: string;
} {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case 'today':
      return {
        startDate: today.toISOString(),
        endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      };

    case 'week': {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      return {
        startDate: weekAgo.toISOString(),
        endDate: now.toISOString(),
      };
    }

    case 'month': {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      return {
        startDate: monthAgo.toISOString(),
        endDate: now.toISOString(),
      };
    }

    case 'quarter': {
      const quarterAgo = new Date(today);
      quarterAgo.setMonth(quarterAgo.getMonth() - 3);
      return {
        startDate: quarterAgo.toISOString(),
        endDate: now.toISOString(),
      };
    }

    case 'year': {
      const yearAgo = new Date(today);
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      return {
        startDate: yearAgo.toISOString(),
        endDate: now.toISOString(),
      };
    }

    case 'all':
    case 'custom':
    default:
      return {};
  }
}

/**
 * Check if filters are active
 */
export function hasActiveFilters(filters: TransactionFilters): boolean {
  return !!(
    filters.type ||
    filters.startDate ||
    filters.endDate ||
    filters.provider ||
    filters.search
  );
}

/**
 * Count active filters
 */
export function countActiveFilters(filters: TransactionFilters): number {
  let count = 0;
  if (filters.type) count++;
  if (filters.startDate || filters.endDate) count++;
  if (filters.provider) count++;
  if (filters.search) count++;
  return count;
}

/**
 * Build filter query string for URL
 */
export function filtersToQueryString(filters: TransactionFilters): string {
  const params = new URLSearchParams();

  if (filters.type) params.set('type', filters.type);
  if (filters.startDate) params.set('startDate', filters.startDate);
  if (filters.endDate) params.set('endDate', filters.endDate);
  if (filters.provider) params.set('provider', filters.provider);
  if (filters.search) params.set('search', filters.search);

  return params.toString();
}

/**
 * Parse filters from URL query string
 */
export function queryStringToFilters(queryString: string): TransactionFilters {
  const params = new URLSearchParams(queryString);
  const filters: TransactionFilters = {};

  const type = params.get('type');
  if (type) filters.type = type as any;

  const startDate = params.get('startDate');
  if (startDate) filters.startDate = startDate;

  const endDate = params.get('endDate');
  if (endDate) filters.endDate = endDate;

  const provider = params.get('provider');
  if (provider) filters.provider = provider;

  const search = params.get('search');
  if (search) filters.search = search;

  return filters;
}
