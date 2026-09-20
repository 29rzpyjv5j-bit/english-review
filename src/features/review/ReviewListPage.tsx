import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { inReview, isMastered, masteredLabel, MASTERED_AFTER } from '../../lib/review';
import { Check, Flame } from '../../components/icons';

/** 한 세션에 나오는 문제 수(buildSession 의 기본값)와 맞춘다. */
const SESSION_SIZE = 12;

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
  const sessionCount = Math.min(rows.length, SESSION_SIZE);

  async function remove(ids: string[]) {
    setBusy(true);
    await removeFromReview(ids);
    setBusy(false);
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">오답노트</h1>
        <button className="text-sm text-muted underline" onClick={() => navigate('/')}>홈으로</button>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted py-8 text-center">복습할 항목이 없어요. 틀린 항목이 생기면 여기에 쌓입니다.</p>
      ) : (
        <>
          <div className="rounded-2xl border border-line bg-surface p-4 space-y-3">
            <div className="flex items-center gap-3">
              <span className="grid place-items-center w-10 h-10 shrink-0 rounded-xl bg-accent/15 text-accent">
                <Flame className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <p className="font-bold">틀린 항목 {rows.length}개</p>
                <p className="text-xs text-muted">{MASTERED_AFTER}번 연속 맞히면 정리할 수 있어요</p>
              </div>
            </div>
            <button
              className="w-full rounded-xl bg-accent text-accentInk py-3 font-bold active:opacity-90"
              onClick={() => navigate('/session?mode=review')}
            >
              복습 시작 · {sessionCount}문제
            </button>
          </div>

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

          <p className="text-xs text-muted">맞혀도 저절로 사라지지 않아요. 직접 뺄 때만 목록에서 빠집니다.</p>
        </>
      )}
    </div>
  );
}
