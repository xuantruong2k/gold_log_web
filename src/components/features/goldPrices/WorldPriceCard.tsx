import type { WorldGoldPrice, ExchangeRate } from '@/types';

// 1 Lượng = 37.5g, 1 Troy Oz = 31.1035g → 1 Lượng = 37.5/31.1035 Oz
const LUONG_IN_OZ = 37.5 / 31.1035;

interface WorldPriceCardProps {
  worldPrice: WorldGoldPrice;
  exchangeRate: ExchangeRate | undefined;
}

export const WorldPriceCard = ({ worldPrice, exchangeRate }: WorldPriceCardProps) => {
  const formatUsd = (value: number) =>
    value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatVnd = (value: number) => value.toLocaleString('vi-VN');

  const vndBuy = exchangeRate
    ? Math.round(worldPrice.buyPrice * LUONG_IN_OZ * exchangeRate.transferRate)
    : null;
  const vndSell = exchangeRate
    ? Math.round(worldPrice.sellPrice * LUONG_IN_OZ * exchangeRate.transferRate)
    : null;

  const updatedTime = new Date(worldPrice.updatedAt).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      {/* USD/Oz section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">World Gold Price</h3>
        <p className="mb-4 text-xs text-gray-400">
          {worldPrice.provider} · Updated {updatedTime}
        </p>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Buy</span>
            <span className="font-medium text-green-600">
              ${formatUsd(worldPrice.buyPrice)} / Oz
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Sell</span>
            <span className="font-medium text-red-600">
              ${formatUsd(worldPrice.sellPrice)} / Oz
            </span>
          </div>
        </div>
      </div>

      {/* VND/Lượng conversion section */}
      <div className="border-t pt-4">
        <h4 className="mb-1 text-sm font-medium text-gray-700">Converted to VND / Lượng</h4>
        {exchangeRate ? (
          <>
            <p className="mb-3 text-xs text-gray-400">
              Rate: 1 USD = {exchangeRate.transferRate.toLocaleString('vi-VN')} VND (Vietcombank
              transfer)
            </p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Buy</span>
                <span className="font-medium text-green-600">{formatVnd(vndBuy!)} VND</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Sell</span>
                <span className="font-medium text-red-600">{formatVnd(vndSell!)} VND</span>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-400">Exchange rate unavailable</p>
        )}
      </div>
    </div>
  );
};
