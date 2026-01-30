import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionApi } from '@/api/transaction.api';
import type {
  CreateTransactionRequest,
  TransactionFilters,
  PaginationParams,
} from '@/types';

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
    placeholderData: (previousData) => previousData, // Keep showing old data while fetching new page
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
