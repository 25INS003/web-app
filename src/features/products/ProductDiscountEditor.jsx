"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  Loader2,
  Send,
  Undo2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * A shop's scheduled discount on one product.
 *
 * The sibling of `BulkPricingEditor`, and it holds the same two things at once
 * for the same reason: what is discounting orders right now, and what has been
 * asked for and is waiting. An owner editing a live sale needs to see that the
 * old one is still taking money off while the new one queues.
 *
 * Percentages and local datetimes here; the API converts to basis points and
 * UTC at its own boundary.
 */

const STATE = {
  approved: {
    label: "Approved",
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

/**
 * `<input type="datetime-local">` wants "YYYY-MM-DDTHH:mm" in LOCAL time, and
 * the API speaks ISO in UTC. Converting in both directions here keeps every
 * other line in this file working in the shop's own clock — which is the one
 * they are thinking in when they say "Friday evening".
 */
const toLocalInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
};

const fromLocalInput = (value) =>
  value ? new Date(value).toISOString() : null;

const formatWhen = (iso) =>
  iso
    ? new Date(iso).toLocaleString(undefined, {
        day: "numeric",
        month: "short",
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";

/** What is running, or queued, in one line each. */
const DiscountSummary = ({ discount, unitPrice }) => {
  if (!discount) return null;
  const after =
    unitPrice != null
      ? (unitPrice * (1 - discount.discount_percent / 100)).toFixed(2)
      : null;

  return (
    <div className="space-y-1 text-sm">
      <p className="font-medium tabular-nums">
        {discount.discount_percent}% off
        {after ? (
          <span className="ml-2 font-normal text-muted-foreground">
            ₹{after} each
          </span>
        ) : null}
      </p>
      <p className="text-xs text-muted-foreground tabular-nums">
        {formatWhen(discount.starts_at)} → {formatWhen(discount.ends_at)}
      </p>
    </div>
  );
};

export const ProductDiscountEditor = ({ shopId, productId, unitPrice }) => {
  const [state, setState] = useState(null);
  const [form, setForm] = useState({
    percent: "",
    starts: "",
    ends: "",
    // The sizes it covers. Empty is every size — the same thing an empty set
    // means to the API, so the two never disagree about what "all" is.
    variantIds: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState([]);

  const base = `/shops/${shopId}/products/${productId}/discount`;

  const apply = (data) => {
    setState(data);
    // The form opens on whatever is waiting, else on what is live — editing
    // either is the common case, and typing it again from scratch is not.
    const seed = data?.pending ?? data?.live;
    setForm({
      percent: seed ? String(seed.discount_percent) : "",
      starts: toLocalInput(seed?.starts_at),
      ends: toLocalInput(seed?.ends_at),
      variantIds: seed?.variant_ids ?? [],
    });
  };

  const reload = async () => {
    const res = await apiClient.get(base);
    apply(res.data.data);
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const res = await apiClient.get(base);
        if (!cancelled) apply(res.data.data);
      } catch (e) {
        if (!cancelled) {
          toast.error(
            e.response?.data?.message || "Could not load the discount.",
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId, productId]);

  const save = async () => {
    setSaving(true);
    setErrors([]);
    try {
      const res = await apiClient.put(base, {
        discount_percent: form.percent === "" ? null : Number(form.percent),
        starts_at: fromLocalInput(form.starts),
        ends_at: fromLocalInput(form.ends),
        variant_ids: form.variantIds,
      });
      toast.success(res.data.message);
      await reload();
    } catch (e) {
      // Every problem in one response, so they are all listed rather than
      // surfaced one round trip at a time.
      const list = e.response?.data?.errors;
      setErrors(
        Array.isArray(list) && list.length
          ? list
          : [e.response?.data?.message || "Could not save the discount."],
      );
    } finally {
      setSaving(false);
    }
  };

  const withdraw = async (variantId = null) => {
    setSaving(true);
    try {
      await apiClient.delete(`${base}/draft`, {
        params: variantId ? { variant_id: variantId } : undefined,
      });
      toast.success("Proposal withdrawn");
      await reload();
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not withdraw it.");
    } finally {
      setSaving(false);
    }
  };

  const end = async (variantId = null) => {
    setSaving(true);
    try {
      await apiClient.delete(base, {
        params: variantId ? { variant_id: variantId } : undefined,
      });
      toast.success("Discount ended");
      await reload();
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not end it.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-32 items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading discount…
      </div>
    );
  }

  if (!state?.policy?.enabled) {
    return (
      <div className="rounded-2xl border border-border bg-muted/40 p-6 text-sm text-muted-foreground">
        Discounts are turned off across the platform right now.
      </div>
    );
  }

  const {
    policy,
    live = [],
    pending,
    last_rejected: rejected,
    variants = [],
  } = state;

  /** "All sizes", or the ones it names. */
  const scopeLabel = (d) =>
    d.variant_names?.length ? d.variant_names.join(", ") : "All sizes";

  const toggleVariant = (id) =>
    setForm((prev) => ({
      ...prev,
      variantIds: prev.variantIds.includes(id)
        ? prev.variantIds.filter((v) => v !== id)
        : [...prev.variantIds, id],
    }));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <CalendarClock className="h-5 w-5 text-primary" />
          Discount
        </h3>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          Sell this product for less between two dates. You pay for it out of
          your profit, and an admin has to approve it first.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Most you can give:{" "}
          <span className="font-medium text-foreground">
            {policy.max_discount_percent}% off
          </span>
        </p>
      </div>

      {(live.length > 0 || pending) && (
        <div className="grid gap-4 md:grid-cols-2">
          {live.map((d) => (
            <div
              key={d.id}
              className="rounded-2xl border border-success/30 bg-success/5 p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-sm font-medium">
                  {d.is_running ? "Running now" : "Approved, starts later"}
                </span>
                <StateBadge status="approved" />
              </div>
              <p className="mb-1 text-xs text-muted-foreground">
                {scopeLabel(d)}
              </p>
              <DiscountSummary discount={d} unitPrice={unitPrice} />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={saving}
                onClick={() => end(d.id)}
                className="mt-3 gap-1.5 rounded-lg"
              >
                <XCircle className="h-3.5 w-3.5" />
                End it now
              </Button>
            </div>
          ))}
          {pending && (
            <div className="rounded-2xl border border-warning/30 bg-warning/5 p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-sm font-medium">
                  Waiting for approval
                </span>
                <StateBadge status="pending" />
              </div>
              <p className="mb-1 text-xs text-muted-foreground">
                {scopeLabel(pending)}
              </p>
              <DiscountSummary discount={pending} unitPrice={unitPrice} />
              <p className="mt-3 text-xs text-muted-foreground">
                {live.length
                  ? "Your current discount keeps applying until this is approved."
                  : "Nothing changes for customers until an admin approves this."}
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

      {rejected && !pending && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div>
            <p className="font-medium text-destructive">
              Your last discount was rejected
            </p>
            <p className="mt-0.5 text-muted-foreground">
              {rejected.approval_note}
            </p>
          </div>
        </div>
      )}

      {live?.edited_by_admin && (
        <p className="text-xs text-muted-foreground">
          An admin changed these numbers before approving them.
        </p>
      )}

      {/* Three fields and a sentence. The dates are the whole feature — a
          discount with no end is what the product's own price already is. */}
      <div className="rounded-2xl border border-border bg-muted/40 p-4 text-sm">
        <p className="font-medium">How to set it up</p>
        <ol className="mt-1.5 list-decimal space-y-1 pl-5 text-muted-foreground">
          <li>
            Pick how much off, and when it should run. Leave{" "}
            <span className="font-medium text-foreground">All sizes</span>{" "}
            unless only one is on offer.
          </li>
          <li>
            Send it for approval. Nothing changes until an admin says yes.
          </li>
          <li>It stops on its own at the end date — nothing to remember.</li>
        </ol>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-card p-3">
        {/* Applies to. "All sizes" is the default and the common case; the
            checkboxes are the exception — one sale can name several sizes,
            because "20% off the 500g and the 1kg" is one decision. Naming every
            size is the same as naming none, and the API normalises it. */}
        <fieldset className="flex flex-col gap-1">
          <span className="text-xs font-medium">Applies to</span>
          <div className="flex flex-wrap items-center gap-3 pt-1.5">
            <label className="flex items-center gap-1.5 text-sm">
              <input
                type="checkbox"
                checked={form.variantIds.length === 0}
                onChange={() => setForm({ ...form, variantIds: [] })}
                className="h-4 w-4 rounded border-border"
              />
              All sizes
            </label>
            {variants.map((v) => (
              <label key={v.id} className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={form.variantIds.includes(v.id)}
                  onChange={() => toggleVariant(v.id)}
                  className="h-4 w-4 rounded border-border"
                />
                {v.name}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium">% off</span>
          <input
            type="number"
            step="0.01"
            min={0}
            max={policy.max_discount_percent}
            value={form.percent}
            onChange={(e) => setForm({ ...form, percent: e.target.value })}
            className="h-9 w-28 rounded-lg border border-border bg-background px-2 text-sm tabular-nums"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium">Starts</span>
          <input
            type="datetime-local"
            value={form.starts}
            onChange={(e) => setForm({ ...form, starts: e.target.value })}
            className="h-9 rounded-lg border border-border bg-background px-2 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium">Ends</span>
          <input
            type="datetime-local"
            value={form.ends}
            onChange={(e) => setForm({ ...form, ends: e.target.value })}
            className="h-9 rounded-lg border border-border bg-background px-2 text-sm"
          />
        </label>

        {/* What the customer would actually pay. A percentage is the rule; the
            price is the thing an owner is deciding. */}
        {unitPrice != null && form.percent !== "" ? (
          <span className="pb-2 text-sm tabular-nums text-muted-foreground">
            ₹{(unitPrice * (1 - Number(form.percent) / 100)).toFixed(2)} each
          </span>
        ) : null}
      </div>

      {errors.length > 0 && (
        <div className="space-y-1 rounded-xl border border-destructive/30 bg-destructive/5 p-3">
          {errors.map((e, i) => (
            <p
              key={i}
              className="flex items-start gap-2 text-sm text-destructive"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {e}
            </p>
          ))}
        </div>
      )}

      <Button onClick={save} disabled={saving} className="gap-2 rounded-xl">
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        Send for approval
      </Button>
    </div>
  );
};
