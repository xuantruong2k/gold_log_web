import { describe, it, expect } from 'vitest';
import {
  apiUserToUser,
  apiLoginResponseToLoginResponse,
  apiTransactionToTransaction,
  transactionToApiRequest,
  apiPriceToGoldPrice,
  apiAllPricesToAllPricesResponse,
} from './transformers';
import type {
  ApiUser,
  ApiLoginResponse,
  ApiTransaction,
  ApiCurrentPrice,
  ApiAllPricesResponse,
} from './types';
import { GoldUnit, TransactionType, UserRole } from '@/types';

describe('apiUserToUser', () => {
  it('should transform API user to domain user', () => {
    const apiUser: ApiUser = {
      id: 'user-123',
      email: 'test@example.com',
      username: 'Test User',
      profile_picture_url: 'https://example.com/avatar.jpg',
      provider: 'google',
      role: 'USER',
    };

    const result = apiUserToUser(apiUser);

    expect(result).toEqual({
      id: 'user-123',
      email: 'test@example.com',
      username: 'Test User',
      profilePictureUrl: 'https://example.com/avatar.jpg',
      provider: 'google',
      role: UserRole.USER,
    });
  });
});

describe('apiLoginResponseToLoginResponse', () => {
  it('should transform API login response to domain login response', () => {
    const apiResponse: ApiLoginResponse = {
      token: 'jwt-token-here',
      token_type: 'Bearer',
      expires_in: 3600,
      user: {
        id: 'user-123',
        email: 'test@example.com',
        username: 'Test User',
        provider: 'google',
        role: 'USER',
      },
    };

    const result = apiLoginResponseToLoginResponse(apiResponse);

    expect(result.token).toBe('jwt-token-here');
    expect(result.tokenType).toBe('Bearer');
    expect(result.expiresIn).toBe(3600);
    expect(result.user.email).toBe('test@example.com');
  });
});

describe('apiTransactionToTransaction', () => {
  it('should transform API transaction to domain transaction', () => {
    const apiTransaction: ApiTransaction = {
      id: 'tx-123',
      user_id: 'user-123',
      idempotency_key: '550e8400-e29b-41d4-a716-446655440000',
      type: 'BUY',
      quantity: 10.5,
      unit: 'CHI',
      price_per_unit: 7500000,
      currency: 'VND',
      total_amount: 78750000,
      provider: 'SJC',
      transaction_date: '2026-01-31T10:00:00Z',
      notes: 'Test transaction',
      is_deleted: false,
      created_at: '2026-01-31T10:00:00Z',
      updated_at: '2026-01-31T10:00:00Z',
    };

    const result = apiTransactionToTransaction(apiTransaction);

    expect(result).toEqual({
      id: 'tx-123',
      userId: 'user-123',
      idempotencyKey: '550e8400-e29b-41d4-a716-446655440000',
      type: TransactionType.BUY,
      quantity: 10.5,
      unit: GoldUnit.CHI,
      pricePerUnit: 7500000,
      currency: 'VND',
      totalAmount: 78750000,
      provider: 'SJC',
      transactionDate: '2026-01-31T10:00:00Z',
      notes: 'Test transaction',
      isDeleted: false,
      createdAt: '2026-01-31T10:00:00Z',
      updatedAt: '2026-01-31T10:00:00Z',
    });
  });
});

describe('transactionToApiRequest', () => {
  it('should transform domain transaction request to API request', () => {
    const request = {
      idempotencyKey: '550e8400-e29b-41d4-a716-446655440000',
      type: TransactionType.BUY,
      quantity: 10.5,
      unit: GoldUnit.CHI,
      pricePerUnit: 7500000,
      currency: 'VND',
      provider: 'SJC',
      transactionDate: '2026-01-31T10:00:00Z',
      notes: 'Test transaction',
    };

    const result = transactionToApiRequest(request);

    expect(result).toEqual({
      idempotency_key: '550e8400-e29b-41d4-a716-446655440000',
      type: 'BUY',
      quantity: 10.5,
      unit: 'CHI',
      price_per_unit: 7500000,
      currency: 'VND',
      provider: 'SJC',
      transaction_date: '2026-01-31T10:00:00Z',
      notes: 'Test transaction',
    });
  });
});

