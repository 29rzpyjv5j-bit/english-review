import type { League } from '../types';

const LEAGUE_THRESHOLDS: { threshold: number; league: League; message: string }[] = [
  { threshold: 0, league: 'Bronze', message: '🥉 동메달 리그에 오신 것을 환영합니다!' },
  { threshold: 10, league: 'Silver', message: '🥈 10일 연속! 은메달 리그로 승격되었습니다!' },
  { threshold: 50, league: 'Gold', message: '🥇 50일 연속! 금메달 리그로 승격되었습니다!' },
  { threshold: 100, league: 'Platinum', message: '💎 100일 연속! 플래티넘 리그로 승격되었습니다!' },
  { threshold: 500, league: 'Diamond', message: '💠 500일 연속! 다이아몬드 리그로 승격되었습니다!' },
  { threshold: 1000, league: 'Sapphire', message: '✨ 1000일 연속! 사파이어 리그로 승격되었습니다!' },
];

export function getLeague(streakCount: number): League {
  for (let i = LEAGUE_THRESHOLDS.length - 1; i >= 0; i--) {
    if (streakCount >= LEAGUE_THRESHOLDS[i].threshold) {
      return LEAGUE_THRESHOLDS[i].league;
    }
  }
  return 'Bronze';
}

export function getLeagueMessage(streakCount: number, currentLeague: League): string | null {
  const newLeague = getLeague(streakCount);
  if (newLeague !== currentLeague) {
    const threshold = LEAGUE_THRESHOLDS.find((t) => t.league === newLeague);
    return threshold?.message ?? null;
  }
  return null;
}

export function getLeagueMilestones(streakCount: number): { next: League; daysUntil: number } | null {
  const nextThreshold = LEAGUE_THRESHOLDS.find((t) => t.threshold > streakCount);
  if (nextThreshold) {
    return { next: nextThreshold.league, daysUntil: nextThreshold.threshold - streakCount };
  }
  return null;
}
