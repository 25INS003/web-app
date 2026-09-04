"use client";

import { create } from "zustand";
import apiClient from "@/api/apiClient";
import { uploadErrorMessage } from "@/lib/uploadError";

export const useProductStore = create((set, get) => ({
  // ================= STATE =================
  products: [],
  currentVariants: [],
  currentProduct: null,
  currentShopId: null, // Track which shop the products belong to

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
    // "none" is skipped when the query string is built, so the owner's list
    // starts unfiltered.
    //
    // This defaulted to "true", which meant the list asked the API for active
    // products only. A product now starts inactive while it waits for admin
    // approval, so an owner submitted one and watched it vanish — no price, no
    // stock, no way to see it was pending or why it was rejected. An owner's
    // own list should show everything they own; the Status column says which
    // is which.
    is_available: "none",
    is_active: "none",
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
      set({ 
          products, 
          pagination, 
          isLoading: false,
          currentShopId: shopId // Update the current shop ID
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
   * Returns { product: { id... } } — `id`, not the Mongo `_id` this note
   * used to describe; nothing has produced `_id` since the Postgres port.
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

      // Return structure matches frontend: product.product.id
      return { product: newProduct };
    } catch (err) {
      // Rethrow rather than returning `false`. The caller could not tell a
      // failed request from a successful one with a malformed body, so every
      // error surfaced as "Product created but ID missing" — telling the owner
      // their product exists when the request had in fact been rejected.
      const message =
        err.response?.data?.message || err.message || "Failed to create product";
      set({ error: message, isLoading: false });
      throw new Error(message);
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
          p.id === productId ? updatedProduct : p
        ),
        currentProduct: updatedProduct,
        isLoading: false,
      }));

      return true;
    } catch (err) {
      console.error("Upload error:", err);
      // The reason, not a stand-in for it. A 413 from the proxy carries an HTML
      // body with no `message`, so reading `data.message` alone left the caller
      // with "Failed to upload images" for the one failure a person can
      // actually do something about.
      set({ error: uploadErrorMessage(err), isLoading: false });
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
      const updatedProduct = response.data.data; // Consistently use .data.data

      set((state) => ({
        products: state.products.map((p) =>
          p.id === productId ? updatedProduct : p
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

  /**
   * Externally update a product in the list (used by VariantStore)
   */
  updateProductInList: (updatedProduct) => {
    if (!updatedProduct || !updatedProduct.id) return;
    set((state) => ({
      products: state.products.map((p) =>
        p.id === updatedProduct.id ? updatedProduct : p
      ),
      // Also update currentProduct if it's the same one
      currentProduct: state.currentProduct?.id === updatedProduct.id ? updatedProduct : state.currentProduct
    }));
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
          p.id === productId ? updatedProduct : p
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
          p.id === productId ? updatedProduct : p
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
        products: state.products.filter((p) => p.id !== productId),
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
          p.id === productId ? fullProductDetail : p
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