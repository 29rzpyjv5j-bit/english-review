import { describe, it, expect } from 'vitest';
import { inReview, nextNeedsReview } from './review';

describe('틀린 항목 복습 목록', () => {
  it('틀리면 목록에 들어간다', () => {
    expect(nextNeedsReview({ wrong: 0, box: 3 }, false, false)).toBe(true);
  });

  it('복습에서 맞히면 목록에서 빠진다', () => {
    expect(nextNeedsReview({ needsReview: true, wrong: 1, box: 1 }, true, true)).toBe(false);
  });

  it('일반 학습에서 맞힌 것은 목록을 그대로 둔다', () => {
    expect(nextNeedsReview({ needsReview: true, wrong: 1, box: 1 }, true, false)).toBe(true);
    expect(nextNeedsReview({ needsReview: false, wrong: 0, box: 2 }, true, false)).toBe(false);
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
