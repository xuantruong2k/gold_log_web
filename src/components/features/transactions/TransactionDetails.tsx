import { useTransaction } from '@/hooks/useTransactions';
import { TransactionType } from '@/types';

interface TransactionDetailsProps {
  transactionId: string;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export const TransactionDetails: React.FC<TransactionDetailsProps> = ({
  transactionId,
  onClose,
  onDelete,
}) => {
  const { data: transaction, isLoading, error } = useTransaction(transactionId);

  if (isLoading) {
    return <div className="py-8 text-center">Loading...</div>;
  }

  if (error || !transaction) {
    return <div className="py-8 text-center text-red-600">Failed to load transaction</div>;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN');
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-500">Transaction ID</label>
          <p className="mt-1 font-mono text-sm text-gray-900">{transaction.id}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500">Type</label>
          <p className="mt-1">
            <span
              className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                transaction.type === TransactionType.BUY
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {transaction.type}
            </span>
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500">Quantity</label>
          <p className="mt-1 text-sm text-gray-900">
            {transaction.quantity.toFixed(2)} chỉ
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500">Price per Unit</label>
          <p className="mt-1 text-sm text-gray-900">
            {formatCurrency(transaction.pricePerUnit)} {transaction.currency}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500">Total Amount</label>
          <p className="mt-1 text-sm font-bold text-gray-900">
            {formatCurrency(transaction.totalAmount)} {transaction.currency}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500">Provider</label>
          <p className="mt-1 text-sm text-gray-900">{transaction.provider || '-'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500">Transaction Date</label>
          <p className="mt-1 text-sm text-gray-900">
            {formatDate(transaction.transactionDate)}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500">Currency</label>
          <p className="mt-1 text-sm text-gray-900">{transaction.currency}</p>
        </div>
      </div>

      {transaction.notes && (
        <div>
          <label className="block text-sm font-medium text-gray-500">Notes</label>
          <p className="mt-1 text-sm text-gray-900">{transaction.notes}</p>
        </div>
      )}

      <div className="border-t pt-4">
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
          <div>
            <span className="font-medium">Created:</span>{' '}
            {formatDate(transaction.createdAt)}
          </div>
          <div>
            <span className="font-medium">Updated:</span>{' '}
            {formatDate(transaction.updatedAt)}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 border-t pt-4">
        <button
          onClick={onClose}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Close
        </button>
        <button
          onClick={() => {
            onDelete?.(transaction.id);
            onClose();
          }}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Delete Transaction
        </button>
      </div>
    </div>
  );
};
