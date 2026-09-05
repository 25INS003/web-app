"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Layers,
  Loader2,
  Plus,
  Send,
  Trash2,
  Undo2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * A shop's quantity-break pricing for one product.
 *
 * The screen has to hold two things at once, and that is the whole reason it
 * looks the way it does: what is pricing orders RIGHT NOW, and what has been
 * asked for and is waiting. Showing only one of them is the question, not the
 * answer — an owner who edits an approved ladder needs to see that their old
 * rungs are still charging customers while the new ones queue.
 *
 * The whole ladder is edited locally and saved in one request, because the
 * server validates it as a SET: "no overlaps" and "one open-ended rung" are
 * properties of the collection, so saving rungs one at a time would have to
 * pass through states that are individually fine and collectively invalid.
 *
 * Percentages here; the API converts to basis points at its own boundary.
 */

const BLANK = { min_qty: "", max_qty: "", discount_percent: "" };

// Empty means "no upper limit" for max_qty, which is a different thing from
// zero — hence null rather than 0.
const numOrNull = (v) => (v === "" || v === null || v === undefined ? null : Number(v));

const STATE = {
  approved: {
    label: "Live",
    icon: CheckCircle2,
    className: "border-success/30 bg-success/10 text-success",
  },
  pending: {
    label: "Waiting for approval",
    icon: Clock,
    className: "border-warning/30 bg-warning/10 text-warning",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    className: "border-destructive/30 bg-destructive/10 text-destructive",
  },
};

const StateBadge = ({ status }) => {
  const s = STATE[status];
  if (!s) return null;
  const Icon = s.icon;
  return (
    <Badge variant="outline" className={`gap-1.5 rounded-lg ${s.className}`}>
      <Icon className="h-3.5 w-3.5" />
      {s.label}
    </Badge>
  );
};

/** A read-only ladder, for showing what is live beside what is proposed. */
const LadderSummary = ({ ladder, unitPrice }) => {
  if (!ladder?.slabs?.length) return null;
  return (
    <div className="space-y-1.5">
      {ladder.slabs.map((s, i) => (
        <div
          key={`${s.min_qty}-${i}`}
          className="flex items-center justify-between gap-3 rounded-lg bg-muted/60 px-3 py-1.5 text-sm"
        >
          <span className="font-medium tabular-nums">
            {s.max_qty ? `${s.min_qty}–${s.max_qty - 1}` : `${s.min_qty}+`} units
          </span>
          <span className="flex items-center gap-2 tabular-nums text-muted-foreground">
            <span>{s.discount_percent}% off</span>
            {unitPrice ? (
              <span className="font-medium text-foreground">
                ₹{(unitPrice * (1 - s.discount_percent / 100)).toFixed(2)} each
              </span>
            ) : null}
          </span>
        </div>
      ))}
    </div>
  );
};

