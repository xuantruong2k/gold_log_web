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
          <button onClick={() => onRemoveFilter('type')} className="hover:text-blue-600">
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
          <button onClick={() => onRemoveFilter('provider')} className="hover:text-purple-600">
            ×
          </button>
        </div>
      )}

      {filters.search && (
        <div className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-3 py-1 text-sm text-yellow-800">
          <span>Search: "{filters.search}"</span>
          <button onClick={() => onRemoveFilter('search')} className="hover:text-yellow-600">
            ×
          </button>
        </div>
      )}

      <button onClick={onClearAll} className="text-sm text-red-600 hover:text-red-800 underline">
        Clear all
      </button>
    </div>
  );
};
