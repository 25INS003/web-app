"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import apiClient from "@/api/apiClient";

export const useCategoryStore = create()(
  persist(
    (set, get) => ({
      categories: [],
      isLoading: false,
      error: null,

      clearError: () => set({ error: null }),

      // --- Fetch All Categories ---
      fetchCategories: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.get("/admin/categories");
          const categories = response.data.data || response.data;
          set({ categories, isLoading: false });
        } catch (error) {
          set({
            error: error.response?.data?.message || "Failed to fetch categories",
            isLoading: false
          });
        }
      },

      // --- Create Category (JSON Version) ---
      createCategory: async (categoryData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post("/admin/categories", categoryData, {
            headers: {
              "Content-Type": "application/json"
            },
          });
          const newCategory = response.data.data || response.data;

          set((state) => ({
            categories: [...state.categories, newCategory],
            isLoading: false,
          }));
          return newCategory;
        } catch (error) {
          set({
            error: error.response?.data?.message || "Failed to create category",
            isLoading: false
          });
          throw error;
        }
      },

      // --- Update Category (JSON Version) ---
      updateCategory: async (id, updatedData) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.put(`/admin/categories/${id}`, updatedData);
          const updatedCategory = response.data.data || response.data;

          set((state) => ({
            categories: state.categories.map((cat) =>
              cat._id === id ? updatedCategory : cat
            ),
            isLoading: false,
          }));
        } catch (error) {
          set({
            error: error.response?.data?.message || "Failed to update category",
            isLoading: false
          });
          throw error;
        }
      },

      // --- Update Display Order ---
      updateCategoryOrder: async (id, display_order) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.put(`/admin/categories/${id}/order`, {
            display_order
          });
          const updatedCategory = response.data.data || response.data;

          set((state) => ({
            categories: state.categories.map((cat) =>
              cat._id === id ? updatedCategory : cat
            ),
            isLoading: false,
          }));
        } catch (error) {
          set({
            error: error.response?.data?.message || "Failed to update order",
            isLoading: false
          });
          throw error;
        }
      },

      // --- Delete Category ---
      deleteCategory: async (id) => {
        set({ isLoading: true, error: null });
        try {
          await apiClient.delete(`/admin/categories/${id}`);
          set((state) => ({
            categories: state.categories.filter((cat) => cat._id !== id),
            isLoading: false,
          }));
        } catch (error) {
          set({
            error: error.response?.data?.message || "Failed to delete category",
            isLoading: false
          });
          throw error;
        }
      },
    }),
    {
      name: "category-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ categories: state.categories }),
    }
  )
);