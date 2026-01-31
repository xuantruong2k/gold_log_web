/**
 * Gold price provider names
 */
export enum GoldProvider {
  SJC = 'SJC',
  PNJ = 'PNJ',
  SBJ = 'SBJ',
  WORLD_GOLD = 'WORLD_GOLD',
}

/**
 * Current gold price from a provider (domain model)
 */
export interface GoldPrice {
  provider: GoldProvider;
  buyPrice: number;
  sellPrice: number;
  unit: string;
  unitDisplayName: string;
  currency: string;
  updatedAt: string;
  spread: number; // Calculated: sellPrice - buyPrice
  spreadPercentage: number; // Calculated: (spread / buyPrice) * 100
}

/**
 * Response containing all current prices
 */
export interface AllPricesResponse {
  timestamp: string;
  prices: GoldPrice[];
}

/**
 * Price comparison data
 */
export interface PriceComparison {
  unit: string;
  currency: string;
  lowestBuyPrice: GoldPrice;
  highestBuyPrice: GoldPrice;
  lowestSellPrice: GoldPrice;
  highestSellPrice: GoldPrice;
  averageBuyPrice: number;
  averageSellPrice: number;
}
