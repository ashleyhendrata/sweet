"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { saveItemQty } from "./actions";
import { logout } from "./login/actions";
import { isLow, type CategoryWithItems } from "@/lib/types";

const SAVE_DEBOUNCE_MS = 500;

export default function CountScreen({
  groups,
}: {
  groups: CategoryWithItems[];
}) {
  // Live quantities, seeded from the server. This is the source of truth for
  // display so +/- and typing feel instant (optimistic); saves are debounced.
  const [quantities, setQuantities] = useState<Record<string, number>>(() => {
    const q: Record<string, number> = {};
    for (const g of groups) for (const it of g.items) q[it.id] = it.current_qty;
    return q;
  });
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // Per-item debounce timers, so rapid taps coalesce into one write.
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  useEffect(() => {
    const map = timers.current;
    return () => map.forEach((t) => clearTimeout(t));
  }, []);

  const scheduleSave = useCallback((id: string, qty: number) => {
    const existing = timers.current.get(id);
    if (existing) clearTimeout(existing);
    const t = setTimeout(() => {
      timers.current.delete(id);
      saveItemQty(id, qty).catch((err) =>
        console.error("Failed to save quantity", err),
      );
    }, SAVE_DEBOUNCE_MS);
    timers.current.set(id, t);
  }, []);

  const setQty = useCallback(
    (id: string, next: number) => {
      const clamped = Number.isFinite(next) ? Math.max(0, next) : 0;
      setQuantities((prev) => ({ ...prev, [id]: clamped }));
      scheduleSave(id, clamped);
    },
    [scheduleSave],
  );

  // Flat metadata lookup (critical level etc.) keyed by item id.
  const meta = useMemo(() => {
    const m = new Map<
      string,
      { critical_level: number; name: string; unit: string }
    >();
    for (const g of groups)
      for (const it of g.items)
        m.set(it.id, {
          critical_level: it.critical_level,
          name: it.name,
          unit: it.unit,
        });
    return m;
  }, [groups]);

  // Count of items currently at/below their critical level (ignores search).
  const lowCount = useMemo(() => {
    let n = 0;
    for (const [id, qty] of Object.entries(quantities)) {
      const info = meta.get(id);
      if (info && qty <= info.critical_level) n++;
    }
    return n;
  }, [quantities, meta]);

  const term = search.trim().toLowerCase();
  const searching = term.length > 0;

  // Filter items by name; drop empty categories while searching.
  const visibleGroups = useMemo(() => {
    if (!searching) return groups;
    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter((it) => it.name.toLowerCase().includes(term)),
      }))
      .filter((g) => g.items.length > 0);
  }, [groups, term, searching]);

  const totalMatches = visibleGroups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-3">
        <h1 className="text-lg font-bold text-neutral-900">Inventory</h1>
        <form action={logout}>
          <button
            type="submit"
            className="rounded-lg px-3 py-2 text-sm font-medium text-neutral-500 hover:bg-neutral-100"
          >
            Sign out
          </button>
        </form>
      </header>

      {/* Sticky: reorder banner + search, always reachable behind the counter */}
      <div className="sticky top-0 z-10 border-b border-neutral-200 bg-white">
        <div
          className={`px-4 py-2 text-sm font-semibold ${
            lowCount > 0
              ? "bg-red-50 text-red-700"
              : "bg-green-50 text-green-700"
          }`}
        >
          {lowCount > 0
            ? `⚠ ${lowCount} item${lowCount === 1 ? "" : "s"} need${
                lowCount === 1 ? "s" : ""
              } reordering`
            : "✓ Nothing needs reordering"}
        </div>
        <div className="p-3">
          <input
            type="search"
            inputMode="search"
            placeholder="Search items…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block h-11 w-full rounded-lg border border-neutral-300 px-3 text-base text-neutral-900 outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1">
        {searching && totalMatches === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-neutral-500">
            No items match “{search.trim()}”.
          </p>
        ) : (
          visibleGroups.map((group) => {
            // While searching, force-expand so matches are always visible.
            const isCollapsed = !searching && collapsed[group.id];
            const groupLow = group.items.filter((it) =>
              isLow({
                current_qty: quantities[it.id] ?? it.current_qty,
                critical_level: it.critical_level,
              }),
            ).length;

            return (
              <section
                key={group.id}
                className="border-b border-neutral-200 last:border-b-0"
              >
                <button
                  type="button"
                  onClick={() =>
                    setCollapsed((prev) => ({
                      ...prev,
                      [group.id]: !prev[group.id],
                    }))
                  }
                  className="flex min-h-11 w-full items-center justify-between gap-2 bg-neutral-50 px-4 py-2 text-left"
                  aria-expanded={!isCollapsed}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`text-neutral-400 transition-transform ${
                        isCollapsed ? "" : "rotate-90"
                      }`}
                      aria-hidden
                    >
                      ▶
                    </span>
                    <span className="font-semibold text-neutral-900">
                      {group.name}
                    </span>
                    <span className="text-sm text-neutral-400">
                      {group.items.length}
                    </span>
                  </span>
                  {groupLow > 0 && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                      {groupLow} low
                    </span>
                  )}
                </button>

                {!isCollapsed && (
                  <ul>
                    {group.items.map((item) => {
                      const qty = quantities[item.id] ?? item.current_qty;
                      const low = isLow({
                        current_qty: qty,
                        critical_level: item.critical_level,
                      });
                      return (
                        <li
                          key={item.id}
                          className="flex items-center justify-between gap-3 border-t border-neutral-100 px-4 py-2"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate font-medium text-neutral-900">
                                {item.name}
                              </span>
                              {low && (
                                <span className="shrink-0 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                  Reorder
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-neutral-500">
                              {item.unit} · critical {item.critical_level}
                            </div>
                          </div>

                          {/* Stepper — 44px touch targets, tap number to type */}
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              aria-label={`Decrease ${item.name}`}
                              onClick={() => setQty(item.id, qty - 1)}
                              className="flex h-11 w-11 items-center justify-center rounded-lg border border-neutral-300 text-2xl leading-none text-neutral-700 active:bg-neutral-100 disabled:opacity-40"
                              disabled={qty <= 0}
                            >
                              −
                            </button>
                            <input
                              type="text"
                              inputMode="decimal"
                              aria-label={`${item.name} quantity`}
                              value={qty}
                              onFocus={(e) => e.currentTarget.select()}
                              onChange={(e) => {
                                const raw = e.target.value.trim();
                                if (raw === "") {
                                  setQty(item.id, 0);
                                  return;
                                }
                                const parsed = Number(raw);
                                if (!Number.isNaN(parsed)) setQty(item.id, parsed);
                              }}
                              className={`h-11 w-14 rounded-lg border text-center text-lg font-semibold outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 ${
                                low
                                  ? "border-red-300 bg-red-50 text-red-700"
                                  : "border-neutral-300 text-neutral-900"
                              }`}
                            />
                            <button
                              type="button"
                              aria-label={`Increase ${item.name}`}
                              onClick={() => setQty(item.id, qty + 1)}
                              className="flex h-11 w-11 items-center justify-center rounded-lg border border-neutral-300 text-2xl leading-none text-neutral-700 active:bg-neutral-100"
                            >
                              +
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
