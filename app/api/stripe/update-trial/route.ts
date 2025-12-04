import { NextRequest, NextResponse } from "next/server";
import { makeStripeService } from "@/src/application/stripe/stripe.factory";
import { getCurrentUserId } from "@/src/application/shared/feature-guard";
import { AppError } from "@/src/application/shared/app-error";

export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { trialEndDate } = body;

    if (!trialEndDate) {
      return NextResponse.json(
        { error: "trialEndDate is required" },
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

    // Validate that trialEndDate is in the future
    const now = new Date();
    if (trialEnd <= now) {
      return NextResponse.json(
        { error: "Trial end date must be in the future" },
        { status: 400 }
      );
    }

    console.log("[UPDATE-TRIAL:ROUTE] Updating trial for user:", {
      userId,
      trialEndDate: trialEnd.toISOString(),
    });

    // Update trial in Stripe
    const stripeService = makeStripeService();
    const result = await stripeService.updateSubscriptionTrial(userId, trialEnd);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to update trial" },
        { status: 500 }
      );
    }

    console.log("[UPDATE-TRIAL:ROUTE] Trial updated successfully for user:", userId);

    return NextResponse.json({
      success: true,
      message: "Trial end date updated successfully. The webhook will sync the changes automatically.",
    });
  } catch (error) {
    console.error("[UPDATE-TRIAL:ROUTE] Error:", error);
    
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

