import {
  getArchivedItems,
  getCategories,
  getItemsGroupedByCategory,
} from "@/lib/db";
import AddItem from "./add-item";
import AppNav from "../app-nav";
import CategoryManager from "./category-manager";
import CategorySection from "./category-section";
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

  // Distinct units already in use, for the item form's unit dropdown.
  const units = Array.from(
    new Set([
      ...groups.flatMap((g) => g.items.map((i) => i.unit)),
      ...archived.map((i) => i.unit),
    ]),
  ).sort((a, b) => a.localeCompare(b));

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-5 p-4 pb-16">
      <header>
        <AppNav current="/items" />
        <h1 className="mt-1 px-1 text-lg font-bold text-neutral-900">
          Manage items
        </h1>
      </header>

      <AddItem categories={categories} units={units} />

      <EditProvider>
        {/* Items grouped by category */}
        <div className="space-y-4">
        {nonEmptyGroups.map((group) => (
          <CategorySection
            key={group.id}
            group={group}
            categories={categories}
            units={units}
          />
        ))}
        {nonEmptyGroups.length === 0 && (
          <p className="px-1 text-sm text-neutral-500">
            No items yet. Add your first one above.
          </p>
        )}
      </div>

      {/* Only categories that currently have items (empty ones are hidden). */}
      <CategoryManager categories={nonEmptyGroups} />

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
                units={units}
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
