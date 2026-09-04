"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import apiClient from "@/api/apiClient";
import { ProgressiveImage } from "@/components/ProgressiveImage";

import {
  CheckCircle,
  ImageIcon,
  Package,
  Pencil,
  Store,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { productRef } from "@/lib/utils";
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
  const router = useRouter();
  // Which shelf is on screen. `pending` is the queue an admin works; `rejected`
  // is the archive — kept rather than deleted, so a decision can be revisited.
  const [tab, setTab] = useState("pending");
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // Which product's reject box is open, and what has been typed into it.
  const [rejecting, setRejecting] = useState(null);
  const [note, setNote] = useState("");
  // The product currently being decided, so its buttons can be disabled
  // without freezing the whole queue.
  const [busyId, setBusyId] = useState(null);
  const [copiedRef, setCopiedRef] = useState(null);
  // "Approve all" asks before it acts. It is one click that puts every product
  // on screen onto the storefront, and there is no single undo — each one would
  // have to be taken down again.
  const [confirmingAll, setConfirmingAll] = useState(false);
  const [approvingAll, setApprovingAll] = useState(false);

  // The full id, not the short reference — the short one is for reading, the
  // full one is what a query or a URL needs.
  const copyRef = async (id) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedRef(id);
      setTimeout(() => setCopiedRef(null), 1500);
    } catch {
      // Clipboard is permission-gated and absent over plain http. The
      // reference is on screen either way.
    }
  };

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(
        `/admin/products/pending-approval?status=${tab}`
      );
      setProducts(res.data.data.products ?? []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load products");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [tab]);

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

  /**
   * Approve everything currently on screen.
   *
   * The ids are sent explicitly, not "approve everything pending". Those are
   * different decisions: the queue is a live list, and a product submitted
   * between this page loading and the button being pressed would be approved
   * by someone who never saw it.
   */
  const approveAll = async () => {
    setApprovingAll(true);
    try {
      const res = await apiClient.put("/admin/products/approve", {
        product_ids: products.map((p) => p.id),
      });
      const data = res.data.data ?? {};
      const done = new Set(data.approved_ids ?? []);
      const skipped = data.skipped ?? [];
      // Only what actually changed leaves the list. Anything the server skipped
      // — deleted, or already decided by somebody else — stays on screen rather
      // than vanishing as though it had been approved.
      setProducts((current) => current.filter((p) => !done.has(p.id)));
      setConfirmingAll(false);
      toast.success(
        done.size === 1
          ? "1 product is now listed"
          : `${done.size} products are now listed`
      );
      if (skipped.length > 0) {
        toast.warning(
          `${skipped.length} could not be approved — deleted, or already decided by someone else. They are still in the list.`,
          { duration: 8000 }
        );
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Could not approve those products"
      );
    } finally {
      setApprovingAll(false);
    }
  };

  return (
    <motion.div
      className="container mx-auto p-4 md:p-6 space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div
        variants={itemVariants}
        className="flex flex-wrap items-center gap-3"
      >
        <div className="p-2 rounded-xl bg-primary shadow-lg shadow-primary/25">
          <Package className="h-6 w-6 text-primary-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Product approvals
          </h1>
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? "Loading…"
              : tab === "pending"
                ? products.length === 0
                  ? "Nothing waiting"
                  : `${products.length} waiting for review`
                : tab === "rejected"
                  ? products.length === 0
                    ? "Nothing has been turned down"
                    : `${products.length} kept after rejection`
                  : products.length === 0
                    ? "Nothing approved yet"
                    : `${products.length} approved and listed`}
          </p>
        </div>

        {/* Only on the queue. "Approve all" on the rejected shelf would mean
            reversing a set of decisions somebody made one at a time, and on the
            approved tab it would mean nothing at all. */}
        {tab === "pending" && products.length > 0 && (
          <Button
            type="button"
            onClick={() => setConfirmingAll(true)}
            disabled={approvingAll || confirmingAll}
            className="rounded-xl bg-success text-white hover:bg-success/90"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Approve all ({products.length})
          </Button>
        )}
      </motion.div>

      {/* Asked, not assumed. One click here lists every product on screen, and
          undoing it is one take-down per product — the cost of the two mistakes
          is not symmetric, so the reversible one is the default. */}
      {confirmingAll && (
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-success/30 bg-success/10 p-5"
        >
          <p className="font-medium text-foreground">
            Approve all {products.length} products waiting?
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Every one of them goes on the storefront and its owner is notified.
            Taking them back down is one product at a time.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={approveAll}
              disabled={approvingAll}
              className="rounded-xl bg-success text-white hover:bg-success/90"
            >
              {approvingAll
                ? "Approving…"
                : `Yes, approve all ${products.length}`}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="rounded-xl"
              disabled={approvingAll}
              onClick={() => setConfirmingAll(false)}
            >
              Review them one by one
            </Button>
          </div>
        </motion.div>
      )}

      <motion.div variants={itemVariants} className="flex gap-1 rounded-xl bg-muted p-1 w-fit">
        {[
          { key: "pending", label: "Waiting" },
          { key: "rejected", label: "Not approved" },
          // Where an approved product goes. Without it the tabs show only the
          // two unresolved states, so following one to its conclusion means
          // watching it disappear.
          { key: "approved", label: "Approved" },
        ].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            aria-pressed={tab === key}
            className={`rounded-lg px-4 py-1.5 text-sm font-medium transition ${
              tab === key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
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
            {tab === "pending"
              ? "Every submitted product has been reviewed."
              : "Nothing has been turned down."}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {tab === "pending"
              ? "New products from shop owners will appear here."
              : "A rejected product is kept here with its reason, so the decision can be revisited."}
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
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-foreground">{p.name}</h2>
                  {/* The handle for following this product across the tabs. It
                      is the id, shown readably — see productRef. */}
                  <button
                    type="button"
                    title="Copy the full product id"
                    onClick={() => copyRef(p.id)}
                    className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground transition hover:bg-accent hover:text-foreground"
                  >
                    {copiedRef === p.id ? "Copied" : productRef(p.id)}
                  </button>
                </div>
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
                {tab === "rejected" && (
                  <div className="mt-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-destructive">
                      Reason given
                    </p>
                    <p className="mt-1 text-sm text-foreground">
                      {p.approval_note || "No reason was recorded."}
                    </p>
                  </div>
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
                {/* A submission that is nearly right is better corrected than
                    rejected and sent back around the loop. Editing decides
                    nothing — the update route leaves approval_status alone, so
                    the product is still waiting when the admin comes back. */}
                <Button
                  variant="outline"
                  className="rounded-xl"
                  disabled={busyId === p.id}
                  onClick={() =>
                    router.push(
                      `/admin/shops/${p.shop_id}/products/${p.id}/edit`
                    )
                  }
                >
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </Button>
                {tab !== "approved" && (
                <Button
                  className="rounded-xl bg-success text-success-foreground hover:bg-success/90"
                  disabled={busyId === p.id}
                  onClick={() => decide(p, "approved")}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {tab === "pending" ? "Approve" : "Approve anyway"}
                </Button>
                )}
                {/* Each shelf offers only the moves that mean something from
                    it. Pending can go either way; a rejected product can be
                    approved after a fix but not rejected again; an approved one
                    can be taken down, which delists it. */}
                {tab !== "rejected" && (
                  <Button
                    variant="outline"
                    className="rounded-xl text-destructive hover:text-destructive"
                    disabled={busyId === p.id}
                    onClick={() => {
                      setRejecting(rejecting === p.id ? null : p.id);
                      setNote("");
                    }}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    {tab === "approved" ? "Take down" : "Reject"}
                  </Button>
                )}
              </div>
            </div>

            {rejecting === p.id && (
              <div className="mt-4 border-t border-border pt-4 space-y-3">
                <label
                  htmlFor={`note-${p.id}`}
                  className="text-sm font-medium text-foreground"
                >
                  {tab === "approved"
                    ? "Why is this being taken down?"
                    : "Why is this being rejected?"}
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
                    {tab === "approved" ? "Take it down" : "Confirm rejection"}
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
