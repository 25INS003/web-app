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
      const newShop = response.data.shop; // Assuming API returns { success: true, shop: { ... } }

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
   * @param {string} shopId - The ID of the shop to update (e.g., the Mongoose _id)
   * @param {Partial<Shop>} updateData - The fields to update
   */
  updateExistingShop: async (shopId, updateData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.put(`/shopowneruser/shops/${shopId}`, updateData);
      const updatedShop = response.data.shop; // Assuming API returns { success: true, shop: { ... } }

      // Update the shop in the state
      set((state) => ({
        myShops: state.myShops.map((shop) =>
          shop._id === shopId ? { ...shop, ...updatedShop } : shop
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
      const analytics = response.data.analytics; // Assuming API returns { success: true, analytics: { ... } }

      set({ isLoading: false });
      return analytics;
    } catch (err) {
      console.error(`Error fetching analytics for shop ${shopId}:`, err);
      const errorMessage = err.response?.data?.message || "Failed to fetch analytics.";
      set({ error: errorMessage, isLoading: false });
      return undefined;
    }
  },
  
  setCurrentShop: (shop) => {
    set({ currentShop: shop });
  },
  
}));