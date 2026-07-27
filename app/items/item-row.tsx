"use client";

import { useTransition } from "react";
import ItemForm from "./item-form";
import {
  archiveItemAction,
  deleteItemAction,
  moveItem,
  restoreItemAction,
} from "./actions";
import { useEdit } from "./edit-context";
import { isLow, type Category, type Item } from "@/lib/types";

// Reorder arrows, shared between the next-to-name spot (wide screens) and the
// actions row (phones) so they only need to be wired up once.
function MoveButtons({
  item,
  isFirst,
  isLast,
  pending,
  onMove,
  className = "",
}: {
  item: Item;
  isFirst: boolean;
  isLast: boolean;
  pending: boolean;
  onMove: (direction: "up" | "down") => void;
  className?: string;
}) {
  return (
    <div className={`flex items-center ${className}`}>
      <button
        type="button"
        onClick={() => onMove("up")}
        disabled={isFirst || pending}
        aria-label={`Move ${item.name} up`}
        className="flex h-11 w-9 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 disabled:opacity-25"
      >
        ↑
      </button>
      <button
        type="button"
        onClick={() => onMove("down")}
        disabled={isLast || pending}
        aria-label={`Move ${item.name} down`}
        className="flex h-11 w-9 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 disabled:opacity-25"
      >
        ↓
      </button>
    </div>
  );
}

/**
 * A single item in the manage list. Shows details with Edit / Archive actions;
 * Edit swaps in the shared form inline. Archived rows show a Restore action
 * instead. Archiving asks for confirmation first (forgiving UX).
 */
export default function ItemRow({
  item,
  categories,
  units,
  archived = false,
  isFirst = false,
  isLast = false,
}: {
  item: Item;
  categories: Category[];
  units: string[];
  archived?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
}) {
  const { editingId, setEditingId } = useEdit();
  const editing = editingId === item.id;
  const [pending, startTransition] = useTransition();

  function onMove(direction: "up" | "down") {
    startTransition(() => moveItem(item.id, direction));
  }

  if (editing) {
    return (
      <li className="border-t border-neutral-100 bg-neutral-50 px-4 py-3">
        <ItemForm
          categories={categories}
          units={units}
          item={item}
          onDone={() => setEditingId(null)}
        />
      </li>
    );
  }

  const low = !archived && isLow(item);

  function onArchive() {
    if (!confirm(`Archive “${item.name}”? It will be hidden from the homepage.`))
      return;
    startTransition(() => archiveItemAction(item.id));
  }

  function onRestore() {
    startTransition(() => restoreItemAction(item.id));
  }

  function onDelete() {
    if (
      !confirm(
        `Permanently delete “${item.name}”? Seasonal items can be archived instead.`,
      )
    )
      return;
    startTransition(() => deleteItemAction(item.id));
  }

  return (
    // Two-line layout: item info on top, actions on their own line below, so
    // nothing clips even with large phone text.
    <li className="border-t border-neutral-100 px-3 py-2.5">
      <div className="flex items-center gap-2">
        <div className="flex min-w-0 items-baseline gap-2">
          <span className="min-w-0 font-medium text-neutral-900">
            {item.name}
          </span>
          {low && (
            <span className="shrink-0 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              Reorder
            </span>
          )}
        </div>
        {/* Enough room from `sm` up to sit these next to the name instead of
            down in the actions row. */}
        {!archived && (
          <MoveButtons
            item={item}
            isFirst={isFirst}
            isLast={isLast}
            pending={pending}
            onMove={onMove}
            className="hidden shrink-0 sm:flex"
          />
        )}
      </div>
      <div className="text-xs text-neutral-500">
        {item.current_qty} {item.unit}
        {item.critical_level != null &&
          ` · reorder at ${item.critical_level}`}
      </div>

      <div className="mt-2 flex items-center gap-2">
        {!archived && (
          <MoveButtons
            item={item}
            isFirst={isFirst}
            isLast={isLast}
            pending={pending}
            onMove={onMove}
            className="sm:hidden"
          />
        )}

        <div className="ml-auto flex items-center gap-2">
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
      </div>
    </li>
  );
}
