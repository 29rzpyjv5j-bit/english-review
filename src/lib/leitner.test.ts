import { describe, it, expect } from 'vitest';
import { applyResult, selectSessionItems, type SessionCandidate } from './leitner';

describe('applyResult', () => {
  it('increments box and pushes dueDate on correct', () => {
    const r = applyResult({ box: 1, dueDate: '2026-09-11' }, true, '2026-09-11');
    expect(r.box).toBe(2);
    expect(r.dueDate).toBe('2026-09-12'); // INTERVALS[1] = 1
  });
  it('caps box at 5', () => {
    const r = applyResult({ box: 5, dueDate: '2026-09-11' }, true, '2026-09-11');
    expect(r.box).toBe(5);
    expect(r.dueDate).toBe('2026-09-18'); // INTERVALS[4] = 7
  });
  it('resets to box 1 due today on wrong', () => {
    const r = applyResult({ box: 4, dueDate: '2026-09-20' }, false, '2026-09-11');
    expect(r.box).toBe(1);
    expect(r.dueDate).toBe('2026-09-11');
  });
});

describe('selectSessionItems', () => {
  const items: SessionCandidate[] = [
    { id: 'a', box: 3, dueDate: '2026-09-11', kind: 'word' },     // due, higher box
    { id: 'b', box: 1, dueDate: '2026-09-10', kind: 'word' },     // due, low box, overdue
    { id: 'c', box: 2, dueDate: '2026-09-20', kind: 'sentence' }, // not due
    { id: 'd', box: 1, dueDate: '2026-09-11', kind: 'sentence' }, // due, low box
  ];
  it('prioritizes due items by low box then oldest due', () => {
    const sel = selectSessionItems(items, '2026-09-11', 2);
    expect(sel.map((s) => s.id)).toEqual(['b', 'd']);
  });
  it('fills remaining slots with soonest upcoming when not enough due', () => {
    const sel = selectSessionItems(items, '2026-09-11', 4);
    expect(sel.map((s) => s.id)).toEqual(['b', 'd', 'a', 'c']);
  });
});
