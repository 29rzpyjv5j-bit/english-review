import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useStore } from './store/useStore';
import HomePage from './features/home/HomePage';
import AddDeckPage from './features/deck/AddDeckPage';
import SessionPage from './features/session/SessionPage';
import ShopPage from './features/shop/ShopPage';
import TabBar from './components/TabBar';

export default function App() {
  const load = useStore((s) => s.load);
  const loaded = useStore((s) => s.loaded);
  const { pathname } = useLocation();
  useEffect(() => {
    load();
  }, [load]);

  if (!loaded) return <div className="p-6 text-center text-muted">불러오는 중…</div>;

  // 세션(학습) 화면과 자료 추가 화면은 몰입/집중을 위해 탭바를 숨긴다.
  const showTabBar = pathname === '/' || pathname === '/shop';

  // 노치/상태바를 피하도록 상단 세이프 에어리어 + 약간의 여백을 준다(홈 화면 설치 시 특히 중요).
  return (
    <div className={`pt-[calc(env(safe-area-inset-top)+0.5rem)] ${showTabBar ? 'pb-24' : ''}`}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/add" element={<AddDeckPage />} />
        <Route path="/session" element={<SessionPage />} />
        <Route path="/shop" element={<ShopPage />} />
      </Routes>
      {showTabBar && <TabBar />}
    </div>
  );
}
