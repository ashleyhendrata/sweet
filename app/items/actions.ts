"use server";

import { revalidatePath } from "next/cache";
import {
  archiveItem,
  createCategory,
  createItem,
  deleteItem,
  getCategories,
  getItemsGroupedByCategory,
  getTeamContext,
  unarchiveItem,
  updateCategory,
  updateItem,
} from "@/lib/db";

// Managing items/categories is admin-only (members count on the home screen).
// Cross-team isolation is enforced by RLS; this guards the within-team role.
async function isAdmin(): Promise<boolean> {
  const ctx = await getTeamContext();
  return ctx?.role === "admin";
}
const NOT_ADMIN = "Only team admins can change items.";

// After any change, refresh both the manage screen and the count screen (and
// the report reads live data, so no cache to bust there).
function revalidate() {
  revalidatePath("/items");
  revalidatePath("/");
}

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function num(formData: FormData, key: string): number {
  const n = Number(formData.get(key));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

// Critical level is optional. Blank (or anything below 1) means "no reorder
// threshold" — stored as null so the item is never flagged low.
function criticalLevel(formData: FormData): number | null {
  const raw = String(formData.get("critical_level") ?? "").trim();
  if (raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 1 ? n : null;
}

// Resolve the chosen unit. The dropdown offers an inline "+ New unit…" option
// (value `__new_unit__`); when picked, use the typed value instead.
function resolveUnit(formData: FormData): string {
  const selected = str(formData, "unit");
  if (selected === "__new_unit__") return str(formData, "new_unit") || "units";
  return selected || "units";
}

/**
 * Resolve the chosen category. The item form's dropdown includes an inline
 * "New category…" option (value `__new__`); when picked, we create the category
 * on the fly from the `new_category` text field and use its id.
 */
async function resolveCategoryId(formData: FormData): Promise<string> {
  const selected = str(formData, "category_id");
  if (selected !== "__new__") return selected;

  const name = str(formData, "new_category");
  if (!name) throw new Error("New category name is required.");
  const cats = await getCategories();
  const nextOrder = cats.reduce((m, c) => Math.max(m, c.sort_order), 0) + 1;
  const cat = await createCategory({ name, sort_order: nextOrder });
  return cat.id;
}

// Actions that take user input return a result so the form can show a friendly
// message instead of crashing (e.g. a duplicate category name).
export type ActionResult = { error?: string };

function friendlyError(e: unknown): string {
  const code = (e as { code?: string })?.code;
  if (code === "23505") return "That name is already taken.";
  return "Something went wrong. Please try again.";
}

// Is there already a (non-archived) item with this name in this category?
// Case-insensitive, compared in JS so names with % or _ aren't treated as
// wildcards. `excludeId` skips the item being edited.
async function nameTaken(
  categoryId: string,
  name: string,
  excludeId?: string,
): Promise<boolean> {
  const groups = await getItemsGroupedByCategory();
  const group = groups.find((g) => g.id === categoryId);
  if (!group) return false;
  const lower = name.toLowerCase();
  return group.items.some(
    (it) => it.id !== excludeId && it.name.toLowerCase() === lower,
  );
}

// --- Items -----------------------------------------------------------------

export async function addItem(formData: FormData): Promise<ActionResult> {
  if (!(await isAdmin())) return { error: NOT_ADMIN };
  const name = str(formData, "name");
  if (!name) return { error: "Enter an item name." };
  try {
    const category_id = await resolveCategoryId(formData);
    if (!category_id) return { error: "Choose a category." };
    if (await nameTaken(category_id, name)) {
      return { error: `“${name}” is already in this category.` };
    }
    await createItem({
      name,
      category_id,
      unit: resolveUnit(formData),
      critical_level: criticalLevel(formData),
      current_qty: num(formData, "current_qty"),
    });
    revalidate();
    return {};
  } catch (e) {
    return { error: friendlyError(e) };
  }
}

export async function editItem(formData: FormData): Promise<ActionResult> {
  if (!(await isAdmin())) return { error: NOT_ADMIN };
  const id = str(formData, "id");
  const name = str(formData, "name");
  if (!id || !name) return { error: "Enter an item name." };
  try {
    const category_id = await resolveCategoryId(formData);
    if (!category_id) return { error: "Choose a category." };
    if (await nameTaken(category_id, name, id)) {
      return { error: `“${name}” is already in this category.` };
    }
    await updateItem(id, {
      name,
      category_id,
      unit: resolveUnit(formData),
      critical_level: criticalLevel(formData),
      current_qty: num(formData, "current_qty"),
    });
    revalidate();
    return {};
  } catch (e) {
    return { error: friendlyError(e) };
  }
}

export async function archiveItemAction(id: string): Promise<void> {
  if (!(await isAdmin())) return;
  if (!id) return;
  await archiveItem(id);
  revalidate();
}

export async function restoreItemAction(id: string): Promise<void> {
  if (!(await isAdmin())) return;
  if (!id) return;
  await unarchiveItem(id);
  revalidate();
}

/** Permanently delete an item. Guarded by a confirm dialog in the UI. */
export async function deleteItemAction(id: string): Promise<void> {
  if (!(await isAdmin())) return;
  if (!id) return;
  await deleteItem(id);
  revalidate();
}

/**
 * Move an item one slot up or down within its category by swapping sort_order
 * with its neighbor. The order applies everywhere (count screen + report).
 */
export async function moveItem(
  id: string,
  direction: "up" | "down",
): Promise<void> {
  if (!(await isAdmin())) return;
  const groups = await getItemsGroupedByCategory();
  for (const g of groups) {
    const idx = g.items.findIndex((it) => it.id === id);
    if (idx === -1) continue;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= g.items.length) return;
    const a = g.items[idx];
    const b = g.items[swapIdx];
    await updateItem(a.id, { sort_order: b.sort_order });
    await updateItem(b.id, { sort_order: a.sort_order });
    revalidate();
    return;
  }
}

// --- Categories ------------------------------------------------------------

export async function addCategory(formData: FormData): Promise<ActionResult> {
  if (!(await isAdmin())) return { error: NOT_ADMIN };
  const name = str(formData, "name");
  if (!name) return { error: "Enter a category name." };
  try {
    const cats = await getCategories();
    const nextOrder = cats.reduce((m, c) => Math.max(m, c.sort_order), 0) + 1;
    await createCategory({ name, sort_order: nextOrder });
    revalidate();
    return {};
  } catch (e) {
    return { error: friendlyError(e) };
  }
}

export async function renameCategory(
  formData: FormData,
): Promise<ActionResult> {
  if (!(await isAdmin())) return { error: NOT_ADMIN };
  const id = str(formData, "id");
  const name = str(formData, "name");
  if (!id || !name) return { error: "Enter a category name." };
  try {
    await updateCategory(id, { name });
    revalidate();
    return {};
  } catch (e) {
    return { error: friendlyError(e) };
  }
}

/**
 * Move a category one slot up or down by swapping sort_order with its neighbor.
 * Only in-use (non-empty) categories are reordered, matching what's shown in the
 * manage screen, so an empty category between two visible ones is skipped over.
 */
export async function moveCategory(
  id: string,
  direction: "up" | "down",
): Promise<void> {
  if (!(await isAdmin())) return;
  const groups = await getItemsGroupedByCategory(); // ordered by sort_order
  const cats = groups.filter((g) => g.items.length > 0);
  const idx = cats.findIndex((c) => c.id === id);
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || swapIdx < 0 || swapIdx >= cats.length) return;

  const a = cats[idx];
  const b = cats[swapIdx];
  await updateCategory(a.id, { sort_order: b.sort_order });
  await updateCategory(b.id, { sort_order: a.sort_order });
  revalidate();
}
