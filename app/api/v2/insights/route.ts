import { NextRequest, NextResponse } from "next/server";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { getCurrentUserId } from "@/src/application/shared/feature-guard";
import { makeInsightsService } from "@/src/application/insights/insights.factory";
import { makeTransactionsService } from "@/src/application/transactions/transactions.factory";
import { makeDebtsService } from "@/src/application/debts/debts.factory";
import { makeBudgetsService } from "@/src/application/budgets/budgets.factory";
import { makeUserSubscriptionsService } from "@/src/application/user-subscriptions/user-subscriptions.factory";
import { calculateFinancialHealth } from "@/src/application/shared/financial-health";
import { insightsMonthQuerySchema } from "@/src/domain/insights/validations";
import { logger } from "@/src/infrastructure/utils/logger";

const CACHE_MAX_AGE = 86400; // 24 hours

/**
 * GET /api/v2/insights?month=YYYY-MM
 * Returns AI-generated financial panorama and insight items for the given month.
 * Auth required. Response cached for 24h (client).
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = insightsMonthQuerySchema.safeParse({
      month: searchParams.get("month") ?? undefined,
    });
    const monthStr = query.success && query.data.month
      ? query.data.month
      : format(new Date(), "yyyy-MM");
    const monthDate = startOfMonth(new Date(monthStr + "-01"));
    const startDate = startOfMonth(monthDate);
    const endDate = endOfMonth(monthDate);
    const lastMonth = subMonths(startDate, 1);
    const lastMonthEnd = endOfMonth(lastMonth);

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
    } catch (e) {
      logger.warn("[insights] Could not get session tokens:", e);
    }

    const transactionsService = makeTransactionsService();
    const debtsService = makeDebtsService();
    const budgetsService = makeBudgetsService();
    const userSubscriptionsService = makeUserSubscriptionsService();

    const [
      currentMonthResult,
      lastMonthResult,
      debts,
      budgets,
      subscriptions,
    ] = await Promise.all([
      transactionsService.getTransactions(
        { forEffectiveMonth: monthStr },
        accessToken,
        refreshToken
      ),
      transactionsService.getTransactions(
        { startDate: lastMonth, endDate: lastMonthEnd },
        accessToken,
        refreshToken
      ),
      debtsService.getDebts(accessToken, refreshToken).catch(() => []),
      budgetsService.getBudgets(monthDate, accessToken, refreshToken).catch(() => []),
      userSubscriptionsService.getUserSubscriptions(userId).catch(() => []),
    ]);

    const currentMonthTransactions = Array.isArray(currentMonthResult)
      ? currentMonthResult
      : (currentMonthResult?.transactions ?? []);
    const lastMonthTransactions = Array.isArray(lastMonthResult)
      ? lastMonthResult
      : (lastMonthResult?.transactions ?? []);

    const financialHealth = await calculateFinancialHealth(
      monthDate,
      userId,
      accessToken,
      refreshToken,
      undefined,
      undefined,
      undefined,
      currentMonthTransactions,
      lastMonthTransactions,
      debts
    ).catch(() => null);

    const insightsService = makeInsightsService();
    const context = insightsService.buildContext({
      monthDate,
      currentMonthTransactions,
      lastMonthTransactions,
      debts,
      financialHealth,
      subscriptions,
      budgets,
    });

    const locale = request.headers.get("accept-language")?.split(",")[0]?.slice(0, 2);
    const result = await insightsService.generateInsights(context, locale);

    if (!result) {
      return NextResponse.json(
        {
          panorama: null,
          insightItems: [],
          fallback: true,
          context: {
            income: context.income,
            expenses: context.expenses,
            netAmount: context.netAmount,
            savingsRatePercent: context.savingsRatePercent,
            emergencyFundMonths: context.emergencyFundMonths,
            spairScore: context.spairScore,
            spendingDiscipline: context.spendingDiscipline,
            debtExposure: context.debtExposure,
          },
        },
        {
          status: 200,
          headers: {
            "Cache-Control": `private, max-age=${CACHE_MAX_AGE}`,
          },
        }
      );
    }

    return NextResponse.json(
      {
        panorama: result.panorama,
        insightItems: result.insightItems,
        fallback: false,
        context: {
          income: context.income,
          expenses: context.expenses,
          netAmount: context.netAmount,
          savingsRatePercent: context.savingsRatePercent,
          emergencyFundMonths: context.emergencyFundMonths,
          spairScore: context.spairScore,
          spendingDiscipline: context.spendingDiscipline,
          debtExposure: context.debtExposure,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": `private, max-age=${CACHE_MAX_AGE}`,
        },
      }
    );
  } catch (error) {
    logger.error("[insights] Error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load insights",
      },
      { status: 500 }
    );
  }
}
