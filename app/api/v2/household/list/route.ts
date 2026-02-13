import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUserId } from "@/src/application/shared/feature-guard";
import { HouseholdRepository } from "@/src/infrastructure/database/repositories/household.repository";

/**
 * GET /api/v2/household/list
 * Returns the list of households the current user belongs to (for dashboard selector).
 */
export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cookieStore = await cookies();
    const accessToken = cookieStore.get("sb-access-token")?.value;
    const refreshToken = cookieStore.get("sb-refresh-token")?.value;

    const repo = new HouseholdRepository();
    const households = await repo.findHouseholdsForUser(userId, accessToken, refreshToken);

    return NextResponse.json({ households });
  } catch (error) {
    console.error("Error fetching household list:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
