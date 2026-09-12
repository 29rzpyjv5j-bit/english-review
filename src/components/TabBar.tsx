import { Link, useLocation } from 'react-router-dom';
import { Home, Study, Shop } from './icons';

const tabs = [
  { to: '/', label: '홈', Icon: Home },
  { to: '/session', label: '학습', Icon: Study },
  { to: '/shop', label: '상점', Icon: Shop },
];

export default function TabBar() {
  const { pathname } = useLocation();
  return (
    // 불투명 배경으로 바닥에 붙은 하나의 바처럼 보이게 하고, 아래 여백은 홈 인디케이터
    // 높이(safe-area)만큼만 남겨 아이콘이 화면 바닥 가까이 오도록 한다.
    <nav className="fixed bottom-0 inset-x-0 z-20 border-t border-line bg-surface pt-1.5 pb-[calc(env(safe-area-inset-bottom)+0.375rem)]">
      <div className="max-w-md mx-auto flex">
        {tabs.map(({ to, label, Icon }) => {
          const active = to === '/' ? pathname === '/' : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex-1 flex flex-col items-center gap-0.5 py-1 text-[11px] font-medium ${
                active ? 'text-accent' : 'text-muted'
              }`}
            >
              <Icon className="w-6 h-6" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
