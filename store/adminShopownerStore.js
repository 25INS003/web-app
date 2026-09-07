"use client";

import { create } from "zustand";
import apiClient from "@/api/apiClient";

/**
 * The owner row out of an admin action's response.
 *
 * `approve` answers with the row itself; `reject` and `revoke` answer with
 * `{ shopOwner, deactivatedShops }`, because taking an owner down also takes
 * their live shops down and the count is worth reporting. Three of these
 * actions fed `response.data.data` straight into the list, so rejecting
 * replaced the owner row with the WRAPPER — an object with no `id` and no
 * `is_approved`. The row then rendered as unverified, which is why a rejected
 * application went on saying "Pending Review".
 *
 * Reads either shape rather than assuming one, so the two response bodies stop
 * being something every call site has to remember.
 */
const ownerFrom = (response) => {
  const data = response?.data?.data ?? response?.data;
  return data?.shopOwner ?? data;
};

/** How many of their shops the action took down, when the action says so. */
const deactivatedCount = (response) =>
  (response?.data?.data ?? response?.data)?.deactivatedShops ?? 0;


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
                shopOwners: state.shopOwners.map((o) => (o.id === ownerId ? updatedOwner : o)),
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
            const updatedOwner = ownerFrom(response);
            
            set((state) => ({
                shopOwners: state.shopOwners.map((o) => (o.id === ownerId ? updatedOwner : o)),
                pendingOwners: state.pendingOwners.filter((o) => o.id !== ownerId),
                selectedOwner: updatedOwner, // Update selected view
                isLoading: false,
            }));
            return {
                success: true,
                reactivatedShops:
                    (response?.data?.data ?? response?.data)?.reactivatedShops ?? 0,
            };
        } catch (err) {
            set({ error: err.response?.data?.message || "Approval failed", isLoading: false });
            return { success: false };
        }
    },

    // 6. Reject Owner
    // `note` is required by the server: the owner is shown it, so a refusal
    // without one would leave them with nothing to act on.
    rejectOwner: async (ownerId, note) => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.put(`/admin/shop-owners/${ownerId}/reject`, { note });
            const updatedOwner = ownerFrom(response);
            
            set((state) => ({
                shopOwners: state.shopOwners.map((o) => (o.id === ownerId ? updatedOwner : o)),
                pendingOwners: state.pendingOwners.filter((o) => o.id !== ownerId),
                selectedOwner: updatedOwner, // Update selected view
                isLoading: false,
            }));
            return { success: true, deactivatedShops: deactivatedCount(response) };
        } catch (err) {
            set({ error: err.response?.data?.message || "Rejection failed", isLoading: false });
            return { success: false };
        }
    },

    /**
     * Open or close the application form for a refused owner.
     *
     * Not a verdict — it does not approve or reject anybody — so it is its own
     * action rather than a flag on one. This is how an admin answers the
     * support ticket asking for another go.
     */
    setResubmission: async (ownerId, allowed) => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.put(
                `/admin/shop-owners/${ownerId}/resubmission`,
                { allowed }
            );
            const updatedOwner = ownerFrom(response);

            set((state) => ({
                shopOwners: state.shopOwners.map((o) => (o.id === ownerId ? updatedOwner : o)),
                selectedOwner: updatedOwner,
                isLoading: false,
            }));
            return { success: true, message: response?.data?.message };
        } catch (err) {
            set({
                error: err.response?.data?.message || "Could not change that",
                isLoading: false,
            });
            return { success: false };
        }
    },

    // 7. Revoke Owner (e.g., suspend or deactivate)
    revokeOwner: async (ownerId, note) => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.put(`/admin/shop-owners/${ownerId}/revoke`, { note });
            const updatedOwner = ownerFrom(response);
            
            set((state) => ({
                shopOwners: state.shopOwners.map((o) => (o.id === ownerId ? updatedOwner : o)),
                // If revoking means they are no longer pending, filter them out.
                // If they become pending again, they would be fetched by fetchPendingOwners.
                pendingOwners: state.pendingOwners.filter((o) => o.id !== ownerId), 
                selectedOwner: updatedOwner, // Update selected view
                isLoading: false,
            }));
            return { success: true, deactivatedShops: deactivatedCount(response) };
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