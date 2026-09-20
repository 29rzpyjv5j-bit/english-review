import { getClient } from './client';

export interface GroupInfo {
  id: string;
  name: string;
  inviteCode: string;
  inviteExpiresAt: string;
  /** 내가 만든 그룹인지. 만든 사람만 참여 요청을 수락하고 새 코드를 낼 수 있다. */
  owned: boolean;
  /** 내 합류 상태. pending 이면 아직 수락을 기다리는 중이라 아무도 보이지 않는다. */
  myStatus: 'pending' | 'approved';
}

export interface MemberStatus {
  userId: string;
  nickname: string;
  streakCount: number;
  lastStudyDate: string | null;
  pending: boolean;
}

export interface StudySnapshot {
  streakCount: number;
  lastStudyDate: string | null;
}

interface StatusRow {
  user_id: string;
  nickname: string;
  streak_count: number;
  last_study_date: string | null;
}

const toStatus = (r: StatusRow, pending = false): MemberStatus => ({
  userId: r.user_id,
  nickname: r.nickname,
  streakCount: r.streak_count,
  lastStudyDate: r.last_study_date,
  pending,
});

// 서버가 돌려준 영어 오류를 화면에 띄울 말로 바꾼다.
function friendly(error: { message: string }): Error {
  const m = error.message;
  if (m.includes('invite code not found')) return new Error('없는 초대 코드예요. 다시 확인해 주세요.');
  if (m.includes('invite code expired')) return new Error('만료된 코드예요. 그룹을 만든 사람에게 새 코드를 받아 주세요.');
  if (m.includes('only the group owner')) return new Error('그룹을 만든 사람만 할 수 있어요.');
  if (/invalid login credentials/i.test(m)) return new Error('이메일이나 비밀번호가 맞지 않아요.');
  if (/already registered|already exists/i.test(m)) return new Error('이미 가입된 이메일이에요. 로그인해 주세요.');
  if (/password.*at least (\d+)/i.test(m)) return new Error('비밀번호는 6자 이상으로 정해 주세요.');
  if (/email.*invalid|invalid.*email/i.test(m)) return new Error('이메일 주소를 다시 확인해 주세요.');
  if (/rate limit|too many/i.test(m)) return new Error('요청이 너무 잦아요. 잠시 뒤에 다시 시도해 주세요.');
  if (/fetch|network/i.test(m)) return new Error('인터넷 연결을 확인해 주세요.');
  return new Error(m);
}

export async function currentUserId(): Promise<string | null> {
  const { data } = await getClient().auth.getSession();
  return data.session?.user.id ?? null;
}

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await getClient().auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw friendly(error);
}

export async function signUp(email: string, password: string): Promise<void> {
  const { data, error } = await getClient().auth.signUp({ email: email.trim(), password });
  if (error) throw friendly(error);
  // 메일 확인이 켜져 있으면 가입은 되지만 로그인 상태가 되지 않는다. 그럴 땐 바로 알려준다.
  if (!data.session) throw new Error('가입은 됐지만 바로 로그인되지 않았어요. 메일 확인 설정을 꺼야 합니다.');
}

export async function signOut(): Promise<void> {
  await getClient().auth.signOut();
}

export async function getMyStatus(): Promise<MemberStatus | null> {
  const uid = await currentUserId();
  if (!uid) return null;
  const { data, error } = await getClient().from('learner_status').select('*').eq('user_id', uid).maybeSingle();
  if (error) throw friendly(error);
  return data ? toStatus(data as StatusRow) : null;
}

// 닉네임을 정하면서 지금의 학습 현황도 같이 올린다. 친구가 바로 내 연속 일수를 볼 수 있게.
export async function saveNickname(nickname: string, snapshot: StudySnapshot): Promise<void> {
  const uid = await currentUserId();
  if (!uid) throw new Error('먼저 로그인해 주세요.');
  const { error } = await getClient().from('learner_status').upsert({
    user_id: uid,
    nickname: nickname.trim(),
    streak_count: snapshot.streakCount,
    last_study_date: snapshot.lastStudyDate,
    updated_at: new Date().toISOString(),
  });
  if (error) throw friendly(error);
}

