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
const itemVariants = {
  hidden: { y: 12, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

const numOrNull = (v) =>
  v === "" || v === null || v === undefined ? null : Number(v);

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
        bulk_max_discount_bps: Math.round(
          Number(form.max_discount_percent) * 100,
        ),
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
          : e.response?.data?.message || "Could not save the limits.",
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
          The most a shop is allowed to give. Anything bigger than this never
          reaches you.
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
              — while this is off, nobody gets a bulk discount, approved or not.
            </span>
          )}
        </span>
      </label>

      <div className="flex flex-wrap gap-4">
        {/* A line under each, because none of the three labels says what it
            counts. "Maximum discount" is per discount, not per product;
            "smallest quantity" is where a discount may START, which reads
            like a minimum order until it is spelled out. The box keeps its
            width; the label is capped so the hint wraps beneath it. */}
        <label className="flex max-w-[15rem] flex-col gap-1">
          <span className="text-xs font-medium">Maximum discount %</span>
          <input
            type="number"
            step="0.01"
            value={form.max_discount_percent ?? ""}
            onChange={(e) => set("max_discount_percent", e.target.value)}
            className="h-9 w-32 rounded-lg border border-border bg-background px-2 text-sm tabular-nums"
          />
          <span className="text-xs text-muted-foreground">
            The biggest discount a shop can put on one quantity.
          </span>
        </label>
        <label className="flex max-w-[15rem] flex-col gap-1">
          <span className="text-xs font-medium">Discounts per product</span>
          <input
            type="number"
            value={form.bulk_max_slabs ?? ""}
            onChange={(e) => set("bulk_max_slabs", e.target.value)}
            className="h-9 w-32 rounded-lg border border-border bg-background px-2 text-sm tabular-nums"
          />
          <span className="text-xs text-muted-foreground">
            How many quantity steps a product can have.
          </span>
        </label>
        <label className="flex max-w-[15rem] flex-col gap-1">
          <span className="text-xs font-medium">Smallest quantity</span>
          <input
            type="number"
            value={form.bulk_min_quantity ?? ""}
            onChange={(e) => set("bulk_min_quantity", e.target.value)}
            className="h-9 w-40 rounded-lg border border-border bg-background px-2 text-sm tabular-nums"
          />
          <span className="text-xs text-muted-foreground">
            The lowest quantity a discount can start at. Not a minimum order.
          </span>
        </label>
      </div>

      <Button
        onClick={save}
        disabled={saving}
        variant="outline"
        className="gap-2 rounded-xl"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Save limits
      </Button>
    </div>
  );
};

/** The states a ladder can be browsed by. No window, so no "starts later". */
const STATES = [
  { key: "", label: "All" },
  { key: "live", label: "Live" },
  { key: "pending", label: "Waiting" },
  { key: "finished", label: "Finished" },
];

/** The rungs in one line: "10+ 5% · 25+ 10%". */
const rungSummary = (slabs = []) =>
  slabs.length
    ? slabs
        .map(
          (s) =>
            `${s.min_qty}${s.max_qty ? `–${s.max_qty - 1}` : "+"} ${s.discount_percent}%`,
        )
        .join(" · ")
    : "—";

