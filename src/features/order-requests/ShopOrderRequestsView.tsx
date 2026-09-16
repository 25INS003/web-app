"use client";

import {
  Camera,
  Check,
  ImageOff,
  Loader2,
  Minus,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/features/orders/status";
import { useMyShops } from "@/features/shop-orders/hooks";
import type {
  OrderRequest,
  OrderRequestStatus,
} from "@/lib/api/schemas/orderRequest";
import { formatPrice } from "@/lib/utils";
import type { CatalogueVariant } from "./api";
import {
  useDeclineOrderRequest,
  useFulfilOrderRequest,
  useShopCatalogue,
  useShopOrderRequests,
} from "./hooks";

const FILTERS = [
  { key: "pending", label: "Waiting" },
  { key: "fulfilled", label: "Placed" },
  { key: "declined", label: "Declined" },
  { key: "cancelled", label: "Withdrawn" },
] as const;

const STATUS: Record<
  OrderRequestStatus,
  {
    label: string;
    variant: "default" | "outline" | "success" | "warning" | "muted";
  }
> = {
  pending: { label: "Waiting", variant: "warning" },
  fulfilled: { label: "Order placed", variant: "success" },
  declined: { label: "Declined", variant: "outline" },
  cancelled: { label: "Withdrawn", variant: "muted" },
};

/**
 * Lists customers have photographed, and the till for keying them in.
 *
 * The shop chooses the items; it does not choose the prices. Quantities go up
 * to the server as variants and counts, and everything else — the ladder, any
 * scheduled discount, the delivery fee, the stock guard — is resolved there,
 * exactly as it would be at the customer's own checkout. Which is why this
 * screen shows no editable total: there isn't one to edit.
 */
export function ShopOrderRequestsView() {
  const shops = useMyShops();
  const [shopId, setShopId] = useState<string | undefined>();
  const [status, setStatus] = useState<OrderRequestStatus>("pending");
  // The request currently being keyed in. One at a time on purpose — two open
  // tills is two half-finished orders.
  const [openId, setOpenId] = useState<string | null>(null);

  const activeShopId = shopId ?? shops.data?.[0]?.id;
  const q = useShopOrderRequests(activeShopId, { status });

  if (shops.isPending) {
    return <div className="h-64 animate-pulse rounded-2xl bg-muted" />;
  }
  if (!shops.data?.length) {
    return (
      <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Register a shop first — photographed lists arrive at a shop.
      </p>
    );
  }

  const rows = q.data?.data ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Photo orders
          </h1>
          <p className="text-sm text-muted-foreground">
            A customer sends a picture of their list; you read it and put the
            order together for them.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {shops.data.length > 1 && (
            <select
              aria-label="Shop"
              value={activeShopId}
              onChange={(e) => {
                setShopId(e.target.value);
                setOpenId(null);
              }}
              className="h-9 rounded-lg border border-border bg-card px-3 text-sm"
            >
              {shops.data.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name ?? "Shop"}
                </option>
              ))}
            </select>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => q.refetch()}
            disabled={q.isFetching}
          >
            <RefreshCw
              className={`size-4 ${q.isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => {
              setStatus(f.key);
              setOpenId(null);
            }}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
              status === f.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
            {/* Only on the tab it belongs to: a count of waiting requests on
                the "Declined" tab would be answering a different question. */}
            {f.key === "pending" && (q.data?.pending ?? 0) > 0 && (
              <span className="ml-1.5 rounded-full bg-background/25 px-1.5 text-xs">
                {q.data?.pending}
              </span>
            )}
          </button>
        ))}
      </div>

      {q.isPending ? (
        <div className="h-40 animate-pulse rounded-2xl bg-muted" />
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <Camera className="mx-auto size-7 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            {status === "pending"
              ? "Nothing waiting. Lists customers send will land here."
              : "Nothing here yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <RequestCard
              key={r.id}
              request={r}
              shopId={activeShopId as string}
              open={openId === r.id}
              onToggle={() => setOpenId(openId === r.id ? null : r.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── one request ──────────────────────────────────────────────────────────── */

function RequestCard({
  request,
  shopId,
  open,
  onToggle,
}: {
  request: OrderRequest;
  shopId: string;
  open: boolean;
  onToggle: () => void;
}) {
  const address = request.delivery_address;

  return (
    <article className="rounded-2xl border border-border bg-card shadow-xs">
      <div className="flex flex-wrap items-start gap-4 p-4">
        <Photos request={request} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">
              {request.customer?.name?.trim() || "A customer"}
            </span>
            <Badge variant={STATUS[request.status].variant}>
              {STATUS[request.status].label}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatDate(request.created_at)}
            </span>
          </div>

          {request.customer?.phone && (
            <a
              href={`tel:${request.customer.phone}`}
              className="mt-0.5 block text-sm text-primary hover:underline"
            >
              {request.customer.phone}
            </a>
          )}

          {address && (
            <p className="mt-1 text-sm text-muted-foreground">
              {[address.address_line, address.city, address.pincode]
                .filter(Boolean)
                .join(", ")}
            </p>
          )}

          {request.note && (
            <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-sm">
              “{request.note}”
            </p>
          )}

          {request.status === "fulfilled" && request.order && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-success">
              <Check className="size-4" />
              Order #{request.order.order_number}
            </p>
          )}
          {request.status === "declined" && request.decline_note && (
            <p className="mt-2 text-sm text-muted-foreground">
              You said: {request.decline_note}
            </p>
          )}
        </div>

        {request.status === "pending" && (
          <Button variant={open ? "outline" : "default"} onClick={onToggle}>
            {open ? "Close" : "Set up the order"}
          </Button>
        )}
      </div>

      {open && request.status === "pending" && (
        <Till request={request} shopId={shopId} onDone={onToggle} />
      )}
    </article>
  );
}

function Photos({ request }: { request: OrderRequest }) {
  if (!request.images.length) {
    return (
      <span className="grid size-24 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
        <ImageOff className="size-5" />
      </span>
    );
  }
  return (
    <div className="flex shrink-0 gap-2">
      {request.images.map((img, i) => (
        // Opened full-size in a tab rather than in a lightbox: the shopkeeper
        // wants it beside the till, and reading handwriting at thumbnail size
        // is the one thing this screen must not force.
        <a
          key={`${img.url}-${i}`}
          href={img.url}
          target="_blank"
          rel="noreferrer"
          className="size-24 overflow-hidden rounded-xl border border-border transition hover:border-primary/50"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img.url}
            alt={img.alt_text ?? `The customer's list, photo ${i + 1}`}
            className="size-full object-cover"
          />
        </a>
      ))}
    </div>
  );
}

