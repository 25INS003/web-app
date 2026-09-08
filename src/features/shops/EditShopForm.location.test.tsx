import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Editing where the shop actually is.
 *
 * Creating a shop requires coordinates — the add form asks for them, offers
 * "Detect my location" and a draggable pin. The edit form had none of it: it
 * seeded `shop_lat`/`shop_lng` into form state and posted them straight back,
 * so a shop that moved kept sending riders to the old spot forever and no
 * field anywhere said why.
 *
 * The submitted FormData is what these assert on. The inputs existing proves
 * nothing on its own — the values have to survive the cast into the request,
 * which is where the one real trap is: `Number("")` is 0, and 0,0 is a real
 * place in the Gulf of Guinea.
 */

const router = { push: vi.fn(), back: vi.fn(), replace: vi.fn() };
vi.mock("next/navigation", () => ({ useRouter: () => router }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// Leaflet touches `window` and needs a real layout; the map is not what these
// tests are about. The stub exposes the pin-move callback as a button so the
// wiring between map and form can still be exercised.
vi.mock("@/components/Maps/MapPicker", () => ({
  default: ({
    lat,
    lng,
    onLocationChange,
  }: {
    lat: number | null;
    lng: number | null;
    onLocationChange: (lat: number, lng: number) => void;
  }) => (
    <button
      type="button"
      data-testid="map"
      data-lat={String(lat)}
      data-lng={String(lng)}
      onClick={() => onLocationChange(19.076, 72.8777)}
    >
      map
    </button>
  ),
}));

// The component is untyped JSX, so the dynamic import gives TS nothing to
// check props against. Cast once, like the sibling status test.
const { EditShopForm } = (await import("./EditShopForm")) as any;

// Typed with its parameters so `mock.calls` carries them: the FormData the
// form built is the whole point of these assertions.
const saveShop = vi.fn(async (_shopId: string, _body: FormData) => ({
  id: "s1",
}));

const SHOP = {
  id: "s1",
  name: "Corner Store",
  shop_status: "active",
  phone: "9100000000",
  email: "s@example.com",
  city: "Jammu",
  state: "JK",
  address_line: "1 St",
  pincode: "180001",
  shop_lat: 32.7266,
  shop_lng: 74.857,
  opening_time: "09:00",
  closing_time: "21:00",
  total_products: 0,
  total_orders: 0,
};

const shops = [SHOP];

/**
 * The location fields live under the Contact tab, and Radix unmounts the tabs
 * that are not showing — so every one of these has to open it first. Kept in
 * the render helper rather than repeated, because a test that forgets is not a
 * failing assertion, it is `getByLabelText` throwing about a label that exists.
 */
const openContactTab = () =>
  // A plain button, not a `TabsTrigger` — this form hand-rolls its tab strip
  // for the sliding pill, so there is no `role="tab"` to select by.
  fireEvent.click(screen.getByRole("button", { name: /^contact$/i }));

const renderForm = () => {
  const result = render(
    <EditShopForm
      shopId="s1"
      shops={shops}
      isLoading={false}
      fetchShops={vi.fn()}
      saveShop={saveShop}
      backHref="/myshop"
    />,
  );
  openContactTab();
  return result;
};

/**
 * Render, open the Contact tab, and wait for the map to actually be there.
 *
 * `next/dynamic` resolves even a mocked module through a promise, so the map
 * is absent on the first synchronous pass. Every test here passed in a full
 * run — an earlier test had already resolved it and the module cache made the
 * next mount synchronous — and the first one failed the moment it was run on
 * its own. Ordering-dependent tests are worse than missing ones.
 */
const renderReady = async () => {
  const result = renderForm();
  await act(async () => {});
  return result;
};

const lat = () => screen.getByLabelText(/latitude/i) as HTMLInputElement;
const lng = () => screen.getByLabelText(/longitude/i) as HTMLInputElement;

const submit = async () => {
  fireEvent.click(screen.getAllByRole("button", { name: /save/i })[0]);
  await waitFor(() => expect(saveShop).toHaveBeenCalled());
  return saveShop.mock.calls.at(-1)![1];
};

beforeEach(() => {
  vi.clearAllMocks();
  // Moving the pin now schedules a reverse-geocode, so every test in this file
  // can reach the network — including the ones that are not about geocoding at
  // all. Stubbed by default; the describes below override it with the response
  // they care about.
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({ json: async () => ({}) }) as unknown as Response),
  );
});

