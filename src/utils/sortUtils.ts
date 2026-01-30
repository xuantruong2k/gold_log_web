import type { Transaction } from '@/types/transaction.types';
import type { SortConfig } from '@/types/filter.types';

export function sortTransactions(
  transactions: Transaction[],
  sortConfig: SortConfig
): Transaction[] {
  const sorted = [...transactions];

  sorted.sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sortConfig.field) {
      case 'transactionDate':
        aValue = new Date(a.transactionDate).getTime();
        bValue = new Date(b.transactionDate).getTime();
        break;
      case 'quantity':
        aValue = a.quantity;
        bValue = b.quantity;
        break;
      case 'pricePerUnit':
        aValue = a.pricePerUnit;
        bValue = b.pricePerUnit;
        break;
      case 'totalAmount':
        aValue = a.totalAmount;
        bValue = b.totalAmount;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  return sorted;
}
