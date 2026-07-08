"use client";

import { useRef, useState, useTransition } from "react";
import { addItem, deleteItemAction, editItem } from "./actions";
import type { Category, Item } from "@/lib/types";

const COMMON_UNITS = [
  "boxes",
  "bags",
  "cartons",
  "sleeves",
  "bottles",
  "cases",
  "quarts",
  "rolls",
  "jars",
  "buckets",
  "units",
];

const NEW_CATEGORY = "__new__";
const inputClass =
  "block w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base text-neutral-900 outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900";

/**
 * One form for both adding and editing an item. Pass `item` to edit; omit it to
 * add. The category dropdown carries an inline "New category…" option that
 * reveals a text field, handled server-side in `resolveCategoryId`.
 */
export default function ItemForm({
  categories,
  item,
  onDone,
}: {
  categories: Category[];
  item?: Item;
  onDone?: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = Boolean(item);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = isEdit
        ? await editItem(formData)
        : await addItem(formData);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setError(null);
      formRef.current?.reset();
      setShowNewCategory(false);
      onDone?.();
    });
  }

  function onDelete() {
    if (!item) return;
    if (
      !confirm(`Permanently delete “${item.name}”? This can't be undone.`)
    )
      return;
    startTransition(async () => {
      await deleteItemAction(item.id);
      onDone?.();
    });
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-3">
      {isEdit && <input type="hidden" name="id" defaultValue={item!.id} />}

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">
          Name
        </label>
        <input
          name="name"
          required
          defaultValue={item?.name}
          placeholder="e.g. Oat Milk"
          className={inputClass}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">
          Category
        </label>
        <select
          name="category_id"
          required
          defaultValue={item?.category_id ?? ""}
          onChange={(e) => setShowNewCategory(e.target.value === NEW_CATEGORY)}
          className={inputClass}
        >
          <option value="" disabled>
            Select a category…
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
          <option value={NEW_CATEGORY}>+ New category…</option>
        </select>
        {showNewCategory && (
          <input
            name="new_category"
            required
            placeholder="New category name"
            className={`${inputClass} mt-2`}
          />
        )}
      </div>

      <div className="flex gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Unit
          </label>
          <input
            name="unit"
            required
            list="unit-options"
            defaultValue={item?.unit ?? ""}
            placeholder="boxes"
            className={inputClass}
          />
          <datalist id="unit-options">
            {COMMON_UNITS.map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>
        </div>
        <div className="w-28">
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Reorder at
          </label>
          <input
            name="critical_level"
            type="number"
            min={1}
            step="any"
            placeholder="none"
            defaultValue={item?.critical_level ?? ""}
            className={inputClass}
          />
        </div>
        <div className="w-24">
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            Count
          </label>
          <input
            name="current_qty"
            type="number"
            min={0}
            step="any"
            defaultValue={item?.current_qty ?? 0}
            className={inputClass}
          />
        </div>
      </div>

      <p className="text-xs text-neutral-500">
        Leave <span className="font-medium">Reorder at</span> blank if the item
        never needs reorder alerts.
      </p>

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 flex-1 rounded-lg bg-neutral-900 px-4 py-2.5 text-base font-semibold text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {pending ? "Saving…" : isEdit ? "Save changes" : "Add item"}
        </button>
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            disabled={pending}
            className="min-h-11 rounded-lg border border-neutral-300 px-4 py-2.5 text-base font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Cancel
          </button>
        )}
      </div>

      {isEdit && (
        <div className="mt-1 border-t border-neutral-200 pt-3">
          <button
            type="button"
            onClick={onDelete}
            disabled={pending}
            className="min-h-11 w-full rounded-lg border border-red-300 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
          >
            Delete permanently
          </button>
        </div>
      )}
    </form>
  );
}
