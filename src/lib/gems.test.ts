import { describe, it, expect } from 'vitest';
import { sessionReward, FREEZE_COST, FREEZE_MAX } from './gems';

describe('sessionReward', () => {
  it('gives base 10 for a completed session', () => {
    expect(sessionReward(3, 5, 1)).toBe(10);
  });
  it('adds perfect bonus when all correct', () => {
    expect(sessionReward(5, 5, 1)).toBe(15);
  });
  it('adds milestone bonus every 7th streak day', () => {
    expect(sessionReward(3, 5, 7)).toBe(30); // 10 + 20
    expect(sessionReward(5, 5, 14)).toBe(35); // 10 + 5 + 20
  });
});

describe('constants', () => {
  it('exposes freeze cost and max', () => {
    expect(FREEZE_COST).toBe(50);
    expect(FREEZE_MAX).toBe(3);
  });
});
