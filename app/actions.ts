"use server";

import { setItemQty } from "@/lib/db";

/**
 * Save an item's on-hand quantity. Called (debounced) from the count screen as
 * staff tap the steppers or type an exact value. Optimistic UI holds the value
 * on screen, so this just persists — no revalidation needed for the same view.
 */
export async function saveItemQty(id: string, qty: number): Promise<void> {
  await setItemQty(id, qty);
}
