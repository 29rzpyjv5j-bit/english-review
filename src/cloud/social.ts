import { getClient } from './client';

export interface GroupInfo {
  id: string;
  name: string;
  inviteCode: string;
}

export interface MemberStatus {
  userId: string;
  nickname: string;
  streakCount: number;
  lastStudyDate: string | null;
  studying: string | null;
}

export interface StudySnapshot {
  streakCount: number;
  lastStudyDate: string | null;
  studying: string | null;
}

interface StatusRow {
  user_id: string;
  nickname: string;
  streak_count: number;
  last_study_date: string | null;
  studying: string | null;
}

const toStatus = (r: StatusRow): MemberStatus => ({
  userId: r.user_id,
  nickname: r.nickname,
  streakCount: r.streak_count,
  lastStudyDate: r.last_study_date,
  studying: r.studying,
});

// 서버가 돌려준 영어 오류를 화면에 띄울 말로 바꾼다.
function friendly(error: { message: string }): Error {
  const m = error.message;
  if (m.includes('invite code not found')) return new Error('없는 초대 코드예요. 다시 확인해 주세요.');
  if (/token.*(expired|invalid)|otp/i.test(m)) return new Error('코드가 맞지 않거나 만료됐어요. 새 코드를 받아 주세요.');
  if (/rate limit|too many/i.test(m)) return new Error('요청이 너무 잦아요. 잠시 뒤에 다시 시도해 주세요.');
  if (/fetch|network/i.test(m)) return new Error('인터넷 연결을 확인해 주세요.');
  return new Error(m);
}

export async function currentUserId(): Promise<string | null> {
  const { data } = await getClient().auth.getSession();
  return data.session?.user.id ?? null;
}

export async function sendLoginCode(email: string): Promise<void> {
  const { error } = await getClient().auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true } });
  if (error) throw friendly(error);
}

export async function verifyLoginCode(email: string, code: string): Promise<void> {
  const { error } = await getClient().auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' });
  if (error) throw friendly(error);
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
    studying: snapshot.studying,
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
        studying: snapshot.studying,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', uid);
  } catch {
    // 오프라인 등. 다음 세션을 마칠 때 다시 올라간다.
  }
}

export async function listMyGroups(): Promise<GroupInfo[]> {
  const { data, error } = await getClient().from('groups').select('id, name, invite_code').order('created_at');
  if (error) throw friendly(error);
  return (data ?? []).map((g) => ({ id: g.id, name: g.name, inviteCode: g.invite_code }));
}

export async function createGroup(name: string): Promise<GroupInfo> {
  const { data, error } = await getClient().rpc('create_group', { p_name: name.trim() });
  if (error) throw friendly(error);
  return { id: data.id, name: data.name, inviteCode: data.invite_code };
}

export async function joinGroup(code: string): Promise<GroupInfo> {
  const { data, error } = await getClient().rpc('join_group', { p_code: code.trim() });
  if (error) throw friendly(error);
  return { id: data.id, name: data.name, inviteCode: data.invite_code };
}

export async function leaveGroup(groupId: string): Promise<void> {
  const uid = await currentUserId();
  if (!uid) return;
  const { error } = await getClient().from('group_members').delete().eq('group_id', groupId).eq('user_id', uid);
  if (error) throw friendly(error);
}

export async function listGroupMembers(groupId: string): Promise<MemberStatus[]> {
  const client = getClient();
  const { data: members, error } = await client.from('group_members').select('user_id').eq('group_id', groupId);
  if (error) throw friendly(error);
  const ids = (members ?? []).map((m) => m.user_id);
  if (ids.length === 0) return [];
  const { data, error: statusError } = await client.from('learner_status').select('*').in('user_id', ids);
  if (statusError) throw friendly(statusError);
  return (data ?? []).map((r) => toStatus(r as StatusRow));
}
