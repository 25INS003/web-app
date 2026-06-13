import { z } from "zod";
import { api } from "@/lib/api/client";
import {
  catalogCategorySchema,
  productListSchema,
} from "@/lib/api/schemas/catalog";
import type {
  CatalogCategory,
  ProductList,
} from "@/lib/api/schemas/catalog";

export type ProductQuery = {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
};

export const catalogApi = {
  async getProducts(query: ProductQuery = {}): Promise<ProductList> {
    const data = await api.get<unknown>("/catalog/get", { params: query });
    return productListSchema.parse(data);
  },

  async getCategories(): Promise<CatalogCategory[]> {
    const data = await api.get<unknown>("/catalog/categories");
    return z.array(catalogCategorySchema).parse(data);
  },
};
