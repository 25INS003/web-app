import { z } from "zod";
import { objectId } from "./common";

export const cartItemSchema = z.object({
  _id: objectId, // cart-item id (for update/remove)
  quantity: z.number(),
  item_total: z.number().nullish(),
  is_available: z.boolean().optional(),
  product_var_id: z.object({
    _id: objectId,
    name: z.string(),
    price: z.number(),
    compare_at_price: z.number().nullish(),
    stock_quantity: z.number().optional(),
    images: z.array(z.object({ url: z.string() })).optional(),
    shop_id: z
      .union([objectId, z.object({ name: z.string().optional() })])
      .nullish(),
  }),
});
export type CartItem = z.infer<typeof cartItemSchema>;

export const cartSchema = z.object({
  cart_id: objectId.nullish(),
  items: z.array(cartItemSchema),
});
export type Cart = z.infer<typeof cartSchema>;

export const cartTotalSchema = z.object({
  total_amount: z.number(),
  delivery_fee: z.number(),
  final_amount: z.number(),
  items_count: z.number(),
  has_unavailable_items: z.boolean().optional(),
  is_empty: z.boolean().optional(),
});
export type CartTotal = z.infer<typeof cartTotalSchema>;

export function cartItemShop(item: CartItem): string | undefined {
  const s = item.product_var_id.shop_id;
  return s && typeof s === "object" ? s.name : undefined;
}
