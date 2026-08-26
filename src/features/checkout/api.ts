import { z } from "zod";
import { api } from "@/lib/api/client";

/** What a code is worth against the basket the customer is looking at. */
export const promotionQuoteSchema = z.object({
  promotion: z.object({
    name: z.string(),
    code: z.string(),
    type: z.string(),
    discountValue: z.number(),
  }),
  cartSummary: z.object({
    originalAmount: z.number(),
    discountAmount: z.number(),
    finalAmount: z.number(),
    shippingDiscount: z.boolean().optional().default(false),
  }),
});
export type PromotionQuote = z.infer<typeof promotionQuoteSchema>;
import { addressSchema } from "@/lib/api/schemas/address";
import type { Address, AddressInput } from "@/lib/api/schemas/address";

export const checkoutApi = {
  async getAddresses(): Promise<Address[]> {
    return z.array(addressSchema).parse(await api.get<unknown>("/address/get"));
  },

  async addAddress(input: AddressInput): Promise<void> {
    await api.post("/address/add", input);
  },

  // These three are keyed on `id`, not the `address_id` mirror: the routes are
  // guarded by protectCustomerAccess("address"), which resolves the param with
  // findById. Sending address_id gets a 403 from the guard.
  async updateAddress(id: string, input: AddressInput): Promise<void> {
    await api.put(`/address/update/${id}`, input);
  },

  async deleteAddress(id: string): Promise<void> {
    await api.delete(`/address/delete/${id}`);
  },

  async setDefaultAddress(id: string): Promise<void> {
    await api.patch(`/address/default/${id}`);
  },

  /**
   * Price a code against the current basket.
   *
   * A quote only — nothing is reserved and no usage is recorded, so a customer
   * can try codes without spending them. Checkout re-prices the winning code
   * server-side against the basket actually being ordered, which is why this
   * number is never sent along with the order.
   */
  async quotePromotion(input: {
    code: string;
    totalAmount: number;
    cartItems: { product_id: string; shop_id?: string; price: number; quantity: number }[];
  }): Promise<PromotionQuote> {
    const data = await api.post<unknown>("/promotion/apply", {
      promotionCode: input.code,
      totalAmount: input.totalAmount,
      cartItems: input.cartItems,
    });
    return promotionQuoteSchema.parse(data);
  },

  async placeOrder(
    addressId: string,
    promotionCode?: string | null,
  ): Promise<{ orderId: string; discount: number }> {
    const data = await api.post<{
      main_order?: { order_number?: string; discount_amount?: number };
    }>("/customer/orders", {
      address_id: addressId,
      payment_method: "cod",
      // Only the code travels, never the discount: the server prices it again
      // against the real basket. Sending an amount would let anyone post their
      // own.
      ...(promotionCode ? { promotion_code: promotionCode } : {}),
    });
    return {
      orderId: String(data?.main_order?.order_number ?? ""),
      discount: Number(data?.main_order?.discount_amount ?? 0),
    };
  },
};
