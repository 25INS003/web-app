import { z } from "zod";
import { api } from "@/lib/api/client";
import { isoDate, objectId } from "@/lib/api/schemas/common";

/**
 * A discount code, as the admin endpoints hand it back.
 *
 * Amounts are rupees on the wire — the backend converts at its edge — EXCEPT
 * `discount_value`, which is a percentage for a percentage code and a rupee
 * amount for a fixed one. That asymmetry is real and lives in the pricing
 * service; the form below labels the field per type rather than pretending
 * otherwise.
 */
export const promotionSchema = z.object({
  id: objectId,
  name: z.string(),
  code: z.string().nullish(),
  description: z.string().nullish(),
  discount_type: z.enum(["percentage", "fixed", "free_shipping"]).catch("percentage"),
  discount_value: z.coerce.number().catch(0),
  min_order_amount: z.coerce.number().nullish(),
  max_discount_amount: z.coerce.number().nullish(),
  usage_limit: z.number().nullish(),
  usage_limit_per_user: z.number().nullish(),
  // Counted from the usage table, not the stale `used_count` column.
  used_count: z.number().optional().default(0),
  start_date: isoDate.nullish(),
  expiry_date: isoDate.nullish(),
  is_active: z.boolean(),
  shop_id: objectId.nullish(),
});
export type Promotion = z.infer<typeof promotionSchema>;

const listSchema = z
  .object({ promotions: z.array(z.unknown()) })
  // One unreadable row costs that row, not the whole screen.
  .transform((d) =>
    d.promotions.flatMap((row) => {
      const parsed = promotionSchema.safeParse(row);
      return parsed.success ? [parsed.data] : [];
    }),
  );

export type PromotionInput = {
  name: string;
  code: string;
  discount_type: Promotion["discount_type"];
  discount_value: number;
  min_order_amount?: number | "";
  max_discount_amount?: number | "" | null;
  usage_limit?: number | "" | null;
  usage_limit_per_user?: number | "" | null;
  start_date?: string | null;
  expiry_date?: string | null;
  is_active?: boolean;
};

export const adminPromotionsApi = {
  async list(): Promise<Promotion[]> {
    return listSchema.parse(await api.get<unknown>("/admin/promotions"));
  },

  async create(input: PromotionInput): Promise<Promotion> {
    return promotionSchema.parse(
      await api.post<unknown>("/admin/promotions", input),
    );
  },

  async update(id: string, input: Partial<PromotionInput>): Promise<Promotion> {
    return promotionSchema.parse(
      await api.put<unknown>(`/admin/promotions/${id}`, input),
    );
  },

  /**
   * Remove a code.
   *
   * The server deletes only an unused one; a code that has been spent is
   * deactivated instead, because its usage rows are part of the record of what
   * those orders cost. The response says which happened.
   */
  async remove(id: string): Promise<{ deactivated: boolean }> {
    const data = await api.delete<{ deactivated?: boolean }>(
      `/admin/promotions/${id}`,
    );
    return { deactivated: Boolean(data?.deactivated) };
  },
};
