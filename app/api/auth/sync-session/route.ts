import { NextRequest, NextResponse } from "next/server";
import { makeAuthService } from "@/src/application/auth/auth.factory";
import { AppError } from "@/src/application/shared/app-error";

/**
 * POST /api/auth/sync-session
 * 
 * Syncs the client-side session with server-side cookies.
 * This ensures that cookies are properly set on the server before redirecting.
 * 
 * This is particularly important in production where cookie settings (secure, sameSite, domain)
 * need to be consistent between client and server.
 */
export async function POST(request: NextRequest) {
  try {
    const service = makeAuthService();
    const result = await service.syncSession();
    
    if (!result.success) {
      return NextResponse.json(
        { error: "No active session found", success: false },
        { status: 401 }
      );
    }
    
    const response = NextResponse.json({
      success: true,
      user: result.user,
      warning: result.warning,
    });
    
    // Set cookies explicitly if we have a session
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
    console.error("[SYNC-SESSION] Error syncing session:", error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, success: false },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to sync session", success: false },
      { status: 500 }
    );
  }
}

