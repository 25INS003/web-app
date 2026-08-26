"use client";

import { Loader2, Plus, Tag, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, formatPrice } from "@/lib/utils";
import {
  useCreatePromotion,
  usePromotions,
  useRemovePromotion,
  useUpdatePromotion,
} from "./hooks";
import type { Promotion, PromotionInput } from "./api";

/**
 * Discount codes, from the admin's side.
 *
 * The pricing, the limits and the usage recording were all built before there
 * was any way to make a code — they existed only if the seed put them there or
 * somebody inserted a row by hand. This is that missing half.
 */

const TYPES: { value: Promotion["discount_type"]; label: string }[] = [
  { value: "percentage", label: "Percentage off" },
  { value: "fixed", label: "Fixed amount off" },
  { value: "free_shipping", label: "Free delivery" },
];

/**
 * What `discount_value` means depends on the type, and the label has to say
 * so — it is a percentage for one and a rupee amount for another, and the
 * backend deliberately does not convert it either way.
 */
const valueLabel = (type: Promotion["discount_type"]) =>
  type === "percentage"
    ? "Percentage off (%)"
    : type === "fixed"
      ? "Amount off (₹)"
      : "Not used for free delivery";

const describe = (p: Promotion) => {
  if (p.discount_type === "free_shipping") return "Free delivery";
  if (p.discount_type === "fixed") return `${formatPrice(p.discount_value)} off`;
  return `${p.discount_value}% off${
    p.max_discount_amount ? `, up to ${formatPrice(p.max_discount_amount)}` : ""
  }`;
};

/** Expired and not-yet-started are different from switched off, and both matter. */
const windowState = (p: Promotion): string | null => {
  const now = Date.now();
  if (p.expiry_date && new Date(p.expiry_date).getTime() < now) return "Expired";
  if (p.start_date && new Date(p.start_date).getTime() > now) return "Scheduled";
  return null;
};

export function PromotionsView() {
  const q = usePromotions();
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Discount codes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Customers enter these at checkout. Limits are enforced when the
            order is placed.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setCreating(true);
          }}
        >
          <Plus className="size-4" /> New code
        </Button>
      </div>

      {(creating || editing) && (
        <PromotionForm
          promotion={editing}
          onDone={() => {
            setCreating(false);
            setEditing(null);
          }}
        />
      )}

      {q.isPending ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : q.isError ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="text-sm text-muted-foreground">
            Could not load discount codes.
          </p>
        </div>
      ) : q.data?.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <span className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
            <Tag className="size-6" />
          </span>
          <h2 className="font-display text-lg font-bold">No codes yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create one and customers can use it at checkout straight away.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {q.data?.map((p) => (
            <PromotionRow key={p.id} promotion={p} onEdit={() => setEditing(p)} />
          ))}
        </ul>
      )}
    </div>
  );
}

function PromotionRow({
  promotion: p,
  onEdit,
}: {
  promotion: Promotion;
  onEdit: () => void;
}) {
  const update = useUpdatePromotion();
  const remove = useRemovePromotion();
  const expiry = windowState(p);

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 shadow-xs">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <code className="rounded-md bg-muted px-2 py-0.5 font-mono text-sm font-semibold">
            {p.code}
          </code>
          <span className="text-sm font-medium">{describe(p)}</span>
          {!p.is_active && <Badge variant="muted">Off</Badge>}
          {expiry && <Badge variant="outline">{expiry}</Badge>}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {p.name}
          {p.min_order_amount ? ` · min ${formatPrice(p.min_order_amount)}` : ""}
          {p.usage_limit_per_user
            ? ` · ${p.usage_limit_per_user} per customer`
            : ""}
          {p.usage_limit ? ` · ${p.usage_limit} total` : ""}
          {` · used ${p.used_count}×`}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={update.isPending}
          onClick={() =>
            update.mutate({ id: p.id, input: { is_active: !p.is_active } })
          }
        >
          {p.is_active ? "Turn off" : "Turn on"}
        </Button>
        <Button variant="outline" size="sm" onClick={onEdit}>
          Edit
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label={`Remove ${p.code}`}
          disabled={remove.isPending}
          onClick={() => remove.mutate(p)}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </li>
  );
}