afterEach(() => vi.unstubAllGlobals());

describe("the shop's map location on the edit screen", () => {
  it("shows the coordinates the shop already has", async () => {
    await renderReady();

    // Seeded before, but into nothing an owner could see or reach.
    expect(lat()).toHaveValue(32.7266);
    expect(lng()).toHaveValue(74.857);
  });

  it("saves a coordinate the owner typed", async () => {
    await renderReady();

    fireEvent.change(lat(), { target: { value: "28.6139" } });
    fireEvent.change(lng(), { target: { value: "77.209" } });

    const sent = await submit();
    expect(sent.get("shop_lat")).toBe("28.6139");
    expect(sent.get("shop_lng")).toBe("77.209");
  });

  it("moves the coordinates when the pin is dragged", async () => {
    await renderReady();

    fireEvent.click(screen.getByTestId("map"));

    expect(lat()).toHaveValue(19.076);
    const sent = await submit();
    expect(sent.get("shop_lat")).toBe("19.076");
  });

  it("points the map at the shop's own coordinates", async () => {
    await renderReady();

    // Not the default centre of India, which is what an unwired map shows.
    expect(screen.getByTestId("map")).toHaveAttribute("data-lat", "32.7266");
  });

  it("follows the boxes when they are typed into", async () => {
    await renderReady();

    fireEvent.change(lat(), { target: { value: "28.6139" } });

    expect(screen.getByTestId("map")).toHaveAttribute("data-lat", "28.6139");
  });

  it("does not move the shop to the Atlantic when a box is cleared", async () => {
    await renderReady();

    fireEvent.change(lat(), { target: { value: "" } });

    // `Number("")` is 0, and the old cast sent it. 0,0 is in the Gulf of
    // Guinea; an empty box means "leave it alone", not "move the shop".
    const sent = await submit();
    expect(sent.get("shop_lat")).toBeNull();
    // The one that was not cleared still goes.
    expect(sent.get("shop_lng")).toBe("74.857");
  });

  it("still sends the rest of the form", async () => {
    await renderReady();

    const sent = await submit();
    expect(sent.get("name")).toBe("Corner Store");
    expect(sent.get("city")).toBe("Jammu");
  });
});

/**
 * The pin following the pincode.
 *
 * Changing a shop's pincode without moving its pin leaves the two disagreeing,
 * and the pin is the one riders use — so the address says one area and the
 * delivery goes to another. Geocoding the pincode is the cheapest way to keep
 * them together.
 *
 * What it must NOT do is fire on its own. Opening the page seeds the pincode
 * into the form, and treating that as an edit would move a pin somebody had
 * placed by hand to the middle of a postal district, silently, on every visit.
 */
