"use client";

import { useParams } from "next/navigation";
import { ProductDetailView } from "@/features/products/ProductDetailView";

/**
 * A shop owner looking at one of their own products.
 *
 * The screen itself lives in features/products so the admin route can mount the
 * same one; the two differ only in where the header buttons go.
 */
export default function ViewProductPage() {
  const { shopId, productId } = useParams();

  return (
    <ProductDetailView
      // Not `router.back()`. Creating a product lands here from the add form,
      // so history's previous entry is "Add New Product" — a button reading
      // "Back to Products" walked the owner straight back into an empty form.
      backHref="/products"
      backLabel="Back to Products"
      editHref={`/products/${shopId}/edit/${productId}`}
    />
  );
}
