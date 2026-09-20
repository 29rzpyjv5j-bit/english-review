import { useCallback, useEffect, useState } from 'react';
import {
  listGroupMembers, leaveGroup, approveMember, rejectMember, refreshInvite,
  type GroupInfo, type MemberStatus,
} from '../../cloud/social';
import { describeFriend, rankFriends, inviteExpired, inviteExpiryLabel } from '../../lib/friends';
import { todayStr } from '../../lib/dateUtils';
import { Flame, Settings } from '../../components/icons';

export default function GroupBoard({
  group, myId, onLeft,
}: { group: GroupInfo; myId: string; onLeft: () => void }) {
  const [invite, setInvite] = useState(group);
  const [members, setMembers] = useState<MemberStatus[] | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  // 초대 코드와 참여 요청은 평소 화면에서 빼고 여기에 모아둔다. 매일 보는 건 친구 목록이다.
  const [settingsOpen, setSettingsOpen] = useState(false);

  const refresh = useCallback(async () => {
    setError('');
    try {
      setMembers(await listGroupMembers(group.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : '불러오지 못했어요.');
    }
  }, [group.id]);

  // 다른 앱에 갔다 돌아오면 친구들이 그사이 공부했을 수 있으니 다시 불러온다.
  useEffect(() => {
    refresh();
    const onVisible = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refresh]);

  async function act(task: () => Promise<unknown>) {
    setError('');
    try {
      await task();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '처리하지 못했어요.');
    }
  }

  async function share() {
    const link = `${location.origin}${location.pathname}#/friends?code=${invite.inviteCode}`;
    const text = `영어 복습 같이 해요! "${invite.name}" 초대 코드: ${invite.inviteCode} (오늘까지)`;
    try {
      if (navigator.share) {
        await navigator.share({ title: '영어 복습', text, url: link });
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${link}`);
      setNotice('초대 문구를 복사했어요');
    } catch {
      // 공유 창을 닫은 경우
    }
  }

  async function leave() {
    if (!window.confirm(`"${group.name}" 그룹에서 나갈까요?`)) return;
    await act(async () => { await leaveGroup(group.id); onLeft(); });
  }

  const today = todayStr();
  const all = (members ?? []).map((m) => ({ ...m, view: describeFriend(m.lastStudyDate, m.streakCount, today) }));
  const waiting = all.filter((m) => m.pending);
  const ranked = rankFriends(all.filter((m) => !m.pending));
  const doneCount = ranked.filter((m) => m.view.doneToday).length;
  const expired = inviteExpired(invite.inviteExpiresAt);

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-lg font-bold truncate">{group.name}</p>
          <p className="text-sm text-muted">
            {members ? `${ranked.length}명 · 오늘 ${doneCount}명 완료` : '불러오는 중…'}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button className="text-sm text-muted underline" onClick={refresh}>새로고침</button>
          <button
            aria-label="그룹 설정"
            className="relative grid place-items-center w-9 h-9 rounded-full border border-line text-muted active:opacity-90"
            onClick={() => { setSettingsOpen((v) => !v); setNotice(''); }}
          >
            <Settings className="w-5 h-5" />
            {group.owned && waiting.length > 0 && (
              <span className="absolute -top-1 -right-1 grid place-items-center min-w-5 h-5 px-1 rounded-full bg-accent text-accentInk text-[11px] font-bold">
                {waiting.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {settingsOpen ? (
        <div className="space-y-3">
          {group.owned ? (
            <>
              <div className="rounded-2xl border border-line bg-surface p-4 space-y-3">
                <p className="font-bold">친구 초대</p>
                <div className="flex items-center gap-2">
                  <span
                    className={`flex-1 rounded-xl border border-line bg-bg px-3 py-2.5 text-center font-mono text-lg tracking-[0.3em] ${expired ? 'text-muted line-through' : ''}`}
                  >
                    {invite.inviteCode}
                  </span>
                  {!expired && (
                    <button className="rounded-xl bg-accent text-accentInk px-4 py-2.5 font-bold active:opacity-90" onClick={share}>
                      초대하기
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted">
                  {expired ? '코드가 만료됐어요.' : `이 코드는 ${inviteExpiryLabel(invite.inviteExpiresAt)}까지만 쓸 수 있어요.`}
                  <button
                    className="ml-2 text-accent underline"
                    onClick={() => act(async () => setInvite(await refreshInvite(group.id)))}
                  >
                    새 코드 만들기
                  </button>
                </p>
                {notice && <p className="text-xs text-accent">{notice}</p>}
              </div>

              <div className="rounded-2xl border border-line bg-surface p-4 space-y-3">
                <p className="font-bold">참여 요청 {waiting.length > 0 && <span className="text-accent">{waiting.length}</span>}</p>
                {waiting.length === 0 ? (
                  <p className="text-sm text-muted">기다리는 사람이 없어요.</p>
                ) : (
                  waiting.map((m) => (
                    <div key={m.userId} className="flex items-center gap-2">
                      <span className="flex-1 truncate">{m.nickname}</span>
                      <button
                        className="rounded-lg bg-accent text-accentInk px-3 py-1.5 text-sm font-bold active:opacity-90"
                        onClick={() => act(() => approveMember(group.id, m.userId))}
                      >
                        수락
                      </button>
                      <button
                        className="rounded-lg border border-line px-3 py-1.5 text-sm text-muted active:opacity-90"
                        onClick={() => act(() => rejectMember(group.id, m.userId))}
                      >
                        거절
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted">초대는 그룹을 만든 사람만 할 수 있어요.</p>
          )}

          <button className="w-full text-sm text-muted underline py-2" onClick={leave}>이 그룹에서 나가기</button>
          <button className="w-full rounded-xl border border-line py-2.5 text-sm" onClick={() => setSettingsOpen(false)}>
            닫기
          </button>
        </div>
      ) : (
        <ul className="space-y-2">
          {ranked.map((m) => {
            const me = m.userId === myId;
            return (
              <li
                key={m.userId}
                className={`flex items-center gap-3 rounded-xl border px-3 py-3 ${me ? 'border-accent/50 bg-accent/5' : 'border-line bg-surface'}`}
              >
                <span className="grid place-items-center w-10 h-10 shrink-0 rounded-full bg-surface2 font-bold">
                  {m.nickname.slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">
                    {m.nickname}
                    {me && <span className="ml-1 text-xs text-accent">나</span>}
                  </p>
                  <p className="text-xs text-muted truncate">
                    {m.view.doneToday ? '학습 중 · 오늘' : m.view.lastStudied}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`inline-flex items-center gap-1 font-bold tabular-nums ${m.view.streak > 0 ? 'text-accent' : 'text-muted'}`}>
                    <Flame className="w-4 h-4" />
                    {m.view.streak}
                  </span>
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[11px] ${m.view.doneToday ? 'bg-accent/15 text-accent' : 'bg-surface2 text-muted'}`}
                  >
                    {m.view.doneToday ? '오늘 완료' : '오늘 아직'}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
