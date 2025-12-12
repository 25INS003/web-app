"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import apiClient from "@/api/apiClient";



// 3. Create the Store with Persistence
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
          // Assuming response.data.data or response.data contains the array
          // Adjust based on your actual API response structure
          const categories = response.data.data || response.data; 
          set({ categories, isLoading: false });
        } catch (error) {
          set({ 
            error: error.response?.data?.message || "Failed to fetch categories", 
            isLoading: false 
          });
        }
      },

      // --- Create Category ---
      createCategory: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.post("/admin/categories", data);
          const newCategory = response.data.data || response.data;
          
          set((state) => ({
            categories: [...state.categories, newCategory],
            isLoading: false,
          }));
        } catch (error) {
          set({ 
            error: error.response?.data?.message || "Failed to create category", 
            isLoading: false 
          });
          throw error; // Re-throw to handle UI feedback (e.g., toasts) in component
        }
      },

      // --- Update Category ---
      updateCategory: async (id, data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.put(`/admin/categories/${id}`, data);
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

      // --- Update Order ---
      updateCategoryOrder: async (id, newOrder) => {
        // Optimistic update: Update UI immediately before API call
        const previousCategories = get().categories;
        
        set((state) => ({
          categories: state.categories.map((cat) => 
            cat._id === id ? { ...cat, order: newOrder } : cat
          )
        }));

        try {
          await apiClient.put(`/admin/categories/${id}/order`, { order: newOrder });
          // Optionally refetch to ensure sync: await get().fetchCategories();
        } catch (error) {
          // Revert on failure
          set({ categories: previousCategories, error: "Failed to update order" });
        }
      },
    }),
    {
      name: "category-storage", // unique name for localStorage key
      storage: createJSONStorage(() => localStorage), // use localStorage
      partialize: (state) => ({ categories: state.categories }), // Only persist the data, not loading/error states
    }
  )
);