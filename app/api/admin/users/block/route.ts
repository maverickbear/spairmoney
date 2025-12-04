import { NextRequest, NextResponse } from "next/server";
import { makeAdminService } from "@/src/application/admin/admin.factory";
import { getCurrentUserId } from "@/src/application/shared/feature-guard";
import { AppError } from "@/src/application/shared/app-error";

/**
 * PUT /api/admin/users/block
 * Block or unblock a user
 * When blocked, user cannot log in and subscription is paused
 * Only accessible by super_admin
 */
export async function PUT(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const service = makeAdminService();
    
    // Check if user is super_admin
    const isSuperAdmin = await service.isSuperAdmin(userId);
    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: "Unauthorized: Only super_admin can access this endpoint" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId: targetUserId, isBlocked, reason } = body;

    if (!targetUserId || typeof isBlocked !== "boolean") {
      return NextResponse.json(
        { error: "userId and isBlocked (boolean) are required" },
        { status: 400 }
      );
    }

    if (isBlocked && !reason) {
      return NextResponse.json(
        { error: "reason is required when blocking a user" },
        { status: 400 }
      );
    }

    await service.blockUser(targetUserId, isBlocked, {
      reason: reason?.trim(),
      blockedBy: userId,
      pauseSubscription: true, // Pause subscription when blocking
    });

    return NextResponse.json({
      success: true,
      message: isBlocked ? "User blocked successfully" : "User unblocked successfully",
    });
  } catch (error) {
    console.error("[ADMIN:BLOCK] Error:", error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to block/unblock user" },
      { status: 500 }
    );
  }
}

