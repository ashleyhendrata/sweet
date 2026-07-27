"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  getTeamContext,
  leaveTeam as leaveTeamInDb,
  regenerateJoinCode,
  removeMember,
  renameTeam as renameTeamInDb,
  setMemberRole,
} from "@/lib/db";
import type { ActionResult } from "@/app/items/actions";
import type { Role } from "@/lib/types";

// All three actions are admin-only; RLS enforces this in the database too.
// Acting on yourself is blocked so a team can never lose its last admin.

export async function changeMemberRole(
  userId: string,
  role: Role,
): Promise<ActionResult> {
  const ctx = await getTeamContext();
  if (ctx?.role !== "admin") return { error: "Only admins can change roles." };
  if (userId === ctx.userId)
    return { error: "You can’t change your own role." };
  try {
    await setMemberRole(userId, role);
    revalidatePath("/team");
    return {};
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export async function removeTeamMember(userId: string): Promise<ActionResult> {
  const ctx = await getTeamContext();
  if (ctx?.role !== "admin")
    return { error: "Only admins can remove people." };
  if (userId === ctx.userId)
    return { error: "You can’t remove yourself." };
  try {
    await removeMember(userId);
    revalidatePath("/team");
    return {};
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export async function newJoinCode(): Promise<ActionResult> {
  const ctx = await getTeamContext();
  if (ctx?.role !== "admin")
    return { error: "Only admins can change the code." };
  try {
    await regenerateJoinCode();
    revalidatePath("/team");
    return {};
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

export async function renameTeam(name: string): Promise<ActionResult> {
  const ctx = await getTeamContext();
  if (ctx?.role !== "admin")
    return { error: "Only admins can rename the store." };
  const trimmed = name.trim();
  if (!trimmed) return { error: "Enter a name." };
  try {
    await renameTeamInDb(trimmed);
    revalidatePath("/team");
    return {};
  } catch {
    return { error: "Something went wrong. Please try again." };
  }
}

/** Leave the current store so /welcome can join or create a different one. */
export async function leaveTeam(): Promise<ActionResult> {
  const ctx = await getTeamContext();
  if (!ctx) return { error: "You're not on a team." };
  try {
    await leaveTeamInDb();
  } catch (e) {
    const msg = (e as { message?: string })?.message ?? "";
    if (msg.includes("LAST_ADMIN")) {
      return {
        error:
          "You're the only admin — make someone else admin first so the store keeps a manager.",
      };
    }
    return { error: "Something went wrong. Please try again." };
  }
  redirect("/welcome");
}
