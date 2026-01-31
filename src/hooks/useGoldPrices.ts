import { useQuery } from '@tanstack/react-query';
import { priceApi } from '@/api/price.api';
import type { GoldProvider } from '@/types';

interface UseGoldPricesOptions {
  refetchInterval?: number;
}

/**
 * Fetch all current gold prices
 */
export function useGoldPrices(options?: UseGoldPricesOptions) {
  return useQuery({
    queryKey: ['goldPrices', 'current'],
    queryFn: () => priceApi.getAllCurrentPrices(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: options?.refetchInterval || 60 * 1000, // 1 minute default
    refetchOnWindowFocus: true,
  });
}

/**
 * Fetch price from specific provider
 */
export function useProviderPrice(provider: GoldProvider) {
  return useQuery({
    queryKey: ['goldPrices', 'provider', provider],
    queryFn: () => priceApi.getProviderPrice(provider),
    staleTime: 30 * 1000,
    enabled: !!provider,
    retry: 2, // Retry failed requests 2 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
    refetchOnWindowFocus: false, // Don't refetch on window focus to reduce load
    refetchInterval: 60 * 1000, // Refetch every minute
    // Return undefined on error instead of throwing
    onError: (error) => {
      console.warn('Failed to fetch gold price:', error);
    },
  });
}
