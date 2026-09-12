import type { League } from '../types';

const leagueColors: Record<League, { bg: string; text: string; emoji: string }> = {
  Bronze: { bg: 'bg-orange-900/20', text: 'text-orange-600', emoji: '🥉' },
  Silver: { bg: 'bg-gray-200/20', text: 'text-gray-400', emoji: '🥈' },
  Gold: { bg: 'bg-yellow-300/20', text: 'text-yellow-600', emoji: '🥇' },
  Platinum: { bg: 'bg-blue-200/20', text: 'text-blue-400', emoji: '💎' },
  Diamond: { bg: 'bg-purple-300/20', text: 'text-purple-500', emoji: '💠' },
  Sapphire: { bg: 'bg-cyan-300/20', text: 'text-cyan-400', emoji: '✨' },
};

export default function LeagueBadge({ league }: { league: League }) {
  const style = leagueColors[league];
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${style.bg}`}>
      <span>{style.emoji}</span>
      <span className={`text-sm font-bold ${style.text}`}>{league}</span>
    </div>
  );
}
