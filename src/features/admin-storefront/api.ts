import { api } from "@/lib/api/client";

export type HeroSlide = {
  url: string;
  alt: string;
  href?: string | null;
};

type SlidesPayload = {
  slides: HeroSlide[];
  max?: number;
  /** The upload size ceiling, in MB, as the server actually enforces it. */
  max_file_mb?: number;
};

export const heroApi = {
  list: () => api.get<SlidesPayload>("/admin/settings/hero"),

  /**
   * One file per call, as multipart — the same shape every other image upload
   * in this app uses, so it goes through the bucket the way product and
   * category images do.
   *
   * `api.upload`, not `api.post`. The client-wide 20s timeout is right for an
   * API call and wrong for a transfer: a 9 MB banner on a slow uplink is a
   * perfectly healthy 40-second upload, and `post` was aborting it at 20
   * seconds mid-transfer with the bytes already partly sent. That helper
   * exists for exactly this and reports progress, which is the other half of
   * it — without a percentage a long upload is indistinguishable from a hung
   * one.
   */
  add: (
    file: File,
    alt: string,
    href: string,
    onProgress?: (percent: number) => void,
  ) => {
    const body = new FormData();
    body.append("image", file);
    body.append("alt", alt);
    body.append("href", href);
    return api.upload<SlidesPayload>("/admin/settings/hero", body, onProgress);
  },

  /**
   * The whole ordered list. Reordering and removing are both "here is what it
   * should be now", so they are one endpoint and one request that cannot
   * half-apply.
   */
  replace: (slides: HeroSlide[]) =>
    api.put<SlidesPayload>("/admin/settings/hero", { slides }),
};
