import { useCurrentGoldPrices, useWorldGoldPrice } from '@/hooks/useGoldPrices';
import { useUsdVndRate } from '@/hooks/useExchangeRate';
import { ProviderPriceCard } from '@/components/features/goldPrices/ProviderPriceCard';
import { WorldPriceCard } from '@/components/features/goldPrices/WorldPriceCard';

export const GoldPricesPage = () => {
  const { data: currentPrices, isLoading: loadingCurrent } = useCurrentGoldPrices();
  const { data: worldPrice, isLoading: loadingWorld } = useWorldGoldPrice();
  const { data: exchangeRate } = useUsdVndRate();

  const isLoading = loadingCurrent || loadingWorld;

  const lastUpdated = currentPrices?.timestamp
    ? new Date(currentPrices.timestamp).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Gold Prices</h1>
        {lastUpdated && <p className="text-sm text-gray-400">Last updated: {lastUpdated}</p>}
      </div>

      {/* Vietnamese providers */}
      {currentPrices && (
        <section>
          <h2 className="mb-4 text-xl font-semibold text-gray-700">
            Vietnamese Gold Prices{' '}
            <span className="text-sm font-normal text-gray-400">(VND / Lượng)</span>
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {currentPrices.providers.map((price) => (
              <ProviderPriceCard key={price.provider} price={price} />
            ))}
          </div>
        </section>
      )}

      {/* World price + VND conversion */}
      {worldPrice && (
        <section>
          <h2 className="mb-4 text-xl font-semibold text-gray-700">
            World Gold Price <span className="text-sm font-normal text-gray-400">(USD / Oz)</span>
          </h2>
          <div className="max-w-md">
            <WorldPriceCard worldPrice={worldPrice} exchangeRate={exchangeRate} />
          </div>
        </section>
      )}
    </div>
  );
};

export default GoldPricesPage;
