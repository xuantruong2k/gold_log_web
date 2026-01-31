import type { GoldPrice } from '@/types';
import { PriceCard } from './PriceCard';

interface PriceListProps {
  prices: GoldPrice[];
  onSelectPrice?: (price: GoldPrice) => void;
}

export const PriceList: React.FC<PriceListProps> = ({ prices, onSelectPrice }) => {
  if (prices.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No prices available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {prices.map((price) => (
        <PriceCard
          key={price.provider}
          price={price}
          onSelect={onSelectPrice ? () => onSelectPrice(price) : undefined}
        />
      ))}
    </div>
  );
};
