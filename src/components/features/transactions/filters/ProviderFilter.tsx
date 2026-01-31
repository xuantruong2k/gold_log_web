import { useMemo } from 'react';
import { useTransactions } from '@/hooks/useTransactions';

interface ProviderFilterProps {
  value?: string;
  onChange: (value?: string) => void;
}

export const ProviderFilter: React.FC<ProviderFilterProps> = ({ value, onChange }) => {
  const { data } = useTransactions(undefined, { page: 1, pageSize: 100 });

  const providers = useMemo(() => {
    if (!data?.data) return [];
    return Array.from(
      new Set(data.data.map((tx) => tx.provider).filter((p): p is string => !!p))
    ).sort();
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
