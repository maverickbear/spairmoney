import { NextRequest, NextResponse } from "next/server";
import { makeAdminService } from "@/src/application/admin/admin.factory";
import { getCurrentUserId } from "@/src/application/shared/feature-guard";
import { z } from "zod";
import { AppError } from "@/src/application/shared/app-error";

const unblockUserSchema = z.object({
  userId: z.string(),
  reason: z.string(),
  pauseSubscription: z.boolean().optional(),
});

/**
 * PUT /api/v2/admin/users/unblock
 * Unblock a user
 * When unblocked, user can log in again and subscription is resumed
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
    const validated = unblockUserSchema.parse(body);

    // Validate: reason is required
    if (!validated.reason || !validated.reason.trim()) {
      return NextResponse.json(
        { error: "reason is required when unblocking a user" },
        { status: 400 }
      );
    }

    await service.blockUser(validated.userId, false, {
      reason: validated.reason.trim(),
      blockedBy: userId,
      pauseSubscription: validated.pauseSubscription ?? true, // Default to true
    });

    return NextResponse.json({
      success: true,
      message: "User unblocked successfully",
    });
  } catch (error) {
    console.error("Error unblocking user:", error);

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
      { error: error instanceof Error ? error.message : "Failed to unblock user" },
      { status: 500 }
    );
  }
}

