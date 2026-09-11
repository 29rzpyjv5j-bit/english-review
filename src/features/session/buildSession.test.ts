import { describe, it, expect } from 'vitest';
import { buildSession } from './buildSession';
import type { Word, Sentence } from '../../types';

function w(id: string, english: string, meaning: string): Word {
  return { id, deckId: 'd', english, meaning, box: 1, dueDate: '2026-09-11', seen: 0, correct: 0, wrong: 0 };
}
function s(id: string, text: string): Sentence {
  return { id, deckId: 'd', text, box: 1, dueDate: '2026-09-11', seen: 0, correct: 0, wrong: 0 };
}

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
