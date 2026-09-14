export interface ReviewState {
  needsReview?: boolean;
  wrong: number;
  box: number;
}

// 틀린 항목 복습 목록에 들어 있는지. 이 표시가 생기기 전의 기록은 "틀린 적이 있고
// 그 뒤로 맞히지 못해 첫 칸에 머물러 있는" 항목을 목록에 있는 것으로 본다.
export function inReview(item: ReviewState): boolean {
  return item.needsReview ?? (item.wrong > 0 && item.box === 1);
}

// 틀리면 목록에 넣고, 복습에서 맞히면 뺀다. 일반 학습에서 맞힌 것은 목록을 건드리지 않는다.
export function nextNeedsReview(item: ReviewState, correct: boolean, fromReview: boolean): boolean {
  if (!correct) return true;
  return fromReview ? false : inReview(item);
}
