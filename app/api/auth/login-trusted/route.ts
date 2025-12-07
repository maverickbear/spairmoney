import { NextRequest, NextResponse } from "next/server";
import { makeAuthService } from "@/src/application/auth/auth.factory";
import { AppError } from "@/src/application/shared/app-error";
import { verifyTurnstileToken, getClientIp } from "@/src/infrastructure/utils/turnstile";

/**
 * POST /api/auth/login-trusted
 * 
 * Signs in a user directly without OTP when browser is trusted.
 * This route validates credentials and creates a session.
 * 
 * Security: This should only be called when the browser is verified as trusted
 * by the client-side trusted browser check.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, turnstileToken } = body;

    console.log("[LOGIN-TRUSTED] Request received for email:", email);

    if (!email) {
      console.error("[LOGIN-TRUSTED] Email is missing");
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (!password) {
      console.error("[LOGIN-TRUSTED] Password is missing");
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 }
      );
    }

    // Validate Turnstile token
    const clientIp = getClientIp(request);
    const turnstileValidation = await verifyTurnstileToken(turnstileToken, clientIp);
    if (!turnstileValidation.success) {
      return NextResponse.json(
        { error: turnstileValidation.error || "Security verification failed" },
        { status: 400 }
      );
    }

    const service = makeAuthService();
    const result = await service.loginTrusted({ email, password });

    if (!result.success) {
      const statusCode = result.error?.includes("blocked") ? 403 : 
                        result.error?.includes("confirm") ? 401 : 401;
      return NextResponse.json(
        { error: result.error || "Failed to sign in" },
        { status: statusCode }
      );
    }

    console.log("[LOGIN-TRUSTED] Login successful for trusted browser:", email);
    
    // Create response with success
    const response = NextResponse.json({ 
      success: true,
      user: result.user,
    });

    // Set session cookies explicitly if we have a session
    if (result.session) {
      const expiresIn = result.session.expires_in || 3600;
      const maxAge = expiresIn;
      const refreshMaxAge = 7 * 24 * 60 * 60; // 7 days for refresh token

      response.cookies.set("sb-access-token", result.session.access_token, {
        path: "/",
        maxAge: maxAge,
        httpOnly: false, // Allow client-side access for Supabase client
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });

      response.cookies.set("sb-refresh-token", result.session.refresh_token, {
        path: "/",
        maxAge: refreshMaxAge,
        httpOnly: false, // Allow client-side access for Supabase client
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }

    return response;
  } catch (error) {
    console.error("[LOGIN-TRUSTED] Unexpected error:", error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

