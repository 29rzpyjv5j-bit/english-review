import { Link } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { FREEZE_COST, FREEZE_MAX } from '../../lib/gems';
import StatusBar from '../../components/StatusBar';
import { Snow, Gem } from '../../components/icons';

export default function ShopPage() {
  const gems = useStore((s) => s.profile.gems);
  const freezeCount = useStore((s) => s.profile.freezeCount);
  const buyFreeze = useStore((s) => s.buyFreeze);

  const atMax = freezeCount >= FREEZE_MAX;
  const tooPoor = gems < FREEZE_COST;
  const disabled = atMax || tooPoor;

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      <StatusBar />
      <h1 className="text-xl font-bold">상점</h1>

      <div className="rounded-2xl border border-line bg-surface p-4 space-y-3">
        <div className="flex items-center gap-2 text-lg font-bold">
          <span className="grid place-items-center w-9 h-9 rounded-full bg-accent/15 text-accent">
            <Snow className="w-5 h-5" />
          </span>
          스트릭 프리즈
        </div>
        <p className="text-sm text-muted">
          하루 빠져도 연속 학습이 깨지지 않게 지켜줘요. 가진 개수만큼 빠진 날을 메웁니다. (최대 {FREEZE_MAX}개)
        </p>
        <p className="text-sm text-muted">보유: <span className="text-ink font-semibold tabular-nums">{freezeCount} / {FREEZE_MAX}</span></p>
        <button
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-accent text-accentInk py-3 font-bold disabled:opacity-50"
          disabled={disabled}
          onClick={() => buyFreeze()}
        >
          <Gem className="w-4 h-4" /> {FREEZE_COST}로 구매
        </button>
        {atMax && <p className="text-xs text-muted">이미 최대치예요.</p>}
        {!atMax && tooPoor && <p className="text-xs text-muted">보석이 부족해요.</p>}
      </div>

      <Link to="/" className="block text-center rounded-xl border border-line bg-surface py-3 font-medium active:opacity-90">홈으로</Link>
    </div>
  );
}
