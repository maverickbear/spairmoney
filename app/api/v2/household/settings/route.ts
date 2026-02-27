import { NextRequest, NextResponse } from "next/server";
import { makeOnboardingService } from "@/src/application/onboarding/onboarding.factory";
import { getCurrentUserId } from "@/src/application/shared/feature-guard";
import { AppError } from "@/src/application/shared/app-error";

/**
 * GET /api/v2/household/settings
 * Get household settings for the current user (e.g. display currency).
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const accessToken = request.cookies.get("sb-access-token")?.value;
    const refreshToken = request.cookies.get("sb-refresh-token")?.value;

    const onboardingService = makeOnboardingService();
    const settings = await onboardingService.getHouseholdSettings(
      userId,
      accessToken,
      refreshToken
    );

    return NextResponse.json(settings);
  } catch (error) {
    console.error("[HOUSEHOLD-SETTINGS] Error getting settings:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: error instanceof AppError ? error.statusCode : 500 }
    );
  }
}

/**
 * PATCH /api/v2/household/settings
 * Update household settings (e.g. displayCurrency). Partial update.
 */
export async function PATCH(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const accessToken = request.cookies.get("sb-access-token")?.value;
    const refreshToken = request.cookies.get("sb-refresh-token")?.value;

    const onboardingService = makeOnboardingService();
    const settings = await onboardingService.updateHouseholdSettings(
      userId,
      body,
      accessToken,
      refreshToken
    );

    return NextResponse.json(settings);
  } catch (error) {
    console.error("[HOUSEHOLD-SETTINGS] Error updating settings:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: error instanceof AppError ? error.statusCode : 500 }
    );
  }
}
