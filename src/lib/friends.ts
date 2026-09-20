import { daysBetween } from './dateUtils';

export interface FriendView {
  streak: number;
  doneToday: boolean;
  lastStudied: string;
}

// 서버에는 마지막으로 올린 연속 일수가 남아 있을 뿐이라, 며칠 쉬어 끊긴 연속도 그대로 보인다.
// 어제나 오늘 공부한 사람만 연속으로 치고, 그보다 오래됐으면 0으로 보여준다.
// (프리즈로 메워질 수도 있지만 그건 본인이 다음에 공부할 때 반영된다.)
export function describeFriend(lastStudyDate: string | null, streakCount: number, today: string): FriendView {
  if (!lastStudyDate) return { streak: 0, doneToday: false, lastStudied: '아직 학습 전' };
  const gap = daysBetween(lastStudyDate, today);
  const doneToday = gap <= 0;
  const lastStudied = gap <= 0 ? '오늘' : gap === 1 ? '어제' : `${gap}일 전`;
  return { streak: gap <= 1 ? streakCount : 0, doneToday, lastStudied };
}

// 오늘 끝낸 사람을 먼저, 그다음 연속이 긴 순서로.
export function rankFriends<T extends { nickname: string; view: FriendView }>(list: T[]): T[] {
  return [...list].sort(
    (a, b) =>
      Number(b.view.doneToday) - Number(a.view.doneToday) ||
      b.view.streak - a.view.streak ||
      a.nickname.localeCompare(b.nickname, 'ko'),
  );
}

// 초대 코드는 하루만 쓴다. 코드를 맞혀 들어오려는 시도를 하루치로 묶어두기 위한 것이다.
export function inviteExpired(expiresAt: string, now: Date = new Date()): boolean {
  return new Date(expiresAt).getTime() <= now.getTime();
}

export function inviteExpiryLabel(expiresAt: string, now: Date = new Date()): string {
  const at = new Date(expiresAt);
  const sameDay = at.toDateString() === now.toDateString();
  const time = at.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit' });
  return sameDay ? `오늘 ${time}` : `내일 ${time}`;
}
