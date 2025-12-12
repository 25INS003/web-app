"use client";

import { create } from "zustand";
import apiClient from "@/api/apiClient"; // Ensure this client has your baseURL (e.g., /api/v1) configured

export const useShopOwnerStore = create((set, get) => ({
  // --- STATE ---
  shopOwner: null, // Holds the aggregated profile (User fields + nested shop_owner object)
  isLoading: false,
  error: null,

  // --- ACTIONS ---

  /**
   * Clears the current error state.
   */
  clearError: () => set({ error: null }),

  /**
   * 1. READ: Fetches the shop owner profile for the currently authenticated user.
   * Maps to: GET /api/v1/user/shopowner/get
   */
  fetchShopOwnerProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get("/user/shopowner/get");
      // The backend returns the aggregated object in response.data.data
      const fetchedProfile = response.data.data;

      set({
        shopOwner: fetchedProfile,
        isLoading: false,
      });
    } catch (err) {
      console.error("Fetch Shop Owner Profile failed:", err);
      const errorMessage =
        err.response?.data?.message || "Failed to fetch shop owner profile.";
      set({ isLoading: false, error: errorMessage });
    }
  },

  /**
   * 2. UPDATE: Updates the shop owner profile (User details + Business details).
   * Maps to: PUT /api/v1/user/shopowner/update
   * @param {Object} data - Contains fields like first_name, business_name, etc.
   */
  updateShopOwnerProfile: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.put(`/user/shopowner/update`, data);
      // The backend returns the re-fetched complete aggregated profile
      const updatedProfile = response.data.data;

      set({
        shopOwner: updatedProfile,
        isLoading: false,
      });
      return updatedProfile;
    } catch (err) {
      console.error("Update Shop Owner Profile failed:", err);
      const errorMessage =
        err.response?.data?.message || "Failed to update shop owner profile.";
      set({ isLoading: false, error: errorMessage });
    }
  },

  /**
   * 3. UPLOAD IMAGE: Uploads a profile image for the shop owner.
   * Maps to: PATCH /api/v1/user/shopowner/upload-image
   * @param {File} file - The image file to upload.
   */
  uploadShopOwnerProfileImage: async (file) => {
    set({ isLoading: true, error: null });
    try {
      const formData = new FormData();
      // "image" key matches `upload.single("image")` in your router
      formData.append("image", file);

      const response = await apiClient.patch(
        "/user/shopowner/upload-image",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Backend returns the updated User object (not the full aggregate, but it has the new profile_image)
      const updatedUser = response.data.data;
      const newImageUrl = updatedUser.profile_image;

      // Optimistically update the current state with the new image URL
      const currentShopOwner = get().shopOwner;
      if (currentShopOwner) {
        set({
          shopOwner: {
            ...currentShopOwner,
            profile_image: newImageUrl, // User fields are at the root of the aggregated object
          },
          isLoading: false,
        });
      } else {
        // If state was empty, just stop loading (or you could trigger a fetch)
        set({ isLoading: false });
      }

      return newImageUrl;
    } catch (err) {
      console.error("Upload Shop Owner Profile Image failed:", err);
      const errorMessage =
        err.response?.data?.message || "Failed to upload profile image.";
      set({ isLoading: false, error: errorMessage });
    }
  },
}));