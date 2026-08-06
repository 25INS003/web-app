import { api } from "@/lib/api/client";
import { dashboardStatsSchema } from "@/lib/api/schemas/dashboard";
import type { DashboardStats } from "@/lib/api/schemas/dashboard";

export const shopDashboardApi = {
  /**
   * Aggregate stats across every shop the signed-in owner holds. The backend
   * resolves the owner from the session, so there is no shopId parameter.
   */
  async getStats(): Promise<DashboardStats> {
    const data = await api.get<unknown>("/shop-owners/dashboard-stats");
    return dashboardStatsSchema.parse(data);
  },
};
