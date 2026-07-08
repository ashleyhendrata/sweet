import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-lg font-bold text-neutral-900">Page not found</h1>
        <p className="mt-1 text-sm text-neutral-500">
          That page doesn’t exist.
        </p>
        <Link
          href="/"
          className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-neutral-900 px-5 text-sm font-semibold text-white hover:bg-neutral-700"
        >
          Go to counting
        </Link>
      </div>
    </main>
  );
}
