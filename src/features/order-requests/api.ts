import { api } from "@/lib/api/client";
import {
  fulfilledOrderSchema,
  orderRequestListSchema,
  orderRequestPageSchema,
  orderRequestSchema,
} from "@/lib/api/schemas/orderRequest";
import { z } from "zod";
import { objectId } from "@/lib/api/schemas/common";
import type {
  FulfilledOrder,
  OrderRequest,
  OrderRequestPage,
  OrderRequestStatus,
} from "@/lib/api/schemas/orderRequest";

/**
 * Photographed orders, both ends.
 *
 * One module for the customer's calls and the shop's, because they are two
 * halves of one conversation — and the shapes they read are the same rows.
 */
export const orderRequestsApi = {
  /**
   * Send a shop a picture of a list.
   *
   * `api.upload`, not `api.post`: the client-wide 20s timeout is the wrong
   * shape for a transfer, where the duration is a function of the photo's size
   * and the customer's upstream bandwidth. A 5 MB photo on a slow connection is
   * a healthy 40-second upload, and it was the exact case being aborted.
   */
  async create(
    input: {
      shopId: string;
      addressId: string;
      note?: string;
      files: File[];
    },
    onProgress?: (percent: number) => void,
  ): Promise<OrderRequest> {
    const fd = new FormData();
    fd.append("shop_id", input.shopId);
    fd.append("address_id", input.addressId);
    if (input.note) fd.append("note", input.note);
    for (const file of input.files) fd.append("images", file);

    return orderRequestSchema.parse(
      await api.upload<unknown>("/customer/order-requests", fd, onProgress),
    );
  },

  async listMine(): Promise<OrderRequest[]> {
    return orderRequestListSchema.parse(
      await api.get<unknown>("/customer/order-requests"),
    );
  },

  async cancel(requestId: string): Promise<void> {
    await api.delete(`/customer/order-requests/${requestId}`);
  },

  /** The shop's queue. */
  async listForShop(
    shopId: string,
    {
      status,
      page = 1,
      limit = 20,
    }: { status?: OrderRequestStatus; page?: number; limit?: number } = {},
  ): Promise<OrderRequestPage> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });
    if (status) params.set("status", status);
    return orderRequestPageSchema.parse(
      await api.get<unknown>(`/shops/${shopId}/order-requests?${params}`),
    );
  },

  /**
   * Turn one into a real order.
   *
   * The shop sends only what it read off the photograph — variants and
   * quantities. Prices, discounts and the stock guard are the server's, for the
   * same reason they are at a customer's own checkout.
   */
  async fulfil(
    shopId: string,
    requestId: string,
    input: {
      items: { variant_id: string; quantity: number }[];
      special_instructions?: string;
    },
  ): Promise<FulfilledOrder> {
    return fulfilledOrderSchema.parse(
      await api.post<unknown>(
        `/shops/${shopId}/order-requests/${requestId}/fulfil`,
        input,
      ),
    );
  },

  async decline(
    shopId: string,
    requestId: string,
    note: string,
  ): Promise<void> {
    await api.post(`/shops/${shopId}/order-requests/${requestId}/decline`, {
      note,
    });
  },
};

/** A variant the shop can put on an order, for the keying-in box. */
export const catalogueVariantSchema = z.object({
  id: objectId,
  product_id: objectId,
  name: z.string(),
  product_name: z.string(),
  sku: z.string().nullish(),
  unit: z.string().nullish(),
  price: z.number(),
  stock_quantity: z.number(),
  is_available: z.boolean().nullish(),
});
export type CatalogueVariant = z.infer<typeof catalogueVariantSchema>;

/** A shop the customer's list can be sent to. */
export const deliverableShopSchema = z.object({
  id: objectId,
  name: z.string().nullish(),
  logo_url: z.string().nullish(),
  city: z.string().nullish(),
  rating: z.union([z.number(), z.string()]).nullish(),
  address_line: z.string().nullish(),
});
export type DeliverableShop = z.infer<typeof deliverableShopSchema>;

/** The shops that reach one of the customer's addresses. */
export async function listShopsForAddress(
  addressId: string,
): Promise<DeliverableShop[]> {
  return z
    .array(deliverableShopSchema)
    .parse(
      await api.get<unknown>(
        `/customer/order-requests/shops?address_id=${addressId}`,
      ),
    );
}

/** The shop's own shelves, searched by whatever the shopkeeper typed. */
export async function searchShopCatalogue(
  shopId: string,
  q: string,
): Promise<CatalogueVariant[]> {
  const params = new URLSearchParams({ limit: "20" });
  if (q.trim()) params.set("q", q.trim());
  return z
    .array(catalogueVariantSchema)
    .parse(
      await api.get<unknown>(
        `/shops/${shopId}/order-requests/catalogue?${params}`,
      ),
    );
}
