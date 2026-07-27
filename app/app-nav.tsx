"use client";

import Link from "next/link";
import { logout } from "./login/actions";

// Consistent, labeled top nav shown on every screen so it's always obvious how
// to get between screens (labels over icons — a bare "home" icon wasn't
// recognizable). The current screen is highlighted. Manage is admin-only.
// Sign out also lives on the Team page: on narrow screens (or with larger
// system text) a trailing nav button is the first thing to wrap onto its own
// line, so it's hidden here below the `sm` breakpoint and shown from `sm` up.
const LINKS = [
  { href: "/", label: "Count", adminOnly: false },
  { href: "/report", label: "Report", adminOnly: false },
  { href: "/items", label: "Manage", adminOnly: true },
  { href: "/team", label: "Team", adminOnly: false },
] as const;

export default function AppNav({
  current,
  isAdmin,
}: {
  current: "/" | "/report" | "/items" | "/team";
  isAdmin: boolean;
}) {
  return (
    <nav className="flex flex-wrap items-center gap-1">
      {LINKS.filter((l) => isAdmin || !l.adminOnly).map((l) => {
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
      <form action={logout} className="ml-auto hidden sm:block">
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
