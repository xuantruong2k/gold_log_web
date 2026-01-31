import { useGoldPrices } from '@/hooks/useGoldPrices';
import { PriceComparison } from '@/components/features/prices/PriceComparison';
import { PriceList } from '@/components/features/prices/PriceList';
import { formatRelativeTime } from '@/utils/format';
import type { GoldPrice } from '@/types';

export const GoldPricesPage: React.FC = () => {
  const { data, isPending, error, refetch } = useGoldPrices({
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  });

  const handleRefresh = () => {
    refetch();
  };

  const handleSelectPrice = (price: GoldPrice) => {
    // Future: Navigate to transaction form with prefilled data
    console.log('Selected price:', price);
  };

  if (isPending) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-64 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="rounded-lg bg-red-50 p-6 text-center">
          <h2 className="text-xl font-semibold text-red-900 mb-2">Failed to Load Prices</h2>
          <p className="text-red-700 mb-4">
            {error instanceof Error ? error.message : 'An error occurred while loading gold prices'}
          </p>
          <button
            onClick={handleRefresh}
            className="rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data || !data.prices || data.prices.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="rounded-lg bg-yellow-50 p-6 text-center">
          <h2 className="text-xl font-semibold text-yellow-900 mb-2">No Prices Available</h2>
          <p className="text-yellow-700 mb-4">
            Gold prices are currently not available. Please try again later.
          </p>
          <button
            onClick={handleRefresh}
            className="rounded-md bg-yellow-600 px-4 py-2 text-white hover:bg-yellow-700"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gold Prices</h1>
          <p className="text-sm text-gray-600 mt-1">
            Last updated: {formatRelativeTime(data.timestamp)}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 flex items-center gap-2"
        >
          <svg
            className="h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>

      {/* Price Comparison */}
      <PriceComparison prices={data.prices} />

      {/* Price List */}
      <PriceList prices={data.prices} onSelectPrice={handleSelectPrice} />

      {/* Info Notice */}
      <div className="mt-6 rounded-md bg-yellow-50 p-4 text-sm text-yellow-800">
        <p>
          ℹ️ Prices are indicative and may vary. Please verify with providers before making
          transactions.
        </p>
      </div>
    </div>
  );
};

export default GoldPricesPage;