export default function BulkPricingQueuePage() {
  const [rows, setRows] = useState([]);
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [notes, setNotes] = useState({});
  const [edits, setEdits] = useState({});

  // The browse half: every ladder a shop has, in any state.
  const [view, setView] = useState("queue");
  const [shops, setShops] = useState([]);
  const [shopId, setShopId] = useState("");
  const [stateKey, setStateKey] = useState("");
  const [browsed, setBrowsed] = useState([]);
  const [browsing, setBrowsing] = useState(false);

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

  // Shops for the picker, fetched once: the list is small and does not change
  // while somebody reads a page of ladders.
  useEffect(() => {
    let cancelled = false;
    apiClient
      .get("/admin/shops")
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res.data.data)
          ? res.data.data
          : (res.data.data?.data ?? []);
        setShops(list.map((sh) => ({ id: sh.id, name: sh.name })));
      })
      .catch(() => {
        // A missing picker is a degraded browse, not a broken page.
        if (!cancelled) setShops([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (view !== "all") return;
    let cancelled = false;
    setBrowsing(true);
    apiClient
      .get("/admin/bulk-pricing", {
        params: { shop_id: shopId || undefined, state: stateKey || undefined },
      })
      .then((res) => {
        if (!cancelled) setBrowsed(res.data.data?.data ?? []);
      })
      .catch((e) => {
        if (!cancelled) {
          toast.error(
            e.response?.data?.message || "Could not load the bulk pricing.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setBrowsing(false);
      });
    return () => {
      cancelled = true;
    };
  }, [view, shopId, stateKey]);

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
      [row.id]: rungsFor(row).map((r, n) =>
        n === i ? { ...r, ...changes } : r,
      ),
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
      toast.success("Discounts updated");
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
          : e.response?.data?.message || "Could not save the change.",
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
          Shops giving a discount when a customer buys more. The shop pays for
          it, not the platform.
        </p>
      </div>

      {/* The flow, in three lines. Only the last step is visible from this
          screen; where the tiers came from and what the limits below do are
          not, and that is the whole reason the panel is here. */}
      <div className="rounded-2xl border border-border bg-card p-5 text-sm">
        <p className="font-medium">How it works</p>
        <ol className="mt-1.5 list-decimal space-y-1 pl-5 text-muted-foreground">
          <li>
            A shop sets up discounts on a product — buy 10 or more, get 5% off —
            and sends them here.
          </li>
          <li>The limits below are the most any shop can give.</li>
          <li>
            Approve, and customers start getting it. Reject, and the shop sees
            your note.
          </li>
        </ol>
        <p className="mt-2.5 text-xs text-muted-foreground">
          If you change the numbers, save them first — otherwise approving uses
          the shop&apos;s.
        </p>
      </div>

      {policy && <PolicyPanel policy={policy} onSaved={applySettings} />}

      {/* Two views of one thing: the queue is work to do, oldest first; the
          list is "what is this shop offering?", newest first. Merging them
          would make one of the two orderings wrong. The Discounts screen is
          built the same way, so an admin learns this once. */}
      <div className="flex gap-2">
        {[
          {
            key: "queue",
            label: `Waiting for review${rows.length ? ` (${rows.length})` : ""}`,
          },
          { key: "all", label: "All bulk pricing" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setView(tab.key)}
            className={
              view === tab.key
                ? "rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                : "rounded-xl border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {view === "all" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium">Shop</span>
              <select
                value={shopId}
                onChange={(e) => setShopId(e.target.value)}
                className="h-9 rounded-lg border border-border bg-background px-2 text-sm"
              >
                <option value="">Every shop</option>
                {shops.map((sh) => (
                  <option key={sh.id} value={sh.id}>
                    {sh.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex flex-wrap gap-2">
              {STATES.map((st) => (
                <button
                  key={st.key || "all"}
                  type="button"
                  onClick={() => setStateKey(st.key)}
                  className={
                    stateKey === st.key
                      ? "rounded-full border border-primary bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                      : "rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
                  }
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {browsing ? (
            <div className="flex h-32 items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading…
            </div>
          ) : browsed.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
              No bulk pricing here.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <table className="w-full text-sm [&_td]:px-4 [&_th]:px-4 [&_td:first-child]:pl-6 [&_th:first-child]:pl-6 [&_td:last-child]:pr-6 [&_th:last-child]:pr-6">
                <thead className="bg-muted/60">
                  <tr className="border-b border-border text-left">
                    <th className="py-2.5 font-semibold">Product</th>
                    <th className="py-2.5 font-semibold">Shop</th>
                    <th className="py-2.5 font-semibold">Price</th>
                    <th className="py-2.5 font-semibold">Discounts</th>
                    <th className="py-2.5 font-semibold">State</th>
                  </tr>
                </thead>
                <tbody>
                  {browsed.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-border last:border-0"
                    >
                      <td className="py-2.5 font-medium">
                        {row.product?.name}
                      </td>
                      <td className="py-2.5 text-muted-foreground">
                        {row.shop?.name}
                      </td>
                      <td className="py-2.5 tabular-nums">
                        ₹{row.product?.price}
                      </td>
                      <td className="py-2.5 tabular-nums text-muted-foreground">
                        {rungSummary(row.slabs)}
                      </td>
                      <td className="py-2.5">
                        <LadderState row={row} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {view === "queue" && rows.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
          Nothing waiting for review.
        </div>
      )}

      {view === "queue" &&
        rows.map((row) => {
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
                    <span className="tabular-nums">
                      ₹{row.product?.price} each
                    </span>
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
                      <span className="text-xs text-muted-foreground">
                        From
                      </span>
                      <input
                        type="number"
                        value={r.min_qty}
                        onChange={(e) =>
                          patchRung(row, i, { min_qty: e.target.value })
                        }
                        className="h-9 w-24 rounded-lg border border-border bg-background px-2 text-sm tabular-nums"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">
                        Up to
                      </span>
                      <input
                        type="number"
                        value={r.max_qty ?? ""}
                        onChange={(e) =>
                          patchRung(row, i, { max_qty: e.target.value })
                        }
                        className="h-9 w-24 rounded-lg border border-border bg-background px-2 text-sm tabular-nums"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">
                        Discount %
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={r.discount_percent}
                        onChange={(e) =>
                          patchRung(row, i, {
                            discount_percent: e.target.value,
                          })
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
                    Save changes
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

/**
 * What a ladder IS right now, which is not simply its status.
 *
 * A retired one is still "approved" in the column — it was approved, and then
 * something replaced it. A list that printed the status would show two rows
 * saying "approved" where only one of them is charging anybody.
 */
const LadderState = ({ row }) => {
  if (row.status === "pending") {
    return (
      <Badge variant="outline" className="border-warning/30 text-warning">
        Waiting
      </Badge>
    );
  }
  if (row.status === "rejected") {
    return (
      <Badge
        variant="outline"
        className="border-destructive/30 text-destructive"
      >
        Rejected
      </Badge>
    );
  }
  return row.retired_at ? (
    <Badge variant="outline">Replaced</Badge>
  ) : (
    <Badge variant="outline" className="border-success/30 text-success">
      Live
    </Badge>
  );
};
