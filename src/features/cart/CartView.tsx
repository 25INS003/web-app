"use client";

import { Loader2, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cartItemShop } from "@/lib/api/schemas/cart";
import type { CartItem } from "@/lib/api/schemas/cart";
import { ComplementRow } from "@/features/suggestions/ComplementRow";
import { formatPrice } from "@/lib/utils";
import {
  useCart,
  useCartTotal,
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
      <h1 className="font-display text-2xl font-bold tracking-tight">
        Your cart
      </h1>

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

  return (
    <div className="flex gap-4 rounded-2xl border border-border bg-card p-4 shadow-xs">
      <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-muted">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element -- varied hosts
          <img src={img} alt={v.name} className="size-full object-cover" />
        ) : (
          <span className="text-2xl">🛒</span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <p className="truncate text-sm font-semibold">{v.name}</p>
        {shop && <p className="text-xs text-muted-foreground">{shop}</p>}
        {item.is_available === false && (
          <p className="text-xs text-destructive">Currently unavailable</p>
        )}
        <div className="mt-auto flex items-center justify-between pt-2">
          <div className="flex items-center rounded-lg border border-border">
            <button
              onClick={() =>
                update.mutate({ id: item.id, quantity: Math.max(1, item.quantity - 1) })
              }
              disabled={busy || item.quantity <= 1}
              className="grid size-8 place-items-center text-muted-foreground transition hover:text-foreground disabled:opacity-40"
              aria-label="Decrease"
            >
              <Minus className="size-3.5" />
            </button>
            <span className="w-7 text-center text-sm font-medium tabular-nums">
              {update.isPending ? (
                <Loader2 className="mx-auto size-3.5 animate-spin" />
              ) : (
                item.quantity
              )}
            </span>
            <button
              onClick={() =>
                update.mutate({ id: item.id, quantity: item.quantity + 1 })
              }
              disabled={busy}
              className="grid size-8 place-items-center text-muted-foreground transition hover:text-foreground disabled:opacity-40"
              aria-label="Increase"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
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
