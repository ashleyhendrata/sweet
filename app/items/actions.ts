"use server";

import { revalidatePath } from "next/cache";
import {
  archiveItem,
  createCategory,
  createItem,
  deleteItem,
  getCategories,
  unarchiveItem,
  updateCategory,
  updateItem,
} from "@/lib/db";

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

// --- Items -----------------------------------------------------------------

export async function addItem(formData: FormData): Promise<ActionResult> {
  const name = str(formData, "name");
  if (!name) return { error: "Enter an item name." };
  try {
    const category_id = await resolveCategoryId(formData);
    if (!category_id) return { error: "Choose a category." };
    await createItem({
      name,
      category_id,
      unit: str(formData, "unit") || "units",
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
  const id = str(formData, "id");
  const name = str(formData, "name");
  if (!id || !name) return { error: "Enter an item name." };
  try {
    const category_id = await resolveCategoryId(formData);
    if (!category_id) return { error: "Choose a category." };
    await updateItem(id, {
      name,
      category_id,
      unit: str(formData, "unit") || "units",
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
  if (!id) return;
  await archiveItem(id);
  revalidate();
}

export async function restoreItemAction(id: string): Promise<void> {
  if (!id) return;
  await unarchiveItem(id);
  revalidate();
}

/** Permanently delete an item. Guarded by a confirm dialog in the UI. */
export async function deleteItemAction(id: string): Promise<void> {
  if (!id) return;
  await deleteItem(id);
  revalidate();
}

// --- Categories ------------------------------------------------------------

export async function addCategory(formData: FormData): Promise<ActionResult> {
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

/** Move a category one slot up or down by swapping sort_order with its neighbor. */
export async function moveCategory(
  id: string,
  direction: "up" | "down",
): Promise<void> {
  const cats = await getCategories(); // already ordered by sort_order
  const idx = cats.findIndex((c) => c.id === id);
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || swapIdx < 0 || swapIdx >= cats.length) return;

  const a = cats[idx];
  const b = cats[swapIdx];
  await updateCategory(a.id, { sort_order: b.sort_order });
  await updateCategory(b.id, { sort_order: a.sort_order });
  revalidate();
}
