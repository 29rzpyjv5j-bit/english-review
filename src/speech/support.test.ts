import { describe, it, expect, afterEach } from 'vitest';
import { ttsSupported } from './tts';
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
