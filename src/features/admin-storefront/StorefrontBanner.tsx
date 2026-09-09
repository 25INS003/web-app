"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowDown,
  ArrowUp,
  GalleryHorizontal,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/types";
import { heroApi, type HeroSlide } from "./api";

const MAX = 15;

/**
 * The images the shopfront opens with.
 *
 * A list, not a gallery: order is the whole point — these play in sequence —
 * so each row shows its position and moves with the arrows beside it. Drag and
 * drop would be prettier and worse: at fifteen rows on a phone it is the
 * interaction most likely to drop something in the wrong place with no undo.
 *
 * Every change is written immediately rather than collected behind a Save.
 * There is no half-valid state to protect — an upload either landed or it did
 * not — and a settings page with an unsaved-changes trap is how an admin
 * uploads four banners and closes the tab.
 */
export function StorefrontBanner() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  // From the server rather than written here, so the number an admin reads
  // cannot drift from the one multer enforces.
  const [maxMb, setMaxMb] = useState<number | null>(null);
  // null while nothing is uploading. A long transfer with no percentage is
  // indistinguishable from a hung one.
  const [progress, setProgress] = useState<number | null>(null);
  const [alt, setAlt] = useState("");
  const [href, setHref] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    heroApi
      .list()
      .then((d) => {
        setSlides(d.slides ?? []);
        setMaxMb(d.max_file_mb ?? null);
      })
      .catch(() => toast.error("Could not load the current banner"))
      .finally(() => setLoading(false));
  }, []);

  const save = async (next: HeroSlide[], message: string) => {
    const previous = slides;
    setSlides(next); // optimistic, so the arrows feel instant
    setBusy(true);
    try {
      const d = await heroApi.replace(next);
      setSlides(d.slides ?? next);
      toast.success(message);
    } catch (err) {
      // Put it back. A reorder that failed on the server but stuck on screen
      // is worse than one that visibly did not happen.
      setSlides(previous);
      toast.error(
        err instanceof ApiError
          ? err.message
          : "That did not save — nothing has changed",
      );
    } finally {
      setBusy(false);
    }
  };

  const onUpload = async (file: File) => {
    setBusy(true);
    setProgress(0);
    try {
      const d = await heroApi.add(file, alt, href, setProgress);
      setSlides(d.slides ?? []);
      setAlt("");
      setHref("");
      if (fileRef.current) fileRef.current.value = "";
      toast.success("Image added");
    } catch (err) {
      // `err.message`, not `err.response.data.message`.
      //
      // The api client already unwraps the envelope and rejects with an
      // `ApiError` carrying the server's own words — there is no `response` on
      // what arrives here, so the old reach for it was always undefined and
      // every failure showed the same "Upload failed". That threw away
      // messages the backend went to the trouble of writing: "That file is too
      // large. The limit is 10 MB per file.", "We cannot take a
      // video/quicktime.", and the fifteen-image ceiling.
      toast.error(
        err instanceof ApiError ? err.message : "Could not upload that image",
      );
    } finally {
      setBusy(false);
      setProgress(null);
    }
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= slides.length) return;
    const next = [...slides];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    void save(next, "Order updated");
  };

  const remove = (i: number) =>
    void save(
      slides.filter((_, n) => n !== i),
      "Image removed",
    );

  const full = slides.length >= MAX;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">
          Storefront banner
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The images the shop front opens with. They play in order, one at a
          time.{" "}
          {/* Said plainly rather than left to be discovered by an admin who
              deletes the last one and panics. */}
          With none here, the storefront shows its written headline instead.
        </p>
      </div>

      {/* Add */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
        <h2 className="font-semibold">Add an image</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Wide images work best — around 1440 × 540
          {maxMb ? `, up to ${maxMb} MB` : ""}. {slides.length} of {MAX} used.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="hero-alt" className="text-xs font-medium">
              Description
            </label>
            <Input
              id="hero-alt"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="e.g. Free delivery over ₹199"
              className="mt-1"
            />
            {/* Not decoration: this is what a screen reader announces in place
                of the banner, and what shows if the image fails to load. */}
            <p className="mt-1 text-xs text-muted-foreground">
              Read aloud in place of the image, and shown if it fails to load.
            </p>
          </div>
          <div>
            <label htmlFor="hero-href" className="text-xs font-medium">
              Link <span className="text-muted-foreground">(optional)</span>
            </label>
            <Input
              id="hero-href"
              value={href}
              onChange={(e) => setHref(e.target.value)}
              placeholder="/search"
              className="mt-1"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Where the image goes when tapped. Leave blank for a plain banner.
            </p>
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void onUpload(file);
          }}
        />
        <Button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy || full}
          className="mt-4 rounded-xl"
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          {progress === null
            ? "Choose image"
            : progress < 100
              ? `Uploading ${progress}%`
              : "Processing…"}
        </Button>

        {/* A bar as well as the number. At 100% the bytes are sent and the
            bucket is still encoding, which is why the label changes rather
            than sitting on "Uploading 100%". */}
        {progress !== null && (
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        {full && (
          <p className="mt-2 text-xs text-warning">
            That is the {MAX}-image limit. Remove one to add another.
          </p>
        )}
      </div>

      {/* The strip */}
      {loading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Loading…
        </p>
      ) : slides.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-14 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">
            <GalleryHorizontal className="size-6" />
          </span>
          <p className="text-sm font-medium">No banner images yet</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            The storefront is showing its written headline. Add an image above
            and it takes over.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {slides.map((s, i) => (
            <li
              key={`${s.url}-${i}`}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-3 shadow-xs"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-muted text-xs font-semibold tabular-nums">
                {i + 1}
              </span>
              <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-xl bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={s.url}
                  alt={s.alt || `Banner ${i + 1}`}
                  className="size-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {s.alt || (
                    <span className="text-muted-foreground">No description</span>
                  )}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {s.href || "No link"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`Move image ${i + 1} up`}
                  disabled={busy || i === 0}
                  onClick={() => move(i, i - 1)}
                  className="px-2"
                >
                  <ArrowUp className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`Move image ${i + 1} down`}
                  disabled={busy || i === slides.length - 1}
                  onClick={() => move(i, i + 1)}
                  className="px-2"
                >
                  <ArrowDown className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`Remove image ${i + 1}`}
                  disabled={busy}
                  onClick={() => remove(i)}
                  className="px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
