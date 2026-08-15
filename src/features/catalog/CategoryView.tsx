"use client";

import { CatalogBrowser } from "./CatalogBrowser";
import { useCategories } from "./hooks";

export function CategoryView({ categoryId }: { categoryId: string }) {
  const categories = useCategories();
  const category = categories.data?.find((c) => c.id === categoryId);
  const name = category?.name;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <h1 className="font-display text-2xl font-bold tracking-tight">
        {name ?? "Category"}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {name ? `Browse ${name} from shops near you.` : "Browse products."}
      </p>
      {/* key by category so the browser's internal filter state resets when
          navigating between category pages. */}
      {/* The header's search is on screen too and looks much the same, so this
          one names its scope: it narrows the category rather than leaving it. */}
      <CatalogBrowser
        key={categoryId}
        initialCategory={categoryId}
        searchPlaceholder={
          name ? `Search in ${name}…` : "Search for products, brands…"
        }
      />
    </div>
  );
}
