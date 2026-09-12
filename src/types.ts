export type Direction = 'en2ko' | 'ko2en';
export type League = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Sapphire';

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
  currentLeague: League;
}
