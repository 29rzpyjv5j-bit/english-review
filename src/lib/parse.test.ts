import { describe, it, expect } from 'vitest';
import { parseWords, parseSentences, parseInput, splitCombined } from './parse';

describe('splitCombined', () => {
  it('routes = lines to words and the rest to sentences', () => {
    const r = splitCombined('agenda = 안건\nCould you send it?\nschedule = 일정\nSee you.');
    expect(r.wordsText).toBe('agenda = 안건\nschedule = 일정');
    expect(r.sentencesText).toBe('Could you send it?\nSee you.');
  });
  it('ignores blank lines', () => {
    const r = splitCombined('  \nmeeting = 회의\n\n');
    expect(r.wordsText).toBe('meeting = 회의');
    expect(r.sentencesText).toBe('');
  });
});

describe('parseWords', () => {
  it('splits english and meaning by =', () => {
    expect(parseWords('schedule = 일정\nagenda = 안건')).toEqual([
      { english: 'schedule', meaning: '일정' },
      { english: 'agenda', meaning: '안건' },
    ]);
  });
  it('keeps english with empty meaning if no =', () => {
    expect(parseWords('meeting')).toEqual([{ english: 'meeting', meaning: '' }]);
  });
  it('ignores blank lines', () => {
    expect(parseWords('schedule = 일정\n\n  \n')).toEqual([{ english: 'schedule', meaning: '일정' }]);
  });
});

describe('parseSentences', () => {
  it('reads plain sentence lines', () => {
    expect(parseSentences('Could you send me the agenda?')).toEqual([
      { text: 'Could you send me the agenda?' },
    ]);
  });
  it('splits translation by |', () => {
    expect(parseSentences('See you tomorrow. | 내일 봐요.')).toEqual([
      { text: 'See you tomorrow.', translation: '내일 봐요.' },
    ]);
  });
});

describe('parseInput', () => {
  it('combines words and sentences', () => {
    const r = parseInput('agenda = 안건', 'Hello.');
    expect(r.words).toHaveLength(1);
    expect(r.sentences).toHaveLength(1);
  });
});
