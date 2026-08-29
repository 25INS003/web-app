"use client";

import { Loader2, ShoppingBag, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { QuantityInput } from "@/components/ui/quantity-input";
import { ProgressiveImage } from "@/components/ProgressiveImage";
import { StockLabel } from "@/features/catalog/StockLabel";
import { maxOrderableQty } from "./constants";
import { cartItemShop } from "@/lib/api/schemas/cart";
import type { CartItem } from "@/lib/api/schemas/cart";
import { ComplementRow } from "@/features/suggestions/ComplementRow";
import { formatPrice } from "@/lib/utils";
import {
  useCart,
  useCartTotal,
  useClearCart,
  useRemoveCartItem,
  useUpdateCartItem,
} from "./useCart";

export function CartView() {
  const cart = useCart();
  const total = useCartTotal();

  if (cart.isPending) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="h-8 w-40 animate-pulse rounded bg-muted" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const items = cart.data?.items ?? [];

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <span className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
          <ShoppingBag className="size-7" />
        </span>
        <h1 className="font-display text-2xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Add some fresh groceries to get started.
        </p>
        <Button asChild className="mt-6">
          <Link href="/search">Start shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Your cart
        </h1>
        <ClearCartButton itemCount={items.length} />
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-3">
          {items.map((item) => (
            <CartRow key={item.id} item={item} />
          ))}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
            <h2 className="font-display text-lg font-semibold">Summary</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <Row label="Subtotal" value={total.data?.total_amount} />
              <Row label="Delivery" value={total.data?.delivery_fee} />
              <div className="my-2 border-t border-border" />
              <Row label="Total" value={total.data?.final_amount} strong />
            </dl>
            {total.data?.has_unavailable_items && (
              <p className="mt-3 text-xs text-warning-foreground">
                Some items are unavailable and won&apos;t be charged.
              </p>
            )}
            <Button size="lg" className="mt-5 w-full" asChild>
              <Link href="/checkout">Proceed to checkout</Link>
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Cash on delivery available
            </p>
          </div>
        </aside>
      </div>

      {/* Complements, not lookalikes: what completes this basket. Seeded from
          the cart server-side, and the cart is excluded from the results, so it
          never suggests something already listed above. Preferred over the
          affinity row here — two near-identical carousels on one page is noise,
          and "goes with what you're buying" beats "similar to what you like"
          at the point of checkout. */}
      <ComplementRow limit={4} title="Goes well with your cart" />
    </div>
  );
}

/**
 * Clearing is irreversible and throws away the whole basket, so it asks first.
 * The confirm is inline rather than a modal: the storefront kit has no dialog
 * primitive, and a two-step button keeps the destructive action one deliberate
 * click away without pulling in Radix for a single yes/no.
 *
 * The armed state auto-disarms after a few seconds so a stray click doesn't
 * leave a live "Clear everything" sitting under the cursor.
 */
function ClearCartButton({ itemCount }: { itemCount: number }) {
  const clear = useClearCart();
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(t);
  }, [armed]);

  if (!armed) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setArmed(true)}
        disabled={clear.isPending}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="size-3.5" />
        Clear cart
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">
        Remove all {itemCount} {itemCount === 1 ? "item" : "items"}?
      </span>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => clear.mutate()}
        disabled={clear.isPending}
      >
        {clear.isPending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          "Clear"
        )}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setArmed(false)}
        disabled={clear.isPending}
      >
        Cancel
      </Button>
    </div>
  );
}

function Row({
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

function CartRow({ item }: { item: CartItem }) {
  const update = useUpdateCartItem();
  const remove = useRemoveCartItem();
  const v = item.product_var_id;
  const img = v.images?.[0]?.url;
  const shop = cartItemShop(item);
  const lineTotal = item.item_total ?? v.price * item.quantity;
  const busy = update.isPending || remove.isPending;
  const stock = v.stock_quantity ?? null;
  const maxQty = maxOrderableQty(stock);
  // The line can outlive the stock that justified it — someone else buys the
  // last three between adding and checking out. The server drops these from the
  // total (has_unavailable_items), so say so on the row rather than leaving a
  // quantity the customer can't actually order.
  const overStock = stock !== null && item.quantity > stock;

  return (
    <div className="flex gap-4 rounded-2xl border border-border bg-card p-4 shadow-xs">
      <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-muted">
        {img ? (
          <ProgressiveImage src={img} alt={v.name} className="size-full object-cover" />
        ) : (
          <span className="text-2xl">🛒</span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <p className="truncate text-sm font-semibold">{v.name}</p>
        {shop && <p className="text-xs text-muted-foreground">{shop}</p>}
        {item.is_available === false ? (
          <p className="text-xs text-destructive">Currently unavailable</p>
        ) : overStock ? (
          <p className="text-xs text-destructive">
            Only {stock} left — reduce the quantity to check out
          </p>
        ) : (
          <StockLabel
            stock={stock}
            inStock
            className="text-xs"
            lowThreshold={5}
          />
        )}
        <div className="mt-auto flex items-center justify-between pt-2">
          <QuantityInput
            value={item.quantity}
            onCommit={(quantity) => update.mutate({ id: item.id, quantity })}
            max={maxQty}
            disabled={busy}
            busy={update.isPending}
            ariaLabel={`Quantity for ${v.name}`}
          />
          <span className="font-mono text-sm font-bold tabular-nums">
            {formatPrice(lineTotal)}
          </span>
        </div>
      </div>

      <button
        onClick={() => remove.mutate(item.id)}
        disabled={busy}
        className="self-start text-muted-foreground transition hover:text-destructive disabled:opacity-40"
        aria-label="Remove item"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
