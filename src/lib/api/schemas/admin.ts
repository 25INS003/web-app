import { z } from "zod";
import { objectId } from "./common";

/**
 * The admin panel's view of shop owners and shops.
 *
 * Every list endpoint under /admin returns a bare array as `data` rather than a
 * `{ rows, total }` envelope, so these schemas parse arrays directly.
 */

// draft -> pending -> approved | rejected, and revoked from approved.
// `draft` is what registration writes; the applicant has an account but has not
// filled the business details in yet. Both draft and pending mean an admin
// still owes an answer, which is what the pending queue selects on.
export const verificationStatusSchema = z
  .enum(["draft", "pending", "approved", "rejected", "revoked"])
  .catch("draft");
export type VerificationStatus = z.infer<typeof verificationStatusSchema>;

// The admin list endpoints hydrate `user_id` into the user record rather than
// leaving the foreign key — the one place in this codebase where a populated
// reference survived the Postgres port on purpose, because the queue is
// useless without a name to show.
const ownerUserSchema = z
  .object({
    id: objectId.optional(),
    first_name: z.string().nullish(),
    last_name: z.string().nullish(),
    email: z.string().nullish(),
    phone: z.string().nullish(),
    is_email_verified: z.boolean().nullish(),
  })
  .nullish();

export const shopOwnerSchema = z.object({
  id: objectId,
  business_name: z.string().nullish(),
  gst_number: z.string().nullish(),
  business_address_state: z.string().nullish(),
  business_address_district: z.string().nullish(),
  business_address_pincode: z.string().nullish(),
  is_approved: z.boolean().catch(false),
  verification_status: verificationStatusSchema,
  created_at: z.string().nullish(),
  user_id: ownerUserSchema,
});
export type ShopOwner = z.infer<typeof shopOwnerSchema>;

export const adminShopSchema = z.object({
  id: objectId,
  name: z.string().nullish(),
  city: z.string().nullish(),
  state: z.string().nullish(),
  is_active: z.boolean().nullish(),
  verification_status: verificationStatusSchema.nullish(),
  created_at: z.string().nullish(),
});
export type AdminShop = z.infer<typeof adminShopSchema>;

/**
 * Parse a list, dropping rows the client cannot read rather than failing.
 *
 * One malformed applicant must not blank the whole approval queue — the admin
 * still has to work the rest of it.
 */
const listOf = <T extends z.ZodTypeAny>(row: T) =>
  z
    .union([
      z.array(z.unknown()),
      z.object({ data: z.array(z.unknown()) }).transform((d) => d.data),
    ])
    .transform((rows) =>
      rows.flatMap((r) => {
        const parsed = row.safeParse(r);
        return parsed.success ? [parsed.data as z.infer<T>] : [];
      }),
    );

export const shopOwnerListSchema = listOf(shopOwnerSchema);
export const adminShopListSchema = listOf(adminShopSchema);

/** The applicant's name, or a stand-in — never an empty cell. */
export function ownerName(owner: ShopOwner): string {
  const name = [owner.user_id?.first_name, owner.user_id?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
  return name || owner.user_id?.email || "Applicant";
}

/**
 * The business name, minus the placeholder.
 *
 * Registration writes "New Enterprise" as a placeholder before the applicant
 * has filled anything in. Showing it verbatim makes ten different applicants
 * look like ten branches of one chain.
 */
export function businessName(owner: ShopOwner): string | null {
  const name = owner.business_name?.trim();
  if (!name || name === "New Enterprise") return null;
  return name;
}

export const STATUS_VARIANT: Record<
  VerificationStatus,
  "default" | "success" | "warning" | "muted" | "outline"
> = {
  draft: "warning",
  pending: "warning",
  approved: "success",
  rejected: "muted",
  revoked: "muted",
};

export const STATUS_LABEL: Record<VerificationStatus, string> = {
  draft: "Awaiting details",
  pending: "Awaiting review",
  approved: "Approved",
  rejected: "Rejected",
  revoked: "Revoked",
};
