import type {
  User,
  LoginResponse,
  Transaction,
  ExchangeRate,
  GoldProviderPrice,
  CurrentGoldPrices,
  WorldGoldPrice,
} from '@/types';
import type {
  ApiUser,
  ApiLoginResponse,
  ApiTransaction,
  ApiExchangeRate,
  ApiGoldProviderPrice,
  ApiCurrentGoldPrices,
  ApiWorldGoldPrice,
} from './types';
import { UserRole, TransactionType } from '@/types';

export function apiUserToUser(apiUser: ApiUser): User {
  return {
    id: apiUser.id,
    email: apiUser.email,
    username: apiUser.username,
    profilePictureUrl: apiUser.profile_picture_url,
    provider: apiUser.provider,
    role: apiUser.role as UserRole,
  };
}

export function apiLoginResponseToLoginResponse(apiResponse: ApiLoginResponse): LoginResponse {
  return {
    token: apiResponse.token,
    tokenType: apiResponse.token_type,
    expiresIn: apiResponse.expires_in,
    user: apiUserToUser(apiResponse.user),
  };
}

export function apiTransactionToTransaction(apiTransaction: ApiTransaction): Transaction {
  return {
    id: apiTransaction.id,
    userId: apiTransaction.user_id,
    idempotencyKey: apiTransaction.idempotency_key,
    type: apiTransaction.type as TransactionType,
    quantity: apiTransaction.quantity,
    pricePerUnit: apiTransaction.price_per_unit,
    currency: apiTransaction.currency,
    totalAmount: apiTransaction.total_amount,
    provider: apiTransaction.provider,
    transactionDate: apiTransaction.transaction_date,
    notes: apiTransaction.notes,
    isDeleted: apiTransaction.is_deleted,
    createdAt: apiTransaction.created_at,
    updatedAt: apiTransaction.updated_at,
  };
}

export function apiExchangeRateToExchangeRate(api: ApiExchangeRate): ExchangeRate {
  return {
    provider: api.provider,
    fromCurrency: api.from_currency,
    toCurrency: api.to_currency,
    buyRate: api.buy_rate,
    transferRate: api.transfer_rate,
    sellRate: api.sell_rate,
    updatedAt: api.updated_at,
  };
}

export function apiGoldProviderPriceToGoldProviderPrice(
  api: ApiGoldProviderPrice
): GoldProviderPrice {
  return {
    provider: api.provider,
    buyPrice: api.buy_price,
    sellPrice: api.sell_price,
    unit: api.unit,
    unitDisplayName: api.unit_display_name,
    currency: api.currency,
    updatedAt: api.updated_at,
  };
}

export function apiCurrentGoldPricesToCurrentGoldPrices(
  api: ApiCurrentGoldPrices
): CurrentGoldPrices {
  return {
    timestamp: api.timestamp,
    providers: api.providers.map(apiGoldProviderPriceToGoldProviderPrice),
  };
}

export function apiWorldGoldPriceToWorldGoldPrice(api: ApiWorldGoldPrice): WorldGoldPrice {
  return {
    provider: api.provider,
    buyPrice: api.buy_price,
    sellPrice: api.sell_price,
    unit: api.unit,
    unitDisplayName: api.unit_display_name,
    currency: api.currency,
    updatedAt: api.updated_at,
  };
}

export function transactionToApiRequest(
  request: import('@/types').CreateTransactionRequest
): import('./types').ApiCreateTransactionRequest {
  return {
    idempotency_key: request.idempotencyKey,
    type: request.type,
    quantity: request.quantity,
    price_per_unit: request.pricePerUnit,
    currency: request.currency,
    provider: request.provider,
    transaction_date: request.transactionDate,
    notes: request.notes,
  };
}
