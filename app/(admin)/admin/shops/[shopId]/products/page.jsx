"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import apiClient from "@/api/apiClient";
import { ProgressiveImage } from "@/components/ProgressiveImage";

import {
  ArrowLeft,
  ImageIcon,
  Package,
  PackagePlus,
  Pencil,
  Search,
  Store,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const PAGE_SIZE = 20;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { y: 15, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

/**
 * A shop's catalogue, as the admin sees it.
 *
 * Reads `GET /shops/:shopId/products` directly rather than through
 * productStore. That store is shared with the shop-owner list and its
 * `queryParams` are global mutable state that page writes to — so whichever
 * filters an owner had last applied would leak in here. It also defaults to
 * `is_active: "true"`, and an admin looking at a shop needs to see the
 * deactivated products too; that is usually the reason for looking.
 */
export default function AdminShopProductsPage() {
  const { shopId } = useParams();
  const router = useRouter();

  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  // Separate from `search` so typing does not fire a request per keystroke;
  // the input drives this only on submit.
  const [appliedSearch, setAppliedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    apiClient
      .get(`/admin/shops/${shopId}`)
      // `getShopById` puts the shop straight in `data`, not under a `shop` key.
      .then((r) => {
        if (alive) setShop(r.data.data ?? null);
      })
      .catch(() => {
        // The catalogue is the point of this page; a missing shop name costs
        // the heading a word, not the page.
        if (alive) setShop(null);
      });
    return () => {
      alive = false;
    };
  }, [shopId]);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(PAGE_SIZE),
        sortBy: "created_at",
        sortOrder: "desc",
      });
      // `is_active` is deliberately absent: omitted, the API returns active
      // and inactive alike. Passing "true" is what hides half a catalogue.
      if (appliedSearch.trim()) params.set("search", appliedSearch.trim());

      const res = await apiClient.get(
        `/shops/${shopId}/products?${params.toString()}`
      );
      const data = res.data.data;
      setProducts(data.products ?? []);
      setPagination(data.pagination ?? null);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load this shop's products"
      );
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [shopId, page, appliedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  const totalProducts = pagination?.totalProducts ?? products.length;
  const totalPages = pagination?.totalPages ?? 1;

  return (
    <motion.div
      className="container mx-auto p-4 md:p-6 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          type="button"
          aria-label="Back to shops"
          onClick={() => router.push("/admin/shops")}
          className="rounded-xl hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="p-2 rounded-xl bg-primary shadow-lg shadow-primary/25 shrink-0">
            <Package className="h-6 w-6 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-foreground truncate">
              {shop?.name ? `${shop.name} — Products` : "Products"}
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Store className="h-4 w-4 shrink-0" />
              <span>
                {totalProducts} {totalProducts === 1 ? "product" : "products"}
              </span>
            </p>
          </div>
        </div>

        <Link
          href={`/admin/shops/${shopId}/products/add`}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/30 transition-all shrink-0"
        >
          <PackagePlus className="h-4 w-4" /> Add product
        </Link>
      </motion.div>

      {/* Search */}
      <motion.form
        variants={itemVariants}
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setAppliedSearch(search);
        }}
        className="flex gap-3"
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            aria-label="Search products"
            className="pl-9 rounded-xl bg-muted/50"
          />
        </div>
        <Button type="submit" variant="outline" className="rounded-xl">
          Search
        </Button>
      </motion.form>

      {/* Table */}
      <motion.div
        variants={itemVariants}
        className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="p-4 w-16">Image</th>
                <th className="p-4">Product</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price</th>
                <th className="p-4">Stock</th>
                <th className="p-4">Status</th>
                <th className="p-4 w-20 text-right">Edit</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-10 text-center text-muted-foreground"
                  >
                    Loading products…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-destructive">
                    {error}
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center">
                    <p className="text-foreground font-medium">
                      {appliedSearch
                        ? "No products match that search."
                        : "This shop has no products yet."}
                    </p>
                    {!appliedSearch && (
                      <Link
                        href={`/admin/shops/${shopId}/products/add`}
                        className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                      >
                        <PackagePlus className="h-4 w-4" /> Add the first one
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const hasImage =
                    p.main_image_url && p.main_image_url.trim() !== "";
                  return (
                    <tr
                      key={p.id}
                      className={`border-b border-border last:border-0 hover:bg-muted/50 transition-colors ${
                        p.is_active ? "" : "opacity-70"
                      }`}
                    >
                      <td className="p-4">
                        <div className="h-12 w-12 relative rounded-xl bg-muted flex items-center justify-center overflow-hidden">
                          {hasImage ? (
                            <ProgressiveImage
                              src={p.main_image_url}
                              alt={p.name}
                              className="absolute inset-0 h-full w-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-foreground">
                          {p.name}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {[p.brand, p.unit].filter(Boolean).join(" • ")}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant="outline" className="rounded-lg">
                          {p.category?.name || "Uncategorised"}
                        </Badge>
                      </td>
                      <td className="p-4 font-semibold text-foreground">
                        ₹{p.price?.toLocaleString("en-IN")}
                      </td>
                      <td className="p-4">
                        <Badge
                          className={`rounded-lg font-medium ${
                            p.is_in_stock
                              ? "bg-success/15 text-success border-success/30"
                              : "bg-destructive/15 text-destructive border-destructive/30"
                          }`}
                        >
                          {p.is_in_stock ? "In stock" : "Out of stock"}
                        </Badge>
                      </td>
                      <td className="p-4">
                        {/* Shown because this list deliberately includes
                            deactivated products — without the badge an admin
                            could not tell why a product is not on the
                            storefront. */}
                        <Badge
                          className={`rounded-lg font-medium ${
                            p.is_active
                              ? "bg-primary/15 text-primary border-primary/30"
                              : "bg-muted text-muted-foreground border-border"
                          }`}
                        >
                          {p.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      {/* Editing was previously reachable only from the
                          approval queue, so once a product was approved — or
                          rejected, which drops it out of that queue — an admin
                          had no way back into it. The route already existed. */}
                      <td className="p-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Edit ${p.name}`}
                          className="rounded-lg hover:bg-muted"
                          onClick={() =>
                            router.push(
                              `/admin/shops/${shopId}/products/${p.id}/edit`
                            )
                          }
                        >
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Pagination. Present rather than a silent top-N: a shop with more than
          one page of products must not look like it has exactly this many. */}
      {totalPages > 1 && (
        <motion.div
          variants={itemVariants}
          className="flex items-center justify-between"
        >
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="rounded-xl"
              disabled={page <= 1 || isLoading}
              onClick={() => setPage((n) => Math.max(1, n - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              className="rounded-xl"
              disabled={page >= totalPages || isLoading}
              onClick={() => setPage((n) => Math.min(totalPages, n + 1))}
            >
              Next
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