/* ── keying it in ─────────────────────────────────────────────────────────── */

type Line = { variant: CatalogueVariant; quantity: number };

function Till({
  request,
  shopId,
  onDone,
}: {
  request: OrderRequest;
  shopId: string;
  onDone: () => void;
}) {
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [lines, setLines] = useState<Line[]>([]);
  const [declining, setDeclining] = useState(false);
  const [note, setNote] = useState("");

  const fulfil = useFulfilOrderRequest(shopId);
  const decline = useDeclineOrderRequest(shopId);

  // Debounced, because this fires on every keystroke of somebody typing
  // "tomatoes" into a search box.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(term), 250);
    return () => clearTimeout(t);
  }, [term]);

  const catalogue = useShopCatalogue(shopId, debounced);

  const add = (variant: CatalogueVariant) => {
    setLines((current) => {
      const at = current.findIndex((l) => l.variant.id === variant.id);
      if (at === -1) return [...current, { variant, quantity: 1 }];
      const next = [...current];
      next[at] = { ...next[at], quantity: next[at].quantity + 1 };
      return next;
    });
  };

  const setQuantity = (variantId: string, quantity: number) =>
    setLines((current) =>
      quantity < 1
        ? current.filter((l) => l.variant.id !== variantId)
        : current.map((l) =>
            l.variant.id === variantId ? { ...l, quantity } : l,
          ),
    );

  // What the goods come to at list price. Called an estimate because it IS one:
  // discounts and the delivery fee are settled by the server when the order is
  // placed, and a number here that claimed to be the total would be wrong every
  // time a discount applied.
  const estimate = useMemo(
    () => lines.reduce((sum, l) => sum + l.variant.price * l.quantity, 0),
    [lines],
  );

  const place = async () => {
    if (!lines.length) return;
    await fulfil.mutateAsync({
      requestId: request.id,
      items: lines.map((l) => ({
        variant_id: l.variant.id,
        quantity: l.quantity,
      })),
    });
    setLines([]);
    onDone();
  };

  const results = catalogue.data ?? [];

  return (
    <div className="border-t border-border p-4">
      <div className="grid gap-5 lg:grid-cols-2">
        {/* the shelves */}
        <div>
          <Label htmlFor={`search-${request.id}`}>Find what they wrote</Label>
          <div className="relative mt-1.5">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id={`search-${request.id}`}
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="atta, milk, dal…"
              className="pl-9"
            />
          </div>

          <div className="mt-3 max-h-72 space-y-1.5 overflow-y-auto pr-1">
            {catalogue.isPending && (
              <div className="h-16 animate-pulse rounded-lg bg-muted" />
            )}
            {!catalogue.isPending && results.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Nothing in your catalogue matches that.
              </p>
            )}
            {results.map((v) => {
              const out = !v.is_available || v.stock_quantity < 1;
              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={out}
                  onClick={() => add(v)}
                  className="flex w-full items-center gap-3 rounded-lg border border-border px-3 py-2 text-left transition hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {v.product_name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {v.name}
                      {/* The stock figure, because an out-of-stock line the
                          shopkeeper cannot find reads as "we never sold it". */}
                      {out ? " · out of stock" : ` · ${v.stock_quantity} left`}
                    </p>
                  </div>
                  <span className="text-sm font-semibold">
                    {formatPrice(v.price)}
                  </span>
                  <Plus className="size-4 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        </div>

        {/* the order being built */}
        <div>
          <p className="text-sm font-medium">Their order</p>

          {lines.length === 0 ? (
            <p className="mt-3 rounded-lg border border-dashed border-border px-3 py-8 text-center text-sm text-muted-foreground">
              Read the photo and add what it says.
            </p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {lines.map((l) => (
                <li
                  key={l.variant.id}
                  className="flex items-center gap-2 rounded-lg border border-border px-3 py-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {l.variant.product_name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {l.variant.name} · {formatPrice(l.variant.price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-7"
                      aria-label="One fewer"
                      onClick={() => setQuantity(l.variant.id, l.quantity - 1)}
                    >
                      <Minus className="size-3.5" />
                    </Button>
                    <span className="w-7 text-center text-sm font-semibold">
                      {l.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-7"
                      aria-label="One more"
                      disabled={l.quantity >= l.variant.stock_quantity}
                      onClick={() => setQuantity(l.variant.id, l.quantity + 1)}
                    >
                      <Plus className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      aria-label="Remove"
                      onClick={() => setQuantity(l.variant.id, 0)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {lines.length > 0 && (
            <div className="mt-3 flex items-baseline justify-between rounded-lg bg-muted px-3 py-2">
              <span className="text-sm text-muted-foreground">
                Goods, before discounts and delivery
              </span>
              <span className="font-semibold">{formatPrice(estimate)}</span>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              disabled={lines.length === 0 || fulfil.isPending}
              onClick={place}
            >
              {fulfil.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Placing…
                </>
              ) : (
                <>
                  <Check className="size-4" />
                  Place this order
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => setDeclining((d) => !d)}>
              {declining ? <X className="size-4" /> : null}
              {declining ? "Never mind" : "Cannot fill this"}
            </Button>
          </div>

          {/* The reason is required and the customer reads it: "we cannot do
              this" with no explanation leaves them sending the same photo. */}
          {declining && (
            <div className="mt-3">
              <Label htmlFor={`decline-${request.id}`}>Tell them why</Label>
              <textarea
                id={`decline-${request.id}`}
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="We are out of most of this today — try again tomorrow?"
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              <Button
                variant="outline"
                className="mt-2"
                disabled={!note.trim() || decline.isPending}
                onClick={async () => {
                  await decline.mutateAsync({
                    requestId: request.id,
                    note: note.trim(),
                  });
                  onDone();
                }}
              >
                {decline.isPending && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                Send that
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
