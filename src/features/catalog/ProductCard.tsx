import { Star } from "lucide-react";
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
    <Link
      href={`/p/${product.product_id ?? product.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xs transition-all hover:-translate-y-1 hover:shadow-lg"
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
        {shop && <p className="mt-0.5 text-xs text-muted-foreground">{shop}</p>}
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
  );
}
