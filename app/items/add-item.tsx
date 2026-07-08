"use client";

import { useState } from "react";
import ItemForm from "./item-form";
import type { Category } from "@/lib/types";

// Keep the manage screen tidy: the add form stays tucked behind a button until
// needed, so the item list is what you see first.
export default function AddItem({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="min-h-11 w-full rounded-lg bg-neutral-900 px-4 py-3 text-base font-semibold text-white hover:bg-neutral-700"
      >
        + Add item
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 font-semibold text-neutral-900">New item</h2>
      <ItemForm categories={categories} onDone={() => setOpen(false)} />
    </div>
  );
}
