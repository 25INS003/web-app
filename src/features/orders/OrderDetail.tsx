"use client";

import { ArrowLeft, Check, MapPin, XCircle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { orderShopName } from "@/lib/api/schemas/order";
import { cn, formatPrice } from "@/lib/utils";
import { useOrders } from "./hooks";
import {
  STATUS_LABEL,
  formatDate,
  statusBadgeVariant,
  timelineSteps,
} from "./status";

export function OrderDetail({ orderId }: { orderId: string }) {
  const q = useOrders();

  if (q.isPending) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-6 h-64 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  const order = q.data?.find(
    (o) => o.order_id === orderId || o._id === orderId,
  );

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
  const steps = timelineSteps(order);
  const addr = order.delivery_address;

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
            #{order.order_id}
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
        <h2 className="font-display text-lg font-semibold">Tracking</h2>
        {cancelled ? (
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <XCircle className="size-4 text-destructive" /> This order was{" "}
            {STATUS_LABEL[order.order_status].toLowerCase()}.
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
            <div
              key={it._id ?? i}
              className="flex items-center justify-between gap-3 py-2.5 text-sm"
            >
              <span className="min-w-0">
                <span className="font-medium">{it.product_name}</span>{" "}
                <span className="text-muted-foreground">× {it.quantity}</span>
              </span>
              <span className="font-mono tabular-nums">
                {formatPrice(it.total_price)}
              </span>
            </div>
          ))}
        </div>
        <dl className="mt-3 space-y-1.5 border-t border-border pt-3 text-sm">
          <SummaryRow label="Subtotal" value={order.order_amount} />
          <SummaryRow label="Delivery" value={order.delivery_fee} />
          <SummaryRow label="Total" value={order.total_amount} strong />
        </dl>
        <p className="mt-3 text-xs text-muted-foreground">
          Payment:{" "}
          <span className="font-medium capitalize text-foreground">
            {order.payment_method ?? "cod"}
          </span>
        </p>
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
