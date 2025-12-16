"use client";

import { create } from "zustand";
import apiClient from "@/api/apiClient"; // Ensure this points to your axios instance

export const useProductStore = create((set, get) => ({
  // ================= STATE =================
  products: [],
  currentProduct: null,

  // Matches your API response structure
  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    hasNext: false,
    hasPrev: false,
  },

  // Query parameters to send to backend
  queryParams: {
    page: 1,
    limit: 10,
    search: "",
    category: "",
    isAvailable: undefined, // undefined means "all"
  },

  isLoading: false,
  error: null,

  // ================= ACTIONS =================

  /**
   * Update filters/search and reset to page 1
   * @param {Object} newParams 
   */
  setFilters: (newParams) => {
    set((state) => ({
      queryParams: {
        ...state.queryParams,
        ...newParams,
        page: 1 // Always reset to page 1 when filtering/searching
      }
    }));
    if (shopId) {
      get().fetchShopProducts(shopId);
    }
  },

  /**
   * Change Page Number
   * @param {Number} page 
   */
  setPage: (page) => {
    set((state) => ({
      queryParams: { ...state.queryParams, page }
    }));
  },

  /**
   * Clear selected product
   */
  resetCurrentProduct: () => set({ currentProduct: null }),

  // ================= API OPERATIONS =================

  /**
   * Fetch Products (Listing)
   * GET /:shopId/products
   */
  fetchShopProducts: async (shopId) => {
    set({ isLoading: true, error: null });
    const { queryParams } = get();

    try {
      // Build URL params dynamically
      const params = new URLSearchParams();
      params.append("page", queryParams.page);
      params.append("limit", queryParams.limit);
      if (queryParams.search) params.append("search", queryParams.search);
      if (queryParams.category) params.append("category", queryParams.category);
      if (queryParams.isAvailable !== undefined) params.append("isAvailable", queryParams.isAvailable);

      const response = await apiClient.get(`shops/${shopId}/products`); //?${params.toString()}

      // Destructure based on your specific JSON response
      const { products, pagination } = response.data.data;

      set({
        products: products,
        pagination: pagination,
        isLoading: false,
      });
    } catch (err) {
      console.error("Fetch error:", err);
      set({
        error: err.response?.data?.message || "Failed to fetch products",
        isLoading: false
      });
    }
  },

  /**
   * Create Product
   * POST /:shopId/products
   */
  createProduct: async (shopId, productData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post(`shops/${shopId}/products`, productData);

      const newProduct = response.data.data || response.data;

      set((state) => ({
        products: [newProduct, ...state.products], // Add to top of list
        pagination: {
          ...state.pagination,
          totalProducts: state.pagination.totalProducts + 1
        },
        isLoading: false,
      }));
      return true;
    } catch (err) {
      set({
        error: err.response?.data?.message || "Failed to create product",
        isLoading: false
      });
      return false;
    }
  },

  /**
   * Update Product
   * PUT /:shopId/products/:productId
   */
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

  /**
   * Delete Product
   * DELETE /:shopId/products/:productId
   */
  deleteProduct: async (shopId, productId) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.delete(`/shops/${shopId}/products/${productId}`);

      set((state) => ({
        // Filter out the deleted product
        products: state.products.filter((p) => p._id !== productId && p.product_id !== productId),
        pagination: {
          ...state.pagination,
          totalProducts: state.pagination.totalProducts - 1
        },
        isLoading: false,
      }));
      return true;
    } catch (err) {
      set({
        error: err.response?.data?.message || "Failed to delete product",
        isLoading: false
      });
      return false;
    }
  },

  /**
   * Upload Images
   * POST /:shopId/products/:productId/images
   */
  uploadProductImages: async (shopId, productId, formData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post(
        `/shops/${shopId}/products/${productId}/images`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const updatedProduct = response.data.data || response.data;

      set((state) => ({
        products: state.products.map((p) =>
          p._id === productId ? updatedProduct : p
        ),
        isLoading: false,
      }));
      return true;
    } catch (err) {
      set({
        error: err.response?.data?.message || "Failed to upload images",
        isLoading: false
      });
      return false;
    }
  },

  /**
   * Get Single Product Details
   * Use this for the Edit page if the product isn't already in the list
   */
  getProductDetails: async (shopId, productId) => {
    set({ isLoading: true, error: null });

    // 1. Check if we already have it in the list (client-side cache)
    const existing = get().products.find(p => p._id === productId || p.product_id === productId);
    if (existing) {
      set({ currentProduct: existing, isLoading: false });
      return;
    }
    try {
      // If your backend supports getting by ID via query or param, adjust here:
      // For now, assuming you might add a specific route or filter the list
      const response = await apiClient.get(`/shops/${shopId}/products/${productId}`);
      const product = response.data.data;

      if (product) {
        set({ currentProduct: product, isLoading: false });
      } else {
        set({ error: "Product not found", isLoading: false });
      }
    } catch (err) {
      set({ error: "Could not load details", isLoading: false });
    }
  }
}));