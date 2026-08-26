/**
 * What a shop owner has to provide before an admin can review them.
 *
 * Pure, and separate from the wizard, because "is this step complete" is asked
 * from three places — the Next button, the step indicator, and the final
 * submit — and three copies of the rule drift.
 *
 * The database requires none of this: every column except the status ones is
 * nullable. That is deliberate at the schema level and wrong at the form
 * level — an owner who submits nothing is an owner an admin approves sight
 * unseen, which is exactly the state this screen exists to end.
 */

export type OnboardingForm = {
  business_name: string;
  gst_number: string;
  business_address_line1: string;
  business_address_line2: string;
  business_address_district: string;
  business_address_state: string;
  business_address_pincode: string;
  bank_account_number: string;
  ifsc_code: string;
  /** A month, as an <input type="month"> gives it: "2020-03". */
  business_since: string;
};

export const emptyForm: OnboardingForm = {
  business_name: "",
  gst_number: "",
  business_address_line1: "",
  business_address_line2: "",
  business_address_district: "",
  business_address_state: "",
  business_address_pincode: "",
  bank_account_number: "",
  ifsc_code: "",
  business_since: "",
};

/**
 * `documents` is a valid key with no rule behind it today — uploading is
 * optional by decision. Kept so re-enabling the check needs one line rather
 * than a type change too.
 */
export type FieldErrors = Partial<
  Record<keyof OnboardingForm | "documents", string>
>;

/** 15 characters: 2 state digits, a 10-character PAN, entity code, Z, checksum. */
const GST = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/;
/** 4 bank letters, a reserved 0, then a 6-character branch code. */
const IFSC = /^[A-Z]{4}0[0-9A-Z]{6}$/;
const PINCODE = /^[1-9][0-9]{5}$/;
/** What <input type="month"> produces: a four-digit year and a real month. */
const MONTH = /^[0-9]{4}-(0[1-9]|1[0-2])$/;

/**
 * Errors for one step.
 *
 * GST is OPTIONAL but validated when given. Plenty of small shops sit under
 * the registration threshold and have no number to enter; requiring one would
 * lock out exactly the corner-shop sellers this is for. A wrong one is a
 * different matter — it fails silently at the tax office, not here.
 */
export function validateStep(
  step: number,
  form: OnboardingForm,
  documentCount: number,
): FieldErrors {
  const e: FieldErrors = {};
  const blank = (v: string) => !v.trim();

  if (step === 0) {
    if (blank(form.business_name)) {
      e.business_name = "Tell us what the business is called";
    } else if (form.business_name.trim().length < 2) {
      e.business_name = "That looks too short to be a name";
    }
    if (form.gst_number.trim() && !GST.test(form.gst_number.trim().toUpperCase())) {
      e.gst_number = "That is not a valid 15-character GSTIN";
    }
    // Optional — a shop opening this week has nothing interesting to say here
    // — but a future date is always a mistake rather than a choice.
    //
    // The SHAPE is checked before parsing, and that ordering is load-bearing:
    // `new Date("sometime-01")` is not an Invalid Date, it is 1 January 2001.
    // V8's parser hunts for anything year-shaped and takes it, so leaning on
    // `isNaN` to reject nonsense accepts nonsense.
    const since = form.business_since.trim();
    if (since) {
      if (!MONTH.test(since)) {
        e.business_since = "Pick a month";
      } else if (new Date(`${since}-01`) > new Date()) {
        e.business_since = "That is in the future";
      }
    }
  }

  if (step === 1) {
    if (blank(form.business_address_line1)) {
      e.business_address_line1 = "The street address is required";
    }
    if (blank(form.business_address_district)) {
      e.business_address_district = "Which district?";
    }
    if (blank(form.business_address_state)) {
      e.business_address_state = "Which state?";
    }
    if (!PINCODE.test(form.business_address_pincode.trim())) {
      e.business_address_pincode = "A 6-digit pincode, not starting with 0";
    }
  }

  if (step === 2) {
    const account = form.bank_account_number.trim();
    if (!account) {
      e.bank_account_number = "Payouts need an account number";
    } else if (!/^[0-9]{9,18}$/.test(account)) {
      e.bank_account_number = "Account numbers are 9 to 18 digits";
    }
    if (!IFSC.test(form.ifsc_code.trim().toUpperCase())) {
      e.ifsc_code = "An 11-character IFSC, like HDFC0001234";
    }
  }

  // Step 3 (documents) has no requirement: uploading is OPTIONAL for now, by
  // decision. Attaching nothing leaves the reviewer with an application they
  // can only rubber-stamp, which is the situation this screen was built to
  // end — so the trade-off is worth revisiting once sellers are actually
  // using it. Re-enabling is this, and nothing else:
  //
  //   if (step === 3 && documentCount === 0) {
  //     e.documents = "Attach at least one document for the reviewer";
  //   }

  return e;
}

/** Whether a step can be left. */
export const stepIsValid = (
  step: number,
  form: OnboardingForm,
  documentCount: number,
): boolean => Object.keys(validateStep(step, form, documentCount)).length === 0;

/** Every step, for the review page and the final submit. */
export const allErrors = (
  form: OnboardingForm,
  documentCount: number,
): FieldErrors =>
  [0, 1, 2, 3].reduce(
    (acc, step) => ({ ...acc, ...validateStep(step, form, documentCount) }),
    {} as FieldErrors,
  );

/**
 * Normalised for submission.
 *
 * Upper-cases the two codes that are conventionally upper-case, so a lower-case
 * entry is not stored as a second, different-looking value — and trims
 * everything, because a trailing space in an account number is a failed payout.
 */
export const normalise = (form: OnboardingForm): OnboardingForm => ({
  ...form,
  business_name: form.business_name.trim(),
  gst_number: form.gst_number.trim().toUpperCase(),
  business_address_line1: form.business_address_line1.trim(),
  business_address_line2: form.business_address_line2.trim(),
  business_address_district: form.business_address_district.trim(),
  business_address_state: form.business_address_state.trim(),
  business_address_pincode: form.business_address_pincode.trim(),
  bank_account_number: form.bank_account_number.trim(),
  ifsc_code: form.ifsc_code.trim().toUpperCase(),
  // The column is a timestamp and the input gives a month, so the day is
  // added here rather than left for the driver to guess.
  business_since: form.business_since.trim()
    ? `${form.business_since.trim()}-01`
    : "",
});
