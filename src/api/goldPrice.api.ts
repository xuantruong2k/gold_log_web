import { apiClient } from './client';
import {
  apiCurrentGoldPricesToCurrentGoldPrices,
  apiWorldGoldPriceToWorldGoldPrice,
} from './transformers';
import type { ApiCurrentGoldPrices, ApiWorldGoldPrice } from './types';
import type { CurrentGoldPrices, WorldGoldPrice } from '@/types';

export const goldPriceApi = {
  async getCurrentPrices(): Promise<CurrentGoldPrices> {
    const response = await apiClient.get<ApiCurrentGoldPrices>('/prices/current');
    return apiCurrentGoldPricesToCurrentGoldPrices(response.data);
  },

  async getWorldPrice(): Promise<WorldGoldPrice> {
    const response = await apiClient.get<ApiWorldGoldPrice>('/prices/world');
    return apiWorldGoldPriceToWorldGoldPrice(response.data);
  },
};
