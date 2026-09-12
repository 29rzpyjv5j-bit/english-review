import { describe, it, expect } from 'vitest';
import { normalizeAiResult } from './organize';

describe('normalizeAiResult', () => {
  it('trims and keeps words and sentences', () => {
    const r = normalizeAiResult({
      words: [{ english: ' agenda ', meaning: ' 안건 ' }],
      sentences: [{ text: ' Hello. ', translation: ' 안녕. ' }],
    });
    expect(r.words).toEqual([{ english: 'agenda', meaning: '안건' }]);
    expect(r.sentences).toEqual([{ text: 'Hello.', translation: '안녕.' }]);
  });

  it('drops empty translation to undefined', () => {
    const r = normalizeAiResult({ words: [], sentences: [{ text: 'Hi.', translation: '  ' }] });
    expect(r.sentences).toEqual([{ text: 'Hi.' }]);
  });

  it('drops items with empty english or text', () => {
    const r = normalizeAiResult({
      words: [{ english: '', meaning: '뜻' }, { english: 'ok', meaning: '' }],
      sentences: [{ text: '', translation: 'x' }],
    });
    expect(r.words).toEqual([{ english: 'ok', meaning: '' }]);
    expect(r.sentences).toEqual([]);
  });

  it('handles missing fields gracefully', () => {
    const r = normalizeAiResult({});
    expect(r).toEqual({ words: [], sentences: [] });
  });
});
