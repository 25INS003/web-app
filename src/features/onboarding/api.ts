import { api } from "@/lib/api/client";
import type { OnboardingForm } from "./validation";

/**
 * Submit the onboarding application.
 *
 * Multipart, because the endpoint mounts `upload.fields` for a logo and up to
 * five documents — and mounting multer is also what makes `req.body` readable
 * at all, so the text fields have to travel the same way.
 *
 * The backend sets `verification_status: "pending"` and `is_approved: false`
 * on every submission, including a resubmission by an already-approved owner.
 * That is deliberate on its side: changing your bank details should send you
 * back through review.
 */
/**
 * The application already on file, as the wizard's own field names.
 *
 * A refused owner is being asked to fix what was wrong, and re-typing a
 * business name, address and bank details they have already given is not
 * fixing anything — it is a second chance to make a new mistake.
 *
 * Nullable everywhere because the columns are: an application can be part
 * filled, and a missing field has to arrive as the empty string the inputs
 * are controlled with, not as `null`.
 */
export type OnboardingApplication = Partial<OnboardingForm> & {
  verification_status?: string;
  approval_note?: string | null;
};

const asFormValue = (v: unknown): string => {
  if (v === null || v === undefined) return "";
  // `business_since` is a timestamp on the row and a "YYYY-MM" month input on
  // the form. Anything else is already a string.
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v)) return v.slice(0, 7);
  return String(v);
};

export const onboardingApi = {
  /** What this owner has already submitted, for pre-filling a resubmission. */
  async current(): Promise<Partial<OnboardingForm>> {
    // `api.get` already unwraps the ApiResponse envelope, so this is the
    // payload itself — not `{ data: … }` around it.
    const row = ((await api.get<OnboardingApplication>(
      "/shop-owners/status",
    )) ?? {}) as Record<string, unknown>;

    const keys: (keyof OnboardingForm)[] = [
      "business_name",
      "gst_number",
      "business_address_line1",
      "business_address_line2",
      "business_address_district",
      "business_address_state",
      "business_address_pincode",
      "bank_account_number",
      "ifsc_code",
      "business_since",
    ];

    const filled: Partial<OnboardingForm> = {};
    for (const key of keys) {
      const value = asFormValue(row[key]);
      // "New Enterprise" is the placeholder written at registration, not
      // something anybody typed — pre-filling it would have an applicant
      // submit a business called that.
      if (value && !(key === "business_name" && value === "New Enterprise")) {
        filled[key] = value;
      }
    }
    return filled;
  },

  async submit(input: {
    form: OnboardingForm;
    documents: File[];
    logo?: File | null;
  }): Promise<void> {
    const fd = new FormData();

    for (const [key, value] of Object.entries(input.form)) {
      // Empty optional fields are omitted rather than sent as "". The column
      // is nullable, and an empty string is a value that later reads as
      // "provided, but blank".
      if (value) fd.append(key, value);
    }

    if (input.logo) fd.append("business_logo", input.logo);
    // The field name is `documents` and multer caps it at 5 — see the route.
    for (const doc of input.documents) fd.append("documents", doc);

    // `upload`, not `post`: this carries a logo and up to five documents, and
    // the client-wide 20s deadline is a guess about the applicant's uplink
    // rather than a sign anything is wrong. A seller on a slow connection was
    // being cut off mid-transfer — on the one form they cannot skip.
    await api.upload("/shop-owners/onboarding", fd);
  },
};
