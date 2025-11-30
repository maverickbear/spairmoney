import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/src/application/shared/feature-guard";
import { AppError } from "@/src/application/shared/app-error";
import { makeStripeService } from "@/src/application/stripe/stripe.factory";

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Redirect to Stripe Customer Portal for subscription management
    // All cancellation actions should be done through the Portal
    const service = makeStripeService();
    const portalResult = await service.createPortalSession(userId);

    if (portalResult.error || !portalResult.url) {
      throw new AppError(
        portalResult.error || "Failed to create portal session",
        500
      );
    }

    return NextResponse.json({
      success: true,
      url: portalResult.url,
      message: "Redirecting to Stripe Customer Portal to manage your subscription",
    });
  } catch (error) {
    console.error("[CANCEL_SUBSCRIPTION] Error:", error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create portal session" },
      { status: 500 }
    );
  }
}

