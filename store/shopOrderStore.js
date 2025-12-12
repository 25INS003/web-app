"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import apiClient from "@/api/apiClient";




// --- Helper to normalize input to array ---
const normalizeIds = (ids) => (Array.isArray(ids) ? ids : [ids]);

export const useShopOrderStore = create()(
  devtools((set, get) => ({
    orders: [],
    total: 0,
    page: 1,
    limit: 25,
    isLoading: false,
    error: null,

    /**
     * GET /shops/:shopId/orders
     */
    fetchOrders: async (shopId, { page = 1, limit = 25 } = {}) => {
      set({ isLoading: true, error: null });
      try {
        const response = await apiClient.get(`/shops/${shopId}/orders`, {
          params: { page, limit },
        });

        const { orders, total } = response.data.data;

        set({
          orders: orders || [],
          total: total || 0,
          page,
          limit,
          isLoading: false,
        });
      } catch (error) {
        set({
          error: error.response?.data?.message || "Failed to fetch orders",
          isLoading: false,
        });
      }
    },

    /**
     * PUT /shops/:shopId/orders/accept
     * Expects: { orderIds: [] }
     * Returns: { acceptedCount, orders: [Updated Objects] }
     */
    acceptOrders: async (shopId, orderIds) => {
      set({ isLoading: true, error: null });
      try {
        const payloadIds = normalizeIds(orderIds);
        
        const response = await apiClient.put(`/shops/${shopId}/orders/accept`, {
          orderIds: payloadIds,
        });

        const updatedOrders = response.data.data.orders;

        // Merge updated orders into current state
        set((state) => ({
          orders: state.orders.map((order) => {
            const updated = updatedOrders.find((o) => o._id === order._id);
            return updated ? updated : order;
          }),
          isLoading: false,
        }));
      } catch (error) {
        set({
          error: error.response?.data?.message || "Failed to accept orders",
          isLoading: false,
        });
      }
    },

    /**
     * PUT /shops/:shopId/orders/ready
     * Expects: { orderIds: [] }
     * Returns: { updatedCount, orders: [Updated Objects] }
     */
    markOrdersReady: async (shopId, orderIds) => {
      set({ isLoading: true, error: null });
      try {
        const payloadIds = normalizeIds(orderIds);

        const response = await apiClient.put(`/shops/${shopId}/orders/ready`, {
          orderIds: payloadIds,
        });

        const updatedOrders = response.data.data.orders;

        set((state) => ({
          orders: state.orders.map((order) => {
            const updated = updatedOrders.find((o) => o._id === order._id);
            return updated ? updated : order;
          }),
          isLoading: false,
        }));
      } catch (error) {
        set({
          error: error.response?.data?.message || "Failed to mark orders ready",
          isLoading: false,
        });
      }
    },

    /**
     * PUT /shops/:shopId/orders/status
     * Expects: { status, orderIds: [] }
     * Returns: { updatedCount, orders: [Updated Objects] }
     */
    updateOrderStatus: async (shopId, orderIds, status) => {
      set({ isLoading: true, error: null });
      try {
        const payloadIds = normalizeIds(orderIds);

        const response = await apiClient.put(`/shops/${shopId}/orders/status`, {
          orderIds: payloadIds,
          status,
        });

        const updatedOrders = response.data.data.orders;

        set((state) => ({
          orders: state.orders.map((order) => {
            const updated = updatedOrders.find((o) => o._id === order._id);
            return updated ? updated : order;
          }),
          isLoading: false,
        }));
      } catch (error) {
        set({
          error: error.response?.data?.message || `Failed to update status to ${status}`,
          isLoading: false,
        });
      }
    },

    setPage: (page) => set({ page }),
    clearError: () => set({ error: null }),
  }))
);