"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import apiClient from "@/api/apiClient";

export const useCategoryStore = create()(
  persist(
    (set, get) => ({
      categories: [],
      rootCategories: [],
      categoryTree: [],
      childrenCache: {}, // Cache for children: { parentId: [children] }
      isLoading: false,
      error: null,

      clearError: () => set({ error: null }),

      // --- Fetch All Categories (flat list) ---
      fetchCategories: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.get("/category/categories");
          const categories = response.data.data || response.data;
          set({ categories, isLoading: false });
        } catch (error) {
          set({
            error: error.response?.data?.message || "Failed to fetch categories",
            isLoading: false
          });
        }
      },

      // --- Fetch Root Categories (no parent) ---
      fetchRootCategories: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.get("/category/categories/roots");
          const rootCategories = response.data.data || response.data;
          set({ rootCategories, isLoading: false });
          return rootCategories;
        } catch (error) {
          set({
            error: error.response?.data?.message || "Failed to fetch root categories",
            isLoading: false
          });
          return [];
        }
      },

      // --- Fetch Children of a Category ---
      fetchChildCategories: async (parentId) => {
        if (!parentId) return [];
        
        // Check cache first
        const cached = get().childrenCache[parentId];
        if (cached) return cached;

        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.get(`/category/categories/${parentId}/children`);
          const children = response.data.data || response.data;
          
          // Update cache
          set((state) => ({
            childrenCache: { ...state.childrenCache, [parentId]: children },
            isLoading: false
          }));
          return children;
        } catch (error) {
          set({
            error: error.response?.data?.message || "Failed to fetch child categories",
            isLoading: false
          });
          return [];
        }
      },

      // --- Fetch Category Tree (hierarchical) ---
      fetchCategoryTree: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.get("/category/categories/tree");
          const categoryTree = response.data.data || response.data;
          set({ categoryTree, isLoading: false });
          return categoryTree;
        } catch (error) {
          set({
            error: error.response?.data?.message || "Failed to fetch category tree",
            isLoading: false
          });
          return [];
        }
      },

      // --- Fetch Ancestry (breadcrumb) ---
      fetchCategoryAncestry: async (categoryId) => {
        if (!categoryId) return [];
        try {
          const response = await apiClient.get(`/category/categories/${categoryId}/ancestry`);
          return response.data.data || response.data;
        } catch (error) {
          console.error("Failed to fetch ancestry:", error);
          return [];
        }
      },

      // --- Get children from cache or all categories ---
      getChildrenOf: (parentId) => {
        const { categories, childrenCache } = get();
        if (childrenCache[parentId]) return childrenCache[parentId];
        // Handle both populated (object) and unpopulated (string) parent_category_id
        return categories.filter(cat => {
          const catParentId = cat.parent_category_id;
          if (!catParentId) return false;
          if (typeof catParentId === "object" && catParentId._id) {
            return catParentId._id === parentId;
          }
          return catParentId === parentId;
        });
      },

      // --- Check if category has children ---
      hasChildren: (categoryId) => {
        const { categories } = get();
        // Handle both populated (object) and unpopulated (string) parent_category_id
        return categories.some(cat => {
          const catParentId = cat.parent_category_id;
          if (!catParentId) return false;
          if (typeof catParentId === "object" && catParentId._id) {
            return catParentId._id === categoryId;
          }
          return catParentId === categoryId;
        });
      },

      // --- Clear children cache ---
      clearChildrenCache: () => set({ childrenCache: {} }),

      // --- Create Category (Supports both JSON and FormData for image uploads) ---
      createCategory: async (categoryData) => {
        set({ isLoading: true, error: null });
        try {
          // Check if it's FormData (for file uploads)
          const isFormData = categoryData instanceof FormData;
          
          const response = await apiClient.post("/category/categories", categoryData, {
            headers: isFormData ? {
              "Content-Type": "multipart/form-data"
            } : {
              "Content-Type": "application/json"
            },
          });
          const newCategory = response.data.data || response.data;

          set((state) => ({
            categories: [...state.categories, newCategory],
            childrenCache: {}, // Clear cache to refetch
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

      // --- Update Category (Supports both JSON and FormData for image uploads) ---
      updateCategory: async (id, updatedData) => {
        set({ isLoading: true, error: null });
        try {
          // Check if it's FormData (for file uploads)
          const isFormData = updatedData instanceof FormData;
          
          const response = await apiClient.put(`/category/categories/${id}`, updatedData, {
            headers: isFormData ? {
              "Content-Type": "multipart/form-data"
            } : undefined,
          });
          const updatedCategory = response.data.data || response.data;

          set((state) => ({
            categories: state.categories.map((cat) =>
              cat._id === id ? updatedCategory : cat
            ),
            childrenCache: {}, // Clear cache to refetch
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
          const response = await apiClient.put(`/category/categories/${id}/order`, {
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
          await apiClient.delete(`/category/categories/${id}`);
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
      partialize: (state) => ({ 
        categories: state.categories,
        rootCategories: state.rootCategories,
        categoryTree: state.categoryTree
      }),
    }
  )
);