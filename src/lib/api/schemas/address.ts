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
  // The map pin, as saved. The API has always returned the whole row, and
  // these were declared on the WRITE schema only — so a coordinate was stored
  // and then discarded by z.object on the way back in. Nothing read them yet,
  // which is the only reason it did not show: reopening a saved address would
  // have found no pin to place, on an address that has one.
  //
  // Nullish because most addresses are typed by hand and have none.
  lat: z.number().nullish(),
  lng: z.number().nullish(),
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
  // Required: an address is not saveable until it has been pinned.
  //
  // These were optional, and the result was that none of them were ever set —
  // a form that never asks is a form nobody fills. A pincode is not a
  // destination, and the shop's delivery screen has nothing to route from
  // without these.
  //
  // The message names the map rather than the field, because the field is not
  // where the customer fixes this.
  lat: z
    .number({ message: "Set a pin on the map above" })
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90"),
  lng: z
    .number({ message: "Set a pin on the map above" })
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180"),
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
