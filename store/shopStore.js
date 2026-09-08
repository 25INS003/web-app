"use client";

import { create } from "zustand";
import apiClient from "@/api/apiClient";

export const useShopStore = create((set, get) => ({
  // --- STATE ---
  myShops: [],
  isLoading: false,
  error: null,
  currentShop: null,

  // --- ACTIONS ---

  fetchMyShops: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get("/shopowneruser/shops/my-shops");
      set({ myShops: response.data.data.shops, isLoading: false });
    } catch (err) {
      console.error("Error fetching shops:", err);
      // Assuming error message is available on err.response.data.message
      const errorMessage = err.response?.data?.message || "Failed to fetch shops.";
      set({ error: errorMessage, isLoading: false });
    }
  },

  /**
   * Creates a new shop.
   * Route: POST /create/shops
   * @param {Partial<Shop>} shopData - Data for the new shop (name, phone, lat/lng, etc.)
   */
  createNewShop: async (shopData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post("/shopowneruser/create/shops", shopData);
      const newShop = response.data.data.shop; 

      // Add the new shop to the state immutably
      set((state) => ({
        myShops: [...state.myShops, newShop],
        isLoading: false,
      }));

      return newShop;
    } catch (err) {
      console.error("Error creating shop:", err);
      const errorMessage = err.response?.data?.message || "Failed to create shop.";
      set({ error: errorMessage, isLoading: false });
      return undefined;
    }
  },

  /**
   * Updates an existing shop.
   * Route: PUT /shops/:shopId
   * @param {string} shopId - The shop's `id` (a uuid; the Mongo `_id` is gone)
   * @param {Partial<Shop>} updateData - The fields to update
   */
  updateExistingShop: async (shopId, updateData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.put(`/shopowneruser/shops/${shopId}`, updateData);
      const updatedShop = response.data?.data?.shop || response.data?.shop || response.data?.data; 

      if (!updatedShop) {
        throw new Error("Invalid response structure from server");
      }

      // Update the shop in the state
      set((state) => ({
        myShops: state.myShops.map((shop) =>
          shop.id === shopId ? { ...shop, ...updatedShop } : shop
        ),
        isLoading: false,
      }));

      return updatedShop;
    } catch (err) {
      console.error(`Error updating shop ${shopId}:`, err);
      const errorMessage = err.response?.data?.message || "Failed to update shop.";
      set({ error: errorMessage, isLoading: false });
      return undefined;
    }
  },

  /**
   * Gets analytics for a specific shop.
   * Route: GET /shops/:shopId/analytics
   * NOTE: This action doesn't update the central `myShops` list, 
   * but rather returns the data for the component to use.
   * @param {string} shopId - The ID of the shop
   */
  getShopAnalytics: async (shopId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get(`/shopowneruser/shops/${shopId}/analytics`);
      const analytics = response.data.data.analytics; 

      set({ isLoading: false });
      return analytics;
    } catch (err) {
      console.error(`Error fetching analytics for shop ${shopId}:`, err);
      const errorMessage = err.response?.data?.message || "Failed to fetch analytics.";
      set({ error: errorMessage, isLoading: false });
      return undefined;
    }
  },
  
  /**
   * Soft deletes a shop (marks as inactive).
   * Route: DELETE /shopowneruser/shops/:shopId (Logic remains same, conceptually "deactivate")
   */
  deactivateExistingShop: async (shopId) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.delete(`/shopowneruser/shops/${shopId}`);
      
      set((state) => ({
        myShops: state.myShops.map((shop) => 
          shop.id === shopId ? { ...shop, shop_status: 'inactive' } : shop
        ),
        isLoading: false,
      }));
      
      return { success: true, message: "Shop deactivated successfully" };
    } catch (err) {
      console.error(`Error deactivating shop ${shopId}:`, err);
      const errorMessage = err.response?.data?.message || "Failed to deactivate shop.";
      set({ error: errorMessage, isLoading: false });
      return { success: false, message: errorMessage };
    }
  },

  /**
   * Activates a shop (marks as active).
   * Route: PUT /shopowneruser/shops/:shopId/activate
   */
  activateExistingShop: async (shopId) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.put(`/shopowneruser/shops/${shopId}/activate`);
      
      set((state) => ({
        myShops: state.myShops.map((shop) => 
          shop.id === shopId ? { ...shop, shop_status: 'active' } : shop
        ),
        isLoading: false,
      }));
      
      return { success: true, message: "Shop activated successfully" };
    } catch (err) {
      console.error(`Error activating shop ${shopId}:`, err);
      const errorMessage = err.response?.data?.message || "Failed to activate shop.";
      set({ error: errorMessage, isLoading: false });
      return { success: false, message: errorMessage };
    }
  },

  /**
   * Permanently deletes a shop and all related data.
   * Route: DELETE /shopowneruser/shops/:shopId/permanent
   */
  /**
   * Ask an admin to delete a shop.
   *
   * Replaces `permanentlyDeleteShop`, which called the owner's old
   * permanent-delete route — the one thing in the system that could erase a
   * shop's order history, sitting on the dashboard of the person least likely
   * to be weighing that. The decision is an admin's now; this records the ask.
   *
   * The shop stays in `myShops` on purpose. Nothing has been deleted, and a
   * row that vanished on "request sent" would tell the owner the opposite of
   * what happened.
   */
  requestShopDeletion: async (shopId, reason) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await apiClient.post(
        `/shopowneruser/shops/${shopId}/deletion-request`,
        { reason }
      );
      const request = data?.data?.deletion_request;

      set((state) => ({
        myShops: state.myShops.map((shop) =>
          shop.id === shopId
            ? { ...shop, metadata: { ...(shop.metadata || {}), deletion_request: request } }
            : shop
        ),
        isLoading: false,
      }));

      return { success: true, message: "Deletion request sent — an admin will review it" };
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to send the deletion request.";
      set({ error: errorMessage, isLoading: false });
      return { success: false, message: errorMessage };
    }
  },

  withdrawShopDeletionRequest: async (shopId) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.delete(`/shopowneruser/shops/${shopId}/deletion-request`);

      set((state) => ({
        myShops: state.myShops.map((shop) => {
          if (shop.id !== shopId) return shop;
          const metadata = { ...(shop.metadata || {}) };
          delete metadata.deletion_request;
          return { ...shop, metadata };
        }),
        isLoading: false,
      }));

      return { success: true, message: "Deletion request withdrawn" };
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Failed to withdraw the request.";
      set({ error: errorMessage, isLoading: false });
      return { success: false, message: errorMessage };
    }
  },

  setCurrentShop: (shop) => {
    set({ currentShop: shop });
  },
  
}));