import { Link } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import StatusBar from '../../components/StatusBar';
import LeagueBadge from '../../components/LeagueBadge';
import { Flame, Chevron, Mic, MicOff, Check } from '../../components/icons';
import { todayStr } from '../../lib/dateUtils';
import { getLeagueMilestones } from '../../lib/league';

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
  const profile = useStore((s) => s.profile);
  const quiet = useStore((s) => s.quiet);
  const setQuiet = useStore((s) => s.setQuiet);

  const streakCount = profile.streakCount;
  const inCycle = streakCount % 7;
  const frac = streakCount === 0 ? 0 : inCycle === 0 ? 1 : inCycle / 7;
  const toReward = streakCount === 0 ? 7 : inCycle === 0 ? 0 : 7 - inCycle;

  // 오늘 학습 완료 여부
  const today = todayStr();
  const todayCompleted = profile.history.some((h) => h.date === today && h.completed);
  // 오늘 학습을 완료하면 링을 100%로 채움
  const todayFrac = todayCompleted ? 1 : frac;

  const wrongItemsToday = useStore((s) => s.wrongItemsToday);
  const hasWrongItems = wrongItemsToday.size > 0;

  const milestone = getLeagueMilestones(streakCount);

  return (
    <div className="max-w-md mx-auto p-4 space-y-5">
      <StatusBar />

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted mb-1">현재 리그</p>
          <LeagueBadge league={profile.currentLeague} />
        </div>
        {milestone && (
          <div className="text-right">
            <p className="text-xs text-muted">다음 리그까지</p>
            <p className="text-sm font-bold text-accent">{milestone.daysUntil}일</p>
          </div>
        )}
      </div>

      <Link to="/session" className="flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 active:opacity-90">
        {todayCompleted ? (
          <div className="relative w-16 h-16 flex-none">
            <div className="absolute inset-0 grid place-items-center text-accent bg-accent/15 rounded-full">
              <Check className="w-8 h-8" />
            </div>
          </div>
        ) : (
          <Ring frac={todayFrac} />
        )}
        <div className="min-w-0">
          <p className="text-base font-bold">오늘의 학습</p>
          <p className="text-sm text-muted">
            {todayCompleted ? '완료했어요 🎉 · ' : ''}
            {toReward === 0 ? '오늘도 이어가요 🔥' : `다음 보상까지 ${toReward}일`}
          </p>
          <p className="mt-1 text-sm font-semibold text-accent">이어서 시작하기 →</p>
        </div>
      </Link>

      <Link
        to={hasWrongItems ? '/session?mode=review' : '#'}
        className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm active:opacity-90 ${
          hasWrongItems
            ? 'border-line bg-surface text-muted'
            : 'border-line bg-surface opacity-60 text-muted cursor-not-allowed'
        }`}
        onClick={(e) => !hasWrongItems && e.preventDefault()}
      >
        <span className={`grid place-items-center w-7 h-7 rounded-full ${hasWrongItems ? 'bg-accent/15 text-accent' : 'bg-surface2 text-muted'}`}>
          <Flame className="w-4 h-4" />
        </span>
        틀린 항목 복습하기 {hasWrongItems && `(${wrongItemsToday.size})`}
        <Chevron className="w-4 h-4 ml-auto" />
      </Link>

      <button
        onClick={() => setQuiet(!quiet)}
        role="switch"
        aria-checked={quiet}
        className="w-full flex items-center gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-left active:opacity-90"
      >
        <span className={`grid place-items-center w-7 h-7 rounded-full ${quiet ? 'bg-accent/15 text-accent' : 'bg-surface2 text-muted'}`}>
          {quiet ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-medium">무음 학습</span>
          <span className="block text-xs text-muted">
            {quiet ? '말하기 대신 쓰기로 나와요' : '밖에서는 켜면 말하기 없이 학습해요'}
          </span>
        </span>
        <span className={`ml-auto shrink-0 w-11 h-6 rounded-full p-0.5 transition-colors ${quiet ? 'bg-accent' : 'bg-line'}`}>
          <span className={`block w-5 h-5 rounded-full bg-ink transition-transform ${quiet ? 'translate-x-5' : ''}`} />
        </span>
      </button>
    </div>
  );
}
