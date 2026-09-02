"use client";

import { useParams, useRouter } from "next/navigation";
import { AddProductForm } from "@/features/products/AddProductForm";

/**
 * A shop owner adding a product to their own shop.
 *
 * The form itself lives in features/products so the admin route can mount the
 * same one — the two differ only in which shop they are for and where they go
 * afterwards.
 */
export default function AddProductPage() {
  const { shopId } = useParams();
  const router = useRouter();

  return (
    <AddProductForm
      shopId={shopId}
      // `replace`, not `push`: the form has served its purpose, so it should
      // not sit in history behind the product it created. Pushing left the
      // browser's own Back button pointing at a filled-in form whose product
      // already exists — resubmitting it would have made a duplicate.
      onCreated={(productId) =>
        router.replace(`/products/${shopId}/view/${productId}`)
      }
    />
  );
}
