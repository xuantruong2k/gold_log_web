import type { Transaction } from '@/types/transaction.types';

/**
 * Format number with commas for readability
 */
function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Escape CSV field value (handle quotes, commas, newlines)
 */
function escapeCSVField(field: string): string {
  // If field contains quotes, commas, or newlines, wrap in quotes and escape internal quotes
  if (field.includes('"') || field.includes(',') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return `"${field}"`;
}

/**
 * Export transactions as CSV string
 */
export function exportToCSV(transactions: Transaction[]): string {
  const headers = [
    'Date',
    'Type',
    'Quantity',
    'Price Per Unit',
    'Currency',
    'Total Amount',
    'Provider',
    'Notes',
  ];

  const rows = transactions.map((tx) => {
    const date = new Date(tx.transactionDate).toISOString().split('T')[0]; // YYYY-MM-DD
    return [
      date,
      tx.type,
      tx.quantity.toString(),
      formatNumber(tx.pricePerUnit),
      tx.currency,
      formatNumber(tx.totalAmount),
      tx.provider || '',
      tx.notes || '',
    ].map(escapeCSVField);
  });

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

/**
 * Export transactions as JSON string
 */
export function exportToJSON(transactions: Transaction[]): string {
  return JSON.stringify(transactions, null, 2);
}

/**
 * Helper to trigger file download
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
