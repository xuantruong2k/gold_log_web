import type { GoldProviderPrice } from '@/types';

// 1 LƯỢNG = 10 CHỈ
const CHI_PER_LUONG = 10;

interface ProviderPriceCardProps {
  price: GoldProviderPrice;
}

export const ProviderPriceCard = ({ price }: ProviderPriceCardProps) => {
  const formatVnd = (value: number) => value.toLocaleString('vi-VN');
  const buyPerLuong = price.buyPrice * CHI_PER_LUONG;
  const sellPerLuong = price.sellPrice * CHI_PER_LUONG;
  const updatedTime = new Date(price.updatedAt).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900">{price.provider}</h3>
      <p className="mb-4 text-xs text-gray-400">Updated {updatedTime}</p>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Buy</span>
          <span className="font-medium text-green-600">{formatVnd(buyPerLuong)} VND</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-gray-500">Sell</span>
          <span className="font-medium text-red-600">{formatVnd(sellPerLuong)} VND</span>
        </div>
      </div>
      <p className="mt-3 text-xs text-gray-400">per Lượng</p>
    </div>
  );
};
