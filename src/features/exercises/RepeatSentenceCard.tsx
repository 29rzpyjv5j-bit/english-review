import type { Exercise } from '../session/buildSession';
export default function RepeatSentenceCard({ onDone }: { ex: Extract<Exercise, { kind: 'repeatSentence' }>; onDone: (c: boolean) => void }) {
  return <button className="rounded-xl border px-4 py-2" onClick={() => onDone(true)}>다음</button>;
}
