export type Direction = 'en2ko' | 'ko2en';

export interface Deck {
  id: string;
  name: string;
  createdAt: number;
}

export interface Word {
  id: string;
  deckId: string;
  english: string;
  meaning: string;
  /** 틀린 항목 복습 목록에 있는지. 없으면 예전 기록으로 판단한다(lib/review). */
  needsReview?: boolean;
  box: number; // 1..5
  dueDate: string; // 'YYYY-MM-DD'
  seen: number;
  correct: number;
  wrong: number;
}

export interface Sentence {
  id: string;
  deckId: string;
  text: string;
  translation?: string;
  /** 이 예문이 연습하는 표현. 예문과 함께 외울 수 있게 답을 낸 뒤 보여준다. */
  keyword?: string;
  needsReview?: boolean;
  box: number;
  dueDate: string;
  seen: number;
  correct: number;
  wrong: number;
}

export interface Profile {
  streakCount: number;
  lastStudyDate: string | null;
  gems: number;
  freezeCount: number;
  dailyGoalSessions: number;
  history: { date: string; completed: boolean }[];
}
