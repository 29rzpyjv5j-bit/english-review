import type { Exercise } from '../session/buildSession';
export default function MatchingCard({ onDone }: { ex: Extract<Exercise, { kind: 'matching' }>; onDone: (c: boolean) => void }) {
  return <button className="rounded-xl border px-4 py-2" onClick={() => onDone(true)}>다음</button>;
}
