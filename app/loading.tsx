// Shown while a screen's data loads on navigation. Kept minimal and calm — the
// count screen itself is fast, so this rarely flashes.
export default function Loading() {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center p-6">
      <p className="text-sm text-neutral-400">Loading…</p>
    </main>
  );
}
