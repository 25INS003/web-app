import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * What an admin action writes back into the owner list.
 *
 * The three actions do not answer with the same shape. `approve` returns the
 * owner row; `reject` and `revoke` return `{ shopOwner, deactivatedShops }`,
 * because taking an owner down also takes their live shops down and the count
 * is worth reporting. The store fed `response.data.data` straight into the
 * list, so rejecting replaced the owner row with the WRAPPER — an object with
 * no `id` and no `is_approved` — and the row went on rendering as unverified.
 *
 * That is the reported bug: an admin rejected an application and the list kept
 * saying "Pending Review". These tests are on the store rather than the screen
 * because the row was already wrong before anything rendered it.
 */

const put = vi.fn();
vi.mock("@/api/apiClient", () => ({
  default: {
    put: (...args: unknown[]) => put(...args),
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

const { useShopOwnerStore } = await import("./adminShopownerStore");

const OWNER = {
  id: "owner-1",
  business_name: "Corner Store",
  is_approved: false,
  verification_status: "pending",
};

const seed = () =>
  useShopOwnerStore.setState({
    shopOwners: [OWNER],
    pendingOwners: [OWNER],
    selectedOwner: OWNER,
  });

type OwnerRow = { id?: string; business_name?: string; is_approved?: boolean; verification_status?: string };

const rowFor = (id: string): OwnerRow | undefined =>
  useShopOwnerStore
    .getState()
    .shopOwners.find((o: OwnerRow) => o.id === id);

beforeEach(() => {
  put.mockReset();
  seed();
});

describe("rejecting an owner", () => {
  // The wrapper shape the endpoint actually returns.
  const REJECTED = {
    data: {
      data: {
        shopOwner: { ...OWNER, is_approved: false, verification_status: "rejected" },
        deactivatedShops: 2,
      },
    },
  };

  it("keeps a usable owner row rather than storing the wrapper", async () => {
    put.mockResolvedValue(REJECTED);

    await useShopOwnerStore.getState().rejectOwner("owner-1");

    const row = rowFor("owner-1");
    // The row survived: the wrapper has neither of these.
    expect(row?.id).toBe("owner-1");
    expect(row?.business_name).toBe("Corner Store");
  });

  it("records that the application was rejected, not that it is pending", async () => {
    put.mockResolvedValue(REJECTED);

    await useShopOwnerStore.getState().rejectOwner("owner-1");

    // The symptom: without this the list reads `is_approved: undefined` off the
    // wrapper and falls through to its "not approved yet" branch.
    expect(rowFor("owner-1")?.verification_status).toBe("rejected");
  });

  it("reports how many shops went down with them", async () => {
    put.mockResolvedValue(REJECTED);

    const result = await useShopOwnerStore.getState().rejectOwner("owner-1");

    // The count is the only thing the wrapper carried that the row does not,
    // so unwrapping must not simply throw it away.
    expect(result).toMatchObject({ success: true, deactivatedShops: 2 });
  });
});

describe("revoking an owner", () => {
  it("unwraps the same shape", async () => {
    put.mockResolvedValue({
      data: {
        data: {
          shopOwner: { ...OWNER, verification_status: "revoked" },
          deactivatedShops: 1,
        },
      },
    });

    await useShopOwnerStore.getState().revokeOwner("owner-1");

    expect(rowFor("owner-1")?.id).toBe("owner-1");
    expect(rowFor("owner-1")?.verification_status).toBe("revoked");
  });
});

describe("approving an owner", () => {
  it("unwraps the envelope approve now answers with", async () => {
    // Approving after a rejection puts the owner's shops back, so it reports
    // how many — which made it the same wrapper shape as the other two.
    put.mockResolvedValue({
      data: {
        data: {
          shopOwner: { ...OWNER, is_approved: true, verification_status: "approved" },
          reactivatedShops: 2,
        },
      },
    });

    const result = await useShopOwnerStore.getState().approveOwner("owner-1");

    const row = rowFor("owner-1");
    expect(row?.id).toBe("owner-1");
    expect(row?.is_approved).toBe(true);
    expect(result).toMatchObject({ success: true, reactivatedShops: 2 });
  });

  it("still reads a bare row, so an older response shape cannot break it", async () => {
    // Reading `.shopOwner` off a row that has no such key has to fall back to
    // the row itself — otherwise unwrapping trades one shape bug for another.
    put.mockResolvedValue({
      data: {
        data: { ...OWNER, is_approved: true, verification_status: "approved" },
      },
    });

    await useShopOwnerStore.getState().approveOwner("owner-1");

    expect(rowFor("owner-1")?.id).toBe("owner-1");
    expect(rowFor("owner-1")?.verification_status).toBe("approved");
  });
});
