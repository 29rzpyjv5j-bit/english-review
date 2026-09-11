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
    <nav className="fixed bottom-0 inset-x-0 z-20 border-t border-line bg-surface/95 backdrop-blur">
      <div className="max-w-md mx-auto flex">
        {tabs.map(({ to, label, Icon }) => {
          const active = to === '/' ? pathname === '/' : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
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
