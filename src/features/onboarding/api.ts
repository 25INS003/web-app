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
export const onboardingApi = {
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

    await api.post("/shop-owners/onboarding", fd);
  },
};
