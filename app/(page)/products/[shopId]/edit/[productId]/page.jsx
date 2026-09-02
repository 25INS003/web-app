"use client";

import { EditProductForm } from "@/features/products/EditProductForm";

/**
 * A shop owner editing a product in their own shop.
 *
 * The form lives in features/products so the admin review route can mount the
 * same one; it reads shopId and productId from the URL, and both routes name
 * those segments identically.
 */
export default function EditProductPage() {
  return <EditProductForm />;
}
