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
  const [writing, setWriting] = useState(false);
  const [typed, setTyped] = useState('');
  // 틀리면 다시 할 기회는 한 번뿐. 그 다음엔 오답으로 넘기고 복습 목록에 담는다.
  const [retried, setRetried] = useState(false);

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

  // 말할 수 없는 상황: 단어를 가리고 뜻을 보며 타이핑한다.
  if (writing) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted">뜻을 보고 영어 단어를 쓰세요</p>
        <p className="text-2xl font-bold">{ex.meaning}</p>
        <input
          aria-label="단어 쓰기"
          className="w-full rounded-xl border border-line bg-surface p-3 text-ink placeholder:text-muted focus:outline-none focus:border-accent"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          disabled={result !== null}
          placeholder="영어 단어를 입력하세요"
        />
        {result === null ? (
          <button
            className="w-full rounded-xl bg-accent text-accentInk py-3 font-bold active:opacity-90"
            onClick={() => setResult(isCloseEnough(typed, ex.english))}
          >
            확인
          </button>
        ) : (
          <div className="space-y-2">
            <p className={result ? 'text-accent font-bold' : 'text-danger font-bold'}>
              {result ? '정답이에요! 🎉' : `아쉬워요. 정답: ${ex.english}`}
            </p>
            <button className="w-full rounded-xl border border-line bg-surface py-3 font-medium active:opacity-90" onClick={() => onDone(result)}>
              다음
            </button>
          </div>
        )}
      </div>
    );
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
        <div className="space-y-2">
          <button
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-accent text-accentInk py-3 font-bold disabled:opacity-60"
            onClick={record}
            disabled={status === 'listening'}
          >
            <Mic className="w-5 h-5" /> {status === 'listening' ? '듣는 중…' : '말하기'}
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
            {result ? '좋아요! 🎉' : retried ? '복습 목록에 담을게요' : '다시 연습해요'}
          </p>
          {result ? (
            <button className="w-full rounded-xl border border-line bg-surface py-3 font-medium active:opacity-90" onClick={() => onDone(true)}>
              다음
            </button>
          ) : retried ? (
            <button className="w-full rounded-xl border border-line bg-surface py-3 font-medium active:opacity-90" onClick={() => onDone(false)}>
              다음
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                className="flex-1 rounded-xl bg-accent text-accentInk py-3 text-sm font-medium active:opacity-90"
                onClick={() => { setRetried(true); setResult(null); setHeard(''); setStatus('idle'); }}
              >
                다시 말하기
              </button>
              <button className="flex-1 rounded-xl border border-line bg-surface py-3 text-sm font-medium active:opacity-90" onClick={() => onDone(false)}>
                다음
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
