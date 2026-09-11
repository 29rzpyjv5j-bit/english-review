import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useStore } from './store/useStore';
import HomePage from './features/home/HomePage';
import AddDeckPage from './features/deck/AddDeckPage';
import SessionPage from './features/session/SessionPage';
import ShopPage from './features/shop/ShopPage';

export default function App() {
  const load = useStore((s) => s.load);
  const loaded = useStore((s) => s.loaded);
  useEffect(() => { load(); }, [load]);
  if (!loaded) return <div className="p-6 text-center text-gray-400">불러오는 중…</div>;
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/add" element={<AddDeckPage />} />
      <Route path="/session" element={<SessionPage />} />
      <Route path="/shop" element={<ShopPage />} />
    </Routes>
  );
}
