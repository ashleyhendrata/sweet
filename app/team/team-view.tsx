"use client";

import { useState, useTransition } from "react";
import {
  changeMemberRole,
  leaveTeam,
  newJoinCode,
  removeTeamMember,
  renameTeam,
} from "./actions";
import type { TeamMember } from "@/lib/types";

// Team screen: the join code to share with staff, and the member list.
// Admins can promote/demote/remove; members just see who's on the team.
export default function TeamView({
  teamName,
  joinCode,
  members,
  currentUserId,
  isAdmin,
}: {
  teamName: string;
  joinCode: string;
  members: TeamMember[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(teamName);

  function run(action: () => Promise<{ error?: string }>) {
    startTransition(async () => {
      const result = await action();
      setError(result?.error ?? null);
    });
  }

  function onRenameSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await renameTeam(nameDraft);
      setError(result?.error ?? null);
      if (!result?.error) setEditingName(false);
    });
  }

  function onRenameCancel() {
    setNameDraft(teamName);
    setEditingName(false);
    setError(null);
  }

  function onNewCode() {
    if (
      !confirm(
        "Make a new join code? The old one will stop working (anyone already on the team stays).",
      )
    )
      return;
    run(newJoinCode);
  }

  function onLeave() {
    if (
      !confirm(
        "Leave this store? You'll need a team code to join again (or you can create a new store).",
      )
    )
      return;
    run(leaveTeam);
  }

  return (
    <div className="space-y-5">
      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {/* Join code */}
      <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        {editingName ? (
          <form onSubmit={onRenameSubmit} className="flex flex-wrap gap-2">
            <input
              type="text"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              autoFocus
              required
              className="min-w-0 flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-base font-semibold text-neutral-900 outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
            />
            <button
              type="submit"
              disabled={pending}
              className="flex min-h-11 items-center rounded-lg bg-neutral-900 px-3 text-sm font-medium text-white disabled:opacity-50"
            >
              Save
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={onRenameCancel}
              className="flex min-h-11 items-center rounded-lg border border-neutral-300 px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
            >
              Cancel
            </button>
          </form>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold text-neutral-900">{teamName}</h2>
            {isAdmin && (
              <button
                type="button"
                onClick={() => setEditingName(true)}
                className="shrink-0 text-sm font-medium text-neutral-500 underline hover:text-neutral-700"
              >
                Rename
              </button>
            )}
          </div>
        )}
        <p className="mt-2 text-sm text-neutral-600">
          Staff join this store by creating an account and typing this team
          code:
        </p>
        <p className="mt-3 rounded-lg bg-neutral-100 py-3 text-center font-mono text-2xl font-bold tracking-[0.3em] text-neutral-900">
          {joinCode}
        </p>
        {isAdmin && (
          <button
            type="button"
            onClick={onNewCode}
            disabled={pending}
            className="mt-3 flex min-h-11 items-center rounded-lg border border-neutral-300 px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
          >
            Make a new code
          </button>
        )}
      </section>

      {/* Members */}
      <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <h2 className="mb-1 font-semibold text-neutral-900">
          People ({members.length})
        </h2>
        <ul className="divide-y divide-neutral-100">
          {members.map((m) => {
            const isSelf = m.user_id === currentUserId;
            return (
              <li key={m.user_id} className="py-2.5">
                <div className="flex items-baseline gap-2">
                  <span className="min-w-0 break-all font-medium text-neutral-900">
                    {m.email || "(no email)"}
                  </span>
                  {isSelf && (
                    <span className="shrink-0 text-xs text-neutral-400">
                      you
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
                      m.role === "admin"
                        ? "bg-neutral-900 text-white"
                        : "bg-neutral-100 text-neutral-600"
                    }`}
                  >
                    {m.role === "admin" ? "Admin" : "Counter"}
                  </span>
                  {isAdmin && !isSelf && (
                    <span className="ml-auto flex items-center gap-2">
                      {m.role === "member" ? (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() =>
                            run(() => changeMemberRole(m.user_id, "admin"))
                          }
                          className="flex min-h-11 items-center rounded-lg border border-neutral-300 px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
                        >
                          Make admin
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() =>
                            run(() => changeMemberRole(m.user_id, "member"))
                          }
                          className="flex min-h-11 items-center rounded-lg border border-neutral-300 px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
                        >
                          Make counter
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => {
                          if (
                            confirm(
                              `Remove ${m.email || "this person"} from the team?`,
                            )
                          )
                            run(() => removeTeamMember(m.user_id));
                        }}
                        className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        {isAdmin && (
          <p className="mt-2 text-xs text-neutral-500">
            Admins manage items and people. Counters do the daily count.
          </p>
        )}
      </section>

      {/* Switch stores */}
      <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <button
          type="button"
          disabled={pending}
          onClick={onLeave}
          className="flex min-h-11 items-center rounded-lg px-3 -mx-3 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          Leave this store
        </button>
        <p className="mt-1 text-xs text-neutral-500">
          Joined the wrong store, or switching locations? Leave to join or
          create a different one.
        </p>
      </section>
    </div>
  );
}
