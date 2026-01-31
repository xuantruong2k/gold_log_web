import { apiClient } from './client';
import { apiAllPricesToAllPricesResponse, apiPriceToGoldPrice } from './transformers';
import type { AllPricesResponse, GoldPrice, GoldProvider } from '@/types';
import type { ApiAllPricesResponse, ApiCurrentPrice } from './types';

export const priceApi = {
  /**
   * Get all current prices from all providers
   */
  async getAllCurrentPrices(): Promise<AllPricesResponse> {
    const response = await apiClient.get<ApiAllPricesResponse>('/prices/current');
    return apiAllPricesToAllPricesResponse(response.data);
  },

  /**
   * Get current price from specific provider
   */
  async getProviderPrice(provider: GoldProvider): Promise<GoldPrice> {
    const response = await apiClient.get<ApiCurrentPrice>(`/prices/provider/${provider}`);
    return apiPriceToGoldPrice(response.data);
  },
};
