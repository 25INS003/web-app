import { z } from "zod";

export const loyaltyTierSchema = z
  .enum(["bronze", "silver", "gold", "platinum"])
  .catch("bronze");
export type LoyaltyTier = z.infer<typeof loyaltyTierSchema>;

// GET /loyalty/points -> { loyaltyPoints, tierBenefits }
export const loyaltyPointsSchema = z.object({
  total_points: z.number().catch(0),
  available_points: z.number().catch(0),
  used_points: z.number().catch(0),
  tier: loyaltyTierSchema,
});
export type LoyaltyPoints = z.infer<typeof loyaltyPointsSchema>;

export const loyaltyResponseSchema = z.object({
  loyaltyPoints: loyaltyPointsSchema,
});
