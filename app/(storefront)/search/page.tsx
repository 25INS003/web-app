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
      <CatalogBrowser initialSearch={sp.q} initialCategory={sp.category} />
    </div>
  );
}
