// Shared domain types for the Sweetwaters inventory app.
// These mirror the Postgres schema in supabase/migrations.

export type Category = {
  id: string;
  name: string;
  sort_order: number;
  created_at: string;
};

export type Item = {
  id: string;
  name: string;
  category_id: string;
  unit: string;
  critical_level: number;
  current_qty: number;
  archived: boolean;
  created_at: string;
  updated_at: string;
};

// An item joined with its category name, as returned by the report/count queries.
export type ItemWithCategory = Item & {
  category_name: string;
};

// A category plus its (non-archived) items, for the grouped count screen and report.
export type CategoryWithItems = Category & {
  items: Item[];
};

// An item is "low" (needs reordering) when on-hand quantity is at or below its
// critical level. Kept as a single helper so the rule lives in exactly one place.
export function isLow(item: Pick<Item, "current_qty" | "critical_level">): boolean {
  return item.current_qty <= item.critical_level;
}
