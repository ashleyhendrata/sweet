"use client";

import { useRef, useState, useTransition } from "react";
import { addCategory, moveCategory, renameCategory } from "./actions";
import type { Category } from "@/lib/types";

const inputClass =
  "block w-full rounded-lg border border-neutral-300 px-3 py-2 text-base text-neutral-900 outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900";

export default function CategoryManager({
  categories,
}: {
  categories: Category[];
}) {
  const addRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();

  function onAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await addCategory(formData);
      addRef.current?.reset();
    });
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 font-semibold text-neutral-900">Categories</h2>

      <ul className="mb-3 divide-y divide-neutral-100">
        {categories.map((cat, i) => (
          <CategoryRow
            key={cat.id}
            category={cat}
            isFirst={i === 0}
            isLast={i === categories.length - 1}
          />
        ))}
      </ul>

      <form ref={addRef} onSubmit={onAdd} className="flex gap-2">
        <input
          name="name"
          required
          placeholder="New category name"
          className={inputClass}
        />
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 shrink-0 rounded-lg border border-neutral-300 px-4 text-sm font-semibold text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
        >
          Add
        </button>
      </form>
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

  function onRename(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await renameCategory(formData);
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
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-100 disabled:opacity-30"
        >
          ↑
        </button>
        <button
          type="button"
          onClick={() => move("down")}
          disabled={isLast || pending}
          aria-label={`Move ${category.name} down`}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-300 text-neutral-700 hover:bg-neutral-100 disabled:opacity-30"
        >
          ↓
        </button>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="min-h-9 rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
        >
          Rename
        </button>
      </div>
    </li>
  );
}
