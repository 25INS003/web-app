// The customer's side of a photographed order.
//
// What is worth pinning is the ORDER of the choices: a shop cannot be picked
// before an address, because the shops on offer are the ones that reach it. The
// alternative — any shop, refused at the end — makes somebody upload a photo to
// be told no.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { StrictMode, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

type SendInput = {
  shopId: string;
  addressId: string;
  note?: string;
  files: File[];
};
const send = vi.fn(async (_input: SendInput) => undefined);
const cancel = vi.fn();
let shopsForAddress: Array<{ id: string; name: string; city?: string }> = [];
let requests: Array<Record<string, unknown>> = [];
let created: string[] = [];
let revoked: string[] = [];

vi.mock("@/features/checkout/hooks", () => ({
  useAddresses: () => ({
    data: [
      {
        id: "a1",
        address_line: "3 Elm St",
        city: "Town",
        pincode: "123456",
        is_default: true,
      },
      {
        id: "a2",
        address_line: "9 Far Rd",
        city: "Elsewhere",
        pincode: "999888",
        is_default: false,
      },
    ],
    isPending: false,
  }),
}));

vi.mock("./hooks", async () => {
  const actual = await vi.importActual<typeof import("./hooks")>("./hooks");
  return {
    ...actual,
    useShopsForAddress: (addressId?: string) => ({
      data: addressId === "a1" ? shopsForAddress : [],
      isPending: false,
    }),
    useSendOrderRequest: () => ({ mutateAsync: send, isPending: false }),
    useMyOrderRequests: () => ({ data: requests, isPending: false }),
    useCancelOrderRequest: () => ({ mutate: cancel, isPending: false }),
  };
});

import { PhotoOrderView } from "./PhotoOrderView";

// StrictMode, because the app runs in it and that is not a detail here: it
// mounts an effect, runs its cleanup, then re-runs it. A component that
// acquires a resource in render and releases it in an effect cleanup looks
// fine without this and is broken with it — which is exactly how the preview
// thumbnails shipped blank.
const wrap = (ui: ReactNode) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <StrictMode>
      <QueryClientProvider client={qc}>{ui}</QueryClientProvider>
    </StrictMode>,
  );
};

const photo = () =>
  new File([new Uint8Array([1, 2, 3])], "list.png", { type: "image/png" });

beforeEach(() => {
  send.mockClear();
  cancel.mockClear();
  shopsForAddress = [{ id: "s1", name: "Crust & Co", city: "Town" }];
  requests = [];
  // jsdom has no object-URL implementation, and the thumbnails ask for one.
  // Counted rather than stubbed flat, so a preview that is revoked while it is
  // still on screen is visible to a test.
  let n = 0;
  created = [];
  revoked = [];
  global.URL.createObjectURL = vi.fn(() => {
    const url = `blob:preview-${++n}`;
    created.push(url);
    return url;
  });
  global.URL.revokeObjectURL = vi.fn((url: string) => {
    revoked.push(url);
  });
});

describe("sending a list", () => {
  it("opens on the address they usually use, without a render in between", () => {
    wrap(<PhotoOrderView />);
    expect(
      (screen.getByLabelText(/deliver to/i) as HTMLSelectElement).value,
    ).toBe("a1");
  });

  it("offers only shops that reach the chosen address", () => {
    wrap(<PhotoOrderView />);
    expect(
      screen.getByRole("option", { name: /Crust & Co/ }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/deliver to/i), {
      target: { value: "a2" },
    });

    expect(screen.queryByRole("option", { name: /Crust & Co/ })).toBeNull();
    expect(
      screen.getByText(/No shop delivers to that address yet/i),
    ).toBeInTheDocument();
  });

  it("will not send without a photo, an address and a shop", async () => {
    wrap(<PhotoOrderView />);
    const button = screen.getByRole("button", { name: /send to the shop/i });

    // A shop chosen but nothing photographed.
    fireEvent.change(screen.getByLabelText(/send it to/i), {
      target: { value: "s1" },
    });
    expect(button).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/your list/i), {
      target: { files: [photo()] },
    });
    await waitFor(() => expect(button).toBeEnabled());
  });

  it("sends the photos with the shop and address, and nothing about price", async () => {
    wrap(<PhotoOrderView />);

    fireEvent.change(screen.getByLabelText(/your list/i), {
      target: { files: [photo()] },
    });
    fireEvent.change(screen.getByLabelText(/send it to/i), {
      target: { value: "s1" },
    });
    fireEvent.change(screen.getByLabelText(/anything to add/i), {
      target: { value: "ripe bananas" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send to the shop/i }));

    await waitFor(() => expect(send).toHaveBeenCalled());
    const sent = send.mock.calls[0][0];
    expect(sent.shopId).toBe("s1");
    expect(sent.addressId).toBe("a1");
    expect(sent.note).toBe("ripe bananas");
    expect(sent.files).toHaveLength(1);
  });

  it("drops a shop that the new address cannot be reached from", async () => {
    wrap(<PhotoOrderView />);

    fireEvent.change(screen.getByLabelText(/your list/i), {
      target: { files: [photo()] },
    });
    fireEvent.change(screen.getByLabelText(/send it to/i), {
      target: { value: "s1" },
    });
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /send to the shop/i }),
      ).toBeEnabled(),
    );

    // Moving the delivery address to one that shop cannot reach must not leave
    // a sendable form pointing at it.
    fireEvent.change(screen.getByLabelText(/deliver to/i), {
      target: { value: "a2" },
    });
    expect(
      screen.getByRole("button", { name: /send to the shop/i }),
    ).toBeDisabled();
  });

  // The bug this pins: the preview URLs were created in a `useMemo` during
  // render and released in a `useEffect` cleanup. StrictMode mounts an effect,
  // runs its cleanup, then re-runs it — so every URL was revoked the instant it
  // was made while the memo never recomputed, and the thumbnail rendered blank.
  // The photo WAS held in state, so the form looked broken rather than empty:
  // you pick a photo, nothing appears, and you never press send.
  it("keeps the thumbnail's URL alive while the photo is on screen", async () => {
    wrap(<PhotoOrderView />);

    fireEvent.change(screen.getByLabelText(/your list/i), {
      target: { files: [photo()] },
    });

    const img = await screen.findByAltText(/your list, photo 1/i);
    const src = img.getAttribute("src") as string;
    expect(created).toContain(src);
    expect(revoked).not.toContain(src);
  });

  it("releases a preview when its photo is taken back off", async () => {
    wrap(<PhotoOrderView />);

    fireEvent.change(screen.getByLabelText(/your list/i), {
      target: { files: [photo()] },
    });
    const img = await screen.findByAltText(/your list, photo 1/i);
    const src = img.getAttribute("src") as string;

    fireEvent.click(screen.getByRole("button", { name: /remove photo 1/i }));

    expect(screen.queryByAltText(/your list, photo 1/i)).toBeNull();
    expect(revoked).toContain(src);
  });

  it("keeps a second photo's preview when a first one is removed", async () => {
    wrap(<PhotoOrderView />);

    fireEvent.change(screen.getByLabelText(/your list/i), {
      target: { files: [photo(), photo()] },
    });
    await screen.findByAltText(/your list, photo 2/i);
    const second = screen
      .getByAltText(/your list, photo 2/i)
      .getAttribute("src") as string;

    fireEvent.click(screen.getByRole("button", { name: /remove photo 1/i }));

    // The survivor slid into slot 1, and its URL is still good.
    const survivor = screen
      .getByAltText(/your list, photo 1/i)
      .getAttribute("src");
    expect(survivor).toBe(second);
    expect(revoked).not.toContain(second);
  });
});

