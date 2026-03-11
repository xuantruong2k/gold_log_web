import { useQuery } from '@tanstack/react-query';
import { goldPriceApi } from '@/api/goldPrice.api';

const QUERY_KEYS = {
  current: () => ['gold-prices', 'current'],
  world: () => ['gold-prices', 'world'],
};

/**
 * Hook to fetch current Vietnamese gold prices (SJC, PNJ, SBJ) in VND/CHI.
 */
export function useCurrentGoldPrices() {
  return useQuery({
    queryKey: QUERY_KEYS.current(),
    queryFn: () => goldPriceApi.getCurrentPrices(),
    staleTime: 2 * 60 * 1000, // 2 min — prices update frequently
    retry: 1,
  });
}

/**
 * Hook to fetch the world gold spot price in USD/OZ.
 */
export function useWorldGoldPrice() {
  return useQuery({
    queryKey: QUERY_KEYS.world(),
    queryFn: () => goldPriceApi.getWorldPrice(),
    staleTime: 2 * 60 * 1000, // 2 min
    retry: 1,
  });
}
