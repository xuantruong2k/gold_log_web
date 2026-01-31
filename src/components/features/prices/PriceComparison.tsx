import type { GoldPrice } from '@/types';
import { formatCurrency } from '@/utils/format';

interface PriceComparisonProps {
  prices: GoldPrice[];
}

export const PriceComparison: React.FC<PriceComparisonProps> = ({ prices }) => {
  // Group by currency
  const vndPrices = prices.filter((p) => p.currency === 'VND');
  const usdPrices = prices.filter((p) => p.currency === 'USD');

  if (vndPrices.length === 0 && usdPrices.length === 0) {
    return null;
  }

  // Get best VND prices
  const bestVndBuy =
    vndPrices.length > 0
      ? vndPrices.reduce((prev, curr) => (curr.buyPrice < prev.buyPrice ? curr : prev))
      : null;

  const bestVndSell =
    vndPrices.length > 0
      ? vndPrices.reduce((prev, curr) => (curr.sellPrice > prev.sellPrice ? curr : prev))
      : null;

  return (
    <div className="rounded-lg bg-blue-50 p-4 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Best Prices (VND)</h2>
      {vndPrices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bestVndBuy && (
            <div className="rounded-md bg-white p-3">
              <p className="text-sm text-gray-600 mb-1">Best Buy Price</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(bestVndBuy.buyPrice, 'VND')}
              </p>
              <p className="text-xs text-gray-500 mt-1">{bestVndBuy.provider}</p>
            </div>
          )}
          {bestVndSell && (
            <div className="rounded-md bg-white p-3">
              <p className="text-sm text-gray-600 mb-1">Best Sell Price</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(bestVndSell.sellPrice, 'VND')}
              </p>
              <p className="text-xs text-gray-500 mt-1">{bestVndSell.provider}</p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-600">No VND prices available</p>
      )}
    </div>
  );
};
