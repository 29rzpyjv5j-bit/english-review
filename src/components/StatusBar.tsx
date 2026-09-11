import { useStore } from '../store/useStore';

export default function StatusBar() {
  const { streakCount, gems, freezeCount } = useStore((s) => s.profile);
  return (
    <div className="flex gap-4 justify-center py-3 text-lg font-bold">
      <span title="연속 학습">🔥 <b>{streakCount}</b></span>
      <span title="보석">💎 <b>{gems}</b></span>
      <span title="프리즈">🧊 <b>{freezeCount}</b></span>
    </div>
  );
}
