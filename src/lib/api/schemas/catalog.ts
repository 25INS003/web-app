import { z } from "zod";
import { objectId } from "./common";

const productImageSchema = z.object({
  url: z.string(),
  alt_text: z.string().nullish(),
});

// shop_id / category_id come back populated (objects) on catalog reads, or as
// bare ids elsewhere — accept either.
const shopRefSchema = z.object({
  id: objectId.optional(),
  name: z.string().optional(),
  rating: z.number().optional(),
});
const categoryRefSchema = z.object({
  id: objectId.optional(),
  name: z.string().optional(),
});

export const catalogProductSchema = z.object({
  id: objectId,
  product_id: z.string().optional(),
  name: z.string(),
  slug: z.string().optional(),
  brand: z.string().nullish(),
  description: z.string().nullish(),
  unit: z.string().nullish(),
  price: z.number(),
  compare_at_price: z.number().nullish(),
  price_min: z.number().nullish(),
  price_max: z.number().nullish(),
  is_in_stock: z.boolean().optional(),
  rating: z.number().optional(),
  total_ratings: z.number().optional(),
  // The API field is `main_image_url`. It was declared here as `main_image`,
  // and z.object strips keys it does not declare — so the image was discarded
  // on every parse and productImage() below always returned undefined. No
  // product image has ever rendered on the storefront; the cards fall back to
  // a cart glyph, which reads as "this product has no photo" rather than as a
  // bug. Found after rehosting the catalogue imagery into our own bucket, when
  // the pictures still did not appear.
  main_image_url: z.string().nullish(),
  images: z.array(productImageSchema).optional(),
  shop_id: z.union([objectId, shopRefSchema]).nullish(),
  category_id: z.union([objectId, categoryRefSchema]).nullish(),
});
export type CatalogProduct = z.infer<typeof catalogProductSchema>;

// GET /catalog/get -> { data, total, page, limit, pages }
export const productListSchema = z.object({
  data: z.array(catalogProductSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  pages: z.number().optional(),
});
export type ProductList = z.infer<typeof productListSchema>;

export const catalogCategorySchema = z.object({
  id: objectId,
  name: z.string(),
  slug: z.string().optional(),
  image_url: z.string().nullish(),
  parent_id: objectId.nullish(),
  is_active: z.boolean().optional(),
});
export type CatalogCategory = z.infer<typeof catalogCategorySchema>;

// --- product detail (GET /catalog/id/:id -> { product, variants }) ---
export const productVariantSchema = z.object({
  id: objectId,
  sku: z.string().nullish(),
  name: z.string(),
  attributes: z
    .array(z.object({ name: z.string(), value: z.string() }))
    .optional(),
  price: z.number(),
  compare_at_price: z.number().nullish(),
  stock_quantity: z.number().optional(),
  is_default: z.boolean().optional(),
  is_active: z.boolean().optional(),
  is_available: z.boolean().optional(),
  images: z.array(productImageSchema).optional(),
});
export type ProductVariant = z.infer<typeof productVariantSchema>;

export const productDetailSchema = z.object({
  product: catalogProductSchema,
  variants: z.array(productVariantSchema),
});
export type ProductDetail = z.infer<typeof productDetailSchema>;

export const reviewSchema = z.object({
  id: objectId,
  rating: z.number(),
  comment: z.string().nullish(),
  customer_id: z
    .union([
      objectId,
      z.object({
        first_name: z.string().optional(),
        last_name: z.string().optional(),
      }),
    ])
    .nullish(),
  created_at: z.string().nullish(),
});
export type Review = z.infer<typeof reviewSchema>;

export const reviewsResponseSchema = z.object({
  reviews: z.array(reviewSchema),
  averageRating: z.number().nullish(),
});
export type ReviewsResponse = z.infer<typeof reviewsResponseSchema>;

export function reviewerName(r: Review): string {
  return r.customer_id && typeof r.customer_id === "object"
    ? `${r.customer_id.first_name ?? ""} ${r.customer_id.last_name ?? ""}`.trim() ||
        "Customer"
    : "Customer";
}

// --- display helpers (resolve populated-or-id refs) ---
export function shopName(p: CatalogProduct): string | undefined {
  return p.shop_id && typeof p.shop_id === "object" ? p.shop_id.name : undefined;
}
export function productImage(p: CatalogProduct): string | undefined {
  return p.main_image_url || p.images?.[0]?.url || undefined;
}
