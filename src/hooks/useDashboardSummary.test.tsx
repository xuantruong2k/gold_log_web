import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useDashboardSummary } from './useDashboardSummary';
import { useTransactions } from './useTransactions';
import { TransactionType } from '@/types/transaction.types';
import type { Transaction } from '@/types/transaction.types';
import { vi } from 'vitest';

// Mock the useTransactions hook
vi.mock('./useTransactions');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const mockTransaction = (overrides: Partial<Transaction>): Transaction => ({
  id: '1',
  userId: 'user1',
  idempotencyKey: 'key1',
  type: TransactionType.BUY,
  quantity: 10,
  pricePerUnit: 75000000,
  currency: 'VND',
  totalAmount: 750000000,
  provider: 'SJC',
  transactionDate: '2026-01-15T10:00:00Z',
  notes: '',
  isDeleted: false,
  createdAt: '2026-01-15T10:00:00Z',
  updatedAt: '2026-01-15T10:00:00Z',
  ...overrides,
});

describe('useDashboardSummary', () => {
  it('should return zero values when no transactions', () => {
    vi.mocked(useTransactions).mockReturnValue({
      data: { data: [], pagination: {} as any },
      isLoading: false,
      error: null,
    } as any);

    const { result } = renderHook(() => useDashboardSummary(), {
      wrapper: createWrapper(),
    });

    expect(result.current.summary.totalQuantity).toBe(0);
    expect(result.current.summary.totalInvested).toBe(0);
    expect(result.current.summary.totalSold).toBe(0);
    expect(result.current.summary.currentHoldings).toBe(0);
    expect(result.current.summary.averageBuyPrice).toBe(0);
    expect(result.current.summary.transactionCount).toBe(0);
  });

  it('should calculate total invested for BUY transactions', () => {
    const transactions = [
      mockTransaction({ type: TransactionType.BUY, totalAmount: 750000000 }),
      mockTransaction({ type: TransactionType.BUY, totalAmount: 500000000 }),
    ];

    vi.mocked(useTransactions).mockReturnValue({
      data: { data: transactions, pagination: {} as any },
      isLoading: false,
      error: null,
    } as any);

    const { result } = renderHook(() => useDashboardSummary(), {
      wrapper: createWrapper(),
    });

    expect(result.current.summary.totalInvested).toBe(1250000000); // 750M + 500M
  });

  it('should calculate total sold for SELL transactions', () => {
    const transactions = [
      mockTransaction({ type: TransactionType.SELL, totalAmount: 800000000 }),
      mockTransaction({ type: TransactionType.SELL, totalAmount: 400000000 }),
    ];

    vi.mocked(useTransactions).mockReturnValue({
      data: { data: transactions, pagination: {} as any },
      isLoading: false,
      error: null,
    } as any);

    const { result } = renderHook(() => useDashboardSummary(), {
      wrapper: createWrapper(),
    });

    expect(result.current.summary.totalSold).toBe(1200000000); // 800M + 400M
  });

  it('should calculate current holdings (BUY - SELL)', () => {
    const transactions = [
      mockTransaction({ type: TransactionType.BUY, quantity: 10 }),
      mockTransaction({ type: TransactionType.BUY, quantity: 15 }),
      mockTransaction({ type: TransactionType.SELL, quantity: 8 }),
    ];

    vi.mocked(useTransactions).mockReturnValue({
      data: { data: transactions, pagination: {} as any },
      isLoading: false,
      error: null,
    } as any);

    const { result } = renderHook(() => useDashboardSummary(), {
      wrapper: createWrapper(),
    });

    expect(result.current.summary.currentHoldings).toBe(17); // 10 + 15 - 8
  });

  it('should calculate average buy price correctly', () => {
    const transactions = [
      mockTransaction({
        type: TransactionType.BUY,
        quantity: 10,
        totalAmount: 750000000,
      }), // 75M per unit
      mockTransaction({
        type: TransactionType.BUY,
        quantity: 10,
        totalAmount: 800000000,
      }), // 80M per unit
    ];

    vi.mocked(useTransactions).mockReturnValue({
      data: { data: transactions, pagination: {} as any },
      isLoading: false,
      error: null,
    } as any);

    const { result } = renderHook(() => useDashboardSummary(), {
      wrapper: createWrapper(),
    });

    // Average = (750M + 800M) / (10 + 10) = 1550M / 20 = 77.5M
    expect(result.current.summary.averageBuyPrice).toBe(77500000);
  });

  it('should return 0 average price when no BUY transactions', () => {
    const transactions = [mockTransaction({ type: TransactionType.SELL, quantity: 5 })];

    vi.mocked(useTransactions).mockReturnValue({
      data: { data: transactions, pagination: {} as any },
      isLoading: false,
      error: null,
    } as any);

    const { result } = renderHook(() => useDashboardSummary(), {
      wrapper: createWrapper(),
    });

    expect(result.current.summary.averageBuyPrice).toBe(0);
  });

  it('should count total transactions correctly', () => {
    const transactions = [
      mockTransaction({ type: TransactionType.BUY }),
      mockTransaction({ type: TransactionType.BUY }),
      mockTransaction({ type: TransactionType.SELL }),
      mockTransaction({ type: TransactionType.SELL }),
      mockTransaction({ type: TransactionType.BUY }),
    ];

    vi.mocked(useTransactions).mockReturnValue({
      data: { data: transactions, pagination: {} as any },
      isLoading: false,
      error: null,
    } as any);

    const { result } = renderHook(() => useDashboardSummary(), {
      wrapper: createWrapper(),
    });

    expect(result.current.summary.transactionCount).toBe(5);
  });

  it('should handle complex scenario with mixed transactions', () => {
    const transactions = [
      // Buy 100 chỉ at 75M each = 7.5B
      mockTransaction({
        type: TransactionType.BUY,
        quantity: 100,
        totalAmount: 7500000000,
      }),
      // Buy 50 chỉ at 76M each = 3.8B
      mockTransaction({
        type: TransactionType.BUY,
        quantity: 50,
        totalAmount: 3800000000,
      }),
      // Sell 30 chỉ at 77M each = 2.31B
      mockTransaction({
        type: TransactionType.SELL,
        quantity: 30,
        totalAmount: 2310000000,
      }),
      // Sell 20 chỉ at 78M each = 1.56B
      mockTransaction({
        type: TransactionType.SELL,
        quantity: 20,
        totalAmount: 1560000000,
      }),
    ];

    vi.mocked(useTransactions).mockReturnValue({
      data: { data: transactions, pagination: {} as any },
      isLoading: false,
      error: null,
    } as any);

    const { result } = renderHook(() => useDashboardSummary(), {
      wrapper: createWrapper(),
    });

    const { summary } = result.current;

    // Current holdings: 100 + 50 - 30 - 20 = 100 chỉ
    expect(summary.currentHoldings).toBe(100);

    // Total invested: 7.5B + 3.8B = 11.3B
    expect(summary.totalInvested).toBe(11300000000);

    // Total sold: 2.31B + 1.56B = 3.87B
    expect(summary.totalSold).toBe(3870000000);

    // Average buy price: 11.3B / 150 = 75,333,333.33
    expect(summary.averageBuyPrice).toBeCloseTo(75333333.33, 2);

    // Transaction count: 4
    expect(summary.transactionCount).toBe(4);
  });

  it('should handle decimal quantities correctly', () => {
    const transactions = [
      mockTransaction({
        type: TransactionType.BUY,
        quantity: 10.5,
        totalAmount: 787500000,
      }), // 75M per unit
      mockTransaction({
        type: TransactionType.SELL,
        quantity: 3.25,
        totalAmount: 243750000,
      }), // 75M per unit
    ];

    vi.mocked(useTransactions).mockReturnValue({
      data: { data: transactions, pagination: {} as any },
      isLoading: false,
      error: null,
    } as any);

    const { result } = renderHook(() => useDashboardSummary(), {
      wrapper: createWrapper(),
    });

    // Current holdings: 10.5 - 3.25 = 7.25
    expect(result.current.summary.currentHoldings).toBe(7.25);
  });

  it('should pass through loading state', () => {
    vi.mocked(useTransactions).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    const { result } = renderHook(() => useDashboardSummary(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });

  it('should pass through error state', () => {
    const error = new Error('Failed to fetch');
    vi.mocked(useTransactions).mockReturnValue({
      data: undefined,
      isLoading: false,
      error,
    } as any);

    const { result } = renderHook(() => useDashboardSummary(), {
      wrapper: createWrapper(),
    });

    expect(result.current.error).toBe(error);
  });

  it('should handle very large numbers without overflow', () => {
    const transactions = [
      mockTransaction({
        type: TransactionType.BUY,
        quantity: 1000,
        totalAmount: 999999999999999, // Max safe integer territory
      }),
    ];

    vi.mocked(useTransactions).mockReturnValue({
      data: { data: transactions, pagination: {} as any },
      isLoading: false,
      error: null,
    } as any);

    const { result } = renderHook(() => useDashboardSummary(), {
      wrapper: createWrapper(),
    });

    expect(result.current.summary.totalInvested).toBe(999999999999999);
    expect(result.current.summary.averageBuyPrice).toBe(999999999999.999);
  });

  it('should handle negative holdings (oversold scenario)', () => {
    const transactions = [
      mockTransaction({ type: TransactionType.BUY, quantity: 10 }),
      mockTransaction({ type: TransactionType.SELL, quantity: 15 }), // Sold more than owned
    ];

    vi.mocked(useTransactions).mockReturnValue({
      data: { data: transactions, pagination: {} as any },
      isLoading: false,
      error: null,
    } as any);

    const { result } = renderHook(() => useDashboardSummary(), {
      wrapper: createWrapper(),
    });

    // Should handle negative holdings
    expect(result.current.summary.currentHoldings).toBe(-5);
  });
});
