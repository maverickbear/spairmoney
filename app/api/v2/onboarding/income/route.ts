import { getActiveHouseholdId } from "@/lib/utils/household";
import { NextRequest, NextResponse } from "next/server";
import { makeOnboardingService } from "@/src/application/onboarding/onboarding.factory";
import { getCurrentUserId } from "@/src/application/shared/feature-guard";
import { expectedAnnualIncomeSchema } from "@/src/domain/onboarding/onboarding.validations";
import { HouseholdRepository } from "@/src/infrastructure/database/repositories/household.repository";
import { z } from "zod";

const postBodySchema = z.object({
  expectedAnnualIncome: z.union([z.number().positive().max(999_999_999), z.null()]).optional(),
  householdId: z.string().uuid().optional().nullable(),
  memberIncomes: z.record(z.string(), z.number().min(0).max(999_999_999)).optional().nullable(),
});

/**
 * GET /api/v2/onboarding/income
 * Get expected annual income. Optional ?householdId= to read a specific household (when user has access).
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const householdIdParam = searchParams.get("householdId") ?? undefined;

    const accessToken = request.cookies.get("sb-access-token")?.value;
    const refreshToken = request.cookies.get("sb-refresh-token")?.value;

    if (householdIdParam) {
      const householdRepo = new HouseholdRepository();
      const userHouseholds = await householdRepo.findHouseholdsForUser(
        userId,
        accessToken,
        refreshToken
      );
      if (!userHouseholds.some((h) => h.id === householdIdParam)) {
        return NextResponse.json(
          { error: "Household not found or access denied" },
          { status: 403 }
        );
      }
    }

    const service = makeOnboardingService();

    let expectedAnnualIncome: number | null;
    let memberIncomes: Record<string, number> = {};
    const householdId = householdIdParam ?? (await getActiveHouseholdId(userId, accessToken, refreshToken));
    if (householdId) {
      const incomeData = await service.getIncomeDataForHousehold(
        householdId,
        accessToken,
        refreshToken
      );
      expectedAnnualIncome = incomeData.expectedAnnualIncome;
      memberIncomes = incomeData.memberIncomes ?? {};
    } else {
      expectedAnnualIncome = await service.getExpectedIncomeAmount(
        userId,
        accessToken,
        refreshToken
      );
    }

    const hasExpectedIncome =
      expectedAnnualIncome != null && expectedAnnualIncome > 0;

    return NextResponse.json({
      hasExpectedIncome,
      expectedAnnualIncome: expectedAnnualIncome ?? null,
      ...(Object.keys(memberIncomes).length > 0 && { memberIncomes }),
    });
  } catch (error) {
    console.error("Error checking income onboarding status:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/v2/onboarding/income
 * Save expected annual income. Optional householdId to save to a specific household.
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = postBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body: expectedAnnualIncome (number or null), optional householdId, optional memberIncomes (record of string to number)" },
        { status: 400 }
      );
    }

    const { expectedAnnualIncome, householdId, memberIncomes } = parsed.data;
    const effectiveIncome = expectedAnnualIncome ?? null;
    if (effectiveIncome !== null) {
      expectedAnnualIncomeSchema.parse(effectiveIncome);
    }

    const accessToken = request.cookies.get("sb-access-token")?.value;
    const refreshToken = request.cookies.get("sb-refresh-token")?.value;

    if (householdId) {
      const householdRepo = new HouseholdRepository();
      const userHouseholds = await householdRepo.findHouseholdsForUser(
        userId,
        accessToken,
        refreshToken
      );
      if (!userHouseholds.some((h) => h.id === householdId)) {
        return NextResponse.json(
          { error: "Household not found or access denied" },
          { status: 403 }
        );
      }
    }

    const service = makeOnboardingService();

    await service.saveExpectedIncome(
      userId,
      effectiveIncome,
      accessToken,
      refreshToken,
      householdId ?? undefined,
      memberIncomes ?? undefined
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error saving expected income:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid expected annual income" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
