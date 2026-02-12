"use client";

import { create } from "zustand";
import apiClient from "@/api/apiClient";

export const useAdminShopStore = create((set, get) => ({
    // --- State ---
    shops: [],
    pendingShops: [],
    selectedShop: null,
    isLoading: false,
    error: null,

    // --- Actions ---

    // 1. Fetch all shops
    fetchAllShops: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.get("/admin/shops");
            set({ shops: response.data.data || response.data, isLoading: false });
        } catch (err) {
            set({ error: err.response?.data?.message || "Failed to fetch shops", isLoading: false });
        }
    },

    // 2. Fetch pending shops
    fetchPendingShops: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.get("/admin/shops/pending-approval");
            set({ pendingShops: response.data.data || response.data, isLoading: false });
        } catch (err) {
            set({ error: err.response?.data?.message || "Failed to fetch pending shops", isLoading: false });
        }
    },

    // 3. Get Shop By ID
    fetchShopById: async (shopId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.get(`/admin/shops/${shopId}`);
            set({ selectedShop: response.data.data || response.data, isLoading: false });
        } catch (err) {
            set({ error: err.response?.data?.message || "Shop not found", isLoading: false });
        }
    },

    // 4. Update Shop Status (Approve/Reject)
    updateShopStatus: async (shopId, status, reason = "") => {
        set({ isLoading: true, error: null });
        try {
            // Backend expects: { status: 'approved' | 'rejected', reason: string (optional) }
            const response = await apiClient.put(`/admin/shops/${shopId}/approval`, {
                status,
                reason
            });

            const updatedShop = response.data.data || response.data;

            set((state) => ({
                shops: state.shops.map((s) => (s._id === shopId ? updatedShop : s)),
                pendingShops: state.pendingShops.filter((s) => s._id !== shopId),
                selectedShop: updatedShop, // update if currently viewing detail
                isLoading: false,
            }));

            return { success: true };
        } catch (err) {
            set({ error: err.response?.data?.message || "Update failed", isLoading: false });
            return { success: false };
        }
    },

    // Utilities
    clearError: () => set({ error: null }),
    clearSelectedShop: () => set({ selectedShop: null }),
}));
