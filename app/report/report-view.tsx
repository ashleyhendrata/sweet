"use client";

import { useMemo, useState } from "react";
import AppNav from "../app-nav";
import PrintButton from "./print-button";
import ReportDate from "./report-date";
import {
  isLow,
  type CategoryWithItems,
  type ItemWithCategory,
} from "@/lib/types";

type SortMode = "category" | "name" | "status";

const SORT_LABEL: Record<SortMode, string> = {
  category: "Category",
  name: "Item name (A–Z)",
  status: "Needs ordering first",
};

// Column headers for the inventory tables. "Count" shows the current on-hand
// quantity for each item.
function HeadCells({ withCategory }: { withCategory: boolean }) {
  return (
    <tr>
      <th>Item</th>
      {withCategory && <th>Category</th>}
      <th className="num">Count</th>
      <th>Unit</th>
    </tr>
  );
}

function ItemRow({
  item,
  zebra,
  withCategory,
}: {
  item: ItemWithCategory;
  zebra: boolean;
  withCategory: boolean;
}) {
  const low = isLow(item);
  return (
    <tr className={`${zebra ? "zebra" : ""} ${low ? "low" : ""}`}>
      <td className="item-name">
        {item.name}
        {low && <span className="reorder-tag">Reorder</span>}
      </td>
      {withCategory && <td>{item.category_name}</td>}
      <td className="num">{item.current_qty}</td>
      <td>{item.unit}</td>
    </tr>
  );
}

