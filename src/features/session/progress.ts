import type { Exercise } from './buildSession';

const KEY = 'session_progress';

export type SessionMode = 'normal' | 'review';

export interface SessionProgress {
  date: string;
  mode: SessionMode;
  exercises: Exercise[];
  index: number;
  correctCount: number;
  wrongItems: { id: string; text: string }[];
}

// 학습 도중 새로고침(PWA 자동 업데이트 포함)돼도 이어서 풀 수 있게 진행 상황을 남긴다.
// 날짜가 바뀌면 그날 문제 구성이 달라지므로 버린다.
export function loadProgress(date: string, mode: SessionMode): SessionProgress | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as SessionProgress;
    if (p.date !== date || p.mode !== mode) return null;
    if (!Array.isArray(p.exercises) || p.exercises.length === 0) return null;
    // 첫 문제이거나 이미 끝난 진행은 복원할 게 없다.
    if (!(p.index > 0 && p.index < p.exercises.length)) return null;
    return p;
  } catch {
    return null;
  }
}

export function saveProgress(p: SessionProgress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // 저장에 실패해도 학습 자체는 계속돼야 한다.
  }
}

export function clearProgress(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // 무시
  }
}
