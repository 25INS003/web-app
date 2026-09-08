"use client";

import { create } from "zustand";
import apiClient from "@/api/apiClient";

export const useAdminShopStore = create((set, get) => ({
    // --- State ---
    shops: [],
    pendingShops: [],
    // Shops whose owner has asked for them to be deleted.
    deletionRequests: [],
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
                shops: state.shops.map((s) => (s.id === shopId ? updatedShop : s)),
                pendingShops: state.pendingShops.filter((s) => s.id !== shopId),
                selectedShop: updatedShop, // update if currently viewing detail
                isLoading: false,
            }));

            return { success: true };
        } catch (err) {
            // The message, not just the flag. This endpoint refuses some
            // requests for reasons only it knows — activating a shop whose
            // OWNER is not approved comes back 409 with the fix in the text —
            // and a caller that only sees `false` can say nothing better than
            // "update failed".
            const message = err.response?.data?.message || "Update failed";
            set({ error: message, isLoading: false });
            return { success: false, message };
        }
    },

    /**
     * The deletion queue — what the dashboard card counts.
     *
     * Kept apart from `shops` rather than derived from it: the dashboard shows
     * this count without ever loading the full shop list, and deriving it
     * would make the card read zero until somebody visited the shops page.
     */
    fetchDeletionRequests: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.get("/admin/shops/deletion-requests");
            const rows = response.data.data || [];
            set({ deletionRequests: rows, isLoading: false });
            return rows;
        } catch (err) {
            set({
                error: err.response?.data?.message || "Failed to load deletion requests",
                isLoading: false,
            });
            return [];
        }
    },

    /**
     * Delete a shop for good — the only place this can happen.
     *
     * The owner's dashboard used to carry the equivalent; it now refuses and
     * points here. This removes the shop's products and its ORDER HISTORY, so
     * the caller is expected to have confirmed properly first.
     */
    deleteShop: async (shopId, reason = "") => {
        set({ isLoading: true, error: null });
        try {
            await apiClient.delete(`/admin/shops/${shopId}`, { data: { reason } });

            set((state) => ({
                shops: state.shops.filter((s) => s.id !== shopId),
                pendingShops: state.pendingShops.filter((s) => s.id !== shopId),
                // Answered, so it leaves the queue the dashboard counts.
                deletionRequests: (state.deletionRequests || []).filter((s) => s.id !== shopId),
                selectedShop: null,
                isLoading: false,
            }));

            return { success: true };
        } catch (err) {
            const message = err.response?.data?.message || "Delete failed";
            set({ error: message, isLoading: false });
            return { success: false, message };
        }
    },

    /** Turn the owner's request down and leave the shop alone. */
    declineShopDeletion: async (shopId, note) => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.delete(
                `/admin/shops/${shopId}/deletion-request`,
                { data: { note } }
            );
            const updated = response.data.data || response.data;

            set((state) => ({
                shops: state.shops.map((s) => (s.id === shopId ? updated : s)),
                deletionRequests: (state.deletionRequests || []).filter((s) => s.id !== shopId),
                isLoading: false,
            }));

            return { success: true };
        } catch (err) {
            const message = err.response?.data?.message || "Could not decline the request";
            set({ error: message, isLoading: false });
            return { success: false, message };
        }
    },

    // Utilities
    clearError: () => set({ error: null }),
    clearSelectedShop: () => set({ selectedShop: null }),
}));
