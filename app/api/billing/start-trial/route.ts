import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/src/application/shared/feature-guard";
import { makeTrialService } from "@/src/application/trial/trial.factory";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planId } = body;

    if (!planId) {
      return NextResponse.json(
        { error: "planId is required" },
        { status: 400 }
      );
    }

    // Get current user
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Use TrialService to start trial
    const trialService = makeTrialService();
    const result = await trialService.startTrial(userId, planId);

    if (!result.success) {
      const statusCode = result.error === "Unauthorized" 
        ? 401 
        : result.error?.includes("already") || result.error?.includes("used your trial")
          ? 400 
          : result.error === "Plan not found"
            ? 404
            : 500;
      
      return NextResponse.json(
        { error: result.error || "Failed to start trial" },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      subscription: result.subscription,
      trialEndDate: result.trialEndDate,
    });
  } catch (error) {
    console.error("[START-TRIAL] Error starting trial:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start trial" },
      { status: 500 }
    );
  }
}
