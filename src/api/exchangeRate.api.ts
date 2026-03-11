import { apiClient } from './client';
import { apiExchangeRateToExchangeRate } from './transformers';
import type { ApiExchangeRate } from './types';
import type { ExchangeRate } from '@/types';

export const exchangeRateApi = {
  async getUsdVnd(): Promise<ExchangeRate> {
    const response = await apiClient.get<ApiExchangeRate>('/exchange-rates/usd-vnd');
    return apiExchangeRateToExchangeRate(response.data);
  },
};
