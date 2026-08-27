import { z } from "zod";
import {
  MIN_PASSWORD_LENGTH,
  scorePassword,
} from "@/features/auth/password-strength";
import { objectId } from "./common";

export const userTypeSchema = z.enum([
  "customer",
  "shop_owner",
  "admin",
  "delivery_executive",
]);
export type UserType = z.infer<typeof userTypeSchema>;

export const verificationStatusSchema = z.enum([
  "draft",
  "pending",
  "approved",
  "rejected",
  "revoked",
]);
export type VerificationStatus = z.infer<typeof verificationStatusSchema>;

export const userSchema = z.object({
  id: objectId,
  user_id: z.string().optional(),
  email: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  user_type: userTypeSchema,
  phone: z.string().nullish(),
  profile_image: z.string().nullish(),
  is_active: z.boolean().optional(),
  is_verified: z.boolean().optional(),
});
export type User = z.infer<typeof userSchema>;

// Shop-owner approval state, attached to the session for shop_owner users.
export const shopOwnerStatusSchema = z.object({
  is_approved: z.boolean(),
  verification_status: verificationStatusSchema,
  owner_id: objectId,
});
export type ShopOwnerStatus = z.infer<typeof shopOwnerStatusSchema>;

// GET /auth/me payload (the source of truth for server-side gating).
export const sessionSchema = z.object({
  user: userSchema,
  customer_profile: z.unknown().nullish(),
  shop_owner_status: shopOwnerStatusSchema.nullish(),
});
export type Session = z.infer<typeof sessionSchema>;

// POST /auth/register. Deliberately NOT a Session: registration issues no
// tokens, so the account is not usable until the emailed code is confirmed via
// POST /auth/verify-email — which is what returns a real session.
export const registerResultSchema = z.object({
  user: userSchema,
  verification_required: z.boolean().optional(),
  // False when the account was created but the mail could not be sent, so the
  // UI can lead with "resend" instead of "check your inbox".
  verification_email_sent: z.boolean().optional(),
});
export type RegisterResult = z.infer<typeof registerResultSchema>;

// --- form inputs ---

export const loginInputSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginInputSchema>;

// Web sign-up is for customers (default) or shop owners; admins are provisioned
// out-of-band.
export const registerInputSchema = z
  .object({
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(MIN_PASSWORD_LENGTH, "At least 8 characters"),
    // No .default() here — the form supplies the default via defaultValues, which
    // keeps the zod input/output types aligned for react-hook-form's resolver.
    user_type: z.enum(["customer", "shop_owner"]),
    phone: z.string().optional(),
  })
  // The strength rule sits on the whole object rather than the password field,
  // because it reads the name and email too — a password containing either is
  // refused, and the field alone cannot see them.
  //
  // This mirrors what the API enforces. It is here so the form fails at the
  // field instead of after a round trip; it is NOT the thing keeping weak
  // passwords out, which is `assertStrongPassword` on the server.
  .superRefine((values, ctx) => {
    const result = scorePassword(values.password, {
      email: values.email,
      first_name: values.first_name,
      last_name: values.last_name,
    });
    if (result.acceptable) return;
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["password"],
      message: result.reasons[0] ?? "Choose a stronger password",
    });
  });
export type RegisterInput = z.infer<typeof registerInputSchema>;

export const verifyEmailInputSchema = z.object({
  email: z.string().email(),
  otp: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code"),
});
export type VerifyEmailInput = z.infer<typeof verifyEmailInputSchema>;
