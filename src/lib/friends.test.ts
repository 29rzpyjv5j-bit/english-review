import { describe, it, expect } from 'vitest';
import { describeFriend, rankFriends, inviteExpired, inviteExpiryLabel } from './friends';

describe('describeFriend', () => {
  it('오늘 공부했으면 연속 그대로, 오늘 완료', () => {
    expect(describeFriend('2026-09-15', 5, '2026-09-15')).toEqual({ streak: 5, doneToday: true, lastStudied: '오늘' });
  });

  it('어제까지 공부했으면 연속은 살아 있지만 오늘은 아직', () => {
    expect(describeFriend('2026-09-14', 5, '2026-09-15')).toEqual({ streak: 5, doneToday: false, lastStudied: '어제' });
  });

  it('이틀 이상 쉬었으면 연속은 끊긴 것으로 보여준다', () => {
    expect(describeFriend('2026-09-12', 5, '2026-09-15')).toEqual({ streak: 0, doneToday: false, lastStudied: '3일 전' });
  });

  it('아직 한 번도 안 했으면', () => {
    expect(describeFriend(null, 0, '2026-09-15')).toEqual({ streak: 0, doneToday: false, lastStudied: '아직 학습 전' });
  });
});

describe('rankFriends', () => {
  it('오늘 끝낸 사람이 먼저, 그다음 연속이 긴 순서', () => {
    const f = (nickname: string, doneToday: boolean, streak: number) => ({ nickname, view: { doneToday, streak, lastStudied: '' } });
    const ranked = rankFriends([f('가', false, 30), f('나', true, 2), f('다', true, 9)]);
    expect(ranked.map((x) => x.nickname)).toEqual(['다', '나', '가']);
  });
});

describe('초대 코드 만료', () => {
  const now = new Date('2026-09-20T10:00:00+09:00');

  it('만료 시각이 지나면 쓸 수 없다', () => {
    expect(inviteExpired('2026-09-20T09:59:00+09:00', now)).toBe(true);
    expect(inviteExpired('2026-09-20T10:01:00+09:00', now)).toBe(false);
  });

  it('언제까지인지 알려준다', () => {
    expect(inviteExpiryLabel('2026-09-20T18:30:00+09:00', now)).toContain('오늘');
    expect(inviteExpiryLabel('2026-09-21T09:00:00+09:00', now)).toContain('내일');
  });
});
