"use client";

import { create } from "zustand";
import apiClient from "@/api/apiClient";

export const useProductStore = create((set, get) => ({
  // ================= STATE =================
  products: [],
  currentVariants: [],
  currentProduct: null,

  pagination: {
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0,
    hasNext: false,
    hasPrev: false,
  },

  queryParams: {
    page: 1,
    limit: 10,
    search: "",
    category: "",
    inStock: undefined,
    is_available: "true",
    is_active: "true",
    sortBy: "created_at",
    sortOrder: "desc",
  },

  isLoading: false,
  error: null,

  resetProduct: () => set({ currentProduct: null, currentVariants: [] }),

  // ================= ACTIONS =================

  setFilters: (newParams, shopId = null) => {
    set((state) => ({
      queryParams: {
        ...state.queryParams,
        ...newParams
      },
    }));

    if (shopId) {
      get().fetchShopProducts(shopId);
    }
  },

  setPage: (page, shopId) => {
    set((state) => ({
      queryParams: { ...state.queryParams, page },
    }));
    if (shopId) get().fetchShopProducts(shopId);
  },

  // ================= API =================

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
      set({ products, pagination, isLoading: false });


    } catch (err) {
      set({
        error: err.response?.data?.message || "Failed to fetch products",
        isLoading: false,
      });
    }
  },

  /**
   * Create Product
   * Updated to match frontend expectation: returns { product: { _id... } }
   */
  createProduct: async (shopId, productData) => {
    set({ isLoading: true, error: null });
    try {
      productData.is_active = true;
      productData.is_available = true;

      const response = await apiClient.post(
        `/shops/${shopId}/products`,
        productData
      );

      // Assuming backend response.data.data is the actual product object
      const newProduct = response.data.data;

      set((state) => ({
        products: [newProduct, ...state.products],
        pagination: {
          ...state.pagination,
          totalProducts: state.pagination.totalProducts + 1,
        },
        isLoading: false,
      }));

      // Return structure matches frontend: product.product._id
      return { product: newProduct };
    } catch (err) {
      set({
        error: err.response?.data?.message || "Failed to create product",
        isLoading: false,
      });
      return false;
    }
  },

  /**
   * Upload Multiple Product Images
   * Matches frontend: formData.append("image", file)
   */
  uploadProductImages: async (shopId, productId, formData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post(
        `/shops/${shopId}/products/${productId}/main-img`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      const updatedProduct = response.data.data?.product || response.data.data;

      set((state) => ({
        products: state.products.map((p) =>
          p._id === productId ? updatedProduct : p
        ),
        currentProduct: updatedProduct,
        isLoading: false,
      }));

      return true;
    } catch (err) {
      console.error("Upload error:", err);
      set({
        error: err.response?.data?.message || "Failed to upload images",
        isLoading: false,
      });
      return false;
    }
  },

  updateProduct: async (shopId, productId, productData) => {
    set({ isLoading: true, error: null });
    try {
      productData.is_verified = true;
      const response = await apiClient.put(
        `/shops/${shopId}/products/${productId}`,
        productData
      );
      const updatedProduct = response.data.data || response.data;

      set((state) => ({
        products: state.products.map((p) =>
          p._id === productId ? updatedProduct : p
        ),
        currentProduct: updatedProduct,
        isLoading: false,
      }));
      return true;
    } catch (err) {
      set({
        error: err.response?.data?.message || "Failed to update product",
        isLoading: false,
      });
      return false;
    }
  },

  softDeleteProduct: async (shopId, productId, action = false) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.put(
        `/shops/${shopId}/products/${productId}/status`, { is_active: action }
      );
      const updatedProduct = response.data.data;

      set((state) => ({
        products: state.products.map((p) =>
          p._id === productId ? updatedProduct : p
        ),
        isLoading: false,
      }));
      return true;
    } catch (err) {
      set({
        error: err.response?.data?.message || "Failed to update status",
        isLoading: false,
      });
      return false;
    }
  },

  restoreSoftDeleteProduct: async (shopId, productId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.put(
        `/shops/${shopId}/products/${productId}/status`, { is_active: true }
      );
      const updatedProduct = response.data.data;

      set((state) => ({
        products: state.products.map((p) =>
          p._id === productId ? updatedProduct : p
        ),
        isLoading: false,
      }));
      return true;
    } catch (err) {
      set({
        error: err.response?.data?.message || "Failed to update status",
        isLoading: false,
      });
      return false;
    }
  },

  deleteProduct: async (shopId, productId) => {
    set({ isLoading: true, error: null });
    try {
      await apiClient.delete(`/shops/${shopId}/products/${productId}`);

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

  getProductDetails: async (shopId, productId) => {
    set({ isLoading: true, error: null });
    const cachedProduct = get().products.find((p) => p._id === productId);

    if (cachedProduct && cachedProduct.variants && cachedProduct.variants.length > 0) {
      set({
        currentProduct: cachedProduct,
        currentVariants: cachedProduct.variants, 
        isLoading: false
      });
      return;
    }

    try {
      const response = await apiClient.get(
        `/shops/${shopId}/products/${productId}`
      );

      const { product, variants } = response.data.data;

      // 2. MERGE: Combine the product info with its variants
      const fullProductDetail = { ...product, variants: variants };

      set((state) => ({
        // Map through the existing list and update ONLY the matching product
        products: state.products.map((p) =>
          p._id === productId ? fullProductDetail : p
        ),

        // We still update these so your Detail View component works immediately
        currentProduct: fullProductDetail,
        currentVariants: variants,
        isLoading: false,
      }));

    } catch (err) {
      set({
        error: err.response?.data?.message || "Could not load product",
        isLoading: false,
      });
    }
  },
}));