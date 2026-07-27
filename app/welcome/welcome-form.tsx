"use client";

import { useState, useTransition } from "react";
import { createFranchise, joinFranchise } from "./actions";

const inputClass =
  "block w-full rounded-lg border border-neutral-300 px-3 py-3 text-base text-neutral-900 outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900";

// Two paths after signup: join your store with its code (most staff), or
// create a new store (a franchise owner/manager setting up for the first time).
export default function WelcomeForm() {
  const [joinError, setJoinError] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onJoin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await joinFranchise(formData);
      if (result?.error) setJoinError(result.error);
    });
  }

  function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createFranchise(formData);
      if (result?.error) setCreateError(result.error);
    });
  }

  return (
    <div className="space-y-4">
      {/* Join an existing store */}
      <form
        onSubmit={onJoin}
        className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
      >
        <div>
          <h2 className="font-semibold text-neutral-900">Join your store</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Type the team code from your manager.
          </p>
        </div>
        {joinError && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {joinError}
          </p>
        )}
        <input
          name="code"
          required
          autoCapitalize="characters"
          autoComplete="off"
          placeholder="e.g. K7M2QX"
          className={`${inputClass} text-center font-mono text-lg uppercase tracking-widest`}
        />
        <button
          type="submit"
          disabled={pending}
          className="min-h-12 w-full rounded-lg bg-neutral-900 px-4 py-3 text-base font-semibold text-white hover:bg-neutral-700 disabled:opacity-60"
        >
          {pending ? "Joining…" : "Join"}
        </button>
      </form>

      {/* Create a new store */}
      <form
        onSubmit={onCreate}
        className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
      >
        <div>
          <h2 className="font-semibold text-neutral-900">
            Setting up a new store?
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            Create it here — you’ll be its admin and get a team code to share
            with your staff.
          </p>
        </div>
        {createError && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {createError}
          </p>
        )}
        <input
          name="name"
          required
          placeholder="e.g. Sweetwaters — The Grove"
          className={inputClass}
        />
        <button
          type="submit"
          disabled={pending}
          className="min-h-12 w-full rounded-lg border border-neutral-300 px-4 py-3 text-base font-semibold text-neutral-800 hover:bg-neutral-100 disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create store"}
        </button>
      </form>
    </div>
  );
}
