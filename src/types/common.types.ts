export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginationMetadata {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PagedResponse<T> {
  data: T[];
  pagination: PaginationMetadata;
}

export interface ErrorResponse {
  error: string;
  message: string;
  timestamp: string;
}

export interface ExchangeRate {
  provider: string;
  fromCurrency: string;
  toCurrency: string;
  buyRate: number;
  transferRate: number;
  sellRate: number;
  updatedAt: string;
}
