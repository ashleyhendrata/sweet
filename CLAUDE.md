@AGENTS.md

# Sweetwaters Inventory App

## What this is
A simple, phone-first inventory tracker for a Sweetwaters Coffee & Tea location. Built by a barista, used by all employees. The bar for success: any new hire can do a full inventory count on their phone in under 5 minutes with zero training beyond "here's the link."

## Stack
- Next.js (App Router, TypeScript)
- Tailwind CSS
- Supabase (Postgres + auth) — free tier
- Deployed on Vercel
- No other dependencies unless truly necessary. No component libraries, no state management libraries, no PDF libraries.

## Core concepts
An **item** is anything we track: "Danish", "Oat milk", "12oz cups".
Every item has:
- `name` (text, required)
- `category_id` (FK to categories — e.g. Pastries, Dairy, Cups & Lids, Syrups, Tea, Cleaning)
- `unit` (text — "boxes", "cartons", "sleeves", "bottles", whatever makes sense per item)
- `critical_level` (numeric — at or below this, the item needs to be reordered)
- `current_qty` (numeric)
- `updated_at` (auto)

**Categories** are a lookup table (`id`, `name`, `sort_order`) so employees select from a dropdown, never free-type.

An item is "low" when `current_qty <= critical_level`. Low items get a red REORDER badge everywhere they appear.

## Screens
1. **/ (Count screen)** — the daily driver.
   - Items grouped by category, categories collapsible.
   - Each item row: name, current qty + unit, big +/− stepper buttons (44px+ touch targets), tap the number to type an exact value.
   - Qty changes save immediately (optimistic UI, debounced write).
   - Sticky search bar at top.
   - Low items show a red badge; a banner at top shows "N items need reordering".
2. **/items (Manage)** — add/edit/archive items and categories. Simple forms. Archive, don't delete (keep history sane).
3. **/report (Print report)** — THE MOST IMPORTANT SCREEN. See below.

## The print report (do not cut corners here)
This must look like a professional document, not a data dump.
- Route renders a clean, print-optimized page; the Print button calls `window.print()`. Use `@media print` CSS. No PDF libraries.
- Header: "Sweetwaters Inventory Report", location name, date + time, "Counted by: ______" blank line.
- Section 1: **Needs Ordering** — table of all low items (name, category, qty on hand, unit, critical level), highlighted. If none, say "✓ Nothing needs ordering."
- Section 2: **Full Inventory** — items grouped by category with category headings, columns: Item / Qty / Unit / Critical. Zebra striping, generous padding, serif or clean sans headings.
- Print CSS: hide nav/buttons, black on white, sensible page breaks (`break-inside: avoid` on category groups), footer with page numbers if easy.
- Test by actually printing to PDF and looking at it.

## UX principles
- Phone-first. Assume it's used one-handed behind the counter.
- Zero training required. Labels over icons. No hidden gestures.
- Forgiving: confirm before archive, easy undo on qty typos (tap number to correct).
- Fast: count screen loads instantly, no spinners for qty updates.

## Auth
Single shared staff login (email + password stored in Supabase auth), so onboarding = share the link and credentials. Structure code so per-user auth could be added later, but do not build it now.

## Conventions
- TypeScript strict mode.
- Server components by default; client components only where interactivity requires.
- All Supabase access through a single `lib/db.ts` layer — no raw queries scattered in components.
- Seed script with realistic Sweetwaters data (pastries, milks, cups, syrups, teas) for development.
- Small commits with clear messages.

## Out of scope (do not build unless asked)
- Multi-location support
- Order placement / vendor integration
- Usage analytics or charts
- Barcode scanning
- Per-user accounts and permissions
