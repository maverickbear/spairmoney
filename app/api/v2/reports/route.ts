import { NextRequest, NextResponse } from "next/server";
import { makeReportsService } from "@/src/application/reports/reports.factory";
import { getCurrentUserId } from "@/src/application/shared/feature-guard";
import type { ReportPeriod } from "@/src/domain/reports/reports.types";

/**
 * Reports API endpoint
 * GET /api/v2/reports?period=last-12-months
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const periodParam = searchParams.get("period");
    const period: ReportPeriod = (periodParam &&
      ["current-month", "last-3-months", "last-6-months", "last-12-months", "year-to-date", "custom"].includes(periodParam)
    ) ? periodParam as ReportPeriod : "last-12-months";

    // Get session tokens
    let accessToken: string | undefined;
    let refreshToken: string | undefined;
    try {
      const { createServerClient } = await import("@/lib/supabase-server");
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
      // Continue without tokens - service will try to get them itself
    }

    const service = makeReportsService();
    const data = await service.getReportsData(userId, period, accessToken, refreshToken);

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
