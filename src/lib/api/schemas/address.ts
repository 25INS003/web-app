import { z } from "zod";
import { objectId } from "./common";

export const addressSchema = z.object({
  id: objectId,
  address_id: z.string().optional(), // string mirror — what place-order matches on
  address_line: z.string(),
  city: z.string(),
  state: z.string(),
  pincode: z.string(),
  country: z.string().nullish(),
  contact_name: z.string().nullish(),
  contact_phone: z.string().nullish(),
  tag: z.string().nullish(),
  label: z.string().nullish(),
  is_default: z.boolean().optional(),
});
export type Address = z.infer<typeof addressSchema>;

export const addressTagSchema = z.enum(["home", "work", "office", "other"]);

export const addressInputSchema = z.object({
  // Backend caps contact_name at 10 chars.
  contact_name: z.string().min(1, "Name is required").max(10, "Max 10 characters"),
  contact_phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit phone"),
  address_line: z.string().min(1, "Address is required").max(200),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit pincode"),
  country: z.string(),
  tag: addressTagSchema,
  // Carried through when the address came from a device's GPS. The columns have
  // always existed and `addAddress` has always accepted them; nothing on the
  // client had a fix to send. Optional, because an address typed by hand has
  // none — and a courier reading a street is the normal case, not a fallback.
  lat: z.number().optional(),
  lng: z.number().optional(),
});
export type AddressInput = z.infer<typeof addressInputSchema>;

/** What the reverse-geocode endpoint gives back for prefilling the form. */
export const resolvedLocationSchema = z.object({
  address_line: z.string(),
  city: z.string(),
  state: z.string(),
  pincode: z.string(),
  country: z.string(),
  lat: z.number(),
  lng: z.number(),
});
export type ResolvedLocation = z.infer<typeof resolvedLocationSchema>;
