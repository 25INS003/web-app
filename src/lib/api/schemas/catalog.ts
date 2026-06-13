import { z } from "zod";
import { objectId } from "./common";

const productImageSchema = z.object({
  url: z.string(),
  alt_text: z.string().nullish(),
});

// shop_id / category_id come back populated (objects) on catalog reads, or as
// bare ids elsewhere — accept either.
const shopRefSchema = z.object({
  _id: objectId.optional(),
  name: z.string().optional(),
  rating: z.number().optional(),
});
const categoryRefSchema = z.object({
  _id: objectId.optional(),
  name: z.string().optional(),
});

export const catalogProductSchema = z.object({
  _id: objectId,
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
  main_image: z.string().nullish(),
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
  _id: objectId,
  name: z.string(),
  slug: z.string().optional(),
  image_url: z.string().nullish(),
  parent_id: objectId.nullish(),
  is_active: z.boolean().optional(),
});
export type CatalogCategory = z.infer<typeof catalogCategorySchema>;

// --- display helpers (resolve populated-or-id refs) ---
export function shopName(p: CatalogProduct): string | undefined {
  return p.shop_id && typeof p.shop_id === "object" ? p.shop_id.name : undefined;
}
export function productImage(p: CatalogProduct): string | undefined {
  return p.main_image || p.images?.[0]?.url || undefined;
}
