import { describe, it, expect } from 'vitest';
import { applyStudyDay } from './streak';

describe('applyStudyDay', () => {
  it('starts streak at 1 on first study', () => {
    const r = applyStudyDay({ streakCount: 0, lastStudyDate: null, freezeCount: 0 }, '2026-09-11');
    expect(r.streakCount).toBe(1);
    expect(r.changed).toBe(true);
  });
  it('does nothing if already studied today', () => {
    const r = applyStudyDay({ streakCount: 5, lastStudyDate: '2026-09-11', freezeCount: 2 }, '2026-09-11');
    expect(r.streakCount).toBe(5);
    expect(r.freezeCount).toBe(2);
    expect(r.changed).toBe(false);
  });
  it('increments on consecutive day', () => {
    const r = applyStudyDay({ streakCount: 5, lastStudyDate: '2026-09-10', freezeCount: 0 }, '2026-09-11');
    expect(r.streakCount).toBe(6);
  });
  it('consumes freezes to cover missed days and continues', () => {
    // last studied 09-08, today 09-11 => gap 3 => missed 2 days
    const r = applyStudyDay({ streakCount: 5, lastStudyDate: '2026-09-08', freezeCount: 2 }, '2026-09-11');
    expect(r.streakCount).toBe(6);
    expect(r.freezeCount).toBe(0);
  });
  it('resets to 1 when not enough freezes', () => {
    const r = applyStudyDay({ streakCount: 5, lastStudyDate: '2026-09-08', freezeCount: 1 }, '2026-09-11');
    expect(r.streakCount).toBe(1);
    expect(r.freezeCount).toBe(1);
  });
});
