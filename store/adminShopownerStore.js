"use client";

import { create } from "zustand";
import apiClient from "@/api/apiClient";

export const useShopOwnerStore = create((set, get) => ({
    // --- State ---
    shopOwners: [],
    pendingOwners: [],
    selectedOwner: null,
    isLoading: false,
    error: null,

    // --- Actions ---

    // 1. Fetch all shop owners
    fetchAllOwners: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.get("/admin/shop-owners");
            set({ shopOwners: response.data.data || response.data, isLoading: false });
        } catch (err) {
            set({ error: err.response?.data?.message || "Failed to fetch shop owners", isLoading: false });
        }
    },

    // 2. Fetch only pending shop owners (is_approved: false)
    fetchPendingOwners: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.get("/admin/shop-owners/pending-approval");
            set({ pendingOwners: response.data.data || response.data, isLoading: false });
        } catch (err) {
            set({ error: err.response?.data?.message || "Failed to fetch pending owners", isLoading: false });
        }
    },

    // 3. Register a new Shop Owner (Matches Schema Fields)
    createShopOwner: async (ownerData) => {
        set({ isLoading: true, error: null });
        try {
            // ownerData should include: business_name, user_id, gst_number, bank_account_number, etc.
            const response = await apiClient.post("/admin/shop-owners", ownerData);
            const newOwner = response.data.data || response.data;

            set((state) => ({
                shopOwners: [...state.shopOwners, newOwner],
                isLoading: false
            }));
            return { success: true, data: newOwner };
        } catch (err) {
            set({ error: err.response?.data?.message || "Failed to create shop owner", isLoading: false });
            return { success: false };
        }
    },

    // 4. Update Business Details
    updateShopOwner: async (ownerId, updateData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.patch(`/admin/shop-owners/${ownerId}`, updateData);
            const updatedOwner = response.data.data || response.data;

            set((state) => ({
                shopOwners: state.shopOwners.map((o) => (o._id === ownerId ? updatedOwner : o)),
                selectedOwner: updatedOwner,
                isLoading: false,
            }));
            return { success: true };
        } catch (err) {
            set({ error: err.response?.data?.message || "Update failed", isLoading: false });
            return { success: false };
        }
    },

    // 5. Update status (Approve/Disapprove)
    // 5. Approve Owner
    approveOwner: async (ownerId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.put(`/admin/shop-owners/${ownerId}/approve`);
            const updatedOwner = response.data.data || response.data;
            
            set((state) => ({
                shopOwners: state.shopOwners.map((o) => (o._id === ownerId ? updatedOwner : o)),
                pendingOwners: state.pendingOwners.filter((o) => o._id !== ownerId),
                selectedOwner: updatedOwner, // Update selected view
                isLoading: false,
            }));
            return { success: true };
        } catch (err) {
            set({ error: err.response?.data?.message || "Approval failed", isLoading: false });
            return { success: false };
        }
    },

    // 6. Reject Owner
    rejectOwner: async (ownerId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.put(`/admin/shop-owners/${ownerId}/reject`);
            const updatedOwner = response.data.data || response.data;
            
            set((state) => ({
                shopOwners: state.shopOwners.map((o) => (o._id === ownerId ? updatedOwner : o)),
                pendingOwners: state.pendingOwners.filter((o) => o._id !== ownerId),
                selectedOwner: updatedOwner, // Update selected view
                isLoading: false,
            }));
            return { success: true };
        } catch (err) {
            set({ error: err.response?.data?.message || "Rejection failed", isLoading: false });
            return { success: false };
        }
    },

    // 7. Revoke Owner (e.g., suspend or deactivate)
    revokeOwner: async (ownerId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.put(`/admin/shop-owners/${ownerId}/revoke`);
            const updatedOwner = response.data.data || response.data;
            
            set((state) => ({
                shopOwners: state.shopOwners.map((o) => (o._id === ownerId ? updatedOwner : o)),
                // If revoking means they are no longer pending, filter them out.
                // If they become pending again, they would be fetched by fetchPendingOwners.
                pendingOwners: state.pendingOwners.filter((o) => o._id !== ownerId), 
                selectedOwner: updatedOwner, // Update selected view
                isLoading: false,
            }));
            return { success: true };
        } catch (err) {
            set({ error: err.response?.data?.message || "Revocation failed", isLoading: false });
            return { success: false };
        }
    },

    // 6. Fetch a specific owner by ID
    fetchOwnerById: async (ownerId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.get(`/admin/shop-owners/${ownerId}`);
            set({ selectedOwner: response.data.data || response.data, isLoading: false });
        } catch (err) {
            set({ error: err.response?.data?.message || "Owner not found", isLoading: false });
        }
    },

    


    // Utilities
    clearStoreErrors: () => set({ error: null }),
    clearSelectedOwner: () => set({ selectedOwner: null }),
}));