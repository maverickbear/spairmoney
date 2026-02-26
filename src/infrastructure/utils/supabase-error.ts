/**
 * Utility functions for handling Supabase errors gracefully
 */

export interface SupabaseError {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
}

/**
 * Check if an error is an AbortError (e.g. Next.js dev aborting in-flight requests on cache miss).
 * These are expected in development and should not be logged as errors.
 */
export function isAbortError(error: unknown): boolean {
  if (!error) return false;
  const code = (error as { code?: string })?.code;
  const message = error instanceof Error ? error.message : String(error);
  return code === "20" || message.includes("aborted") || message.includes("AbortError");
}

/**
 * Check if an error is a connection/network error (e.g. user offline, Supabase unreachable).
 * We should NOT clear auth cookies on these errors so the user stays logged in when back online.
 */
export function isConnectionError(error: unknown): boolean {
  if (!error) return false;

  const message = (error as { message?: string })?.message ?? "";
  const errorMessage = typeof message === "string" ? message : String(error);

  const connectionErrorPatterns = [
    "ENOTFOUND",
    "fetch failed",
    "Failed to fetch",
    "ECONNREFUSED",
    "ETIMEDOUT",
    "ENETUNREACH",
    "getaddrinfo",
    "NetworkError",
    "load failed",
    "network",
    "timeout",
    "timed out",
    "ECONNRESET",
    "socket hang up",
  ];

  return connectionErrorPatterns.some((pattern) =>
    errorMessage.toLowerCase().includes(pattern.toLowerCase())
  );
}

/**
 * Only clear auth cookies when the session is definitively invalid (e.g. refresh token revoked,
 * user deleted). Do NOT clear on connection/network errors so the user stays logged in when back online.
 */
export function shouldClearAuthCookiesOnAuthError(error: unknown): boolean {
  if (!error) return false;
  if (isConnectionError(error)) return false;

  const message = (error as { message?: string })?.message ?? "";
  const code = (error as { code?: string })?.code ?? "";
  const errorMessage = typeof message === "string" ? message.toLowerCase() : "";
  const errorCode = typeof code === "string" ? code.toLowerCase() : "";

  const isSessionInvalid =
    errorCode === "refresh_token_not_found" ||
    errorMessage.includes("refresh_token_not_found") ||
    errorMessage.includes("refresh token not found") ||
    errorMessage.includes("invalid refresh token") ||
    errorMessage.includes("jwt expired") ||
    errorMessage.includes("auth session missing") ||
    errorMessage.includes("user from sub claim in jwt does not exist") ||
    errorMessage.includes("user does not exist");

  return isSessionInvalid;
}

/**
 * Safely log Supabase errors, filtering out connection errors
 */
export function logSupabaseError(
  context: string,
  error: unknown,
  options?: { logConnectionErrors?: boolean }
): void {
  const shouldLog = options?.logConnectionErrors !== false;
  
  if (isConnectionError(error) && !shouldLog) {
    // Connection errors are expected when Supabase is unavailable
    // Don't spam logs with these
    return;
  }
  
  if (error instanceof Error) {
    console.error(`[${context}] Supabase error:`, {
      message: error.message,
      name: error.name,
    });
  } else {
    console.error(`[${context}] Supabase error:`, error);
  }
}

/**
 * Check if Supabase is configured and accessible
 */
export function validateSupabaseConfig(): {
  isValid: boolean;
  error?: string;
} {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // New format (sb_publishable_...) is preferred, fallback to old format (anon JWT) for backward compatibility
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
               process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    return {
      isValid: false,
      error: 'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY for legacy).',
    };
  }
  
  if (!url.startsWith('https://') && !url.startsWith('http://')) {
    return {
      isValid: false,
      error: 'Supabase URL must start with https:// or http://',
    };
  }
  
  return { isValid: true };
}

