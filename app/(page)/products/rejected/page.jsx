"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import apiClient from "@/api/apiClient";
import { useShopStore } from "@/store/shopStore";
import { ProgressiveImage } from "@/components/ProgressiveImage";

import {
  ArrowLeft,
  CheckCircle,
  ImageIcon,
  Pencil,
  RotateCcw,
  Trash2,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { productRef } from "@/lib/utils";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const itemVariants = { hidden: { y: 12, opacity: 0 }, visible: { y: 0, opacity: 1 } };

/**
 * Products an admin turned down.
 *
 * Rejection never deleted anything — the row, its reason and its images all
 * survived. What was missing was anywhere to find them: they sat mixed into the
 * catalogue behind a badge, and an owner who wanted to fix one had no way back
 * into the review queue.
 *
 * Three things are possible here, which is the point of it being a place rather
 * than a filter: read why it was turned down, fix it and ask again, or delete
 * it. Doing nothing is the default and costs nothing — a rejected product is
 * off the storefront either way.
 */
export default function RejectedProductsPage() {
  const router = useRouter();
  const currentShop = useShopStore((s) => s.currentShop);
  const fetchMyShops = useShopStore((s) => s.fetchMyShops);
  const myShops = useShopStore((s) => s.myShops);
  const shopId = currentShop?.id ?? myShops?.[0]?.id;

  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [confirming, setConfirming] = useState(null);

  useEffect(() => {
    if (!myShops?.length) fetchMyShops();
  }, [fetchMyShops, myShops?.length]);

  const load = useCallback(async () => {
    if (!shopId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(
        `/shops/${shopId}/products?limit=100&approval_status=rejected`
      );
      setProducts(res.data.data.products ?? []);
    } catch (err) {
      setError(err.response?.data?.message || "Could not load these products");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    load();
  }, [load]);

  const resubmit = async (p) => {
    setBusyId(p.id);
    try {
      await apiClient.put(`/shops/${shopId}/products/${p.id}/resubmit`);
      // Dropped from the list rather than refetched: it is no longer rejected,
      // so it does not belong on this screen any more.
      setProducts((cur) => cur.filter((x) => x.id !== p.id));
      toast.success(`"${p.name}" was sent back for review`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not resubmit");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (p) => {
    setBusyId(p.id);
    try {
      await apiClient.delete(`/shops/${shopId}/products/${p.id}`);
      setProducts((cur) => cur.filter((x) => x.id !== p.id));
      setConfirming(null);
      toast.success(`"${p.name}" was deleted`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not delete");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <motion.div
      className="container mx-auto p-4 md:p-6 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          type="button"
          aria-label="Back to products"
          onClick={() => router.push("/products")}
          className="rounded-xl hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="p-2 rounded-xl bg-destructive/15">
          <XCircle className="h-6 w-6 text-destructive" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Not approved
          </h1>
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? "Loading…"
              : products.length === 0
                ? "Nothing here"
                : `${products.length} product${products.length === 1 ? "" : "s"} kept for you`}
          </p>
        </div>
      </motion.div>

      {error && (
        <motion.div
          variants={itemVariants}
          className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          {error}
        </motion.div>
      )}

      {!isLoading && !error && products.length === 0 && (
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-border bg-card p-12 text-center"
        >
          <CheckCircle className="mx-auto h-10 w-10 text-success" />
          <p className="mt-3 font-medium text-foreground">
            None of your products have been turned down.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Anything an admin does not approve is kept here, with the reason,
            rather than being deleted.
          </p>
        </motion.div>
      )}

      <div className="space-y-4">
        {products.map((p) => (
          <motion.div
            key={p.id}
            variants={itemVariants}
            className="rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted">
                {p.main_image_url ? (
                  <ProgressiveImage
                    src={p.main_image_url}
                    alt={p.name}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="grid h-full w-full place-items-center">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-foreground">{p.name}</h2>
                  {/* The same handle the admin sees, so a question about a
                      product can name it rather than describe it. */}
                  <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                    {productRef(p.id)}
                  </span>
                </div>
                <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  {p.brand && <span>{p.brand}</span>}
                  <Badge variant="outline" className="rounded-lg">
                    {p.category?.name || "Uncategorised"}
                  </Badge>
                  <span className="font-semibold text-foreground">
                    ₹{p.price?.toLocaleString("en-IN")}
                  </span>
                </p>

                {/* The reason is why this screen exists — it is the only thing
                    telling the owner what to change. */}
                <div className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-destructive">
                    Why it was not approved
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    {p.approval_note || "No reason was given."}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                <Button
                  variant="outline"
                  className="rounded-xl"
                  disabled={busyId === p.id}
                  onClick={() =>
                    router.push(`/products/${shopId}/edit/${p.id}`)
                  }
                >
                  <Pencil className="mr-2 h-4 w-4" /> Fix it
                </Button>
                <Button
                  className="rounded-xl"
                  disabled={busyId === p.id}
                  onClick={() => resubmit(p)}
                >
                  <RotateCcw className="mr-2 h-4 w-4" /> Ask again
                </Button>
                <Button
                  variant="ghost"
                  className="rounded-xl text-destructive hover:text-destructive"
                  disabled={busyId === p.id}
                  onClick={() => setConfirming(p.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Deleting is permanent and there is no undo, so it asks. Keeping
                costs nothing, which is the whole premise of this screen. */}
            {confirming === p.id && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                <p className="text-sm text-muted-foreground">
                  Delete &ldquo;{p.name}&rdquo; and its variants for good? There
                  is no undo.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    className="rounded-xl"
                    onClick={() => setConfirming(null)}
                  >
                    Keep it
                  </Button>
                  <Button
                    className="rounded-xl bg-destructive text-white hover:bg-destructive/90"
                    disabled={busyId === p.id}
                    onClick={() => remove(p)}
                  >
                    Delete for good
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
