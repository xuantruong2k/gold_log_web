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
