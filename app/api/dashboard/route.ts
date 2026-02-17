import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/src/application/shared/feature-guard";
import { AppError } from "@/src/application/shared/app-error";
import { makeDashboardService } from "@/src/application/dashboard/dashboard.factory";
import { makeMembersService } from "@/src/application/members/members.factory";
import { getCacheHeaders } from "@/src/infrastructure/utils/cache-headers";
import { getActiveHouseholdId } from "@/lib/utils/household";

/**
 * GET /api/dashboard
 * Returns the fully aggregated dashboard payload (widgets data) for the current user.
 * Query: date (optional), memberId (optional) – when memberId is set, dashboard is filtered to that household member.
 * Use GET /api/dashboard/version to check if this payload is still current before refetching.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get("date");
    const memberIdParam = searchParams.get("memberId");
    const householdIdParam = searchParams.get("householdId") ?? undefined;
    const selectedDate = dateParam ? new Date(dateParam) : new Date();

    // When memberId is set: show only that household member's data (accounts, transactions).
    // When omitted (Everyone): show aggregated data for all household members.
    let viewAsUserId: string | undefined;
    if (memberIdParam) {
      const membersService = makeMembersService();
      const members = await membersService.getHouseholdMembers(userId);
      const member = members.find(
        (m) => (m.memberId ?? m.id) === memberIdParam
      );
      if (!member) {
        return NextResponse.json(
          { error: "Household member not found or access denied" },
          { status: 400 }
        );
      }
      // Use the member's user id for filtering (accounts/transactions are keyed by user id)
      viewAsUserId = member.memberId ?? memberIdParam;
    }

    let householdId: string | null | undefined = householdIdParam || null;
    if (householdIdParam) {
      const { HouseholdRepository } = await import("@/src/infrastructure/database/repositories/household.repository");
      const householdRepo = new HouseholdRepository();
      const userHouseholds = await householdRepo.findHouseholdsForUser(userId);
      if (!userHouseholds.some((h) => h.id === householdIdParam)) {
        return NextResponse.json(
          { error: "Household not found or access denied" },
          { status: 403 }
        );
      }
    }

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
    } catch (e) {
      console.warn("[Dashboard API] Could not get session tokens:", (e as Error)?.message);
    }

    // When no householdId in query, use active household so expected income uses after-tax (country/state)
    if (householdId == null || householdId === "") {
      householdId = await getActiveHouseholdId(userId, accessToken, refreshToken);
    }

    const service = makeDashboardService();
    const data = await service.getDashboardWidgets(
      userId,
      selectedDate,
      accessToken,
      refreshToken,
      viewAsUserId,
      householdId ?? undefined
    );

    const cacheHeaders = getCacheHeaders("dynamic");

    return NextResponse.json(data, {
      status: 200,
      headers: cacheHeaders,
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json(
      { error: "Failed to fetch dashboard" },
      { status: 500 }
    );
  }
}