describe("moving the pin when the pincode changes", () => {
  const pincode = () => screen.getByPlaceholderText(/zip code/i);

  /**
   * Advance the debounce AND flush the render it causes.
   *
   * `advanceTimersByTimeAsync` alone runs the geocode and its `setValue`, so
   * the coordinate inputs update — but `setPinMovedFor` is React state, and
   * without `act` the re-render has not happened by the time the assertion
   * runs. The notice was there; the test was looking too early.
   */
  const settle = async (ms: number) => {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ms);
    });
  };

  // Typed with the URL parameter so `mock.calls` carries it — one assertion
  // below checks WHICH pincode was asked for, not just that something was.
  const geocoded = (lat: string, lon: string) =>
    vi.fn(
      async (_url: string) =>
        ({ json: async () => [{ lat, lon }] }) as unknown as Response,
    );

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not geocode just because the page opened", async () => {
    const fetchSpy = geocoded("28.6139", "77.2090");
    vi.stubGlobal("fetch", fetchSpy);

    await renderReady();
    await settle(2000);

    // The shop's own pincode arrives via `reset()`. Reading that as an edit
    // would overwrite a hand-placed pin on every single visit.
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(lat()).toHaveValue(32.7266);
  });

  it("moves the pin to a pincode the owner typed", async () => {
    vi.stubGlobal("fetch", geocoded("28.6139", "77.2090"));

    await renderReady();
    fireEvent.change(pincode(), { target: { value: "110001" } });
    await settle(1000);

    expect(lat()).toHaveValue(28.6139);
    expect(lng()).toHaveValue(77.209);
  });

  it("waits for a whole pincode before asking", async () => {
    const fetchSpy = geocoded("28.6139", "77.2090");
    vi.stubGlobal("fetch", fetchSpy);

    await renderReady();
    fireEvent.change(pincode(), { target: { value: "1100" } });
    await settle(2000);

    // Six digits, not four. Otherwise every keystroke is a request and five of
    // the six are for a pincode that does not exist.
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("asks once for a pincode typed in one go", async () => {
    const fetchSpy = geocoded("28.6139", "77.2090");
    vi.stubGlobal("fetch", fetchSpy);

    await renderReady();
    fireEvent.change(pincode(), { target: { value: "110001" } });
    fireEvent.change(pincode(), { target: { value: "110002" } });
    fireEvent.change(pincode(), { target: { value: "110003" } });
    await settle(2000);

    // Debounced — Nominatim's usage policy is one request a second.
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(String(fetchSpy.mock.calls[0][0])).toContain("110003");
  });

  it("says the pin is only the area centre", async () => {
    vi.stubGlobal("fetch", geocoded("28.6139", "77.2090"));

    await renderReady();
    fireEvent.change(pincode(), { target: { value: "110001" } });
    await settle(1000);

    // A pin that moves on its own and does not explain itself is
    // indistinguishable from one that moved by mistake.
    expect(screen.getByText(/centre of 110001/i)).toBeInTheDocument();
  });

  it("drops that notice once the owner places the pin themselves", async () => {
    vi.stubGlobal("fetch", geocoded("28.6139", "77.2090"));

    await renderReady();
    fireEvent.change(pincode(), { target: { value: "110001" } });
    await settle(1000);
    // Asserted present first, so this test fails if the notice never appeared
    // rather than passing because nothing was there to drop.
    expect(screen.getByText(/centre of 110001/i)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("map"));

    // It has stopped being true.
    expect(screen.queryByText(/centre of/i)).not.toBeInTheDocument();
    expect(lat()).toHaveValue(19.076);
  });

  it("leaves the pin alone when the pincode is not found", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ json: async () => [] }) as unknown as Response));

    await renderReady();
    fireEvent.change(pincode(), { target: { value: "999999" } });
    await settle(2000);

    expect(lat()).toHaveValue(32.7266);
    expect(screen.queryByText(/centre of/i)).not.toBeInTheDocument();
  });

  it("leaves the pin alone when the geocoder is down", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));

    await renderReady();
    fireEvent.change(pincode(), { target: { value: "110001" } });
    await settle(2000);

    // The safe outcome: the owner can still drag the pin or type coordinates.
    expect(lat()).toHaveValue(32.7266);
  });
});

/**
 * City and state following the pincode too.
 *
 * The address blocks below are the real ones Nominatim returned for these
 * pincodes, not invented shapes — and they are the whole difficulty. The key
 * that holds the city changes from pincode to pincode:
 *
 *   110001 → `city: "New Delhi"`
 *   180001 → no `city`; `county: "Jammu"`
 *   400001 → no `city`, no `county`; `state_district: "Mumbai City District"`
 *
 * Reading `address.city` — which is what the detect-location path did — finds
 * nothing for two of those three, and writing that straight in would blank a
 * city the owner had already typed correctly.
 */
