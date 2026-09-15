import { daysBetween } from './dateUtils';
import type { Exercise } from '../features/session/buildSession';
import type { Deck, Word, Sentence } from '../types';

export interface FriendView {
  streak: number;
  doneToday: boolean;
  lastStudied: string;
}

// 서버에는 마지막으로 올린 연속 일수가 남아 있을 뿐이라, 며칠 쉬어 끊긴 연속도 그대로 보인다.
// 어제나 오늘 공부한 사람만 연속으로 치고, 그보다 오래됐으면 0으로 보여준다.
// (프리즈로 메워질 수도 있지만 그건 본인이 다음에 공부할 때 반영된다.)
export function describeFriend(lastStudyDate: string | null, streakCount: number, today: string): FriendView {
  if (!lastStudyDate) return { streak: 0, doneToday: false, lastStudied: '아직 학습 전' };
  const gap = daysBetween(lastStudyDate, today);
  const doneToday = gap <= 0;
  const lastStudied = gap <= 0 ? '오늘' : gap === 1 ? '어제' : `${gap}일 전`;
  return { streak: gap <= 1 ? streakCount : 0, doneToday, lastStudied };
}

// 오늘 끝낸 사람을 먼저, 그다음 연속이 긴 순서로.
export function rankFriends<T extends { nickname: string; view: FriendView }>(list: T[]): T[] {
  return [...list].sort(
    (a, b) =>
      Number(b.view.doneToday) - Number(a.view.doneToday) ||
      b.view.streak - a.view.streak ||
      a.nickname.localeCompare(b.nickname, 'ko'),
  );
}

// 한 세션에 여러 자료가 섞여 나오므로, 가장 많이 나온 자료를 "지금 공부 중"으로 친다.
export function mostStudiedDeck(
  exercises: Exercise[],
  words: Word[],
  sentences: Sentence[],
  decks: Deck[],
): string | null {
  const deckOfWord = new Map(words.map((w) => [w.id, w.deckId]));
  const deckOfSentence = new Map(sentences.map((s) => [s.id, s.deckId]));
  const counts = new Map<string, number>();
  const bump = (deckId: string | undefined) => {
    if (deckId) counts.set(deckId, (counts.get(deckId) ?? 0) + 1);
  };
  for (const ex of exercises) {
    if (ex.kind === 'matching') ex.pairs.forEach((p) => bump(deckOfWord.get(p.id)));
    else if (ex.kind === 'mcq' || ex.kind === 'speakWord') bump(deckOfWord.get(ex.wordId));
    else bump(deckOfSentence.get(ex.sentenceId));
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const [deckId, n] of counts) {
    if (n > bestCount) {
      best = deckId;
      bestCount = n;
    }
  }
  return decks.find((d) => d.id === best)?.name ?? null;
}
