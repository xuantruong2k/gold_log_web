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
