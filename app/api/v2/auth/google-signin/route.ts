import { NextRequest, NextResponse } from "next/server";
import { makeAuthService } from "@/src/application/auth/auth.factory";
import { AppError } from "@/src/application/shared/app-error";

/**
 * POST /api/v2/auth/google-signin
 * Returns the Google OAuth URL for the client to redirect to.
 *
 * NOTE: The main Google sign-in flow is initiated from the client (GoogleSignInButton
 * using supabase.auth.signInWithOAuth) so the PKCE code_verifier is stored in the
 * browser. If OAuth is initiated from this API route, the code_verifier never reaches
 * the browser, so /auth/callback exchangeCodeForSession fails and public.users +
 * households are never created. This endpoint is kept for server-side redirect use cases.
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { redirectTo, flow } = body; // flow: "signin" | "signup"

    // Build callback URL with flow context. Default redirect after login is /dashboard (never landing).
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://spair.co";
    const callbackUrl = new URL("/auth/callback", appUrl);
    if (flow) {
      callbackUrl.searchParams.set("flow", flow); // Add flow parameter to callback
    }
    const finalRedirectTo = redirectTo || "/dashboard";
    callbackUrl.searchParams.set("redirectTo", finalRedirectTo);

    const service = makeAuthService();
    const result = await service.signInWithGoogle(callbackUrl.toString(), flow);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Return the URL for the client to redirect to
    return NextResponse.json(
      { url: result.url },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in Google sign-in:", error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to sign in with Google" },
      { status: 500 }
    );
  }
}

