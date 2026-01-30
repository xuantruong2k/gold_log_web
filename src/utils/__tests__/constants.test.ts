import { describe, it, expect } from 'vitest';
import { APP_NAME, PAGINATION } from '../constants';

describe('constants', () => {
  it('should have correct app name', () => {
    expect(APP_NAME).toBe('Gold Log');
  });

  it('should have correct pagination defaults', () => {
    expect(PAGINATION.DEFAULT_PAGE).toBe(1);
    expect(PAGINATION.DEFAULT_PAGE_SIZE).toBe(20);
  });
});
