export const FREEZE_COST = 50;
export const FREEZE_MAX = 3;

export function sessionReward(correct: number, total: number, streakCount: number): number {
  let gems = 10;
  if (total > 0 && correct === total) gems += 5;
  if (streakCount > 0 && streakCount % 7 === 0) gems += 20;
  return gems;
}