describe("filling city and state from the pincode", () => {
  const pincode = () => screen.getByPlaceholderText(/zip code/i);
  const city = () => screen.getByPlaceholderText(/^city$/i) as HTMLInputElement;
  const state = () =>
    screen.getByPlaceholderText(/^state$/i) as HTMLInputElement;

  const settle = async (ms: number) => {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ms);
    });
  };

  const respond = (address: Record<string, string>) =>
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async (_url: string) =>
          ({
            json: async () => [{ lat: "28.6139", lon: "77.2090", address }],
          }) as unknown as Response,
      ),
    );

  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  it("fills both when the geocoder names the city outright", async () => {
    respond({ city: "New Delhi", state: "Delhi", postcode: "110001" });

    await renderReady();
    fireEvent.change(pincode(), { target: { value: "110001" } });
    await settle(1000);

    expect(city()).toHaveValue("New Delhi");
    expect(state()).toHaveValue("Delhi");
  });

  it("falls back to the county when there is no city", async () => {
    // 180001, exactly as returned.
    respond({
      postcode: "180001",
      county: "Jammu",
      state_district: "Jammu district",
      state: "Jammu and Kashmir",
    });

    await renderReady();
    // NOT 180001: that is the fixture's own pincode, and re-typing it is
    // skipped by design. The first version of this test did exactly that and
    // still passed its city assertion — because the fixture's city is already
    // "Jammu", so nothing happening looked identical to it working.
    fireEvent.change(city(), { target: { value: "Wrongtown" } });
    fireEvent.change(pincode(), { target: { value: "180002" } });
    await settle(1000);

    // `address.city` alone would have left this empty — or blanked it.
    expect(city()).toHaveValue("Jammu");
    expect(state()).toHaveValue("Jammu and Kashmir");
  });

  it("prefers a recognisable district name over a zone number", async () => {
    // 400001, exactly as returned. `city_district` is "Mumbai Zone 2", which
    // is not a name anybody would write on an envelope.
    respond({
      postcode: "400001",
      suburb: "F/S Ward",
      city_district: "Mumbai Zone 2",
      state_district: "Mumbai City District",
      state: "Maharashtra",
    });

    await renderReady();
    fireEvent.change(pincode(), { target: { value: "400001" } });
    await settle(1000);

    // Trailing "District" trimmed, so this reads as a place rather than an
    // administrative unit.
    expect(city()).toHaveValue("Mumbai City");
    expect(state()).toHaveValue("Maharashtra");
  });

  it("does not blank a city the geocoder cannot name", async () => {
    respond({ postcode: "999998", state: "Kerala" });

    await renderReady();
    fireEvent.change(pincode(), { target: { value: "999998" } });
    await settle(1000);

    // The owner's own answer beats nothing, and this fires while they are
    // mid-edit. The state it DID know still lands.
    expect(city()).toHaveValue("Jammu");
    expect(state()).toHaveValue("Kerala");
  });

  it("says the city and state moved too", async () => {
    respond({ city: "New Delhi", state: "Delhi" });

    await renderReady();
    fireEvent.change(pincode(), { target: { value: "110001" } });
    await settle(1000);

    // Three fields changing from one edit is surprising; the notice names it
    // and asks them to check, because the city can be a district name.
    expect(screen.getByText(/city and state set from 110001/i)).toBeInTheDocument();
    expect(screen.getByText(/check the city and state/i)).toBeInTheDocument();
  });

  it("touches nothing when the pincode is not found", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string) => ({ json: async () => [] }) as unknown as Response),
    );

    await renderReady();
    fireEvent.change(pincode(), { target: { value: "999999" } });
    await settle(2000);

    expect(city()).toHaveValue("Jammu");
    expect(state()).toHaveValue("JK");
  });
});

/**
 * The address following the pin.
 *
 * The other direction, and the one with a trap in it. Moving the pin writes a
 * new pincode; the pincode effect watches for exactly that and moves the pin
 * to the centre of the postal area. Left alone, the two features fight: the
 * owner drops the pin on their door, and it jumps a kilometre to the middle of
 * the district. They would lose every time.
 */
