import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The admin's banner list.
 *
 * Editing matters because the two fields somebody gets wrong are exactly the
 * two that were previously write-once: the description — which is what a
 * screen reader announces in place of the image, and what shows when it fails
 * to load — and the link. Fixing a typo meant removing the image and uploading
 * it again.
 */

const list = vi.fn();
const replace = vi.fn();
const add = vi.fn();

vi.mock("./api", () => ({
  heroApi: {
    list: (...a: unknown[]) => list(...a),
    replace: (...a: unknown[]) => replace(...a),
    add: (...a: unknown[]) => add(...a),
  },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const { StorefrontBanner } = await import("./StorefrontBanner");

const SLIDES = [
  { url: "/media/a.jpg", alt: "First banner", href: "/search" },
  { url: "/media/b.jpg", alt: "", href: null },
];

const show = async () => {
  render(<StorefrontBanner />);
  // The list arrives from a promise; without this the rows are not there yet.
  await screen.findByText("First banner");
};

beforeEach(() => {
  vi.clearAllMocks();
  list.mockResolvedValue({ slides: SLIDES, max: 15, max_file_mb: 10 });
  replace.mockImplementation(async (slides) => ({ slides }));
});

describe("editing a banner's details", () => {
  it("opens the row for editing", async () => {
    await show();

    fireEvent.click(screen.getByRole("button", { name: /edit image 1/i }));

    expect(screen.getByLabelText(/description for image 1/i)).toHaveValue(
      "First banner",
    );
    expect(screen.getByLabelText(/link for image 1/i)).toHaveValue("/search");
  });

  it("saves the new description and link", async () => {
    await show();
    fireEvent.click(screen.getByRole("button", { name: /edit image 1/i }));

    fireEvent.change(screen.getByLabelText(/description for image 1/i), {
      target: { value: "Diwali offers" },
    });
    fireEvent.change(screen.getByLabelText(/link for image 1/i), {
      target: { value: "/c/offers" },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    });

    await waitFor(() => expect(replace).toHaveBeenCalled());
    const sent = replace.mock.calls.at(-1)![0];
    expect(sent[0]).toMatchObject({
      url: "/media/a.jpg",
      alt: "Diwali offers",
      href: "/c/offers",
    });
    // The row it did not touch travels unchanged — this endpoint replaces the
    // whole list, so an edit that dropped a sibling would delete it.
    expect(sent[1]).toMatchObject({ url: "/media/b.jpg" });
  });

  it("turns a cleared link back into null, not an empty string", async () => {
    await show();
    fireEvent.click(screen.getByRole("button", { name: /edit image 1/i }));

    fireEvent.change(screen.getByLabelText(/link for image 1/i), {
      target: { value: "   " },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    });

    // `null` is "no link"; "" is a link to nowhere.
    expect(replace.mock.calls.at(-1)![0][0].href).toBeNull();
  });

  it("abandons the draft on Cancel", async () => {
    await show();
    fireEvent.click(screen.getByRole("button", { name: /edit image 1/i }));
    fireEvent.change(screen.getByLabelText(/description for image 1/i), {
      target: { value: "Typed by mistake" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^cancel$/i }));

    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByText("First banner")).toBeInTheDocument();
  });

  it("lets a description be added to one that has none", async () => {
    await show();
    fireEvent.click(screen.getByRole("button", { name: /edit image 2/i }));

    expect(screen.getByLabelText(/description for image 2/i)).toHaveValue("");
    fireEvent.change(screen.getByLabelText(/description for image 2/i), {
      target: { value: "Free delivery" },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    });

    expect(replace.mock.calls.at(-1)![0][1].alt).toBe("Free delivery");
  });

  it("closes the editor when the row is moved", async () => {
    await show();
    fireEvent.click(screen.getByRole("button", { name: /edit image 2/i }));

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /move image 2 up/i }));
    });

    // Otherwise a half-typed draft hangs over a row that is no longer the one
    // being edited.
    expect(
      screen.queryByLabelText(/description for image 2/i),
    ).not.toBeInTheDocument();
  });

  it("puts the list back when the save fails", async () => {
    replace.mockRejectedValueOnce(new Error("nope"));
    await show();
    fireEvent.click(screen.getByRole("button", { name: /edit image 1/i }));
    fireEvent.change(screen.getByLabelText(/description for image 1/i), {
      target: { value: "Will not stick" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /^save$/i }));
    });

    // An edit that failed on the server but stuck on screen is worse than one
    // that visibly did not happen.
    await waitFor(() =>
      expect(screen.getByText("First banner")).toBeInTheDocument(),
    );
    expect(screen.queryByText("Will not stick")).not.toBeInTheDocument();
  });
});

/**
 * The description is required.
 *
 * Enforced on the server too — this is the half that stops somebody choosing a
 * file, waiting for a 9 MB upload and then being told no.
 */
describe("requiring a description", () => {
  const chooseButton = () =>
    screen.getByRole("button", { name: /choose image/i });

  it("will not let an upload start without one", async () => {
    await show();

    expect(chooseButton()).toBeDisabled();
    expect(screen.getByText(/add a description to enable/i)).toBeInTheDocument();
  });

  it("enables the upload once there is one", async () => {
    await show();

    fireEvent.change(screen.getByLabelText(/^description/i), {
      target: { value: "Diwali offers" },
    });

    expect(chooseButton()).toBeEnabled();
  });

  it("does not count whitespace as a description", async () => {
    await show();

    fireEvent.change(screen.getByLabelText(/^description/i), {
      target: { value: "   " },
    });

    expect(chooseButton()).toBeDisabled();
  });

  it("will not let an existing description be cleared", async () => {
    await show();
    fireEvent.click(screen.getByRole("button", { name: /edit image 1/i }));

    fireEvent.change(screen.getByLabelText(/description for image 1/i), {
      target: { value: "" },
    });

    expect(screen.getByRole("button", { name: /^save$/i })).toBeDisabled();
    expect(replace).not.toHaveBeenCalled();
  });

  it("flags a banner stored before the rule existed", async () => {
    await show();

    // The second fixture slide has none. Marked as something to do rather than
    // left as grey filler.
    expect(screen.getByText(/needs a description/i)).toBeInTheDocument();
  });
});
