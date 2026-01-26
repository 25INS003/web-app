import { NextResponse } from "next/server";

const publicPaths = [
  "/login", 
  "/register", 
  "/forgot-password", 
  "/verify-otp",
  "/reset-password",
  "/unauthorized", 
  "/admin/login",
];

const adminPaths = ["/admin", "/verify-owner"]; 

export default function middleware(request) {
  const { pathname } = request.nextUrl;
  
  const token = request.cookies.get("accessToken")?.value;
  const userRole = request.cookies.get("userRole")?.value;
  const approvalStatus = request.cookies.get("approvalStatus")?.value;

  console.log(`[Middleware] Checking: ${pathname}`);
  console.log(`[Middleware] Cookies - Token: ${token ? "YES" : "NO"} | Role: ${userRole || "NONE"} | Approval: ${approvalStatus || "NONE"}`);
  const isPublicPath = pathname === "/" || publicPaths.some((path) => 
      pathname.startsWith(path)
  );

  const isAdminPath = adminPaths.some((path) => 
      pathname.startsWith(path)
  );

  // 1. NO TOKEN REDIRECT
  if (!token && !isPublicPath) {
    if (isAdminPath) {
        return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. AUTH PAGE REDIRECT (If already logged in)
  if (token && (pathname === "/login" || pathname === "/register")) {
    if (userRole === "admin") {
        return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 3. ADMIN ROLE CHECK
  if (token && isAdminPath && userRole !== "admin") {
     return NextResponse.rewrite(new URL("/unauthorized", request.url));
  }

  // 4. SHOP OWNER APPROVAL CHECK
  if (token && userRole === "shop_owner") {
      const allowedUnapprovedPaths = ["/onboarding", "/status", "/login"];
      const isRestrictedPath = !allowedUnapprovedPaths.some(p => pathname.startsWith(p));
      
      // If NOT approved and trying to access restricted areas (dashboard, products, etc.)
      const isDashboardRelated = pathname.startsWith("/dashboard") || 
                               pathname.startsWith("/products") || 
                               pathname.startsWith("/orders") || 
                               pathname.startsWith("/myshop");

      if (approvalStatus !== "approved" && isDashboardRelated) {
           if (approvalStatus === "pending") {
              return NextResponse.redirect(new URL("/status", request.url));
           } else {
              // draft, rejected, or unknown -> onboarding
              return NextResponse.redirect(new URL("/onboarding", request.url));
           }
      }
      
      // Prevent approved users from going back to onboarding/status
      if (approvalStatus === "approved" && (pathname === "/onboarding" || pathname === "/status")) {
           return NextResponse.redirect(new URL("/dashboard", request.url));
      }
      
      // Prevent pending users from going to onboarding (force status page)
      if (approvalStatus === "pending" && pathname === "/onboarding") {
           return NextResponse.redirect(new URL("/status", request.url));
      }

      // Prevent draft users from going to status (force onboarding page)
      if (approvalStatus === "draft" && pathname === "/status") {
           return NextResponse.redirect(new URL("/onboarding", request.url));
      }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)",
  ],
};
