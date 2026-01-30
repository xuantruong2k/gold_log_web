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
