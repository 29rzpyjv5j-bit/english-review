import { describe, it, expect, beforeEach } from 'vitest';
import { deleteDB } from 'idb';
import {
  addDeck, listDecks, addWords, listWords, updateWord,
  addSentences, listSentences, getProfile, saveProfile,
} from './db';

beforeEach(async () => {
  await deleteDB('english-review');
});

describe('db', () => {
  it('adds and lists decks', async () => {
    const d = await addDeck('Chapter 3');
    expect(d.name).toBe('Chapter 3');
    const decks = await listDecks();
    expect(decks).toHaveLength(1);
  });

  it('adds words with default review fields and lists by deck', async () => {
    const d = await addDeck('D');
    const words = await addWords(d.id, [{ english: 'agenda', meaning: '안건' }]);
    expect(words[0].box).toBe(1);
    expect(words[0].dueDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const listed = await listWords(d.id);
    expect(listed).toHaveLength(1);
  });

  it('updates a word', async () => {
    const d = await addDeck('D');
    const [w] = await addWords(d.id, [{ english: 'agenda', meaning: '안건' }]);
    await updateWord({ ...w, box: 3, correct: 2 });
    const [updated] = await listWords(d.id);
    expect(updated.box).toBe(3);
    expect(updated.correct).toBe(2);
  });

  it('adds and lists sentences', async () => {
    const d = await addDeck('D');
    await addSentences(d.id, [{ text: 'Hello.', translation: '안녕.' }]);
    const listed = await listSentences(d.id);
    expect(listed[0].text).toBe('Hello.');
  });

  it('returns default profile then persists changes', async () => {
    const p = await getProfile();
    expect(p.gems).toBe(0);
    expect(p.streakCount).toBe(0);
    await saveProfile({ ...p, gems: 40, streakCount: 3 });
    const p2 = await getProfile();
    expect(p2.gems).toBe(40);
    expect(p2.streakCount).toBe(3);
  });
});
