import { useEffect, useState } from 'react';
import type { Exercise } from '../session/buildSession';
import { speak } from '../../speech/tts';
import { Speaker } from '../../components/icons';

const LETTERS = ['A', 'B', 'C', 'D'];

export default function McqCard({
  ex, onDone,
}: { ex: Extract<Exercise, { kind: 'mcq' }>; onDone: (c: boolean) => void }) {
  const [picked, setPicked] = useState<string | null>(null);
  // 틀리면 다시 풀 기회는 한 번뿐. 그 다음엔 오답으로 넘기고 복습 목록에 담는다.
  const [retried, setRetried] = useState(false);

  // 맨 처음 단어 발음 한 번 재생 (en2ko일 때만)
  useEffect(() => {
    if (ex.direction === 'en2ko') speak(ex.prompt);
  }, [ex.prompt, ex.direction]);

  function choose(choice: string) {
    if (picked) return;
    setPicked(choice);
    // 선택 후 해당 보기를 말해주기
    speak(choice);
  }

  const isCorrect = picked && picked === ex.answer;

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <p className="text-sm text-muted">{ex.direction === 'en2ko' ? '뜻을 고르세요' : '영단어를 고르세요'}</p>
        <p className="text-3xl font-bold">{ex.prompt}</p>
        {ex.direction === 'en2ko' && (
          <button
            className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm active:opacity-90"
            onClick={() => speak(ex.prompt)}
          >
            <Speaker className="w-4 h-4" /> 다시 듣기
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {ex.choices.map((c, i) => {
          const isAnswer = c === ex.answer;
          const isPicked = c === picked;
          const state = !picked
            ? 'border-line bg-surface'
            : isAnswer
              ? 'border-accent bg-accent/15 text-accent'
              : isPicked
                ? 'border-danger bg-danger/15 text-danger'
                : 'border-line bg-surface opacity-60';
          const badge = !picked
            ? 'border-line text-muted'
            : isAnswer
              ? 'border-accent text-accent'
              : isPicked
                ? 'border-danger text-danger'
                : 'border-line text-muted';
          return (
            <button
              key={c}
              className={`flex items-center gap-2 rounded-xl border px-3 py-4 text-left ${state}`}
              onClick={() => choose(c)}
            >
              <span className={`grid place-items-center w-6 h-6 rounded-md border text-xs font-bold ${badge}`}>
                {LETTERS[i] ?? '•'}
              </span>
              <span className="font-medium">{c}</span>
            </button>
          );
        })}
      </div>
      {picked && (
        <div className="space-y-2">
          <p className={isCorrect ? 'text-accent font-bold' : 'text-danger font-bold'}>
            {isCorrect ? '정답이에요! 🎉' : retried ? `정답은 ${ex.answer}` : '다시 선택해요'}
          </p>
          {isCorrect ? (
            <button
              className="w-full rounded-xl bg-accent text-accentInk py-3 font-bold active:opacity-90"
              onClick={() => onDone(true)}
            >
              다음
            </button>
          ) : retried ? (
            <button
              className="w-full rounded-xl border border-line bg-surface py-3 font-medium active:opacity-90"
              onClick={() => onDone(false)}
            >
              다음
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                className="flex-1 rounded-xl bg-accent text-accentInk py-3 text-sm font-medium active:opacity-90"
                onClick={() => { setRetried(true); setPicked(null); }}
              >
                다시 선택
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
