import { clsx } from "clsx";
import type { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatPrice(value: number): string {
  return inr.format(value);
}

/**
 * A short, readable reference for a product, derived from its id.
 *
 * Products move between the approval tabs — submitted, turned down, fixed,
 * resubmitted — and following one across them needs something a person can read
 * out and search for. A uuid is neither.
 *
 * Derived rather than stored. The schema's own note on `order_number` is the
 * argument: "a second identity on a row becomes a second thing to keep in
 * step". This one cannot drift, needs no column, no migration and no
 * uniqueness check — it is the id, shown differently.
 *
 * Eight hex characters is 4.3 billion combinations, which is not a guarantee of
 * uniqueness and is not offered as one: it is a handle for a human comparing a
 * screen to a screen, and the full id is always a click away.
 */
export function productRef(id: string | null | undefined): string {
  if (!id) return "—";
  return `PRD-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}