export default function ReportView({
  groups,
  lowItems,
  location,
  teamName,
  isAdmin,
}: {
  groups: CategoryWithItems[];
  lowItems: ItemWithCategory[];
  location: string;
  teamName: string;
  isAdmin: boolean;
}) {
  const [sort, setSort] = useState<SortMode>("category");
  // "full" = the report with counts; "blank" = a names-only checklist to print.
  const [layout, setLayout] = useState<"full" | "blank">("full");

  const inventory = useMemo(
    () => groups.filter((g) => g.items.length > 0),
    [groups],
  );
  const totalItems = inventory.reduce((n, g) => n + g.items.length, 0);

  // Flat list (with category names) used by the name / status sorts.
  const flatSorted = useMemo(() => {
    const flat: ItemWithCategory[] = inventory.flatMap((g) =>
      g.items.map((it) => ({ ...it, category_name: g.name })),
    );
    if (sort === "name") {
      flat.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === "status") {
      flat.sort(
        (a, b) =>
          Number(isLow(a) ? 0 : 1) - Number(isLow(b) ? 0 : 1) ||
          a.name.localeCompare(b.name),
      );
    }
    return flat;
  }, [inventory, sort]);

  return (
    <div className="min-h-full bg-neutral-100 print:bg-white">
      {/* Screen-only toolbar */}
      <div className="sticky top-0 z-10 border-b border-neutral-200 bg-white px-4 py-3 print:hidden">
        <div className="mx-auto max-w-[8.25in]">
          <AppNav current="/report" isAdmin={isAdmin} />
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-neutral-600">
              Layout
              <select
                value={layout}
                onChange={(e) =>
                  setLayout(e.target.value as "full" | "blank")
                }
                className="min-h-11 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-900 outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
              >
                <option value="full">Full report</option>
                <option value="blank">Blank checklist</option>
              </select>
            </label>
            {layout === "full" && (
              <label className="flex items-center gap-2 text-sm text-neutral-600">
                Sort by
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortMode)}
                  className="min-h-11 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-900 outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
                >
                  {(Object.keys(SORT_LABEL) as SortMode[]).map((m) => (
                    <option key={m} value={m}>
                      {SORT_LABEL[m]}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <PrintButton />
          </div>
        </div>
      </div>

      {/* The printable document. `print-compact` shrinks the full report for
          printing only; the blank checklist stays roomy for writing. */}
      <article
        className={`report-sheet print-compact${
          layout === "blank" ? " print-blank" : ""
        }`}
      >
        {layout === "full" ? (
          <header className="report-header avoid-break">
            <h1 className="report-title">Inventory Report</h1>
            <p className="report-location">
              {location} · {teamName}
            </p>
            <p className="report-summary">
              {totalItems} item{totalItems === 1 ? "" : "s"} ·{" "}
              {inventory.length} categor
              {inventory.length === 1 ? "y" : "ies"} · {lowItems.length} need
              {lowItems.length === 1 ? "s" : ""} ordering
            </p>
            <div className="report-meta">
              <span>
                <ReportDate />
              </span>
            </div>
          </header>
        ) : (
          // Blank checklist: no title block, just a write-in date — saves paper.
          <header
            className="avoid-break"
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "6px",
              fontSize: "13px",
              marginBottom: "4px",
            }}
          >
            <span>Date:</span>
            <span
              style={{
                display: "inline-block",
                width: "220px",
                height: "1em",
                borderBottom: "1px solid #9a958d",
              }}
            />
          </header>
        )}

        {layout === "full" ? (
          <>
        {/* Section 1 — Needs Ordering (reorder list) */}
        <section className="avoid-break">
          <h2 className="section-title">Needs Ordering</h2>
          {lowItems.length === 0 ? (
            <p className="all-good">✓ Nothing needs ordering.</p>
          ) : (
            <div className="needs-ordering-wrap">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="num">Count</th>
                    <th>Unit</th>
                    {/* Reorder-at shows only on the printed page, not on screen. */}
                    <th className="num hidden print:table-cell">Reorder at</th>
                  </tr>
                </thead>
                <tbody>
                  {lowItems.map((item) => (
                    <tr key={item.id}>
                      <td className="item-name">{item.name}</td>
                      <td className="num">{item.current_qty}</td>
                      <td>{item.unit}</td>
                      <td className="num hidden print:table-cell">
                        {item.critical_level}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Section 2 — Count sheet (write the physical count in the last column) */}
        <section>
          <h2 className="section-title">Full Inventory</h2>
          <p className="report-note">
            Sorted by {SORT_LABEL[sort].toLowerCase()}.
          </p>

          {sort === "category" ? (
            inventory.map((group) => (
              <div key={group.id} className="category-block avoid-break">
                <h3 className="category-title">{group.name}</h3>
                <table className="report-table inv-table">
                  <thead>
                    <HeadCells withCategory={false} />
                  </thead>
                  <tbody>
                    {group.items.map((item, i) => (
                      <ItemRow
                        key={item.id}
                        item={{ ...item, category_name: group.name }}
                        zebra={i % 2 === 1}
                        withCategory={false}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            ))
          ) : (
            <table className="report-table">
              <thead>
                <HeadCells withCategory />
              </thead>
              <tbody>
                {flatSorted.map((item, i) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    zebra={i % 2 === 1}
                    withCategory
                  />
                ))}
              </tbody>
            </table>
          )}

          {inventory.length === 0 && (
            <p className="all-good">No items to report yet.</p>
          )}
        </section>
          </>
        ) : (
          /* Blank checklist — item names grouped by category, nothing else:
             no count, no critical, no reorder tag, no input box. */
          <section>
            <h2 className="section-title">Inventory Checklist</h2>
            {inventory.map((group) => (
              <div key={group.id} className="category-block avoid-break">
                <h3 className="category-title">{group.name}</h3>
                {/* Fixed layout + colgroup so the blank Count column lines up
                    straight down across categories, without touching CSS. */}
                <table
                  className="report-table"
                  style={{ tableLayout: "fixed" }}
                >
                  <colgroup>
                    <col style={{ width: "50%" }} />
                    <col style={{ width: "17%" }} />
                    <col style={{ width: "33%" }} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Count</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((item, i) => (
                      <tr key={item.id} className={i % 2 === 1 ? "zebra" : ""}>
                        <td className="item-name">{item.name}</td>
                        <td />
                        <td />
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
            {inventory.length === 0 && (
              <p className="all-good">No items yet.</p>
            )}
          </section>
        )}

        <footer className="report-footer">
          {location} · {teamName}
        </footer>
      </article>
    </div>
  );
}
