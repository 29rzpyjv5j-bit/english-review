import { useState } from 'react';
import type { Exercise } from '../session/buildSession';
import { speak } from '../../speech/tts';
import { listen, sttSupported } from '../../speech/stt';
import { isCloseEnough } from '../../lib/grading';

export default function SpeakWordCard({
  ex, onDone,
}: { ex: Extract<Exercise, { kind: 'speakWord' }>; onDone: (c: boolean) => void }) {
  const [status, setStatus] = useState<'idle' | 'listening' | 'done'>('idle');
  const [heard, setHeard] = useState('');
  const [result, setResult] = useState<null | boolean>(null);

  async function record() {
    if (!sttSupported()) { onDone(true); return; }
    setStatus('listening');
    try {
      const transcript = await listen('en-US');
      setHeard(transcript);
      const ok = isCloseEnough(transcript, ex.english, 0.7);
      setResult(ok);
    } catch {
      setResult(false);
    } finally {
      setStatus('done');
    }
  }

  return (
    <div className="space-y-4 text-center">
      <p className="text-sm text-gray-500">이 단어를 소리 내어 말하세요</p>
      <p className="text-3xl font-bold">{ex.english}</p>
      <p className="text-gray-500">{ex.meaning}</p>
      <button className="rounded-full border px-4 py-2" onClick={() => speak(ex.english)}>🔊 발음 듣기</button>
      {result === null ? (
        <button
          className="w-full rounded-xl bg-green-500 text-white py-3 font-bold"
          onClick={record}
          disabled={status === 'listening'}
        >
          {status === 'listening' ? '🎤 듣는 중…' : '🎤 말하기'}
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-gray-500">인식: {heard || '(없음)'}</p>
          <p className={result ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
            {result ? '좋아요! 🎉' : '다시 연습해요'}
          </p>
          <button className="w-full rounded-xl border py-2" onClick={() => onDone(result)}>다음</button>
        </div>
      )}
    </div>
  );
}
