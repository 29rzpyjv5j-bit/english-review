import type { Exercise } from '../session/buildSession';
export default function McqCard({ ex, onDone }: { ex: Extract<Exercise, { kind: 'mcq' }>; onDone: (c: boolean) => void }) {
  return (
    <div>
      <p className="text-xl font-bold mb-4">{ex.prompt}</p>
      <div className="space-y-2">
        {ex.choices.map((c) => (
          <button key={c} className="block w-full rounded-xl border py-2" onClick={() => onDone(c === ex.answer)}>
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
