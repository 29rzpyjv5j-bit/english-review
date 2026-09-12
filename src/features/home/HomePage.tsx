import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import StatusBar from '../../components/StatusBar';
import { Flame, Chevron } from '../../components/icons';
import { exportData, importData, type BackupData } from '../../db/backup';

function Ring({ frac }: { frac: number }) {
  const C = 2 * Math.PI * 15.5;
  return (
    <div className="relative w-16 h-16 flex-none">
      <svg viewBox="0 0 36 36" className="w-16 h-16" aria-hidden="true">
        <circle cx="18" cy="18" r="15.5" fill="none" stroke="#262B33" strokeWidth="3" />
        <circle
          cx="18"
          cy="18"
          r="15.5"
          fill="none"
          stroke="#57C99A"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={`${frac * C} ${C}`}
          transform="rotate(-90 18 18)"
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-accent">
        <Flame className="w-6 h-6" />
      </span>
    </div>
  );
}

export default function HomePage() {
  const decks = useStore((s) => s.decks);
  const words = useStore((s) => s.words);
  const sentences = useStore((s) => s.sentences);
  const streakCount = useStore((s) => s.profile.streakCount);

  const countFor = (deckId: string) => ({
    w: words.filter((w) => w.deckId === deckId).length,
    s: sentences.filter((s) => s.deckId === deckId).length,
  });

  const inCycle = streakCount % 7;
  const frac = streakCount === 0 ? 0 : inCycle === 0 ? 1 : inCycle / 7;
  const toReward = streakCount === 0 ? 7 : inCycle === 0 ? 0 : 7 - inCycle;

  const load = useStore((s) => s.load);
  const fileRef = useRef<HTMLInputElement>(null);
  const [backupMsg, setBackupMsg] = useState('');

  async function onExport() {
    const data = await exportData();
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `영어복습-백업-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text) as BackupData;
      if (window.confirm('현재 자료를 이 백업으로 교체할까요? (기존 덱은 삭제됩니다)')) {
        await importData(data);
        await load();
        setBackupMsg('가져오기 완료 ✓');
      }
    } catch (err) {
      setBackupMsg(err instanceof Error ? err.message : '가져오기에 실패했어요.');
    } finally {
      e.target.value = '';
    }
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-5">
      <StatusBar />

      <Link to="/session" className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 active:opacity-90">
        <Ring frac={frac} />
        <div className="min-w-0">
          <p className="text-base font-bold">오늘의 학습</p>
          <p className="text-sm text-muted">
            {toReward === 0 ? '오늘도 이어가요 🔥' : `다음 보상까지 ${toReward}일`}
          </p>
          <p className="mt-1 text-sm font-semibold text-accent">이어서 시작하기 →</p>
        </div>
      </Link>

      <Link
        to="/session?mode=review"
        className="flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-muted active:opacity-90"
      >
        <span className="grid place-items-center w-7 h-7 rounded-full bg-accent/15 text-accent">
          <Flame className="w-4 h-4" />
        </span>
        틀린 항목 복습하기
        <Chevron className="w-4 h-4 ml-auto" />
      </Link>

      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted mb-2">내 자료</h2>
        <ul className="space-y-2">
          {decks.length === 0 && <li className="text-muted text-sm">아직 자료가 없어요.</li>}
          {decks.map((d) => {
            const c = countFor(d.id);
            return (
              <li key={d.id} className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3">
                <p className="font-medium">{d.name}</p>
                <p className="text-xs text-muted tabular-nums">단어 {c.w} · 문장 {c.s}</p>
              </li>
            );
          })}
        </ul>
      </div>

      <Link
        to="/add"
        className="block text-center rounded-xl border border-dashed border-line py-3 text-sm text-muted active:opacity-90"
      >
        + 자료 추가
      </Link>

      <div className="pt-1">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted mb-2">백업 · 기기 옮기기</h2>
        <div className="flex gap-2">
          <button onClick={onExport} className="flex-1 rounded-xl border border-line bg-surface py-2.5 text-sm active:opacity-90">
            내보내기
          </button>
          <button onClick={() => fileRef.current?.click()} className="flex-1 rounded-xl border border-line bg-surface py-2.5 text-sm active:opacity-90">
            가져오기
          </button>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onImportFile} />
        {backupMsg && <p className="text-xs text-accent mt-2">{backupMsg}</p>}
        <p className="text-xs text-muted mt-1">다른 기기에서 쓰려면: 여기서 내보내기 → 그 기기에서 가져오기.</p>
      </div>
    </div>
  );
}
