import { useNavigate } from 'react-router-dom';
import { Gem } from '../../components/icons';

export default function ResultScreen({
  correct, total, gained, wrongItems,
}: { correct: number; total: number; gained: number; wrongItems: { id: string; text: string }[] }) {
  const navigate = useNavigate();
  return (
    <div className="max-w-md mx-auto p-6 text-center space-y-5">
      <div className="pt-6">
        <p className="text-5xl mb-2">🎉</p>
        <h1 className="text-2xl font-bold">학습 완료!</h1>
      </div>
      <div className="flex gap-3">
        <div className="flex-1 rounded-2xl border border-line bg-surface py-4">
          <p className="text-2xl font-bold tabular-nums">{correct} / {total}</p>
          <p className="text-xs text-muted mt-1">정답</p>
        </div>
        <div className="flex-1 rounded-2xl border border-line bg-surface py-4">
          <p className="flex items-center justify-center gap-1 text-2xl font-bold text-accent tabular-nums">
            <Gem className="w-5 h-5" /> +{gained}
          </p>
          <p className="text-xs text-muted mt-1">획득 보석</p>
        </div>
      </div>
      {wrongItems.length > 0 && (
        <div className="text-left rounded-2xl border border-line bg-surface p-4">
          <p className="font-medium mb-2 text-sm">복습이 필요한 항목 {wrongItems.length}개</p>
          <ul className="text-sm text-muted list-disc pl-5 space-y-1">
            {wrongItems.map((item, i) => <li key={i}>{item.text}</li>)}
          </ul>
        </div>
      )}
      <button
        className="w-full rounded-xl bg-accent text-accentInk px-6 py-3 font-bold active:opacity-90"
        onClick={() => navigate('/')}
      >
        홈으로
      </button>
    </div>
  );
}