export const BulkPricingEditor = ({ shopId, productId, unitPrice }) => {
  const [state, setState] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState([]);

  const base = `/shops/${shopId}/products/${productId}/bulk-pricing`;

  /** Fetch only — no state written, so the caller decides whether it still matters. */
  const fetchLadders = async () => (await apiClient.get(base)).data.data;

  const apply = (data) => {
    setState(data);
    // The editor opens on whatever is furthest along: a proposal if one is
    // waiting, otherwise the live rungs as a starting point to change.
    const source = data.pending ?? data.live;
    setRows(
      source?.slabs?.map((s) => ({
        min_qty: s.min_qty,
        max_qty: s.max_qty ?? "",
        discount_percent: s.discount_percent,
      })) ?? []
    );
  };

  const reload = async () => {
    try {
      apply(await fetchLadders());
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not load bulk pricing.");
    }
  };

  useEffect(() => {
    if (!shopId || !productId) return;
    let cancelled = false;

    // Guarded, so a response for the product that WAS on screen cannot land
    // after someone has moved to another one and overwrite its rungs — the
    // request is in flight for as long as the network takes, and nothing else
    // here would notice the swap.
    const run = async () => {
      try {
        const data = await fetchLadders();
        if (!cancelled) apply(data);
      } catch (e) {
        if (!cancelled) {
          toast.error(
            e.response?.data?.message || "Could not load bulk pricing."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();

    return () => {
      cancelled = true;
    };
    // `fetchLadders` and `apply` are recreated each render and depend only on
    // these two ids.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId, productId]);

  const patch = (i, changes) =>
    setRows((prev) => prev.map((r, n) => (n === i ? { ...r, ...changes } : r)));

  const addRow = () =>
    setRows((prev) => {
      // A new rung starts where the last one ended, which is the shape that
      // validates — contiguous and non-overlapping.
      const last = prev[prev.length - 1];
      const from = last?.max_qty
        ? Number(last.max_qty)
        : Number(last?.min_qty ?? (state?.policy?.min_quantity ?? 2) - 1) + 1;
      return [...prev, { ...BLANK, min_qty: from }];
    });

  const save = async () => {
    setSaving(true);
    setErrors([]);
    try {
      const res = await apiClient.put(base, {
        slabs: rows.map((r) => ({
          min_qty: Number(r.min_qty) || 0,
          max_qty: numOrNull(r.max_qty),
          discount_percent: Number(r.discount_percent) || 0,
        })),
      });
      setState((prev) => ({ ...prev, ...res.data.data }));
      toast.success(res.data.message);
      await reload();
    } catch (e) {
      // The server returns every problem in one response, so they are all
      // listed rather than surfaced one round trip at a time.
      const list = e.response?.data?.errors;
      setErrors(
        Array.isArray(list) && list.length
          ? list
          : [e.response?.data?.message || "Could not save the bulk pricing."]
      );
    } finally {
      setSaving(false);
    }
  };

  const withdraw = async () => {
    setSaving(true);
    try {
      await apiClient.delete(`${base}/draft`);
      toast.success("Proposal withdrawn");
      await reload();
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not withdraw it.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading bulk pricing…
      </div>
    );
  }

  if (!state?.policy?.enabled) {
    return (
      <div className="rounded-2xl border border-border bg-muted/40 p-6 text-sm text-muted-foreground">
        Bulk pricing is switched off for the platform at the moment.
      </div>
    );
  }

  const { policy, live, pending, last_rejected: rejected } = state;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Layers className="h-5 w-5 text-primary" />
            Bulk pricing
          </h3>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            A better rate for buying more of this product. The discount comes out
            of your margin, and an admin approves it before it goes live — up to{" "}
            <span className="font-medium text-foreground">
              {policy.max_discount_percent}%
            </span>
            , at most {policy.max_slabs} rungs, starting from{" "}
            {policy.min_quantity} units.
          </p>
        </div>
      </div>

      {/* What is actually charging customers, and what is queued behind it. */}
      {(live || pending) && (
        <div className="grid gap-4 md:grid-cols-2">
          {live && (
            <div className="rounded-2xl border border-success/30 bg-success/5 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-sm font-medium">Pricing orders now</span>
                <StateBadge status="approved" />
              </div>
              <LadderSummary ladder={live} unitPrice={unitPrice} />
            </div>
          )}
          {pending && (
            <div className="rounded-2xl border border-warning/30 bg-warning/5 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-sm font-medium">Waiting for approval</span>
                <StateBadge status="pending" />
              </div>
              <LadderSummary ladder={pending} unitPrice={unitPrice} />
              <p className="mt-3 text-xs text-muted-foreground">
                {live
                  ? "Your current pricing keeps charging customers until this is approved."
                  : "Nothing is discounted until an admin approves this."}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={saving}
                onClick={withdraw}
                className="mt-3 gap-1.5 rounded-lg"
              >
                <Undo2 className="h-3.5 w-3.5" />
                Withdraw
              </Button>
            </div>
          )}
        </div>
      )}

      {/* A rejection is only worth showing while it is the latest word. */}
      {rejected && !pending && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div>
            <p className="font-medium text-destructive">
              Your last proposal was rejected
            </p>
            <p className="mt-0.5 text-muted-foreground">
              {rejected.approval_note}
            </p>
          </div>
        </div>
      )}

      {live?.edited_by_admin && (
        <p className="text-xs text-muted-foreground">
          An admin adjusted these numbers before approving them.
        </p>
      )}

      {/* The editor */}
      <div className="space-y-3">
        {rows.length === 0 && (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            No rungs yet. Add one to offer a better rate on larger quantities.
          </p>
        )}

        {rows.map((r, i) => (
          <div
            key={i}
            className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-3"
          >
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">
                From (units)
              </span>
              <input
                type="number"
                min={policy.min_quantity}
                value={r.min_qty}
                onChange={(e) => patch(i, { min_qty: e.target.value })}
                className="h-9 w-28 rounded-lg border border-border bg-background px-2 text-sm tabular-nums"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">
                Up to (blank = no limit)
              </span>
              <input
                type="number"
                value={r.max_qty ?? ""}
                onChange={(e) => patch(i, { max_qty: e.target.value })}
                className="h-9 w-36 rounded-lg border border-border bg-background px-2 text-sm tabular-nums"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-muted-foreground">
                Discount %
              </span>
              <input
                type="number"
                step="0.01"
                max={policy.max_discount_percent}
                value={r.discount_percent}
                onChange={(e) => patch(i, { discount_percent: e.target.value })}
                className="h-9 w-28 rounded-lg border border-border bg-background px-2 text-sm tabular-nums"
              />
            </label>

            {/* What the customer would actually pay. A percentage is the rule;
                the price is the thing an owner is deciding. */}
            {unitPrice && r.discount_percent !== "" ? (
              <span className="pb-2 text-sm tabular-nums text-muted-foreground">
                ₹{(unitPrice * (1 - Number(r.discount_percent) / 100)).toFixed(2)}{" "}
                each
              </span>
            ) : null}

            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove rung ${i + 1}`}
              onClick={() => setRows((prev) => prev.filter((_, n) => n !== i))}
              className="ml-auto rounded-lg text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        <Button
          type="button"
          variant="outline"
          onClick={addRow}
          disabled={rows.length >= policy.max_slabs}
          className="gap-1.5 rounded-xl"
        >
          <Plus className="h-4 w-4" />
          Add a rung
        </Button>
      </div>

      {errors.length > 0 && (
        <div className="space-y-1 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
          {errors.map((e, i) => (
            <p key={i} className="flex items-start gap-2 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {e}
            </p>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={save} disabled={saving} className="gap-2 rounded-xl">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          {rows.length === 0 ? "Remove bulk pricing" : "Send for approval"}
        </Button>
        {rows.length === 0 && (live || pending) && (
          <span className="text-sm text-muted-foreground">
            Saving with no rungs switches bulk pricing off straight away.
          </span>
        )}
      </div>
    </div>
  );
};
