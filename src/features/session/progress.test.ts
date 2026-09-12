import { beforeEach, describe, expect, it } from 'vitest';
import { clearProgress, loadProgress, saveProgress, type SessionProgress } from './progress';
import type { Exercise } from './buildSession';

const exercises: Exercise[] = [
  { kind: 'speakWord', wordId: 'w1', english: 'agenda', meaning: '안건' },
  { kind: 'speakWord', wordId: 'w2', english: 'schedule', meaning: '일정' },
  { kind: 'speakWord', wordId: 'w3', english: 'draft', meaning: '초안' },
];

const base: SessionProgress = {
  date: '2026-09-12',
  mode: 'normal',
  exercises,
  index: 1,
  correctCount: 1,
  wrongItems: [],
};

beforeEach(() => {
  clearProgress();
});

describe('세션 진행 상황', () => {
  it('같은 날짜·모드면 그대로 복원한다', () => {
    saveProgress(base);
    expect(loadProgress('2026-09-12', 'normal')).toEqual(base);
  });

  it('날짜가 바뀌면 버린다', () => {
    saveProgress(base);
    expect(loadProgress('2026-09-13', 'normal')).toBeNull();
  });

  it('다른 모드의 진행은 가져오지 않는다', () => {
    saveProgress(base);
    expect(loadProgress('2026-09-12', 'review')).toBeNull();
  });

  it('첫 문제에 머물러 있으면 복원할 게 없다', () => {
    saveProgress({ ...base, index: 0 });
    expect(loadProgress('2026-09-12', 'normal')).toBeNull();
  });

  it('이미 끝난 진행은 복원하지 않는다', () => {
    saveProgress({ ...base, index: exercises.length });
    expect(loadProgress('2026-09-12', 'normal')).toBeNull();
  });

  it('완료 후 지우면 남지 않는다', () => {
    saveProgress(base);
    clearProgress();
    expect(loadProgress('2026-09-12', 'normal')).toBeNull();
  });

  it('저장된 값이 깨져 있어도 학습을 막지 않는다', () => {
    localStorage.setItem('session_progress', '{ 깨진 JSON');
    expect(loadProgress('2026-09-12', 'normal')).toBeNull();
  });
});
