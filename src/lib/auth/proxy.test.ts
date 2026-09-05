import { readdirSync } from "node:fs";
import { join } from "node:path";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "../../../proxy";

// Regression cover for the /dashboard <-> /login reload loop.
//
// proxy.ts redirects on whether an accessToken cookie is PRESENT; the server
// guards reject it unless it is VALID. A present-but-dead token (expired, or
// signed for a user a reseed deleted) put them in permanent disagreement: the
// guard sent /dashboard -> /login, proxy sent /login -> /dashboard, and the
// browser reloaded forever with /login unreachable.

const req = (url: string, cookie?: string) =>
  new NextRequest(new URL(url), cookie ? { headers: { cookie } } : undefined);

// What a browser still holds after the backend has disowned the token.
const DEAD = "accessToken=dead.jwt; userRole=shop_owner; approvalStatus=approved";

const setCookie = (res: Response) => res.headers.get("set-cookie") ?? "";
const cleared = (res: Response, name: string) =>
  new RegExp(`${name}=;`).test(setCookie(res));

describe("proxy — stale session marker", () => {
  it("lets /login render instead of bouncing back to /dashboard", () => {
    const res = proxy(req("http://localhost/login?stale=1", DEAD));
    // The loop was this redirect firing on a dead token.
    expect(res.headers.get("location")).toBeNull();
  });

  it("clears the dead cookies so the next request starts honest", () => {
    const res = proxy(req("http://localhost/login?stale=1", DEAD));
    for (const name of ["accessToken", "refreshToken", "userRole", "approvalStatus", "sessionId"]) {
      expect(cleared(res, name), `${name} should be cleared`).toBe(true);
    }
  });

  // The marker is honoured on any path, not just /login — the guards attach it
  // wherever the real check failed, and the cookies are equally dead there.
  it("honours the marker on other guard destinations too", () => {
    const res = proxy(req("http://localhost/status?stale=1", DEAD));
    expect(res.headers.get("location")).toBeNull();
    expect(cleared(res, "accessToken")).toBe(true);
  });
});

describe("proxy — unchanged behaviour", () => {
  it("still bounces a signed-in user off /login when unmarked", () => {
    const res = proxy(req("http://localhost/login", DEAD));
    expect(res.headers.get("location")).toMatch(/\/dashboard$/);
  });

  it("still sends an unauthenticated visitor to /login", () => {
    const res = proxy(req("http://localhost/dashboard"));
    expect(res.headers.get("location")).toMatch(/\/login/);
  });

  it("does not let the marker bypass the check on a protected route", () => {
    // A blanket `?stale=1` escape would make every guard opt-out-able.
    const res = proxy(req("http://localhost/dashboard?stale=1"));
    expect(res.headers.get("location")).toMatch(/\/login/);
  });

  it("leaves the public storefront alone", () => {
    expect(proxy(req("http://localhost/")).headers.get("location")).toBeNull();
    expect(proxy(req("http://localhost/search")).headers.get("location")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// An unapproved seller, typing URLs.
//
// Registering makes someone a `shop_owner` immediately, and they stay one while
// an admin has not looked at them yet — so the role cookie says nothing about
// entitlement. The `(page)` layout does guard the whole group, but it streams
// its redirect in the RSC payload rather than sending a 3xx, so the shell
// paints before the redirect lands. The edge list is what turns that into a
// clean bounce, and `/variants` was missing from it.

const UNAPPROVED =
  "accessToken=live.jwt; userRole=shop_owner; approvalStatus=pending";

/** Every top-level URL segment of the shop-owner route group. */
const pageSegments = () =>
  readdirSync(join(process.cwd(), "app", "(page)"), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    // Route groups and private folders are not URL segments.
    .filter((e) => !e.name.startsWith("(") && !e.name.startsWith("_"))
    .map((e) => `/${e.name}`);

describe("proxy — an unapproved shop owner", () => {
  it("is bounced off every screen in the owner area", () => {
    // Read from the route tree rather than restated here: the lists in proxy.ts
    // are hand-kept, nothing connected them to the directory, and that is
    // precisely how /variants came to be ungated. A test that listed the
    // segments itself would be a third copy to forget.
    // `?? "(not redirected)"` so a missing gate reads as the sentence it is,
    // rather than as ".toMatch() expects a string, but got object".
    for (const segment of pageSegments()) {
      const res = proxy(req(`http://localhost${segment}`, UNAPPROVED));
      expect(
        res.headers.get("location") ?? "(not redirected)",
        `${segment} is not gated against an unapproved owner`,
      ).toMatch(/\/status|\/onboarding/);
    }
  });

  it("bounces the deep URLs too, not only the segment root", () => {
    const res = proxy(
      req("http://localhost/variants/abc/edit/def", UNAPPROVED),
    );
    expect(res.headers.get("location") ?? "(not redirected)").toMatch(
      /\/status/,
    );
  });

  it("still lets them reach onboarding, status and help", () => {
    // The only things they may do: submit the application, watch it, ask why.
    for (const open of ["/onboarding", "/status", "/help"]) {
      const res = proxy(req(`http://localhost${open}`, UNAPPROVED));
      expect(res.headers.get("location"), `${open} should be reachable`).toBeNull();
    }
  });

  it("lets an approved owner through the same URLs", () => {
    const approved =
      "accessToken=live.jwt; userRole=shop_owner; approvalStatus=approved";
    for (const segment of pageSegments()) {
      const res = proxy(req(`http://localhost${segment}`, approved));
      expect(
        res.headers.get("location"),
        `${segment} should be open to an approved owner`,
      ).toBeNull();
    }
  });
});
