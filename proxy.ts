import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Edge middleware (Next 16 renamed `middleware` -> `proxy`). This is a fast,
// cookie-PRESENCE redirect layer for UX only — it cannot verify the httpOnly
// JWT. The real, non-forgeable gate is server-side getSession()/<role> guards in
// the route-group layouts, which call /auth/me.

// Login-required areas. EVERYTHING ELSE is public — the storefront (/, /search,
// /c/*, /p/*, ...) must be browsable without an account.
export const PROTECTED = [
  "/dashboard", // shop owner
  "/products",
  "/variants",
  "/orders",
  "/myshop",
  "/admin", // admin
  "/verify-owner",
  "/account", // customer-gated storefront
  "/cart",
  "/checkout",
  "/wishlist",
];
const ADMIN_PATHS = ["/admin", "/verify-owner"];
/**
 * Shop-owner areas an UNAPPROVED owner is bounced out of.
 *
 * Must list every top-level segment of the `(page)` route group. `/variants`
 * was missing, so an unapproved seller who typed a variant URL got the page
 * rendered: the group's layout guard does redirect, but it streams that
 * redirect in the RSC payload rather than sending a 3xx, so the shell paints
 * first. Listing it here turns that into a redirect before anything renders.
 *
 * The list is hand-kept and drifted once, which is what the sync test in
 * `proxy.test.ts` now prevents — it reads the route tree and fails when a new
 * `(page)` segment is not covered here.
 *
 * /orders is the CUSTOMER order history (login-only); shop orders live under
 * /dashboard, so it is in PROTECTED but not here.
 */
export const OWNER_GATED = ["/dashboard", "/products", "/variants", "/myshop"];

/**
 * The only pages that exist for a seller whose application is unreviewed.
 *
 * An ALLOW-list, and that is the point. `OWNER_GATED` above is a blocklist of
 * shop-owner areas, so everything it did not name stayed open — the whole
 * storefront included. A seller sitting on /status who deleted the last
 * segment landed on the customer shopfront, which is not a page they have any
 * business being on while they are waiting to be let in. Naming what IS
 * allowed means a page added anywhere else in the app is closed to them by
 * default, which is the direction that fails safe.
 *
 *  - /status      the application, under review
 *  - /onboarding  the application, still being filled in
 *  - /help        how they ask why. Kept deliberately: an applicant with a
 *                 question and nowhere to put it has only support email left,
 *                 and these pages were built for exactly this state.
 *  - /t           the ticket link an email sends them to. It renders nothing
 *                 itself — it reads who is asking and forwards, which for an
 *                 applicant is /help/:id. Leaving it out would bounce the link
 *                 to /status and lose the ticket they were sent to read.
 *
 * `/unauthorized` is deliberately NOT here. It was, until the confinement
 * moved above the admin check — an applicant who types /admin is now told
 * where they actually are instead of being shown an access-denied screen that
 * says nothing about the thing they are waiting for. Nothing else routes them
 * there, so allowing it would only be a page they could sit on.
 */
export const UNAPPROVED_OWNER_ALLOWED = [
  "/status",
  "/onboarding",
  "/help",
  "/t",
];

// Next 16 resolves a proxy file via the NAMED `proxy` export (preferred) or a
// default export; we provide the named export to match the convention exactly.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("accessToken")?.value;
  const role = request.cookies.get("userRole")?.value;
  const approval = request.cookies.get("approvalStatus")?.value;

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  const isAdminArea = ADMIN_PATHS.some((p) => pathname.startsWith(p));

  const redirect = (to: string) => {
    const url = request.nextUrl.clone();
    url.pathname = to;
    return NextResponse.redirect(url);
  };

  // 1) Unauthenticated on a PROTECTED route -> login (public routes pass through).
  if (!token && isProtected) {
    return redirect("/login");
  }

  // 2) Authenticated user on an auth entry page -> their home.
  //
  // Skipped when a server guard has marked the session stale. This layer can
  // only see that an accessToken cookie EXISTS; the guards actually verify it
  // against /auth/me. When a cookie outlives its session — the user was deleted
  // or deactivated, the token expired, the backend was unreachable — the two
  // disagree and bounce the request between them forever:
  //
  //   /account -> guard: no session -> /login -> here: cookie! -> /dashboard
  //            -> guard: no session -> /login -> ...
  //
  // The guard streams its redirect in the RSC payload rather than sending a
  // 3xx, so each hop renders first: it looks like a flickering page, not a
  // redirect-loop error. Clearing the cookies here is what actually breaks the
  // cycle — a Server Component cannot delete a cookie, middleware can.
  if (token && request.nextUrl.searchParams.has("stale")) {
    const res = NextResponse.next();
    for (const name of ["accessToken", "refreshToken", "sessionId", "userRole", "approvalStatus"]) {
      res.cookies.delete(name);
    }
    return res;
  }

  if (token && (pathname === "/login" || pathname === "/register")) {
    // Customers have no /dashboard — that is the shop-owner area, and sending
    // them there produced a second bounce off the owner guard.
    //
    // An unreviewed seller goes straight to their application rather than to
    // /dashboard, which the rule below would only bounce them off again. A
    // redirect whose destination redirects is a flash the user can see.
    const ownerHome =
      approval === "approved"
        ? "/dashboard"
        : approval === "pending"
          ? "/status"
          : "/onboarding";
    const home =
      role === "admin" ? "/admin" : role === "shop_owner" ? ownerHome : "/";
    return redirect(home);
  }

  // 2b) A seller whose application is unreviewed sees their application and
  // nothing else — not the owner area, and not the storefront either.
  //
  // Before the admin check below, so that every path funnels to one place: an
  // applicant who types /admin should be told where they actually are, not
  // handed an "access denied" screen that says nothing about their
  // application.
  //
  // The edge cannot verify any of this — `approvalStatus` is a readable cookie
  // and a determined user can edit it. This is the fast, flash-free bounce;
  // the non-forgeable one is `confineUnapprovedOwner` in the layouts.
  if (token && role === "shop_owner" && approval !== "approved") {
    const allowed = UNAPPROVED_OWNER_ALLOWED.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`),
    );
    if (!allowed) {
      return redirect(approval === "pending" ? "/status" : "/onboarding");
    }
  }

  // 3) Non-admin trying to reach the admin area.
  if (token && isAdminArea && role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/unauthorized";
    return NextResponse.rewrite(url);
  }

  // 4) An approved owner has no application to look at.
  //
  // The un-approved direction is handled at 2b. `OWNER_GATED` survives as the
  // list the sync test checks the route tree against, so a new screen in the
  // owner group still has to be declared somewhere.
  if (
    token &&
    role === "shop_owner" &&
    approval === "approved" &&
    (pathname === "/onboarding" || pathname === "/status")
  ) {
    return redirect("/dashboard");
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|jpeg|gif|webp)$).*)",
  ],
};
