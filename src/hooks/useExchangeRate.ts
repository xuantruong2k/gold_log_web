import { useQuery } from '@tanstack/react-query';
import { exchangeRateApi } from '@/api/exchangeRate.api';

const QUERY_KEYS = {
  usdVnd: () => ['exchange-rate', 'usd-vnd'],
};

/**
 * Hook to fetch the latest USD/VND exchange rate from Vietcombank.
 * Data is served from the backend cache (refreshed every 30 minutes).
 */
export function useUsdVndRate() {
  return useQuery({
    queryKey: QUERY_KEYS.usdVnd(),
    queryFn: () => exchangeRateApi.getUsdVnd(),
    staleTime: 30 * 60 * 1000, // 30 min — matches backend cache refresh interval
    retry: 1, // 503 on provider failure; one retry is sufficient
  });
}
