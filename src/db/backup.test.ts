import { describe, it, expect, beforeEach } from 'vitest';
import { deleteDB } from 'idb';
import { exportData, importData, type BackupData } from './backup';
import { addDeck, addWords, listDecks, listWords } from './db';

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
});
