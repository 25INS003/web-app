"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Loader2, Package, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ordersApi } from "@/features/orders/api";
import { STATUS_LABEL, statusBadgeVariant } from "@/features/orders/status";
import { orderShopName } from "@/lib/api/schemas/order";
import type { Order } from "@/lib/api/schemas/order";
import { cn, formatPrice } from "@/lib/utils";
import { formatDate } from "./ui";

/**
 * Which order, and which item on it, a support request is about.
 *
 * Naming the row means the thread shows the order and the line it concerns,
 * instead of an agent reading "the one from Tuesday with the milk" and going
 * to find it.
 *
 * A dropdown rather than an inline list, and closed by default. Most tickets
 * are not about a specific order, so a list of past purchases sitting above
 * the description box is noise for everyone who came to ask something else —
 * and it implies an answer is required, which it is not.
 *
 * The ids sent from here are a CLAIM, not evidence. The server re-checks that
 * the order is the caller's and the item is on it before storing either — see
 * `resolveTicketSubject`. This exists to save typing, not to authorise.
 */

const RECENT_COUNT = 10;
const RECENT_DAYS = 1;

const orderedAt = (o: Order) =>
  new Date(o.order_time ?? o.created_at ?? 0).getTime();

/**
 * The orders worth offering: the last ten, plus anything from the last day.
 *
 * A union rather than one rule, because the two answer different questions.
 * "The last ten" covers somebody chasing an old delivery; "the last day"
 * covers a heavy day where the most recent order is already eleventh in the
 * list — which is exactly when a problem is most likely to be fresh.
 */
export function relevantOrders(all: Order[], now = Date.now()): Order[] {
  const sorted = [...all].sort((a, b) => orderedAt(b) - orderedAt(a));
  const cutoff = now - RECENT_DAYS * 24 * 60 * 60 * 1000;

  const keep = new Set(sorted.slice(0, RECENT_COUNT).map((o) => o.id));
  for (const o of sorted) {
    if (orderedAt(o) >= cutoff) keep.add(o.id);
  }
  // Filtered from `sorted` rather than concatenated, so the result stays in
  // one order and holds no duplicates.
  return sorted.filter((o) => keep.has(o.id));
}

/** Whether a row is there because it is from the last day, rather than merely recent. */
export const isFresh = (o: Order, now = Date.now()) =>
  orderedAt(o) >= now - RECENT_DAYS * 24 * 60 * 60 * 1000;

