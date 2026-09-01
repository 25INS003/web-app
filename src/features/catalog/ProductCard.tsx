import { Star, Store, Tag } from "lucide-react";
import { ProductCardActions } from "./ProductCardActions";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ProgressiveImage } from "@/components/ProgressiveImage";
import { productImage, shopName } from "@/lib/api/schemas/catalog";
import type { CatalogProduct } from "@/lib/api/schemas/catalog";
import { formatPrice } from "@/lib/utils";

export function ProductCard({ product }: { product: CatalogProduct }) {
  const img = productImage(product);
  const shop = shopName(product);
  const inStock = product.is_in_stock ?? true;
  const off =
    product.compare_at_price && product.compare_at_price > product.price
      ? Math.round((1 - product.price / product.compare_at_price) * 100)
      : 0;

  return (
    // The link and the buttons are siblings, not nested. A <button> inside an
    // <a> is invalid HTML and browsers disagree about which one a click or an
    // Enter keypress belongs to — the controls stop propagation as well, but
    // not nesting them is the part that makes keyboard use work.
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-all hover:-translate-y-1 hover:shadow-lg">
      <Link
        href={`/p/${product.product_id ?? product.id}`}
        className="flex flex-1 flex-col"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {img ? (
            <ProgressiveImage
              src={img}
              alt={product.name}
              className="size-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="grid size-full place-items-center bg-gradient-to-br from-primary/10 to-success/10 text-3xl">
              🛒
            </div>
          )}
          {off > 0 && (
            <Badge className="absolute right-2.5 top-2.5">{off}% off</Badge>
          )}
          {!inStock && (
            <Badge variant="muted" className="absolute left-2.5 top-2.5">
              Out of stock
            </Badge>
          )}
        </div>

        <div className="flex flex-1 flex-col p-3.5">
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
            {product.name}
          </h3>
          {/* Shop and brand are different things — who sells it, and whose
            product it is — and the card used to print the shop alone with no
            label, so "Green Basket" gave no clue which of the two it was.
            Same treatment as the cart: an icon and a visually-hidden label
            each, so the distinction survives without relying on colour or on
            position. An icon alone is a guess for a sighted user, and colour
            alone is nothing at all to a screen reader.

            Either may be absent — brand is nullable free text, and a payload
            without the populated shop resolves to undefined. */}
          {(shop || product.brand) && (
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
              {shop && (
                <span className="inline-flex min-w-0 items-center gap-1 text-foreground/80">
                  <Store
                    className="size-3 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <span className="sr-only">Sold by </span>
                  <span className="truncate">{shop}</span>
                </span>
              )}
              {product.brand && (
                <span className="inline-flex min-w-0 items-center gap-1 text-muted-foreground">
                  <Tag className="size-3 shrink-0" aria-hidden />
                  <span className="sr-only">Brand </span>
                  <span className="truncate">{product.brand}</span>
                </span>
              )}
            </p>
          )}
          <div className="mt-auto flex items-end justify-between pt-3">
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-base font-bold tabular-nums">
                {formatPrice(product.price)}
              </span>
              {product.compare_at_price &&
                product.compare_at_price > product.price && (
                  <span className="font-mono text-xs text-muted-foreground line-through">
                    {formatPrice(product.compare_at_price)}
                  </span>
                )}
            </div>
            {product.rating ? (
              <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                <Star className="size-3 fill-warning text-warning" />
                {product.rating.toFixed(1)}
              </span>
            ) : null}
          </div>
        </div>
      </Link>

      {/* Outside the link, and given the same horizontal padding as the text
          above so the row lines up with the price. */}
      <div className="px-3.5 pb-3.5">
        <ProductCardActions product={product} />
      </div>
    </div>
  );
}
