import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GroupBoard from './GroupBoard';
import type { GroupInfo, MemberStatus } from '../../cloud/social';

vi.mock('../../cloud/social', () => ({
  listGroupMembers: vi.fn(),
  leaveGroup: vi.fn(),
  approveMember: vi.fn(),
  rejectMember: vi.fn(),
  refreshInvite: vi.fn(),
}));

import { listGroupMembers, approveMember } from '../../cloud/social';

const group = (owned: boolean): GroupInfo => ({
  id: 'g1',
  name: 'CLO 스터디',
  inviteCode: 'BQDEGH',
  inviteExpiresAt: new Date(Date.now() + 3600_000).toISOString(),
  owned,
  myStatus: 'approved',
});

const member = (userId: string, nickname: string, pending = false): MemberStatus => ({
  userId, nickname, streakCount: 3, lastStudyDate: null, pending,
});

beforeEach(() => {
  vi.mocked(listGroupMembers).mockResolvedValue([member('me', '은진'), member('u2', '민수'), member('u3', '지훈', true)]);
  vi.mocked(approveMember).mockResolvedValue(undefined);
});

describe('GroupBoard', () => {
  it('평소 화면에는 그룹 이름과 인원, 친구 목록만 보이고 초대 코드는 없다', async () => {
    render(<GroupBoard group={group(true)} myId="me" onLeft={vi.fn()} />);
    expect(await screen.findByText('은진')).toBeTruthy();

    expect(screen.getByText('CLO 스터디')).toBeTruthy();
    expect(screen.getByText('2명 · 오늘 0명 완료')).toBeTruthy();
    expect(screen.queryByText('BQDEGH')).toBeNull();
    // 수락 대기 중인 사람은 목록에 섞이지 않는다
    expect(screen.queryByText('지훈')).toBeNull();
  });

  it('방장이 설정을 열면 초대 코드와 참여 요청이 보인다', async () => {
    const user = userEvent.setup();
    render(<GroupBoard group={group(true)} myId="me" onLeft={vi.fn()} />);
    expect(await screen.findByText('은진')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: '그룹 설정' }));

    expect(screen.getByText('BQDEGH')).toBeTruthy();
    expect(screen.getByText('지훈')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: '수락' }));
    expect(approveMember).toHaveBeenCalledWith('g1', 'u3');
  });

  it('방장이 아니면 설정을 열어도 초대 코드가 보이지 않는다', async () => {
    const user = userEvent.setup();
    render(<GroupBoard group={group(false)} myId="me" onLeft={vi.fn()} />);
    expect(await screen.findByText('은진')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: '그룹 설정' }));

    expect(screen.queryByText('BQDEGH')).toBeNull();
    expect(screen.getByText('초대는 그룹을 만든 사람만 할 수 있어요.')).toBeTruthy();
    expect(screen.getByText('이 그룹에서 나가기')).toBeTruthy();
  });
});
