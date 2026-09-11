import { useState } from 'react';
import type { Exercise } from '../session/buildSession';

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
      <p className="text-sm text-gray-500 mb-1">{ex.direction === 'en2ko' ? '뜻을 고르세요' : '영단어를 고르세요'}</p>
      <p className="text-2xl font-bold mb-4">{ex.prompt}</p>
      <div className="space-y-2">
        {ex.choices.map((c) => {
          const state = !picked ? '' : c === ex.answer ? 'bg-green-100 border-green-400'
            : c === picked ? 'bg-red-100 border-red-400' : '';
          return (
            <button
              key={c}
              className={`block w-full rounded-xl border py-3 ${state}`}
              onClick={() => choose(c)}
            >
              {c}
            </button>
          );
        })}
      </div>
      {picked && (
        <button
          className="mt-4 w-full rounded-xl bg-blue-500 text-white py-3"
          onClick={() => onDone(picked === ex.answer)}
        >
          다음
        </button>
      )}
    </div>
  );
}
