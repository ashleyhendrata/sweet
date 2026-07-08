import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isLow } from "@/lib/types";
import type {
  Category,
  CategoryWithItems,
  Item,
  ItemWithCategory,
} from "@/lib/types";

/**
 * The single data-access layer for the app. Every Supabase read/write lives
 * here — components and server actions call these functions and never issue raw
 * queries themselves. Row Level Security enforces that only signed-in staff can
 * read or write, so these functions assume an authenticated request.
 */

// Columns selected for an item joined to its category name.
const ITEM_WITH_CATEGORY = "*, categories!inner(name)";

// Supabase returns the joined category as a nested object; flatten it.
type ItemRow = Item & { categories: { name: string } | null };

function flatten(row: ItemRow): ItemWithCategory {
  const { categories, ...item } = row;
  return { ...item, category_name: categories?.name ?? "" };
}

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

/** The currently signed-in user, or null. */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function createCategory(input: {
  name: string;
  sort_order?: number;
}): Promise<Category> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .insert({ name: input.name, sort_order: input.sort_order ?? 0 })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateCategory(
  id: string,
  patch: Partial<Pick<Category, "name" | "sort_order">>,
): Promise<Category> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// Items — reads
// ---------------------------------------------------------------------------

/** All non-archived items with their category name, ordered for display. */
export async function getItems(): Promise<ItemWithCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("items")
    .select(ITEM_WITH_CATEGORY)
    .eq("archived", false)
    .order("name", { ascending: true })
    .returns<ItemRow[]>();
  if (error) throw error;
  return (data ?? []).map(flatten);
}

/** Archived (soft-deleted) items with their category name, for the manage screen. */
export async function getArchivedItems(): Promise<ItemWithCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("items")
    .select(ITEM_WITH_CATEGORY)
    .eq("archived", true)
    .order("name", { ascending: true })
    .returns<ItemRow[]>();
  if (error) throw error;
  return (data ?? []).map(flatten);
}

/** Non-archived items that have a critical level and are at or below it. */
export async function getLowItems(): Promise<ItemWithCategory[]> {
  const items = await getItems();
  return items.filter(isLow);
}

/** Non-archived items grouped under their category, in display order. */
export async function getItemsGroupedByCategory(): Promise<CategoryWithItems[]> {
  const [categories, items] = await Promise.all([getCategories(), getItems()]);
  const byCategory = new Map<string, Item[]>();
  for (const item of items) {
    const list = byCategory.get(item.category_id) ?? [];
    // Strip the joined category_name back off for the plain Item shape.
    const { category_name, ...plain } = item;
    void category_name;
    list.push(plain);
    byCategory.set(item.category_id, list);
  }
  return categories.map((c) => ({ ...c, items: byCategory.get(c.id) ?? [] }));
}

/** Everything the print report needs, in one call. */
export async function getReportData(): Promise<{
  lowItems: ItemWithCategory[];
  groups: CategoryWithItems[];
}> {
  const [groups, lowItems] = await Promise.all([
    getItemsGroupedByCategory(),
    getLowItems(),
  ]);
  return { lowItems, groups };
}

// ---------------------------------------------------------------------------
// Items — writes
// ---------------------------------------------------------------------------

export async function createItem(input: {
  name: string;
  category_id: string;
  unit: string;
  critical_level: number | null;
  current_qty?: number;
}): Promise<Item> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("items")
    .insert({
      name: input.name,
      category_id: input.category_id,
      unit: input.unit,
      critical_level: input.critical_level,
      current_qty: input.current_qty ?? 0,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateItem(
  id: string,
  patch: Partial<
    Pick<Item, "name" | "category_id" | "unit" | "critical_level" | "current_qty">
  >,
): Promise<Item> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("items")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

/** Set an exact on-hand quantity (never negative). Used by the count screen. */
export async function setItemQty(id: string, qty: number): Promise<Item> {
  return updateItem(id, { current_qty: Math.max(0, qty) });
}

/** Archive (soft-delete) an item so history stays sane. */
export async function archiveItem(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("items")
    .update({ archived: true })
    .eq("id", id);
  if (error) throw error;
}

/** Restore a previously archived item. */
export async function unarchiveItem(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("items")
    .update({ archived: false })
    .eq("id", id);
  if (error) throw error;
}

/**
 * Permanently delete an item. Unlike archiving, this cannot be undone. Prefer
 * archiveItem for everyday removal; this is for genuinely unwanted items.
 */
export async function deleteItem(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("items").delete().eq("id", id);
  if (error) throw error;
}
