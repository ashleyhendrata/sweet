"use client";

// App-wide error boundary: a friendly, plain-language fallback instead of a
// stack trace, with a one-tap retry.
export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-lg font-bold text-neutral-900">
          Something went wrong
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          The app hit a snag. Try again — your data is safe.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-neutral-900 px-5 text-sm font-semibold text-white hover:bg-neutral-700"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
