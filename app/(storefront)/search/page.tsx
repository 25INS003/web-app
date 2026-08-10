import { CatalogBrowser } from "@/features/catalog/CatalogBrowser";

export const metadata = { title: "Shop · Nedyway" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <h1 className="font-display text-2xl font-bold tracking-tight">
        Shop fresh
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Browse products from shops near you.
      </p>
      {/* showSearch={false}: StorefrontHeader already renders a search field on
          every storefront page, so this route had two identical boxes stacked
          above one another.

          The key is what makes the header's box actually work here. The browser
          seeds its state from these props with useState, which only reads them
          on mount — so submitting the header search navigated to a new ?q= and
          then re-rendered the same mounted component, which kept its old query
          and showed unchanged results. Keying on the params remounts it, which
          is the pattern CategoryView already uses for the same reason. */}
      <CatalogBrowser
        key={`${sp.q ?? ""}|${sp.category ?? ""}`}
        initialSearch={sp.q}
        initialCategory={sp.category}
        showSearch={false}
      />
    </div>
  );
}
