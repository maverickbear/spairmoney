import { createClient } from "@supabase/supabase-js";
import { createServerClient as createSSRServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { logger } from "@/src/infrastructure/utils/logger";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// New format (sb_publishable_...) is preferred, fallback to old format (anon JWT) for backward compatibility
// Publishable keys are safe to expose and have the same privileges as anon keys
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
                        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// New format (sb_secret_...) is preferred, fallback to old format (service_role JWT) for backward compatibility
// Secret keys have elevated privileges and bypass RLS, same as service_role
const supabaseServiceRoleKey = process.env.SUPABASE_SECRET_KEY || 
                               process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY for legacy)");
}

// Validate Supabase URL format
if (supabaseUrl && !supabaseUrl.startsWith("https://") && !supabaseUrl.startsWith("http://")) {
  console.warn("⚠️  Supabase URL should start with https://. Current value:", supabaseUrl);
}

// Server-side Supabase client
// Use this in server components and API routes
// Uses @supabase/ssr for proper cookie handling
export async function createServerClient(accessToken?: string, refreshToken?: string) {
  // If tokens are provided, use them directly (for cached functions)
  // This avoids accessing cookies() inside cached functions
  if (accessToken && refreshToken) {
    // supabaseAnonKey is validated at module load time, so it's safe to assert here
    const client = createClient(supabaseUrl, supabaseAnonKey!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });

    try {
      // Set session with tokens - this is critical for RLS to work
      const { data: sessionData, error: sessionError } = await client.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      // Verify the session was set correctly
      if (sessionError) {
        // Only log if it's not an expected token error
        const errorMessage = sessionError.message?.toLowerCase() || "";
        const errorCode = (sessionError as any)?.code?.toLowerCase() || "";
        const isExpectedError = errorCode === "refresh_token_not_found" ||
          errorMessage.includes("refresh_token_not_found") ||
          errorMessage.includes("refresh token not found") ||
          errorMessage.includes("invalid refresh token") ||
          errorMessage.includes("jwt expired");
        if (!isExpectedError) {
          logger.warn("[createServerClient] setSession error:", sessionError.message);
        }
      }

      // Verify user is authenticated
      const { data: { user }, error: userError } = await client.auth.getUser();
      if (userError || !user) {
        // Only log if it's not an expected token error
        const errorMessage = userError?.message?.toLowerCase() || "";
        const errorCode = (userError as any)?.code?.toLowerCase() || "";
        const isExpectedError = errorCode === "refresh_token_not_found" ||
          errorMessage.includes("refresh_token_not_found") ||
          errorMessage.includes("refresh token not found") ||
          errorMessage.includes("invalid refresh token") ||
          errorMessage.includes("jwt expired");
        if (!isExpectedError) {
          logger.warn("[createServerClient] getUser error after setSession:", {
            userError: userError?.message,
            hasUser: !!user,
          });
        }
      }
      // Removed verbose success logging - authentication is expected and happens frequently
    } catch (error: any) {
      // Handle refresh token errors gracefully - don't log expected errors
      const errorMessage = error?.message?.toLowerCase() || "";
      const errorCode = error?.code?.toLowerCase() || "";
      const isExpectedError = errorCode === "refresh_token_not_found" ||
        errorMessage.includes("refresh_token_not_found") ||
        errorMessage.includes("refresh token not found") ||
        errorMessage.includes("invalid refresh token") ||
        errorMessage.includes("jwt expired");
      if (!isExpectedError) {
        logger.warn("[createServerClient] Unexpected error:", error?.message);
      }
      // Session will be invalid, but continue with unauthenticated client
    }

    return client;
  }
  
  // If tokens are not provided, try to access cookies
  // If we're inside unstable_cache(), this will throw an error
  // In that case, return an unauthenticated client
  let cookieStore;
  try {
    cookieStore = await cookies();
  } catch (error: any) {
    // If we can't access cookies (e.g., inside unstable_cache()), return unauthenticated client
    if (error?.message?.includes("unstable_cache") || 
        error?.message?.includes("Dynamic data sources") ||
        error?.message?.includes("cached with")) {
      // supabaseAnonKey is validated at module load time
      return createClient(supabaseUrl, supabaseAnonKey!, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    }
    // If it's a different error, re-throw it
    throw error;
  }
  
  // Use @supabase/ssr for automatic cookie handling
  // Disable auto-refresh to prevent errors when tokens are invalid
  let client;
  try {
    // supabaseAnonKey is validated at module load time
    client = createSSRServerClient(supabaseUrl, supabaseAnonKey!, {
      auth: {
        autoRefreshToken: false, // Disable auto-refresh to avoid errors with invalid tokens
        persistSession: false, // Session is managed via cookies
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              if (!value || value === "") {
                cookieStore.delete(name);
              } else {
                cookieStore.set(name, value, options);
              }
            });
          } catch (error) {
            // Ignore cookie setting errors
          }
        },
      },
    });

    // Try to get user to check if session is valid
    const { data: { user }, error: authError } = await client.auth.getUser();
    
    // If we get a refresh token error, clear invalid cookies silently
    // Check both error code and message (case-insensitive) to catch all variations
    const errorMessage = authError?.message?.toLowerCase() || "";
    const errorCode = (authError as any)?.code?.toLowerCase() || "";
    const isExpectedError = authError && (
      errorCode === "refresh_token_not_found" ||
      errorMessage.includes("refresh_token_not_found") ||
      errorMessage.includes("refresh token not found") ||
      errorMessage.includes("invalid refresh token") ||
      errorMessage.includes("jwt expired") ||
      errorMessage.includes("auth session missing")
    );
    
    if (isExpectedError) {
      // Clear all Supabase auth cookies silently (expected error)
      const authCookieNames = [
        "sb-access-token",
        "sb-refresh-token",
        "sb-provider-token",
        "sb-provider-refresh-token",
      ];
      
      authCookieNames.forEach((cookieName) => {
        try {
          cookieStore.delete(cookieName);
        } catch (error) {
          // Ignore errors when clearing cookies
        }
      });
      // Don't log - this is an expected error when user is not authenticated
    } else if (authError) {
      // Only log unexpected auth errors
      logger.warn("[createServerClient] Unexpected auth error:", authError.message);
    }
  } catch (error: any) {
    // If there's an error, clear cookies and return unauthenticated client
    // Check both error code and message (case-insensitive) to catch all variations
    const errorMessage = error?.message?.toLowerCase() || "";
    const errorCode = error?.code?.toLowerCase() || "";
    const isExpectedError = errorMessage.includes("refresh_token_not_found") ||
      errorMessage.includes("refresh token not found") ||
      errorMessage.includes("invalid refresh token") ||
      errorMessage.includes("jwt expired") ||
      errorCode === "refresh_token_not_found";
    
    if (isExpectedError) {
      const authCookieNames = [
        "sb-access-token",
        "sb-refresh-token",
        "sb-provider-token",
        "sb-provider-refresh-token",
      ];
      
      authCookieNames.forEach((cookieName) => {
        try {
          cookieStore.delete(cookieName);
        } catch (e) {
          // Ignore errors
        }
      });
    }
    
    // Return an unauthenticated client
    // supabaseAnonKey is validated at module load time
    client = createSSRServerClient(supabaseUrl, supabaseAnonKey!, {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {
          // No-op
        },
      },
    });
  }

  return client;
}

// Server-side Supabase client with service role key
// Use this for webhooks and admin operations that need to bypass RLS
// WARNING: This client bypasses Row Level Security - use with caution!
// Supports both old format (SUPABASE_SERVICE_ROLE_KEY - JWT) and new format (SUPABASE_SECRET_KEY - sb_secret_...)
export function createServiceRoleClient() {
  if (!supabaseServiceRoleKey) {
    console.warn(
      `⚠️  SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY for legacy) not set. ` +
      `Falling back to anon/publishable key (may cause RLS issues).`
    );
    // supabaseAnonKey is validated at module load time
    return createClient(supabaseUrl, supabaseAnonKey!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  // TypeScript now knows supabaseServiceRoleKey is not undefined after the check above
  return createClient(supabaseUrl, supabaseServiceRoleKey as string, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

