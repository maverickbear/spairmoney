import { NextRequest, NextResponse } from "next/server";
import { makeOnboardingService } from "@/src/application/onboarding/onboarding.factory";
import { getCurrentUserId } from "@/src/application/shared/feature-guard";
import { expectedIncomeRangeSchema, expectedIncomeAmountSchema } from "@/src/domain/onboarding/onboarding.validations";
import { BudgetRuleType } from "@/src/domain/budgets/budget-rules.types";
import { z } from "zod";

/**
 * GET /api/v2/onboarding/income
 * Get expected income and check if income onboarding is complete
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const service = makeOnboardingService();
    const { incomeRange, incomeAmount } = await service.getExpectedIncomeWithAmount(userId);
    const hasExpectedIncome = incomeRange !== null;

    return NextResponse.json(
      { 
        hasExpectedIncome, 
        expectedIncome: incomeRange,
        expectedIncomeAmount: incomeAmount ?? null,
      },
      {
      }
    );
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
 * Save expected income
 */
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = expectedIncomeRangeSchema.parse(body.incomeRange);
    const incomeAmount = body.incomeAmount !== undefined 
      ? expectedIncomeAmountSchema.parse(body.incomeAmount) 
      : undefined;
    const ruleType = body.ruleType as BudgetRuleType | undefined;

    const service = makeOnboardingService();
    const accessToken = request.cookies.get("sb-access-token")?.value;
    const refreshToken = request.cookies.get("sb-refresh-token")?.value;

    // Save expected income (with optional custom amount)
    await service.saveExpectedIncome(userId, validated, accessToken, refreshToken, incomeAmount);

    // Budgets are no longer created automatically during onboarding
    // Users will create budgets manually by selecting categories in the budgets page

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error saving expected income:", error);
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid income range" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

