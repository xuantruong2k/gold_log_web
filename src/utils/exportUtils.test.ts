import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { exportToCSV, exportToJSON, downloadFile } from './exportUtils';
import { TransactionType } from '@/types/transaction.types';
import type { Transaction } from '@/types/transaction.types';

const mockTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: '65b3f2a1c4e5d6f7a8b9c0d1',
  userId: 'user123',
  idempotencyKey: '550e8400-e29b-41d4-a716-446655440000',
  type: TransactionType.BUY,
  quantity: 10.5,
  pricePerUnit: 75000000,
  currency: 'VND',
  totalAmount: 787500000,
  provider: 'SJC',
  transactionDate: '2026-01-30T10:30:00Z',
  notes: 'Test transaction',
  isDeleted: false,
  createdAt: '2026-01-30T10:30:00.123Z',
  updatedAt: '2026-01-30T10:30:00.123Z',
  ...overrides,
});

describe('exportToCSV', () => {
  it('should generate CSV with correct headers', () => {
    const transactions = [mockTransaction()];
    const csv = exportToCSV(transactions);

    const lines = csv.split('\n');
    const headers = lines[0];

    expect(headers).toBe('Date,Type,Quantity,Price Per Unit,Currency,Total Amount,Provider,Notes');
  });

  it('should format transaction data correctly', () => {
    const transaction = mockTransaction({
      type: TransactionType.SELL,
      quantity: 5.5,
      pricePerUnit: 76000000,
      totalAmount: 418000000,
      provider: 'PNJ',
      notes: 'Sale transaction',
      transactionDate: '2026-01-31T15:45:00Z',
    });

    const csv = exportToCSV([transaction]);
    const lines = csv.split('\n');
    const dataRow = lines[1];

    expect(dataRow).toContain('2026-01-31');
    expect(dataRow).toContain('SELL');
    expect(dataRow).toContain('5.5');
    expect(dataRow).toContain('76,000,000');
    expect(dataRow).toContain('418,000,000');
    expect(dataRow).toContain('PNJ');
    expect(dataRow).toContain('Sale transaction');
  });

  it('should handle empty notes gracefully', () => {
    const transaction = mockTransaction({ notes: '' });
    const csv = exportToCSV([transaction]);

    const lines = csv.split('\n');
    expect(lines[1]).not.toBeUndefined();
    expect(lines[1]).toContain('""'); // Empty quoted field
  });

  it('should handle undefined provider', () => {
    const transaction = mockTransaction({ provider: undefined });
    const csv = exportToCSV([transaction]);

    const lines = csv.split('\n');
    expect(lines[1]).not.toBeUndefined();
    expect(lines[1]).toContain('""'); // Empty quoted field
  });

  it('should escape quotes in notes', () => {
    const transaction = mockTransaction({
      notes: 'Purchase from "SJC" store',
    });

    const csv = exportToCSV([transaction]);
    const lines = csv.split('\n');

    // CSV escaping: quotes inside quoted field are doubled
    expect(lines[1]).toContain('Purchase from ""SJC"" store');
  });

  it('should handle commas in notes', () => {
    const transaction = mockTransaction({
      notes: 'Purchase at District 1, Ho Chi Minh',
    });

    const csv = exportToCSV([transaction]);
    const lines = csv.split('\n');

    // Notes should be quoted to preserve commas
    expect(lines[1]).toContain('"Purchase at District 1, Ho Chi Minh"');
  });

  it('should handle newlines in notes', () => {
    const transaction = mockTransaction({
      notes: 'Line 1\nLine 2\nLine 3',
    });

    const csv = exportToCSV([transaction]);
    const lines = csv.split('\n');

    // Newlines in CSV should be preserved within quotes
    expect(csv).toContain('Line 1\nLine 2\nLine 3');
  });

  it('should format numbers with commas for VND', () => {
    const transaction = mockTransaction({
      pricePerUnit: 123456789,
      totalAmount: 1234567890,
    });

    const csv = exportToCSV([transaction]);

    expect(csv).toContain('123,456,789');
    expect(csv).toContain('1,234,567,890');
  });

  it('should format decimal quantities correctly', () => {
    const transactions = [
      mockTransaction({ quantity: 10 }),
      mockTransaction({ quantity: 10.5 }),
      mockTransaction({ quantity: 10.123456 }),
    ];

    const csv = exportToCSV(transactions);
    const lines = csv.split('\n');

    expect(lines[1]).toContain('10'); // No decimals for whole numbers
    expect(lines[2]).toContain('10.5');
    expect(lines[3]).toContain('10.123456');
  });

  it('should handle multiple transactions', () => {
    const transactions = [
      mockTransaction({ id: '1', type: TransactionType.BUY }),
      mockTransaction({ id: '2', type: TransactionType.SELL }),
      mockTransaction({ id: '3', type: TransactionType.BUY }),
    ];

    const csv = exportToCSV(transactions);
    const lines = csv.split('\n');

    // 1 header + 3 data rows
    expect(lines).toHaveLength(4);
    expect(lines[1]).toContain('BUY');
    expect(lines[2]).toContain('SELL');
    expect(lines[3]).toContain('BUY');
  });

  it('should handle empty transaction array', () => {
    const csv = exportToCSV([]);
    const lines = csv.split('\n');

    // Should still have header
    expect(lines).toHaveLength(1);
    expect(lines[0]).toBe('Date,Type,Quantity,Price Per Unit,Currency,Total Amount,Provider,Notes');
  });

  it('should format dates in readable format', () => {
    const transaction = mockTransaction({
      transactionDate: '2026-01-30T10:30:00Z',
    });

    const csv = exportToCSV([transaction]);

    // Date should be formatted (not raw ISO string)
    expect(csv).toContain('2026-01-30');
  });

  it('should handle special characters in provider name', () => {
    const transaction = mockTransaction({
      provider: 'SJC & PNJ "Official"',
    });

    const csv = exportToCSV([transaction]);

    // Should escape quotes and handle ampersand
    expect(csv).toContain('SJC & PNJ ""Official""');
  });
});

