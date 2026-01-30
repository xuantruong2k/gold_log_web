import type { Transaction } from '@/types';
import { TransactionType } from '@/types';

interface TransactionRowProps {
  transaction: Transaction;
  onView?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const TransactionRow: React.FC<TransactionRowProps> = ({
  transaction,
  onView,
  onDelete,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN');
  };

  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="px-4 py-3 text-sm text-gray-600">{formatDate(transaction.transactionDate)}</td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
            transaction.type === TransactionType.BUY
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {transaction.type}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-900">{transaction.quantity.toFixed(2)} chỉ</td>
      <td className="px-4 py-3 text-sm text-gray-900">
        {formatCurrency(transaction.pricePerUnit)} {transaction.currency}
      </td>
      <td className="px-4 py-3 text-sm font-medium text-gray-900">
        {formatCurrency(transaction.totalAmount)} {transaction.currency}
      </td>
      <td className="px-4 py-3 text-sm text-gray-600">{transaction.provider || '-'}</td>
      <td className="px-4 py-3 text-right text-sm">
        <button
          onClick={() => onView?.(transaction.id)}
          className="mr-3 text-blue-600 hover:text-blue-800"
        >
          View
        </button>
        <button
          onClick={() => onDelete?.(transaction.id)}
          className="text-red-600 hover:text-red-800"
        >
          Delete
        </button>
      </td>
    </tr>
  );
};
