"use client";

import { useTransition } from "react";
import ItemForm from "./item-form";
import {
  archiveItemAction,
  deleteItemAction,
  restoreItemAction,
} from "./actions";
import { useEdit } from "./edit-context";
import { isLow, type Category, type Item } from "@/lib/types";

/**
 * A single item in the manage list. Shows details with Edit / Archive actions;
 * Edit swaps in the shared form inline. Archived rows show a Restore action
 * instead. Archiving asks for confirmation first (forgiving UX).
 */
export default function ItemRow({
  item,
  categories,
  archived = false,
}: {
  item: Item;
  categories: Category[];
  archived?: boolean;
}) {
  const { editingId, setEditingId } = useEdit();
  const editing = editingId === item.id;
  const [pending, startTransition] = useTransition();

  if (editing) {
    return (
      <li className="border-t border-neutral-100 bg-neutral-50 px-4 py-3">
        <ItemForm
          categories={categories}
          item={item}
          onDone={() => setEditingId(null)}
        />
      </li>
    );
  }

  const low = !archived && isLow(item);

  function onArchive() {
    if (!confirm(`Archive “${item.name}”? It will be hidden from counts.`))
      return;
    startTransition(() => archiveItemAction(item.id));
  }

  function onRestore() {
    startTransition(() => restoreItemAction(item.id));
  }

  function onDelete() {
    if (
      !confirm(
        `Permanently delete “${item.name}”? This can't be undone.`,
      )
    )
      return;
    startTransition(() => deleteItemAction(item.id));
  }

  return (
    <li className="flex items-center justify-between gap-3 border-t border-neutral-100 px-4 py-2.5">
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
          {item.current_qty} {item.unit}
          {item.critical_level != null &&
            ` · reorder at ${item.critical_level}`}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {archived ? (
          <>
            <button
              type="button"
              onClick={onRestore}
              disabled={pending}
              className="flex min-h-11 items-center rounded-lg border border-neutral-300 px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
            >
              Restore
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={pending}
              className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              Delete
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setEditingId(item.id)}
              className="flex min-h-11 items-center rounded-lg border border-neutral-300 px-3 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={onArchive}
              disabled={pending}
              className="flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              Archive
            </button>
          </>
        )}
      </div>
    </li>
  );
}
