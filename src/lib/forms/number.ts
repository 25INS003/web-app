/**
 * Reading numbers out of numeric inputs, without NaN.
 *
 * `parseFloat("")` is NaN, and an empty box is the normal state of a number
 * field the moment someone clears it to type a new value. Writing that NaN into
 * component state means the next render hands `value={NaN}` back to the input:
 * React warns "Received NaN for the `value` attribute", the field blanks, and
 * it stops accepting input until the form remounts.
 *
 * Lives here rather than inline in the page that needed it because the same
 * `parseFloat(e.target.value)` appears across the shop-owner forms, and a fix
 * that only one of them imports is one the next form will not have.
 */

/** A form field's numeric value: a number, or empty while being retyped. */
export type NumericFieldValue = number | "";

/**
 * The value to store for a numeric input's `onChange`.
 *
 * Empty stays `""` rather than collapsing to 0. Forcing a 0 the moment the box
 * is cleared means the user has to select it before typing, and `""` is a valid
 * value for a controlled input where NaN is not.
 */
export const fromNumericInput = (raw: string): NumericFieldValue => {
  if (raw === "") return "";
  const parsed = parseFloat(raw);
  return Number.isNaN(parsed) ? "" : parsed;
};

/**
 * A field that may be `""` (see above), as the number an API expects.
 *
 * `Number.isFinite` rather than `!isNaN`: it also rejects the Infinity a user
 * can reach by typing `1e999`, which would serialise to `null` in JSON and
 * arrive at the server as a missing field.
 */
export const asNumber = (value: unknown, fallback = 0): number => {
  const n = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(n) ? n : fallback;
};
