import { describe, it, expect, beforeEach } from 'vitest';
import { deleteDB } from 'idb';
import { exportData, importData, mergeProfiles, type BackupData } from './backup';
import { addDeck, addWords, listDecks, listWords, getProfile, saveProfile } from './db';
import type { Profile } from '../types';

const profile = (over: Partial<Profile> = {}): Profile => ({
  streakCount: 0, lastStudyDate: null, gems: 0, freezeCount: 0, dailyGoalSessions: 1, history: [], ...over,
});

beforeEach(async () => {
  await deleteDB('english-review');
});

describe('backup', () => {
  it('exports current data', async () => {
    const d = await addDeck('D');
    await addWords(d.id, [{ english: 'agenda', meaning: '안건' }]);
    const data = await exportData();
    expect(data.decks).toHaveLength(1);
    expect(data.words).toHaveLength(1);
    expect(data.sentences).toHaveLength(0);
  });

  it('imports data, replacing existing', async () => {
    const d = await addDeck('Old');
    await addWords(d.id, [{ english: 'x', meaning: 'y' }]);

    const backup: BackupData = {
      version: 1,
      decks: [{ id: 'nd', name: 'New', createdAt: 1 }],
      words: [{ id: 'nw', deckId: 'nd', english: 'agenda', meaning: '안건', box: 1, dueDate: '2026-09-12', seen: 0, correct: 0, wrong: 0 }],
      sentences: [],
    };
    await importData(backup);

    const decks = await listDecks();
    expect(decks).toHaveLength(1);
    expect(decks[0].name).toBe('New');
    const words = await listWords('nd');
    expect(words[0].english).toBe('agenda');
  });

  it('rejects malformed backup', async () => {
    await expect(importData({} as unknown as BackupData)).rejects.toThrow();
  });

  it('내보내기에 학습 기록이 담긴다', async () => {
    await saveProfile(profile({ streakCount: 3, gems: 40, lastStudyDate: '2026-09-12' }));
    const data = await exportData();
    expect(data.version).toBe(2);
    expect(data.profile?.streakCount).toBe(3);
    expect(data.profile?.gems).toBe(40);
  });

  it('기록이 없는 예전 백업은 이 기기 기록을 건드리지 않는다', async () => {
    await saveProfile(profile({ streakCount: 5, gems: 70 }));
    await importData({ version: 1, decks: [], words: [], sentences: [] });
    const after = await getProfile();
    expect(after.streakCount).toBe(5);
    expect(after.gems).toBe(70);
  });

  it('가져오기가 이 기기 기록을 지우지 않고 합친다', async () => {
    await saveProfile(profile({
      streakCount: 2, gems: 30, lastStudyDate: '2026-09-12',
      history: [{ date: '2026-09-12', completed: true }],
    }));
    await importData({
      version: 2, decks: [], words: [], sentences: [],
      profile: profile({
        streakCount: 1, gems: 10, lastStudyDate: '2026-09-10',
        history: [{ date: '2026-09-10', completed: true }],
      }),
    });
    const after = await getProfile();
    expect(after.streakCount).toBe(2);
    expect(after.gems).toBe(30);
    expect(after.lastStudyDate).toBe('2026-09-12');
    expect(after.history.map((h) => h.date)).toEqual(['2026-09-10', '2026-09-12']);
  });
});

describe('mergeProfiles', () => {
  it('양쪽에서 공부한 날을 모두 남기고 날짜순으로 둔다', () => {
    const merged = mergeProfiles(
      profile({ history: [{ date: '2026-09-12', completed: true }] }),
      profile({ history: [{ date: '2026-09-09', completed: true }] }),
    );
    expect(merged.history).toEqual([
      { date: '2026-09-09', completed: true },
      { date: '2026-09-12', completed: true },
    ]);
  });

  it('같은 날을 양쪽에서 했어도 하루로 센다', () => {
    const h = [{ date: '2026-09-12', completed: true }];
    expect(mergeProfiles(profile({ history: h }), profile({ history: h })).history).toHaveLength(1);
  });

  it('연속·보석·프리즈는 높은 쪽을 남긴다', () => {
    const merged = mergeProfiles(
      profile({ streakCount: 7, gems: 5, freezeCount: 0 }),
      profile({ streakCount: 2, gems: 90, freezeCount: 2 }),
    );
    expect(merged.streakCount).toBe(7);
    expect(merged.gems).toBe(90);
    expect(merged.freezeCount).toBe(2);
  });

  it('학습한 적 없는 기기끼리 합치면 마지막 학습일은 없다', () => {
    expect(mergeProfiles(profile(), profile()).lastStudyDate).toBeNull();
  });
});
