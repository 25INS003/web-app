"use client";

import { useEffect, useState } from "react";
import { smallVariant } from "@/lib/media";

type Props = Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string | null | undefined;
};

/**
 * A drop-in `<img>` that loads fast on bucket-hosted images.
 *
 * For a bucket URL it paints the small `?size=small` preview immediately, then
 * downloads the full image in the background and swaps it in — a *sharpen*, not
 * a blur-up, because the preview is already a real (if soft) JPEG. A faint blur
 * on the preview clears as the full image arrives, so the transition reads as
 * the picture coming into focus rather than a hard flip.
 *
 * For any other URL (external seed hosts, or no preview available) it behaves
 * exactly like a plain `<img>` pointed at the full src — no extra request.
 *
 * State is derived from `src` during render, so the server-rendered and first
 * client render agree (no hydration mismatch); the only `setState` runs inside
 * the background loader's callbacks, on the client.
 */
export function ProgressiveImage({
  src,
  alt = "",
  style,
  loading = "lazy",
  decoding = "async",
  ...rest
}: Props) {
  const preview = smallVariant(src);
  const full = src ?? undefined;

  const [fullReady, setFullReady] = useState(false);
  const [fullFailed, setFullFailed] = useState(false);

  // Reset the upgrade state when the source changes, without an effect — the
  // "adjust state during render" pattern React endorses for deriving state
  // from props. A gallery swapping images, or a list row reusing this
  // component, starts over on the new preview.
  const [prevSrc, setPrevSrc] = useState(src);
  if (src !== prevSrc) {
    setPrevSrc(src);
    setFullReady(false);
    setFullFailed(false);
  }

  useEffect(() => {
    // Nothing to upgrade: no preview to replace, or no full image at all.
    if (!preview || !full) return;

    let cancelled = false;
    const loader = new window.Image();
    loader.onload = () => {
      if (!cancelled) setFullReady(true);
    };
    // If the full image fails, keep the preview on screen but stop blurring it.
    loader.onerror = () => {
      if (!cancelled) setFullFailed(true);
    };
    loader.src = full;

    return () => {
      cancelled = true;
      loader.onload = null;
      loader.onerror = null;
    };
  }, [preview, full]);

  const shown = fullReady && full ? full : preview ?? full;
  if (!shown) return null;

  // Blur only while a real preview is standing in for a not-yet-loaded full.
  const blurred = Boolean(preview) && !fullReady && !fullFailed;

  return (
    // eslint-disable-next-line @next/next/no-img-element -- progressive bucket loader; image hosts vary and next/image is unoptimized in this app
    <img
      src={shown}
      alt={alt}
      loading={loading}
      decoding={decoding}
      style={{
        filter: blurred ? "blur(2px)" : undefined,
        // Inline `transition` overrides any class-based one, so it must also
        // cover `transform` — otherwise a caller's hover-scale (e.g. the
        // product card) would jump instead of animate.
        transition: "filter 300ms ease-out, transform 300ms ease-out",
        // Caller styles win if provided.
        ...style,
      }}
      {...rest}
    />
  );
}
