"use client";

import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { api } from "@/lib/api/client";
import { objectId } from "@/lib/api/schemas/common";

/**
 * Shop owners, reduced to what a picker needs.
 *
 * Declared here rather than imported from a shared admin feature because there
 * isn't one — the typed admin layer was reverted in favour of the legacy
 * Zustand panel, and pulling that store into a react-query screen would give
 * this page two sources of truth for the same list.
 *
 * The ticket is shared with the *person*, not the business: `user_id` is the
 * login behind the owner profile, and that is the id the participant table
 * holds. The business name is only how a human recognises which one.
 */
const ownerOptionSchema = z
  .object({
    id: objectId,
    business_name: z.string().nullish(),
    user_id: z.union([
      objectId,
      z.object({
        id: objectId,
        first_name: z.string().nullish(),
        last_name: z.string().nullish(),
        email: z.string().nullish(),
      }),
    ]),
  })
  .transform((row) => {
    const user = typeof row.user_id === "object" ? row.user_id : null;
    const person =
      [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim() ||
      user?.email ||
      "";
    // Registration writes "New Enterprise" as a placeholder, so a picker that
    // shows it lists every unfinished applicant under one indistinguishable
    // name.
    const business =
      row.business_name && row.business_name !== "New Enterprise"
        ? row.business_name
        : "";

    return {
      userId: typeof row.user_id === "object" ? row.user_id.id : row.user_id,
      label: [business, person].filter(Boolean).join(" · ") || "Shop owner",
    };
  });

const ownerListSchema = z
  .union([
    z.array(z.unknown()),
    z.object({ shopOwners: z.array(z.unknown()) }).transform((d) => d.shopOwners),
    z.object({ data: z.array(z.unknown()) }).transform((d) => d.data),
  ])
  // One unreadable owner should cost that row, not the whole picker.
  .transform((rows) =>
    rows.flatMap((row) => {
      const parsed = ownerOptionSchema.safeParse(row);
      return parsed.success && parsed.data.userId ? [parsed.data] : [];
    }),
  );

export type ShopOwnerOption = { userId: string; label: string };

export function useShopOwnerOptions() {
  return useQuery({
    queryKey: ["admin", "shop-owners", "options"] as const,
    queryFn: async (): Promise<ShopOwnerOption[]> =>
      ownerListSchema.parse(await api.get<unknown>("/admin/shop-owners")),
    // Owners change rarely, and this only feeds a dropdown.
    staleTime: 5 * 60_000,
  });
}
