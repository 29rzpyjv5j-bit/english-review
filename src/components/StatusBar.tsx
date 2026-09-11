import type { ReactNode } from 'react';
import { useStore } from '../store/useStore';
import { Flame, Gem, Snow } from './icons';

function Chip({ icon, value, label }: { icon: ReactNode; value: number; label: string }) {
  return (
    <div className="flex-1 flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2">
      <span className="grid place-items-center w-7 h-7 rounded-full bg-accent/15 text-accent">
        {icon}
      </span>
      <span className="leading-tight">
        <b className="block text-sm font-bold tabular-nums">{value}</b>
        <span className="block text-[10px] text-muted">{label}</span>
      </span>
    </div>
  );
}

export default function StatusBar() {
  const { streakCount, gems, freezeCount } = useStore((s) => s.profile);
  return (
    <div className="flex gap-2">
      <Chip icon={<Flame className="w-4 h-4" />} value={streakCount} label="연속" />
      <Chip icon={<Gem className="w-4 h-4" />} value={gems} label="보석" />
      <Chip icon={<Snow className="w-4 h-4" />} value={freezeCount} label="프리즈" />
    </div>
  );
}
