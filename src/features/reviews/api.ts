import { api } from "@/lib/api/client";
import { myReviewsResponseSchema } from "@/lib/api/schemas/review";
import type { MyReviewsResponse } from "@/lib/api/schemas/review";

export type CreateReviewInput = {
  productId: string;
  orderId: string;
  rating: number;
  comment?: string;
  images?: File[];
};

export type UpdateReviewInput = {
  reviewId: string;
  productId?: string;
  rating: number;
  comment?: string;
  images?: File[];
};

// Reviews are created/updated multipart (the backend mounts multer for
// `review_images`). axios sets the multipart boundary itself for FormData.
function reviewFormData(
  fields: Record<string, string | number | undefined>,
  images?: File[],
): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && value !== "") fd.append(key, String(value));
  }
  images?.forEach((file) => fd.append("review_images", file));
  return fd;
}

export const reviewsApi = {
  async getMyReviews(): Promise<MyReviewsResponse> {
    const data = await api.get<unknown>("/reviews/user/my-reviews", {
      params: { limit: 100 },
    });
    return myReviewsResponseSchema.parse(data);
  },

  async create(input: CreateReviewInput): Promise<void> {
    await api.post(
      "/reviews/create",
      reviewFormData(
        {
          productId: input.productId,
          order_id: input.orderId,
          rating: input.rating,
          comment: input.comment,
        },
        input.images,
      ),
    );
  },

  async update(input: UpdateReviewInput): Promise<void> {
    await api.patch(
      `/reviews/update/${input.reviewId}`,
      reviewFormData(
        { rating: input.rating, comment: input.comment },
        input.images,
      ),
    );
  },

  async remove(reviewId: string): Promise<void> {
    await api.delete(`/reviews/delete/${reviewId}`);
  },
};
