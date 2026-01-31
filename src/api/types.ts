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
  access_token: string;
  access_token_expires_in: number;
  refresh_token: string;
  refresh_token_expires_in: number;
  token_type: string;
  user: ApiUser;
}

export interface ApiTransaction {
  id: string;
  user_id: string;
  idempotency_key: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  unit?: 'CHI' | 'LUONG' | 'OZ'; // Optional: defaults to CHI if not provided
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
  unit?: 'CHI' | 'LUONG' | 'OZ';
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

/**
 * API response for current price (snake_case from backend)
 */
export interface ApiCurrentPrice {
  provider: string;
  buy_price: number;
  sell_price: number;
  unit: string;
  unit_display_name: string;
  currency: string;
  updated_at: string;
}

/**
 * API response for all current prices
 */
export interface ApiAllPricesResponse {
  timestamp: string;
  providers: ApiCurrentPrice[];
}
