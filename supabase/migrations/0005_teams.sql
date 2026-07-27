-- Multi-franchise support: teams, memberships, and per-team data isolation.
--
--   * A team = one franchise/location. Each team has a shareable join code.
--   * Every user belongs to exactly one team (memberships, PK on user_id)
--     with a role: 'admin' (manage items/people) or 'member' (count).
--   * items/categories get a team_id; RLS is rewritten so a team can only
--     ever see and touch its own data.
--   * Existing data + existing users are migrated into a "The Grove" team.
--
-- Run in the Supabase SQL Editor AFTER 0001–0004. Idempotent — safe to re-run.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.teams (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  join_code   text not null unique,
  created_at  timestamptz not null default now()
);

create table if not exists public.memberships (
  -- PK on user_id = a user belongs to exactly one team (multi-team is deferred).
  user_id     uuid primary key references auth.users (id) on delete cascade,
  team_id     uuid not null references public.teams (id) on delete cascade,
  role        text not null default 'member' check (role in ('admin', 'member')),
  email       text not null default '',   -- denormalized for the member list
  created_at  timestamptz not null default now()
);
create index if not exists memberships_team_id_idx on public.memberships (team_id);

alter table public.categories add column if not exists team_id uuid references public.teams (id);
alter table public.items add column if not exists team_id uuid references public.teams (id);

-- Category names were globally unique; they must now be unique per team.
alter table public.categories drop constraint if exists categories_name_key;
alter table public.categories drop constraint if exists categories_team_name_key;
alter table public.categories add constraint categories_team_name_key unique (team_id, name);

create index if not exists categories_team_id_idx on public.categories (team_id);
create index if not exists items_team_id_idx on public.items (team_id);

-- ---------------------------------------------------------------------------
-- Helper functions (used by RLS policies and the join/create flows)
-- ---------------------------------------------------------------------------

-- Readable 6-char code; skips lookalike characters (I, L, O, 0, 1).
create or replace function public.generate_join_code()
returns text
language plpgsql
volatile
as $$
declare
  chars text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  code  text;
  i     int;
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    end loop;
    exit when not exists (select 1 from public.teams where join_code = code);
  end loop;
  return code;
end;
$$;

-- The calling user's team (null if they haven't joined one yet).
create or replace function public.user_team_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select team_id from public.memberships where user_id = auth.uid();
$$;

-- Is the calling user an admin of their team?
create or replace function public.user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.memberships
    where user_id = auth.uid() and role = 'admin'
  );
$$;

-- Create a franchise and become its admin. Returns the team incl. join code.
create or replace function public.create_team_with_admin(team_name text)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_team public.teams;
begin
  if auth.uid() is null then
    raise exception 'NOT_SIGNED_IN';
  end if;
  if exists (select 1 from public.memberships where user_id = auth.uid()) then
    raise exception 'ALREADY_MEMBER';
  end if;
  if coalesce(trim(team_name), '') = '' then
    raise exception 'NAME_REQUIRED';
  end if;

  insert into public.teams (name, join_code)
  values (trim(team_name), public.generate_join_code())
  returning * into new_team;

  insert into public.memberships (user_id, team_id, role, email)
  values (auth.uid(), new_team.id, 'admin', coalesce(auth.jwt() ->> 'email', ''));

  return json_build_object(
    'team_id', new_team.id, 'name', new_team.name, 'join_code', new_team.join_code
  );
end;
$$;

-- Join an existing franchise with its code (auto-join as a counter).
create or replace function public.join_team_with_code(code text)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  t public.teams;
begin
  if auth.uid() is null then
    raise exception 'NOT_SIGNED_IN';
  end if;
  if exists (select 1 from public.memberships where user_id = auth.uid()) then
    raise exception 'ALREADY_MEMBER';
  end if;

  select * into t from public.teams where join_code = upper(trim(code));
  if not found then
    raise exception 'BAD_CODE';
  end if;

  insert into public.memberships (user_id, team_id, role, email)
  values (auth.uid(), t.id, 'member', coalesce(auth.jwt() ->> 'email', ''));

  return json_build_object('team_id', t.id, 'name', t.name);
