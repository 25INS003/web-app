import { z } from "zod";

// Mongo ids arrive as 24-char hex strings (sometimes as populated objects in
// list endpoints — those get their own schemas where needed).
export const objectId = z.string();

// Backend serialises dates as ISO-8601 strings.
export const isoDate = z.string();

export const paginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
});
export type Pagination = z.infer<typeof paginationSchema>;
