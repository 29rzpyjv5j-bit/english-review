import type { Exercise } from '../session/buildSession';
export default function DictationCard({ onDone }: { ex: Extract<Exercise, { kind: 'dictation' }>; onDone: (c: boolean) => void }) {
  return <button className="rounded-xl border px-4 py-2" onClick={() => onDone(true)}>다음</button>;
}
