"use client";

import { create } from "zustand";
import apiClient from "@/api/apiClient"; // Assuming this is your configured Axios instance


export const useShopOwnerStore = create((set, get) => ({
    // --- STATE ---
    shopOwner: null, // Holds the single profile object
    isLoading: false,
    error: null,

    // --- ACTIONS ---

    /**
     * Clears the current error state.
     */
    clearError: () => set({ error: null }),

    /**
     * 1. READ: Fetches the shop owner profile for the currently authenticated user.
     * Maps to: GET /user/shopowner/get
     * @returns {Promise<void>}
     */
    fetchShopOwnerProfile: async () => {
        set({ isLoading: true, error: null });
        try {
            // API call to get the profile of the authenticated user
            const response = await apiClient.get("/user/shopowner/get");
            const fetchedProfile = response.data.data;

            // Update the store state with the single profile object
            set({
                shopOwner: fetchedProfile,
                isLoading: false,
            });
        } catch (err) {
            console.error("Fetch Shop Owner Profile failed:", err);
            const errorMessage = err.response?.message || "Failed to fetch shop owner profile.";
            set({ isLoading: false, error: errorMessage });
        }
    },

    /**
     * 2. UPDATE: Updates the shop owner profile for the currently authenticated user.
     * Maps to: PUT /user/shopowner/update
     * @param {Partial<ShopOwnerProfile>} data - The updated data (e.g., business_name, address).
     * @returns {Promise<ShopOwnerProfile | void>} The updated shop owner data.
     */
    updateShopOwnerProfile: async (data) => {
        set({ isLoading: true, error: null });
        try {
            // API call to update the profile of the authenticated user
            const response = await apiClient.put(`/user/shopowner/update`, data);
            const updatedProfile = response.data.data;

            // Update the state with the new profile object
            set({
                shopOwner: updatedProfile,
                isLoading: false,
            });
            return updatedProfile;
        } catch (err) {
            console.error("Update Shop Owner Profile failed:", err);
            const errorMessage = err.response?.data?.message || "Failed to update shop owner profile.";
            set({ isLoading: false, error: errorMessage });
        }
    },

    /**
     * 3. UPLOAD IMAGE: Uploads a profile image for the shop owner.
     * Maps to: PATCH /user/shopowner/upload-image
     * @param {File} file - The image file to upload.
     * @returns {Promise<string | void>} The URL/path of the uploaded image.
     */
    uploadShopOwnerProfileImage: async (file) => {
        set({ isLoading: true, error: null });
        try {
            const formData = new FormData();
            formData.append("image", file); // Must match the key used in upload.single("image") in your router

            const response = await apiClient.patch(
                "/user/shopowner/upload-image",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            const imageUrl = response.data.data.imageUrl; // Assuming the API returns the image URL

            // Optionally update the shopOwner state if the API returns the full updated profile
            // For now, we'll just set isLoading to false
            set({ isLoading: false });

            // You might want to refetch the profile here if the API only returns the URL
            // get().fetchShopOwnerProfile();

            return imageUrl;
        } catch (err) {
            console.error("Upload Shop Owner Profile Image failed:", err);
            const errorMessage = err.response?.data?.message || "Failed to upload profile image.";
            set({ isLoading: false, error: errorMessage });
        }
    },
}));