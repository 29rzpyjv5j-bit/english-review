import { describe, it, expect } from 'vitest';
import { isCorrectText, similarity, isCloseEnough, isSpokenMatch } from './grading';

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

describe('isSpokenMatch — 슬래시로 묶인 표제어', () => {
  it('대안 중 하나만 말해도 맞다', () => {
    expect(isSpokenMatch('barely', 'barely/seldom/hardly')).toBe(true);
    expect(isSpokenMatch('hardly', 'barely/seldom/hardly')).toBe(true);
    expect(isSpokenMatch('landlord', 'landlord/tenant/realtor')).toBe(true);
  });

  it('슬래시가 문구 중간에 있어도 어느 쪽으로 읽든 맞다', () => {
    expect(isSpokenMatch('put on cream', 'put on/apply cream')).toBe(true);
    expect(isSpokenMatch('apply cream', 'put on/apply cream')).toBe(true);
    expect(isSpokenMatch('kick bad habits', 'kick/break bad habits')).toBe(true);
    expect(isSpokenMatch('short of time', 'short of/on time')).toBe(true);
    expect(isSpokenMatch('work as an', 'work as a/an')).toBe(true);
    expect(isSpokenMatch('work with', 'collaborate with/work with')).toBe(true);
  });

  it('표제어에 없는 말이나 너무 짧은 말은 틀리다', () => {
    expect(isSpokenMatch('hello', 'barely/seldom/hardly')).toBe(false);
    expect(isSpokenMatch('put', 'put on/apply cream')).toBe(false);
    expect(isSpokenMatch('the', 'landlord/tenant/realtor')).toBe(false);
  });
});

describe('isSpokenMatch — 자리표시자가 든 표제어', () => {
  it('자리표시자 자리에 무엇을 넣든 나머지를 말했으면 맞다', () => {
    expect(isSpokenMatch('keep him in the loop', 'keep sb in the loop')).toBe(true);
    expect(isSpokenMatch('keep the client in the loop', 'keep sb in the loop')).toBe(true);
    expect(isSpokenMatch('insist on going', 'insist on V')).toBe(true);
  });

  it('나머지를 빠뜨리면 틀리다', () => {
    expect(isSpokenMatch('keep him', 'keep sb in the loop')).toBe(false);
  });
});

describe('isSpokenMatch — 보통 표제어', () => {
  it('기존 채점을 그대로 따른다', () => {
    expect(isSpokenMatch('get off work', 'get off work')).toBe(true);
    expect(isSpokenMatch('completely different', 'get off work')).toBe(false);
  });
});
