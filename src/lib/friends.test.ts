import { describe, it, expect } from 'vitest';
import { describeFriend, rankFriends, mostStudiedDeck } from './friends';
import type { Word, Sentence } from '../types';

const srs = { box: 1, dueDate: '2026-09-15', seen: 0, correct: 0, wrong: 0 };

describe('describeFriend', () => {
  it('오늘 공부했으면 연속 그대로, 오늘 완료', () => {
    expect(describeFriend('2026-09-15', 5, '2026-09-15')).toEqual({ streak: 5, doneToday: true, lastStudied: '오늘' });
  });

  it('어제까지 공부했으면 연속은 살아 있지만 오늘은 아직', () => {
    expect(describeFriend('2026-09-14', 5, '2026-09-15')).toEqual({ streak: 5, doneToday: false, lastStudied: '어제' });
  });

  it('이틀 이상 쉬었으면 연속은 끊긴 것으로 보여준다', () => {
    expect(describeFriend('2026-09-12', 5, '2026-09-15')).toEqual({ streak: 0, doneToday: false, lastStudied: '3일 전' });
  });

  it('아직 한 번도 안 했으면', () => {
    expect(describeFriend(null, 0, '2026-09-15')).toEqual({ streak: 0, doneToday: false, lastStudied: '아직 학습 전' });
  });
});

describe('rankFriends', () => {
  it('오늘 끝낸 사람이 먼저, 그다음 연속이 긴 순서', () => {
    const f = (nickname: string, doneToday: boolean, streak: number) => ({ nickname, view: { doneToday, streak, lastStudied: '' } });
    const ranked = rankFriends([f('가', false, 30), f('나', true, 2), f('다', true, 9)]);
    expect(ranked.map((x) => x.nickname)).toEqual(['다', '나', '가']);
  });
});

describe('mostStudiedDeck', () => {
  const decks = [{ id: 'a', name: 'CLO 1', createdAt: 0 }, { id: 'b', name: 'CLO 8', createdAt: 0 }];
  const words: Word[] = [
    { id: 'w1', deckId: 'a', english: 'x', meaning: 'y', ...srs },
    { id: 'w2', deckId: 'b', english: 'x', meaning: 'y', ...srs },
    { id: 'w3', deckId: 'b', english: 'x', meaning: 'y', ...srs },
  ];
  const sentences: Sentence[] = [{ id: 's1', deckId: 'b', text: 'Hi.', ...srs }];

  it('세션에서 가장 많이 나온 자료를 고른다', () => {
    const name = mostStudiedDeck(
      [
        { kind: 'mcq', wordId: 'w1', prompt: '', answer: '', choices: [], direction: 'en2ko' },
        { kind: 'matching', pairs: [{ id: 'w2', english: '', meaning: '' }, { id: 'w3', english: '', meaning: '' }] },
        { kind: 'dictation', sentenceId: 's1', text: 'Hi.' },
      ],
      words, sentences, decks,
    );
    expect(name).toBe('CLO 8');
  });

  it('알 수 없으면 null', () => {
    expect(mostStudiedDeck([], words, sentences, decks)).toBeNull();
  });
});
