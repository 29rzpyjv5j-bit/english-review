-- 영어 복습 앱: 초대 코드 그룹과 학습 현황 공유.
-- Supabase 대시보드 → SQL Editor 에 통째로 붙여넣고 Run. 여러 번 실행해도 안전하다.
-- 학습 자료와 진도는 여전히 각자의 폰에만 있다. 여기에는 친구에게 보여줄 현황만 올라온다.

create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 30),
  invite_code text not null unique,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table if not exists public.learner_status (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 20),
  streak_count int not null default 0 check (streak_count >= 0),
  last_study_date date,
  updated_at timestamptz not null default now()
);

-- 초대 코드는 하루만 쓴다. 만든 사람이 새 코드를 발급할 수 있다.
alter table public.groups
  add column if not exists invite_expires_at timestamptz not null default now() + interval '1 day';

-- 코드를 맞혀 들어와도 바로 보이지 않는다. 만든 사람이 수락해야 합류된다.
alter table public.group_members
  add column if not exists status text not null default 'approved';
alter table public.group_members drop constraint if exists group_members_status_check;
alter table public.group_members
  add constraint group_members_status_check check (status in ('pending', 'approved'));

-- 무엇을 공부하는지(자료 이름)는 올리지 않는다.
alter table public.learner_status drop column if exists studying;

alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.learner_status enable row level security;

-- 권한 규칙 안에서 group_members 를 다시 조회하면 규칙이 자기 자신을 부르게 되므로,
-- 소속 확인은 규칙을 거치지 않는 함수로 한다.
create or replace function public.is_group_member(gid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from group_members
    where group_id = gid and user_id = auth.uid() and status = 'approved'
  );
$$;

-- 수락 대기 중인 사람도 그룹 이름 정도는 봐야 기다릴 수 있다.
create or replace function public.in_group_any(gid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from group_members where group_id = gid and user_id = auth.uid());
$$;

create or replace function public.owns_group(gid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from groups where id = gid and created_by = auth.uid());
$$;

-- 합류한 사람은 대기 중인 사람의 닉네임까지 볼 수 있다(수락 여부를 판단해야 하므로).
-- 반대로 대기 중인 사람에게는 아무도 보이지 않는다.
create or replace function public.shares_group(other uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from group_members me
    join group_members them on them.group_id = me.group_id
    where me.user_id = auth.uid() and me.status = 'approved' and them.user_id = other
  );
$$;

drop policy if exists "groups: members read" on public.groups;
create policy "groups: members read" on public.groups
  for select using (public.in_group_any(id));

drop policy if exists "members: same group read" on public.group_members;
create policy "members: same group read" on public.group_members
  for select using (public.is_group_member(group_id) or user_id = auth.uid());

drop policy if exists "members: leave own" on public.group_members;
create policy "members: leave own" on public.group_members
  for delete using (user_id = auth.uid() or public.owns_group(group_id));

drop policy if exists "status: self or groupmates read" on public.learner_status;
create policy "status: self or groupmates read" on public.learner_status
  for select using (user_id = auth.uid() or public.shares_group(user_id));

drop policy if exists "status: write own" on public.learner_status;
create policy "status: write own" on public.learner_status
  for insert with check (user_id = auth.uid());

drop policy if exists "status: update own" on public.learner_status;
create policy "status: update own" on public.learner_status
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.new_invite_code()
returns text language plpgsql set search_path = public as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- 헷갈리는 0/O, 1/I 제외
  code text;
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from groups where invite_code = code);
  end loop;
  return code;
end;
$$;

-- 그룹 만들기와 참여는 함수로만 한다. 아직 멤버가 아닌 사람은 그룹을 조회할 수 없어서
-- 초대 코드로 그룹을 찾는 일을 클라이언트가 직접 할 수 없다.
create or replace function public.create_group(p_name text)
returns public.groups language plpgsql security definer set search_path = public as $$
declare
  g groups;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  insert into groups (name, invite_code, created_by, invite_expires_at)
    values (trim(p_name), new_invite_code(), auth.uid(), now() + interval '1 day')
    returning * into g;
  insert into group_members (group_id, user_id, status) values (g.id, auth.uid(), 'approved');
  return g;
end;
$$;

create or replace function public.join_group(p_code text)
returns public.groups language plpgsql security definer set search_path = public as $$
declare
  g groups;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  select * into g from groups where invite_code = upper(trim(p_code));
  if not found then raise exception 'invite code not found'; end if;
  if g.invite_expires_at <= now() then raise exception 'invite code expired'; end if;
  insert into group_members (group_id, user_id, status) values (g.id, auth.uid(), 'pending')
    on conflict do nothing;
  return g;
end;
$$;

create or replace function public.approve_member(p_group uuid, p_user uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not owns_group(p_group) then raise exception 'only the group owner can approve'; end if;
  update group_members set status = 'approved' where group_id = p_group and user_id = p_user;
end;
$$;

create or replace function public.refresh_invite(p_group uuid)
returns public.groups language plpgsql security definer set search_path = public as $$
declare
  g groups;
begin
  if not owns_group(p_group) then raise exception 'only the group owner can make a new code'; end if;
  update groups set invite_code = new_invite_code(), invite_expires_at = now() + interval '1 day'
    where id = p_group returning * into g;
  return g;
end;
$$;

revoke all on function public.create_group(text) from public, anon;
revoke all on function public.join_group(text) from public, anon;
revoke all on function public.approve_member(uuid, uuid) from public, anon;
revoke all on function public.refresh_invite(uuid) from public, anon;
grant execute on function public.create_group(text) to authenticated;
grant execute on function public.join_group(text) to authenticated;
grant execute on function public.approve_member(uuid, uuid) to authenticated;
grant execute on function public.refresh_invite(uuid) to authenticated;
