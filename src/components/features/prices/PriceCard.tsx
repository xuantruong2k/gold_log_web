import type { GoldPrice } from '@/types';
import { formatCurrency, formatRelativeTime } from '@/utils/format';

interface PriceCardProps {
  price: GoldPrice;
  onSelect?: () => void;
}

export const PriceCard: React.FC<PriceCardProps> = ({ price, onSelect }) => {
  return (
    <div className="rounded-lg border border-gray-200 p-4 hover:border-blue-500 hover:shadow-md transition-all">
      {/* Provider Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">{price.provider}</h3>
        <span className="text-xs text-gray-500">{formatRelativeTime(price.updatedAt)}</span>
      </div>

      {/* Price Display */}
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <p className="text-sm text-gray-600">Buy</p>
          <p className="text-xl font-bold text-green-600">
            {formatCurrency(price.buyPrice, price.currency)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Sell</p>
          <p className="text-xl font-bold text-red-600">
            {formatCurrency(price.sellPrice, price.currency)}
          </p>
        </div>
      </div>

      {/* Unit and Spread */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>per {price.unitDisplayName}</span>
        <span>Spread: {formatCurrency(price.spread, price.currency)}</span>
      </div>

      {/* Action Button (optional) */}
      {onSelect && (
        <button
          onClick={onSelect}
          className="mt-3 w-full rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
        >
          Use This Price
        </button>
      )}
    </div>
  );
};
