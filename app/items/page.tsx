import Link from "next/link";
import {
  getArchivedItems,
  getCategories,
  getItemsGroupedByCategory,
} from "@/lib/db";
import AddItem from "./add-item";
import CategoryManager from "./category-manager";
import { EditProvider } from "./edit-context";
import ItemRow from "./item-row";

// Manage screen: add/edit/archive items and manage categories. Reads are done
// on the server; every row's actions revalidate this page and the count screen.
export default async function ItemsPage() {
  const [categories, groups, archived] = await Promise.all([
    getCategories(),
    getItemsGroupedByCategory(),
    getArchivedItems(),
  ]);

  const nonEmptyGroups = groups.filter((g) => g.items.length > 0);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 p-4 pb-16">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-bold text-neutral-900">Manage items</h1>
        <Link
          href="/"
          aria-label="Go to count screen"
          className="flex min-h-11 items-center rounded-lg px-3 text-neutral-600 hover:bg-neutral-100"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <path d="M9 22V12h6v10" />
          </svg>
        </Link>
      </header>

      <AddItem categories={categories} />

      <EditProvider>
        {/* Items grouped by category */}
        <div className="space-y-4">
        {nonEmptyGroups.map((group) => (
          <section
            key={group.id}
            className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm"
          >
            <h2 className="bg-neutral-50 px-4 py-2 font-semibold text-neutral-900">
              {group.name}
            </h2>
            <ul>
              {group.items.map((item) => (
                <ItemRow key={item.id} item={item} categories={categories} />
              ))}
            </ul>
          </section>
        ))}
        {nonEmptyGroups.length === 0 && (
          <p className="px-1 text-sm text-neutral-500">
            No items yet. Add your first one above.
          </p>
        )}
      </div>

      <CategoryManager categories={categories} />

      {/* Archived items */}
      {archived.length > 0 && (
        <details className="rounded-xl border border-neutral-200 bg-white shadow-sm">
          <summary className="cursor-pointer px-4 py-3 font-semibold text-neutral-700">
            Archived ({archived.length})
          </summary>
          <ul>
            {archived.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                categories={categories}
                archived
              />
            ))}
          </ul>
        </details>
      )}
      </EditProvider>
    </main>
  );
}
