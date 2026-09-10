import { daysBetween } from './dateUtils';

export interface StreakInput {
  streakCount: number;
  lastStudyDate: string | null;
  freezeCount: number;
}

export interface StreakResult {
  streakCount: number;
  freezeCount: number;
  lastStudyDate: string;
  changed: boolean;
}

export function applyStudyDay(p: StreakInput, today: string): StreakResult {
  if (p.lastStudyDate === today) {
    return { streakCount: p.streakCount, freezeCount: p.freezeCount, lastStudyDate: today, changed: false };
  }
  if (p.lastStudyDate === null) {
    return { streakCount: 1, freezeCount: p.freezeCount, lastStudyDate: today, changed: true };
  }
  const gap = daysBetween(p.lastStudyDate, today);
  if (gap === 1) {
    return { streakCount: p.streakCount + 1, freezeCount: p.freezeCount, lastStudyDate: today, changed: true };
  }
  const missed = gap - 1;
  if (p.freezeCount >= missed) {
    return {
      streakCount: p.streakCount + 1,
      freezeCount: p.freezeCount - missed,
      lastStudyDate: today,
      changed: true,
    };
  }
  return { streakCount: 1, freezeCount: p.freezeCount, lastStudyDate: today, changed: true };
}
