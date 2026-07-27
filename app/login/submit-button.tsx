"use client";

import { useFormStatus } from "react-dom";

// Auth-form submit button with a clear pending state so a tap on a slow
// connection visibly registers. Labels configurable for login/signup/reset.
export default function SubmitButton({
  label = "Sign in",
  pendingLabel = "Signing in…",
}: {
  label?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-12 w-full rounded-lg bg-neutral-900 px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-neutral-700 active:bg-neutral-800 disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}
