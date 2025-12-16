"use client";

import { create } from "zustand";
import apiClient from "@/api/apiClient"; // Assuming axios instance

const BASE_URL = "/product-variants";

export const useProductVariantStore = create((set, get) => ({
    // State
    variants: [], // General list
    currentVariant: null, // Single variant details
    groupedProductVariants: null, // Specific structure for "By Product"
    shopVariants: [], // Specific list for "By Shop"
    pagination: {
        current_page: 1,
        total_pages: 0,
        total_items: 0,
        has_next_page: false,
        has_previous_page: false,
    },
    summary: null, 
    isLoading: false,
    error: null,

    // Actions

    // 1. Get all variants (with filtering)
    fetchAllVariants: async (params = {}) => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.get(`${BASE_URL}/`, { params });
            const { variants, pagination, summary } = response.data.data;

            set({
                variants: variants,
                pagination: pagination,
                summary: summary,
                isLoading: false,
            });
        } catch (error) {
            set({
                error: error.response?.data?.message || "Failed to fetch variants",
                isLoading: false,
            });
        }
    },

    // 2. Get Single Variant
    fetchVariantById: async (variantId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.get(`${BASE_URL}/${variantId}`);
            set({ currentVariant: response.data.data, isLoading: false });
            return response.data.data;
        } catch (error) {
            set({
                error: error.response?.data?.message || "Failed to fetch variant",
                isLoading: false,
            });
            throw error;
        }
    },

    // 3. Get Variant by SKU
    fetchVariantBySku: async (sku) => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.get(`${BASE_URL}/sku/${sku}`);
            set({ currentVariant: response.data.data, isLoading: false });
        } catch (error) {
            set({
                error: error.response?.data?.message || "Failed to fetch variant by SKU",
                isLoading: false,
            });
        }
    },

    // 4. Get Variants by Product (Grouped Response)
    fetchVariantsByProduct: async (productId, params = {}) => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.get(`${BASE_URL}/products/${productId}/variants`, { params });
            set({ groupedProductVariants: response.data.data, isLoading: false });
        } catch (error) {
            set({
                error: error.response?.data?.message || "Failed to fetch product variants",
                isLoading: false,
            });
        }
    },

    // 5. Get Variants by Shop
    fetchVariantsByShop: async (shopId, params = {}) => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.get(`${BASE_URL}/products/${shopId}/variants`, { params }); // Note: Ensure backend route differentiates this from product ID
            const { variants, pagination, shop } = response.data.data;

            set({
                shopVariants: variants,
                pagination: pagination,
                // You might want to store the shop info separately if needed
                isLoading: false
            });
        } catch (error) {
            set({
                error: error.response?.data?.message || "Failed to fetch shop variants",
                isLoading: false,
            });
        }
    },

    // 6. Create Variant
    createVariant: async (variantData) => {
        set({ isLoading: true, error: null });
        try {
            // Assuming POST method for creation (Standard REST)
            const response = await apiClient.post(`${BASE_URL}/`, variantData);
            const newVariant = response.data.data;

            // Optimistic update for the list
            set((state) => ({
                variants: [newVariant, ...state.variants],
                isLoading: false,
            }));
            return newVariant;
        } catch (error) {
            set({
                error: error.response?.data?.message || "Failed to create variant",
                isLoading: false,
            });
            throw error;
        }
    },

    // 7. Update Variant
    updateVariant: async (variantId, updateData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.put(`${BASE_URL}/${variantId}`, updateData);
            const updatedVariant = response.data.data;

            set((state) => ({
                // Update current variant if it's the one being viewed
                currentVariant: state.currentVariant?._id === variantId ? updatedVariant : state.currentVariant,
                // Update item in the list
                variants: state.variants.map((v) => (v._id === variantId ? updatedVariant : v)),
                isLoading: false,
            }));
            return updatedVariant;
        } catch (error) {
            set({
                error: error.response?.data?.message || "Failed to update variant",
                isLoading: false,
            });
            throw error;
        }
    },

    // 8. Update Stock
    updateVariantStock: async (variantId, { quantity, operation, reason }) => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.put(`${BASE_URL}/${variantId}/stock`, {
                quantity,
                operation,
                reason,
            });
            const updatedVariant = response.data.data;

            set((state) => ({
                currentVariant: state.currentVariant?._id === variantId ? updatedVariant : state.currentVariant,
                variants: state.variants.map((v) => (v._id === variantId ? updatedVariant : v)),
                // Also update grouped/shop lists if necessary
                groupedProductVariants: state.groupedProductVariants ? {
                    ...state.groupedProductVariants,
                    variants: state.groupedProductVariants.variants.map(v => v._id === variantId ? updatedVariant : v)
                } : null,
                isLoading: false,
            }));
            return updatedVariant;
        } catch (error) {
            set({
                error: error.response?.data?.message || "Failed to update stock",
                isLoading: false,
            });
            throw error;
        }
    },

    // 9. Delete Variant
    deleteVariant: async (variantId) => {
        set({ isLoading: true, error: null });
        try {
            await apiClient.delete(`${BASE_URL}/${variantId}`);

            set((state) => ({
                variants: state.variants.filter((v) => v._id !== variantId),
                currentVariant: state.currentVariant?._id === variantId ? null : state.currentVariant,
                isLoading: false,
            }));
        } catch (error) {
            set({
                error: error.response?.data?.message || "Failed to delete variant",
                isLoading: false,
            });
        }
    },

    // Utility: Reset Store
    resetStore: () => {
        set({
            variants: [],
            currentVariant: null,
            groupedProductVariants: null,
            shopVariants: [],
            error: null,
            isLoading: false,
        });
    },
}));