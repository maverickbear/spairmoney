import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/src/application/shared/feature-guard";
import { AppError } from "@/src/application/shared/app-error";
import { makeDashboardService } from "@/src/application/dashboard/dashboard.factory";
import { getCacheHeaders } from "@/src/infrastructure/utils/cache-headers";
import { getActiveHouseholdId } from "@/lib/utils/household";

/**
 * GET /api/v2/dashboard/widgets
 * Get all dashboard widgets data for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get date from query params or use current month
    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get("date");
    const selectedDate = dateParam ? new Date(dateParam) : new Date();

    // Get session tokens
    let accessToken: string | undefined;
    let refreshToken: string | undefined;
    try {
      const { createServerClient } = await import("@/src/infrastructure/database/supabase-server");
      const supabase = await createServerClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          accessToken = session.access_token;
          refreshToken = session.refresh_token;
        }
      }
    } catch (error: any) {
      console.warn("[Dashboard Widgets API] Could not get session tokens:", error?.message);
      // Continue without tokens - service will try to get them itself
    }

    // Resolve active household so expected income uses after-tax (country/state) for this household
    const householdId = await getActiveHouseholdId(userId, accessToken, refreshToken);

    const service = makeDashboardService();
    const widgetsData = await service.getDashboardWidgets(
      userId,
      selectedDate,
      accessToken,
      refreshToken,
      undefined,
      householdId ?? undefined
    );

    // Dashboard widgets are aggregated data that changes frequently, use dynamic cache
    const cacheHeaders = getCacheHeaders('dynamic');

    return NextResponse.json(widgetsData, {
      status: 200,
      headers: cacheHeaders,
    });
  } catch (error) {
    console.error("Error fetching dashboard widgets:", error);
    
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch dashboard widgets" },
      { status: 500 }
    );
  }
}
