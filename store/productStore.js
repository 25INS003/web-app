"use client";

import { create } from "zustand";
import apiClient from "@/api/apiClient";

export const useProductStore = create((set, get) => ({
  // ================= STATE =================
  products: [],
  currentProduct: null,

  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    hasNext: false,
    hasPrev: false,
  },

  // Query parameters (MATCH BACKEND)
  queryParams: {
    page: 1,
    limit: 10,
    search: "",
    category: "",
    inStock: undefined,          // "true" | "false" | undefined
    is_available: "true",        // "true" | "false" | "none"
    sortBy: "created_at",
    sortOrder: "desc",
  },

  isLoading: false,
  error: null,

  // ================= ACTIONS =================

  /**
   * Update filters & reset page
   */
  setFilters: (newParams, shopId = null) => {
    set((state) => ({
      queryParams: {
        ...state.queryParams,
        ...newParams,
        page: 1,
      },
    }));

    if (shopId) {
      get().fetchShopProducts(shopId);
    }
  },

  /**
   * Change Page (auto-fetch)
   */
  setPage: (page, shopId) => {
    set((state) => ({
      queryParams: { ...state.queryParams, page },
    }));

    if (shopId) {
      get().fetchShopProducts(shopId);
    }
  },

  resetCurrentProduct: () => set({ currentProduct: null }),

  // ================= API =================

  /**
   * Fetch Shop Products
   */
  fetchShopProducts: async (shopId) => {
    set({ isLoading: true, error: null });
    const { queryParams } = get();

    try {
      const params = new URLSearchParams();

      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== "" && value !== "none") {
          params.append(key, value);
        }
      });

      const response = await apiClient.get(
        `/shops/${shopId}/products?${params.toString()}`
      );

      const { products, pagination } = response.data.data;

      set({
        products,
        pagination,
        isLoading: false,
      });
    } catch (err) {
      set({
        error: err.response?.data?.message || "Failed to fetch products",
        isLoading: false,
      });
    }
  },

  /**
   * Create Product
   */
  createProduct: async (shopId, productData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post(
        `/shops/${shopId}/products`,
        productData
      );

      const newProduct = response.data.data;

      set((state) => ({
        products: [newProduct, ...state.products],
        pagination: {
          ...state.pagination,
          totalProducts: state.pagination.totalProducts + 1,
        },
        isLoading: false,
      }));
      return newProduct;
    } catch (err) {
      set({
        error: err.response?.data?.message || "Failed to create product",
        isLoading: false,
      });
      return false;
    }
  },

  updateProduct: async (shopId, productId, productData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.put(`/shops/${shopId}/products/${productId}`, productData);
      const updatedProduct = response.data.data || response.data;

      set((state) => ({
        products: state.products.map((p) =>
          p._id === productId || p.product_id === productId ? updatedProduct : p
        ),
        currentProduct: updatedProduct,
        isLoading: false,
      }));
      return true;
    } catch (err) {
      set({
        error: err.response?.data?.message || "Failed to update product",
        isLoading: false
      });
      return false;
    }
  },



  uploadProductImages: async (shopId, productId, formData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post(
        `/shops/${shopId}/products/${productId}/images`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      // The backend returns: { images: [...], product: { ... } }
      const updatedProduct = response.data.data.product;

      set((state) => ({
        products: state.products.map((p) =>
          p._id === productId ? updatedProduct : p
        ),
        // Update currentProduct if it's the one we just uploaded for
        currentProduct: updatedProduct,
        isLoading: false,
      }));
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
   * Delete Product
   */
  deleteProduct: async (shopId, productId) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.delete(
        `/shops/${shopId}/products/${productId}`
      );

      set((state) => ({
        products: state.products.filter((p) => p._id !== productId),
        pagination: {
          ...state.pagination,
          totalProducts: state.pagination.totalProducts - 1,
        },
        isLoading: false,
      }));
      return true;
    } catch (err) {
      set({
        error: err.response?.data?.message || "Failed to delete product",
        isLoading: false,
      });
      return false;
    }
  },

  /**
   * Upload Product Images
   */
  uploadProductImages: async (shopId, productId, formData) => {
    set({ isLoading: true, error: null });
    try {
      console.log(shopId,productId,formData)
      const response = await apiClient.post(
        `/shops/${shopId}/products/${productId}/images`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" }
        }
      );

      // Destructure 'product' from response.data.data
      // because the controller returns { images, product }
      const { product: updatedProduct } = response.data.data;

      set((state) => ({
        products: state.products.map((p) =>
          // Ensure you match the ID correctly (usually _id from MongoDB)
          p._id === productId ? updatedProduct : p
        ),
        isLoading: false,
      }));

      return true;
    } catch (err) {
      set({
        // Captures the message from your ApiError class
        error: err.response?.data?.message || "Failed to upload images",
        isLoading: false,
      });
      return false;
    }
  },

  /**
   * Get Single Product
   */
  getProductDetails: async (shopId, productId) => {
    set({ isLoading: true, error: null });

    const cached = get().products.find((p) => p._id === productId);
    if (cached) {
      set({ currentProduct: cached, isLoading: false });
      return;
    }

    try {
      const response = await apiClient.get(
        `/shops/${shopId}/products/${productId}`
      );
      set({ currentProduct: response.data.data, isLoading: false });
    } catch {
      set({ error: "Could not load product", isLoading: false });
    }
  },
}));
