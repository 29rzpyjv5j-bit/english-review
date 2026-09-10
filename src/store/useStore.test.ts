import { describe, it, expect, beforeEach } from 'vitest';
import { deleteDB } from 'idb';
import { useStore } from './useStore';

beforeEach(async () => {
  await deleteDB('english-review');
  useStore.setState({
    loaded: false, decks: [], words: [], sentences: [],
    profile: { streakCount: 0, lastStudyDate: null, gems: 0, freezeCount: 0, dailyGoalSessions: 1, history: [] },
  });
});

describe('useStore', () => {
  it('creates a deck with words and sentences', async () => {
    await useStore.getState().createDeck('D', [{ english: 'agenda', meaning: '안건' }], [{ text: 'Hi.' }]);
    const s = useStore.getState();
    expect(s.decks).toHaveLength(1);
    expect(s.words).toHaveLength(1);
    expect(s.sentences).toHaveLength(1);
  });

  it('records a correct word answer and advances its box', async () => {
    await useStore.getState().createDeck('D', [{ english: 'agenda', meaning: '안건' }], []);
    const id = useStore.getState().words[0].id;
    await useStore.getState().recordWord(id, true);
    const w = useStore.getState().words.find((x) => x.id === id)!;
    expect(w.box).toBe(2);
    expect(w.correct).toBe(1);
    expect(w.seen).toBe(1);
  });

  it('completeSession awards gems and updates streak', async () => {
    const { gained } = await useStore.getState().completeSession(5, 5);
    const p = useStore.getState().profile;
    expect(gained).toBe(15); // perfect
    expect(p.gems).toBe(15);
    expect(p.streakCount).toBe(1);
  });

  it('buyFreeze spends gems when affordable', async () => {
    useStore.setState((s) => ({ profile: { ...s.profile, gems: 60 } }));
    const ok = await useStore.getState().buyFreeze();
    expect(ok).toBe(true);
    const p = useStore.getState().profile;
    expect(p.gems).toBe(10);
    expect(p.freezeCount).toBe(1);
  });

  it('buyFreeze fails when too few gems', async () => {
    useStore.setState((s) => ({ profile: { ...s.profile, gems: 10 } }));
    const ok = await useStore.getState().buyFreeze();
    expect(ok).toBe(false);
  });
});
