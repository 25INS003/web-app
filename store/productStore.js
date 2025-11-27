// src/store/productStore.js
"use client";

import { create } from "zustand";
import apiClient from "@/api/apiClient";

const useProductStore = create((set) => ({
  products: [],
  loading: false,

  fetchProducts: async () => {
    set({ loading: true });
    try {
      const res = await apiClient.get("/products");
      set({ products: res.products });
    } finally {
      set({ loading: false });
    }
  },
}));

export default useProductStore;