describe("moving the pin updates the address", () => {
  const pincodeBox = () =>
    screen.getByPlaceholderText(/zip code/i) as HTMLInputElement;
  const cityBox = () => screen.getByPlaceholderText(/^city$/i) as HTMLInputElement;
  const stateBox = () =>
    screen.getByPlaceholderText(/^state$/i) as HTMLInputElement;
  const street = () =>
    screen.getByPlaceholderText(/building, street, area/i) as HTMLInputElement;

  const settle = async (ms: number) => {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ms);
    });
  };

  // The real reverse-geocode body for a point in Mumbai.
  const AT_PIN = {
    address: {
      road: "Dockyard Road",
      suburb: "Sewri",
      city_district: "Mumbai Zone 2",
      state_district: "Mumbai City District",
      state: "Maharashtra",
      postcode: "400015",
    },
  };

  /**
   * Answers BOTH endpoints, differently.
   *
   * This started as one canned reply for every URL, which quietly made the
   * loop test meaningless: the forward lookup got a reverse-shaped object,
   * `Array.isArray` said no, and it bailed out before it could move anything.
   * The test passed with the guard deliberately removed.
   *
   * So `/search` now answers like the real forward geocoder — an array, at the
   * area centre, a long way from where the pin was dropped. If the loop is
   * live, the coordinates end up there and the test says so.
   */
  const AREA_CENTRE = [{ lat: "18.9916", lon: "72.8539", address: AT_PIN.address }];

  const respondReverse = () => {
    const spy = vi.fn(async (url: string) => {
      const body = String(url).includes("/reverse") ? AT_PIN : AREA_CENTRE;
      return { json: async () => body } as unknown as Response;
    });
    vi.stubGlobal("fetch", spy);
    return spy;
  };

  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  it("fills city, state and pincode from the new point", async () => {
    respondReverse();

    await renderReady();
    fireEvent.click(screen.getByTestId("map"));
    await settle(1000);

    expect(cityBox()).toHaveValue("Mumbai City");
    expect(stateBox()).toHaveValue("Maharashtra");
    expect(pincodeBox()).toHaveValue("400015");
  });

  it("leaves the street line alone", async () => {
    respondReverse();

    await renderReady();
    fireEvent.click(screen.getByTestId("map"));
    await settle(1000);

    // "Shop 4, opposite the temple" is worth more than a road name off a map,
    // and the owner did not ask for it to be replaced by nudging a pin.
    expect(street()).toHaveValue("1 St");
  });

  it("does not let the new pincode drag the pin back", async () => {
    respondReverse();

    await renderReady();
    fireEvent.click(screen.getByTestId("map"));

    // Two advances, deliberately. The reverse lookup fires at 600ms and only
    // THEN writes the pincode, which is what would schedule the forward
    // lookup — so a single long advance ends before that second timer exists
    // and the loop cannot be observed at all. A one-shot `settle(3000)` here
    // passed with the guard deliberately removed.
    await settle(1000);
    expect(pincodeBox()).toHaveValue("400015");
    await settle(3000);

    // The loop: pin → pincode → forward geocode → pin. If it fired, the
    // coordinates would have been replaced by the area centre (18.9916) from
    // the forward lookup instead of staying where the map put them.
    expect(lat()).toHaveValue(19.076);
    expect(lng()).toHaveValue(72.8777);
  });

  it("asks the geocoder once, not once per direction", async () => {
    const spy = respondReverse();

    await renderReady();
    fireEvent.click(screen.getByTestId("map"));
    await settle(3000);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(String(spy.mock.calls[0][0])).toContain("/reverse");
  });

  it("collapses a flurry of pin moves into one request", async () => {
    const spy = respondReverse();

    await renderReady();
    fireEvent.click(screen.getByTestId("map"));
    fireEvent.click(screen.getByTestId("map"));
    fireEvent.click(screen.getByTestId("map"));
    await settle(2000);

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("says which fields it changed", async () => {
    respondReverse();

    await renderReady();
    fireEvent.click(screen.getByTestId("map"));
    await settle(1000);

    expect(
      screen.getByText(/updated from the pin: city, state and pincode/i),
    ).toBeInTheDocument();
  });

  it("keeps the coordinates when the geocoder is down", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));

    await renderReady();
    fireEvent.click(screen.getByTestId("map"));
    await settle(2000);

    // The pin is the thing being set; the address is a bonus.
    expect(lat()).toHaveValue(19.076);
    expect(cityBox()).toHaveValue("Jammu");
  });
});
