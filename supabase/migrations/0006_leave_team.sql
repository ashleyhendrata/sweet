-- Let a user leave their current team (so they can join/create a different
-- one from /welcome instead of being stuck on one team forever).
-- Run in the Supabase SQL Editor AFTER 0001–0005. Idempotent — safe to re-run.

-- Blocked if the caller is their team's only admin, so a store can never be
-- left with no one able to manage items/people.
create or replace function public.leave_team()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  m public.memberships;
  admin_count int;
begin
  select * into m from public.memberships where user_id = auth.uid();
  if not found then
    raise exception 'NOT_MEMBER';
  end if;

  if m.role = 'admin' then
    select count(*) into admin_count
    from public.memberships
    where team_id = m.team_id and role = 'admin';
    if admin_count <= 1 then
      raise exception 'LAST_ADMIN';
    end if;
  end if;

  delete from public.memberships where user_id = auth.uid();
end;
$$;

revoke execute on function public.leave_team() from public, anon;
grant execute on function public.leave_team() to authenticated;
