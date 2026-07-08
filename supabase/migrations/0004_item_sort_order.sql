-- Manual ordering of items within a category (up/down arrows on Manage).
-- Adds a per-item sort_order; the order set in Manage is used everywhere
-- (count screen + report), so items can match your physical shelf order.
--
-- Run this in the Supabase SQL Editor. Idempotent — safe to re-run.

alter table public.items add column if not exists sort_order integer not null default 0;

-- Backfill: seed each category's order from the current alphabetical order.
with ordered as (
  select id, row_number() over (partition by category_id order by name) as rn
  from public.items
)
update public.items i
  set sort_order = o.rn
  from ordered o
  where o.id = i.id;

create index if not exists items_category_sort_idx
  on public.items (category_id, sort_order);
