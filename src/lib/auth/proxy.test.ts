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

  // The reported bug, exactly: sitting on /status and deleting the segment.
  it("keeps them off the storefront, not just off the owner area", () => {
    // The old rule was a blocklist of owner paths, so everything it did not
    // name — the whole customer shopfront — stayed open to an applicant.
    for (const path of [
      "/",
      "/search",
      "/p/some-product",
      "/c/some-category",
      "/cart",
      "/checkout",
      "/account",
      "/orders",
      "/wishlist",
      "/notifications",
      "/support",
    ]) {
      const res = proxy(req(`http://localhost${path}`, UNAPPROVED));
      expect(
        res.headers.get("location") ?? "(not redirected)",
        `${path} should send an applicant back to their application`,
      ).toMatch(/\/status/);
    }
  });

  it("sends a draft applicant to onboarding rather than to status", () => {
    const draft = "accessToken=live.jwt; userRole=shop_owner; approvalStatus=draft";
    const res = proxy(req("http://localhost/", draft));
    expect(res.headers.get("location")).toMatch(/\/onboarding/);
  });

  it("sends them to their application from /login in one hop", () => {
    // Not via /dashboard, which the confinement rule would only bounce off
    // again — a redirect whose destination redirects is a visible flash.
    const res = proxy(req("http://localhost/login", UNAPPROVED));
    expect(res.headers.get("location")).toMatch(/\/status/);
  });

  // The support page is the one place they can be, so it is the place they
  // would try to leave from. These are the ways a URL bar lets you try.
  it("cannot be escaped from by dressing a path up as /help", () => {
    for (const path of [
      "/helpdesk", // prefix, not a segment
      "/help-me",
      "/helpers/dashboard",
      "/status-page", // same trick on the other allowed path
      "/onboarding-x",
    ]) {
      const res = proxy(req(`http://localhost${path}`, UNAPPROVED));
      expect(
        res.headers.get("location") ?? "(not redirected)",
        `${path} must not pass as an allowed page`,
      ).toMatch(/\/status/);
    }
  });

  it("allows the real sub-paths of the pages they do have", () => {
    // A ticket they opened, and the form to open one.
    for (const path of ["/help/some-ticket-id", "/help/new", "/t/some-ticket"]) {
      const res = proxy(req(`http://localhost${path}`, UNAPPROVED));
      expect(res.headers.get("location"), `${path} should be reachable`).toBeNull();
    }
  });

  it("does not leave /unauthorized as a page they can sit on", () => {
    const res = proxy(req("http://localhost/unauthorized", UNAPPROVED));
    expect(res.headers.get("location")).toMatch(/\/status/);
  });

  it("tells an applicant who types /admin where they actually are", () => {
    // Rather than an access-denied screen that says nothing about the thing
    // they are actually waiting for.
    const res = proxy(req("http://localhost/admin", UNAPPROVED));
    expect(res.headers.get("location")).toMatch(/\/status/);
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

  it("leaves the storefront public for everyone who is not an applicant", () => {
    // The confinement must not turn the shop into a login wall. A signed-out
    // visitor and a customer both keep browsing.
    const customer =
      "accessToken=live.jwt; userRole=customer; approvalStatus=";
    for (const cookie of [undefined, customer]) {
      for (const path of ["/", "/search", "/p/x"]) {
        const res = proxy(req(`http://localhost${path}`, cookie));
        expect(
          res.headers.get("location"),
          `${path} should stay public`,
        ).toBeNull();
      }
    }
  });
});
