-- Make critical_level optional and disallow 0.
--   * null  = no reorder threshold; the item is never flagged low or counted.
--   * >= 1  = reorder when on-hand quantity falls to/below it.
-- A critical level of 0 is meaningless, so existing 0s become null.
--
-- Run this in the Supabase SQL Editor. Idempotent — safe to re-run.

alter table public.items alter column critical_level drop not null;
alter table public.items alter column critical_level drop default;

-- Any existing "0" thresholds no longer make sense — treat as "no threshold".
update public.items set critical_level = null where critical_level = 0;

-- Enforce: unset (null) or at least 1. (Adds alongside the original >= 0 check;
-- both hold, so 0 is now rejected while null and >= 1 pass.)
alter table public.items
  drop constraint if exists items_critical_level_min_check;
alter table public.items
  add constraint items_critical_level_min_check
  check (critical_level is null or critical_level >= 1);
