import { useMemo } from 'react';
import { useTransactions } from './useTransactions';
import { useProviderPrice } from './useGoldPrices';
import { TransactionType, GoldProvider } from '@/types';

export interface DashboardSummary {
  totalQuantity: number;
  totalInvested: number;
  totalSold: number;
  currentHoldings: number;
  averageBuyPrice: number;
  transactionCount: number;
  currentPortfolioValue: number;
  unrealizedPL: number;
  realizedPL: number;
  totalPL: number;
  plPercentage: number;
  currentPrice: number;
  soldQuantity: number;
}

export function useDashboardSummary() {
  // Fetch all transactions (we'll need to implement "fetch all" logic later)
  const {
    data,
    isLoading: isLoadingTransactions,
    error,
  } = useTransactions(undefined, { page: 1, pageSize: 100 });

  // Fetch SJC price as default - with error handling
  const {
    data: sjcPrice,
    isLoading: isLoadingPrice,
    isError: isPriceError,
  } = useProviderPrice(GoldProvider.SJC);

  const summary = useMemo(() => {
    if (!data?.data) {
      return {
        totalQuantity: 0,
        totalInvested: 0,
        totalSold: 0,
        currentHoldings: 0,
        averageBuyPrice: 0,
        transactionCount: 0,
        currentPortfolioValue: 0,
        unrealizedPL: 0,
        realizedPL: 0,
        totalPL: 0,
        plPercentage: 0,
        currentPrice: 0,
        soldQuantity: 0,
      };
    }

    const transactions = data.data;
    let totalQuantity = 0;
    let totalInvested = 0;
    let totalSold = 0;
    let totalBuyQuantity = 0;
    let soldQuantity = 0;

    transactions.forEach((tx) => {
      if (tx.type === TransactionType.BUY) {
        totalQuantity += tx.quantity;
        totalInvested += tx.totalAmount;
        totalBuyQuantity += tx.quantity;
      } else {
        totalQuantity -= tx.quantity;
        totalSold += tx.totalAmount;
        soldQuantity += tx.quantity;
      }
    });

    const averageBuyPrice = totalBuyQuantity > 0 ? totalInvested / totalBuyQuantity : 0;
    const currentHoldings = totalQuantity;

    // Use SJC sell price for current portfolio value calculation
    // Fallback to 0 if price is unavailable (API error, timeout, etc.)
    const currentPrice = sjcPrice?.sellPrice ?? 0;
    const currentPortfolioValue = currentPrice > 0 ? currentHoldings * currentPrice : 0;

    // Calculate P&L - if no current price, unrealized P&L cannot be calculated accurately
    const unrealizedPL = currentPrice > 0 ? currentPortfolioValue - totalInvested : 0;
    const costOfSold = soldQuantity * averageBuyPrice;
    const realizedPL = totalSold - costOfSold;
    const totalPL = unrealizedPL + realizedPL;
    const plPercentage = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;

    return {
      totalQuantity,
      totalInvested,
      totalSold,
      currentHoldings,
      averageBuyPrice,
      transactionCount: transactions.length,
      currentPortfolioValue,
      unrealizedPL,
      realizedPL,
      totalPL,
      plPercentage,
      currentPrice,
      soldQuantity,
    };
  }, [data, sjcPrice]);

  return {
    summary,
    isLoading: isLoadingTransactions || isLoadingPrice,
    priceError: isPriceError,
    priceData: sjcPrice,
    error,
  };
}
