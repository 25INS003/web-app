"use client";

import { Heart, Loader2, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart, useAddToCart, useRemoveCartItem, useUpdateCartItem } from "@/features/cart/useCart";
import { useWishlistToggle } from "@/features/wishlist/useWishlist";
import type { CatalogProduct } from "@/lib/api/schemas/catalog";
import { cn } from "@/lib/utils";

/**
 * Add / stepper / wishlist, on a product card.
 *
 * The card is a <Link>, so every control here stops the click before it
 * navigates. Without that, pressing "+" both increments the line and opens the
 * product page under it.
 *
 * The quantity is read from the CART, not held in local state. A card is one of
 * many views of the same line — the same product can be on screen twice, in a
 * suggestions row and in the grid below it — and local state would let those
 * two disagree with each other and with the cart badge in the header.
 */

/** Swallow the card's navigation, for a control drawn on top of a link. */
const stop = (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
};

export function ProductCardActions({ product }: { product: CatalogProduct }) {
  const cart = useCart();

  const add = useAddToCart();
  const update = useUpdateCartItem();
  const remove = useRemoveCartItem();

  const variantId = product.default_variant_id ?? null;
  const wishlist = useWishlistToggle(product.id, variantId);
  // The DEFAULT VARIANT's stock, not the product's. `total_stock_quantity` is
  // summed across every variant, so a product with one empty variant and one
  // full one reads as in stock — and the card offered an Add that the server
  // then refused with "maximum stock reached".
  //
  // Falls back to the product-level answer only when the variant's stock was
  // not sent: unknown is not zero, and treating a missing field as out of stock
  // would empty every card the moment a payload changed.
  const variantStock = product.default_variant_stock;
  const inStock =
    typeof variantStock === "number"
      ? variantStock > 0
      : (product.is_in_stock ?? true);

  // The line for this product's variant, if the cart holds one.
  const line = cart.data?.items?.find(
    (i) => i.product_var_id.id === variantId,
  );
  const qty = line?.quantity ?? 0;

  // Cap at what the shop actually has of THIS variant, so "+" cannot ask for
  // stock that is not there and get an error back from the server for it.
  const max =
    typeof variantStock === "number"
      ? variantStock
      : (product.total_stock_quantity ?? undefined);
  const atMax = typeof max === "number" && qty >= max;

  const busy =
    add.isPending || update.isPending || remove.isPending;

  // No variant means nothing to add — a product mid-setup, or one whose only
  // variant was withdrawn. The card still links through to the product page,
  // which can explain itself better than a dead button can.
  if (!variantId) return null;

  const onAdd = (e: React.MouseEvent) => {
    stop(e);
    add.mutate({ productVarId: variantId, quantity: 1 });
  };

  const onIncrement = (e: React.MouseEvent) => {
    stop(e);
    if (!line || atMax) return;
    update.mutate({ id: line.id, quantity: qty + 1 });
  };

  const onDecrement = (e: React.MouseEvent) => {
    stop(e);
    if (!line) return;
    // Down past one removes the line rather than asking the server for a
    // quantity of zero, which it refuses.
    if (qty <= 1) remove.mutate(line.id);
    else update.mutate({ id: line.id, quantity: qty - 1 });
  };

  const onWishlist = (e: React.MouseEvent) => {
    stop(e);
    wishlist.toggle();
  };

  return (
    <div className="mt-3 flex items-center gap-2">
      {qty > 0 ? (
        <div className="flex flex-1 items-center justify-between rounded-xl bg-primary text-primary-foreground">
          <button
            type="button"
            onClick={onDecrement}
            disabled={busy}
            aria-label={qty <= 1 ? "Remove from cart" : "Decrease quantity"}
            className="grid size-9 place-items-center rounded-l-xl transition hover:bg-black/10 disabled:opacity-60"
          >
            <Minus className="size-4" />
          </button>
          <span
            className="min-w-6 text-center text-sm font-semibold tabular-nums"
            aria-live="polite"
          >
            {busy ? <Loader2 className="mx-auto size-4 animate-spin" /> : qty}
          </span>
          <button
            type="button"
            onClick={onIncrement}
            disabled={busy || atMax}
            aria-label={atMax ? "No more in stock" : "Increase quantity"}
            className="grid size-9 place-items-center rounded-r-xl transition hover:bg-black/10 disabled:opacity-40"
          >
            <Plus className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onAdd}
          disabled={!inStock || busy}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition",
            inStock
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "cursor-not-allowed bg-muted text-muted-foreground",
          )}
        >
          {add.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <ShoppingBag className="size-4" />
          )}
          {inStock ? "Add" : "Out of stock"}
        </button>
      )}

      {/* Shown signed-out too: pressing it is how somebody finds out they need
          an account, and the hook already redirects to /login with a reason.
          A control that appears on sign-in moves the card's layout under the
          cursor. */}
      <button
        type="button"
        onClick={onWishlist}
        disabled={wishlist.isPending}
        aria-label={wishlist.saved ? "Remove from wishlist" : "Save to wishlist"}
        aria-pressed={wishlist.saved}
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-xl border transition",
          wishlist.saved
            ? "border-destructive/30 bg-destructive/10 text-destructive"
            : "border-border text-muted-foreground hover:text-foreground",
        )}
      >
        <Heart className={cn("size-4", wishlist.saved && "fill-current")} />
      </button>
    </div>
  );
}
