import { api } from "@/lib/api/client";
import {
  adminShopListSchema,
  shopOwnerListSchema,
} from "@/lib/api/schemas/admin";
import type { AdminShop, ShopOwner } from "@/lib/api/schemas/admin";

/**
 * The admin panel's reads and approval actions.
 *
 * `approve` / `reject` / `revoke` are PUTs that take no body — the decision is
 * the endpoint, and the owner is the path segment. They differ only in the
 * (is_approved, verification_status) pair they write, so there is deliberately
 * no generic "set status" call here: routing a rejection through one would be
 * one typo away from an approval.
 */
export const adminApi = {
  /** Applicants still awaiting a decision. Oldest first — it is a queue. */
  async pendingOwners(): Promise<ShopOwner[]> {
    return shopOwnerListSchema.parse(
      await api.get<unknown>("/admin/shop-owners/pending-approval"),
    );
  },

  async allOwners(): Promise<ShopOwner[]> {
    return shopOwnerListSchema.parse(
      await api.get<unknown>("/admin/shop-owners"),
    );
  },

  async allShops(): Promise<AdminShop[]> {
    return adminShopListSchema.parse(await api.get<unknown>("/admin/shops"));
  },

  async pendingShops(): Promise<AdminShop[]> {
    return adminShopListSchema.parse(
      await api.get<unknown>("/admin/shops/pending-approval"),
    );
  },

  async approveOwner(ownerId: string): Promise<void> {
    await api.put(`/admin/shop-owners/${ownerId}/approve`);
  },

  async rejectOwner(ownerId: string): Promise<void> {
    await api.put(`/admin/shop-owners/${ownerId}/reject`);
  },
};
