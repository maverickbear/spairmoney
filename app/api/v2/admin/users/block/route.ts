import { NextRequest, NextResponse } from "next/server";
import { makeAdminService } from "@/src/application/admin/admin.factory";
import { getCurrentUserId } from "@/src/application/shared/feature-guard";
import { blockUserSchema } from "@/src/domain/admin/admin.validations";
import { z } from "zod";
import { AppError } from "@/src/application/shared/app-error";

/**
 * PUT /api/v2/admin/users/block
 * Block or unblock a user
 * When blocked, user cannot log in and subscription can be paused
 * Only accessible by super_admin
 */
export async function PUT(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const service = makeAdminService();
    
    // Check if user is super_admin
    if (!(await service.isSuperAdmin(userId))) {
      return NextResponse.json(
        { error: "Unauthorized: Only super_admin can access this endpoint" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = blockUserSchema.parse(body);

    // Validate: reason is required when blocking
    if (validated.isBlocked && !validated.reason) {
      return NextResponse.json(
        { error: "reason is required when blocking a user" },
        { status: 400 }
      );
    }

    await service.blockUser(validated.userId, validated.isBlocked, {
      reason: validated.reason,
      blockedBy: userId,
      pauseSubscription: validated.pauseSubscription ?? true, // Default to true
    });

    return NextResponse.json({
      success: true,
      message: validated.isBlocked ? "User blocked successfully" : "User unblocked successfully",
    });
  } catch (error) {
    console.error("Error blocking/unblocking user:", error);

    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ') },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to block/unblock user" },
      { status: 500 }
    );
  }
}

