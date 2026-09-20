import { describe, it, expect } from 'vitest';
import { inReview, nextNeedsReview, nextReviewStreak, isMastered, masteredLabel } from './review';

describe('틀린 항목 복습 목록', () => {
  it('틀리면 목록에 들어간다', () => {
    expect(nextNeedsReview({ wrong: 0, box: 3 }, false)).toBe(true);
  });

  it('맞혀도 목록에서 저절로 빠지지 않는다', () => {
    expect(nextNeedsReview({ needsReview: true, wrong: 1, box: 1 }, true)).toBe(true);
  });

  it('목록에 없던 항목은 맞혀도 들어가지 않는다', () => {
    expect(nextNeedsReview({ needsReview: false, wrong: 0, box: 2 }, true)).toBe(false);
  });

  it('표시가 없는 예전 기록은 틀린 뒤 첫 칸에 머문 항목만 목록에 있다고 본다', () => {
    expect(inReview({ wrong: 1, box: 1 })).toBe(true);
    expect(inReview({ wrong: 1, box: 2 })).toBe(false);
    expect(inReview({ wrong: 0, box: 1 })).toBe(false);
  });

  it('표시가 있으면 표시를 따른다', () => {
    expect(inReview({ needsReview: false, wrong: 3, box: 1 })).toBe(false);
    expect(inReview({ needsReview: true, wrong: 0, box: 4 })).toBe(true);
  });
});

describe('연속으로 맞힌 횟수', () => {
  it('맞히면 하나씩 올라가고 틀리면 0으로 돌아간다', () => {
    expect(nextReviewStreak({ wrong: 1, box: 1 }, true)).toBe(1);
    expect(nextReviewStreak({ reviewStreak: 2, wrong: 1, box: 1 }, true)).toBe(3);
    expect(nextReviewStreak({ reviewStreak: 5, wrong: 1, box: 1 }, false)).toBe(0);
  });

  it('세 번 연속 맞히면 빼도 좋다고 표시한다', () => {
    expect(isMastered({ reviewStreak: 2, wrong: 1, box: 1 })).toBe(false);
    expect(isMastered({ reviewStreak: 3, wrong: 1, box: 1 })).toBe(true);
  });

  it('횟수를 읽기 쉬운 말로 보여준다', () => {
    expect(masteredLabel({ wrong: 1, box: 1 })).toBe('아직');
    expect(masteredLabel({ reviewStreak: 4, wrong: 1, box: 1 })).toBe('4회 연속');
  });
});
