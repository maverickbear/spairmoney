import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/src/application/shared/feature-guard";
import { makeProfileService } from "@/src/application/profile/profile.factory";
import { AppError } from "@/src/application/shared/app-error";

/**
 * GET /api/v2/user
 * Returns user data with plan and subscription information
 * Consolidates data from User table, subscription, and plan
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const service = makeProfileService();
    const data = await service.getUserWithSubscription(userId);

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'private, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error) {
    console.error("Error fetching user data:", error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch user data" },
      { status: 500 }
    );
  }
}

