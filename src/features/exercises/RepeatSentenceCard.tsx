import { useEffect, useState } from 'react';
import type { Exercise } from '../session/buildSession';
import { speak } from '../../speech/tts';
import { listen, sttSupported } from '../../speech/stt';
import { isCloseEnough } from '../../lib/grading';
import { Speaker, Mic } from '../../components/icons';
import WriteSentenceCard from './WriteSentenceCard';

export default function RepeatSentenceCard({
  ex, onDone,
}: { ex: Extract<Exercise, { kind: 'repeatSentence' }>; onDone: (c: boolean) => void }) {
  const [status, setStatus] = useState<'idle' | 'listening' | 'done'>('idle');
  const [heard, setHeard] = useState('');
  const [result, setResult] = useState<null | boolean>(null);
  const [writing, setWriting] = useState(false);

  useEffect(() => { speak(ex.text); }, [ex.text]);

  // 말할 수 없는 상황이면 같은 문장을 쓰기 문제로 바꿔서 이어간다.
  if (writing) {
    return <WriteSentenceCard text={ex.text} translation={ex.translation} onDone={onDone} />;
  }

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
    <div className="space-y-5">
      <p className="text-sm text-muted">듣고 따라 말하세요</p>
      <p className="text-2xl font-bold leading-snug">{ex.text}</p>
      <button
        className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm active:opacity-90"
        onClick={() => speak(ex.text)}
      >
        <Speaker className="w-4 h-4" /> 다시 듣기
      </button>
      {result === null ? (
        <div className="space-y-2">
          <button
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-accent text-accentInk py-3 font-bold disabled:opacity-60"
            onClick={record}
            disabled={status === 'listening'}
          >
            <Mic className="w-5 h-5" /> {status === 'listening' ? '듣는 중…' : '따라 말하기'}
          </button>
          <div className="flex gap-2">
            <button className="flex-1 rounded-xl border border-line bg-surface py-2.5 text-sm active:opacity-90" onClick={() => setWriting(true)}>
              쓰기로
            </button>
            <button className="flex-1 rounded-xl border border-line bg-surface py-2.5 text-sm text-muted active:opacity-90" onClick={() => onDone(false)}>
              건너뛰기
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-muted">인식: {heard || '(없음)'}</p>
          <p className={result ? 'text-accent font-bold' : 'text-danger font-bold'}>
            {result ? '훌륭해요! 🎉' : '한 번 더 연습해요'}
          </p>
          <button className="w-full rounded-xl border border-line bg-surface py-3 font-medium active:opacity-90" onClick={() => onDone(result)}>다음</button>
        </div>
      )}
    </div>
  );
}
