import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Deck, Word, Sentence, Profile } from '../types';
import { newId } from '../lib/id';
import { todayStr } from '../lib/dateUtils';

interface AppDB extends DBSchema {
  decks: { key: string; value: Deck };
  words: { key: string; value: Word; indexes: { byDeck: string } };
  sentences: { key: string; value: Sentence; indexes: { byDeck: string } };
  profile: { key: string; value: Profile };
}

let dbPromise: Promise<IDBPDatabase<AppDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<AppDB>> {
  if (!dbPromise) {
    dbPromise = openDB<AppDB>('english-review', 1, {
      upgrade(db) {
        db.createObjectStore('decks', { keyPath: 'id' });
        const w = db.createObjectStore('words', { keyPath: 'id' });
        w.createIndex('byDeck', 'deckId');
        const s = db.createObjectStore('sentences', { keyPath: 'id' });
        s.createIndex('byDeck', 'deckId');
        db.createObjectStore('profile');
      },
      blocking() {
        // Another connection (e.g. deleteDB in tests) wants exclusive access;
        // release ours so it can proceed, and drop the cache so the next
        // getDB() call reopens a fresh connection.
        dbPromise?.then((db) => db.close());
        dbPromise = null;
      },
    });
  }
  return dbPromise;
}

const DEFAULT_PROFILE: Profile = {
  streakCount: 0,
  lastStudyDate: null,
  gems: 0,
  freezeCount: 0,
  dailyGoalSessions: 1,
  history: [],
};

export async function addDeck(name: string): Promise<Deck> {
  const db = await getDB();
  const deck: Deck = { id: newId(), name, createdAt: Date.now() };
  await db.put('decks', deck);
  return deck;
}

export async function listDecks(): Promise<Deck[]> {
  return (await getDB()).getAll('decks');
}

export async function addWords(
  deckId: string,
  items: { english: string; meaning: string }[],
): Promise<Word[]> {
  const db = await getDB();
  const today = todayStr();
  const words: Word[] = items.map((it) => ({
    id: newId(), deckId, english: it.english, meaning: it.meaning,
    box: 1, dueDate: today, seen: 0, correct: 0, wrong: 0,
  }));
  const tx = db.transaction('words', 'readwrite');
  await Promise.all(words.map((w) => tx.store.put(w)));
  await tx.done;
  return words;
}

export async function addSentences(
  deckId: string,
  items: { text: string; translation?: string; keyword?: string }[],
): Promise<Sentence[]> {
  const db = await getDB();
  const today = todayStr();
  const sentences: Sentence[] = items.map((it) => ({
    id: newId(), deckId, text: it.text, translation: it.translation, keyword: it.keyword,
    box: 1, dueDate: today, seen: 0, correct: 0, wrong: 0,
  }));
  const tx = db.transaction('sentences', 'readwrite');
  await Promise.all(sentences.map((s) => tx.store.put(s)));
  await tx.done;
  return sentences;
}

export async function listWords(deckId?: string): Promise<Word[]> {
  const db = await getDB();
  return deckId ? db.getAllFromIndex('words', 'byDeck', deckId) : db.getAll('words');
}

export async function listSentences(deckId?: string): Promise<Sentence[]> {
  const db = await getDB();
  return deckId ? db.getAllFromIndex('sentences', 'byDeck', deckId) : db.getAll('sentences');
}

export async function updateWord(w: Word): Promise<void> {
  await (await getDB()).put('words', w);
}

export async function updateSentence(s: Sentence): Promise<void> {
  await (await getDB()).put('sentences', s);
}

export async function getProfile(): Promise<Profile> {
  const db = await getDB();
  return (await db.get('profile', 'me')) ?? { ...DEFAULT_PROFILE };
}

export async function saveProfile(p: Profile): Promise<void> {
  await (await getDB()).put('profile', p, 'me');
}
