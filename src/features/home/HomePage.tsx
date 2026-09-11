import { Link } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import StatusBar from '../../components/StatusBar';

export default function HomePage() {
  const decks = useStore((s) => s.decks);
  const words = useStore((s) => s.words);
  const sentences = useStore((s) => s.sentences);

  const countFor = (deckId: string) => ({
    w: words.filter((w) => w.deckId === deckId).length,
    s: sentences.filter((s) => s.deckId === deckId).length,
  });

  return (
    <div className="max-w-md mx-auto p-4">
      <StatusBar />
      <div className="rounded-2xl bg-green-50 p-6 text-center mb-4">
        <p className="text-gray-600 mb-3">오늘의 학습</p>
        <Link to="/session" className="inline-block rounded-full bg-green-500 text-white px-6 py-3 font-bold">
          오늘의 학습 시작 ▶
        </Link>
      </div>
      <Link to="/session?mode=review" className="block text-center text-blue-600 mb-6">
        🔁 복습하기
      </Link>

      <h2 className="font-bold mb-2">내 자료</h2>
      <ul className="space-y-2 mb-4">
        {decks.length === 0 && <li className="text-gray-400">아직 자료가 없어요.</li>}
        {decks.map((d) => {
          const c = countFor(d.id);
          return (
            <li key={d.id} className="rounded-xl border p-3 flex justify-between">
              <span>{d.name}</span>
              <span className="text-gray-500 text-sm">단어 {c.w} · 문장 {c.s}</span>
            </li>
          );
        })}
      </ul>

      <div className="flex gap-2">
        <Link to="/add" className="flex-1 text-center rounded-xl border py-2">+ 자료 추가</Link>
        <Link to="/shop" className="flex-1 text-center rounded-xl border py-2">🛒 상점</Link>
      </div>
    </div>
  );
}
