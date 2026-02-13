import { NextRequest, NextResponse } from "next/server";
import { makeBudgetRulesService } from "@/src/application/budgets/budget-rules.factory";
import { getCurrentUserId } from "@/src/application/shared/feature-guard";

/**
 * GET /api/v2/budgets/rules/suggest
 * Suggest a budget rule based on user's income
 */

export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const incomeParam = searchParams.get("expectedAnnualIncome");
    const expectedAnnualFromQuery =
      incomeParam != null ? Number(incomeParam) : null;

    const service = makeBudgetRulesService();

    const accessToken = request.cookies.get("sb-access-token")?.value;
    const refreshToken = request.cookies.get("sb-refresh-token")?.value;
    const { makeOnboardingService } = await import("@/src/application/onboarding/onboarding.factory");
    const onboardingService = makeOnboardingService();

    let monthlyIncome = 0;
    const expectedAnnual =
      expectedAnnualFromQuery != null && expectedAnnualFromQuery > 0
        ? expectedAnnualFromQuery
        : await onboardingService.getExpectedIncomeAmount(userId, accessToken, refreshToken);

    if (expectedAnnual != null && expectedAnnual > 0) {
      monthlyIncome = onboardingService.getMonthlyIncomeFromAnnual(expectedAnnual);
    }

    // If no income available, default to 50/30/20
    if (monthlyIncome === 0) {
      const defaultRule = service.getRuleById("50_30_20");
      return NextResponse.json({
        rule: defaultRule,
        explanation: "The 50/30/20 rule is the most popular and works well for most people.",
        confidence: "high" as const,
      });
    }

    // SIMPLIFIED: No cityCost parameter needed
    const suggestion = service.suggestRule(monthlyIncome);

    return NextResponse.json(suggestion, {
    });
  } catch (error) {
    console.error("Error suggesting budget rule:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

