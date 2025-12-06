import { NextRequest, NextResponse } from "next/server";
import { makeAuthService } from "@/src/application/auth/auth.factory";

/**
 * POST /api/v2/auth/sign-out
 * Signs out the current user
 * 
 * Note: If session doesn't exist, this is treated as success
 * since the logout objective (removing session) is already achieved
 */
export async function POST(request: NextRequest) {
  try {
    const service = makeAuthService();
    const result = await service.signOut();
    
    // If there's an error, check if it's a "session not found" error
    // In that case, treat as success since logout is already achieved
    if (result.error) {
      const errorMessage = result.error.toLowerCase();
      const isSessionNotFound = 
        errorMessage.includes("session not found") ||
        errorMessage.includes("session id") && errorMessage.includes("doesn't exist");
      
      if (isSessionNotFound) {
        // Session already doesn't exist - logout successful
        return NextResponse.json({ success: true }, { status: 200 });
      }
      
      // Other errors should be returned
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error in /api/v2/auth/sign-out:", error);
    
    // Check if it's a session-related error
    const errorMessage = error instanceof Error ? error.message.toLowerCase() : "";
    if (errorMessage.includes("session not found") || 
        (errorMessage.includes("session id") && errorMessage.includes("doesn't exist"))) {
      // Session already doesn't exist - logout successful
      return NextResponse.json({ success: true }, { status: 200 });
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to sign out" },
      { status: 500 }
    );
  }
}

