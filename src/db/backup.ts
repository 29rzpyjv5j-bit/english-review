import { getDB, getProfile, saveProfile } from './db';
import type { Deck, Word, Sentence, Profile } from '../types';

export interface BackupData {
  version: number;
  decks: Deck[];
  words: Word[];
  sentences: Sentence[];
  /** version 2부터. 이전 백업 파일에는 없다. */
  profile?: Profile;
}

// 기기 양쪽에 쌓인 기록을 합친다. 어느 쪽도 손해 보지 않도록 유리한 값을 남기고,
// 학습한 날짜는 합집합으로 둔다(같은 날을 양쪽에서 했어도 하루로 센다).
export function mergeProfiles(current: Profile, incoming: Profile): Profile {
  const byDate = new Map<string, boolean>();
  for (const h of [...current.history, ...incoming.history]) {
    byDate.set(h.date, (byDate.get(h.date) ?? false) || h.completed);
  }
  const history = [...byDate.entries()]
    .map(([date, completed]) => ({ date, completed }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const dates = [current.lastStudyDate, incoming.lastStudyDate].filter((d): d is string => d !== null).sort();

  return {
    streakCount: Math.max(current.streakCount, incoming.streakCount),
    lastStudyDate: dates.length > 0 ? dates[dates.length - 1] : null,
    gems: Math.max(current.gems, incoming.gems),
    freezeCount: Math.max(current.freezeCount, incoming.freezeCount),
    dailyGoalSessions: incoming.dailyGoalSessions || current.dailyGoalSessions,
    history,
  };
}

// 모든 덱·단어·문장과 학습 기록을 하나의 백업 객체로 내보낸다(다른 기기/브라우저로 옮기거나 백업용).
export async function exportData(): Promise<BackupData> {
  const db = await getDB();
  const [decks, words, sentences, profile] = await Promise.all([
    db.getAll('decks'),
    db.getAll('words'),
    db.getAll('sentences'),
    getProfile(),
  ]);
  return { version: 2, decks, words, sentences, profile };
}

// 백업 객체로 현재 데이터를 교체한다(기존 덱·단어·문장은 지워짐).
// 연속·보석 같은 학습 기록은 교체가 아니라 이 기기의 기록과 합친다.
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

  if (data.profile) {
    await saveProfile(mergeProfiles(await getProfile(), data.profile));
  }
}
