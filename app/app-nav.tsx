"use client";

import Link from "next/link";
import { logout } from "./login/actions";

// Consistent, labeled top nav shown on every screen so it's always obvious how
// to get between Count, Report, and Manage (labels over icons — a bare "home"
// icon wasn't recognizable). The current screen is highlighted.
const LINKS = [
  { href: "/", label: "Count" },
  { href: "/report", label: "Report" },
  { href: "/items", label: "Manage" },
] as const;

export default function AppNav({
  current,
}: {
  current: "/" | "/report" | "/items";
}) {
  return (
    <nav className="flex flex-wrap items-center gap-1">
      {LINKS.map((l) => {
        const active = l.href === current;
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 items-center rounded-lg px-3 text-sm ${
              active
                ? "bg-neutral-100 font-semibold text-neutral-900"
                : "font-medium text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            {l.label}
          </Link>
        );
      })}
      <form action={logout} className="ml-auto">
        <button
          type="submit"
          className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-neutral-500 hover:bg-neutral-100"
        >
          Sign out
        </button>
      </form>
    </nav>
  );
}
