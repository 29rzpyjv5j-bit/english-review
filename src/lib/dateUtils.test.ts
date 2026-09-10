import { describe, it, expect } from 'vitest';
import { todayStr, addDays, daysBetween } from './dateUtils';

describe('dateUtils', () => {
  it('formats a date as YYYY-MM-DD', () => {
    expect(todayStr(new Date(2026, 8, 11))).toBe('2026-09-11');
  });
  it('adds days across month boundary', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01');
  });
  it('subtracts days', () => {
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });
  it('computes difference in days', () => {
    expect(daysBetween('2026-09-10', '2026-09-11')).toBe(1);
    expect(daysBetween('2026-09-11', '2026-09-10')).toBe(-1);
    expect(daysBetween('2026-09-11', '2026-09-11')).toBe(0);
  });
});