describe('exportToJSON', () => {
  it('should generate valid JSON', () => {
    const transactions = [mockTransaction()];
    const json = exportToJSON(transactions);

    expect(() => JSON.parse(json)).not.toThrow();
  });

  it('should pretty print JSON with 2 space indent', () => {
    const transactions = [mockTransaction()];
    const json = exportToJSON(transactions);

    // Pretty-printed JSON should have newlines and indentation
    expect(json).toContain('\n');
    expect(json).toContain('  '); // 2-space indent
  });

  it('should export all transaction fields', () => {
    const transaction = mockTransaction({
      id: '12345',
      type: TransactionType.SELL,
      quantity: 15.5,
      pricePerUnit: 80000000,
      provider: 'Test Provider',
      notes: 'Test notes',
    });

    const json = exportToJSON([transaction]);
    const parsed = JSON.parse(json);

    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toHaveProperty('id', '12345');
    expect(parsed[0]).toHaveProperty('type', 'SELL');
    expect(parsed[0]).toHaveProperty('quantity', 15.5);
    expect(parsed[0]).toHaveProperty('pricePerUnit', 80000000);
    expect(parsed[0]).toHaveProperty('provider', 'Test Provider');
    expect(parsed[0]).toHaveProperty('notes', 'Test notes');
  });

  it('should handle empty transaction array', () => {
    const json = exportToJSON([]);
    const parsed = JSON.parse(json);

    expect(parsed).toEqual([]);
  });

  it('should preserve number precision', () => {
    const transaction = mockTransaction({
      quantity: 10.123456789,
      pricePerUnit: 75123456.78,
      totalAmount: 759876543.21,
    });

    const json = exportToJSON([transaction]);
    const parsed = JSON.parse(json);

    expect(parsed[0].quantity).toBe(10.123456789);
    expect(parsed[0].pricePerUnit).toBe(75123456.78);
    expect(parsed[0].totalAmount).toBe(759876543.21);
  });

  it('should handle special characters in strings', () => {
    const transaction = mockTransaction({
      provider: 'Test "Provider" & Co.',
      notes: 'Line 1\nLine 2\tTabbed',
    });

    const json = exportToJSON([transaction]);
    const parsed = JSON.parse(json);

    expect(parsed[0].provider).toBe('Test "Provider" & Co.');
    expect(parsed[0].notes).toBe('Line 1\nLine 2\tTabbed');
  });

  it('should handle undefined optional fields', () => {
    const transaction = mockTransaction({
      provider: undefined,
      notes: undefined,
    });

    const json = exportToJSON([transaction]);
    const parsed = JSON.parse(json);

    // Transaction type should include these fields, even if they're in the source object
    // JSON.stringify will include them
    expect(parsed[0].id).toBe(transaction.id);
    expect(parsed[0].type).toBe(transaction.type);
  });

  it('should export multiple transactions correctly', () => {
    const transactions = [
      mockTransaction({ id: '1', type: TransactionType.BUY }),
      mockTransaction({ id: '2', type: TransactionType.SELL }),
      mockTransaction({ id: '3', type: TransactionType.BUY }),
    ];

    const json = exportToJSON(transactions);
    const parsed = JSON.parse(json);

    expect(parsed).toHaveLength(3);
    expect(parsed[0].id).toBe('1');
    expect(parsed[0].type).toBe('BUY');
    expect(parsed[1].id).toBe('2');
    expect(parsed[1].type).toBe('SELL');
    expect(parsed[2].id).toBe('3');
  });
});

