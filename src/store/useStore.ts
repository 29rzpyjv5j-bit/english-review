import { create } from 'zustand';
import type { Deck, Word, Sentence, Profile } from '../types';
import type { ParsedWord, ParsedSentence } from '../lib/parse';
import * as db from '../db/db';
import { applyResult } from '../lib/leitner';
import { applyStudyDay } from '../lib/streak';
import { sessionReward, FREEZE_COST, FREEZE_MAX } from '../lib/gems';
import { todayStr } from '../lib/dateUtils';

interface State {
  loaded: boolean;
  decks: Deck[];
  words: Word[];
  sentences: Sentence[];
  profile: Profile;
  load: () => Promise<void>;
  createDeck: (name: string, words: ParsedWord[], sentences: ParsedSentence[]) => Promise<void>;
  recordWord: (id: string, correct: boolean) => Promise<void>;
  recordSentence: (id: string, correct: boolean) => Promise<void>;
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
    };
    await db.updateSentence(updated);
    set((s) => ({ sentences: s.sentences.map((x) => (x.id === id ? updated : x)) }));
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
