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
  studying text check (char_length(studying) <= 60),
  updated_at timestamptz not null default now()
);

alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.learner_status enable row level security;

-- 권한 규칙 안에서 group_members 를 다시 조회하면 규칙이 자기 자신을 부르게 되므로,
-- 소속 확인은 규칙을 거치지 않는 함수로 한다.
create or replace function public.is_group_member(gid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from group_members where group_id = gid and user_id = auth.uid());
$$;

create or replace function public.shares_group(other uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from group_members me
    join group_members them on them.group_id = me.group_id
    where me.user_id = auth.uid() and them.user_id = other
  );
$$;

drop policy if exists "groups: members read" on public.groups;
create policy "groups: members read" on public.groups
  for select using (public.is_group_member(id));

drop policy if exists "members: same group read" on public.group_members;
create policy "members: same group read" on public.group_members
  for select using (public.is_group_member(group_id));

drop policy if exists "members: leave own" on public.group_members;
create policy "members: leave own" on public.group_members
  for delete using (user_id = auth.uid());

drop policy if exists "status: self or groupmates read" on public.learner_status;
create policy "status: self or groupmates read" on public.learner_status
  for select using (user_id = auth.uid() or public.shares_group(user_id));

drop policy if exists "status: write own" on public.learner_status;
create policy "status: write own" on public.learner_status
  for insert with check (user_id = auth.uid());

drop policy if exists "status: update own" on public.learner_status;
create policy "status: update own" on public.learner_status
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 그룹 만들기와 참여는 함수로만 한다. 아직 멤버가 아닌 사람은 그룹을 조회할 수 없어서
-- 초대 코드로 그룹을 찾는 일을 클라이언트가 직접 할 수 없다.
create or replace function public.create_group(p_name text)
returns public.groups language plpgsql security definer set search_path = public as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- 헷갈리는 0/O, 1/I 제외
  code text;
  g groups;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from groups where invite_code = code);
  end loop;
  insert into groups (name, invite_code, created_by)
    values (trim(p_name), code, auth.uid()) returning * into g;
  insert into group_members (group_id, user_id) values (g.id, auth.uid());
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
  insert into group_members (group_id, user_id) values (g.id, auth.uid())
    on conflict do nothing;
  return g;
end;
$$;

revoke all on function public.create_group(text) from public, anon;
revoke all on function public.join_group(text) from public, anon;
grant execute on function public.create_group(text) to authenticated;
grant execute on function public.join_group(text) to authenticated;
