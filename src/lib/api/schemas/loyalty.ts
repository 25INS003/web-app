import { z } from "zod";
import { objectId } from "./common";

// "diamond" was missing here while the backend schema, the tier ladder and the
// model all defined it — combined with the .catch() below, a Diamond member was
// silently rendered as Bronze rather than failing loudly.
export const loyaltyTierSchema = z
  .enum(["bronze", "silver", "gold", "platinum", "diamond"])
  .catch("bronze");
export type LoyaltyTier = z.infer<typeof loyaltyTierSchema>;

// GET /loyalty/points -> { loyaltyPoints, tierBenefits }
export const loyaltyPointsSchema = z.object({
  total_points: z.number().catch(0),
  available_points: z.number().catch(0),
  used_points: z.number().catch(0),
  points_expiring_soon: z.number().catch(0),
  next_expiry_date: z.string().nullish(),
  lifetime_points_earned: z.number().catch(0),
  lifetime_points_redeemed: z.number().catch(0),

  tier: loyaltyTierSchema,
  tier_label: z.string().catch("Bronze"),
  point_multiplier: z.number().catch(1),
  next_tier: loyaltyTierSchema.nullish(),
  next_tier_label: z.string().nullish(),
  points_to_next_tier: z.number().catch(0),
  tier_progress: z.number().catch(0),

  // Conversion rates come from the server so the UI never hardcodes what a
  // point is worth — the two drifted apart once already, in dollars.
  point_value_rupees: z.number().catch(0.1),
  rupees_per_point: z.number().catch(10),
  available_value_rupees: z.number().catch(0),
});
export type LoyaltyPoints = z.infer<typeof loyaltyPointsSchema>;

export const tierBenefitsSchema = z.object({
  name: z.string().catch("Bronze"),
  tier: loyaltyTierSchema,
  minPoints: z.number().catch(0),
  maxPoints: z.number().nullish(),
  multiplier: z.number().catch(1),
  benefits: z.array(z.string()).catch([]),
});
export type TierBenefits = z.infer<typeof tierBenefitsSchema>;

export const loyaltyResponseSchema = z.object({
  loyaltyPoints: loyaltyPointsSchema,
  tierBenefits: tierBenefitsSchema.optional(),
});

// GET /loyalty/history
export const loyaltyHistoryTypeSchema = z
  .enum([
    "earned",
    "bonus",
    "referral",
    "birthday",
    "login",
    "review",
    "survey",
    "redemption",
    "expired",
    "adjustment",
    "refund_deduction",
    "tier_upgrade",
    "campaign",
    "social_share",
  ])
  .catch("adjustment");
export type LoyaltyHistoryType = z.infer<typeof loyaltyHistoryTypeSchema>;

export const loyaltyHistoryEntrySchema = z.object({
  id: objectId.optional(),
  type: loyaltyHistoryTypeSchema,
  points: z.number().catch(0),
  description: z.string().catch(""),
  created_at: z.string().nullish(),
  expiry_date: z.string().nullish(),
  tier_at_transaction: loyaltyTierSchema.nullish(),
  // Either a bare foreign key or a populated order, normalised to one shape.
  //
  // Under Mongo this was `.populate()`d into an object, and the schema demanded
  // that object. Postgres sends the plain uuid, so every history row failed
  // `safeParse` — and because the list drops unparseable rows rather than
  // failing, the page rendered an empty history for everyone instead of an
  // error anybody would have chased. Accepting both shapes is what keeps a
  // future join from breaking it back the other way.
  order_id: z
    .union([
      objectId.transform((id) => ({
        id,
        order_number: null,
        total_amount: null,
      })),
      z.object({
        id: objectId.optional(),
        order_number: z.string().nullish(),
        total_amount: z.number().nullish(),
      }),
    ])
    .nullish(),
});
export type LoyaltyHistoryEntry = z.infer<typeof loyaltyHistoryEntrySchema>;

export const loyaltyHistoryResponseSchema = z.object({
  // Rows the client cannot make sense of are dropped rather than failing the
  // whole list: one malformed history entry should not blank the page.
  history: z.array(z.unknown()).transform((rows) =>
    rows.flatMap((row) => {
      const parsed = loyaltyHistoryEntrySchema.safeParse(row);
      return parsed.success ? [parsed.data] : [];
    }),
  ),
});

// GET /loyalty/redeem -> the catalogue plus the caller's spendable balance
export const rewardSchema = z.object({
  // `id`, not `_id`. This is a required field inside a plain `z.array()`, so
  // the Mongo-era name did not degrade to a missing key — it threw, and the
  // whole rewards catalogue rendered its error state.
  id: objectId,
  name: z.string().catch(""),
  description: z.string().catch(""),
  short_description: z.string().nullish(),
  type: z.string().catch("discount"),
  points_required: z.number().catch(0),
  reward_value: z.number().catch(0),
  min_order_amount: z.number().nullish(),
  stock_quantity: z.number().nullish(),
  icon: z.string().nullish(),
  redemption_instructions: z.string().nullish(),
});
export type Reward = z.infer<typeof rewardSchema>;

export const rewardsResponseSchema = z.object({
  rewards: z.array(rewardSchema),
  userPoints: z.number().catch(0),
});
