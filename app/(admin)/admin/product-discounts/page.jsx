"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarClock,
  CheckCircle2,
  Loader2,
  Pencil,
  Store,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/api/apiClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/**
 * Scheduled discounts a shop has proposed, waiting on a decision.
 *
 * The sibling of the bulk-pricing queue, and the same three things are true:
 * the money is the shop's, nothing here takes anything off a price until it is
 * approved, and approving replaces whatever that product is running now.
 *
 * What differs is the clock. A proposal can sit here long enough for its own
 * window to pass, so the dates are shown as prominently as the percentage and
 * the API refuses to approve one that has already ended.
 */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

const formatWhen = (iso) =>
  iso
    ? new Date(iso).toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";

/** What one unit costs once the percentage is off it. */
const unitAfter = (price, percent) => {
  const p = Number(price);
  const d = Number(percent);
  if (!Number.isFinite(p) || !Number.isFinite(d)) return "—";
  return `₹${(p * (1 - d / 100)).toFixed(2)}`;
};

/** The states a discount can be browsed by, in the order they read. */
const STATES = [
  { key: "", label: "All" },
  { key: "running", label: "Running now" },
  { key: "scheduled", label: "Starts later" },
  { key: "pending", label: "Waiting" },
  { key: "finished", label: "Finished" },
];

