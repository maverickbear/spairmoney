/**
 * Returns the origin (base URL) for API requests.
 * Use this when calling fetch() for /api/* routes so requests always hit
 * the correct origin (e.g. when the app is served under a base path or proxy).
 *
 * - Client: window.location.origin
 * - Server: NEXT_PUBLIC_APP_URL or empty string (callers should use absolute URLs only on client when possible)
 */
export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
}

/**
 * Builds an absolute API URL for the given path (e.g. "/api/v2/user").
 * Prefer this in client components for API calls so the request hits the correct origin.
 */
export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${normalizedPath}` : normalizedPath;
}

/**
 * Builds an API URL for category/subcategory endpoints and appends locale when needed
 * so the API returns localized names (name_pt, name_es) from the database.
 * Use when the current app locale should drive category labels (e.g. from useLocale()).
 */
export function categoriesApiUrl(path: string, locale?: string): string {
  const url = apiUrl(path);
  if (!locale || locale === "en") return url;
  if (locale !== "pt" && locale !== "es") return url;
  const separator = path.includes("?") ? "&" : "?";
  return `${url}${separator}locale=${locale}`;
}
