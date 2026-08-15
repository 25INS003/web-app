"use client";

import { Loader2, PackageOpen, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ProductCard } from "./ProductCard";
import { useCategories, useProducts } from "./hooks";

const SORTS = [
  { key: "newest", label: "Newest", sort: "created_at", order: "desc" },
  {
    key: "price_asc",
    label: "Price: Low to High",
    sort: "price",
    order: "asc",
  },
  {
    key: "price_desc",
    label: "Price: High to Low",
    sort: "price",
    order: "desc",
  },
  { key: "rating", label: "Top rated", sort: "rating", order: "desc" },
] as const;

type SortKey = (typeof SORTS)[number]["key"];

export function CatalogBrowser({
  initialSearch = "",
  initialCategory,
  showSearch = true,
  searchPlaceholder = "Search for products, brands…",
}: {
  initialSearch?: string;
  initialCategory?: string;
  /**
   * Whether to render this component's own search box.
   *
   * Off on /search, where StorefrontHeader already puts a search field on the
   * page and two identical boxes stacked above each other is just a question
   * about which one is authoritative. On a category page it stays on: it
   * filters WITHIN that category, whereas the header navigates away to a
   * global search, so they are not the same control.
   */
  showSearch?: boolean;
  /**
   * Placeholder for this component's own search box. Worth setting wherever the
   * header's search is also on screen: the two look alike but do different
   * things — the header leaves for a global search, this one narrows what is
   * already listed — and the placeholder is the only thing telling them apart.
   */
  searchPlaceholder?: string;
}) {
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState<string | undefined>(initialCategory);
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [inStock, setInStock] = useState(false);
  const [priceInput, setPriceInput] = useState({ min: "", max: "" });
  const [price, setPrice] = useState({ min: "", max: "" });

  // debounce the search box
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  // debounce the price range inputs
  useEffect(() => {
    const t = setTimeout(() => setPrice(priceInput), 400);
    return () => clearTimeout(t);
  }, [priceInput]);

  const sort = SORTS.find((s) => s.key === sortKey) ?? SORTS[0];
  const minPrice = price.min === "" ? undefined : Number(price.min);
  const maxPrice = price.max === "" ? undefined : Number(price.max);

  const categories = useCategories();
  const products = useProducts({
    search: search || undefined,
    category,
    sort: sort.sort,
    order: sort.order,
    in_stock: inStock || undefined,
    min_price: Number.isFinite(minPrice) ? minPrice : undefined,
    max_price: Number.isFinite(maxPrice) ? maxPrice : undefined,
  });

  const items = products.data?.pages.flatMap((p) => p.data) ?? [];
  const total = products.data?.pages[0]?.total ?? 0;

  return (
    <div>
      {/* search */}
      {showSearch && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label="Search products"
            className="h-12 w-full rounded-2xl border border-border bg-card pl-11 pr-4 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </div>
      )}

      {/* category chips — the top margin separates them from the search box, so
          it goes away with it rather than leaving a gap above the first row. */}
      <div className={cn("flex flex-wrap gap-2", showSearch && "mt-4")}>
        <Chip active={!category} onClick={() => setCategory(undefined)}>
          All
        </Chip>
        {categories.data?.map((c) => (
          <Chip
            key={c.id}
            active={category === c.id}
            onClick={() => setCategory(c.id)}
          >
            {c.name}
          </Chip>
        ))}
      </div>

      {/* filters + sort */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Chip active={inStock} onClick={() => setInStock((v) => !v)}>
          In stock
        </Chip>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={priceInput.min}
            onChange={(e) =>
              setPriceInput((p) => ({ ...p, min: e.target.value }))
            }
            placeholder="Min ₹"
            aria-label="Minimum price"
            className="h-9 w-24 rounded-full border border-border bg-card px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
          <span className="text-muted-foreground">–</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            value={priceInput.max}
            onChange={(e) =>
              setPriceInput((p) => ({ ...p, max: e.target.value }))
            }
            placeholder="Max ₹"
            aria-label="Maximum price"
            className="h-9 w-24 rounded-full border border-border bg-card px-3 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </div>
        <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
          Sort
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            aria-label="Sort products"
            className="h-9 rounded-full border border-border bg-card px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* result count */}
      <p className="mt-5 text-sm text-muted-foreground">
        {products.isPending
          ? "Loading…"
          : `${total} ${total === 1 ? "product" : "products"}`}
      </p>

      {/* grid */}
      {products.isPending ? (
        <SkeletonGrid />
      ) : products.isError ? (
        <EmptyState
          title="Couldn't load products"
          sub="Please try again in a moment."
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="No products found"
          sub="Try a different search or category."
        />
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
          {products.hasNextPage && (
            <div className="mt-8 flex justify-center">
              <Button
                variant="outline"
                size="lg"
                onClick={() => products.fetchNextPage()}
                disabled={products.isFetchingNextPage}
              >
                {products.isFetchingNextPage && (
                  <Loader2 className="animate-spin" />
                )}
                Load more
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground hover:border-primary/40",
      )}
    >
      {children}
    </button>
  );
}

function SkeletonGrid() {
  return (
    <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-border bg-card"
        >
          <div className="aspect-[4/3] animate-pulse bg-muted" />
          <div className="space-y-2 p-3.5">
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
            <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="mt-16 flex flex-col items-center text-center">
      <span className="mb-3 grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
        <PackageOpen className="size-7" />
      </span>
      <p className="font-display text-lg font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
    </div>
  );
}