export function OrderPicker({
  orderId,
  productId,
  onChange,
}: {
  orderId: string;
  productId: string;
  onChange: (next: { orderId: string; productId: string }) => void;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  const orders = useQuery({
    queryKey: ["orders", "for-support"] as const,
    queryFn: ordersApi.getOrders,
    // Not fetched until asked for — no reason to pull an order history to
    // render a closed trigger.
    enabled: open || Boolean(orderId),
    staleTime: 60_000,
  });

  const detail = useQuery({
    queryKey: ["orders", orderId, "lines"] as const,
    queryFn: () => ordersApi.getOrder(orderId),
    enabled: Boolean(orderId),
  });

  // Close on Escape or a click elsewhere. Both, because either one alone is a
  // dropdown somebody ends up trapped in.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onDown = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  const shown = relevantOrders(orders.data ?? []);
  const items = detail.data?.items ?? [];
  const chosen = (orders.data ?? []).find((o) => o.id === orderId);
  const chosenItem = items.find((i) => i.product_id === productId);

  // ── Answered: one line, with a way to narrow or drop it.
  if (orderId) {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-primary/40 bg-primary/5 px-3 py-2 text-sm">
        <Package className="size-4 shrink-0 text-primary" />
        <span className="min-w-0 truncate">
          <span className="font-mono font-semibold">
            #{chosen?.order_number ?? "order"}
          </span>
          {chosenItem ? ` · ${chosenItem.product_name}` : " · whole order"}
        </span>
        <div className="ml-auto flex shrink-0 items-center gap-3">
          <ItemMenu
            items={items}
            productId={productId}
            loading={detail.isPending}
            onPick={(pid) => onChange({ orderId, productId: pid })}
          />
          <button
            type="button"
            onClick={() => onChange({ orderId: "", productId: "" })}
            aria-label="Remove the linked order"
            className="text-muted-foreground transition hover:text-destructive"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm transition hover:border-primary/40"
      >
        <Package className="size-4 text-muted-foreground" />
        Link an order
        <span className="text-xs text-muted-foreground">(optional)</span>
        <ChevronDown
          className={cn("size-4 transition", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="absolute z-20 mt-2 max-h-80 w-full min-w-[20rem] max-w-md overflow-y-auto overscroll-contain rounded-xl border border-border bg-card p-2 shadow-lg">
          {orders.isPending ? (
            <p className="flex items-center gap-1.5 p-3 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" /> Loading your orders
            </p>
          ) : shown.length === 0 ? (
            <p className="p-3 text-xs text-muted-foreground">
              You have no orders yet.
            </p>
          ) : (
            shown.map((o, i) => {
              const fresh = isFresh(o);
              // A heading only where the group actually changes, so a list of
              // all-fresh or all-older orders carries no redundant label.
              const heading =
                i === 0
                  ? fresh
                    ? "Last 24 hours"
                    : "Recent orders"
                  : !fresh && isFresh(shown[i - 1])
                    ? "Earlier"
                    : null;

              return (
                <div key={o.id}>
                  {heading && (
                    <p className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {heading}
                    </p>
                  )}
                  <OrderCard
                    order={o}
                    onSelect={() => {
                      onChange({ orderId: o.id, productId: "" });
                      setOpen(false);
                    }}
                  />
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function OrderCard({
  order: o,
  onSelect,
}: {
  order: Order;
  onSelect: () => void;
}) {
  const count = o.items_count ?? o.items.length;
  const preview = o.item_preview ?? [];
  // `item_preview` is capped server-side, so the remainder is computed from
  // the real count rather than from what happens to have been sent.
  const more = Math.max(0, count - preview.length);
  const shop = o.shop_details_snapshot?.name ?? orderShopName(o);

  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full rounded-lg p-2 text-left transition hover:bg-muted"
    >
      <span className="flex items-start gap-3">
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm font-semibold">
              #{o.order_number}
            </span>
            <Badge variant={statusBadgeVariant(o.order_status)}>
              {STATUS_LABEL[o.order_status]}
            </Badge>
            {o.is_multi_shop && <Badge variant="outline">Multi-shop</Badge>}
          </span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
            {shop ? `${shop} · ` : ""}
            {formatDate(o.order_time ?? o.created_at)} · {count} item
            {count === 1 ? "" : "s"}
          </span>
        </span>
        <span className="shrink-0 text-right">
          <span className="block font-mono text-sm font-semibold tabular-nums">
            {formatPrice(o.total_amount)}
          </span>
          {o.discount_amount > 0 && (
            <span className="block text-[10px] text-muted-foreground">
              {o.promotion_code ?? "Discount"} −{formatPrice(o.discount_amount)}
            </span>
          )}
        </span>
      </span>

      {/* What was actually in it. An order is recognised by its contents —
          "the one with the milk" — far more readily than by its number. */}
      {preview.length > 0 && (
        <span className="mt-1.5 flex items-center gap-1.5">
          {preview.map((line, i) =>
            line.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={line.image_url}
                alt=""
                className="size-6 shrink-0 rounded border border-border object-cover"
              />
            ) : (
              <span
                key={i}
                className="grid size-6 shrink-0 place-items-center rounded border border-border bg-muted text-muted-foreground"
              >
                <Package className="size-3" />
              </span>
            ),
          )}
          <span className="min-w-0 truncate text-xs text-muted-foreground">
            {preview.map((l) => l.product_name).join(", ")}
            {more > 0 ? ` +${more} more` : ""}
          </span>
        </span>
      )}
    </button>
  );
}

/**
 * Narrowing to one item, once an order is chosen.
 *
 * A plain select on the same line rather than a second gallery: the order is
 * settled by this point and this is a refinement.
 */
function ItemMenu({
  items,
  productId,
  loading,
  onPick,
}: {
  items: {
    product_id?: string | null;
    product_name: string;
    quantity: number;
  }[];
  productId: string;
  loading: boolean;
  onPick: (productId: string) => void;
}) {
  if (loading) return <Loader2 className="size-3.5 animate-spin" />;
  // Nothing to narrow to on a single-line order.
  if (items.length <= 1) return null;

  return (
    <select
      aria-label="Which item?"
      value={productId}
      onChange={(e) => onPick(e.target.value)}
      className="max-w-[12rem] truncate rounded-lg border border-border bg-card px-2 py-1 text-xs outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
    >
      <option value="">Whole order</option>
      {items.map((item) => (
        <option
          key={item.product_id ?? item.product_name}
          value={item.product_id ?? ""}
          // An older line with no product_id cannot be stored; shown but not
          // selectable, so its absence is visible rather than puzzling.
          disabled={!item.product_id}
        >
          {item.product_name}
          {item.quantity > 1 ? ` × ${item.quantity}` : ""}
        </option>
      ))}
    </select>
  );
}
