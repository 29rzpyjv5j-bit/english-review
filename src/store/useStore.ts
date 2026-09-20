import { create } from 'zustand';
import type { Deck, Word, Sentence, Profile } from '../types';
import type { ParsedWord, ParsedSentence } from '../lib/parse';
import * as db from '../db/db';
import { applyResult } from '../lib/leitner';
import { applyStudyDay } from '../lib/streak';
import { sessionReward, FREEZE_COST, FREEZE_MAX } from '../lib/gems';
import { todayStr } from '../lib/dateUtils';
import { getQuietMode, setQuietMode } from '../settings/quiet';
import { nextNeedsReview, nextReviewStreak } from '../lib/review';

interface State {
  loaded: boolean;
  decks: Deck[];
  words: Word[];
  sentences: Sentence[];
  profile: Profile;
  /** 무음 학습: 말하기 문제 대신 쓰기 문제로 낸다. */
  quiet: boolean;
  setQuiet: (on: boolean) => void;
  load: () => Promise<void>;
  createDeck: (name: string, words: ParsedWord[], sentences: ParsedSentence[]) => Promise<void>;
  /** CSV 일괄 가져오기용. 같은 이름의 자료가 있으면 새로 만들지 않고 거기에 더한다. */
  importIntoDeck: (name: string, words: ParsedWord[], sentences: ParsedSentence[]) => Promise<void>;
  recordWord: (id: string, correct: boolean) => Promise<void>;
  recordSentence: (id: string, correct: boolean) => Promise<void>;
  /** 복습 목록에서 직접 뺀다. 사용자가 더 볼 필요 없다고 판단했을 때만 부른다. */
  removeFromReview: (ids: string[]) => Promise<void>;
  completeSession: (correct: number, total: number) => Promise<{ gained: number }>;
  buyFreeze: () => Promise<boolean>;
}

const EMPTY_PROFILE: Profile = {
  streakCount: 0, lastStudyDate: null, gems: 0, freezeCount: 0, dailyGoalSessions: 1, history: [],
};

export const useStore = create<State>((set, get) => ({
  loaded: false,
  decks: [],
  words: [],
  sentences: [],
  profile: EMPTY_PROFILE,
  quiet: getQuietMode(),

  setQuiet(on) {
    setQuietMode(on);
    set({ quiet: on });
  },

  async load() {
    const [decks, words, sentences, profile] = await Promise.all([
      db.listDecks(), db.listWords(), db.listSentences(), db.getProfile(),
    ]);
    set({ decks, words, sentences, profile, loaded: true });
  },

  async createDeck(name, words, sentences) {
    const deck = await db.addDeck(name);
    const newWords = await db.addWords(deck.id, words);
    const newSentences = await db.addSentences(deck.id, sentences);
    set((s) => ({
      decks: [...s.decks, deck],
      words: [...s.words, ...newWords],
      sentences: [...s.sentences, ...newSentences],
    }));
  },

  async importIntoDeck(name, words, sentences) {
    const existing = get().decks.find((d) => d.name === name);
    if (!existing) {
      await get().createDeck(name, words, sentences);
      return;
    }
    const newWords = await db.addWords(existing.id, words);
    const newSentences = await db.addSentences(existing.id, sentences);
    set((s) => ({
      words: [...s.words, ...newWords],
      sentences: [...s.sentences, ...newSentences],
    }));
  },

  async recordWord(id, correct) {
    const today = todayStr();
    const word = get().words.find((w) => w.id === id);
    if (!word) return;
    const advanced = applyResult(word, correct, today);
    const updated: Word = {
      ...advanced,
      seen: word.seen + 1,
      correct: word.correct + (correct ? 1 : 0),
      wrong: word.wrong + (correct ? 0 : 1),
      needsReview: nextNeedsReview(word, correct),
      reviewStreak: nextReviewStreak(word, correct),
    };
    await db.updateWord(updated);
    set((s) => ({ words: s.words.map((w) => (w.id === id ? updated : w)) }));
  },

  async recordSentence(id, correct) {
    const today = todayStr();
    const sentence = get().sentences.find((x) => x.id === id);
    if (!sentence) return;
    const advanced = applyResult(sentence, correct, today);
    const updated: Sentence = {
      ...advanced,
      seen: sentence.seen + 1,
      correct: sentence.correct + (correct ? 1 : 0),
      wrong: sentence.wrong + (correct ? 0 : 1),
      needsReview: nextNeedsReview(sentence, correct),
      reviewStreak: nextReviewStreak(sentence, correct),
    };
    await db.updateSentence(updated);
    set((s) => ({ sentences: s.sentences.map((x) => (x.id === id ? updated : x)) }));
  },

  async removeFromReview(ids) {
    const drop = new Set(ids);
    const words = get().words.filter((w) => drop.has(w.id)).map((w) => ({ ...w, needsReview: false, reviewStreak: 0 }));
    const sentences = get().sentences.filter((s) => drop.has(s.id)).map((s) => ({ ...s, needsReview: false, reviewStreak: 0 }));
    await Promise.all([...words.map(db.updateWord), ...sentences.map(db.updateSentence)]);
    set((s) => ({
      words: s.words.map((w) => words.find((x) => x.id === w.id) ?? w),
      sentences: s.sentences.map((x) => sentences.find((y) => y.id === x.id) ?? x),
    }));
  },

  async completeSession(correct, total) {
    const today = todayStr();
    const p = get().profile;
    const streak = applyStudyDay(
      { streakCount: p.streakCount, lastStudyDate: p.lastStudyDate, freezeCount: p.freezeCount },
      today,
    );
    const gained = sessionReward(correct, total, streak.streakCount);
    const history = p.history.some((h) => h.date === today)
      ? p.history
      : [...p.history, { date: today, completed: true }];
    const profile: Profile = {
      ...p,
      streakCount: streak.streakCount,
      freezeCount: streak.freezeCount,
      lastStudyDate: streak.lastStudyDate,
      gems: p.gems + gained,
      history,
    };
    await db.saveProfile(profile);
    set({ profile });
    return { gained };
  },

  async buyFreeze() {
    const p = get().profile;
    if (p.gems < FREEZE_COST || p.freezeCount >= FREEZE_MAX) return false;
    const profile: Profile = { ...p, gems: p.gems - FREEZE_COST, freezeCount: p.freezeCount + 1 };
    await db.saveProfile(profile);
    set({ profile });
    return true;
  },
}));
