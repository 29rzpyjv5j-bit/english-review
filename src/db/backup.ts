import { getDB } from './db';
import type { Deck, Word, Sentence } from '../types';

export interface BackupData {
  version: number;
  decks: Deck[];
  words: Word[];
  sentences: Sentence[];
}

// 모든 덱·단어·문장을 하나의 백업 객체로 내보낸다(다른 기기/브라우저로 옮기거나 백업용).
export async function exportData(): Promise<BackupData> {
  const db = await getDB();
  const [decks, words, sentences] = await Promise.all([
    db.getAll('decks'),
    db.getAll('words'),
    db.getAll('sentences'),
  ]);
  return { version: 1, decks, words, sentences };
}

// 백업 객체로 현재 데이터를 교체한다(기존 덱·단어·문장은 지워짐). 프로필/스트릭은 유지.
export async function importData(data: BackupData): Promise<void> {
  if (!data || !Array.isArray(data.decks) || !Array.isArray(data.words) || !Array.isArray(data.sentences)) {
    throw new Error('백업 파일 형식이 올바르지 않아요.');
  }
  const db = await getDB();
  const tx = db.transaction(['decks', 'words', 'sentences'], 'readwrite');
  await Promise.all([
    tx.objectStore('decks').clear(),
    tx.objectStore('words').clear(),
    tx.objectStore('sentences').clear(),
  ]);
  await Promise.all(data.decks.map((d) => tx.objectStore('decks').put(d)));
  await Promise.all(data.words.map((w) => tx.objectStore('words').put(w)));
  await Promise.all(data.sentences.map((s) => tx.objectStore('sentences').put(s)));
  await tx.done;
}
