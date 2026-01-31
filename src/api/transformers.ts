import type { User, LoginResponse, Transaction, GoldPrice, AllPricesResponse } from '@/types';
import type {
  ApiUser,
  ApiLoginResponse,
  ApiTransaction,
  ApiCurrentPrice,
  ApiAllPricesResponse,
} from './types';
import { UserRole, TransactionType, GoldUnit, GoldProvider } from '@/types';

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
    accessToken: apiResponse.access_token,
    accessTokenExpiresIn: apiResponse.access_token_expires_in,
    refreshToken: apiResponse.refresh_token,
    refreshTokenExpiresIn: apiResponse.refresh_token_expires_in,
    tokenType: apiResponse.token_type,
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
    unit: apiTransaction.unit as GoldUnit,
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

export function transactionToApiRequest(
  request: import('@/types').CreateTransactionRequest
): import('./types').ApiCreateTransactionRequest {
  return {
    idempotency_key: request.idempotencyKey,
    type: request.type,
    quantity: request.quantity,
    unit: request.unit,
    price_per_unit: request.pricePerUnit,
    currency: request.currency,
    provider: request.provider,
    transaction_date: request.transactionDate,
    notes: request.notes,
  };
}

/**
 * Transform API price to domain price model
 */
export function apiPriceToGoldPrice(apiPrice: ApiCurrentPrice): GoldPrice {
  const spread = apiPrice.sell_price - apiPrice.buy_price;
  const spreadPercentage = (spread / apiPrice.buy_price) * 100;

  return {
    provider: apiPrice.provider as GoldProvider,
    buyPrice: apiPrice.buy_price,
    sellPrice: apiPrice.sell_price,
    unit: apiPrice.unit,
    unitDisplayName: apiPrice.unit_display_name,
    currency: apiPrice.currency,
    updatedAt: apiPrice.updated_at,
    spread,
    spreadPercentage,
  };
}

/**
 * Transform API all prices response to domain model
 */
export function apiAllPricesToAllPricesResponse(
  apiResponse: ApiAllPricesResponse
): AllPricesResponse {
  return {
    timestamp: apiResponse.timestamp,
    prices: apiResponse.providers.map(apiPriceToGoldPrice),
  };
}
