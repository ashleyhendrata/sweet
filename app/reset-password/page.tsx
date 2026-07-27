"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

// Reached from the reset-link email (via /auth/callback, which signs the user
// in). Sets the new password on the current session.
export default function ResetPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = String(new FormData(e.currentTarget).get("password") ?? "");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setError(
          error.message.includes("session")
            ? "This link has expired — request a new one from “Forgot password”."
            : error.message,
        );
        return;
      }
      router.push("/");
    });
  }

  return (
    <main className="flex min-h-full items-center justify-center bg-neutral-50 p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Choose a new password
          </h1>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
        >
          {error ? (
            <p
              role="alert"
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </p>
          ) : null}

          <div className="space-y-1">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-neutral-700"
            >
              New password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="block w-full rounded-lg border border-neutral-300 px-3 py-3 text-base text-neutral-900 outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
            />
            <p className="text-xs text-neutral-500">At least 8 characters.</p>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="min-h-12 w-full rounded-lg bg-neutral-900 px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-neutral-700 disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save password"}
          </button>
        </form>
      </div>
    </main>
  );
}
