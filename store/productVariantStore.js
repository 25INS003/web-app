"use client";

import { create } from "zustand";
import apiClient from "@/api/apiClient";

export const useVariantStore = create((set, get) => ({
    // ================= STATE =================
    currentVariant: null,
    isLoading: false,
    error: null,

    // ================= ACTIONS =================

    resetCurrentVariant: () => set({ currentVariant: null, error: null }),

    // ================= API =================

    /**
     * Get Single Variant Detail
     * Route: GET /variants/:variantId
     */
    getVariantDetail: async (variantId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.get(`/variants/${variantId}`);
            set({ currentVariant: response.data.data, isLoading: false });
        } catch (err) {
            set({
                error: err.response?.data?.message || "Failed to load variant details",
                isLoading: false,
            });
        }
    },

    /**
     * Create Variant
     * Route: POST /variants/products/:productId
     */
    addVariant: async (productId, variantData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.post(
                `/variants/products/${productId}`,
                variantData
            );

            // Successfully created variant
            const newVariant = response.data.data;

            set({ currentVariant: newVariant, isLoading: false });
            return newVariant;
        } catch (err) {
            set({
                error: err.response?.data?.message || "Failed to create variant",
                isLoading: false,
            });
            return false;
        }
    },

    /**
     * Update Variant (General Info)
     * Route: PUT /variants/:variantId
     */
    updateVariant: async (variantId, variantData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.put(
                `/variants/${variantId}`,
                variantData
            );

            const updatedVariant = response.data.data;
            set({ currentVariant: updatedVariant, isLoading: false });
            return true;
        } catch (err) {
            set({
                error: err.response?.data?.message || "Failed to update variant",
                isLoading: false,
            });
            return false;
        }
    },

    /**
     * Soft Delete / Toggle Status
     * Route: PATCH /variants/:variantId/status
     */
    softDeleteVariant: async (variantId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.patch(
                `/variants/${variantId}/status`
            );

            // Update local state if we are currently viewing this variant
            const updatedVariant = response.data.data;
            const current = get().currentVariant;

            if (current && current._id === variantId) {
                set({ currentVariant: updatedVariant });
            }

            set({ isLoading: false });
            return true;
        } catch (err) {
            set({
                error: err.response?.data?.message || "Failed to update status",
                isLoading: false,
            });
            return false;
        }
    },

    /**
     * Hard Delete Variant
     * Route: DELETE /variants/:variantId
     */
    deleteVariant: async (variantId) => {
        set({ isLoading: true, error: null });
        try {
            await apiClient.delete(`/variants/${variantId}`);

            // Clear current variant if it was the one deleted
            const current = get().currentVariant;
            if (current && current._id === variantId) {
                set({ currentVariant: null });
            }

            set({ isLoading: false });
            return true;
        } catch (err) {
            set({
                error: err.response?.data?.message || "Failed to delete variant",
                isLoading: false,
            });
            return false;
        }
    },

    /**
     * Upload Variant Images (Multiple)
     * Route: POST /variants/:variantId/images
     * Middleware: upload.array("files", 13)
     */
    uploadVariantImages: async (variantId, fileArray) => {
        set({ isLoading: true, error: null });
        try {
            const formData = new FormData();

            // MUST match backend key 'files'
            fileArray.forEach((file) => {
                formData.append("files", file);
            });

            const response = await apiClient.post(
                `/variants/${variantId}/images`,
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                }
            );

            // Update state with new image data
            const updatedVariant = response.data.data;
            set({ currentVariant: updatedVariant, isLoading: false });
            return true;
        } catch (err) {
            set({
                error: err.response?.data?.message || "Failed to upload images",
                isLoading: false,
            });
            return false;
        }
    },

    /**
     * Set Main Variant Image
     * Route: PUT /variants/:variantId/images/main
     * Middleware: upload.single("file")
     */
    setMainVariantImage: async (variantId, file) => {
        set({ isLoading: true, error: null });
        try {
            const formData = new FormData();
            // MUST match backend key 'file'
            formData.append("file", file);

            const response = await apiClient.put(
                `/variants/${variantId}/images/main`,
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                }
            );

            const updatedVariant = response.data.data;
            set({ currentVariant: updatedVariant, isLoading: false });
            return true;
        } catch (err) {
            set({
                error: err.response?.data?.message || "Failed to set main image",
                isLoading: false,
            });
            return false;
        }
    },

    /**
     * Delete Variant Image by Index
     * Route: DELETE /variants/:variantId/images/:imageIndex
     */
    deleteVariantImage: async (variantId, imageIndex) => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.delete(
                `/variants/${variantId}/images/${imageIndex}`
            );

            const updatedVariant = response.data.data;
            set({ currentVariant: updatedVariant, isLoading: false });
            return true;
        } catch (err) {
            set({
                error: err.response?.data?.message || "Failed to delete image",
                isLoading: false,
            });
            return false;
        }
    },
}));