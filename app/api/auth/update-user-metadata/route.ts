import { NextRequest, NextResponse } from "next/server";
import { makeAuthService } from "@/src/application/auth/auth.factory";
import { AppError } from "@/src/application/shared/app-error";

/**
 * POST /api/auth/update-user-metadata
 * Updates user_metadata in Supabase Auth with the name from User table
 * This ensures the Display name appears correctly in Supabase Auth dashboard
 */
export async function POST(request: NextRequest) {
  try {
    const service = makeAuthService();
    const result = await service.updateUserMetadata();

    if (!result.success) {
      const statusCode = result.error?.includes("Not authenticated") ? 401 :
                        result.error?.includes("not found") ? 404 : 500;
      return NextResponse.json(
        { error: result.error || "Failed to update user metadata" },
        { status: statusCode }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: "User metadata updated successfully"
    });
  } catch (error) {
    console.error("[UPDATE-USER-METADATA] Unexpected error:", error);
    
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

