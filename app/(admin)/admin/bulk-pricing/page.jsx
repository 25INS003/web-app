"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle,
  Layers,
  Loader2,
  Pencil,
  Store,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

/**
 * Bulk pricing a shop has proposed, waiting on a decision.
 *
 * The queue is oldest first, because a queue that is not FIFO quietly starves
 * whoever submitted least recently — the same ordering the product approval
 * queue uses, for the same reason.
 *
 * An admin can change the numbers before approving. That is the difference
 * between this screen and the product queue: a product is right or it is not,
 * but a discount is a negotiation, and sending a ladder back over two
 * percentage points wastes a round trip for both sides. An edited ladder is
 * marked, so the shop is told rather than left to notice.
 *
 * Approving is the only thing that makes a ladder able to price an order, and
 * it retires whatever it replaces in the same transaction.
 */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const itemVariants = { hidden: { y: 12, opacity: 0 }, visible: { y: 0, opacity: 1 } };

const numOrNull = (v) => (v === "" || v === null || v === undefined ? null : Number(v));

/** What a rung costs the shop, per unit, at this product's base price. */
const unitAfter = (price, percent) =>
  price ? `₹${(price * (1 - Number(percent || 0) / 100)).toFixed(2)}` : null;

/**
 * The envelope shops author inside.
 *
 * Lives on this screen rather than with the business details, because it is
 * pricing policy and this is the pricing screen — an admin tightening the
 * ceiling is reacting to what is in the queue below, and making them go and
 * find another page to do it is how a limit ends up never being adjusted.
 */
const PolicyPanel = ({ policy, onSaved }) => {
  const [form, setForm] = useState(policy);
  const [saving, setSaving] = useState(false);

  useEffect(() => setForm(policy), [policy]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await apiClient.put("/admin/settings", {
        bulk_pricing_enabled: Boolean(form.bulk_pricing_enabled),
        bulk_max_discount_bps: Math.round(Number(form.max_discount_percent) * 100),
        bulk_max_slabs: Number(form.bulk_max_slabs),
        bulk_min_quantity: Number(form.bulk_min_quantity),
      });
      toast.success("Bulk pricing limits saved");
      onSaved?.(res.data.data);
    } catch (e) {
      const list = e.response?.data?.errors;
      toast.error(
        Array.isArray(list) && list.length
          ? list.join(" ")
          : e.response?.data?.message || "Could not save the limits."
      );
    } finally {
      setSaving(false);
    }
  };

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <div>
        <h2 className="font-semibold">Limits</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          What a shop is allowed to propose. Anything outside these is refused
          before it reaches the queue, so review stays a commercial question
          rather than a safety check.
        </p>
      </div>

      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={Boolean(form.bulk_pricing_enabled)}
          onChange={(e) => set("bulk_pricing_enabled", e.target.checked)}
          className="h-4 w-4 rounded border-border"
        />
        <span>
          Bulk pricing is available on this platform
          {!form.bulk_pricing_enabled && (
            <span className="ml-2 text-muted-foreground">
              — while this is off, no ladder prices anything, approved or not.
            </span>
          )}
        </span>
      </label>

      <div className="flex flex-wrap gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Maximum discount %</span>
          <input
            type="number"
            step="0.01"
            value={form.max_discount_percent ?? ""}
            onChange={(e) => set("max_discount_percent", e.target.value)}
            className="h-9 w-32 rounded-lg border border-border bg-background px-2 text-sm tabular-nums"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Rungs per ladder</span>
          <input
            type="number"
            value={form.bulk_max_slabs ?? ""}
            onChange={(e) => set("bulk_max_slabs", e.target.value)}
            className="h-9 w-32 rounded-lg border border-border bg-background px-2 text-sm tabular-nums"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Smallest bulk quantity</span>
          <input
            type="number"
            value={form.bulk_min_quantity ?? ""}
            onChange={(e) => set("bulk_min_quantity", e.target.value)}
            className="h-9 w-40 rounded-lg border border-border bg-background px-2 text-sm tabular-nums"
          />
        </label>
      </div>

      <Button onClick={save} disabled={saving} variant="outline" className="gap-2 rounded-xl">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Save limits
      </Button>
    </div>
  );
};

