import type { User, LoginResponse, Transaction } from '@/types';
import type { ApiUser, ApiLoginResponse, ApiTransaction } from './types';
import { UserRole, TransactionType, GoldUnit } from '@/types';

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
