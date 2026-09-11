import { useEffect, useState } from 'react';
import type { Exercise } from '../session/buildSession';
import { speak } from '../../speech/tts';
import { isCloseEnough } from '../../lib/grading';
import { Speaker } from '../../components/icons';

export default function DictationCard({
  ex, onDone,
}: { ex: Extract<Exercise, { kind: 'dictation' }>; onDone: (c: boolean) => void }) {
  const [value, setValue] = useState('');
  const [result, setResult] = useState<null | boolean>(null);

  useEffect(() => { speak(ex.text); }, [ex.text]);

  function check() {
    setResult(isCloseEnough(value, ex.text));
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">들리는 문장을 받아쓰세요</p>
      {ex.translation && <p className="text-muted text-sm">힌트(뜻): {ex.translation}</p>}
      <button
        className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm active:opacity-90"
        onClick={() => speak(ex.text)}
      >
        <Speaker className="w-4 h-4" /> 다시 듣기
      </button>
      <textarea
        className="w-full rounded-xl border border-line bg-surface p-3 text-ink placeholder:text-muted focus:outline-none focus:border-accent"
        rows={2}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={result !== null}
      />
      {result === null ? (
        <button className="w-full rounded-xl bg-accent text-accentInk py-3 font-bold active:opacity-90" onClick={check}>확인</button>
      ) : (
        <div className="space-y-2">
          <p className={result ? 'text-accent font-bold' : 'text-danger font-bold'}>
            {result ? '정답이에요! 🎉' : '아쉬워요. 정답:'}
          </p>
          {!result && <p className="rounded-xl bg-surface2 border border-line p-3">{ex.text}</p>}
          <button className="w-full rounded-xl border border-line bg-surface py-3 font-medium active:opacity-90" onClick={() => onDone(result)}>다음</button>
        </div>
      )}
    </div>
  );
}
