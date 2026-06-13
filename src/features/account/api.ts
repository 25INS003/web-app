import { api } from "@/lib/api/client";
import { loyaltyResponseSchema } from "@/lib/api/schemas/loyalty";
import type { LoyaltyPoints } from "@/lib/api/schemas/loyalty";

export const accountApi = {
  async getLoyalty(): Promise<LoyaltyPoints> {
    return loyaltyResponseSchema.parse(await api.get<unknown>("/loyalty/points"))
      .loyaltyPoints;
  },
};
