export interface ReviewState {
  needsReview?: boolean;
  reviewStreak?: number;
  wrong: number;
  box: number;
}

/** 이만큼 연속으로 맞히면 "이제 빼도 되겠다"고 표시하고, 한 번에 정리할 수 있게 한다. */
export const MASTERED_AFTER = 3;

// 틀린 항목 복습 목록에 들어 있는지. 이 표시가 생기기 전의 기록은 "틀린 적이 있고
// 그 뒤로 맞히지 못해 첫 칸에 머물러 있는" 항목을 목록에 있는 것으로 본다.
export function inReview(item: ReviewState): boolean {
  return item.needsReview ?? (item.wrong > 0 && item.box === 1);
}

// 한 번 목록에 들어온 항목은 맞혀도 저절로 빠지지 않는다. 언제 빼는지는 사용자가 정한다.
export function nextNeedsReview(item: ReviewState, correct: boolean): boolean {
  return correct ? inReview(item) : true;
}

// 연속으로 맞힌 횟수. 틀리면 0부터 다시 센다.
export function nextReviewStreak(item: ReviewState, correct: boolean): number {
  return correct ? (item.reviewStreak ?? 0) + 1 : 0;
}

export function isMastered(item: ReviewState): boolean {
  return (item.reviewStreak ?? 0) >= MASTERED_AFTER;
}

export function masteredLabel(item: ReviewState): string {
  const streak = item.reviewStreak ?? 0;
  return streak === 0 ? '아직' : `${streak}회 연속`;
}
