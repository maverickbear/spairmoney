import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { loadDashboardData, loadSecondaryDashboardData } from "../dashboard/data-loader";
import { startOfMonth } from "date-fns/startOfMonth";
import { endOfMonth } from "date-fns/endOfMonth";
import { getCurrentUserId } from "@/src/application/shared/feature-guard";
import { SpairScoreInsightsPage } from "./insights-content";
import { PageHeader } from "@/components/common/page-header";
import { Loader2 } from "lucide-react";
import { recalculateFinancialHealthFromTransactions } from "@/src/application/shared/financial-health";
import { cookies } from "next/headers";

async function InsightsContent() {
  // Access request data (cookies) first to unlock Date usage during prerendering
  await cookies();

  const selectedMonthDate = startOfMonth(new Date());
  const startDate = startOfMonth(selectedMonthDate);
  const endDate = endOfMonth(selectedMonthDate);

  let userId: string | null = null;
  let accessToken: string | undefined;
  let refreshToken: string | undefined;
  try {
    userId = await getCurrentUserId();
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
  } catch {
    // Continue without tokens
  }

  const [data, secondaryData] = await Promise.all([
    loadDashboardData(selectedMonthDate, startDate, endDate),
    loadSecondaryDashboardData(
      selectedMonthDate,
      startDate,
      endDate,
      userId,
      accessToken,
      refreshToken
    ),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parseTransactionDate = (dateStr: string | Date): Date => {
    if (dateStr instanceof Date) {
      return dateStr;
    }
    const normalized = dateStr.replace(" ", "T").split(".")[0];
    return new Date(normalized);
  };

  const pastSelectedMonthTransactions = data.selectedMonthTransactions.filter((t) => {
    if (!t.date) return false;
    try {
      const txDate = parseTransactionDate(t.date);
      txDate.setHours(0, 0, 0, 0);
      return txDate <= today;
    } catch {
      return false;
    }
  });

  const currentIncome = pastSelectedMonthTransactions
    .filter((t) => t && t.type === "income")
    .reduce((sum, t) => {
      const amount = Number(t.amount) || 0;
      return sum + Math.abs(amount);
    }, 0);

  const currentExpenses = pastSelectedMonthTransactions
    .filter((t) => t && t.type === "expense")
    .reduce((sum, t) => {
      const amount = Number(t.amount) || 0;
      return sum + Math.abs(amount);
    }, 0);

  const financialHealth = data.financialHealth
    ? await recalculateFinancialHealthFromTransactions(
        pastSelectedMonthTransactions,
        data.financialHealth,
        accessToken,
        refreshToken,
        data.accounts
      )
    : null;

  const emergencyFundMonths =
    financialHealth?.emergencyFundMonths ??
    data.financialHealth?.emergencyFundMonths ??
    0;

  return (
    <SpairScoreInsightsPage
      financialHealth={financialHealth}
      currentIncome={currentIncome}
      currentExpenses={currentExpenses}
      emergencyFundMonths={emergencyFundMonths}
      selectedMonthTransactions={data.selectedMonthTransactions}
      lastMonthTransactions={data.lastMonthTransactions}
      debts={secondaryData.debts}
      subscriptions={secondaryData.subscriptions}
      budgets={data.budgets}
    />
  );
}

export async function generateMetadata() {
  const t = await getTranslations("metadata");
  return {
    title: `${t("pages.insights")} - ${t("titleSuffix")}`,
    description: t("description"),
  };
}

export default async function InsightsPage() {
  const t = await getTranslations("pages");
  return (
    <>
      <PageHeader title={t("insights")} />
      <div className="w-full p-4 lg:p-8">
        <Suspense fallback={
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        }>
          <InsightsContent />
        </Suspense>
      </div>
    </>
  );
}

