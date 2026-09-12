import { useMemo, useState } from 'react';
import type { Exercise } from '../session/buildSession';
import { speak } from '../../speech/tts';

// 짝짓기 카드는 세션 도입부의 워밍업(인지 연습)이다. 여기서는 복습 기록을
// 하지 않는다 — 같은 단어들은 이어지는 개별 mcq/말하기 카드에서 정확히 한 번만
// 기록되어 라이트너 박스가 이중 전진하지 않도록 한다.
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
  const left = useMemo(() => shuffle(ex.pairs.map((p) => ({ id: p.id, label: p.english, side: 'en' as const }))), [ex]);
  const right = useMemo(() => shuffle(ex.pairs.map((p) => ({ id: p.id, label: p.meaning, side: 'ko' as const }))), [ex]);

  const [selected, setSelected] = useState<Token | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [wrongPair, setWrongPair] = useState<string | null>(null);

  // 영단어를 누르면 발음을 들려준다(귀로도 익히도록).
  function speakEnglish(id: string) {
    const pair = ex.pairs.find((p) => p.id === id);
    if (pair) speak(pair.english);
  }

  function pick(token: Token) {
    if (matched.has(token.id)) return;
    if (token.side === 'en') speakEnglish(token.id);
    if (!selected) {
      setSelected(token);
      return;
    }
    if (selected.side === token.side) {
      setSelected(token);
      return;
    }
    if (selected.id === token.id) {
      speakEnglish(token.id);
      const next = new Set(matched).add(token.id);
      setMatched(next);
      setSelected(null);
      if (next.size === ex.pairs.length) setTimeout(() => onDone(true), 400);
    } else {
      setWrongPair(token.id);
      setTimeout(() => setWrongPair(null), 500);
      setSelected(null);
    }
  }

  function cls(token: Token) {
    if (matched.has(token.id)) return 'opacity-30 border-line bg-surface';
    if (selected?.id === token.id && selected.side === token.side) return 'border-accent bg-accent/15 text-accent';
    if (wrongPair === token.id) return 'border-danger bg-danger/15 text-danger';
    return 'border-line bg-surface';
  }

  return (
    <div>
      <p className="text-sm text-muted mb-3">같은 뜻끼리 연결하세요</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          {left.map((t) => (
            <button key={`en-${t.id}`} className={`block w-full rounded-xl border py-3 font-medium ${cls(t)}`} onClick={() => pick(t)}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {right.map((t) => (
            <button key={`ko-${t.id}`} className={`block w-full rounded-xl border py-3 font-medium ${cls(t)}`} onClick={() => pick(t)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
