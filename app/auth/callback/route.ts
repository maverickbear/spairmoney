import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/src/infrastructure/database/supabase-server";

/**
 * GET /auth/callback
 * Handles OAuth callback from Google
 * Processes the authorization code, exchanges it for a session, creates user profile if needed,
 * and redirects to appropriate page based on subscription status
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  // Handle OAuth errors (user cancelled, etc.)
  if (error) {
    console.error("[OAUTH-CALLBACK] OAuth error:", error, errorDescription);
    const redirectUrl = new URL("/auth/login", requestUrl.origin);
    redirectUrl.searchParams.set("error", error === "access_denied" ? "oauth_cancelled" : "oauth_error");
    if (errorDescription) {
      redirectUrl.searchParams.set("error_description", errorDescription);
    }
    return NextResponse.redirect(redirectUrl);
  }

  // If no code, redirect to login
  if (!code) {
    console.warn("[OAUTH-CALLBACK] No authorization code received");
    const redirectUrl = new URL("/auth/login", requestUrl.origin);
    redirectUrl.searchParams.set("error", "no_code");
    return NextResponse.redirect(redirectUrl);
  }

  try {
    // Create server client with proper cookie handling for PKCE
    // The code verifier should be in cookies if using @supabase/ssr correctly
    // The createServerClient function reads cookies automatically via @supabase/ssr
    const supabase = await createServerClient();

    // Debug: Check if code verifier cookie exists (for troubleshooting)
    // The cookie name format is: sb-{project-ref}-auth-code-verifier
    const cookieStore = await import("next/headers").then(m => m.cookies());
    const allCookies = cookieStore.getAll();
    const hasCodeVerifierCookie = allCookies.some(cookie => 
      cookie.name.includes("auth-code-verifier") || 
      cookie.name.includes("code-verifier")
    );
    
    if (!hasCodeVerifierCookie) {
      console.warn("[OAUTH-CALLBACK] Code verifier cookie not found in request cookies");
      console.log("[OAUTH-CALLBACK] Available cookies:", allCookies.map(c => c.name).join(", "));
    }

    // Exchange the code for a session temporarily to get user info
    // We'll sign out and require OTP verification before final login
    // Note: exchangeCodeForSession requires the code verifier from cookies for PKCE flow
    // The @supabase/ssr package should automatically read the code verifier from cookies
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError || !data.session || !data.user) {
      console.error("[OAUTH-CALLBACK] Error exchanging code for session:", {
        error: exchangeError?.message,
        code: exchangeError?.code,
        status: exchangeError?.status,
        // Log if it's a PKCE error
        isPkceError: exchangeError?.message?.includes("code verifier") || exchangeError?.message?.includes("pkce"),
      });
      
      // If it's a PKCE error, the code verifier might not be in cookies
      // This can happen if the OAuth flow was initiated from a different domain or session
      const isPkceError = exchangeError?.message?.includes("code verifier") || 
                         exchangeError?.message?.includes("pkce") ||
                         exchangeError?.message?.includes("non-empty");
      
      const redirectUrl = new URL("/auth/login", requestUrl.origin);
      redirectUrl.searchParams.set("error", "exchange_failed");
      
      if (isPkceError) {
        redirectUrl.searchParams.set("error_description", "Authentication session expired. Please try signing in again.");
      } else if (exchangeError?.message) {
        redirectUrl.searchParams.set("error_description", exchangeError.message);
      }
      
      return NextResponse.redirect(redirectUrl);
    }

    const authUser = data.user;
    const userEmail = authUser.email;

    if (!userEmail) {
      console.error("[OAUTH-CALLBACK] No email in OAuth response");
      const redirectUrl = new URL("/auth/login", requestUrl.origin);
      redirectUrl.searchParams.set("error", "no_email");
      return NextResponse.redirect(redirectUrl);
    }

    // Sign out to prevent session creation before OTP verification
    await supabase.auth.signOut();

    // Send OTP for login
    // Note: For OAuth flows, we use service role client which may bypass CAPTCHA requirements
    // since this is a server-side operation and we can't get a client-side CAPTCHA token
    const { createServiceRoleClient } = await import("@/src/infrastructure/database/supabase-server");
    const serviceRoleClient = createServiceRoleClient();

    console.log("[OAUTH-CALLBACK] Sending OTP for Google login");
    // Use service role client for OAuth OTP to potentially bypass CAPTCHA requirements
    // If this fails with CAPTCHA error, we'll need to handle it differently
    const { error: otpError } = await serviceRoleClient.auth.signInWithOtp({
      email: userEmail,
      options: {
        shouldCreateUser: false,
      },
    });

    if (otpError) {
      console.error("[OAUTH-CALLBACK] Error sending OTP:", otpError);
      
      // If CAPTCHA error, try with anon client (though it will likely fail without token)
      // This is a fallback - ideally service role should bypass CAPTCHA
      const isCaptchaError = otpError.message?.toLowerCase().includes("captcha");
      if (isCaptchaError) {
        console.warn("[OAUTH-CALLBACK] CAPTCHA error with service role, this shouldn't happen");
        // For OAuth flows, we can't get a client-side CAPTCHA token
        // Redirect to login with a specific error message
        const redirectUrl = new URL("/auth/login", requestUrl.origin);
        redirectUrl.searchParams.set("error", "oauth_captcha_required");
        redirectUrl.searchParams.set("error_description", "OAuth sign-in requires additional verification. Please try signing in with email and password instead.");
        return NextResponse.redirect(redirectUrl);
      }
      
      const redirectUrl = new URL("/auth/login", requestUrl.origin);
      redirectUrl.searchParams.set("error", "otp_failed");
      redirectUrl.searchParams.set("error_description", otpError.message || "Failed to send verification code");
      return NextResponse.redirect(redirectUrl);
    }

    // Store OAuth data temporarily in URL params to recreate user profile after OTP verification
    const oauthData = {
      name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || null,
      avatarUrl: authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || null,
      userId: authUser.id,
    };

    // Redirect to OTP verification page with OAuth data
    // Using unified verify-otp route that detects Google OAuth via oauth_data param
    const otpUrl = new URL("/auth/verify-otp", requestUrl.origin);
    otpUrl.searchParams.set("email", userEmail);
    otpUrl.searchParams.set("oauth_data", encodeURIComponent(JSON.stringify(oauthData)));
    
    return NextResponse.redirect(otpUrl);
  } catch (error) {
    console.error("[OAUTH-CALLBACK] Unexpected error:", error);
    const redirectUrl = new URL("/auth/login", requestUrl.origin);
    redirectUrl.searchParams.set("error", "unexpected_error");
    return NextResponse.redirect(redirectUrl);
  }
}

