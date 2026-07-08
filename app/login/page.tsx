import { login } from "./actions";

// Login is a plain server-rendered form posting to a Server Action — no client
// JS required, so it loads instantly even on a weak connection behind the bar.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="flex min-h-full items-center justify-center bg-neutral-50 p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Sweetwaters Inventory
          </h1>
          <p className="mt-1 text-sm text-neutral-500">Staff sign in</p>
        </div>

        <form
          action={login}
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
              htmlFor="email"
              className="block text-sm font-medium text-neutral-700"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              className="block w-full rounded-lg border border-neutral-300 px-3 py-3 text-base text-neutral-900 outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
            />
          </div>

          <div className="space-y-1">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-neutral-700"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="block w-full rounded-lg border border-neutral-300 px-3 py-3 text-base text-neutral-900 outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
            />
          </div>

          <button
            type="submit"
            className="min-h-12 w-full rounded-lg bg-neutral-900 px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-neutral-700 active:bg-neutral-800"
          >
            Sign in
          </button>
        </form>
      </div>
    </main>
  );
}
