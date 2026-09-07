"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FileSpreadsheet, Search, Store } from "lucide-react";
import { useAdminShopStore } from "@/store/adminShopStore";
import { BulkTools } from "@/features/bulk/BulkTools";
import { Input } from "@/components/ui/input";

/**
 * Bulk catalogue tools for an admin, across every shop.
 *
 * A shop owner reaches this from their own dashboard and there is only one
 * catalogue it could mean. An admin has no such default, so the shop is chosen
 * first and everything below is the owner's screen pointed at it — the same
 * `BulkTools`, not a second implementation that would drift from it.
 *
 * The choice lives in `?shop=` rather than component state: an admin who has
 * just imported into a shop and pressed Back expects to be looking at that
 * shop, and a link they paste to somebody else has to open the same thing.
 * It is also what makes this reachable from a shop's own admin pages without
 * a second route.
 */
export default function AdminBulkPage() {
  const { shops, fetchAllShops, isLoading } = useAdminShopStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");

  const shopId = searchParams.get("shop") ?? "";

  useEffect(() => {
    fetchAllShops();
  }, [fetchAllShops]);

  const chosen = useMemo(
    () => shops.find((s) => String(s.id) === shopId) ?? null,
    [shops, shopId],
  );

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const live = shops.filter((s) => !s.is_deleted);
    if (!q) return live;
    return live.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.city?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q),
    );
  }, [shops, query]);

  const pick = (id) => {
    const params = new URLSearchParams(searchParams.toString());
    if (id) params.set("shop", id);
    else params.delete("shop");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  // A shop is chosen: hand over to the owner's own screen. `backHref` returns
  // here rather than to the shop's product list, because here is where they
  // came from.
  if (shopId) {
    return (
      <BulkTools
        shopId={shopId}
        shopName={chosen?.name}
        backHref="/admin/bulk"
        productHref={(id) => `/admin/shops/${shopId}/products/${id}/view`}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-6">
        <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight">
          <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
            <FileSpreadsheet className="size-5" />
          </span>
          Bulk catalogue tools
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Download a shop&apos;s catalogue, edit it in Excel or Google Sheets,
          and upload it back. Choose which shop first.
        </p>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search shops by name, city or email…"
          className="pl-9"
          aria-label="Search shops"
        />
      </div>

      {isLoading && shops.length === 0 ? (
        <p className="rounded-xl border border-border p-8 text-center text-sm text-muted-foreground">
          Loading shops…
        </p>
      ) : matches.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {shops.length === 0
            ? "There are no shops yet."
            : "No shop matches that search."}
        </p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
          {matches.map((shop) => (
            <li key={shop.id}>
              <button
                onClick={() => pick(shop.id)}
                className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-muted"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                  <Store className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{shop.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {[shop.city, shop.email].filter(Boolean).join(" · ")}
                  </span>
                </span>
                {/* An inactive shop is still one an admin may need to fix in
                    bulk — say so rather than hiding it. */}
                {shop.shop_status !== "active" && (
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs capitalize text-muted-foreground">
                    {shop.shop_status}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
