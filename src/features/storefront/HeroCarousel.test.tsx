import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HeroCarousel, MAX_HERO_SLIDES } from "./HeroCarousel";

/**
 * The shopfront's opening strip.
 *
 * Two behaviours carry the weight. It must never leave the page emptier than
 * it found it — handed nothing, it renders the hero it replaced rather than a
 * blank band — and it must stop moving when nobody is watching, because a
 * carousel that only behaves while you leave it alone is the usual failure.
 */

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const slide = (n: number) => ({
  src: `/hero/${n}.svg`,
  alt: `Slide ${n}`,
  href: "/search",
});

const many = (n: number) => Array.from({ length: n }, (_, i) => slide(i + 1));

const Fallback = () => <h1>Fresh groceries, from the shops next door.</h1>;

const show = (count: number) =>
  render(
    <HeroCarousel slides={many(count)}>
      <Fallback />
    </HeroCarousel>,
  );

beforeEach(() => {
  vi.stubGlobal("matchMedia", (q: string) => ({
    matches: false,
    media: q,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("with no images", () => {
  it("shows what was there before, not an empty band", () => {
    render(
      <HeroCarousel slides={[]}>
        <Fallback />
      </HeroCarousel>,
    );

    expect(screen.getByRole("heading", { name: /fresh groceries/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /next slide/i })).not.toBeInTheDocument();
  });
});

describe("with images", () => {
  it("replaces the headline hero", () => {
    show(3);

    expect(screen.queryByRole("heading", { name: /fresh groceries/i })).not.toBeInTheDocument();
    // `hidden: true` because the off-screen slides are aria-hidden on
    // purpose — the default query would only ever find the active one.
    expect(screen.getAllByRole("img", { hidden: true })).toHaveLength(3);
  });

  it("caps at fifteen however many it is handed", () => {
    show(40);

    // Sliced rather than trusted — the dots row stops being usable long
    // before forty.
    expect(screen.getAllByRole("img", { hidden: true })).toHaveLength(MAX_HERO_SLIDES);
  });

  it("offers no controls for a single image", () => {
    show(1);

    // One slide is a picture, not a carousel wearing arrows that do nothing.
    expect(screen.queryByRole("button", { name: /next slide/i })).not.toBeInTheDocument();
    expect(screen.getAllByRole("img", { hidden: true })).toHaveLength(1);
  });

  it("moves one slide at a time", () => {
    show(3);
    const track = screen.getAllByRole("img", { hidden: true })[0].closest("div")!.parentElement!;

    expect(track).toHaveStyle({ transform: "translate3d(-0%, 0, 0)" });
    fireEvent.click(screen.getByRole("button", { name: /next slide/i }));
    expect(track).toHaveStyle({ transform: "translate3d(-100%, 0, 0)" });
  });

  it("wraps rather than dead-ending", () => {
    show(2);
    const track = screen.getAllByRole("img", { hidden: true })[0].closest("div")!.parentElement!;

    // Back from the first goes to the last, so neither arrow is ever inert.
    fireEvent.click(screen.getByRole("button", { name: /previous slide/i }));
    expect(track).toHaveStyle({ transform: "translate3d(-100%, 0, 0)" });
  });

  it("says where it is, for a screen reader", () => {
    show(4);

    expect(screen.getByText("Slide 1 of 4")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /next slide/i }));
    expect(screen.getByText("Slide 2 of 4")).toBeInTheDocument();
  });

  it("marks the dot you are on", () => {
    show(3);

    const dots = screen.getAllByRole("button", { name: /go to slide/i });
    expect(dots[0]).toHaveAttribute("aria-current", "true");
    fireEvent.click(dots[2]);
    expect(dots[2]).toHaveAttribute("aria-current", "true");
  });

  it("hides the slides that are off screen, and makes them inert", () => {
    show(3);

    // Otherwise the keyboard tabs into links nobody can see.
    const panes = screen
      .getAllByRole("img", { hidden: true })
      .map((i) => i.closest("[aria-hidden]") as HTMLElement);

    expect(panes[0]).toHaveAttribute("aria-hidden", "false");
    expect(panes[1]).toHaveAttribute("aria-hidden", "true");

    // `inert` as a real boolean, not the empty string React 19 reads as
    // FALSE — that spelling both warned on every render and left the hidden
    // slides tabbable, which is the opposite of the point. Asserted on the
    // attribute: jsdom does not implement the `inert` IDL property, so
    // `element.inert` is undefined there whatever the markup says.
    expect(panes[0].hasAttribute("inert")).toBe(false);
    expect(panes[1].hasAttribute("inert")).toBe(true);
  });

  it("advances on its own", async () => {
    vi.useFakeTimers();
    show(3);
    const track = screen.getAllByRole("img", { hidden: true })[0].closest("div")!.parentElement!;

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5100);
    });

    expect(track).toHaveStyle({ transform: "translate3d(-100%, 0, 0)" });
  });

  it("stops while the pointer is on it", async () => {
    vi.useFakeTimers();
    show(3);
    const region = screen.getByRole("region");
    const track = screen.getAllByRole("img", { hidden: true })[0].closest("div")!.parentElement!;

    fireEvent.mouseEnter(region);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(12000);
    });

    // Reading a slide should not be a race against the timer.
    expect(track).toHaveStyle({ transform: "translate3d(-0%, 0, 0)" });
  });

  it("stops while the tab is hidden", async () => {
    vi.useFakeTimers();
    show(3);
    const track = screen.getAllByRole("img", { hidden: true })[0].closest("div")!.parentElement!;

    Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
    fireEvent(document, new Event("visibilitychange"));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(12000);
    });
    Object.defineProperty(document, "hidden", { configurable: true, get: () => false });

    // A background tab that keeps advancing burns a timer and lands the
    // visitor on a slide they never saw arrive.
    expect(track).toHaveStyle({ transform: "translate3d(-0%, 0, 0)" });
  });

  it("holds still when motion is not wanted", async () => {
    vi.stubGlobal("matchMedia", (q: string) => ({
      matches: true,
      media: q,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    vi.useFakeTimers();
    show(3);
    const track = screen.getAllByRole("img", { hidden: true })[0].closest("div")!.parentElement!;

    await act(async () => {
      await vi.advanceTimersByTimeAsync(20000);
    });

    // Reduced motion turns off the timer too — a stationary carousel that
    // still changes under you is the worse half of the problem.
    expect(track).toHaveStyle({ transform: "translate3d(-0%, 0, 0)" });
    // The controls still work, so it is navigable rather than frozen.
    fireEvent.click(screen.getByRole("button", { name: /next slide/i }));
    expect(track).toHaveStyle({ transform: "translate3d(-100%, 0, 0)" });
  });
});
