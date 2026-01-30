import { useMemo } from 'react';
import { useTransactions } from './useTransactions';
import { TransactionType } from '@/types';

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
