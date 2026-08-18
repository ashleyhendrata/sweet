// Shared domain types for the Sweetwaters inventory app.
// These mirror the Postgres schema in supabase/migrations.

// A team = one franchise/location. Staff join it with the team's join code.
export type Team = {
  id: string;
  name: string;
  join_code: string;
  created_at: string;
};

// admins manage items & people; members count.
export type Role = "admin" | "member";

export type TeamMember = {
  user_id: string;
  team_id: string;
  role: Role;
  email: string;
  created_at: string;
};

// The signed-in user's team context, loaded once per request.
export type TeamContext = {
  userId: string;
  email: string;
  teamId: string;
  teamName: string;
  joinCode: string;
  role: Role;
};

export type Category = {
  id: string;
  name: string;
  sort_order: number;
  team_id: string;
  created_at: string;
};

export type Item = {
  id: string;
  name: string;
  category_id: string;
  unit: string;
  // null = no reorder threshold set; the item is never flagged low. Must be >= 1
  // when set (a critical level of 0 is meaningless).
  critical_level: number | null;
  current_qty: number;
  archived: boolean;
  // manual position within its category (lower = higher up)
  sort_order: number;
  team_id: string;
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

// An item is "low" (needs reordering) when it has a critical level set and its
// on-hand quantity is at or below it. Items with no critical level (null) are
// never low. Kept as a single helper so the rule lives in exactly one place.
export function isLow(
  item: Pick<Item, "current_qty" | "critical_level">,
): boolean {
  return item.critical_level != null && item.current_qty <= item.critical_level;
}

// Singularizes the last plural-looking word of a unit ("boxes" -> "box",
// "cases of 500" -> "case of 500", "32oz bottles" -> "32oz bottle") when qty
// is exactly 1. Units are free-typed, so this is a heuristic, not a dictionary.
function singularizeWord(word: string): string {
  if (/(ches|shes|xes)$/i.test(word)) return word.slice(0, -2);
  if (/[^aeiou]ies$/i.test(word)) return word.slice(0, -3) + "y";
  if (/s$/i.test(word) && !/ss$/i.test(word)) return word.slice(0, -1);
  return word;
}

export function formatUnit(qty: number, unit: string): string {
  if (qty !== 1) return unit;
  const ofIndex = unit.indexOf(" of ");
  if (ofIndex !== -1) {
    return singularizeWord(unit.slice(0, ofIndex)) + unit.slice(ofIndex);
  }
  const lastSpace = unit.lastIndexOf(" ");
  if (lastSpace === -1) return singularizeWord(unit);
  return unit.slice(0, lastSpace + 1) + singularizeWord(unit.slice(lastSpace + 1));
}
