"use server";

import { redirect } from "next/navigation";
import { createTeam, joinTeam } from "@/lib/db";
import type { ActionResult } from "@/app/items/actions";

// Map the database function's raised errors to plain language.
function friendly(e: unknown): string {
  const msg = (e as { message?: string })?.message ?? "";
  if (msg.includes("BAD_CODE"))
    return "That code didn’t match any store. Double-check it with your manager.";
  if (msg.includes("ALREADY_MEMBER")) return "You’re already on a team.";
  if (msg.includes("NAME_REQUIRED")) return "Enter a store name.";
  return "Something went wrong. Please try again.";
}

/** Join an existing franchise with its team code (auto-join as a counter). */
export async function joinFranchise(formData: FormData): Promise<ActionResult> {
  const code = String(formData.get("code") ?? "").trim();
  if (!code) return { error: "Enter your store’s team code." };
  try {
    await joinTeam(code);
  } catch (e) {
    return { error: friendly(e) };
  }
  redirect("/");
}

/** Create a new franchise; the creator becomes its admin. */
export async function createFranchise(
  formData: FormData,
): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Enter a store name." };
  try {
    await createTeam(name);
  } catch (e) {
    return { error: friendly(e) };
  }
  // Straight to the Team page so the new admin sees the join code to share.
  redirect("/team");
}
