function getRecognitionCtor(): any {
  const g = globalThis as any;
  return g.SpeechRecognition || g.webkitSpeechRecognition || null;
}

export function sttSupported(): boolean {
  return getRecognitionCtor() !== null;
}

export function listen(lang = 'en-US'): Promise<string> {
  return new Promise((resolve, reject) => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      reject(new Error('SpeechRecognition not supported'));
      return;
    }
    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    let settled = false;
    recognition.onresult = (event: any) => {
      settled = true;
      resolve(event.results[0][0].transcript as string);
    };
    recognition.onerror = (event: any) => {
      if (!settled) reject(new Error(event.error || 'recognition error'));
    };
    recognition.onend = () => {
      if (!settled) resolve('');
    };
    recognition.start();
  });
}
