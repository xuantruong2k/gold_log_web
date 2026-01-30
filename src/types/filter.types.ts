import { TransactionType } from './transaction.types';

export interface TransactionFilters {
  type?: TransactionType;
  startDate?: string;
  endDate?: string;
  provider?: string;
  search?: string;
}

export interface SortConfig {
  field: 'transactionDate' | 'quantity' | 'pricePerUnit' | 'totalAmount';
  direction: 'asc' | 'desc';
}

export interface FilterState {
  filters: TransactionFilters;
  sort: SortConfig;
}

export type DatePreset = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all' | 'custom';
