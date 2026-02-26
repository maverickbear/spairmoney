import { NextRequest, NextResponse } from "next/server";
import { makeAdminService } from "@/src/application/admin/admin.factory";
import { getCurrentUserId } from "@/src/application/shared/feature-guard";
import { planOverrideSchema } from "@/src/domain/admin/admin.validations";
import { z } from "zod";
import { AppError } from "@/src/application/shared/app-error";
import { invalidateUserCaches } from "@/src/infrastructure/utils/cache-utils";
import { clearSubscriptionRequestCache } from "@/src/application/subscriptions/get-dashboard-subscription";

/**
 * PUT /api/v2/admin/users/[userId]/plan-override
 * Set or clear admin plan override for a user (app-only; does not change Stripe/billing).
 * Only accessible by super_admin.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const service = makeAdminService();

    if (!(await service.isSuperAdmin(currentUserId))) {
      return NextResponse.json(
        { error: "Unauthorized: Only super_admin can access this endpoint" },
        { status: 403 }
      );
    }

    const { userId } = await params;
    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validated = planOverrideSchema.parse(body);

    await service.setUserPlanOverride(userId, validated.planId);

    clearSubscriptionRequestCache(userId);
    await invalidateUserCaches(userId, { subscriptions: true, accounts: true });

    return NextResponse.json({
      success: true,
      message: validated.planId
        ? "Plan override set successfully"
        : "Plan override cleared successfully",
    });
  } catch (error) {
    console.error("Error setting plan override:", error);

    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: error.errors
            .map((e) => `${e.path.join(".")}: ${e.message}`)
            .join(", "),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to set plan override",
      },
      { status: 500 }
    );
  }
}