// 세션을 마칠 때 부른다. 로그인하지 않았거나 닉네임을 정하지 않았으면 조용히 넘어간다.
// 학습 자체는 인터넷과 상관없이 끝나야 하므로 실패도 삼킨다.
export async function publishStudy(snapshot: StudySnapshot): Promise<void> {
  try {
    const uid = await currentUserId();
    if (!uid) return;
    await getClient()
      .from('learner_status')
      .update({
        streak_count: snapshot.streakCount,
        last_study_date: snapshot.lastStudyDate,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', uid);
  } catch {
    // 오프라인 등. 다음 세션을 마칠 때 다시 올라간다.
  }
}

interface GroupRow {
  id: string;
  name: string;
  invite_code: string;
  invite_expires_at: string;
  created_by: string;
}

const toGroup = (g: GroupRow, uid: string, myStatus: 'pending' | 'approved'): GroupInfo => ({
  id: g.id,
  name: g.name,
  inviteCode: g.invite_code,
  inviteExpiresAt: g.invite_expires_at,
  owned: g.created_by === uid,
  myStatus,
});

export async function listMyGroups(): Promise<GroupInfo[]> {
  const uid = await currentUserId();
  if (!uid) return [];
  const client = getClient();
  const [groups, mine] = await Promise.all([
    client.from('groups').select('id, name, invite_code, invite_expires_at, created_by').order('created_at'),
    client.from('group_members').select('group_id, status').eq('user_id', uid),
  ]);
  if (groups.error) throw friendly(groups.error);
  if (mine.error) throw friendly(mine.error);
  const statusOf = new Map((mine.data ?? []).map((m) => [m.group_id, m.status as 'pending' | 'approved']));
  return (groups.data ?? []).map((g) => toGroup(g as GroupRow, uid, statusOf.get(g.id) ?? 'pending'));
}

export async function createGroup(name: string): Promise<GroupInfo> {
  const uid = (await currentUserId()) ?? '';
  const { data, error } = await getClient().rpc('create_group', { p_name: name.trim() });
  if (error) throw friendly(error);
  return toGroup(data as GroupRow, uid, 'approved');
}

export async function joinGroup(code: string): Promise<GroupInfo> {
  const uid = (await currentUserId()) ?? '';
  const { data, error } = await getClient().rpc('join_group', { p_code: code.trim() });
  if (error) throw friendly(error);
  return toGroup(data as GroupRow, uid, 'pending');
}

export async function refreshInvite(groupId: string): Promise<GroupInfo> {
  const uid = (await currentUserId()) ?? '';
  const { data, error } = await getClient().rpc('refresh_invite', { p_group: groupId });
  if (error) throw friendly(error);
  return toGroup(data as GroupRow, uid, 'approved');
}

export async function approveMember(groupId: string, userId: string): Promise<void> {
  const { error } = await getClient().rpc('approve_member', { p_group: groupId, p_user: userId });
  if (error) throw friendly(error);
}

export async function rejectMember(groupId: string, userId: string): Promise<void> {
  const { error } = await getClient().from('group_members').delete().eq('group_id', groupId).eq('user_id', userId);
  if (error) throw friendly(error);
}

export async function leaveGroup(groupId: string): Promise<void> {
  const uid = await currentUserId();
  if (!uid) return;
  const { error } = await getClient().from('group_members').delete().eq('group_id', groupId).eq('user_id', uid);
  if (error) throw friendly(error);
}

export async function listGroupMembers(groupId: string): Promise<MemberStatus[]> {
  const client = getClient();
  const { data: members, error } = await client.from('group_members').select('user_id, status').eq('group_id', groupId);
  if (error) throw friendly(error);
  const pendingOf = new Map((members ?? []).map((m) => [m.user_id, m.status === 'pending']));
  if (pendingOf.size === 0) return [];
  const { data, error: statusError } = await client.from('learner_status').select('*').in('user_id', [...pendingOf.keys()]);
  if (statusError) throw friendly(statusError);
  return (data ?? []).map((r) => toStatus(r as StatusRow, pendingOf.get((r as StatusRow).user_id) ?? false));
}
