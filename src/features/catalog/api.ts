import { z } from "zod";
import { api } from "@/lib/api/client";
import {
  catalogCategorySchema,
  productDetailSchema,
  productListSchema,
  reviewsResponseSchema,
} from "@/lib/api/schemas/catalog";
import type {
  CatalogCategory,
  ProductDetail,
  ProductList,
  ReviewsResponse,
} from "@/lib/api/schemas/catalog";

export type ProductQuery = {
  page?: number;
  limit?: number;
  category?: string;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
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

  async getTopCategories(): Promise<CatalogCategory[]> {
    const data = await api.get<unknown>("/catalog/categories/top");
    return z.array(catalogCategorySchema).parse(data);
  },

  async getProduct(id: string): Promise<ProductDetail> {
    const data = await api.get<unknown>(`/catalog/id/${id}`);
    return productDetailSchema.parse(data);
  },

  async getProductReviews(id: string): Promise<ReviewsResponse> {
    const data = await api.get<unknown>(`/catalog/reviews/products/${id}`);
    return reviewsResponseSchema.parse(data);
  },
};
