-- Fix: signed-in staff got Postgres 42501 (permission denied) when saving a
-- quantity. Cause: the `authenticated` role had SELECT (reads worked) but no
-- INSERT/UPDATE/DELETE on the tables — table-level GRANTs were missing, so the
-- write was denied before RLS was ever evaluated.
--
-- Run this in the Supabase SQL Editor. Idempotent — safe to re-run.

-- Make sure RLS is on and the full-access staff policies exist.
alter table public.categories enable row level security;
alter table public.items enable row level security;

drop policy if exists "staff full access categories" on public.categories;
create policy "staff full access categories"
  on public.categories for all to authenticated
  using (true) with check (true);

drop policy if exists "staff full access items" on public.items;
create policy "staff full access items"
  on public.items for all to authenticated
  using (true) with check (true);

-- The actual fix: grant the write privileges the authenticated role was missing.
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.items to authenticated;

-- Future tables in this schema inherit the same staff privileges.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
