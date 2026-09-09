"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export type HeroSlide = {
  src: string;
  alt: string;
  /** Where the slide goes when clicked. Omit for a slide that is just art. */
  href?: string;
};

/** The most slides the strip will show, however many it is handed. */
export const MAX_HERO_SLIDES = 15;

const AUTOPLAY_MS = 5000;

/**
 * The shopfront's opening image, or images.
 *
 * Replaces a fixed headline with a strip that moves one slide at a time. What
 * it will not do is leave the page emptier than it found it: handed no slides,
 * it renders `children` — the original hero — rather than an empty band. A
 * storefront whose first screen is a blank rounded rectangle looks broken, and
 * "there are no banners configured" is not the visitor's problem.
 *
 * Everything below the auto-advance is there because a carousel that only
 * works when you leave it alone is the usual failure:
 *
 *  - it pauses on hover, on keyboard focus, and while the tab is hidden — a
 *    background tab that keeps advancing burns a timer and lands the visitor
 *    on a slide they never saw arrive;
 *  - `prefers-reduced-motion` turns off both the movement and the timer, so it
 *    becomes a static first slide with working controls rather than a
 *    stationary thing that still changes under you;
 *  - arrows, dots, arrow keys and a swipe all drive the same `go()`, so none of
 *    them can disagree about where it is.
 */
export function HeroCarousel({
  slides,
  children,
}: {
  slides: HeroSlide[];
  children: React.ReactNode;
}) {
  // Sliced rather than trusted. Fifteen is the agreed ceiling and the dots row
  // stops being usable well before it; a caller handing over fifty should get
  // fifteen, not a broken strip.
  const items = slides.slice(0, MAX_HERO_SLIDES);
  const count = items.length;

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduced, setReduced] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const go = useCallback(
    (next: number) => {
      if (count === 0) return;
      // Wraps both ways, so the last slide's "next" is the first rather than a
      // dead arrow.
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  // Auto-advance. Re-armed on every index change rather than run on a fixed
  // interval, so pressing "next" gives you a full dwell on the slide you asked
  // for instead of whatever was left of the old tick.
  useEffect(() => {
    if (count < 2 || paused || reduced) return;
    const t = setTimeout(() => go(index + 1), AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [index, count, paused, reduced, go]);

  // A hidden tab is not being watched. Without this the strip advances behind
  // the visitor's back and they return to slide 9 of 4 rotations ago.
  useEffect(() => {
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  if (count === 0) return <>{children}</>;

  const slide = (item: HeroSlide, i: number) => {
    const img = (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.src}
        alt={item.alt}
        // The first slide is what the page opens on, so it is the one worth
        // fetching eagerly; the rest can wait until they are near.
        loading={i === 0 ? "eager" : "lazy"}
        className="size-full object-cover"
      />
    );
    return (
      <div
        key={item.src}
        className="relative w-full shrink-0"
        // Off-screen slides are not read out, and their links are not
        // reachable by tab — otherwise the keyboard walks into content nobody
        // can see.
        //
        // `inert={boolean}`, not a spread of `inert: ""`. React 19 takes
        // `inert` as a real boolean attribute; the empty string it wanted in
        // earlier versions is now read as FALSE and warned about, so the
        // clever spread both logged on every render and left the hidden
        // slides tabbable — the opposite of what it was for.
        aria-hidden={i !== index}
        inert={i !== index}
      >
        {item.href ? (
          <Link href={item.href} className="block size-full">
            {img}
          </Link>
        ) : (
          img
        )}
      </div>
    );
  };

  return (
    <section
      className="relative my-6 overflow-hidden rounded-3xl border border-border bg-card shadow-sm"
      aria-roledescription="carousel"
      aria-label="Featured"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(index + 1);
        if (e.key === "ArrowLeft") go(index - 1);
      }}
      onTouchStart={(e) => {
        touchStartX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        const from = touchStartX.current;
        touchStartX.current = null;
        if (from === null) return;
        const dx = e.changedTouches[0].clientX - from;
        // 40px so a tap with a shaky thumb is not read as a swipe.
        if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
      }}
    >
      {/* The viewport. A fixed aspect ratio rather than a height: the band
          keeps its shape from a phone to a wide desktop, and nothing below it
          jumps as the images load. */}
      <div className="aspect-[16/10] w-full overflow-hidden sm:aspect-[24/9]">
        <div
          className="flex size-full"
          style={{
            transform: `translate3d(-${index * 100}%, 0, 0)`,
            transition: reduced ? undefined : "transform 600ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {items.map(slide)}
        </div>
      </div>

      {/* Controls only exist when there is somewhere to go. One slide gets a
          plain image, not a carousel wearing arrows that do nothing. */}
      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-neutral-900 shadow-lg backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-5"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-neutral-900 shadow-lg backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-5"
          >
            <ChevronRight className="size-5" />
          </button>

          {/* The dots ride on their own scrim.
          
              They were theme-coloured — `bg-foreground/25` — which is the one
              thing that cannot work here: these sit on top of an IMAGE, and
              the image's brightness has nothing to do with the viewer's
              theme. On the cream slide in dark mode the inactive dots were
              pale-on-pale and effectively invisible. Fixed white on a
              translucent dark pill reads on every slide, light or dark, and
              the same reasoning puts the arrows on white rather than on
              `bg-card`. */}
          <div className="absolute inset-x-0 bottom-4 flex justify-center">
            <div className="flex items-center gap-2 rounded-full bg-black/35 px-3 py-2 backdrop-blur-sm">
              {items.map((item, i) => (
                <button
                  key={item.src}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  aria-current={i === index}
                  // The active one is a pill rather than a bigger circle: it
                  // reads as "you are here" at a glance and the row keeps its
                  // rhythm at fifteen.
                  className={`h-2 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                    i === index
                      ? "w-6 bg-white"
                      : "w-2 bg-white/45 hover:bg-white/75"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Announced, not shown. A sighted visitor can see the strip move;
              a screen-reader user gets told, once, where it landed. */}
          <p aria-live="polite" className="sr-only">
            {`Slide ${index + 1} of ${count}`}
          </p>
        </>
      )}
    </section>
  );
}
