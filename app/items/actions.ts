"use server";

import { revalidatePath } from "next/cache";
import {
  archiveItem,
  createCategory,
  createItem,
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

// --- Items -----------------------------------------------------------------

export async function addItem(formData: FormData): Promise<void> {
  const name = str(formData, "name");
  if (!name) return;
  const category_id = await resolveCategoryId(formData);
  if (!category_id) return;

  await createItem({
    name,
    category_id,
    unit: str(formData, "unit") || "units",
    critical_level: num(formData, "critical_level"),
    current_qty: num(formData, "current_qty"),
  });
  revalidate();
}

export async function editItem(formData: FormData): Promise<void> {
  const id = str(formData, "id");
  const name = str(formData, "name");
  if (!id || !name) return;
  const category_id = await resolveCategoryId(formData);
  if (!category_id) return;

  await updateItem(id, {
    name,
    category_id,
    unit: str(formData, "unit") || "units",
    critical_level: num(formData, "critical_level"),
    current_qty: num(formData, "current_qty"),
  });
  revalidate();
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

// --- Categories ------------------------------------------------------------

export async function addCategory(formData: FormData): Promise<void> {
  const name = str(formData, "name");
  if (!name) return;
  const cats = await getCategories();
  const nextOrder = cats.reduce((m, c) => Math.max(m, c.sort_order), 0) + 1;
  await createCategory({ name, sort_order: nextOrder });
  revalidate();
}

export async function renameCategory(formData: FormData): Promise<void> {
  const id = str(formData, "id");
  const name = str(formData, "name");
  if (!id || !name) return;
  await updateCategory(id, { name });
  revalidate();
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
