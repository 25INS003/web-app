import { describe, expect, it } from "vitest";
import {
  allErrors,
  emptyForm,
  normalise,
  stepIsValid,
  validateStep,
} from "./validation";

// What a shop owner has to provide before an admin can review them.
//
// The database requires none of it — every column but the status ones is
// nullable — which is why every existing owner has null GST, null address and
// null bank details, and why the admin queue shows "Not Provided" against all
// of them. These rules are the only thing standing between that and an
// approval given sight unseen.

const filled = {
  business_name: "Green Basket Grocers",
  gst_number: "29ABCDE1234F1Z5",
  business_address_line1: "12 Market Street",
  business_address_line2: "",
  business_address_district: "Bengaluru Urban",
  business_address_state: "Karnataka",
  business_address_pincode: "560001",
  bank_account_number: "123456789012",
  ifsc_code: "HDFC0001234",
  business_since: "2020-03",
};

describe("step 1 — the business", () => {
  it("needs a name", () => {
    expect(validateStep(0, emptyForm, 0).business_name).toBeTruthy();
    expect(validateStep(0, filled, 0).business_name).toBeUndefined();
  });

  it("rejects a one-character name", () => {
    expect(
      validateStep(0, { ...filled, business_name: "G" }, 0).business_name,
    ).toBeTruthy();
  });

  it("accepts no GST at all", () => {
    // Plenty of small shops sit under the registration threshold. Requiring a
    // number would lock out exactly the corner-shop sellers this is for.
    expect(
      validateStep(0, { ...filled, gst_number: "" }, 0).gst_number,
    ).toBeUndefined();
  });

  it("rejects a malformed GST when one is given", () => {
    // Wrong is different from absent: it fails at the tax office, not here.
    for (const bad of ["12345", "29ABCDE1234F1Z", "ABCDE1234F1Z529"]) {
      expect(
        validateStep(0, { ...filled, gst_number: bad }, 0).gst_number,
      ).toBeTruthy();
    }
  });

  it("accepts a valid GST in lower case", () => {
    expect(
      validateStep(0, { ...filled, gst_number: "29abcde1234f1z5" }, 0)
        .gst_number,
    ).toBeUndefined();
  });
});

describe("in business since", () => {
  it("is optional — a shop opening this week has nothing to say here", () => {
    expect(
      validateStep(0, { ...filled, business_since: "" }, 0).business_since,
    ).toBeUndefined();
  });

  it("accepts a past month", () => {
    expect(
      validateStep(0, { ...filled, business_since: "2019-07" }, 0)
        .business_since,
    ).toBeUndefined();
  });

  it("rejects a month in the future", () => {
    // Always a mistake rather than a choice.
    const nextYear = new Date().getFullYear() + 1;
    expect(
      validateStep(0, { ...filled, business_since: `${nextYear}-01` }, 0)
        .business_since,
    ).toBeTruthy();
  });

  it("rejects something that is not a month at all", () => {
    expect(
      validateStep(0, { ...filled, business_since: "sometime" }, 0)
        .business_since,
    ).toBeTruthy();
  });

  it("gains a day on the way out, because the column is a timestamp", () => {
    expect(normalise({ ...filled, business_since: "2020-03" }).business_since)
      .toBe("2020-03-01");
    expect(normalise({ ...filled, business_since: "" }).business_since).toBe("");
  });
});

describe("step 2 — the address", () => {
  it("needs street, district, state and pincode", () => {
    const e = validateStep(1, emptyForm, 0);
    expect(e.business_address_line1).toBeTruthy();
    expect(e.business_address_district).toBeTruthy();
    expect(e.business_address_state).toBeTruthy();
    expect(e.business_address_pincode).toBeTruthy();
  });

  it("does not require line 2", () => {
    expect(
      validateStep(1, { ...filled, business_address_line2: "" }, 0)
        .business_address_line2,
    ).toBeUndefined();
  });

  it("rejects a pincode that is not six digits starting 1-9", () => {
    for (const bad of ["56001", "5600011", "060001", "56000A"]) {
      expect(
        validateStep(1, { ...filled, business_address_pincode: bad }, 0)
          .business_address_pincode,
      ).toBeTruthy();
    }
  });
});

describe("step 3 — the bank", () => {
  it("needs an account number and an IFSC", () => {
    const e = validateStep(2, emptyForm, 0);
    expect(e.bank_account_number).toBeTruthy();
    expect(e.ifsc_code).toBeTruthy();
  });

  it("rejects an account number outside 9 to 18 digits", () => {
    for (const bad of ["12345678", "1234567890123456789", "12345678a"]) {
      expect(
        validateStep(2, { ...filled, bank_account_number: bad }, 0)
          .bank_account_number,
      ).toBeTruthy();
    }
  });

  it("rejects an IFSC that is not four letters, a zero, then six", () => {
    for (const bad of ["HDFC1001234", "HDF00001234", "HDFC000123"]) {
      expect(
        validateStep(2, { ...filled, ifsc_code: bad }, 0).ifsc_code,
      ).toBeTruthy();
    }
    expect(
      validateStep(2, { ...filled, ifsc_code: "hdfc0001234" }, 0).ifsc_code,
    ).toBeUndefined();
  });
});

describe("step 4 — documents", () => {
  it("does not require any", () => {
    // Optional by decision. The cost is that a reviewer can be handed an
    // application with nothing attached — which is the situation this screen
    // was built to end — so this is the assertion to flip when that changes.
    expect(validateStep(3, filled, 0).documents).toBeUndefined();
  });

  it("still lets an application through with documents attached", () => {
    expect(validateStep(3, filled, 2).documents).toBeUndefined();
  });

  it("does not block submission on an empty document list", () => {
    expect(allErrors(filled, 0)).toEqual({});
  });
});

describe("the wizard as a whole", () => {
  it("reports every problem at once for the review step", () => {
    const e = allErrors(emptyForm, 0);
    expect(Object.keys(e).length).toBeGreaterThan(5);
  });

  it("passes a complete application", () => {
    expect(allErrors(filled, 1)).toEqual({});
    for (const step of [0, 1, 2, 3]) {
      expect(stepIsValid(step, filled, 1)).toBe(true);
    }
  });

  it("does not let an empty form past step one", () => {
    expect(stepIsValid(0, emptyForm, 0)).toBe(false);
  });
});

describe("normalise", () => {
  it("upper-cases the two codes that are conventionally upper-case", () => {
    const out = normalise({
      ...filled,
      gst_number: "29abcde1234f1z5",
      ifsc_code: "hdfc0001234",
    });
    expect(out.gst_number).toBe("29ABCDE1234F1Z5");
    expect(out.ifsc_code).toBe("HDFC0001234");
  });

  it("trims everything", () => {
    // A trailing space in an account number is a failed payout.
    const out = normalise({
      ...filled,
      bank_account_number: " 123456789012 ",
      business_name: "  Green Basket  ",
    });
    expect(out.bank_account_number).toBe("123456789012");
    expect(out.business_name).toBe("Green Basket");
  });
});
