"use client";

import { useParams, useRouter } from "next/navigation";
import { AddProductForm } from "@/features/products/AddProductForm";

/**
 * An admin adding a product to somebody else's shop.
 *
 * The API has always permitted this — product.routes.js guards on
 * ["admin", "shop_owner"] and validateResourceOwnership lets an admin past the
 * shop check — but there was no way to ask for it: the only add-product screen
 * lived behind requireApprovedShopOwner, which redirects an admin away.
 *
 * Mounted under (admin) rather than widening that guard. Letting admins into
 * the shop-owner section would put them in a dashboard built around "your
 * shop", which is the wrong frame for someone acting on all of them.
 *
 * Lands on this shop's product list, which is where the new product is now
 * visible. It used to return to the shops list — correct when that was the only
 * admin screen a shop had, but it meant a successful create showed you nothing
 * you had just done.
 */
export default function AdminAddProductPage() {
  const { shopId } = useParams();
  const router = useRouter();

  return (
    <AddProductForm
      shopId={shopId}
      // `replace` for the same reason as the shop-owner route: a spent form
      // should not be what Back returns to.
      onCreated={() => router.replace(`/admin/shops/${shopId}/products`)}
    />
  );
}
