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
        onChange={(e) => onChange({ ...value, field: e.target.value as SortConfig['field'] })}
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
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        ) : (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>
    </div>
  );
};