describe('apiPriceToGoldPrice', () => {
  it('should transform API price to domain price', () => {
    const apiPrice: ApiCurrentPrice = {
      provider: 'SJC',
      buy_price: 7450000,
      sell_price: 7500000,
      unit: 'CHI',
      unit_display_name: 'Chỉ',
      currency: 'VND',
      updated_at: '2026-01-31T14:25:00Z',
    };

    const result = apiPriceToGoldPrice(apiPrice);

    expect(result.provider).toBe('SJC');
    expect(result.buyPrice).toBe(7450000);
    expect(result.sellPrice).toBe(7500000);
    expect(result.unit).toBe('CHI');
    expect(result.unitDisplayName).toBe('Chỉ');
    expect(result.currency).toBe('VND');
    expect(result.updatedAt).toBe('2026-01-31T14:25:00Z');
    expect(result.spread).toBe(50000);
    expect(result.spreadPercentage).toBeCloseTo(0.67, 2);
  });

  it('should calculate spread and spread percentage correctly', () => {
    const apiPrice: ApiCurrentPrice = {
      provider: 'PNJ',
      buy_price: 7460000,
      sell_price: 7490000,
      unit: 'CHI',
      unit_display_name: 'Chỉ',
      currency: 'VND',
      updated_at: '2026-01-31T14:25:00Z',
    };

    const result = apiPriceToGoldPrice(apiPrice);

    expect(result.spread).toBe(30000);
    expect(result.spreadPercentage).toBeCloseTo(0.4, 2);
  });

  it('should handle international prices (USD)', () => {
    const apiPrice: ApiCurrentPrice = {
      provider: 'WORLD_GOLD',
      buy_price: 2050.5,
      sell_price: 2055.75,
      unit: 'OZ',
      unit_display_name: 'Troy Ounce',
      currency: 'USD',
      updated_at: '2026-01-31T14:25:00Z',
    };

    const result = apiPriceToGoldPrice(apiPrice);

    expect(result.provider).toBe('WORLD_GOLD');
    expect(result.buyPrice).toBe(2050.5);
    expect(result.sellPrice).toBe(2055.75);
    expect(result.unit).toBe('OZ');
    expect(result.currency).toBe('USD');
    expect(result.spread).toBeCloseTo(5.25, 2);
    expect(result.spreadPercentage).toBeCloseTo(0.26, 2);
  });
});

describe('apiAllPricesToAllPricesResponse', () => {
  it('should transform API all prices response to domain model', () => {
    const apiResponse: ApiAllPricesResponse = {
      timestamp: '2026-01-31T14:30:00Z',
      providers: [
        {
          provider: 'SJC',
          buy_price: 7450000,
          sell_price: 7500000,
          unit: 'CHI',
          unit_display_name: 'Chỉ',
          currency: 'VND',
          updated_at: '2026-01-31T14:25:00Z',
        },
        {
          provider: 'PNJ',
          buy_price: 7460000,
          sell_price: 7490000,
          unit: 'CHI',
          unit_display_name: 'Chỉ',
          currency: 'VND',
          updated_at: '2026-01-31T14:25:00Z',
        },
      ],
    };

    const result = apiAllPricesToAllPricesResponse(apiResponse);

    expect(result.timestamp).toBe('2026-01-31T14:30:00Z');
    expect(result.prices).toHaveLength(2);
    expect(result.prices[0].provider).toBe('SJC');
    expect(result.prices[1].provider).toBe('PNJ');
    expect(result.prices[0].spread).toBe(50000);
    expect(result.prices[1].spread).toBe(30000);
  });

  it('should handle empty providers array', () => {
    const apiResponse: ApiAllPricesResponse = {
      timestamp: '2026-01-31T14:30:00Z',
      providers: [],
    };

    const result = apiAllPricesToAllPricesResponse(apiResponse);

    expect(result.timestamp).toBe('2026-01-31T14:30:00Z');
    expect(result.prices).toHaveLength(0);
  });
});
