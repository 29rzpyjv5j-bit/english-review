import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { cloudConfigured } from '../../cloud/client';
import {
  currentUserId, getMyStatus, saveNickname, listMyGroups, createGroup, joinGroup, signOut,
  type GroupInfo, type MemberStatus,
} from '../../cloud/social';
import LoginPanel from './LoginPanel';
import GroupBoard from './GroupBoard';

const fieldCls =
  'w-full rounded-xl border border-line bg-surface p-3 text-ink placeholder:text-muted focus:outline-none focus:border-accent';
const primaryCls = 'w-full rounded-xl bg-accent text-accentInk py-3 font-bold disabled:opacity-50 active:opacity-90';

type State =
  | { phase: 'loading' }
  | { phase: 'signedOut' }
  | { phase: 'needNickname'; userId: string }
  | { phase: 'ready'; userId: string; me: MemberStatus; groups: GroupInfo[] }
  | { phase: 'error'; message: string };

export default function FriendsPage() {
  const [state, setState] = useState<State>({ phase: 'loading' });
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [addingGroup, setAddingGroup] = useState(false);
  const [params] = useSearchParams();
  const inviteFromLink = params.get('code') ?? '';

  const refresh = useCallback(async () => {
    try {
      const userId = await currentUserId();
      if (!userId) return setState({ phase: 'signedOut' });
      const me = await getMyStatus();
      if (!me) return setState({ phase: 'needNickname', userId });
      const groups = await listMyGroups();
      setState({ phase: 'ready', userId, me, groups });
      setActiveGroupId((id) => (id && groups.some((g) => g.id === id) ? id : groups[0]?.id ?? null));
    } catch (err) {
      setState({ phase: 'error', message: err instanceof Error ? err.message : '불러오지 못했어요.' });
    }
  }, []);

  useEffect(() => {
    if (cloudConfigured()) refresh();
  }, [refresh]);

  if (!cloudConfigured()) {
    return (
      <Page>
        <p className="text-sm text-muted">친구 기능이 아직 연결되지 않았어요.</p>
      </Page>
    );
  }

  if (state.phase === 'loading') return <Page><p className="text-sm text-muted text-center py-8">불러오는 중…</p></Page>;
  if (state.phase === 'error') {
    return (
      <Page>
        <p className="text-sm text-danger">{state.message}</p>
        <button className={primaryCls} onClick={refresh}>다시 시도</button>
      </Page>
    );
  }
  if (state.phase === 'signedOut') return <Page><LoginPanel onSignedIn={refresh} /></Page>;
  if (state.phase === 'needNickname') return <Page><NicknamePanel onSaved={refresh} /></Page>;

  const showSetup = state.groups.length === 0 || addingGroup;
  const active = state.groups.find((g) => g.id === activeGroupId);

  return (
    <Page>
      {state.groups.length > 1 && !addingGroup && (
        <div className="flex gap-2 overflow-x-auto">
          {state.groups.map((g) => (
            <button
              key={g.id}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${g.id === activeGroupId ? 'border-accent text-accent' : 'border-line text-muted'}`}
              onClick={() => setActiveGroupId(g.id)}
            >
              {g.name}
            </button>
          ))}
        </div>
      )}

      {showSetup ? (
        <GroupSetup
          initialCode={inviteFromLink}
          onDone={(g) => { setAddingGroup(false); setActiveGroupId(g.id); refresh(); }}
          onCancel={state.groups.length > 0 ? () => setAddingGroup(false) : undefined}
        />
      ) : active && active.myStatus === 'pending' ? (
        <div className="rounded-2xl border border-line bg-surface p-4 space-y-2">
          <p className="text-lg font-bold">"{active.name}" 수락 대기 중</p>
          <p className="text-sm text-muted">
            그룹을 만든 사람이 수락하면 친구들의 현황이 보여요. 그때까지는 아무것도 보이지 않습니다.
          </p>
          <button className="text-sm text-accent underline" onClick={refresh}>확인해보기</button>
        </div>
      ) : (
        active && <GroupBoard key={active.id} group={active} myId={state.userId} onLeft={refresh} />
      )}

      {!showSetup && (
        <button className="w-full rounded-xl border border-dashed border-line py-3 text-sm text-muted" onClick={() => setAddingGroup(true)}>
          + 다른 그룹 만들기 · 참여하기
        </button>
      )}

      <div className="flex items-center justify-between pt-2 text-sm text-muted">
        <span>{state.me.nickname} 으로 참여 중</span>
        <button className="underline" onClick={async () => { await signOut(); refresh(); }}>로그아웃</button>
      </div>
    </Page>
  );
}

function Page({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <h1 className="text-xl font-bold">스터디</h1>
      {children}
    </div>
  );
}

function NicknamePanel({ onSaved }: { onSaved: () => void }) {
  const profile = useStore((s) => s.profile);
  const [nickname, setNickname] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const trimmed = nickname.trim();

  async function save() {
    setBusy(true);
    setError('');
    try {
      await saveNickname(trimmed, { streakCount: profile.streakCount, lastStudyDate: profile.lastStudyDate });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장하지 못했어요.');
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-4 space-y-3">
      <p className="text-lg font-bold">친구들에게 보일 이름</p>
      <input
        aria-label="닉네임"
        className={fieldCls}
        value={nickname}
        maxLength={20}
        onChange={(e) => setNickname(e.target.value)}
        placeholder="은진"
      />
      <button className={primaryCls} disabled={!trimmed || busy} onClick={save}>
        {busy ? '저장 중…' : '시작하기'}
      </button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}

function GroupSetup({
  initialCode, onDone, onCancel,
}: { initialCode: string; onDone: (g: GroupInfo) => void; onCancel?: () => void }) {
  const [code, setCode] = useState(initialCode.toUpperCase());
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function run(task: () => Promise<GroupInfo>) {
    setBusy(true);
    setError('');
    try {
      onDone(await task());
    } catch (err) {
      setError(err instanceof Error ? err.message : '문제가 생겼어요.');
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-line bg-surface p-4 space-y-3">
        <p className="font-bold">초대 코드로 참여</p>
        <input
          aria-label="초대 코드"
          className={`${fieldCls} text-center font-mono text-lg tracking-[0.3em] uppercase`}
          value={code}
          maxLength={6}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
          placeholder="ABC234"
        />
        <button className={primaryCls} disabled={code.length !== 6 || busy} onClick={() => run(() => joinGroup(code))}>
          참여하기
        </button>
      </div>

      <div className="rounded-2xl border border-line bg-surface p-4 space-y-3">
        <p className="font-bold">새 그룹 만들기</p>
        <input
          aria-label="그룹 이름"
          className={fieldCls}
          value={name}
          maxLength={30}
          onChange={(e) => setName(e.target.value)}
          placeholder="수요일 영어반"
        />
        <button
          className="w-full rounded-xl border border-accent text-accent py-3 font-bold disabled:opacity-50 active:opacity-90"
          disabled={!name.trim() || busy}
          onClick={() => run(() => createGroup(name))}
        >
          만들고 초대 코드 받기
        </button>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}
      {onCancel && <button className="w-full text-sm text-muted underline py-2" onClick={onCancel}>취소</button>}
    </div>
  );
}
