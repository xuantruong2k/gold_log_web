import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getDateRangeFromPreset,
  hasActiveFilters,
  countActiveFilters,
  filtersToQueryString,
  queryStringToFilters,
} from './filterUtils';
import { TransactionType } from '@/types/transaction.types';
import type { TransactionFilters, DatePreset } from '@/types/filter.types';

describe('filterUtils', () => {
  describe('getDateRangeFromPreset', () => {
    beforeEach(() => {
      // Mock current date to ensure consistent tests
      vi.setSystemTime(new Date('2026-01-31T12:00:00Z'));
    });

    it('should return today range', () => {
      const result = getDateRangeFromPreset('today');

      expect(result.startDate).toBeDefined();
      expect(result.endDate).toBeDefined();

      const start = new Date(result.startDate!);
      const end = new Date(result.endDate!);

      // Start should be beginning of today
      expect(start.getDate()).toBe(31);
      expect(start.getMonth()).toBe(0); // January

      // End should be 24 hours later
      expect(end.getTime() - start.getTime()).toBe(24 * 60 * 60 * 1000);
    });

    it('should return week range (last 7 days)', () => {
      const result = getDateRangeFromPreset('week');

      expect(result.startDate).toBeDefined();
      expect(result.endDate).toBeDefined();

      const start = new Date(result.startDate!);
      const end = new Date(result.endDate!);

      // Should be 7 days difference
      const daysDiff = Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
      expect(daysDiff).toBe(7);
    });

    it('should return month range (last 30 days)', () => {
      const result = getDateRangeFromPreset('month');

      expect(result.startDate).toBeDefined();
      expect(result.endDate).toBeDefined();

      const start = new Date(result.startDate!);

      // Start should be one month ago
      expect(start.getMonth()).toBe(11); // December (prev month)
      expect(start.getFullYear()).toBe(2025);
    });

    it('should return quarter range (last 3 months)', () => {
      const result = getDateRangeFromPreset('quarter');

      expect(result.startDate).toBeDefined();
      expect(result.endDate).toBeDefined();

      const start = new Date(result.startDate!);

      // Start should be 3 months ago
      expect(start.getMonth()).toBe(9); // October (3 months back)
      expect(start.getFullYear()).toBe(2025);
    });

    it('should return year range (last 12 months)', () => {
      const result = getDateRangeFromPreset('year');

      expect(result.startDate).toBeDefined();
      expect(result.endDate).toBeDefined();

      const start = new Date(result.startDate!);

      // Start should be one year ago
      expect(start.getFullYear()).toBe(2025);
    });

    it('should return empty object for "all" preset', () => {
      const result = getDateRangeFromPreset('all');

      expect(result.startDate).toBeUndefined();
      expect(result.endDate).toBeUndefined();
    });

    it('should return empty object for "custom" preset', () => {
      const result = getDateRangeFromPreset('custom');

      expect(result.startDate).toBeUndefined();
      expect(result.endDate).toBeUndefined();
    });
  });

  describe('hasActiveFilters', () => {
    it('should return false for empty filters', () => {
      const filters: TransactionFilters = {};
      expect(hasActiveFilters(filters)).toBe(false);
    });

    it('should return true when type filter is set', () => {
      const filters: TransactionFilters = { type: TransactionType.BUY };
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when startDate is set', () => {
      const filters: TransactionFilters = { startDate: '2026-01-01' };
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when endDate is set', () => {
      const filters: TransactionFilters = { endDate: '2026-01-31' };
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when provider is set', () => {
      const filters: TransactionFilters = { provider: 'SJC' };
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('should return true when search is set', () => {
      const filters: TransactionFilters = { search: 'gold' };
      expect(hasActiveFilters(filters)).toBe(true);
    });

    it('should return true for multiple filters', () => {
      const filters: TransactionFilters = {
        type: TransactionType.SELL,
        provider: 'PNJ',
        search: 'district 1',
      };
      expect(hasActiveFilters(filters)).toBe(true);
    });
  });

  describe('countActiveFilters', () => {
    it('should return 0 for empty filters', () => {
      const filters: TransactionFilters = {};
      expect(countActiveFilters(filters)).toBe(0);
    });

    it('should count type filter', () => {
      const filters: TransactionFilters = { type: TransactionType.BUY };
      expect(countActiveFilters(filters)).toBe(1);
    });

    it('should count date range as single filter', () => {
      const filters: TransactionFilters = {
        startDate: '2026-01-01',
        endDate: '2026-01-31',
      };
      expect(countActiveFilters(filters)).toBe(1);
    });

    it('should count startDate only as single filter', () => {
      const filters: TransactionFilters = {
        startDate: '2026-01-01',
      };
      expect(countActiveFilters(filters)).toBe(1);
    });

    it('should count provider filter', () => {
      const filters: TransactionFilters = { provider: 'SJC' };
      expect(countActiveFilters(filters)).toBe(1);
    });

    it('should count search filter', () => {
      const filters: TransactionFilters = { search: 'gold purchase' };
      expect(countActiveFilters(filters)).toBe(1);
    });

    it('should count all active filters correctly', () => {
      const filters: TransactionFilters = {
        type: TransactionType.BUY,
        startDate: '2026-01-01',
        endDate: '2026-01-31',
        provider: 'SJC',
        search: 'gold',
      };
      expect(countActiveFilters(filters)).toBe(4); // type, date range, provider, search
    });
  });

  describe('filtersToQueryString', () => {
    it('should return empty string for empty filters', () => {
      const filters: TransactionFilters = {};
      expect(filtersToQueryString(filters)).toBe('');
    });

    it('should serialize type filter', () => {
      const filters: TransactionFilters = { type: TransactionType.BUY };
      expect(filtersToQueryString(filters)).toBe('type=BUY');
    });

    it('should serialize date range', () => {
      const filters: TransactionFilters = {
        startDate: '2026-01-01T00:00:00Z',
        endDate: '2026-01-31T23:59:59Z',
      };
      const queryString = filtersToQueryString(filters);
      expect(queryString).toContain('startDate=2026-01-01T00%3A00%3A00Z');
      expect(queryString).toContain('endDate=2026-01-31T23%3A59%3A59Z');
    });

    it('should serialize provider', () => {
      const filters: TransactionFilters = { provider: 'SJC' };
      expect(filtersToQueryString(filters)).toBe('provider=SJC');
    });

    it('should serialize search with spaces', () => {
      const filters: TransactionFilters = { search: 'gold purchase district 1' };
      expect(filtersToQueryString(filters)).toBe('search=gold+purchase+district+1');
    });

    it('should serialize multiple filters', () => {
      const filters: TransactionFilters = {
        type: TransactionType.SELL,
        provider: 'PNJ',
      };
      const queryString = filtersToQueryString(filters);
      expect(queryString).toContain('type=SELL');
      expect(queryString).toContain('provider=PNJ');
    });
  });

  describe('queryStringToFilters', () => {
    it('should parse empty string to empty filters', () => {
      const filters = queryStringToFilters('');
      expect(filters).toEqual({});
    });

    it('should parse type parameter', () => {
      const filters = queryStringToFilters('type=BUY');
      expect(filters.type).toBe('BUY');
    });

    it('should parse date range parameters', () => {
      const queryString = 'startDate=2026-01-01&endDate=2026-01-31';
      const filters = queryStringToFilters(queryString);
      expect(filters.startDate).toBe('2026-01-01');
      expect(filters.endDate).toBe('2026-01-31');
    });

    it('should parse provider parameter', () => {
      const filters = queryStringToFilters('provider=SJC');
      expect(filters.provider).toBe('SJC');
    });

    it('should parse search parameter with spaces', () => {
      const filters = queryStringToFilters('search=gold+purchase');
      expect(filters.search).toBe('gold purchase');
    });

    it('should parse URL-encoded search parameter', () => {
      const filters = queryStringToFilters('search=gold%20purchase');
      expect(filters.search).toBe('gold purchase');
    });

    it('should parse multiple parameters', () => {
      const queryString = 'type=BUY&provider=SJC&search=gold';
      const filters = queryStringToFilters(queryString);
      expect(filters.type).toBe('BUY');
      expect(filters.provider).toBe('SJC');
      expect(filters.search).toBe('gold');
    });

    it('should handle ? prefix in query string', () => {
      const filters = queryStringToFilters('?type=BUY&provider=SJC');
      expect(filters.type).toBe('BUY');
      expect(filters.provider).toBe('SJC');
    });

    it('should ignore unknown parameters', () => {
      const filters = queryStringToFilters('type=BUY&unknown=value&provider=SJC');
      expect(filters.type).toBe('BUY');
      expect(filters.provider).toBe('SJC');
      expect((filters as any).unknown).toBeUndefined();
    });
  });

  describe('round-trip serialization', () => {
    it('should preserve filters through serialization and parsing', () => {
      const originalFilters: TransactionFilters = {
        type: TransactionType.BUY,
        startDate: '2026-01-01T00:00:00Z',
        endDate: '2026-01-31T23:59:59Z',
        provider: 'SJC',
        search: 'gold purchase',
      };

      const queryString = filtersToQueryString(originalFilters);
      const parsedFilters = queryStringToFilters(queryString);

      expect(parsedFilters.type).toBe(originalFilters.type);
      expect(parsedFilters.startDate).toBe(originalFilters.startDate);
      expect(parsedFilters.endDate).toBe(originalFilters.endDate);
      expect(parsedFilters.provider).toBe(originalFilters.provider);
      expect(parsedFilters.search).toBe(originalFilters.search);
    });
  });
});