function PromotionForm({
  promotion,
  onDone,
}: {
  promotion: Promotion | null;
  onDone: () => void;
}) {
  const create = useCreatePromotion();
  const update = useUpdatePromotion();
  const editing = Boolean(promotion);

  const [form, setForm] = useState({
    name: promotion?.name ?? "",
    code: promotion?.code ?? "",
    discount_type: promotion?.discount_type ?? "percentage",
    discount_value: String(promotion?.discount_value ?? ""),
    min_order_amount: String(promotion?.min_order_amount ?? ""),
    max_discount_amount: String(promotion?.max_discount_amount ?? ""),
    usage_limit: String(promotion?.usage_limit ?? ""),
    usage_limit_per_user: String(promotion?.usage_limit_per_user ?? ""),
    expiry_date: promotion?.expiry_date?.slice(0, 10) ?? "",
  });

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    // Empty stays empty rather than becoming 0 — the backend reads an absent
    // limit as "no limit", and Number("") is 0, which would mean the opposite.
    const num = (v: string) => (v.trim() === "" ? "" : Number(v));

    const input: PromotionInput = {
      name: form.name.trim(),
      code: form.code.trim(),
      discount_type: form.discount_type as Promotion["discount_type"],
      discount_value: Number(form.discount_value || 0),
      min_order_amount: num(form.min_order_amount),
      max_discount_amount: num(form.max_discount_amount),
      usage_limit: num(form.usage_limit),
      usage_limit_per_user: num(form.usage_limit_per_user),
      expiry_date: form.expiry_date || null,
    };

    if (promotion) {
      update.mutate({ id: promotion.id, input }, { onSuccess: onDone });
    } else {
      create.mutate(input, { onSuccess: onDone });
    }
  };

  const busy = create.isPending || update.isPending;

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-border bg-card p-5 shadow-xs"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">
          {editing ? `Edit ${promotion?.code}` : "New discount code"}
        </h2>
        <button
          type="button"
          aria-label="Close"
          onClick={onDone}
          className="text-muted-foreground transition hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Code">
          <Input
            value={form.code}
            onChange={(e) => set("code", e.target.value.toUpperCase())}
            placeholder="WELCOME10"
            className="font-mono uppercase"
          />
        </Field>
        <Field label="Name">
          <Input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Welcome offer"
          />
        </Field>

        <Field label="Type">
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => set("discount_type", t.value)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-sm font-medium transition",
                  form.discount_type === t.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label={valueLabel(form.discount_type as Promotion["discount_type"])}>
          <Input
            type="number"
            min="0"
            value={form.discount_value}
            disabled={form.discount_type === "free_shipping"}
            onChange={(e) => set("discount_value", e.target.value)}
          />
        </Field>

        <Field label="Minimum order (₹)" hint="Leave empty for no minimum">
          <Input
            type="number"
            min="0"
            value={form.min_order_amount}
            onChange={(e) => set("min_order_amount", e.target.value)}
          />
        </Field>
        <Field
          label="Maximum discount (₹)"
          hint="Caps a percentage discount"
        >
          <Input
            type="number"
            min="0"
            value={form.max_discount_amount}
            disabled={form.discount_type !== "percentage"}
            onChange={(e) => set("max_discount_amount", e.target.value)}
          />
        </Field>

        <Field label="Uses per customer" hint="Empty means unlimited">
          <Input
            type="number"
            min="1"
            value={form.usage_limit_per_user}
            onChange={(e) => set("usage_limit_per_user", e.target.value)}
          />
        </Field>
        <Field label="Total uses" hint="Across all customers">
          <Input
            type="number"
            min="1"
            value={form.usage_limit}
            onChange={(e) => set("usage_limit", e.target.value)}
          />
        </Field>

        <Field label="Expires on" hint="Leave empty to never expire">
          <Input
            type="date"
            value={form.expiry_date}
            onChange={(e) => set("expiry_date", e.target.value)}
          />
        </Field>
      </div>

      <div className="mt-5 flex items-center gap-2">
        <Button type="submit" disabled={busy || !form.code.trim() || !form.name.trim()}>
          {busy && <Loader2 className="size-4 animate-spin" />}
          {editing ? "Save changes" : "Create code"}
        </Button>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
