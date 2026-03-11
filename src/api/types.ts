// API types match backend snake_case convention
export interface ApiUser {
  id: string;
  email: string;
  username: string;
  profile_picture_url?: string;
  provider: string;
  role: string;
}

export interface ApiLoginResponse {
  token: string;
  token_type: string;
  expires_in: number;
  user: ApiUser;
}

export interface ApiTransaction {
  id: string;
  user_id: string;
  idempotency_key: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price_per_unit: number;
  currency: string;
  total_amount: number;
  provider?: string;
  transaction_date: string;
  notes?: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiCreateTransactionRequest {
  idempotency_key: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price_per_unit: number;
  currency?: string;
  provider?: string;
  transaction_date?: string;
  notes?: string;
}

export interface ApiPaginationMetadata {
  current_page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface ApiPagedResponse<T> {
  data: T[];
  pagination: ApiPaginationMetadata;
}

export interface ApiExchangeRate {
  provider: string;
  from_currency: string;
  to_currency: string;
  buy_rate: number;
  transfer_rate: number;
  sell_rate: number;
  updated_at: string;
}

export interface ApiGoldProviderPrice {
  provider: string;
  buy_price: number;
  sell_price: number;
  unit: string;
  unit_display_name: string;
  currency: string;
  updated_at: string;
}

export interface ApiCurrentGoldPrices {
  timestamp: string;
  providers: ApiGoldProviderPrice[];
}

export interface ApiWorldGoldPrice {
  provider: string;
  buy_price: number;
  sell_price: number;
  unit: string;
  unit_display_name: string;
  currency: string;
  updated_at: string;
}
