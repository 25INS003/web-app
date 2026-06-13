import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Edge middleware (Next 16 renamed `middleware` -> `proxy`). This is a fast,
// cookie-PRESENCE redirect layer for UX only — it cannot verify the httpOnly
// JWT. The real, non-forgeable gate is server-side getSession()/<role> guards in
// the route-group layouts, which call /auth/me.

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/verify-otp",
  "/reset-password",
  "/unauthorized",
  "/admin/login",
];
const ADMIN_PATHS = ["/admin", "/verify-owner"];
const OWNER_GATED = ["/dashboard", "/products", "/orders", "/myshop"];

// Next 16 resolves a proxy file via the NAMED `proxy` export (preferred) or a
// default export; we provide the named export to match the convention exactly.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("accessToken")?.value;
  const role = request.cookies.get("userRole")?.value;
  const approval = request.cookies.get("approvalStatus")?.value;

  const isPublic =
    pathname === "/" || PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isAdminArea = ADMIN_PATHS.some((p) => pathname.startsWith(p));

  const redirect = (to: string) => {
    const url = request.nextUrl.clone();
    url.pathname = to;
    return NextResponse.redirect(url);
  };

  // 1) Unauthenticated on a protected route.
  if (!token && !isPublic) {
    return redirect(isAdminArea ? "/admin/login" : "/login");
  }

  // 2) Authenticated user on an auth entry page -> their home.
  if (token && (pathname === "/login" || pathname === "/register")) {
    return redirect(role === "admin" ? "/admin" : "/dashboard");
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
