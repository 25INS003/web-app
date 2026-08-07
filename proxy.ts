import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Edge middleware (Next 16 renamed `middleware` -> `proxy`). This is a fast,
// cookie-PRESENCE redirect layer for UX only — it cannot verify the httpOnly
// JWT. The real, non-forgeable gate is server-side getSession()/<role> guards in
// the route-group layouts, which call /auth/me.

// Login-required areas. EVERYTHING ELSE is public — the storefront (/, /search,
// /c/*, /p/*, ...) must be browsable without an account.
const PROTECTED = [
  "/dashboard", // shop owner
  "/products",
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
// /orders is the CUSTOMER order history (login-only); shop orders live under
// /dashboard, so it's covered here without listing /orders.
const OWNER_GATED = ["/dashboard", "/products", "/myshop"];

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
    const home =
      role === "admin" ? "/admin" : role === "shop_owner" ? "/dashboard" : "/";
    return redirect(home);
  }

  // 3) Non-admin trying to reach the admin area.
  if (token && isAdminArea && role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/unauthorized";
    return NextResponse.rewrite(url);
  }

  // 4) Shop-owner approval gating (hint only).
  if (token && role === "shop_owner") {
    const gated = OWNER_GATED.some((p) => pathname.startsWith(p));
    if (approval !== "approved" && gated) {
      return redirect(approval === "pending" ? "/status" : "/onboarding");
    }
    if (
      approval === "approved" &&
      (pathname === "/onboarding" || pathname === "/status")
    ) {
      return redirect("/dashboard");
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|svg|jpg|jpeg|gif|webp)$).*)",
  ],
};
