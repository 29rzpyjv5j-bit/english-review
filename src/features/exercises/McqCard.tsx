import { useState } from 'react';
import type { Exercise } from '../session/buildSession';

const LETTERS = ['A', 'B', 'C', 'D'];

export default function McqCard({
  ex, onDone,
}: { ex: Extract<Exercise, { kind: 'mcq' }>; onDone: (c: boolean) => void }) {
  const [picked, setPicked] = useState<string | null>(null);

  function choose(choice: string) {
    if (picked) return;
    setPicked(choice);
  }

  return (
    <div>
      <p className="text-sm text-muted mb-1">{ex.direction === 'en2ko' ? '뜻을 고르세요' : '영단어를 고르세요'}</p>
      <p className="text-3xl font-bold mb-5">{ex.prompt}</p>
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
        <button
          className="mt-5 w-full rounded-xl bg-accent text-accentInk py-3 font-bold active:opacity-90"
          onClick={() => onDone(picked === ex.answer)}
        >
          다음
        </button>
      )}
    </div>
  );
}
