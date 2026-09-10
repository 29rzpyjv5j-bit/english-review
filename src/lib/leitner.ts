import { addDays, daysBetween } from './dateUtils';

export const INTERVALS = [0, 1, 2, 4, 7];

export interface Reviewable {
  box: number;
  dueDate: string;
}

export function applyResult<T extends Reviewable>(item: T, correct: boolean, today: string): T {
  const box = correct ? Math.min(5, item.box + 1) : 1;
  const interval = INTERVALS[box - 1];
  return { ...item, box, dueDate: addDays(today, interval) };
}

export interface SessionCandidate {
  id: string;
  box: number;
  dueDate: string;
  kind: 'word' | 'sentence';
}

export function selectSessionItems(
  items: SessionCandidate[],
  today: string,
  size: number,
): SessionCandidate[] {
  const due = items.filter((i) => daysBetween(i.dueDate, today) >= 0);
  const notDue = items.filter((i) => daysBetween(i.dueDate, today) < 0);
  due.sort((a, b) => a.box - b.box || a.dueDate.localeCompare(b.dueDate));
  const selected = due.slice(0, size);
  if (selected.length < size) {
    notDue.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    selected.push(...notDue.slice(0, size - selected.length));
  }
  return selected;
}
