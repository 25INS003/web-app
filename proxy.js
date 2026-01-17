// proxy.js
import { NextResponse } from "next/server";

const publicPaths = [
  "/login", 
  "/register", 
  "/forgot-password", 
  "/verify-otp",
  "/reset-password",
  "/unauthorized", 
];

const adminPaths = ["/admin","/verify-owner"]; 

export function proxy(request) {
  const { pathname } = request.nextUrl;
  
  const token = request.cookies.get("accessToken")?.value;
  const userRole = request.cookies.get("userRole")?.value;

  // 1. Check Public Paths
  // We check if the path IS exactly "/" OR starts with one of the public paths
  const isPublicPath = pathname === "/" || publicPaths.some((path) => 
      pathname.startsWith(path)
  );

  const isAdminPath = adminPaths.some((path) => 
      pathname.startsWith(path)
  );

  console.log(`Checking: ${pathname} | Token: ${token ? "YES" : "NO"} | Public? ${isPublicPath} | Role: ${userRole || "NONE"}`);

  // 2. PROTECT ROUTES
  // If no token, and it's NOT a public path, Redirect to login
  if (!token && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    // loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 3. AUTH PAGE REDIRECT (If already logged in)
  if (token && (pathname === "/login" || pathname === "/register")) {
    if (userRole === "admin") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 4. ADMIN ROLE CHECK
  if (token && isAdminPath && userRole !== "admin") {
     return NextResponse.rewrite(new URL("/unauthorized", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)",
  ],
};