import { NextRequest, NextResponse } from "next/server";
import { makeAuthService } from "@/src/application/auth/auth.factory";
import { AppError } from "@/src/application/shared/app-error";

/**
 * POST /api/v2/auth/google-signin
 * Initiates Google OAuth sign-in flow
 * 
 * Note: OAuth flows typically need to happen client-side due to redirects.
 * This endpoint returns the OAuth URL for the client to redirect to.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { redirectTo } = body;

    const service = makeAuthService();
    const result = await service.signInWithGoogle(redirectTo);

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

