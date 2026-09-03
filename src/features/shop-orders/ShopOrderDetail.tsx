"use client";

import {
  ArrowLeft,
  Copy,
  ImageIcon,
  MapPin,
  Navigation,
  Phone,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProgressiveImage } from "@/components/ProgressiveImage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { recipientOf } from "@/lib/api/schemas/shopOrder";
import { useShopOrder } from "./hooks";

const money = (v: number | null | undefined) =>
  v === null || v === undefined ? "—" : formatPrice(v);

const when = (v: string | null | undefined) =>
  v ? new Date(v).toLocaleString("en-IN") : null;

/**
 * One order, as the person packing and delivering it needs to see it.
 *
 * The board answers "what has arrived"; this answers "what do I put in the bag
 * and where does it go". Coordinates are shown and copyable because somebody
 * has to drive to this, and a pincode is not a destination.
 */
export function ShopOrderDetail({
  shopId,
  orderId,
}: {
  shopId: string;
  orderId: string;
}) {
  const router = useRouter();
  const { data: order, isPending, error } = useShopOrder(shopId, orderId);
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // Clipboard is permission-gated and absent over plain http. The value is
      // on screen either way, so failing silently beats an error toast for
      // something the user can read and type.
    }
  };

  if (isPending) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">
        This order could not be loaded. It may belong to a different shop.
      </div>
    );
  }

  const addr = order.delivery_address_snapshot;
  const { name: recipient, phone } = recipientOf(addr);
  const hasCoords =
    typeof addr?.lat === "number" &&
    typeof addr?.lng === "number" &&
    Number.isFinite(addr.lat) &&
    Number.isFinite(addr.lng);
  const coords = hasCoords ? `${addr!.lat}, ${addr!.lng}` : null;

  const lines = [
    addr?.address_line,
    addr?.landmark,
    [addr?.city, addr?.state].filter(Boolean).join(", "),
    addr?.pincode,
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          type="button"
          aria-label="Back to orders"
          onClick={() => router.push("/dashboard/orders")}
          className="rounded-xl hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {order.order_number}
          </h1>
          <p className="text-sm text-muted-foreground">
            {when(order.order_time) ?? "—"}
          </p>
        </div>
        <Badge className="ml-auto rounded-lg capitalize">
          {order.order_status.replace(/_/g, " ")}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Deliver to */}
        <section className="rounded-2xl border border-border bg-card p-5 lg:col-span-1">
          <h2 className="flex items-center gap-2 font-semibold">
            <MapPin className="size-4 text-primary" /> Deliver to
          </h2>

          <div className="mt-3 space-y-1 text-sm">
            {recipient && (
              <p className="flex items-center gap-2 font-medium text-foreground">
                <User className="size-4 shrink-0 text-muted-foreground" />
                {recipient}
              </p>
            )}
            {phone && (
              <p className="flex items-center gap-2 text-muted-foreground">
                <Phone className="size-4 shrink-0" />
                <a href={`tel:${phone}`} className="hover:text-primary">
                  {phone}
                </a>
              </p>
            )}
            {lines.map((l) => (
              <p key={l} className="text-muted-foreground">
                {l}
              </p>
            ))}
            {lines.length === 0 && (
              <p className="text-muted-foreground">No address on this order.</p>
            )}
          </div>

          {/* Coordinates. The reason this screen exists: a courier needs a
              point, not a pincode. Copyable because the usual next step is
              pasting them into whatever navigation app is already open. */}
          {hasCoords ? (
            <div className="mt-4 rounded-xl bg-muted/50 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Coordinates
              </p>
              <p className="mt-1 font-mono text-sm text-foreground">{coords}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-lg"
                  onClick={() => copy("coords", coords as string)}
                >
                  <Copy className="size-3.5" />
                  {copied === "coords" ? "Copied" : "Copy"}
                </Button>
                <Button size="sm" className="rounded-lg" asChild>
                  {/* A plain geo-style query rather than a vendor deep link, so
                      it opens in whatever the device treats as its map. */}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${addr!.lat},${addr!.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Navigation className="size-3.5" /> Open in Maps
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-4 rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
              No coordinates were recorded for this address, so it has to be
              found from the lines above.
            </p>
          )}

          {order.special_instructions && (
            <div className="mt-4 rounded-xl border border-warning/30 bg-warning/10 p-3 text-sm">
              <p className="font-medium text-warning">Customer note</p>
              <p className="mt-1 text-foreground">
                {order.special_instructions}
              </p>
            </div>
          )}
        </section>

        {/* Items */}
        <section className="rounded-2xl border border-border bg-card p-5 lg:col-span-2">
          <h2 className="font-semibold">
            Items{" "}
            <span className="text-muted-foreground">({order.items.length})</span>
          </h2>

          <ul className="mt-4 divide-y divide-border">
            {order.items.map((item, i) => (
              <li
                key={`${item.product_id ?? item.product_name}-${i}`}
                className="flex items-center gap-4 py-3"
              >
                <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                  {item.image_url ? (
                    <ProgressiveImage
                      src={item.image_url}
                      alt={item.product_name ?? "Product"}
                      className="absolute inset-0 size-full object-cover"
                    />
                  ) : (
                    <div className="grid size-full place-items-center">
                      <ImageIcon className="size-5 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">
                    {item.product_name ?? "Item"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {money(item.unit_price)} each
                  </p>
                </div>
                <div className="text-right">
                  {/* The pack count, given the most weight on the row — it is
                      the number that gets this wrong most often. */}
                  <p className="font-mono text-lg font-semibold tabular-nums">
                    ×{item.quantity}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {money(item.total_price)}
                  </p>
                </div>
              </li>
            ))}
            {order.items.length === 0 && (
              <li className="py-6 text-center text-sm text-muted-foreground">
                No line items were recorded on this order.
              </li>
            )}
          </ul>

          <dl className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
            <Row label="Items" value={money(order.order_amount)} />
            <Row label="Delivery" value={money(order.delivery_fee)} />
            {order.discount_amount ? (
              <Row label="Discount" value={`− ${money(order.discount_amount)}`} />
            ) : null}
            <div className="flex justify-between pt-1 text-base font-semibold">
              <dt>Total</dt>
              <dd>{money(order.total_amount)}</dd>
            </div>
            <p className="pt-2 text-xs text-muted-foreground">
              {order.payment_method?.toUpperCase() ?? "—"} ·{" "}
              {order.payment_status ?? "—"}
            </p>
          </dl>
        </section>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
