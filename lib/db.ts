import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isLow } from "@/lib/types";
import type {
  Category,
  CategoryWithItems,
  Item,
  ItemWithCategory,
  Role,
  TeamContext,
  TeamMember,
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
// Teams & membership
// ---------------------------------------------------------------------------

/**
 * The signed-in user's team context (team + role), or null if they're signed
 * in but haven't joined/created a franchise yet. Pages use this to gate:
 * no user -> proxy sends to /login; no membership -> redirect to /welcome.
 */
export async function getTeamContext(): Promise<TeamContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("memberships")
    .select("role, team_id, teams(name, join_code)")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const team = data.teams as unknown as { name: string; join_code: string };
  return {
    userId: user.id,
    email: user.email ?? "",
    teamId: data.team_id,
    teamName: team?.name ?? "",
    joinCode: team?.join_code ?? "",
    role: data.role as Role,
  };
}

/** The signed-in user's team id; throws if they haven't joined a team. */
async function currentTeamId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No team membership.");

  // Must filter by user_id explicitly: RLS on memberships lets a member see
  // every row for their team (the member list), not just their own, so an
  // unfiltered query here returns one row per teammate and .maybeSingle()
  // throws once a team has more than one person.
  const { data, error } = await supabase
    .from("memberships")
    .select("team_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("No team membership.");
  return data.team_id;
}

/** Create a franchise and become its admin. Returns the join code to share. */
export async function createTeam(
  name: string,
): Promise<{ teamId: string; name: string; joinCode: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_team_with_admin", {
    team_name: name,
  });
  if (error) throw error;
  return {
    teamId: data.team_id,
    name: data.name,
    joinCode: data.join_code,
  };
}

/** Join an existing franchise with its code (auto-join as a counter). */
export async function joinTeam(
  code: string,
): Promise<{ teamId: string; name: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("join_team_with_code", { code });
  if (error) throw error;
  return { teamId: data.team_id, name: data.name };
}

/** Rotate the team's join code (admin only, enforced in the database). */
export async function regenerateJoinCode(): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("regenerate_join_code");
  if (error) throw error;
  return data as string;
}

/** Rename the signed-in user's team (RLS restricts this to team admins). */
export async function renameTeam(name: string): Promise<void> {
  const supabase = await createClient();
  const teamId = await currentTeamId();
  const { error } = await supabase
    .from("teams")
    .update({ name })
    .eq("id", teamId);
  if (error) throw error;
}

/** Everyone on the signed-in user's team (RLS scopes to the team). */
export async function getTeamMembers(): Promise<TeamMember[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memberships")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** Change a teammate's role (RLS restricts this to team admins). */
export async function setMemberRole(userId: string, role: Role): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("memberships")
    .update({ role })
    .eq("user_id", userId);
  if (error) throw error;
}

/** Remove a teammate (RLS restricts this to team admins). */
export async function removeMember(userId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("memberships")
    .delete()
    .eq("user_id", userId);
  if (error) throw error;
}

/** Leave the signed-in user's team (blocked if they're the team's only admin). */
export async function leaveTeam(): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("leave_team");
  if (error) throw error;
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
  const team_id = await currentTeamId();
  const { data, error } = await supabase
    .from("categories")
    .insert({ name: input.name, sort_order: input.sort_order ?? 0, team_id })
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

/**
 * All non-archived items with their category name. Ordered by each item's
 * manual sort_order within its category (name as a tiebreak), so the order set
 * on the Manage screen carries through to the count screen and report.
 */
export async function getItems(): Promise<ItemWithCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("items")
    .select(ITEM_WITH_CATEGORY)
    .eq("archived", false)
    .order("sort_order", { ascending: true })
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
  const team_id = await currentTeamId();
  // Append new items to the end of their category's manual order.
  const { data: last } = await supabase
    .from("items")
    .select("sort_order")
    .eq("category_id", input.category_id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sort_order = (last?.sort_order ?? 0) + 1;

  const { data, error } = await supabase
    .from("items")
    .insert({
      name: input.name,
      category_id: input.category_id,
      unit: input.unit,
      critical_level: input.critical_level,
      current_qty: input.current_qty ?? 0,
      sort_order,
      team_id,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateItem(
  id: string,
  patch: Partial<
    Pick<
      Item,
      | "name"
      | "category_id"
      | "unit"
      | "critical_level"
      | "current_qty"
      | "sort_order"
    >
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
