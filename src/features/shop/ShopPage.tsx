import { Link } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { FREEZE_COST, FREEZE_MAX } from '../../lib/gems';
import StatusBar from '../../components/StatusBar';

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

      <div className="rounded-2xl border p-4 space-y-2">
        <div className="flex items-center gap-2 text-lg font-bold">🧊 스트릭 프리즈</div>
        <p className="text-sm text-gray-600">
          하루 빠져도 연속 학습이 깨지지 않게 지켜줘요. 가진 개수만큼 빠진 날을 메웁니다. (최대 {FREEZE_MAX}개)
        </p>
        <p className="text-sm">보유: 🧊 {freezeCount} / {FREEZE_MAX}</p>
        <button
          className="w-full rounded-xl bg-green-500 text-white py-2 font-bold disabled:bg-gray-300"
          disabled={disabled}
          onClick={() => buyFreeze()}
        >
          💎 {FREEZE_COST}로 구매
        </button>
        {atMax && <p className="text-xs text-gray-400">이미 최대치예요.</p>}
        {!atMax && tooPoor && <p className="text-xs text-gray-400">보석이 부족해요.</p>}
      </div>

      <Link to="/" className="block text-center rounded-xl border py-2">홈으로</Link>
    </div>
  );
}
