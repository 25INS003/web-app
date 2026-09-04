"use client";

import { useParams } from "next/navigation";
import { ProductDetailView } from "@/features/products/ProductDetailView";

/**
 * An admin looking at a product in somebody else's shop.
 *
 * Reached from the approval queue, where the decision is "approve or reject"
 * and the queue card shows a name, a price and a thumbnail — not enough to
 * judge on. This is the rest of it: the description, every variant, the stock,
 * the images.
 *
 * Mounted under (admin) rather than sending the admin to the owner's own view
 * URL, because the (page) group is behind requireApprovedShopOwner and
 * redirects an admin away. Same reason the add and edit screens are mounted
 * twice.
 *
 * Looking decides nothing — this route only reads. Approving and rejecting stay
 * on the queue, where the reason box is.
 */
export default function AdminViewProductPage() {
  const { shopId, productId } = useParams();

  return (
    <ProductDetailView
      // Named for where it actually goes. An admin arriving from the approval
      // queue still has the browser's own Back to return there; this button
      // says "shop products" because that is where it lands.
      backHref={`/admin/shops/${shopId}/products`}
      backLabel="Back to shop products"
      editHref={`/admin/shops/${shopId}/products/${productId}/edit`}
    />
  );
}