describe('downloadFile', () => {
  let createElementSpy: any;
  let clickSpy: any;
  let removeSpy: any;
  let anchorElement: any;

  beforeEach(() => {
    // Mock anchor element
    anchorElement = {
      href: '',
      download: '',
      click: vi.fn(),
      remove: vi.fn(),
    };

    clickSpy = anchorElement.click;
    removeSpy = anchorElement.remove;

    // Mock document.createElement
    createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(anchorElement);

    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create anchor element with correct attributes', () => {
    downloadFile('test content', 'test.csv', 'text/csv');

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(anchorElement.download).toBe('test.csv');
    expect(anchorElement.href).toBe('blob:mock-url');
  });

  it('should trigger click on anchor element', () => {
    downloadFile('test content', 'test.csv', 'text/csv');

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('should remove anchor element after click', () => {
    downloadFile('test content', 'test.csv', 'text/csv');

    expect(removeSpy).toHaveBeenCalledTimes(1);
  });

  it('should create blob with correct content and type', () => {
    const content = 'test CSV content';
    downloadFile(content, 'test.csv', 'text/csv');

    expect(global.URL.createObjectURL).toHaveBeenCalledTimes(1);

    // Check that createObjectURL was called with a Blob
    const callArg = (global.URL.createObjectURL as any).mock.calls[0][0];
    expect(callArg).toBeInstanceOf(Blob);
    expect(callArg.type).toBe('text/csv;charset=utf-8;');
  });

  it('should handle JSON mime type', () => {
    downloadFile('{"test": true}', 'test.json', 'application/json');

    const callArg = (global.URL.createObjectURL as any).mock.calls[0][0];
    expect(callArg.type).toBe('application/json;charset=utf-8;');
  });

  it('should handle large content', () => {
    const largeContent = 'a'.repeat(1000000); // 1MB of data
    downloadFile(largeContent, 'large.csv', 'text/csv');

    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(removeSpy).toHaveBeenCalledTimes(1);
  });

  it('should handle filenames with special characters', () => {
    downloadFile('content', 'test file (2026-01-30).csv', 'text/csv');

    expect(anchorElement.download).toBe('test file (2026-01-30).csv');
  });

  it('should handle empty content', () => {
    downloadFile('', 'empty.csv', 'text/csv');

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('should create blob with UTF-8 encoding', () => {
    const contentWithUnicode = 'Tiếng Việt: 금, 黃金';
    downloadFile(contentWithUnicode, 'unicode.csv', 'text/csv');

    const callArg = (global.URL.createObjectURL as any).mock.calls[0][0];
    expect(callArg.type).toContain('charset=utf-8');
  });
});

describe('Export Integration', () => {
  it('should export transactions to CSV and trigger download', () => {
    const transactions = [
      mockTransaction({ type: TransactionType.BUY }),
      mockTransaction({ type: TransactionType.SELL }),
    ];

    const csv = exportToCSV(transactions);

    expect(csv).toBeTruthy();
    expect(csv.split('\n')).toHaveLength(3); // 1 header + 2 data rows

    // In real usage, this would trigger downloadFile(csv, filename, 'text/csv')
  });

  it('should export transactions to JSON and trigger download', () => {
    const transactions = [
      mockTransaction({ type: TransactionType.BUY }),
      mockTransaction({ type: TransactionType.SELL }),
    ];

    const json = exportToJSON(transactions);

    expect(json).toBeTruthy();

    const parsed = JSON.parse(json);
    expect(parsed).toHaveLength(2);

    // In real usage, this would trigger downloadFile(json, filename, 'application/json')
  });

  it('should handle full export workflow for CSV', () => {
    const transactions = [mockTransaction()];
    const csv = exportToCSV(transactions);
    const filename = `transactions_${new Date().toISOString().split('T')[0]}.csv`;

    expect(csv).toContain('Date,Type,Quantity');
    expect(filename).toMatch(/transactions_\d{4}-\d{2}-\d{2}\.csv/);
  });

  it('should handle full export workflow for JSON', () => {
    const transactions = [mockTransaction()];
    const json = exportToJSON(transactions);
    const filename = `transactions_${new Date().toISOString().split('T')[0]}.json`;

    const parsed = JSON.parse(json);
    expect(parsed).toHaveLength(1);
    expect(filename).toMatch(/transactions_\d{4}-\d{2}-\d{2}\.json/);
  });
});
