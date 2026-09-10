import { api } from "@/lib/api/client";

export type ShopRole = "manager" | "orders" | "stock" | "viewer";

export type ShopMember = {
  id: string;
  role: ShopRole;
  status: "active" | "revoked";
  permissions: string[];
  created_at: string;
  user: {
    id: string;
    email: string;
    first_name?: string | null;
    last_name?: string | null;
  };
};

/** The role vocabulary comes from the server so the picker cannot drift. */
export type RoleOption = { role: ShopRole; permissions: string[] };

export const teamApi = {
  list: (shopId: string) =>
    api.get<{ members: ShopMember[]; roles: RoleOption[] }>(
      `/shops/${shopId}/members`,
    ),

  add: (shopId: string, email: string, role: ShopRole) =>
    api.post<{ member: ShopMember }>(`/shops/${shopId}/members`, {
      email,
      role,
    }),

  setRole: (shopId: string, memberId: string, role: ShopRole) =>
    api.put<{ member: ShopMember }>(`/shops/${shopId}/members/${memberId}`, {
      role,
    }),

  revoke: (shopId: string, memberId: string) =>
    api.delete<{ member: ShopMember }>(`/shops/${shopId}/members/${memberId}`),
};
