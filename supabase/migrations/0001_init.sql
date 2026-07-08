-- Sweetwaters Inventory — initial schema
-- Run this in the Supabase SQL Editor (or via the Supabase CLI) once, before seeding.

-- ---------------------------------------------------------------------------
-- Categories: a small lookup table so employees pick from a dropdown.
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Items: anything we track. "low" == current_qty <= critical_level.
-- Archive (soft-delete) instead of deleting to keep history sane.
-- ---------------------------------------------------------------------------
create table if not exists public.items (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  category_id    uuid not null references public.categories (id) on delete restrict,
  unit           text not null default 'units',
  -- null = no reorder threshold (item is never flagged low); >= 1 when set.
  critical_level numeric check (critical_level is null or critical_level >= 1),
  current_qty    numeric not null default 0 check (current_qty >= 0),
  archived       boolean not null default false,
  -- manual position within a category (lower = higher up)
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists items_category_id_idx on public.items (category_id);
create index if not exists items_archived_idx on public.items (archived);
create index if not exists items_category_sort_idx
  on public.items (category_id, sort_order);

-- ---------------------------------------------------------------------------
-- Keep updated_at fresh automatically on every row change.
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists items_set_updated_at on public.items;
create trigger items_set_updated_at
  before update on public.items
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security: only signed-in staff (the shared login) can read/write.
-- The anon (logged-out) role gets nothing.
-- ---------------------------------------------------------------------------
alter table public.categories enable row level security;
alter table public.items enable row level security;

drop policy if exists "staff full access categories" on public.categories;
create policy "staff full access categories"
  on public.categories
  for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "staff full access items" on public.items;
create policy "staff full access items"
  on public.items
  for all
  to authenticated
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- Table-level privileges. RLS gates *which rows* a role can touch; GRANTs gate
-- *whether the role may run the command at all*. Both must pass, so the
-- signed-in staff (authenticated) role needs explicit write privileges here —
-- otherwise writes fail with Postgres 42501 even though the RLS policy allows
-- them. anon (logged out) is intentionally granted nothing.
-- ---------------------------------------------------------------------------
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.items to authenticated;

-- Any future tables created in this schema inherit the same staff privileges.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
