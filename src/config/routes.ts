export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  TRANSACTIONS: '/transactions',
  GOLD_PRICES: '/gold-prices',
  PROFILE: '/profile',
  OAUTH_CALLBACK: '/auth/callback/:provider',
  NOT_FOUND: '*',
} as const;

export type Route = (typeof ROUTES)[keyof typeof ROUTES];
