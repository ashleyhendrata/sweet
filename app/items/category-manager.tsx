"use client";

import { useState, useTransition } from "react";
import { moveCategory, renameCategory } from "./actions";
import type { Category } from "@/lib/types";

const inputClass =
  "block w-full rounded-lg border border-neutral-300 px-3 py-2 text-base text-neutral-900 outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900";

// Only categories that currently have items are shown here. To create a
// category, add an item and pick "+ New category" in the item form — so a
// category always has at least one item and empty ones never linger.
export default function CategoryManager({
  categories,
}: {
  categories: Category[];
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <h2 className="mb-1 font-semibold text-neutral-900">Categories</h2>

      {categories.length === 0 ? (
        <p className="text-sm text-neutral-500">
          Categories appear here once they have items. Add one with “+ New
          category” when you add an item.
        </p>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {categories.map((cat, i) => (
            <CategoryRow
              key={cat.id}
              category={cat}
              isFirst={i === 0}
              isLast={i === categories.length - 1}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function CategoryRow({
  category,
  isFirst,
  isLast,
}: {
  category: Category;
  isFirst: boolean;
  isLast: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onRename(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await renameCategory(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setError(null);
      setEditing(false);
    });
  }

  function move(direction: "up" | "down") {
    startTransition(() => moveCategory(category.id, direction));
  }

  if (editing) {
    return (
      <li className="py-2">
        <form onSubmit={onRename} className="flex gap-2">
          <input type="hidden" name="id" value={category.id} />
          <input
            name="name"
            required
            defaultValue={category.name}
            autoFocus
            className={inputClass}
          />
          <button
            type="submit"
            disabled={pending}
            className="min-h-11 shrink-0 rounded-lg bg-neutral-900 px-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="min-h-11 shrink-0 rounded-lg border border-neutral-300 px-3 text-sm font-medium text-neutral-700"
          >
            Cancel
          </button>
        </form>
        {error && (
          <p role="alert" className="mt-1 text-sm text-red-700">
            {error}
          </p>
        )}
      </li>
    );
  }

  return (
    <li className="flex items-center justify-between gap-2 py-2">
      <span className="truncate font-medium text-neutral-900">
        {category.name}
      </span>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => move("up")}
          disabled={isFirst || pending}
          aria-label={`Move ${category.name} up`}
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-100 disabled:opacity-30"
        >
          ↑
        </button>
        <button
          type="button"
          onClick={() => move("down")}
          disabled={isLast || pending}
          aria-label={`Move ${category.name} down`}
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-100 disabled:opacity-30"
        >
          ↓
        </button>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex min-h-11 items-center rounded-lg border border-neutral-300 px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
        >
          Rename
        </button>
      </div>
    </li>
  );
}
