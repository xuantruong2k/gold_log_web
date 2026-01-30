export const APP_NAME = 'Gold Log';
export const APP_VERSION = '1.0.0';

export const API_TIMEOUT = 10000; // 10 seconds

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

export const CURRENCY = {
  VND: 'VND',
  USD: 'USD',
} as const;

export const TRANSACTION_TYPE = {
  BUY: 'BUY',
  SELL: 'SELL',
} as const;
