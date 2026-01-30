import { useState } from 'react';
import type { Transaction } from '@/types/transaction.types';
import { exportToCSV, exportToJSON, downloadFile } from '@/utils/exportUtils';

interface ExportButtonProps {
  transactions: Transaction[];
  disabled?: boolean;
}

export const ExportButton: React.FC<ExportButtonProps> = ({ transactions, disabled }) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleExport = (format: 'csv' | 'json') => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `transactions_${timestamp}.${format}`;

    if (format === 'csv') {
      const csvContent = exportToCSV(transactions);
      downloadFile(csvContent, filename, 'text/csv');
    } else {
      const jsonContent = exportToJSON(transactions);
      downloadFile(jsonContent, filename, 'application/json');
    }

    setShowMenu(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={disabled || transactions.length === 0}
        className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        Export ({transactions.length})
      </button>

      {showMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 z-20 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
            <div className="py-1">
              <button
                onClick={() => handleExport('csv')}
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
              >
                Export as CSV
              </button>
              <button
                onClick={() => handleExport('json')}
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
              >
                Export as JSON
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
