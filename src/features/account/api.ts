import { api } from "@/lib/api/client";
import {
  loyaltyHistoryResponseSchema,
  loyaltyResponseSchema,
  rewardsResponseSchema,
} from "@/lib/api/schemas/loyalty";
import type {
  LoyaltyHistoryEntry,
  LoyaltyPoints,
  Reward,
  TierBenefits,
} from "@/lib/api/schemas/loyalty";

export const accountApi = {
  async getLoyalty(): Promise<LoyaltyPoints> {
    return loyaltyResponseSchema.parse(await api.get<unknown>("/loyalty/points"))
      .loyaltyPoints;
  },

  async getLoyaltySummary(): Promise<{
    points: LoyaltyPoints;
    benefits?: TierBenefits;
  }> {
    const res = loyaltyResponseSchema.parse(
      await api.get<unknown>("/loyalty/points"),
    );
    return { points: res.loyaltyPoints, benefits: res.tierBenefits };
  },

  async getLoyaltyHistory(limit = 20): Promise<LoyaltyHistoryEntry[]> {
    return loyaltyHistoryResponseSchema.parse(
      await api.get<unknown>(`/loyalty/history?limit=${limit}`),
    ).history;
  },

  // The catalogue lives behind GET /loyalty/redeem — an odd name for a read,
  // but it is the route the backend actually exposes.
  async getRewards(): Promise<{ rewards: Reward[]; userPoints: number }> {
    return rewardsResponseSchema.parse(
      await api.get<unknown>("/loyalty/redeem"),
    );
  },

  async redeemReward(rewardId: string): Promise<unknown> {
    return api.post<unknown>("/loyalty/claim", { rewardId });
  },
};
