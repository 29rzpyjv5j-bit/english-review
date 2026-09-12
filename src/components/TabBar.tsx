import { Link, useLocation } from 'react-router-dom';
import { Home, Shop, Settings } from './icons';

const tabs = [
  { to: '/', label: '홈', Icon: Home },
  { to: '/shop', label: '상점', Icon: Shop },
  { to: '/settings', label: '설정', Icon: Settings },
];

export default function TabBar() {
  const { pathname } = useLocation();
  return (
    // 불투명 배경으로 바닥에 붙은 하나의 바처럼 보이게 하고, 아래 여백은 홈 인디케이터
    // 높이(safe-area)만큼만 남겨 아이콘이 화면 바닥 가까이 오도록 한다.
    // 배경을 페이지와 같은 색으로 둔다. 탭바만 밝으면 그 아래(홈 인디케이터 영역·
    // 스탠드얼론에서 시스템이 칠하는 영역)가 어둡게 남아 바가 떠 보인다.
    // 아래 여백은 두지 않는다. 홈 화면에 추가해 실행하면 기기가 보고하는
    // safe-area가 홈 인디케이터보다 훨씬 크게 잡혀, 그만큼 비우면 아이콘이
    // 화면 중간에 뜬 것처럼 보인다. 설치형 앱들이 하는 대로 라벨이 인디케이터에
    // 살짝 겹치도록 바닥까지 내린다.
    <nav className="fixed bottom-0 inset-x-0 z-20 border-t border-line bg-bg pt-1.5 pb-0">
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
