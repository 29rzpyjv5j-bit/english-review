import { useEffect, useState } from 'react';
import type { Exercise } from '../session/buildSession';
import { speak } from '../../speech/tts';
import { listen, sttSupported } from '../../speech/stt';
import { isCloseEnough } from '../../lib/grading';

export default function RepeatSentenceCard({
  ex, onDone,
}: { ex: Extract<Exercise, { kind: 'repeatSentence' }>; onDone: (c: boolean) => void }) {
  const [status, setStatus] = useState<'idle' | 'listening' | 'done'>('idle');
  const [heard, setHeard] = useState('');
  const [result, setResult] = useState<null | boolean>(null);

  useEffect(() => { speak(ex.text); }, [ex.text]);

  async function record() {
    if (!sttSupported()) { onDone(true); return; }
    setStatus('listening');
    try {
      const transcript = await listen('en-US');
      setHeard(transcript);
      setResult(isCloseEnough(transcript, ex.text, 0.7));
    } catch {
      setResult(false);
    } finally {
      setStatus('done');
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">듣고 따라 말하세요</p>
      <p className="text-xl font-bold">{ex.text}</p>
      <button className="rounded-full border px-4 py-2" onClick={() => speak(ex.text)}>🔊 다시 듣기</button>
      {result === null ? (
        <button
          className="w-full rounded-xl bg-green-500 text-white py-3 font-bold"
          onClick={record}
          disabled={status === 'listening'}
        >
          {status === 'listening' ? '🎤 듣는 중…' : '🎤 따라 말하기'}
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-gray-500">인식: {heard || '(없음)'}</p>
          <p className={result ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
            {result ? '훌륭해요! 🎉' : '한 번 더 연습해요'}
          </p>
          <button className="w-full rounded-xl border py-2" onClick={() => onDone(result)}>다음</button>
        </div>
      )}
    </div>
  );
}
