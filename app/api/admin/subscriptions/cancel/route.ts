import { NextRequest, NextResponse } from "next/server";
import { makeAdminService } from "@/src/application/admin/admin.factory";
import { getCurrentUserId } from "@/src/application/shared/feature-guard";
import { AppError } from "@/src/application/shared/app-error";

/**
 * PUT /api/admin/subscriptions/cancel
 * Cancel subscription with various options (immediately, end of period, specific date)
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
    const { subscriptionId, cancelOption, cancelAt, refundOption } = body;

    if (!subscriptionId || !cancelOption) {
      return NextResponse.json(
        { error: "subscriptionId and cancelOption are required" },
        { status: 400 }
      );
    }

    if (!["immediately", "end_of_period", "specific_date"].includes(cancelOption)) {
      return NextResponse.json(
        { error: "cancelOption must be 'immediately', 'end_of_period', or 'specific_date'" },
        { status: 400 }
      );
    }

    // Parse cancelAt if provided
    let cancelAtDate: Date | undefined;
    if (cancelAt) {
      cancelAtDate = new Date(cancelAt);
      if (isNaN(cancelAtDate.getTime())) {
        return NextResponse.json(
          { error: "Invalid cancelAt date format" },
          { status: 400 }
        );
      }
    }

    // Handle refunds if needed (log only, not implemented)
    if (refundOption && refundOption !== "none" && cancelOption === "immediately") {
      console.log("[ADMIN:CANCEL] Refund requested:", refundOption);
      // Note: Stripe doesn't automatically handle refunds on subscription cancellation
      // You would need to create a credit note or refund manually
    }

    const result = await service.cancelSubscription(subscriptionId, cancelOption, cancelAtDate, refundOption);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[ADMIN:CANCEL] Error:", error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process cancellation" },
      { status: 500 }
    );
  }
}

