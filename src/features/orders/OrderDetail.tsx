"use client";

import { useState } from "react";

import { ArrowLeft, Check, MapPin, RotateCcw, XCircle } from "lucide-react";
import type { Order } from "@/lib/api/schemas/order";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { orderShopName } from "@/lib/api/schemas/order";
import {
  reviewKey,
  reviewProductId,
} from "@/lib/api/schemas/review";
import { OrderItemReview } from "@/features/reviews/ReviewControls";
import { useMyReviews } from "@/features/reviews/hooks";
import { cn, formatPrice } from "@/lib/utils";
import { useCancelOrder, useOrder, useReorder } from "./hooks";
import { useOrderRealtime } from "./useOrderRealtime";
import {
  CUSTOMER_CANCELLABLE,
  STATUS_LABEL,
  formatDate,
  statusBadgeVariant,
  timelineSteps,
} from "./status";
import { CancelOrderDialog } from "./CancelOrderDialog";

export function OrderDetail({ orderId }: { orderId: string }) {
  const q = useOrder(orderId);
  const reviewsQ = useMyReviews();
  const reorder = useReorder();
  const cancel = useCancelOrder(orderId);
  const [cancelling, setCancelling] = useState(false);
  useOrderRealtime(orderId);

  if (q.isPending) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-6 h-64 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  const order = q.data;

  if (!order) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-display text-2xl font-bold">Order not found</h1>
        <Button asChild className="mt-6">
          <Link href="/orders">Back to orders</Link>
        </Button>
      </div>
    );
  }

  const cancelled =
    order.order_status === "cancelled" || order.order_status === "refunded";

  // Offered only while the shop still holds the goods. The server owns the real
  // boundary and refuses past it — this hides a button that would only produce
  // an error, but the two checks are not the same: the order can move between
  // the page loading and the button being pressed, and the server's answer is
  // the one that counts.
  //
  // The shop orders are checked too, because a multi-shop basket has a status
  // per shop and the parent carries only one of them.
  const canCancel =
    CUSTOMER_CANCELLABLE.has(order.order_status) &&
    (order.shop_orders ?? []).every((so) =>
      so.order_status ? CUSTOMER_CANCELLABLE.has(so.order_status) : true,
    );
  const delivered = order.order_status === "delivered";
  const steps = timelineSteps(order);
  const addr = order.delivery_address;

  // Map "this product was reviewed in this order" -> the review, so each
  // delivered line item can show its existing review (or a prompt to add one).
  const reviewByKey = new Map(
    (reviewsQ.data?.reviews ?? []).flatMap((r) => {
      const pid = reviewProductId(r);
      return r.order_id && pid
        ? [[reviewKey(r.order_id, pid), r] as const]
        : [];
    }),
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href="/orders"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All orders
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            #{order.order_number}
          </h1>
          <p className="text-sm text-muted-foreground">
            {formatDate(order.order_time ?? order.created_at)}
          </p>
        </div>
        <Badge variant={statusBadgeVariant(order.order_status)}>
          {STATUS_LABEL[order.order_status]}
        </Badge>
      </div>

      {/* tracking */}
      <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-xs">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">Tracking</h2>
          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl text-destructive"
              disabled={cancel.isPending}
              onClick={() => setCancelling(true)}
            >
              Cancel order
            </Button>
          )}
        </div>
        {cancelled ? (
          <div className="mt-3 space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <XCircle className="size-4 text-destructive" /> This order was{" "}
              {STATUS_LABEL[order.order_status].toLowerCase()}.
            </div>

            {/* Why, in the words of whoever cancelled it. Read per SHOP: on a
                multi-shop basket each merchant cancels their own half with
                their own reason, so one note on the order would either pick a
                winner or lose the others. The parent's own reason is the
                fallback, which is what a customer-initiated cancellation
                writes. */}
            {cancellationNotes(order).map((n, i) => (
              <div
                key={i}
                className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm"
              >
                {n.shop ? (
                  <p className="font-medium text-foreground">{n.shop}</p>
                ) : null}
                <p className="text-muted-foreground">{n.reason}</p>
                {n.by ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Cancelled by the {n.by === "shop" ? "shop" : n.by}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <ol className="mt-4">
            {steps.map((s, i) => (
              <li key={s.step} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      "grid size-7 shrink-0 place-items-center rounded-full border-2 transition",
                      s.done
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-transparent",
                    )}
                  >
                    <Check className="size-3.5" />
                  </span>
                  {i < steps.length - 1 && (
                    <span
                      className={cn(
                        "min-h-6 w-0.5 flex-1",
                        s.done ? "bg-primary" : "bg-border",
                      )}
                    />
                  )}
                </div>
                <div className="pb-6">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      s.done ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {s.label}
                  </p>
                  {s.at && (
                    <p className="text-xs text-muted-foreground">
                      {formatDate(s.at)}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* items */}
      <section className="mt-4 rounded-2xl border border-border bg-card p-5 shadow-xs">
        <h2 className="font-display text-lg font-semibold">
          Items · {orderShopName(order) ?? "Shop"}
        </h2>
        <div className="mt-3 divide-y divide-border">
          {order.items.map((it, i) => (
            <div key={it.id ?? i} className="py-2.5 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="min-w-0">
                  {it.product_id ? (
                    <Link
                      href={`/p/${it.product_id}`}
                      className="font-medium transition hover:text-primary hover:underline"
                    >
                      {it.product_name}
                    </Link>
                  ) : (
                    <span className="font-medium">{it.product_name}</span>
                  )}{" "}
                  <span className="text-muted-foreground">× {it.quantity}</span>
                </span>
                <span className="font-mono tabular-nums">
                  {formatPrice(it.total_price)}
                </span>
              </div>
              {delivered && it.product_id && (
                <OrderItemReview
                  orderId={order.id}
                  productId={it.product_id}
                  existing={reviewByKey.get(
                    reviewKey(order.id, it.product_id),
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <dl className="mt-3 space-y-1.5 border-t border-border pt-3 text-sm">
          <SummaryRow label="Subtotal" value={order.order_amount} />
          <SummaryRow label="Delivery" value={order.delivery_fee} />
          {/* Read from the order, not recomputed: the brackets are editable,
              so re-deriving it would restate what this customer was charged. */}
          {(order.platform_fee ?? 0) > 0 && (
            <SummaryRow label="Platform fee" value={order.platform_fee} />
          )}
          {order.discount_amount > 0 && (
            <SummaryRow
              // Named, not just "Discount": months later the code is what
              // reminds somebody why this order cost less than its items.
              label={
                order.promotion_code
                  ? `Discount (${order.promotion_code})`
                  : "Discount"
              }
              value={-order.discount_amount}
            />
          )}
          <SummaryRow label="Total" value={order.total_amount} strong />
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">
          Payment:{" "}
          <span className="font-medium capitalize text-foreground">
            {order.payment_method ?? "cod"}
          </span>
        </p>
        <Button
          variant="outline"
          className="mt-4 w-full"
          disabled={reorder.isPending || order.items.length === 0}
          onClick={() => reorder.mutate(order)}
        >
          <RotateCcw className="size-4" />
          {reorder.isPending ? "Adding to cart…" : "Reorder these items"}
        </Button>
      </section>

      {/* address */}
      {addr && (
        <section className="mt-4 rounded-2xl border border-border bg-card p-5 shadow-xs">
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
            <MapPin className="size-4" /> Delivery address
          </h2>
          {addr.contact_name && (
            <p className="mt-2 text-sm font-medium">{addr.contact_name}</p>
          )}
          <p className="text-sm text-muted-foreground">
            {[addr.address_line, addr.city, addr.state, addr.pincode]
              .filter(Boolean)
              .join(", ")}
          </p>
          {addr.contact_phone && (
            <p className="text-xs text-muted-foreground">{addr.contact_phone}</p>
          )}
        </section>
      )}
      {cancelling && (
        <CancelOrderDialog
          orderNumber={order.order_number}
          busy={cancel.isPending}
          onClose={() => setCancelling(false)}
          onConfirm={(reason) =>
            cancel.mutate(reason, { onSuccess: () => setCancelling(false) })
          }
        />
      )}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  strong,
}: {
  label: string;
  value?: number;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className={strong ? "font-semibold" : "text-muted-foreground"}>
        {label}
      </dt>
      <dd
        className={
          strong
            ? "font-mono text-base font-bold tabular-nums"
            : "font-mono tabular-nums"
        }
      >
        {value === undefined ? "—" : formatPrice(value)}
      </dd>
    </div>
  );
}

/**
 * The cancellation notes to show, one per shop that cancelled.
 *
 * Falls back to the parent order's own note, which is where a
 * customer-initiated cancellation records its reason — the per-shop rows only
 * carry one when a merchant cancelled their half.
 */
function cancellationNotes(order: Order): Array<{
  shop?: string;
  reason: string;
  by?: string;
}> {
  const fromShops = (order.shop_orders ?? [])
    .filter((so) => so.cancellation_reason)
    .map((so) => ({
      shop: so.shop?.name ?? undefined,
      reason: so.cancellation_reason as string,
      by: so.cancelled_by ?? undefined,
    }));

  if (fromShops.length) return fromShops;

  return order.cancellation_reason
    ? [{ reason: order.cancellation_reason, by: order.cancelled_by ?? undefined }]
    : [];
}
