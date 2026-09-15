import { useCallback, useEffect, useState } from 'react';
import { listGroupMembers, leaveGroup, type GroupInfo, type MemberStatus } from '../../cloud/social';
import { describeFriend, rankFriends } from '../../lib/friends';
import { todayStr } from '../../lib/dateUtils';
import { Flame } from '../../components/icons';

export default function GroupBoard({
  group, myId, onLeft,
}: { group: GroupInfo; myId: string; onLeft: () => void }) {
  const [members, setMembers] = useState<MemberStatus[] | null>(null);
  const [error, setError] = useState('');
  const [shared, setShared] = useState('');

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

  async function share() {
    const link = `${location.origin}${location.pathname}#/friends?code=${group.inviteCode}`;
    const text = `영어 복습 같이 해요! "${group.name}" 초대 코드: ${group.inviteCode}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: '영어 복습', text, url: link });
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${link}`);
      setShared('초대 문구를 복사했어요');
    } catch {
      // 공유 창을 닫은 경우
    }
  }

  async function leave() {
    if (!window.confirm(`"${group.name}" 그룹에서 나갈까요?`)) return;
    try {
      await leaveGroup(group.id);
      onLeft();
    } catch (err) {
      setError(err instanceof Error ? err.message : '나가지 못했어요.');
    }
  }

  const today = todayStr();
  const ranked = rankFriends(
    (members ?? []).map((m) => ({ ...m, view: describeFriend(m.lastStudyDate, m.streakCount, today) })),
  );
  const doneCount = ranked.filter((m) => m.view.doneToday).length;

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-line bg-surface p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-lg font-bold truncate">{group.name}</p>
            {members && (
              <p className="text-sm text-muted">
                {members.length}명 중 {doneCount}명 오늘 완료
              </p>
            )}
          </div>
          <button className="text-sm text-muted underline shrink-0" onClick={refresh}>새로고침</button>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex-1 rounded-xl border border-line bg-bg px-3 py-2.5 text-center font-mono text-lg tracking-[0.3em]">
            {group.inviteCode}
          </span>
          <button className="rounded-xl bg-accent text-accentInk px-4 py-2.5 font-bold active:opacity-90" onClick={share}>
            초대하기
          </button>
        </div>
        {shared && <p className="text-xs text-accent">{shared}</p>}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      {!members && !error && <p className="text-sm text-muted text-center py-6">불러오는 중…</p>}

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
                  {m.studying ? `${m.studying} 공부 중 · ` : ''}
                  {m.view.lastStudied}
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

      <button className="w-full text-sm text-muted underline py-2" onClick={leave}>이 그룹에서 나가기</button>
    </div>
  );
}
