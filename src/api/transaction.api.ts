import { v4 as uuidv4 } from 'uuid';
import { apiClient } from './client';
import { apiTransactionToTransaction, transactionToApiRequest } from './transformers';
import type {
  Transaction,
  CreateTransactionRequest,
  TransactionFilters,
  PaginationParams,
  PagedResponse,
} from '@/types';
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
