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

  it('틀린 항목은 앱을 다시 켜도 복습 목록에 남고, 복습에서 맞히면 빠진다', async () => {
    await useStore.getState().createDeck('D', [{ english: 'agenda', meaning: '안건' }], [{ text: 'Hi.' }]);
    const wordId = useStore.getState().words[0].id;
    const sentId = useStore.getState().sentences[0].id;
    await useStore.getState().recordWord(wordId, false);
    await useStore.getState().recordSentence(sentId, false);

    // 앱 재시작: 메모리를 비우고 저장소에서 다시 읽는다.
    useStore.setState({ loaded: false, words: [], sentences: [] });
    await useStore.getState().load();
    expect(useStore.getState().words[0].needsReview).toBe(true);
    expect(useStore.getState().sentences[0].needsReview).toBe(true);

    // 일반 학습에서 맞혀도 목록에 남는다.
    await useStore.getState().recordWord(wordId, true, false);
    expect(useStore.getState().words[0].needsReview).toBe(true);

    // 복습에서 맞히면 빠진다.
    await useStore.getState().recordWord(wordId, true, true);
    await useStore.getState().load();
    expect(useStore.getState().words[0].needsReview).toBe(false);
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
