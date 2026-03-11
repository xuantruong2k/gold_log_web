# Gold Log Client - Transaction CRUD Operations Implementation Plan

**Plan Version**: 1.0.0
**Created**: January 30, 2026
**Status**: Ready for Implementation
**Dependencies**: OAuth Authentication (plan-oauth-authen.md) must be completed

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Implementation Phases](#implementation-phases)
4. [Phase 1: Transaction API Layer](#phase-1-transaction-api-layer)
5. [Phase 2: Transaction Hooks](#phase-2-transaction-hooks)
6. [Phase 3: Create Transaction Form](#phase-3-create-transaction-form)
7. [Phase 4: Transaction List Display](#phase-4-transaction-list-display)
8. [Phase 5: Transaction Details Modal](#phase-5-transaction-details-modal)
9. [Phase 6: Delete Transaction Functionality](#phase-6-delete-transaction-functionality)
10. [Phase 7: Dashboard Integration](#phase-7-dashboard-integration)
11. [Testing & Verification](#testing--verification)
12. [Troubleshooting](#troubleshooting)

---

## Overview

This plan implements the core transaction CRUD (Create, Read, Update, Delete) operations for the Gold Log application. Users will be able to:

- **Create** new gold transactions (BUY or SELL)
- **Read/View** transaction list with pagination
- **Read/View** individual transaction details
- **Delete** transactions (soft delete with confirmation)

### Architecture Principles

- **Type Safety**: Full TypeScript coverage with strict types
- **State Management**: React Query for server state, local state for UI
- **Form Validation**: Zod schemas with React Hook Form
- **Idempotency**: UUID v4 keys for duplicate prevention
- **Optimistic Updates**: Immediate UI feedback with rollback on errors
- **Error Handling**: User-friendly error messages with retry options

### Key Features

- Real-time total amount calculation (quantity × price)
- Currency support (VND default, USD optional)
- Provider selection (SJC, PNJ, custom)
- Transaction date picker (defaults to now)
- Soft delete with confirmation dialog
- Pagination for transaction list (20 per page)
- Loading states and error handling

---

## Prerequisites

### Completed Work

- ✅ Initial codebase setup (plan-init-codebase.md)
- ✅ OAuth authentication (plan-oauth-authen.md)
- ✅ API client configuration with token management
- ✅ Protected routes and authentication flow

### Required Backend Endpoints

Ensure your backend has these endpoints implemented:

```
POST   /api/v1/transactions          - Create transaction
GET    /api/v1/transactions          - List transactions (paginated)
GET    /api/v1/transactions/{id}     - Get single transaction
DELETE /api/v1/transactions/{id}     - Delete transaction (soft)
```

### Environment Variables

Verify `.env.development`:

```bash
VITE_API_BASE_URL=http://localhost:8080/api/v1
```

---

## Implementation Phases

| Phase     | Component                 | Estimated Time | Priority |
| --------- | ------------------------- | -------------- | -------- |
| 1         | Transaction API Layer     | 30 min         | P0       |
| 2         | Transaction Hooks         | 45 min         | P0       |
| 3         | Create Transaction Form   | 1 hour         | P0       |
| 4         | Transaction List Display  | 1 hour         | P0       |
| 5         | Transaction Details Modal | 30 min         | P0       |
| 6         | Delete Transaction        | 30 min         | P0       |
| 7         | Dashboard Integration     | 45 min         | P0       |
| **Total** |                           | **~5 hours**   |          |

---

## Phase 1: Transaction API Layer

### 1.1 Create Transaction API Types

**File**: `src/api/types.ts`

Add transaction API types that match backend snake_case format:

```typescript
// API Transaction Types (snake_case - matches backend)
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

export interface ApiPagedResponse<T> {
  data: T[];
  pagination: {
    current_page: number;
    page_size: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}
```

### 1.2 Create Domain Transaction Types

**File**: `src/types/transaction.types.ts`

Create domain types used throughout the frontend (camelCase):

```typescript
export enum TransactionType {
  BUY = 'BUY',
  SELL = 'SELL',
}

export interface Transaction {
  id: string;
  userId: string;
  idempotencyKey: string;
  type: TransactionType;
  quantity: number;
  pricePerUnit: number;
  currency: string;
  totalAmount: number;
  provider?: string;
  transactionDate: string;
  notes?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionRequest {
  idempotencyKey: string;
  type: TransactionType;
  quantity: number;
  pricePerUnit: number;
  currency?: string;
  provider?: string;
  transactionDate?: string;
  notes?: string;
}

export interface TransactionFilters {
  type?: TransactionType;
  startDate?: string;
  endDate?: string;
  provider?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PagedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}
```

### 1.3 Create Type Transformers

**File**: `src/api/transformers.ts`

Transform between API and domain types:

```typescript
import type { ApiTransaction, ApiCreateTransactionRequest } from './types';
import type { Transaction, CreateTransactionRequest } from '@/types/transaction.types';
import { TransactionType } from '@/types/transaction.types';

export function apiTransactionToTransaction(api: ApiTransaction): Transaction {
  return {
    id: api.id,
    userId: api.user_id,
    idempotencyKey: api.idempotency_key,
    type: api.type as TransactionType,
    quantity: api.quantity,
    pricePerUnit: api.price_per_unit,
    currency: api.currency,
    totalAmount: api.total_amount,
    provider: api.provider,
    transactionDate: api.transaction_date,
    notes: api.notes,
    isDeleted: api.is_deleted,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
  };
}

export function transactionToApiRequest(
  request: CreateTransactionRequest
): ApiCreateTransactionRequest {
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
```

### 1.4 Create Transaction API Client

**File**: `src/api/transaction.api.ts`

```typescript
import { v4 as uuidv4 } from 'uuid';
import { apiClient } from './client';
import { apiTransactionToTransaction, transactionToApiRequest } from './transformers';
import type {
  Transaction,
  CreateTransactionRequest,
  TransactionFilters,
  PaginationParams,
  PagedResponse,
} from '@/types/transaction.types';
import type { ApiTransaction, ApiPagedResponse } from './types';

export const transactionApi = {
  /**
   * Get paginated list of transactions with optional filters
   */
  async getTransactions(
    filters?: TransactionFilters,
    pagination: PaginationParams = { page: 1, pageSize: 20 }
  ): Promise<PagedResponse<Transaction>> {
    const params = new URLSearchParams();
    params.append('page', pagination.page.toString());
    params.append('pageSize', pagination.pageSize.toString());

    if (filters?.type) params.append('type', filters.type);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.provider) params.append('provider', filters.provider);

    const response = await apiClient.get<ApiPagedResponse<ApiTransaction>>(
      `/transactions?${params.toString()}`
    );

    return {
      data: response.data.data.map(apiTransactionToTransaction),
      pagination: {
        currentPage: response.data.pagination.current_page,
        pageSize: response.data.pagination.page_size,
        totalItems: response.data.pagination.total_items,
        totalPages: response.data.pagination.total_pages,
        hasNext: response.data.pagination.has_next,
        hasPrevious: response.data.pagination.has_previous,
      },
    };
  },

  /**
   * Get single transaction by ID
   */
  async getTransaction(id: string): Promise<Transaction> {
    const response = await apiClient.get<ApiTransaction>(`/transactions/${id}`);
    return apiTransactionToTransaction(response.data);
  },

  /**
   * Create new transaction with automatic idempotency key generation
   */
  async createTransaction(
    data: Omit<CreateTransactionRequest, 'idempotencyKey'>
  ): Promise<Transaction> {
    const requestData: CreateTransactionRequest = {
      ...data,
      idempotencyKey: uuidv4(), // Generate fresh UUID for each request
    };

    const apiRequest = transactionToApiRequest(requestData);
    const response = await apiClient.post<ApiTransaction>('/transactions', apiRequest);

    return apiTransactionToTransaction(response.data);
  },

  /**
   * Delete transaction (soft delete)
   */
  async deleteTransaction(id: string): Promise<void> {
    await apiClient.delete(`/transactions/${id}`);
  },
};
```

### 1.5 Verification

Run type checking:

```bash
npx tsc --noEmit
```

Expected: No errors related to transaction types.

---

## Phase 2: Transaction Hooks

### 2.1 Create useTransactions Hook

**File**: `src/hooks/useTransactions.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionApi } from '@/api/transaction.api';
import type {
  Transaction,
  CreateTransactionRequest,
  TransactionFilters,
  PaginationParams,
} from '@/types/transaction.types';

const QUERY_KEYS = {
  transactions: (filters?: TransactionFilters, pagination?: PaginationParams) => [
    'transactions',
    filters,
    pagination,
  ],
  transaction: (id: string) => ['transaction', id],
};

/**
 * Hook to fetch paginated transactions with optional filters
 */
export function useTransactions(
  filters?: TransactionFilters,
  pagination: PaginationParams = { page: 1, pageSize: 20 }
) {
  return useQuery({
    queryKey: QUERY_KEYS.transactions(filters, pagination),
    queryFn: () => transactionApi.getTransactions(filters, pagination),
    keepPreviousData: true, // Keep showing old data while fetching new page
    staleTime: 30 * 1000, // Consider data fresh for 30 seconds
  });
}

/**
 * Hook to fetch single transaction by ID
 */
export function useTransaction(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.transaction(id),
    queryFn: () => transactionApi.getTransaction(id),
    enabled: !!id, // Only fetch if id exists
    staleTime: 60 * 1000, // Single transaction stays fresh longer
  });
}

/**
 * Hook to create new transaction
 */
export function useCreateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<CreateTransactionRequest, 'idempotencyKey'>) =>
      transactionApi.createTransaction(data),
    onSuccess: () => {
      // Invalidate all transaction queries to refetch
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}

/**
 * Hook to delete transaction
 */
export function useDeleteTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => transactionApi.deleteTransaction(id),
    onSuccess: () => {
      // Invalidate all transaction queries to refetch
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });
}
```

### 2.2 Create Pagination Hook

**File**: `src/hooks/usePagination.ts`

```typescript
import { useState, useCallback } from 'react';

interface UsePaginationProps {
  initialPage?: number;
  initialPageSize?: number;
}

export function usePagination({ initialPage = 1, initialPageSize = 20 }: UsePaginationProps = {}) {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const nextPage = useCallback(() => {
    setPage((p) => p + 1);
  }, []);

  const prevPage = useCallback(() => {
    setPage((p) => Math.max(1, p - 1));
  }, []);

  const goToPage = useCallback((newPage: number) => {
    setPage(Math.max(1, newPage));
  }, []);

  const resetPage = useCallback(() => {
    setPage(1);
  }, []);

  return {
    page,
    pageSize,
    setPage,
    setPageSize,
    nextPage,
    prevPage,
    goToPage,
    resetPage,
  };
}
```

### 2.3 Verification

No runtime test yet. Will verify during component integration.

---

## Phase 3: Create Transaction Form

### 3.1 Create Zod Schema

**File**: `src/schemas/transaction.schema.ts`

```typescript
import { z } from 'zod';
import { TransactionType } from '@/types/transaction.types';

export const transactionSchema = z.object({
  type: z.nativeEnum(TransactionType, {
    required_error: 'Transaction type is required',
  }),
  quantity: z
    .number({
      required_error: 'Quantity is required',
      invalid_type_error: 'Quantity must be a number',
    })
    .positive('Quantity must be greater than 0')
    .max(9999999999.999999, 'Quantity is too large'),
  pricePerUnit: z
    .number({
      required_error: 'Price per unit is required',
      invalid_type_error: 'Price must be a number',
    })
    .positive('Price must be greater than 0')
    .max(999999999999999.99, 'Price is too large'),
  currency: z.enum(['VND', 'USD']).default('VND'),
  provider: z.string().max(100, 'Provider name is too long').optional(),
  transactionDate: z.string().datetime().optional(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
});

export type TransactionFormData = z.infer<typeof transactionSchema>;
```

### 3.2 Create Form Component

**File**: `src/components/features/transactions/TransactionForm.tsx`

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { transactionSchema, type TransactionFormData } from '@/schemas/transaction.schema';
import { useCreateTransaction } from '@/hooks/useTransactions';
import { TransactionType } from '@/types/transaction.types';

interface TransactionFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onSuccess, onCancel }) => {
  const { mutate: createTransaction, isLoading } = useCreateTransaction();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: TransactionType.BUY,
      currency: 'VND',
      transactionDate: new Date().toISOString(),
    },
  });

  const quantity = watch('quantity');
  const pricePerUnit = watch('pricePerUnit');
  const totalAmount = quantity && pricePerUnit ? quantity * pricePerUnit : 0;

  const onSubmit = (data: TransactionFormData) => {
    createTransaction(data, {
      onSuccess: () => {
        reset();
        onSuccess?.();
      },
      onError: (error: unknown) => {
        const err = error as { response?: { status?: number; data?: { message?: string } } };
        if (err.response?.status === 409) {
          alert('This transaction already exists. Please check your transaction list.');
        } else {
          alert(
            err.response?.data?.message ||
              'Failed to create transaction. Please try again.'
          );
        }
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Transaction Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Transaction Type *</label>
        <div className="mt-2 space-x-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              {...register('type')}
              value={TransactionType.BUY}
              className="form-radio h-4 w-4 text-blue-600"
            />
            <span className="ml-2 text-gray-700">BUY</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              {...register('type')}
              value={TransactionType.SELL}
              className="form-radio h-4 w-4 text-blue-600"
            />
            <span className="ml-2 text-gray-700">SELL</span>
          </label>
        </div>
        {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>}
      </div>

      {/* Quantity */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Quantity (chỉ) *</label>
        <input
          type="number"
          step="0.01"
          {...register('quantity', { valueAsNumber: true })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="10.5"
        />
        {errors.quantity && (
          <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
        )}
      </div>

      {/* Price per Unit */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Price per Unit (VND) *</label>
        <input
          type="number"
          {...register('pricePerUnit', { valueAsNumber: true })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="75000000"
        />
        {errors.pricePerUnit && (
          <p className="mt-1 text-sm text-red-600">{errors.pricePerUnit.message}</p>
        )}
      </div>

      {/* Currency */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Currency</label>
        <select
          {...register('currency')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="VND">VND</option>
          <option value="USD">USD</option>
        </select>
      </div>

      {/* Provider */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Provider</label>
        <input
          type="text"
          {...register('provider')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="SJC, PNJ, etc."
        />
        {errors.provider && (
          <p className="mt-1 text-sm text-red-600">{errors.provider.message}</p>
        )}
      </div>

      {/* Transaction Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Transaction Date</label>
        <input
          type="datetime-local"
          {...register('transactionDate')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Notes</label>
        <textarea
          {...register('notes')}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Optional notes about this transaction"
        />
        {errors.notes && <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>}
      </div>

      {/* Total Amount Display */}
      <div className="rounded-md bg-blue-50 p-4">
        <p className="text-sm text-blue-600">Total Amount</p>
        <p className="text-2xl font-bold text-blue-900">
          {totalAmount.toLocaleString('vi-VN')} VND
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Transaction'}
        </button>
      </div>
    </form>
  );
};
```

### 3.3 Add Form to Transactions Page

**File**: `src/pages/TransactionsPage.tsx`

Update to include the form:

```typescript
import { useState } from 'react';
import { TransactionForm } from '@/components/features/transactions/TransactionForm';

export const TransactionsPage = () => {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          + Add Transaction
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Add New Transaction</h2>
          <TransactionForm
            onSuccess={() => {
              setShowForm(false);
              alert('Transaction created successfully!');
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Transaction list will be added in Phase 4 */}
      <div className="rounded-lg border bg-white p-6">
        <p className="text-gray-500">Transaction list coming in Phase 4...</p>
      </div>
    </div>
  );
};

export default TransactionsPage;
```

### 3.4 Test Form

1. Start dev server: `npm run dev`
2. Navigate to Transactions page
3. Click "Add Transaction"
4. Fill out form and submit
5. Check network tab for API call
6. Verify backend receives transaction data

---

## Phase 4: Transaction List Display

### 4.1 Create Transaction Row Component

**File**: `src/components/features/transactions/TransactionRow.tsx`

```typescript
import { Transaction, TransactionType } from '@/types/transaction.types';

interface TransactionRowProps {
  transaction: Transaction;
  onView?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction,
  onView,
  onDelete,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN');
  };

  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="px-4 py-3 text-sm text-gray-600">
        {formatDate(transaction.transactionDate)}
      </td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
            transaction.type === TransactionType.BUY
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {transaction.type}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-900">
        {transaction.quantity.toFixed(2)} chỉ
      </td>
      <td className="px-4 py-3 text-sm text-gray-900">
        {formatCurrency(transaction.pricePerUnit)} {transaction.currency}
      </td>
      <td className="px-4 py-3 text-sm font-medium text-gray-900">
        {formatCurrency(transaction.totalAmount)} {transaction.currency}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">{transaction.provider || '-'}</td>
      <td className="px-4 py-3 text-right text-sm">
        <button
          onClick={() => onView?.(transaction.id)}
          className="text-blue-600 hover:text-blue-800 mr-3"
        >
          View
        </button>
        <button
          onClick={() => onDelete?.(transaction.id)}
          className="text-red-600 hover:text-red-800"
        >
          Delete
        </button>
      </td>
    </tr>
  );
};
```

### 4.2 Create Transaction List Component

**File**: `src/components/features/transactions/TransactionList.tsx`

```typescript
import { TransactionRow } from './TransactionRow';
import { useTransactions } from '@/hooks/useTransactions';
import { usePagination } from '@/hooks/usePagination';
import type { Transaction } from '@/types/transaction.types';

interface TransactionListProps {
  onViewTransaction?: (id: string) => void;
  onDeleteTransaction?: (id: string) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  onViewTransaction,
  onDeleteTransaction,
}) => {
  const { page, pageSize, nextPage, prevPage } = usePagination({ initialPageSize: 20 });
  const { data, isLoading, error } = useTransactions(undefined, { page, pageSize });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <p className="text-sm text-red-800">
          Failed to load transactions. Please try again later.
        </p>
      </div>
    );
  }

  if (!data?.data.length) {
    return (
      <div className="py-12 text-center">
        <p className="text-gray-500">No transactions yet. Create your first transaction!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Quantity
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Price/Unit
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Total
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Provider
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {data.data.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
                onView={onViewTransaction}
                onDelete={onDeleteTransaction}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t bg-white px-4 py-3">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={prevPage}
            disabled={!data.pagination.hasPrevious}
            className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={nextPage}
            disabled={!data.pagination.hasNext}
            className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing page <span className="font-medium">{data.pagination.currentPage}</span> of{' '}
              <span className="font-medium">{data.pagination.totalPages}</span> (
              <span className="font-medium">{data.pagination.totalItems}</span> total transactions)
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={prevPage}
              disabled={!data.pagination.hasPrevious}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              ← Previous
            </button>
            <button
              onClick={nextPage}
              disabled={!data.pagination.hasNext}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
```

### 4.3 Update Transactions Page

Update `src/pages/TransactionsPage.tsx` to include the list:

```typescript
import { useState } from 'react';
import { TransactionForm } from '@/components/features/transactions/TransactionForm';
import { TransactionList } from '@/components/features/transactions/TransactionList';

export const TransactionsPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : '+ Add Transaction'}
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Add New Transaction</h2>
          <TransactionForm
            onSuccess={() => {
              setShowForm(false);
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      <div className="rounded-lg border bg-white shadow-sm">
        <TransactionList
          onViewTransaction={(id) => setSelectedTransactionId(id)}
          onDeleteTransaction={(id) => {
            if (window.confirm('Are you sure you want to delete this transaction?')) {
              // Delete logic in Phase 6
              console.log('Delete:', id);
            }
          }}
        />
      </div>
    </div>
  );
};

export default TransactionsPage;
```

---

## Phase 5: Transaction Details Modal

### 5.1 Create Modal Component

**File**: `src/components/common/Modal.tsx`

```typescript
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                  {title}
                </Dialog.Title>
                <div className="mt-4">{children}</div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
```

### 5.2 Create Transaction Details Component

**File**: `src/components/features/transactions/TransactionDetails.tsx`

```typescript
import { useTransaction } from '@/hooks/useTransactions';
import { TransactionType } from '@/types/transaction.types';

interface TransactionDetailsProps {
  transactionId: string;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export const TransactionDetails: React.FC<TransactionDetailsProps> = ({
  transactionId,
  onClose,
  onDelete,
}) => {
  const { data: transaction, isLoading, error } = useTransaction(transactionId);

  if (isLoading) {
    return <div className="py-8 text-center">Loading...</div>;
  }

  if (error || !transaction) {
    return <div className="py-8 text-center text-red-600">Failed to load transaction</div>;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN');
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-500">Transaction ID</label>
          <p className="mt-1 text-sm text-gray-900 font-mono">{transaction.id}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500">Type</label>
          <p className="mt-1">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                transaction.type === TransactionType.BUY
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {transaction.type}
            </span>
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500">Quantity</label>
          <p className="mt-1 text-sm text-gray-900">
            {transaction.quantity.toFixed(2)} chỉ
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500">Price per Unit</label>
          <p className="mt-1 text-sm text-gray-900">
            {formatCurrency(transaction.pricePerUnit)} {transaction.currency}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500">Total Amount</label>
          <p className="mt-1 text-lg font-bold text-gray-900">
            {formatCurrency(transaction.totalAmount)} {transaction.currency}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500">Provider</label>
          <p className="mt-1 text-sm text-gray-900">{transaction.provider || '-'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500">Transaction Date</label>
          <p className="mt-1 text-sm text-gray-900">
            {formatDate(transaction.transactionDate)}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500">Currency</label>
          <p className="mt-1 text-sm text-gray-900">{transaction.currency}</p>
        </div>
      </div>

      {transaction.notes && (
        <div>
          <label className="block text-sm font-medium text-gray-500">Notes</label>
          <p className="mt-1 text-sm text-gray-900">{transaction.notes}</p>
        </div>
      )}

      <div className="border-t pt-4">
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
          <div>
            <label className="block font-medium">Created</label>
            <p>{formatDate(transaction.createdAt)}</p>
          </div>
          <div>
            <label className="block font-medium">Last Updated</label>
            <p>{formatDate(transaction.updatedAt)}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t pt-4">
        <button
          onClick={onClose}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Close
        </button>
        <button
          onClick={() => {
            if (window.confirm('Are you sure you want to delete this transaction?')) {
              onDelete?.(transaction.id);
              onClose();
            }
          }}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Delete Transaction
        </button>
      </div>
    </div>
  );
};
```

### 5.3 Update Transactions Page with Modal

Update `src/pages/TransactionsPage.tsx`:

```typescript
import { useState } from 'react';
import { TransactionForm } from '@/components/features/transactions/TransactionForm';
import { TransactionList } from '@/components/features/transactions/TransactionList';
import { TransactionDetails } from '@/components/features/transactions/TransactionDetails';
import { Modal } from '@/components/common/Modal';

export const TransactionsPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : '+ Add Transaction'}
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Add New Transaction</h2>
          <TransactionForm
            onSuccess={() => setShowForm(false)}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      <div className="rounded-lg border bg-white shadow-sm">
        <TransactionList
          onViewTransaction={(id) => setSelectedTransactionId(id)}
          onDeleteTransaction={(id) => {
            if (window.confirm('Are you sure you want to delete this transaction?')) {
              // Delete logic in Phase 6
              console.log('Delete:', id);
            }
          }}
        />
      </div>

      {/* Transaction Details Modal */}
      <Modal
        isOpen={!!selectedTransactionId}
        onClose={() => setSelectedTransactionId(null)}
        title="Transaction Details"
      >
        {selectedTransactionId && (
          <TransactionDetails
            transactionId={selectedTransactionId}
            onClose={() => setSelectedTransactionId(null)}
            onDelete={(id) => {
              // Delete logic in Phase 6
              console.log('Delete from modal:', id);
            }}
          />
        )}
      </Modal>
    </div>
  );
};

export default TransactionsPage;
```

---

## Phase 6: Delete Transaction Functionality

### 6.1 Update Transactions Page with Delete Handler

Complete the delete functionality in `src/pages/TransactionsPage.tsx`:

```typescript
import { useState } from 'react';
import { TransactionForm } from '@/components/features/transactions/TransactionForm';
import { TransactionList } from '@/components/features/transactions/TransactionList';
import { TransactionDetails } from '@/components/features/transactions/TransactionDetails';
import { Modal } from '@/components/common/Modal';
import { useDeleteTransaction } from '@/hooks/useTransactions';

export const TransactionsPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const { mutate: deleteTransaction, isLoading: isDeleting } = useDeleteTransaction();

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction? This cannot be undone.')) {
      deleteTransaction(id, {
        onSuccess: () => {
          setSelectedTransactionId(null);
          alert('Transaction deleted successfully');
        },
        onError: (error: unknown) => {
          const err = error as { response?: { data?: { message?: string } } };
          alert(err.response?.data?.message || 'Failed to delete transaction');
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : '+ Add Transaction'}
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Add New Transaction</h2>
          <TransactionForm
            onSuccess={() => setShowForm(false)}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      <div className="rounded-lg border bg-white shadow-sm">
        <TransactionList
          onViewTransaction={(id) => setSelectedTransactionId(id)}
          onDeleteTransaction={handleDelete}
        />
      </div>

      {/* Transaction Details Modal */}
      <Modal
        isOpen={!!selectedTransactionId}
        onClose={() => setSelectedTransactionId(null)}
        title="Transaction Details"
      >
        {selectedTransactionId && (
          <TransactionDetails
            transactionId={selectedTransactionId}
            onClose={() => setSelectedTransactionId(null)}
            onDelete={handleDelete}
          />
        )}
      </Modal>

      {/* Loading Overlay */}
      {isDeleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-25">
          <div className="rounded-lg bg-white p-6">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600 mx-auto" />
            <p className="mt-2 text-sm text-gray-600">Deleting transaction...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;
```

---

## Phase 7: Dashboard Integration

### 7.1 Create Dashboard Summary Hook

**File**: `src/hooks/useDashboardSummary.ts`

```typescript
import { useMemo } from 'react';
import { useTransactions } from './useTransactions';
import { TransactionType } from '@/types/transaction.types';

export function useDashboardSummary() {
  // Fetch all transactions (we'll need to implement "fetch all" logic later)
  const { data, isLoading, error } = useTransactions(undefined, { page: 1, pageSize: 1000 });

  const summary = useMemo(() => {
    if (!data?.data) {
      return {
        totalQuantity: 0,
        totalInvested: 0,
        totalSold: 0,
        currentHoldings: 0,
        averageBuyPrice: 0,
        transactionCount: 0,
      };
    }

    const transactions = data.data;
    let totalQuantity = 0;
    let totalInvested = 0;
    let totalSold = 0;
    let totalBuyQuantity = 0;

    transactions.forEach((tx) => {
      if (tx.type === TransactionType.BUY) {
        totalQuantity += tx.quantity;
        totalInvested += tx.totalAmount;
        totalBuyQuantity += tx.quantity;
      } else {
        totalQuantity -= tx.quantity;
        totalSold += tx.totalAmount;
      }
    });

    const averageBuyPrice = totalBuyQuantity > 0 ? totalInvested / totalBuyQuantity : 0;

    return {
      totalQuantity,
      totalInvested,
      totalSold,
      currentHoldings: totalQuantity,
      averageBuyPrice,
      transactionCount: transactions.length,
    };
  }, [data]);

  return {
    summary,
    isLoading,
    error,
  };
}
```

### 7.2 Update Dashboard Page

**File**: `src/pages/DashboardPage.tsx`

```typescript
import { Link } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { useDashboardSummary } from '@/hooks/useDashboardSummary';

export const DashboardPage = () => {
  const { summary, isLoading } = useDashboardSummary();

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>

      {/* Portfolio Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Current Holdings</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {summary.currentHoldings.toFixed(2)} chỉ
          </p>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Total Invested</h3>
          <p className="mt-2 text-3xl font-bold text-blue-600">
            {formatCurrency(summary.totalInvested)} VND
          </p>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Average Buy Price</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">
            {formatCurrency(summary.averageBuyPrice)} VND
          </p>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Total Sold</h3>
          <p className="mt-2 text-3xl font-bold text-green-600">
            {formatCurrency(summary.totalSold)} VND
          </p>
        </div>

        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Total Transactions</h3>
          <p className="mt-2 text-3xl font-bold text-gray-900">{summary.transactionCount}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Quick Actions</h2>
        <div className="flex gap-4">
          <Link
            to={ROUTES.TRANSACTIONS}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            + Add Transaction
          </Link>
          <Link
            to={ROUTES.TRANSACTIONS}
            className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            View All Transactions
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
```

---

## Testing & Verification

### Step 1: TypeScript Check

```bash
npx tsc --noEmit
```

Expected: No type errors.

### Step 2: Lint Check

```bash
npm run lint
```

Expected: No linting errors (or auto-fix with `npm run lint -- --fix`).

### Step 3: Build Check

```bash
npm run build
```

Expected: Successful production build.

### Step 4: Manual Testing

1. **Start servers**:

   ```bash
   # Terminal 1: Backend
   cd ../gold_log_backend && npm run dev

   # Terminal 2: Frontend
   npm run dev
   ```

2. **Test Create Transaction**:
   - Navigate to Transactions page
   - Click "Add Transaction"
   - Fill form with valid data
   - Verify transaction appears in list
   - Check backend database

3. **Test View Transaction**:
   - Click "View" on any transaction
   - Verify modal shows correct details
   - Close modal

4. **Test Delete Transaction**:
   - Click "Delete" on transaction
   - Confirm deletion
   - Verify transaction removed from list
   - Check backend (should be soft deleted)

5. **Test Pagination**:
   - Create 25+ transactions
   - Verify pagination controls appear
   - Test "Next" and "Previous" buttons

6. **Test Dashboard**:
   - Navigate to Dashboard
   - Verify summary cards show correct totals
   - Verify calculations are accurate

### Step 5: Error Scenarios

Test error handling:

1. **Network Error**: Stop backend, try to create transaction
2. **Validation Error**: Submit form with invalid data
3. **404 Error**: Try to view non-existent transaction ID
4. **Duplicate Transaction**: Submit same transaction twice (backend should return 409)

---

## Troubleshooting

### Issue: "Cannot find module 'uuid'"

**Solution**: Install uuid package:

```bash
npm install uuid
npm install --save-dev @types/uuid
```

### Issue: TypeScript errors in transaction.api.ts

**Solution**: Verify all types are imported:

```typescript
import type { ApiTransaction, ApiPagedResponse } from './types';
import type { Transaction, CreateTransactionRequest } from '@/types/transaction.types';
```

### Issue: Form doesn't show total amount

**Solution**: Ensure `watch` from react-hook-form is used:

```typescript
const quantity = watch('quantity');
const pricePerUnit = watch('pricePerUnit');
const totalAmount = quantity && pricePerUnit ? quantity * pricePerUnit : 0;
```

### Issue: Pagination doesn't work

**Solution**: Check usePagination hook state updates and ensure React Query's `keepPreviousData` is true.

### Issue: Delete doesn't refresh list

**Solution**: Verify `queryClient.invalidateQueries` is called in `useDeleteTransaction` hook:

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['transactions'] });
};
```

---

## Next Steps

After completing transaction CRUD operations:

1. **Implement Filtering & Sorting** (plan-advanced-features.md)
   - Filter by transaction type (BUY/SELL)
   - Filter by date range
   - Filter by provider
   - Sort by date, amount, quantity

2. **Add Chart Visualizations** (plan-chart.md)
   - Price timeline chart
   - Buy/Sell ratio pie chart
   - Monthly transaction volume chart

3. **Add Portfolio Analytics**
   - Real-time profit/loss calculations
   - Performance metrics
   - Investment recommendations

---

## Summary

This plan implements complete transaction CRUD operations:

✅ **Create**: Form with validation, idempotency, real-time calculations
✅ **Read**: Paginated list, individual details modal
✅ **Delete**: Soft delete with confirmation
✅ **Dashboard**: Summary cards with portfolio metrics

All features include:

- Full TypeScript coverage
- React Query for state management
- Error handling and loading states
- Responsive design
- Accessibility considerations

Estimated implementation time: **~5 hours**

---

**End of plan-transactions.md**
