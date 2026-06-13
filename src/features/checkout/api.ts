import { z } from "zod";
import { api } from "@/lib/api/client";
import { addressSchema } from "@/lib/api/schemas/address";
import type { Address, AddressInput } from "@/lib/api/schemas/address";

export const checkoutApi = {
  async getAddresses(): Promise<Address[]> {
    return z.array(addressSchema).parse(await api.get<unknown>("/address/get"));
  },

  async addAddress(input: AddressInput): Promise<void> {
    await api.post("/address/add", input);
  },

  async placeOrder(addressId: string): Promise<{ orderId: string }> {
    const data = await api.post<{ main_order?: { order_id?: string } }>(
      "/customer/orders",
      { address_id: addressId, payment_method: "cod" },
    );
    return { orderId: String(data?.main_order?.order_id ?? "") };
  },
};
