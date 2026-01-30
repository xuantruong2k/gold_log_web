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