describe("what they have sent", () => {
  it("shows the shop's reason when it could not be filled", () => {
    requests = [
      {
        id: "r1",
        status: "declined",
        images: [],
        note: null,
        decline_note: "Out of most of this today.",
        delivery_address: null,
        shop: { id: "s1", name: "Crust & Co" },
        customer: null,
        order: null,
        created_at: new Date().toISOString(),
        handled_at: null,
      },
    ];
    wrap(<PhotoOrderView />);

    expect(screen.getByText(/Could not be filled/i)).toBeInTheDocument();
    expect(screen.getByText(/Out of most of this today/)).toBeInTheDocument();
  });

  it("links straight to the order a list became", () => {
    requests = [
      {
        id: "r1",
        status: "fulfilled",
        images: [],
        note: null,
        decline_note: null,
        delivery_address: null,
        shop: { id: "s1", name: "Crust & Co" },
        customer: null,
        order: { id: "o1", order_number: "ORD9" },
        created_at: new Date().toISOString(),
        handled_at: null,
      },
    ];
    wrap(<PhotoOrderView />);

    expect(screen.getByRole("link", { name: /ORD9/ })).toHaveAttribute(
      "href",
      "/orders/o1",
    );
  });

  it("offers to withdraw only while nobody has acted", () => {
    requests = [
      {
        id: "r1",
        status: "pending",
        images: [],
        note: null,
        decline_note: null,
        delivery_address: null,
        shop: { id: "s1", name: "Crust & Co" },
        customer: null,
        order: null,
        created_at: new Date().toISOString(),
        handled_at: null,
      },
    ];
    wrap(<PhotoOrderView />);

    fireEvent.click(screen.getByRole("button", { name: /withdraw/i }));
    expect(cancel).toHaveBeenCalledWith("r1");
  });
  // A list that runs onto a second page is sent as two pictures. Showing only
  // the first left the customer unable to check what they actually sent.
  it("shows every photo that was sent, not just the first", () => {
    requests = [
      {
        id: "r1",
        status: "pending",
        images: [
          { url: "http://img/one.png", alt_text: null },
          { url: "http://img/two.png", alt_text: null },
          { url: "http://img/three.png", alt_text: null },
        ],
        note: null,
        decline_note: null,
        delivery_address: null,
        shop: { id: "s1", name: "Crust & Co" },
        customer: null,
        order: null,
        created_at: new Date().toISOString(),
        handled_at: null,
      },
    ];
    wrap(<PhotoOrderView />);

    for (const [i, file] of ["one", "two", "three"].entries()) {
      expect(
        screen.getByAltText(new RegExp(`your list, photo ${i + 1}`, "i")),
      ).toHaveAttribute("src", `http://img/${file}.png`);
    }
  });

  it("still says something when a request carries no photo at all", () => {
    requests = [
      {
        id: "r1",
        status: "pending",
        images: [],
        note: null,
        decline_note: null,
        delivery_address: null,
        shop: { id: "s1", name: "Crust & Co" },
        customer: null,
        order: null,
        created_at: new Date().toISOString(),
        handled_at: null,
      },
    ];
    wrap(<PhotoOrderView />);

    expect(screen.queryByAltText(/your list, photo/i)).toBeNull();
    expect(screen.getByText("Crust & Co")).toBeInTheDocument();
  });
});