export default function BulkPricingQueuePage() {
  const [rows, setRows] = useState([]);
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [notes, setNotes] = useState({});
  const [edits, setEdits] = useState({});

  const applySettings = (s) =>
    setPolicy({
      bulk_pricing_enabled: s?.bulk_pricing_enabled ?? false,
      // Basis points in the column, a percentage on the form — converted here
      // so the input never shows an admin the number 2000 for 20%.
      max_discount_percent: (s?.bulk_max_discount_bps ?? 2000) / 100,
      bulk_max_slabs: s?.bulk_max_slabs ?? 5,
      bulk_min_quantity: s?.bulk_min_quantity ?? 2,
    });

  const load = async () => {
    try {
      const [queue, settings] = await Promise.all([
        apiClient.get("/admin/bulk-pricing/pending"),
        apiClient.get("/admin/settings"),
      ]);
      setRows(queue.data.data?.data ?? []);
      applySettings(settings.data.data);
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not load the queue.");
    }
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const [queue, settings] = await Promise.all([
          apiClient.get("/admin/bulk-pricing/pending"),
          apiClient.get("/admin/settings"),
        ]);
        if (cancelled) return;
        setRows(queue.data.data?.data ?? []);
        applySettings(settings.data.data);
      } catch (e) {
        if (!cancelled) {
          toast.error(e.response?.data?.message || "Could not load the queue.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Local edits for one ladder, seeded from what the shop proposed. */
  const rungsFor = (row) =>
    edits[row.id] ??
    row.slabs.map((s) => ({
      min_qty: s.min_qty,
      max_qty: s.max_qty ?? "",
      discount_percent: s.discount_percent,
    }));

  const patchRung = (row, i, changes) =>
    setEdits((prev) => ({
      ...prev,
      [row.id]: rungsFor(row).map((r, n) => (n === i ? { ...r, ...changes } : r)),
    }));

  const saveEdit = async (row) => {
    setBusyId(row.id);
    try {
      await apiClient.put(`/admin/bulk-pricing/${row.id}`, {
        slabs: rungsFor(row).map((r) => ({
          min_qty: Number(r.min_qty) || 0,
          max_qty: numOrNull(r.max_qty),
          discount_percent: Number(r.discount_percent) || 0,
        })),
      });
      toast.success("Rungs updated");
      setEdits((prev) => {
        const next = { ...prev };
        delete next[row.id];
        return next;
      });
      await load();
    } catch (e) {
      const list = e.response?.data?.errors;
      toast.error(
        Array.isArray(list) && list.length
          ? list.join(" ")
          : e.response?.data?.message || "Could not save the change."
      );
    } finally {
      setBusyId(null);
    }
  };

  const decide = async (row, action) => {
    if (action === "reject" && !notes[row.id]?.trim()) {
      toast.error("Say why, so the shop can fix it and resubmit.");
      return;
    }
    setBusyId(row.id);
    try {
      await apiClient.post(`/admin/bulk-pricing/${row.id}/${action}`, {
        note: notes[row.id],
      });
      toast.success(action === "approve" ? "Bulk pricing is live" : "Rejected");
      await load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not record that.");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading the queue…
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="container mx-auto max-w-5xl space-y-6 p-6"
    >
      <div>
        <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary shadow-lg shadow-primary/25">
            <Layers className="h-6 w-6 text-primary-foreground" />
          </span>
          Bulk pricing approvals
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Quantity discounts shops have proposed. The discount comes out of the
          shop&apos;s own margin. Nothing here prices an order until it is
          approved, and approving replaces whatever that product is using now.
        </p>
      </div>

      {policy && <PolicyPanel policy={policy} onSaved={applySettings} />}

      {rows.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
          Nothing waiting for review.
        </div>
      )}

      {rows.map((row) => {
        const rungs = rungsFor(row);
        const dirty = Boolean(edits[row.id]);
        const busy = busyId === row.id;

        return (
          <motion.div
            key={row.id}
            variants={itemVariants}
            className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{row.product?.name}</h2>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Store className="h-3.5 w-3.5" />
                  {row.shop?.name}
                  <span className="text-border">·</span>
                  {/* The base price the rungs come off. Reviewing "10% off"
                      without it is reviewing a number with no units. */}
                  <span className="tabular-nums">₹{row.product?.price} each</span>
                </p>
              </div>
              {row.edited_by_admin && (
                <Badge variant="outline" className="gap-1.5 rounded-lg">
                  <Pencil className="h-3 w-3" />
                  Edited
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              {rungs.map((r, i) => (
                <div
                  key={i}
                  className="flex flex-wrap items-end gap-3 rounded-xl bg-muted/50 p-3"
                >
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">From</span>
                    <input
                      type="number"
                      value={r.min_qty}
                      onChange={(e) => patchRung(row, i, { min_qty: e.target.value })}
                      className="h-9 w-24 rounded-lg border border-border bg-background px-2 text-sm tabular-nums"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Up to</span>
                    <input
                      type="number"
                      value={r.max_qty ?? ""}
                      onChange={(e) => patchRung(row, i, { max_qty: e.target.value })}
                      className="h-9 w-24 rounded-lg border border-border bg-background px-2 text-sm tabular-nums"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">Discount %</span>
                    <input
                      type="number"
                      step="0.01"
                      value={r.discount_percent}
                      onChange={(e) =>
                        patchRung(row, i, { discount_percent: e.target.value })
                      }
                      className="h-9 w-24 rounded-lg border border-border bg-background px-2 text-sm tabular-nums"
                    />
                  </label>
                  <span className="pb-2 text-sm tabular-nums text-muted-foreground">
                    {unitAfter(row.product?.price, r.discount_percent)} each
                  </span>
                </div>
              ))}
            </div>

            {dirty && (
              <div className="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/5 p-3">
                <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
                <span className="text-sm">
                  Save your changes before approving — approving sends the
                  shop&apos;s numbers, not yours.
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => saveEdit(row)}
                  className="ml-auto rounded-lg"
                >
                  Save rungs
                </Button>
              </div>
            )}

            <Textarea
              rows={2}
              placeholder="Why are you rejecting this? The shop sees it."
              value={notes[row.id] ?? ""}
              onChange={(e) =>
                setNotes((prev) => ({ ...prev, [row.id]: e.target.value }))
              }
              className="rounded-xl"
            />

            <div className="flex flex-wrap gap-3">
              <Button
                disabled={busy || dirty}
                onClick={() => decide(row, "approve")}
                className="gap-2 rounded-xl"
              >
                {busy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Approve and make live
              </Button>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => decide(row, "reject")}
                className="gap-2 rounded-xl text-destructive"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </Button>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
}
