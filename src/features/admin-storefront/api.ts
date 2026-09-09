import { api } from "@/lib/api/client";

export type HeroSlide = {
  url: string;
  alt: string;
  href?: string | null;
};

type SlidesPayload = { slides: HeroSlide[]; max?: number };

export const heroApi = {
  list: () => api.get<SlidesPayload>("/admin/settings/hero"),

  /**
   * One file per call, as multipart — the same shape every other image upload
   * in this app uses, so it goes through the bucket the way product and
   * category images do.
   */
  add: (file: File, alt: string, href: string) => {
    const body = new FormData();
    body.append("image", file);
    body.append("alt", alt);
    body.append("href", href);
    return api.post<SlidesPayload>("/admin/settings/hero", body);
  },

  /**
   * The whole ordered list. Reordering and removing are both "here is what it
   * should be now", so they are one endpoint and one request that cannot
   * half-apply.
   */
  replace: (slides: HeroSlide[]) =>
    api.put<SlidesPayload>("/admin/settings/hero", { slides }),
};
