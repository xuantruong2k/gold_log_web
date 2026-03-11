export interface GoldProviderPrice {
  provider: string;
  buyPrice: number;
  sellPrice: number;
  unit: string;
  unitDisplayName: string;
  currency: string;
  updatedAt: string;
}

export interface CurrentGoldPrices {
  timestamp: string;
  providers: GoldProviderPrice[];
}

export interface WorldGoldPrice {
  provider: string;
  buyPrice: number;
  sellPrice: number;
  unit: string;
  unitDisplayName: string;
  currency: string;
  updatedAt: string;
}
