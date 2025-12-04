import { NextRequest, NextResponse } from "next/server";
import { makeAuthService } from "@/src/application/auth/auth.factory";
import { AppError } from "@/src/application/shared/app-error";

/**
 * POST /api/auth/create-user-profile
 * Creates user profile in User table using service role (bypasses RLS)
 * This is called after signup to ensure the user profile is created even if
 * the session isn't fully established yet
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, name, avatarUrl } = body;

    if (!userId || !email) {
      return NextResponse.json(
        { error: "userId and email are required" },
        { status: 400 }
      );
    }

    const service = makeAuthService();
    const result = await service.createUserProfile({
      userId,
      email,
      name,
      avatarUrl,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[CREATE-USER-PROFILE] Unexpected error:", error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

