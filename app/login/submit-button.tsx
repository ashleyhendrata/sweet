"use client";

import { useFormStatus } from "react-dom";

// Gives the shared-login form a clear pending state so a new hire on a slow
// connection sees that their tap registered.
export default function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-12 w-full rounded-lg bg-neutral-900 px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-neutral-700 active:bg-neutral-800 disabled:opacity-60"
    >
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}
