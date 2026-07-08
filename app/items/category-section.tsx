"use client";

import { useState } from "react";
import ItemForm from "./item-form";
import ItemRow from "./item-row";
import type { Category, CategoryWithItems } from "@/lib/types";

// One category's block on the Manage screen: heading with an inline "+ Add"
// (so you can add an item to this category without scrolling to the top),
// an inline add form pre-set to this category, then the item rows.
export default function CategorySection({
  group,
  categories,
  units,
}: {
  group: CategoryWithItems;
  categories: Category[];
  units: string[];
}) {
  const [adding, setAdding] = useState(false);

  return (
    <section className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
      <div className="flex items-center justify-between bg-neutral-50 pr-2">
        <h2 className="px-4 py-2 font-semibold text-neutral-900">
          {group.name}
        </h2>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          aria-label={`Add item to ${group.name}`}
          className="flex min-h-9 items-center rounded-lg px-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-200"
        >
          {adding ? "Cancel" : "+ Add"}
        </button>
      </div>

      {adding && (
        <div className="border-t border-neutral-200 bg-neutral-50 px-4 py-3">
          <ItemForm
            categories={categories}
            units={units}
            defaultCategoryId={group.id}
            onDone={() => setAdding(false)}
          />
        </div>
      )}

      <ul>
        {group.items.map((item, i) => (
          <ItemRow
            key={item.id}
            item={item}
            categories={categories}
            units={units}
            isFirst={i === 0}
            isLast={i === group.items.length - 1}
          />
        ))}
      </ul>
    </section>
  );
}
