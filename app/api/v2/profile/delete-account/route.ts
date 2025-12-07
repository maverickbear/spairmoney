import { NextRequest, NextResponse } from "next/server";
import { makeProfileService } from "@/src/application/profile/profile.factory";
import { getCurrentUserId } from "@/src/application/shared/feature-guard";
import { AppError } from "@/src/application/shared/app-error";

/**
 * DELETE /api/v2/profile/delete-account
 * Delete user account immediately
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const service = makeProfileService();
    const result = await service.deleteAccount(userId);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error deleting account:", error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete account" },
      { status: 500 }
    );
  }
}

