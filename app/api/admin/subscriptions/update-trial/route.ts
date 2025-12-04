import { NextRequest, NextResponse } from "next/server";
import { makeAdminService } from "@/src/application/admin/admin.factory";
import { getCurrentUserId } from "@/src/application/shared/feature-guard";
import { AppError } from "@/src/application/shared/app-error";

/**
 * PUT /api/admin/subscriptions/update-trial
 * Update trial end date for a subscription (Supabase → Stripe)
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
    const isSuperAdmin = await service.isSuperAdmin(userId);
    if (!isSuperAdmin) {
      return NextResponse.json(
        { error: "Unauthorized: Only super_admin can access this endpoint" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { subscriptionId, trialEndDate } = body;

    if (!subscriptionId || !trialEndDate) {
      return NextResponse.json(
        { error: "subscriptionId and trialEndDate are required" },
        { status: 400 }
      );
    }

    // Validate and parse trialEndDate
    let trialEnd: Date;
    try {
      trialEnd = new Date(trialEndDate);
      if (isNaN(trialEnd.getTime())) {
        return NextResponse.json(
          { error: "Invalid trialEndDate format. Expected ISO date string." },
          { status: 400 }
        );
      }
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid trialEndDate format. Expected ISO date string." },
        { status: 400 }
      );
    }

    const result = await service.updateSubscriptionTrial(subscriptionId, trialEnd);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[ADMIN:UPDATE-TRIAL] Error:", error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update trial" },
      { status: 500 }
    );
  }
}

