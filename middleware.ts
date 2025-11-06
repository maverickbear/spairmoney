import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public routes that don't require authentication
  const publicRoutes = [
    "/auth/login",
    "/auth/signup",
    "/members/accept",
    "/api/auth/signin",
    "/api/auth/signup",
    "/api/billing/plans",
    "/api/stripe/webhook",
    "/api/members/invite/validate",
    "/api/members/invite/accept-with-password",
  ];

  // Routes that don't require subscription (but may require auth)
  const noSubscriptionRequiredRoutes = [
    "/select-plan",
    "/welcome",
    "/api/billing/setup-free",
    "/api/stripe/checkout",
  ];

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    console.log("[MIDDLEWARE] Allowing public route:", pathname);
    return NextResponse.next();
  }

  // Allow static files and API routes (they handle their own auth and subscription checks)
  if (pathname.startsWith("/_next") || pathname.startsWith("/api/")) {
    console.log("[MIDDLEWARE] Allowing static/API route:", pathname);
    return NextResponse.next();
  }

  // Allow routes that don't require subscription
  if (noSubscriptionRequiredRoutes.some((route) => pathname.startsWith(route))) {
    console.log("[MIDDLEWARE] Allowing route without subscription requirement:", pathname);
    return NextResponse.next();
  }

  // Check for auth token in cookies
  const accessToken = request.cookies.get("sb-access-token");
  const refreshToken = request.cookies.get("sb-refresh-token");
  const authToken = accessToken || refreshToken;

  console.log("[MIDDLEWARE] Checking auth for:", pathname, {
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    hasAuthToken: !!authToken,
  });

  // If no auth token and trying to access protected page route
  if (!authToken && !pathname.startsWith("/api/")) {
    console.log("[MIDDLEWARE] No auth token found, redirecting to login from:", pathname);
    // Redirect to login for page routes
    const redirectUrl = new URL("/auth/login", request.url);
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // For authenticated users, we'll check subscription on the client side or in API routes
  // The middleware redirect will be handled by a client-side check in layout components
  // This avoids complex async operations in middleware

  console.log("[MIDDLEWARE] Allowing access to:", pathname);
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

