/**
 * Route Type Utilities
 * Determines route types for layout rendering decisions.
 * Locale is not in the URL (cookie-based); pathname is the logical path as-is.
 */

/** Pathname for logical route checks. With localePrefix: 'never', pathname has no locale segment. */
function getPathnameWithoutLocale(pathname: string): string {
  return pathname;
}

export interface RouteInfo {
  isApiRoute: boolean;
  isPublicPage: boolean;
  isWelcomePage: boolean;
  isDashboardRoute: boolean;
  /** Admin portal routes use their own layout (no consumer sidebar) */
  isAdminRoute: boolean;
}

/**
 * Determine route information from pathname
 * @param pathname - Current pathname (can be null during SSR)
 * @returns Route information object
 */
export function getRouteInfo(pathname: string | null): RouteInfo {
  // During SSR/prerender (pathname is null), default to safe values
  if (!pathname) {
    return {
      isApiRoute: false,
      isPublicPage: false,
      isWelcomePage: false,
      isDashboardRoute: false,
      isAdminRoute: false,
    };
  }

  const logical = getPathnameWithoutLocale(pathname);

  const isAdminRoute = logical.startsWith("/admin");
  const isApiRoute = pathname.startsWith("/api");
  const isAuthPage = logical.startsWith("/auth");
  const isAcceptPage = logical.startsWith("/members/accept");
  const isWelcomePage = logical === "/welcome";
  const isLandingPage = logical === "/";
  const isPrivacyPolicyPage = logical === "/privacy-policy";
  const isTermsOfServicePage = logical === "/terms-of-service";
  const isFAQPage = logical === "/faq";
  const isContactPage = logical === "/contact";
  const isAboutPage = logical === "/about";
  const isCareersPage = logical === "/careers";
  const isSubscriptionSuccessPage = logical === "/subscription/success";
  const isMaintenancePage = logical === "/maintenance";
  const isDesignPage = logical.startsWith("/design");
  const isBlogPage = logical === "/blog" || logical.startsWith("/blog/");
  const isPublicPage =
    isAuthPage ||
    isAcceptPage ||
    isLandingPage ||
    isPrivacyPolicyPage ||
    isTermsOfServicePage ||
    isFAQPage ||
    isContactPage ||
    isAboutPage ||
    isCareersPage ||
    isSubscriptionSuccessPage ||
    isMaintenancePage ||
    isDesignPage ||
    isBlogPage;

  const isDashboardRoute = !isPublicPage && !isApiRoute && !isWelcomePage && !isAdminRoute;

  return {
    isApiRoute,
    isPublicPage,
    isWelcomePage,
    isDashboardRoute,
    isAdminRoute,
  };
}

