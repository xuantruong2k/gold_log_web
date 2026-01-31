import { describe, it, expect } from 'vitest';
import { formatRelativeTime, formatLargeNumber } from './format';

describe('formatRelativeTime', () => {
  it('should return "just now" for timestamps less than 1 minute ago', () => {
    const now = new Date();
    const thirtySecondsAgo = new Date(now.getTime() - 30 * 1000);

    const result = formatRelativeTime(thirtySecondsAgo.toISOString());

    expect(result).toBe('just now');
  });

  it('should return "1 minute ago" for timestamps exactly 1 minute ago', () => {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

    const result = formatRelativeTime(oneMinuteAgo.toISOString());

    expect(result).toBe('1 minute ago');
  });

  it('should return correct minutes for timestamps less than 1 hour ago', () => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const result = formatRelativeTime(fiveMinutesAgo.toISOString());

    expect(result).toBe('5 minutes ago');
  });

  it('should return "1 hour ago" for timestamps exactly 1 hour ago', () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const result = formatRelativeTime(oneHourAgo.toISOString());

    expect(result).toBe('1 hour ago');
  });

  it('should return correct hours for timestamps less than 1 day ago', () => {
    const now = new Date();
    const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);

    const result = formatRelativeTime(threeHoursAgo.toISOString());

    expect(result).toBe('3 hours ago');
  });

  it('should return "1 day ago" for timestamps exactly 1 day ago', () => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const result = formatRelativeTime(oneDayAgo.toISOString());

    expect(result).toBe('1 day ago');
  });

  it('should return correct days for timestamps more than 1 day ago', () => {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    const result = formatRelativeTime(threeDaysAgo.toISOString());

    expect(result).toBe('3 days ago');
  });
});

describe('formatLargeNumber', () => {
  it('should format numbers less than 1000 without suffix', () => {
    expect(formatLargeNumber(0)).toBe('0');
    expect(formatLargeNumber(500)).toBe('500');
    expect(formatLargeNumber(999)).toBe('999');
  });

  it('should format thousands with K suffix', () => {
    expect(formatLargeNumber(1000)).toBe('1.00K');
    expect(formatLargeNumber(1500)).toBe('1.50K');
    expect(formatLargeNumber(999999)).toBe('1000.00K');
  });

  it('should format millions with M suffix', () => {
    expect(formatLargeNumber(1000000)).toBe('1.00M');
    expect(formatLargeNumber(7500000)).toBe('7.50M');
    expect(formatLargeNumber(999999999)).toBe('1000.00M');
  });

  it('should format billions with B suffix', () => {
    expect(formatLargeNumber(1000000000)).toBe('1.00B');
    expect(formatLargeNumber(7500000000)).toBe('7.50B');
    expect(formatLargeNumber(999999999999)).toBe('1000.00B');
  });

  it('should handle decimal precision correctly', () => {
    expect(formatLargeNumber(1234)).toBe('1.23K');
    expect(formatLargeNumber(1234567)).toBe('1.23M');
    expect(formatLargeNumber(1234567890)).toBe('1.23B');
  });
});
