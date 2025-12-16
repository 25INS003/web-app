"use client";

import { create } from "zustand";
import apiClient from "@/api/apiClient";

export const useInventoryStore = create((set, get) => ({
    // --- State ---
    lowStockProducts: [],
    inventoryLogs: [],
    isLoading: false,
    error: null,

    // --- Actions ---

    // 1. Fetch Low Stock Products
    // GET /shops/:shopId/inventory/low-stock
    fetchLowStockProducts: async (shopId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.get(`/shops/${shopId}/inventory/low-stock`);
            set({
                lowStockProducts: response.data.data,
                isLoading: false
            });
        } catch (error) {
            set({
                error: error.response?.data?.message || "Failed to fetch low stock products",
                isLoading: false,
            });
        }
    },

    // 2. Fetch Inventory Logs
    // GET /shops/:shopId/inventory/logs
    fetchInventoryLogs: async (shopId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await apiClient.get(`/shops/${shopId}/inventory/logs`);
            set({
                inventoryLogs: response.data.data,
                isLoading: false
            });
        } catch (error) {
            set({
                error: error.response?.data?.message || "Failed to fetch inventory logs",
                isLoading: false,
            });
        }
    },

    // 3. Update Product Stock
    // PUT /shops/:shopId/products/:productId/stock
    updateStock: async (shopId, productId, { new_stock, change_type, reason }) => {
        set({ isLoading: true, error: null });
        try {
            const payload = { new_stock, change_type, reason };
            const response = await apiClient.put(`/shops/${shopId}/products/${productId}/stock`, payload);

            const { product: updatedProduct, log: newLog } = response.data.data;

            set((state) => {
                // 1. Add the new log to the top of the logs list
                const updatedLogs = [newLog, ...state.inventoryLogs];

                // 2. Update the product in lowStockProducts if it exists there
                let updatedLowStock = state.lowStockProducts.map((p) =>
                    p._id === productId ? { ...p, stock_quantity: updatedProduct.stock_quantity } : p
                );

                // 3. Filter logic: If the new stock is above the alert threshold, remove it from the low stock list.
                // (Note: We use the threshold from the updated product object)
                updatedLowStock = updatedLowStock.filter(
                    (p) => p.stock_quantity <= (p.min_stock_alert || 0)
                );

                return {
                    inventoryLogs: updatedLogs,
                    lowStockProducts: updatedLowStock,
                    isLoading: false,
                };
            });

            return updatedProduct;
        } catch (error) {
            set({
                error: error.response?.data?.message || "Failed to update stock",
                isLoading: false,
            });
            throw error;
        }
    },

    // Utility: Clear error manually
    clearError: () => set({ error: null }),
}));