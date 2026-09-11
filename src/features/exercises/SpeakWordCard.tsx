import { useState } from 'react';
import type { Exercise } from '../session/buildSession';
import { speak } from '../../speech/tts';
import { listen, sttSupported } from '../../speech/stt';
import { isCloseEnough } from '../../lib/grading';
import { Speaker, Mic } from '../../components/icons';

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
    <div className="space-y-5 text-center">
      <p className="text-sm text-muted">이 단어를 소리 내어 말하세요</p>
      <p className="text-4xl font-bold">{ex.english}</p>
      <p className="text-muted">{ex.meaning}</p>
      <button
        className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm active:opacity-90"
        onClick={() => speak(ex.english)}
      >
        <Speaker className="w-4 h-4" /> 발음 듣기
      </button>
      {result === null ? (
        <button
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-accent text-accentInk py-3 font-bold disabled:opacity-60"
          onClick={record}
          disabled={status === 'listening'}
        >
          <Mic className="w-5 h-5" /> {status === 'listening' ? '듣는 중…' : '말하기'}
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-muted">인식: {heard || '(없음)'}</p>
          <p className={result ? 'text-accent font-bold' : 'text-danger font-bold'}>
            {result ? '좋아요! 🎉' : '다시 연습해요'}
          </p>
          <button className="w-full rounded-xl border border-line bg-surface py-3 font-medium active:opacity-90" onClick={() => onDone(result)}>다음</button>
        </div>
      )}
    </div>
  );
}
