import Link from "next/link";
import { requestReset } from "./actions";
import SubmitButton from "../login/submit-button";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { error, notice } = await searchParams;

  return (
    <main className="flex min-h-full items-center justify-center bg-neutral-50 p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Reset your password
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            We’ll email you a link to set a new one.
          </p>
        </div>

        <form
          action={requestReset}
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
          {notice ? (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
              {notice}
            </p>
          ) : null}

          <div className="space-y-1">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-neutral-700"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="block w-full rounded-lg border border-neutral-300 px-3 py-3 text-base text-neutral-900 outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
            />
          </div>

          <SubmitButton label="Send reset link" pendingLabel="Sending…" />

          <p className="text-center text-sm text-neutral-500">
            <Link
              href="/login"
              className="font-medium text-neutral-900 underline"
            >
              Back to sign in
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
