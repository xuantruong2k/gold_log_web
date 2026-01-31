# Gold Log Client - Advanced Features Implementation Plan

**Plan Version**: 1.0.0
**Created**: January 30, 2026
**Status**: Ready for Implementation
**Dependencies**: Transaction CRUD (plan-transactions.md) must be completed

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Implementation Phases](#implementation-phases)
4. [Phase 1: Filter System Architecture](#phase-1-filter-system-architecture)
5. [Phase 2: Type Filter](#phase-2-type-filter)
6. [Phase 3: Date Range Filter](#phase-3-date-range-filter)
7. [Phase 4: Provider Filter](#phase-4-provider-filter)
8. [Phase 5: Search Functionality](#phase-5-search-functionality)
9. [Phase 6: Sort Functionality](#phase-6-sort-functionality)
10. [Phase 7: Filter Persistence](#phase-7-filter-persistence)
11. [Phase 8: Export Functionality](#phase-8-export-functionality)
12. [Testing & Verification](#testing--verification)
13. [Performance Optimization](#performance-optimization)

---

## Overview

This plan implements advanced filtering, sorting, and search features to enhance the transaction management experience. Users will be able to:

- **Filter** transactions by type (BUY/SELL)
- **Filter** by date range (custom or predefined periods)
- **Filter** by provider (SJC, PNJ, custom)
- **Search** by notes or provider name
- **Sort** by date, amount, quantity, or price
- **Persist** filter state in URL for sharing
- **Export** filtered results as CSV/JSON

### Architecture Principles

- **URL State Management**: Filters stored in URL query parameters
- **Debounced Search**: Prevent excessive API calls
- **Client-Side Sorting**: Fast sorting without API calls (for current page)
- **Filter Combinations**: Support multiple simultaneous filters
- **Filter Chips**: Visual representation of active filters
- **Clear All**: Reset all filters with one click

---

## Prerequisites

### Completed Work

- ✅ Transaction CRUD operations (plan-transactions.md)
- ✅ Transaction list with pagination
- ✅ Transaction API layer with filter support
- ✅ React Query setup for data fetching

### Required Backend Support

Verify backend supports these query parameters:

```
GET /api/v1/transactions?type=BUY
GET /api/v1/transactions?startDate=2026-01-01&endDate=2026-01-31
GET /api/v1/transactions?provider=SJC
GET /api/v1/transactions?type=BUY&startDate=2026-01-01
```

---

## Implementation Phases

| Phase     | Component                  | Estimated Time | Priority |
| --------- | -------------------------- | -------------- | -------- |
| 1         | Filter System Architecture | 30 min         | P0       |
| 2         | Type Filter                | 30 min         | P0       |
| 3         | Date Range Filter          | 1 hour         | P0       |
| 4         | Provider Filter            | 30 min         | P0       |
| 5         | Search Functionality       | 45 min         | P1       |
| 6         | Sort Functionality         | 45 min         | P1       |
| 7         | Filter Persistence (URL)   | 30 min         | P1       |
| 8         | Export Functionality       | 1 hour         | P2       |
| **Total** |                            | **~5.5 hours** |          |

---

## Phase 1: Filter System Architecture

### 1.1 Create Filter Types

**File**: `src/types/filter.types.ts`

```typescript
import { TransactionType } from './transaction.types';

export interface TransactionFilters {
  type?: TransactionType;
  startDate?: string;
  endDate?: string;
  provider?: string;
  search?: string;
}

export interface SortConfig {
  field: 'transactionDate' | 'quantity' | 'pricePerUnit' | 'totalAmount';
  direction: 'asc' | 'desc';
}

export interface FilterState {
  filters: TransactionFilters;
  sort: SortConfig;
}

export type DatePreset = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all' | 'custom';
```

### 1.2 Create Filter Utilities

**File**: `src/utils/filterUtils.ts`

```typescript
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
```

### 1.3 Create useFilters Hook

**File**: `src/hooks/useFilters.ts`

```typescript
import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { TransactionFilters } from '@/types/filter.types';
import { queryStringToFilters, filtersToQueryString } from '@/utils/filterUtils';

export function useFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<TransactionFilters>(() => {
    return queryStringToFilters(searchParams.toString());
  });

  // Sync filters to URL
  useEffect(() => {
    const queryString = filtersToQueryString(filters);
    setSearchParams(queryString ? `?${queryString}` : '', { replace: true });
  }, [filters, setSearchParams]);

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
```

---

## Phase 2: Type Filter

### 2.1 Create Type Filter Component

**File**: `src/components/features/transactions/filters/TypeFilter.tsx`

```typescript
import { TransactionType } from '@/types/transaction.types';

interface TypeFilterProps {
  value?: TransactionType;
  onChange: (value?: TransactionType) => void;
}

export const TypeFilter: React.FC<TypeFilterProps> = ({ value, onChange }) => {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-gray-700">Type:</label>
      <div className="flex gap-2">
        <button
          onClick={() => onChange(undefined)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            !value
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        <button
          onClick={() => onChange(TransactionType.BUY)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            value === TransactionType.BUY
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          BUY
        </button>
        <button
          onClick={() => onChange(TransactionType.SELL)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            value === TransactionType.SELL
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          SELL
        </button>
      </div>
    </div>
  );
};
```

---

## Phase 3: Date Range Filter

### 3.1 Create Date Range Filter Component

**File**: `src/components/features/transactions/filters/DateRangeFilter.tsx`

```typescript
import { useState } from 'react';
import type { DatePreset } from '@/types/filter.types';
import { getDateRangeFromPreset } from '@/utils/filterUtils';

interface DateRangeFilterProps {
  startDate?: string;
  endDate?: string;
  onChange: (startDate?: string, endDate?: string) => void;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  startDate,
  endDate,
  onChange,
}) => {
  const [preset, setPreset] = useState<DatePreset>('all');
  const [showCustom, setShowCustom] = useState(false);

  const handlePresetChange = (newPreset: DatePreset) => {
    setPreset(newPreset);

    if (newPreset === 'custom') {
      setShowCustom(true);
    } else {
      setShowCustom(false);
      const range = getDateRangeFromPreset(newPreset);
      onChange(range.startDate, range.endDate);
    }
  };

  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return '';
    return dateString.split('T')[0];
  };

  const handleDateChange = (start?: string, end?: string) => {
    const startISO = start ? new Date(start).toISOString() : undefined;
    const endISO = end ? new Date(end).toISOString() : undefined;
    onChange(startISO, endISO);
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Date Range:</label>
        <div className="flex flex-wrap gap-2">
          {(['all', 'today', 'week', 'month', 'quarter', 'year', 'custom'] as DatePreset[]).map(
            (p) => (
              <button
                key={p}
                onClick={() => handlePresetChange(p)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  preset === p
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            )
          )}
        </div>
      </div>

      {showCustom && (
        <div className="grid grid-cols-2 gap-4 rounded-md border bg-gray-50 p-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={formatDateForInput(startDate)}
              onChange={(e) => handleDateChange(e.target.value, formatDateForInput(endDate))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={formatDateForInput(endDate)}
              onChange={(e) => handleDateChange(formatDateForInput(startDate), e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};
```

---

## Phase 4: Provider Filter

### 4.1 Create Provider Filter Component

**File**: `src/components/features/transactions/filters/ProviderFilter.tsx`

```typescript
import { useState, useEffect } from 'react';
import { useTransactions } from '@/hooks/useTransactions';

interface ProviderFilterProps {
  value?: string;
  onChange: (value?: string) => void;
}

export const ProviderFilter: React.FC<ProviderFilterProps> = ({ value, onChange }) => {
  const [providers, setProviders] = useState<string[]>([]);
  const { data } = useTransactions(undefined, { page: 1, pageSize: 100 });

  useEffect(() => {
    if (data?.data) {
      const uniqueProviders = Array.from(
        new Set(
          data.data
            .map((tx) => tx.provider)
            .filter((p): p is string => !!p)
        )
      ).sort();
      setProviders(uniqueProviders);
    }
  }, [data]);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Provider:</label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      >
        <option value="">All Providers</option>
        {providers.map((provider) => (
          <option key={provider} value={provider}>
            {provider}
          </option>
        ))}
      </select>
    </div>
  );
};
```

---

## Phase 5: Search Functionality

### 5.1 Create Search Input with Debounce

**File**: `src/hooks/useDebounce.ts`

```typescript
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

### 5.2 Create Search Component

**File**: `src/components/features/transactions/filters/SearchFilter.tsx`

```typescript
import { useState, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchFilterProps {
  value?: string;
  onChange: (value?: string) => void;
}

export const SearchFilter: React.FC<SearchFilterProps> = ({ value, onChange }) => {
  const [searchTerm, setSearchTerm] = useState(value || '');
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    onChange(debouncedSearch || undefined);
  }, [debouncedSearch, onChange]);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Search:</label>
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by provider or notes..."
          className="block w-full rounded-md border-gray-300 pl-10 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
```

---

## Phase 6: Sort Functionality

### 6.1 Create Sort Component

**File**: `src/components/features/transactions/filters/SortControl.tsx`

```typescript
import type { SortConfig } from '@/types/filter.types';

interface SortControlProps {
  value: SortConfig;
  onChange: (config: SortConfig) => void;
}

export const SortControl: React.FC<SortControlProps> = ({ value, onChange }) => {
  const sortOptions: Array<{ value: SortConfig['field']; label: string }> = [
    { value: 'transactionDate', label: 'Date' },
    { value: 'quantity', label: 'Quantity' },
    { value: 'pricePerUnit', label: 'Price/Unit' },
    { value: 'totalAmount', label: 'Total Amount' },
  ];

  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium text-gray-700">Sort by:</label>
      <select
        value={value.field}
        onChange={(e) =>
          onChange({ ...value, field: e.target.value as SortConfig['field'] })
        }
        className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button
        onClick={() =>
          onChange({ ...value, direction: value.direction === 'asc' ? 'desc' : 'asc' })
        }
        className="rounded-md bg-gray-100 p-2 hover:bg-gray-200"
        title={`Sort ${value.direction === 'asc' ? 'ascending' : 'descending'}`}
      >
        {value.direction === 'asc' ? (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 15l7-7 7 7"
            />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        )}
      </button>
    </div>
  );
};
```

### 6.2 Add Client-Side Sorting Logic

**File**: `src/utils/sortUtils.ts`

```typescript
import type { Transaction } from '@/types/transaction.types';
import type { SortConfig } from '@/types/filter.types';

export function sortTransactions(
  transactions: Transaction[],
  sortConfig: SortConfig
): Transaction[] {
  const sorted = [...transactions];

  sorted.sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortConfig.field) {
      case 'transactionDate':
        aValue = new Date(a.transactionDate).getTime();
        bValue = new Date(b.transactionDate).getTime();
        break;
      case 'quantity':
        aValue = a.quantity;
        bValue = b.quantity;
        break;
      case 'pricePerUnit':
        aValue = a.pricePerUnit;
        bValue = b.pricePerUnit;
        break;
      case 'totalAmount':
        aValue = a.totalAmount;
        bValue = b.totalAmount;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  return sorted;
}
```

---

## Phase 7: Filter Persistence

### 7.1 Create Filter Chips Component

**File**: `src/components/features/transactions/filters/FilterChips.tsx`

```typescript
import type { TransactionFilters } from '@/types/filter.types';
import { countActiveFilters } from '@/utils/filterUtils';

interface FilterChipsProps {
  filters: TransactionFilters;
  onRemoveFilter: (key: keyof TransactionFilters) => void;
  onClearAll: () => void;
}

export const FilterChips: React.FC<FilterChipsProps> = ({
  filters,
  onRemoveFilter,
  onClearAll,
}) => {
  const activeCount = countActiveFilters(filters);

  if (activeCount === 0) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-gray-600">{activeCount} active filter(s):</span>

      {filters.type && (
        <div className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800">
          <span>Type: {filters.type}</span>
          <button
            onClick={() => onRemoveFilter('type')}
            className="hover:text-blue-600"
          >
            ×
          </button>
        </div>
      )}

      {(filters.startDate || filters.endDate) && (
        <div className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm text-green-800">
          <span>
            Date: {filters.startDate && formatDate(filters.startDate)} -{' '}
            {filters.endDate && formatDate(filters.endDate)}
          </span>
          <button
            onClick={() => {
              onRemoveFilter('startDate');
              onRemoveFilter('endDate');
            }}
            className="hover:text-green-600"
          >
            ×
          </button>
        </div>
      )}

      {filters.provider && (
        <div className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-3 py-1 text-sm text-purple-800">
          <span>Provider: {filters.provider}</span>
          <button
            onClick={() => onRemoveFilter('provider')}
            className="hover:text-purple-600"
          >
            ×
          </button>
        </div>
      )}

      {filters.search && (
        <div className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-sm text-yellow-800">
          <span>Search: "{filters.search}"</span>
          <button
            onClick={() => onRemoveFilter('search')}
            className="hover:text-yellow-600"
          >
            ×
          </button>
        </div>
      )}

      <button
        onClick={onClearAll}
        className="text-sm text-red-600 hover:text-red-800 underline"
      >
        Clear all
      </button>
    </div>
  );
};
```

---

## Phase 8: Export Functionality

### 8.1 Create Export Utilities

**File**: `src/utils/exportUtils.ts`

```typescript
import type { Transaction } from '@/types/transaction.types';

/**
 * Export transactions as CSV
 */
export function exportToCSV(transactions: Transaction[], filename: string = 'transactions.csv') {
  const headers = [
    'ID',
    'Date',
    'Type',
    'Quantity',
    'Price per Unit',
    'Currency',
    'Total Amount',
    'Provider',
    'Notes',
  ];

  const rows = transactions.map((tx) => [
    tx.id,
    new Date(tx.transactionDate).toLocaleString(),
    tx.type,
    tx.quantity.toString(),
    tx.pricePerUnit.toString(),
    tx.currency,
    tx.totalAmount.toString(),
    tx.provider || '',
    tx.notes || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
}

/**
 * Export transactions as JSON
 */
export function exportToJSON(transactions: Transaction[], filename: string = 'transactions.json') {
  const jsonContent = JSON.stringify(transactions, null, 2);
  downloadFile(jsonContent, filename, 'application/json;charset=utf-8;');
}

/**
 * Helper to trigger file download
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
```

### 8.2 Create Export Button Component

**File**: `src/components/features/transactions/ExportButton.tsx`

```typescript
import { useState } from 'react';
import type { Transaction } from '@/types/transaction.types';
import { exportToCSV, exportToJSON } from '@/utils/exportUtils';

interface ExportButtonProps {
  transactions: Transaction[];
  disabled?: boolean;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ transactions, disabled }) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleExport = (format: 'csv' | 'json') => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `transactions_${timestamp}.${format}`;

    if (format === 'csv') {
      exportToCSV(transactions, filename);
    } else {
      exportToJSON(transactions, filename);
    }

    setShowMenu(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={disabled || transactions.length === 0}
        className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        Export ({transactions.length})
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 z-20 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
            <div className="py-1">
              <button
                onClick={() => handleExport('csv')}
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
              >
                Export as CSV
              </button>
              <button
                onClick={() => handleExport('json')}
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
              >
                Export as JSON
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
```

---

## Complete Filter Panel Component

### Create Integrated Filter Panel

**File**: `src/components/features/transactions/FilterPanel.tsx`

```typescript
import { useState } from 'react';
import { useFilters } from '@/hooks/useFilters';
import { TypeFilter } from './filters/TypeFilter';
import { DateRangeFilter } from './filters/DateRangeFilter';
import { ProviderFilter } from './filters/ProviderFilter';
import { SearchFilter } from './filters/SearchFilter';
import { SortControl } from './filters/SortControl';
import { FilterChips } from './filters/FilterChips';
import type { SortConfig } from '@/types/filter.types';

interface FilterPanelProps {
  sortConfig: SortConfig;
  onSortChange: (config: SortConfig) => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({ sortConfig, onSortChange }) => {
  const { filters, updateFilter, removeFilter, clearAllFilters, setMultipleFilters } =
    useFilters();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-lg font-semibold text-gray-900"
        >
          <span>Filters & Sort</span>
          <svg
            className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
        <SortControl value={sortConfig} onChange={onSortChange} />
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-4 border-t pt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <TypeFilter
              value={filters.type}
              onChange={(value) => updateFilter('type', value)}
            />
            <ProviderFilter
              value={filters.provider}
              onChange={(value) => updateFilter('provider', value)}
            />
          </div>

          <SearchFilter
            value={filters.search}
            onChange={(value) => updateFilter('search', value)}
          />

          <DateRangeFilter
            startDate={filters.startDate}
            endDate={filters.endDate}
            onChange={(start, end) =>
              setMultipleFilters({ startDate: start, endDate: end })
            }
          />
        </div>
      )}

      <div className="mt-4">
        <FilterChips
          filters={filters}
          onRemoveFilter={removeFilter}
          onClearAll={clearAllFilters}
        />
      </div>
    </div>
  );
};
```

---

## Update TransactionsPage

**File**: `src/pages/TransactionsPage.tsx`

Add filter panel and export functionality:

```typescript
import { useState } from 'react';
import { TransactionForm } from '@/components/features/transactions/TransactionForm';
import { TransactionList } from '@/components/features/transactions/TransactionList';
import { FilterPanel } from '@/components/features/transactions/FilterPanel';
import { ExportButton } from '@/components/features/transactions/ExportButton';
import { useFilters } from '@/hooks/useFilters';
import { useTransactions } from '@/hooks/useTransactions';
import { usePagination } from '@/hooks/usePagination';
import { sortTransactions } from '@/utils/sortUtils';
import type { SortConfig } from '@/types/filter.types';

export const TransactionsPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'transactionDate',
    direction: 'desc',
  });

  const { filters } = useFilters();
  const { page, pageSize, nextPage, prevPage } = usePagination();
  const { data, isLoading } = useTransactions(filters, { page, pageSize });

  // Apply client-side sorting
  const sortedData = data?.data ? sortTransactions(data.data, sortConfig) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
        <div className="flex gap-3">
          <ExportButton transactions={sortedData} disabled={isLoading} />
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : '+ Add Transaction'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Add New Transaction</h2>
          <TransactionForm
            onSuccess={() => setShowForm(false)}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      <FilterPanel sortConfig={sortConfig} onSortChange={setSortConfig} />

      <div className="rounded-lg border bg-white shadow-sm">
        <TransactionList
          transactions={sortedData}
          pagination={data?.pagination}
          isLoading={isLoading}
          onNextPage={nextPage}
          onPrevPage={prevPage}
        />
      </div>
    </div>
  );
};
```

---

## Testing & Verification

### Manual Testing Checklist

1. **Type Filter**:
   - [ ] Filter by BUY only
   - [ ] Filter by SELL only
   - [ ] Clear type filter

2. **Date Range Filter**:
   - [ ] Select "Today" preset
   - [ ] Select "Week" preset
   - [ ] Select "Month" preset
   - [ ] Select "Custom" and pick dates
   - [ ] Verify transactions match date range

3. **Provider Filter**:
   - [ ] Select provider from dropdown
   - [ ] Verify only transactions from that provider show
   - [ ] Clear provider filter

4. **Search**:
   - [ ] Type in search box
   - [ ] Verify debounced behavior (500ms delay)
   - [ ] Clear search

5. **Sort**:
   - [ ] Sort by date (asc/desc)
   - [ ] Sort by quantity (asc/desc)
   - [ ] Sort by amount (asc/desc)

6. **Filter Chips**:
   - [ ] Apply multiple filters
   - [ ] Remove individual chips
   - [ ] Clear all filters

7. **URL Persistence**:
   - [ ] Apply filters
   - [ ] Copy URL
   - [ ] Open in new tab
   - [ ] Verify filters applied

8. **Export**:
   - [ ] Export as CSV
   - [ ] Export as JSON
   - [ ] Verify file contents

---

## Performance Optimization

### 1. Memoize Expensive Calculations

```typescript
const sortedData = useMemo(
  () => (data?.data ? sortTransactions(data.data, sortConfig) : []),
  [data?.data, sortConfig]
);
```

### 2. Debounce Search Input

Already implemented with `useDebounce` hook.

### 3. Virtual Scrolling for Large Lists

For 1000+ transactions, consider using `@tanstack/react-virtual`:

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';
```

---

## Summary

This plan implements comprehensive filtering and sorting:

✅ **Type Filter**: BUY/SELL toggle buttons
✅ **Date Range Filter**: Presets + custom date picker
✅ **Provider Filter**: Dropdown with dynamic providers
✅ **Search**: Debounced search by notes/provider
✅ **Sort**: By date, quantity, price, amount
✅ **Filter Chips**: Visual active filters
✅ **URL Persistence**: Share filtered views
✅ **Export**: CSV/JSON download

Estimated implementation time: **~5.5 hours**

---

**End of plan-advanced-features.md**