export default function ProductDiscountQueuePage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [notes, setNotes] = useState({});
  const [edits, setEdits] = useState({});

  // The browse half: every discount a shop has, in any state.
  const [view, setView] = useState("queue");
  const [shops, setShops] = useState([]);
  const [shopId, setShopId] = useState("");
  const [stateKey, setStateKey] = useState("");
  const [browsed, setBrowsed] = useState([]);
  const [browsing, setBrowsing] = useState(false);

  const load = async () => {
    try {
      const res = await apiClient.get("/admin/product-discounts/pending");
      setRows(res.data.data?.data ?? []);
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not load the queue.");
    }
  };

  // Shops for the picker, fetched once. The list is small and does not change
  // while somebody is reading a page of discounts.
  useEffect(() => {
    let cancelled = false;
    apiClient
      .get("/admin/shops")
      .then((res) => {
        if (cancelled) return;
        const list = Array.isArray(res.data.data)
          ? res.data.data
          : (res.data.data?.data ?? []);
        setShops(list.map((s) => ({ id: s.id, name: s.name })));
      })
      .catch(() => {
        // A missing picker is a degraded browse, not a broken page: without it
        // the list still works, it just cannot be narrowed to one shop.
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
      .get("/admin/product-discounts", {
        params: {
          shop_id: shopId || undefined,
          state: stateKey || undefined,
        },
      })
      .then((res) => {
        if (!cancelled) setBrowsed(res.data.data?.data ?? []);
      })
      .catch((e) => {
        if (!cancelled) {
          toast.error(
            e.response?.data?.message || "Could not load the discounts.",
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
        const res = await apiClient.get("/admin/product-discounts/pending");
        if (!cancelled) setRows(res.data.data?.data ?? []);
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

  /** Local edits for one proposal, seeded from what the shop asked for. */
  const draftFor = (row) =>
    edits[row.id] ?? {
      discount_percent: row.discount_percent,
      starts_at: row.starts_at,
      ends_at: row.ends_at,
    };

  const patch = (row, changes) =>
    setEdits((prev) => ({
      ...prev,
      [row.id]: { ...draftFor(row), ...changes },
    }));

  const saveEdit = async (row) => {
    setBusyId(row.id);
    try {
      await apiClient.put(`/admin/product-discounts/${row.id}`, {
        discount_percent: Number(draftFor(row).discount_percent) || 0,
      });
      toast.success("Discount updated");
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
      await apiClient.post(`/admin/product-discounts/${row.id}/${action}`, {
        note: notes[row.id],
      });
      toast.success(action === "approve" ? "Discount is live" : "Rejected");
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
            <CalendarClock className="h-6 w-6 text-primary-foreground" />
          </span>
          Discounts
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Shops selling a product for less between two dates. The shop pays for
          it, not the platform.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 text-sm">
        <p className="font-medium">How it works</p>
        <ol className="mt-1.5 list-decimal space-y-1 pl-5 text-muted-foreground">
          <li>A shop picks a percentage and the dates it should run.</li>
          <li>
            The same ceiling as bulk pricing applies — see Limits on the Bulk
            pricing screen.
          </li>
          <li>
            Approve and it starts on its start date, then stops on its own.
            Reject and the shop sees your note.
          </li>
        </ol>
      </div>

      {/* Two views of one thing, because they answer different questions: the
          queue is work to do, oldest first; the list is "what is this shop
          discounting?", newest first. Merging them would make one of the two
          orderings wrong. */}
      <div className="flex gap-2">
        {[
          {
            key: "queue",
            label: `Waiting for review${rows.length ? ` (${rows.length})` : ""}`,
          },
          { key: "all", label: "All discounts" },
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
                {shops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
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
              No discounts here.
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <table className="w-full text-sm [&_td]:px-4 [&_th]:px-4 [&_td:first-child]:pl-6 [&_th:first-child]:pl-6 [&_td:last-child]:pr-6 [&_th:last-child]:pr-6">
                <thead className="bg-muted/60">
                  <tr className="border-b border-border text-left">
                    <th className="py-2.5 font-semibold">Product</th>
                    <th className="py-2.5 font-semibold">Shop</th>
                    <th className="py-2.5 font-semibold">Size</th>
                    <th className="py-2.5 font-semibold">Off</th>
                    <th className="py-2.5 font-semibold">Price</th>
                    <th className="py-2.5 font-semibold">Runs</th>
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
                      <td className="py-2.5 text-muted-foreground">
                        {row.variant_names?.length
                          ? row.variant_names.join(", ")
                          : "All sizes"}
                      </td>
                      <td className="py-2.5 tabular-nums">
                        {row.discount_percent}%
                      </td>
                      <td className="py-2.5 tabular-nums">
                        <span className="text-muted-foreground line-through">
                          ₹{row.product?.price}
                        </span>{" "}
                        {unitAfter(row.product?.price, row.discount_percent)}
                      </td>
                      <td className="py-2.5 tabular-nums text-muted-foreground">
                        {formatWhen(row.starts_at)} → {formatWhen(row.ends_at)}
                      </td>
                      <td className="py-2.5">
                        <StateLabel row={row} />
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
          const draft = draftFor(row);
          const dirty = Boolean(edits[row.id]);
          const busy = busyId === row.id;
          const ended = new Date(row.ends_at) <= new Date();

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
                    {/* Which size, when the shop scoped it to one. "All sizes"
                      is said out loud rather than left as the absence of a
                      label: the two are a different decision. */}
                    <span>
                      {row.variant_names?.length
                        ? row.variant_names.join(", ")
                        : "All sizes"}
                    </span>
                    <span className="text-border">·</span>
                    {/* The price the percentage comes off. Reviewing "15% off"
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

              <div className="flex flex-wrap items-end gap-3 rounded-xl bg-muted/50 p-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">% off</span>
                  <input
                    type="number"
                    step="0.01"
                    value={draft.discount_percent}
                    onChange={(e) =>
                      patch(row, { discount_percent: e.target.value })
                    }
                    className="h-9 w-24 rounded-lg border border-border bg-background px-2 text-sm tabular-nums"
                  />
                </label>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground">Runs</span>
                  <span className="pb-1 text-sm tabular-nums">
                    {formatWhen(row.starts_at)} → {formatWhen(row.ends_at)}
                  </span>
                </div>
                <span className="pb-1.5 text-sm tabular-nums text-muted-foreground">
                  {unitAfter(row.product?.price, draft.discount_percent)} each
                </span>
              </div>

              {row.reason && (
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Why: </span>
                  {row.reason}
                </p>
              )}

              {/* A proposal can sit here until its own window has gone. Saying so
                is more useful than an approval that silently prices nothing —
                which is what the API refuses to create. */}
              {ended && (
                <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm">
                  <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                  <span>
                    These dates have passed. Reject it and ask the shop to
                    resubmit with new ones.
                  </span>
                </div>
              )}

              {dirty && (
                <div className="flex items-center gap-3 rounded-xl border border-warning/30 bg-warning/5 p-3">
                  <Pencil className="h-4 w-4 shrink-0 text-warning" />
                  <span className="text-sm">
                    Save your change before approving — approving sends the
                    shop&apos;s number, not yours.
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => saveEdit(row)}
                    className="ml-auto rounded-lg"
                  >
                    Save change
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
                  disabled={busy || ended}
                  onClick={() => decide(row, "approve")}
                  className="gap-2 rounded-xl"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Approve
                </Button>
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => decide(row, "reject")}
                  className="gap-2 rounded-xl"
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
 * What a row IS right now, which is not its status column.
 *
 * "Approved" answers a different question from "taking money off a price", and
 * a list that shows only the status makes the reader work out the difference
 * from two timestamps in the next column.
 */
const StateLabel = ({ row }) => {
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
  if (row.retired_at) {
    return <Badge variant="outline">Ended early</Badge>;
  }
  if (row.is_running) {
    return (
      <Badge variant="outline" className="border-success/30 text-success">
        Running
      </Badge>
    );
  }
  return new Date(row.ends_at) <= new Date() ? (
    <Badge variant="outline">Finished</Badge>
  ) : (
    <Badge variant="outline">Starts later</Badge>
  );
};
