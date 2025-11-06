import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// Validate Supabase URL format
if (supabaseUrl && !supabaseUrl.startsWith("https://") && !supabaseUrl.startsWith("http://")) {
  console.warn("⚠️  Supabase URL should start with https://. Current value:", supabaseUrl);
}

// Server-side Supabase client
// Use this in server components and API routes
// Optionally accepts tokens to avoid reading cookies (useful for cached functions)
export async function createServerClient(accessToken?: string, refreshToken?: string) {
  // If tokens are provided, use them directly (for cached functions)
  // Otherwise, read from cookies
  if (!accessToken || !refreshToken) {
    const cookieStore = await cookies();
    accessToken = cookieStore.get("sb-access-token")?.value;
    refreshToken = cookieStore.get("sb-refresh-token")?.value;
  }
  
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  // Set session if we have tokens
  if (accessToken && refreshToken) {
    try {
      await client.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
    } catch (error: any) {
      // Only log non-connection errors to avoid spam
      if (error?.message && !error.message.includes("ENOTFOUND") && !error.message.includes("fetch failed")) {
        console.error("Supabase session error:", error.message);
      }
    }
  }

  return client;
}

// Server-side Supabase client with service role key
// Use this for webhooks and admin operations that need to bypass RLS
// WARNING: This client bypasses Row Level Security - use with caution!
export function createServiceRoleClient() {
  if (!supabaseServiceRoleKey) {
    console.warn("⚠️  SUPABASE_SERVICE_ROLE_KEY not set. Falling back to anon key (may cause RLS issues).");
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

