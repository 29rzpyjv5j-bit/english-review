import { describe, it, expect } from 'vitest';
import { isCorrectText, similarity, isCloseEnough } from './grading';

describe('grading', () => {
  it('matches ignoring case, punctuation, extra spaces', () => {
    expect(isCorrectText('  Hello, World! ', 'hello world')).toBe(true);
  });
  it('rejects different words', () => {
    expect(isCorrectText('cat', 'dog')).toBe(false);
  });
  it('similarity is 1 for same tokens', () => {
    expect(similarity('send the agenda', 'Send the agenda.')).toBe(1);
  });
  it('similarity is partial for overlapping tokens', () => {
    expect(similarity('send the agenda now', 'send the agenda')).toBeCloseTo(0.75, 2);
  });
  it('isCloseEnough passes near-miss speech under threshold', () => {
    expect(isCloseEnough('could you send the agenda', 'could you send me the agenda', 0.8)).toBe(true);
  });
});
