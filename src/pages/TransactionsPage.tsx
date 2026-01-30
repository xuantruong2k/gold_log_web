import { useState, useMemo } from 'react';
import { TransactionForm } from '@/components/features/transactions/TransactionForm';
import { TransactionList } from '@/components/features/transactions/TransactionList';
import { TransactionDetails } from '@/components/features/transactions/TransactionDetails';
import { FilterPanel } from '@/components/features/transactions/FilterPanel';
import { ExportButton } from '@/components/features/transactions/ExportButton';
import { Modal } from '@/components/common/Modal';
import { useDeleteTransaction, useTransactions } from '@/hooks/useTransactions';
import { useFilters } from '@/hooks/useFilters';
import { usePagination } from '@/hooks/usePagination';
import { sortTransactions } from '@/utils/sortUtils';
import type { SortConfig } from '@/types/filter.types';

export const TransactionsPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'transactionDate',
    direction: 'desc',
  });

  const { filters } = useFilters();
  const { page, pageSize, nextPage, prevPage } = usePagination();
  const { data, isLoading } = useTransactions(filters, { page, pageSize });
  const { mutate: deleteTransaction, isPending: isDeleting } = useDeleteTransaction();

  // Apply client-side sorting to fetched data
  const sortedData = useMemo(() => {
    return data?.data ? sortTransactions(data.data, sortConfig) : [];
  }, [data, sortConfig]);

  const handleDelete = (id: string) => {
    if (
      window.confirm('Are you sure you want to delete this transaction? This cannot be undone.')
    ) {
      deleteTransaction(id, {
        onSuccess: () => {
          setSelectedTransactionId(null);
          alert('Transaction deleted successfully');
        },
        onError: (error: unknown) => {
          const err = error as { response?: { data?: { message?: string } } };
          alert(err.response?.data?.message || 'Failed to delete transaction');
        },
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
        <div className="flex gap-3">
          <ExportButton transactions={sortedData} disabled={isLoading} />
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            {showForm ? 'Cancel' : '+ Add Transaction'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Add New Transaction</h2>
          <TransactionForm
            onSuccess={() => {
              setShowForm(false);
              alert('Transaction created successfully!');
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      <FilterPanel sortConfig={sortConfig} onSortChange={setSortConfig} />

      <div className="rounded-lg border bg-white shadow-sm">
        <TransactionList
          transactions={sortedData}
          pagination={data?.pagination}
          isLoading={isLoading}
          onNextPage={nextPage}
          onPrevPage={prevPage}
          onViewTransaction={(id) => setSelectedTransactionId(id)}
          onDeleteTransaction={handleDelete}
        />
      </div>

      {/* Transaction Details Modal */}
      <Modal
        isOpen={!!selectedTransactionId}
        onClose={() => setSelectedTransactionId(null)}
        title="Transaction Details"
      >
        {selectedTransactionId && (
          <TransactionDetails
            transactionId={selectedTransactionId}
            onClose={() => setSelectedTransactionId(null)}
            onDelete={handleDelete}
          />
        )}
      </Modal>

      {/* Loading Overlay */}
      {isDeleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-25">
          <div className="rounded-lg bg-white p-6">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
            <p className="mt-2 text-sm text-gray-600">Deleting...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;
