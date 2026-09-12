import { describe, it, expect, afterEach } from 'vitest';
import { ttsSupported, speakableText } from './tts';
import { sttSupported } from './stt';

afterEach(() => {
  // @ts-expect-error cleanup test globals
  delete (globalThis as any).speechSynthesis;
  // @ts-expect-error cleanup test globals
  delete (globalThis as any).SpeechRecognition;
  // @ts-expect-error cleanup test globals
  delete (globalThis as any).webkitSpeechRecognition;
});

describe('speech support detection', () => {
  it('detects TTS when speechSynthesis exists', () => {
    (globalThis as any).speechSynthesis = {};
    expect(ttsSupported()).toBe(true);
  });
  it('reports no TTS when absent', () => {
    expect(ttsSupported()).toBe(false);
  });
  it('detects STT via webkitSpeechRecognition', () => {
    (globalThis as any).webkitSpeechRecognition = function () {};
    expect(sttSupported()).toBe(true);
  });
  it('reports no STT when absent', () => {
    expect(sttSupported()).toBe(false);
  });
});

describe('speakableText', () => {
  it('슬래시를 or로 읽어준다', () => {
    expect(speakableText('barely/seldom/hardly')).toBe('barely or seldom or hardly');
    expect(speakableText('put on/apply cream')).toBe('put on or apply cream');
  });

  it('자리표시자를 말이 되게 바꾼다', () => {
    expect(speakableText('keep sb in the loop')).toBe('keep somebody in the loop');
    expect(speakableText('insist on V')).toBe('insist on');
  });

  it('보통 표제어는 그대로 둔다', () => {
    expect(speakableText('get off work')).toBe('get off work');
  });
});
