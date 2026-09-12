// 선/듀오톤 아이콘 세트 (이모지 대체). 모두 currentColor를 따른다.
type IconProps = { className?: string };

function Svg({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <svg
      className={className ?? 'w-5 h-5'}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function Flame({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 3c2.5 3.5 5 5.5 5 9a5 5 0 0 1-10 0c0-1.3.6-2.4 1.4-3.2C9.2 10 10 8 12 3z" />
      <path d="M12 20a2.6 2.6 0 0 0 2.6-2.6c0-1.3-1-2.1-1.6-3-1 1-3.6 1.9-3.6 3.9A2.6 2.6 0 0 0 12 20z" />
    </Svg>
  );
}

export function Gem({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M6 4h12l3 5-9 12L3 9z" />
      <path d="M3 9h18M9 4 7 9l5 12 5-12-2-5" />
    </Svg>
  );
}

export function Snow({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 2v20M2 12h20M5 5l14 14M19 5 5 19" />
    </Svg>
  );
}

export function Home({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 11l8-7 8 7" />
      <path d="M6 10v9h12v-9" />
    </Svg>
  );
}

export function Study({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M5 4h9a2 2 0 0 1 2 2v14H7a2 2 0 0 0-2 2z" />
      <path d="M16 6h3v14h-3" />
    </Svg>
  );
}

export function Shop({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M3 4h2l2.2 11h10l2-8H6.5" />
      <circle cx="9.5" cy="19" r="1.4" />
      <circle cx="17" cy="19" r="1.4" />
    </Svg>
  );
}

export function Check({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M5 12l4.5 4.5L19 7" />
    </Svg>
  );
}

export function Chevron({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M9 6l6 6-6 6" />
    </Svg>
  );
}

export function Speaker({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 9v6h4l5 4V5L8 9z" />
      <path d="M16 8.5a4 4 0 0 1 0 7" />
    </Svg>
  );
}

export function Mic({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </Svg>
  );
}

export function MicOff({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
      <path d="M4 3l16 18" />
    </Svg>
  );
}
