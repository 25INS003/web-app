// Central query-key factory. One source of truth so invalidation (incl.
// socket-driven) targets the exact keys used by queries.
export const queryKeys = {
  session: ["session"] as const,

  shops: {
    all: ["shops"] as const,
    mine: () => [...queryKeys.shops.all, "mine"] as const,
    detail: (shopId: string) =>
      [...queryKeys.shops.all, "detail", shopId] as const,
    analytics: (shopId: string) =>
      [...queryKeys.shops.all, "analytics", shopId] as const,
  },

  products: {
    all: ["products"] as const,
    list: (shopId: string, params?: Record<string, unknown>) =>
      [...queryKeys.products.all, shopId, "list", params ?? {}] as const,
    detail: (shopId: string, productId: string) =>
      [...queryKeys.products.all, shopId, "detail", productId] as const,
  },

  inventory: {
    lowStock: (shopId: string) => ["inventory", shopId, "low-stock"] as const,
    logs: (shopId: string) => ["inventory", shopId, "logs"] as const,
  },

  orders: {
    all: ["orders"] as const,
    list: (shopId: string, params?: Record<string, unknown>) =>
      [...queryKeys.orders.all, shopId, "list", params ?? {}] as const,
    stats: (shopId: string) => [...queryKeys.orders.all, shopId, "stats"] as const,
    detail: (shopId: string, orderId: string) =>
      [...queryKeys.orders.all, shopId, "detail", orderId] as const,
  },

  support: {
    all: ["support"] as const,
    tickets: () => [...queryKeys.support.all, "tickets"] as const,
    ticket: (ticketId: string) =>
      [...queryKeys.support.all, "ticket", ticketId] as const,
  },

  dashboardStats: ["dashboard-stats"] as const,
  categories: ["categories"] as const,
  notifications: {
    list: (params?: Record<string, unknown>) =>
      ["notifications", "list", params ?? {}] as const,
    count: () => ["notifications", "count"] as const,
  },

  admin: {
    shops: ["admin", "shops"] as const,
    owners: ["admin", "owners"] as const,
    analytics: (section: string) => ["admin", "analytics", section] as const,
  },
} as const;