end;
$$;

-- Admins can rotate their team's join code (e.g. if it leaks).
create or replace function public.regenerate_join_code()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  m public.memberships;
  new_code text;
begin
  select * into m from public.memberships where user_id = auth.uid();
  if not found or m.role <> 'admin' then
    raise exception 'NOT_ADMIN';
  end if;
  new_code := public.generate_join_code();
  update public.teams set join_code = new_code where id = m.team_id;
  return new_code;
end;
$$;

-- ---------------------------------------------------------------------------
-- Backfill existing data into a first team, keeping the current login working.
-- ---------------------------------------------------------------------------
do $$
declare
  grove uuid;
begin
  if not exists (select 1 from public.teams) then
    insert into public.teams (name, join_code)
    values ('Sweetwaters — The Grove', public.generate_join_code())
    returning id into grove;

    update public.categories set team_id = grove where team_id is null;
    update public.items set team_id = grove where team_id is null;

    -- Existing users (the shared staff login) become admins of The Grove.
    insert into public.memberships (user_id, team_id, role, email)
    select u.id, grove, 'admin', coalesce(u.email, '')
    from auth.users u
    on conflict (user_id) do nothing;
  end if;
end $$;

alter table public.categories alter column team_id set not null;
alter table public.items alter column team_id set not null;

-- ---------------------------------------------------------------------------
-- Row Level Security: a team only ever sees its own rows.
-- ---------------------------------------------------------------------------
alter table public.teams enable row level security;
alter table public.memberships enable row level security;

drop policy if exists "members see their team" on public.teams;
create policy "members see their team"
  on public.teams for select to authenticated
  using (id = public.user_team_id());

drop policy if exists "admins update their team" on public.teams;
create policy "admins update their team"
  on public.teams for update to authenticated
  using (public.user_is_admin() and id = public.user_team_id())
  with check (id = public.user_team_id());
-- (teams insert/delete happen only via the security-definer functions)

drop policy if exists "members see their teammates" on public.memberships;
create policy "members see their teammates"
  on public.memberships for select to authenticated
  using (team_id = public.user_team_id());

drop policy if exists "admins manage memberships" on public.memberships;
create policy "admins manage memberships"
  on public.memberships for update to authenticated
  using (public.user_is_admin() and team_id = public.user_team_id())
  with check (team_id = public.user_team_id());

drop policy if exists "admins remove memberships" on public.memberships;
create policy "admins remove memberships"
  on public.memberships for delete to authenticated
  using (public.user_is_admin() and team_id = public.user_team_id());
-- (membership inserts happen only via the security-definer functions)

-- Replace the old "any signed-in user sees everything" policies with
-- team-scoped ones. This is the cross-franchise isolation boundary.
drop policy if exists "staff full access categories" on public.categories;
drop policy if exists "team scoped categories" on public.categories;
create policy "team scoped categories"
  on public.categories for all to authenticated
  using (team_id = public.user_team_id())
  with check (team_id = public.user_team_id());

drop policy if exists "staff full access items" on public.items;
drop policy if exists "team scoped items" on public.items;
create policy "team scoped items"
  on public.items for all to authenticated
  using (team_id = public.user_team_id())
  with check (team_id = public.user_team_id());

-- ---------------------------------------------------------------------------
-- Privileges
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on public.teams to authenticated;
grant select, insert, update, delete on public.memberships to authenticated;
revoke all on public.teams from anon;
revoke all on public.memberships from anon;

revoke execute on function public.create_team_with_admin(text) from public, anon;
revoke execute on function public.join_team_with_code(text) from public, anon;
revoke execute on function public.regenerate_join_code() from public, anon;
grant execute on function public.create_team_with_admin(text) to authenticated;
grant execute on function public.join_team_with_code(text) to authenticated;
grant execute on function public.regenerate_join_code() to authenticated;
grant execute on function public.user_team_id() to authenticated;
grant execute on function public.user_is_admin() to authenticated;
