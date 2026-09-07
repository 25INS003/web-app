import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Pre-filling a resubmission with the application already on file.
 *
 * A refused owner is being asked to fix what was wrong. Handing them a blank
 * form is not asking for a fix — it is asking them to retype a business name,
 * an address and their bank details from memory, which is a second chance to
 * make a new mistake and a good way to be rejected twice for the same field.
 *
 * The mapping is where this can go quietly wrong: the row and the form do not
 * agree about types. A nullable column has to become the empty string an
 * input is controlled with, a timestamp has to become the month an
 * `<input type="month">` accepts, and the placeholder business name written at
 * registration must not be presented as something the owner typed.
 */

const get = vi.fn();
vi.mock("@/lib/api/client", () => ({
  api: { get: (...args: unknown[]) => get(...args), post: vi.fn() },
}));

const { onboardingApi } = await import("./api");

beforeEach(() => get.mockReset());

describe("the application handed back for a resubmission", () => {
  it("carries every field the form asks for", async () => {
    get.mockResolvedValue({
      business_name: "Test Seller Traders",
      gst_number: "22AAAAA0000A1Z5",
      business_address_line1: "12 Market Road",
      business_address_line2: "Near the bridge",
      business_address_district: "Jammu",
      business_address_state: "Jammu and Kashmir",
      business_address_pincode: "180001",
      bank_account_number: "998877665544",
      ifsc_code: "SBIN0001234",
    });

    const form = await onboardingApi.current();

    expect(form).toMatchObject({
      business_name: "Test Seller Traders",
      business_address_line1: "12 Market Road",
      // Bank details included on purpose: a resubmission that silently dropped
      // them would be refused again for a field the owner believes they gave.
      bank_account_number: "998877665544",
      ifsc_code: "SBIN0001234",
    });
  });

  it("turns a stored timestamp into the month the input accepts", async () => {
    get.mockResolvedValue({ business_since: "2020-03-01T00:00:00.000Z" });

    const form = await onboardingApi.current();

    // `<input type="month">` shows nothing at all for a full ISO timestamp,
    // so the field would have looked empty while carrying a value.
    expect(form.business_since).toBe("2020-03");
  });

  it("leaves out the placeholder name written at registration", async () => {
    get.mockResolvedValue({ business_name: "New Enterprise" });

    const form = await onboardingApi.current();

    // Pre-filling it would have somebody submit a business called that.
    expect(form.business_name).toBeUndefined();
  });

  it("drops nulls rather than putting them in a controlled input", async () => {
    get.mockResolvedValue({
      business_name: "Half Filled Ltd",
      gst_number: null,
      business_address_line2: null,
    });

    const form = await onboardingApi.current();

    expect(form.business_name).toBe("Half Filled Ltd");
    // A `null` value flips a controlled input to uncontrolled and React
    // complains for the rest of the page's life.
    expect(form.gst_number).toBeUndefined();
    expect(form.business_address_line2).toBeUndefined();
  });

  it("ignores fields the form does not have", async () => {
    get.mockResolvedValue({
      business_name: "Fine Foods",
      verification_status: "rejected",
      approval_note: "Unreadable certificate.",
      is_approved: false,
    });

    const form = await onboardingApi.current();

    expect(Object.keys(form)).toEqual(["business_name"]);
  });

  it("survives an empty application without throwing", async () => {
    get.mockResolvedValue(undefined);

    await expect(onboardingApi.current()).resolves.toEqual({});
  });
});
