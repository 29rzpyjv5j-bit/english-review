import { useMemo, useState } from 'react';
import type { Exercise } from '../session/buildSession';
import { useStore } from '../../store/useStore';

type Token = { id: string; label: string; side: 'en' | 'ko' };

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MatchingCard({
  ex, onDone,
}: { ex: Extract<Exercise, { kind: 'matching' }>; onDone: (c: boolean) => void }) {
  const recordWord = useStore((s) => s.recordWord);
  const left = useMemo(() => shuffle(ex.pairs.map((p) => ({ id: p.id, label: p.english, side: 'en' as const }))), [ex]);
  const right = useMemo(() => shuffle(ex.pairs.map((p) => ({ id: p.id, label: p.meaning, side: 'ko' as const }))), [ex]);

  const [selected, setSelected] = useState<Token | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrongPair, setWrongPair] = useState<string | null>(null);

  function pick(token: Token) {
    if (matched.has(token.id)) return;
    if (!selected) {
      setSelected(token);
      return;
    }
    if (selected.side === token.side) {
      setSelected(token);
      return;
    }
    if (selected.id === token.id) {
      const next = new Set(matched).add(token.id);
      setMatched(next);
      setSelected(null);
      recordWord(token.id, true);
      if (next.size === ex.pairs.length) setTimeout(() => onDone(true), 400);
    } else {
      setWrongPair(token.id);
      setTimeout(() => setWrongPair(null), 500);
      setSelected(null);
    }
  }

  function cls(token: Token) {
    if (matched.has(token.id)) return 'opacity-30';
    if (selected?.id === token.id && selected.side === token.side) return 'bg-blue-100 border-blue-400';
    if (wrongPair === token.id) return 'bg-red-100 border-red-400';
    return '';
  }

  return (
    <div>
      <p className="text-sm text-gray-500 mb-3">같은 뜻끼리 연결하세요</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          {left.map((t) => (
            <button key={`en-${t.id}`} className={`block w-full rounded-xl border py-3 ${cls(t)}`} onClick={() => pick(t)}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {right.map((t) => (
            <button key={`ko-${t.id}`} className={`block w-full rounded-xl border py-3 ${cls(t)}`} onClick={() => pick(t)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
