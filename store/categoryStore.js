"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import apiClient from "@/api/apiClient";
// Shared with the picker, which keys its breadcrumb off the same ids.
import { dedupeById, parentIdOf } from "@/lib/categories/tree";

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
          const categories = dedupeById(response.data.data || response.data);
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
      //
      // `parentIdOf` reads `parent_id`, which is the column. Both of these
      // checked only `parent_category_id` — the Mongo-era name, absent from
      // every row the API returns — so `getChildrenOf` always returned nothing
      // and `hasChildren` was always false. Any caller asking "does this
      // category have sub-categories?" was told no.
      getChildrenOf: (parentId) => {
        const { categories, childrenCache } = get();
        if (childrenCache[parentId]) return childrenCache[parentId];
        return categories.filter((cat) => parentIdOf(cat) === parentId);
      },

      // --- Check if category has children ---
      hasChildren: (categoryId) =>
        get().categories.some((cat) => parentIdOf(cat) === categoryId),

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
            // Deduped: a create that races a refetch would otherwise put the
            // same category in the list twice, and the list is rendered by id.
            categories: dedupeById([...state.categories, newCategory]),
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
              cat.id === id ? updatedCategory : cat
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
              cat.id === id ? updatedCategory : cat
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
            categories: state.categories.filter((cat) => cat.id !== id),
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
      // A cache to render from on the first paint, never a source of truth.
      //
      // This was persisted with no version, and the one consumer only refetched
      // when the list was empty — so any browser that had loaded categories
      // once kept them for good. After the catalogue changed, every option in
      // the picker pointed at a row that no longer existed, the product create
      // failed on a foreign key, and reloading the page did not help because
      // the stale list came straight back out of localStorage.
      //
      // `version` retires caches written before this shape; readers refetch on
      // mount regardless, so a stale entry now survives only until the request
      // it no longer blocks comes back.
      version: 2,
      partialize: (state) => ({
        categories: state.categories,
        rootCategories: state.rootCategories,
        categoryTree: state.categoryTree
      }),
      migrate: () => ({
        categories: [],
        rootCategories: [],
        categoryTree: [],
      }),
    }
  )
);