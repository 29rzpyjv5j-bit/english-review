import { useNavigate } from 'react-router-dom';

export default function ResultScreen({
  correct, total, gained, wrongItems,
}: { correct: number; total: number; gained: number; wrongItems: string[] }) {
  const navigate = useNavigate();
  return (
    <div className="max-w-md mx-auto p-6 text-center space-y-4">
      <h1 className="text-2xl font-bold">🎉 학습 완료!</h1>
      <p className="text-lg">정답 {correct} / {total}</p>
      <p className="text-lg">💎 +{gained}</p>
      {wrongItems.length > 0 && (
        <div className="text-left rounded-xl border p-3">
          <p className="font-medium mb-1">복습이 필요한 항목</p>
          <ul className="text-sm text-gray-600 list-disc pl-5">
            {wrongItems.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </div>
      )}
      <button className="rounded-xl bg-green-500 text-white px-6 py-3 font-bold" onClick={() => navigate('/')}>
        홈으로
      </button>
    </div>
  );
}
