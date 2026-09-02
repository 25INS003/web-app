"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import apiClient from "@/api/apiClient";
import { ProgressiveImage } from "@/components/ProgressiveImage";

import {
  CheckCircle,
  ImageIcon,
  Package,
  Store,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const itemVariants = { hidden: { y: 12, opacity: 0 }, visible: { y: 0, opacity: 1 } };

/**
 * Products a shop owner has submitted, waiting on a decision.
 *
 * A product created by an owner is written `approval_status: 'pending'` and
 * `is_active: false`, and the second flag is what keeps it off the storefront —
 * every customer-facing read filters on it. Approving here sets both; rejecting
 * records a reason the owner can act on and leaves the product unlisted.
 */
export default function PendingProductsPage() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // Which product's reject box is open, and what has been typed into it.
  const [rejecting, setRejecting] = useState(null);
  const [note, setNote] = useState("");
  // The product currently being decided, so its buttons can be disabled
  // without freezing the whole queue.
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.get("/admin/products/pending-approval");
      setProducts(res.data.data.products ?? []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load pending products");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (product, status, reason) => {
    setBusyId(product.id);
    try {
      await apiClient.put(`/admin/products/${product.id}/approval`, {
        status,
        ...(reason ? { note: reason } : {}),
      });
      // Dropped from the list rather than refetched: the decision removes it
      // from the queue by definition, and a refetch would reorder everything
      // under the reviewer mid-pass.
      setProducts((current) => current.filter((p) => p.id !== product.id));
      setRejecting(null);
      setNote("");
      toast.success(
        status === "approved"
          ? `"${product.name}" is now listed`
          : `"${product.name}" was rejected`
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Could not save that decision");
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
        <div className="p-2 rounded-xl bg-primary shadow-lg shadow-primary/25">
          <Package className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Product approvals
          </h1>
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? "Loading…"
              : products.length === 0
                ? "Nothing waiting"
                : `${products.length} waiting for review`}
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
            Every submitted product has been reviewed.
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            New products from shop owners will appear here.
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
              <div className="h-24 w-24 shrink-0 relative rounded-xl bg-muted flex items-center justify-center overflow-hidden">
                {p.main_image_url ? (
                  <ProgressiveImage
                    src={p.main_image_url}
                    alt={p.name}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-foreground">{p.name}</h2>
                <p className="mt-0.5 text-sm text-muted-foreground flex flex-wrap items-center gap-2">
                  <Store className="h-4 w-4 shrink-0" />
                  <span className="font-medium text-primary">
                    {p.shop?.name ?? "Unknown shop"}
                  </span>
                  {p.brand && <span>• {p.brand}</span>}
                  <Badge variant="outline" className="rounded-lg">
                    {p.category?.name || "Uncategorised"}
                  </Badge>
                </p>
                {p.description && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {p.description}
                  </p>
                )}
                <p className="mt-2 text-sm">
                  <span className="font-semibold text-foreground">
                    ₹{p.price?.toLocaleString("en-IN")}
                  </span>
                  <span className="text-muted-foreground">
                    {" "}
                    • {p.total_stock_quantity ?? 0} in stock
                  </span>
                </p>
              </div>

              <div className="flex shrink-0 gap-2">
                <Button
                  className="rounded-xl bg-success text-success-foreground hover:bg-success/90"
                  disabled={busyId === p.id}
                  onClick={() => decide(p, "approved")}
                >
                  <CheckCircle className="mr-2 h-4 w-4" /> Approve
                </Button>
                <Button
                  variant="outline"
                  className="rounded-xl text-destructive hover:text-destructive"
                  disabled={busyId === p.id}
                  onClick={() => {
                    setRejecting(rejecting === p.id ? null : p.id);
                    setNote("");
                  }}
                >
                  <XCircle className="mr-2 h-4 w-4" /> Reject
                </Button>
              </div>
            </div>

            {rejecting === p.id && (
              <div className="mt-4 border-t border-border pt-4 space-y-3">
                <label
                  htmlFor={`note-${p.id}`}
                  className="text-sm font-medium text-foreground"
                >
                  Why is this being rejected?
                </label>
                {/* The owner sees this text, and it is the only thing telling
                    them what to change — so the reject button stays disabled
                    until something has been written. */}
                <Textarea
                  id={`note-${p.id}`}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="e.g. The photo does not match the description"
                  className="rounded-xl bg-muted/50"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    className="rounded-xl"
                    onClick={() => {
                      setRejecting(null);
                      setNote("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="rounded-xl bg-destructive text-white hover:bg-destructive/90"
                    disabled={!note.trim() || busyId === p.id}
                    onClick={() => decide(p, "rejected", note.trim())}
                  >
                    Confirm rejection
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
