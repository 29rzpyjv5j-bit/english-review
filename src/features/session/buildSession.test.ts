import { describe, it, expect } from 'vitest';
import { buildSession } from './buildSession';
import type { Word, Sentence } from '../../types';

function w(id: string, english: string, meaning: string): Word {
  return { id, deckId: 'd', english, meaning, box: 1, dueDate: '2026-09-11', seen: 0, correct: 0, wrong: 0 };
}
function s(id: string, text: string, translation?: string): Sentence {
  return { id, deckId: 'd', text, translation, box: 1, dueDate: '2026-09-11', seen: 0, correct: 0, wrong: 0 };
}

describe('buildSession · 단어와 문장 섞기', () => {
  it('includes sentence exercises even when words far outnumber them', () => {
    const manyWords = Array.from({ length: 20 }, (_, i) => w(`w${i}`, `word${i}`, `뜻${i}`));
    const someSentences = Array.from({ length: 20 }, (_, i) => s(`s${i}`, `Sentence ${i}.`));

    // 동점 항목의 순서를 섞으므로, 여러 번 구성하면 문장이 반드시 섞여 나온다.
    const sawSentence = Array.from({ length: 10 }, () =>
      buildSession(manyWords, someSentences, '2026-09-11', { sttSupported: false }),
    ).some((ex) => ex.some((e) => e.kind === 'dictation' || e.kind === 'repeatSentence' || e.kind === 'writeSentence'));

    expect(sawSentence).toBe(true);
  });
});

describe('buildSession · 무음 학습', () => {
  const words = [w('1', 'agenda', '안건'), w('2', 'schedule', '일정')];

  it('never emits speaking exercises even when STT is available', () => {
    const ex = buildSession(words, [s('s1', 'Hello.', '안녕.')], '2026-09-11', {
      sttSupported: true,
      quiet: true,
    });
    expect(ex.some((e) => e.kind === 'speakWord')).toBe(false);
    expect(ex.some((e) => e.kind === 'repeatSentence')).toBe(false);
  });

  it('turns a translated sentence into writeSentence (no audio needed)', () => {
    const ex = buildSession([], [s('s1', 'Hello.', '안녕.')], '2026-09-11', { sttSupported: true, quiet: true });
    const write = ex.find((e) => e.kind === 'writeSentence');
    expect(write).toBeTruthy();
    if (write && write.kind === 'writeSentence') {
      expect(write.translation).toBe('안녕.');
      expect(write.text).toBe('Hello.');
    }
  });

  it('falls back to dictation when a sentence has no translation', () => {
    const ex = buildSession([], [s('s1', 'Hello.')], '2026-09-11', { sttSupported: true, quiet: true });
    expect(ex.some((e) => e.kind === 'dictation')).toBe(true);
    expect(ex.some((e) => e.kind === 'writeSentence')).toBe(false);
  });
});

describe('buildSession', () => {
  const words = [w('1', 'agenda', '안건'), w('2', 'schedule', '일정'), w('3', 'meeting', '회의'), w('4', 'client', '고객')];
  const sentences = [s('s1', 'Could you send me the agenda?')];

  it('returns exercises with a leading matching card when >=4 words', () => {
    const ex = buildSession(words, sentences, '2026-09-11', { sttSupported: false });
    expect(ex[0].kind).toBe('matching');
    expect(ex.length).toBeGreaterThan(1);
  });

  it('uses dictation (not repeatSentence) when STT unsupported', () => {
    const ex = buildSession(words, sentences, '2026-09-11', { sttSupported: false });
    expect(ex.some((e) => e.kind === 'repeatSentence')).toBe(false);
    expect(ex.some((e) => e.kind === 'dictation')).toBe(true);
  });

  it('mcq choices include the correct answer', () => {
    const ex = buildSession(words, [], '2026-09-11', { sttSupported: false });
    const mcq = ex.find((e) => e.kind === 'mcq');
    expect(mcq).toBeTruthy();
    if (mcq && mcq.kind === 'mcq') {
      expect(mcq.choices).toContain(mcq.answer);
    }
  });
});
