import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { inReview, isMastered, masteredLabel, MASTERED_AFTER } from '../../lib/review';
import { Check } from '../../components/icons';

interface Row {
  id: string;
  title: string;
  sub: string;
  streakLabel: string;
  mastered: boolean;
}

export default function ReviewListPage() {
  const navigate = useNavigate();
  const words = useStore((s) => s.words);
  const sentences = useStore((s) => s.sentences);
  const removeFromReview = useStore((s) => s.removeFromReview);
  const [busy, setBusy] = useState(false);

  const rows: Row[] = [
    ...words.filter(inReview).map((w) => ({
      id: w.id, title: w.english, sub: w.meaning,
      streakLabel: masteredLabel(w), mastered: isMastered(w),
    })),
    ...sentences.filter(inReview).map((s) => ({
      id: s.id, title: s.text, sub: s.keyword ?? s.translation ?? '',
      streakLabel: masteredLabel(s), mastered: isMastered(s),
    })),
  ];
  const masteredIds = rows.filter((r) => r.mastered).map((r) => r.id);

  async function remove(ids: string[]) {
    setBusy(true);
    await removeFromReview(ids);
    setBusy(false);
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">
          복습 목록 <span className="text-sm font-normal text-muted">{rows.length}개</span>
        </h1>
        <button className="text-sm text-muted underline" onClick={() => navigate('/')}>홈으로</button>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted py-8 text-center">복습할 항목이 없어요. 틀린 항목이 생기면 여기에 쌓입니다.</p>
      ) : (
        <>
          {masteredIds.length > 0 && (
            <button
              className="w-full flex items-center gap-2 rounded-xl border border-accent/40 bg-accent/10 px-3 py-2.5 text-sm text-accent disabled:opacity-50 active:opacity-90"
              disabled={busy}
              onClick={() => remove(masteredIds)}
            >
              <Check className="w-4 h-4" />
              {MASTERED_AFTER}번 이상 맞힌 {masteredIds.length}개 빼기
            </button>
          )}

          <ul>
            {rows.map((r) => (
              <li key={r.id} className="flex items-center gap-2.5 border-b border-line py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate">{r.title}</p>
                  {r.sub && <p className="truncate text-xs text-muted">{r.sub}</p>}
                </div>
                <span
                  className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11px] ${r.mastered ? 'bg-accent/15 text-accent' : 'bg-surface2 text-muted'}`}
                >
                  {r.streakLabel}
                </span>
                <button
                  aria-label={`${r.title} 목록에서 빼기`}
                  className="shrink-0 grid place-items-center w-8 h-8 text-muted active:opacity-60"
                  disabled={busy}
                  onClick={() => remove([r.id])}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>

          <p className="text-xs text-muted">
            맞혀도 저절로 사라지지 않아요. {MASTERED_AFTER}번 연속 맞히면 빼도 좋다는 표시가 붙습니다.
          </p>
        </>
      )}
    </div>
  );
}
