export function ttsSupported(): boolean {
  return typeof globalThis !== 'undefined' && 'speechSynthesis' in globalThis;
}

// 재생 중인 음성을 끊는다. 문제를 넘길 때 앞 문제의 음성이 다음 화면까지 따라오지 않게 한다.
export function stopSpeaking(): void {
  if (!ttsSupported()) return;
  ((globalThis as any).speechSynthesis as SpeechSynthesis).cancel();
}

// 표제어를 적힌 그대로 읽으면 "슬래시"까지 발음되거나 sb·V 같은 표기가 그대로 나온다.
// 귀로 들어서 자연스러운 문장으로 바꾼 뒤 읽는다.
export function speakableText(text: string): string {
  return text
    .replace(/\//g, ' or ')
    .replace(/\bsb\b/gi, 'somebody')
    .replace(/\bsth\b/gi, 'something')
    .replace(/\bV\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function speak(text: string, lang = 'en-US'): Promise<void> {
  return new Promise((resolve) => {
    if (!ttsSupported()) {
      resolve();
      return;
    }
    const synth = (globalThis as any).speechSynthesis as SpeechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(speakableText(text));
    u.lang = lang;
    u.rate = 0.95;
    u.onend = () => resolve();
    u.onerror = () => resolve();
    synth.speak(u);
  });
}
