"use client";

import { useTranslations } from "next-intl";
import { formatMoney } from "@/components/common/money";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SimpleTabsContent } from "@/components/ui/simple-tabs";
import { format } from "date-fns/format";
import { startOfMonth } from "date-fns/startOfMonth";
import { useFormatDisplayDate } from "@/src/presentation/utils/format-date";
import { endOfMonth } from "date-fns/endOfMonth";
import { eachMonthOfInterval } from "date-fns/eachMonthOfInterval";
import { subMonths } from "date-fns/subMonths";
import { PlanFeatures } from "@/src/domain/subscriptions/subscriptions.validations";
import type { Budget } from "@/src/domain/budgets/budgets.types";
import type { Transaction } from "@/src/domain/transactions/transactions.types";
import type { DebtWithCalculations } from "@/src/domain/debts/debts.types";
import type { GoalWithCalculations } from "@/src/domain/goals/goals.types";
import type { FinancialHealthData } from "@/src/application/shared/financial-health";
import type { Account } from "@/src/domain/accounts/accounts.types";
import type { ReportPeriod, NetWorthData, CashFlowData, TrendData } from "@/src/domain/reports/reports.types";
import { getEffectiveMonth } from "@/src/application/shared/effective-month";
import { DebtAnalysisSection } from "@/components/reports/debt-analysis-section";
import { GoalsProgressSection } from "@/components/reports/goals-progress-section";
import { AccountBalancesSection } from "@/components/reports/account-balances-section";
import { SpendingPatternsSection } from "@/components/reports/spending-patterns-section";
import { FinancialHealthInsights } from "@/components/reports/financial-health-insights";
import { FinancialOverviewCard } from "@/components/reports/financial-overview-card";
import { NetWorthSection } from "@/components/reports/net-worth-section";
import { IncomeExpensesChart } from "@/components/charts/income-expenses-chart";
import { CategoryExpensesChart } from "@/components/charts/category-expenses-chart";

interface ReportsContentProps {
  limits: PlanFeatures;
  budgets: Budget[];
  currentMonthTransactions: Transaction[];
  historicalTransactions: Transaction[];
  debts: DebtWithCalculations[];
  goals: GoalWithCalculations[];
  financialHealth: FinancialHealthData | null;
  accounts: Account[];
  portfolioSummary: null;
  portfolioHoldings: unknown[];
  portfolioHistorical: unknown[];
  netWorth: NetWorthData | null;
  cashFlow: CashFlowData;
  trends: TrendData[];
  now: Date;
  period: ReportPeriod;
  dateRange: { startDate: Date; endDate: Date };
}

export function ReportsContent({
  limits,
  budgets,
  currentMonthTransactions,
  historicalTransactions,
  debts,
  goals,
  financialHealth,
  accounts,
  portfolioSummary,
  portfolioHoldings,
  portfolioHistorical,
  netWorth,
  cashFlow,
  trends,
  now,
  period,
  dateRange,
}: ReportsContentProps) {
  const t = useTranslations("reports");
  const formatDate = useFormatDisplayDate();
  const currentMonth = startOfMonth(now);
  const lastMonth = subMonths(now, 1);
  const lastMonthKey = format(lastMonth, "yyyy-MM");

  // Get last month transactions for comparison (by effective month)
  const lastMonthTransactions = historicalTransactions.filter(
    (tx) => getEffectiveMonth(tx) === lastMonthKey
  );

  // Process monthly data for income/expenses chart based on selected period (by effective month)
  const months = eachMonthOfInterval({
    start: startOfMonth(dateRange.startDate),
    end: endOfMonth(dateRange.endDate),
  });

  const monthlyData = months.map((month) => {
    const monthKey = format(month, "yyyy-MM");
    const monthTransactions = historicalTransactions.filter((tx) => getEffectiveMonth(tx) === monthKey);

    const income = monthTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const expenses = monthTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    return {
      month: formatDate(month, "monthYear"),
      income,
      expenses,
    };
  });

  // Monthly Summary - expenses by category
  const expensesByCategory = currentMonthTransactions
    .filter((t) => t.type === "expense" && t.category)
    .reduce((acc, t) => {
      const catId = t.categoryId!;
      if (!acc[catId]) {
        acc[catId] = {
          name: t.category!.name,
          actual: 0,
          budget: 0,
        };
      }
      acc[catId].actual += t.amount;
      return acc;
    }, {} as Record<string, { name: string; actual: number; budget: number }>);

  // Merge with budgets
  budgets.forEach((budget) => {
    if (budget.categoryId && expensesByCategory[budget.categoryId]) {
      expensesByCategory[budget.categoryId].budget = budget.amount;
    }
  });

  // Category expenses data for chart
  const categoryExpensesData = Object.values(expensesByCategory).map((item) => ({
    name: item.name,
    value: item.actual,
    categoryId: Object.keys(expensesByCategory).find(
      (key) => expensesByCategory[key].name === item.name
    ),
  }));

  const currentIncome = currentMonthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  // Top 10 expenses
  const topExpenses = currentMonthTransactions
    .filter((t) => t.type === "expense")
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  const periodDescription = period === "current-month"
    ? formatDate(now, "monthYear")
    : period === "year-to-date"
    ? `${format(dateRange.startDate, "yyyy")} (${t("yearToDateLabel")})`
    : `${formatDate(dateRange.startDate, "shortDate")} - ${formatDate(dateRange.endDate, "shortDate")}`;

  return (
    <>
        {/* Overview Tab */}
        <SimpleTabsContent value="overview">
        {/* Financial Overview Card */}
          <div className="pb-8">
            <FinancialOverviewCard
              currentMonthTransactions={currentMonthTransactions}
              lastMonthTransactions={lastMonthTransactions}
              financialHealth={financialHealth}
              now={now}
            />
          </div>

        {/* Income vs Expenses Trend */}
          {monthlyData.length > 0 && (
            <div className="pb-8">
              <IncomeExpensesChart data={monthlyData} />
            </div>
          )}

          {/* Category Breakdown */}
          {categoryExpensesData.length > 0 && (
            <div className="pb-8">
              <CategoryExpensesChart
                data={categoryExpensesData}
                totalIncome={currentIncome}
              />
            </div>
          )}

          {/* Monthly Summary Table */}
          <div className="space-y-2 pb-8">
            <h3 className="text-lg md:text-xl font-semibold">{t("monthlySummary")}</h3>
              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs md:text-sm">{t("category")}</TableHead>
                      <TableHead className="text-right text-xs md:text-sm">{t("budget")}</TableHead>
                      <TableHead className="text-right text-xs md:text-sm">{t("actual")}</TableHead>
                      <TableHead className="text-right text-xs md:text-sm hidden md:table-cell">{t("difference")}</TableHead>
                      <TableHead className="text-right text-xs md:text-sm">%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(Object.values(expensesByCategory) as Array<{ name: string; actual: number; budget: number }>).map((item) => {
                      const difference = item.actual - item.budget;
                      const percentage = item.budget > 0 ? (item.actual / item.budget) * 100 : 0;

                      return (
                        <TableRow key={item.name}>
                          <TableCell className="font-medium text-xs md:text-sm">{item.name}</TableCell>
                          <TableCell className="text-right font-medium text-xs md:text-sm">{formatMoney(item.budget)}</TableCell>
                          <TableCell className="text-right font-medium text-xs md:text-sm">{formatMoney(item.actual)}</TableCell>
                          <TableCell className={`text-right font-medium text-xs md:text-sm hidden md:table-cell ${
                            difference >= 0 ? "text-red-600 dark:text-red-400" : "text-sentiment-positive"
                          }`}>
                            {difference >= 0 ? "+" : ""}{formatMoney(difference)}
                          </TableCell>
                          <TableCell className={`text-right font-medium text-xs md:text-sm ${
                            percentage > 100 ? "text-red-600 dark:text-red-400" :
                            percentage > 90 ? "text-yellow-600 dark:text-yellow-400" : "text-sentiment-positive"
                          }`}>
                            {percentage.toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {Object.values(expensesByCategory).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="p-0">
                          <div className="flex items-center justify-center py-8 w-full">
                            <div className="text-center text-muted-foreground">
                              {t("noExpensesThisMonth")}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
          </div>

          {/* Top 10 Expenses */}
          <div className="space-y-2 pb-8">
            <h3 className="text-lg md:text-xl font-semibold">{t("top10Expenses")}</h3>
              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs md:text-sm">{t("date")}</TableHead>
                      <TableHead className="text-xs md:text-sm hidden md:table-cell">{t("description")}</TableHead>
                      <TableHead className="text-xs md:text-sm">{t("category")}</TableHead>
                      <TableHead className="text-xs md:text-sm hidden sm:table-cell">{t("accountLabel")}</TableHead>
                      <TableHead className="text-right text-xs md:text-sm">{t("amount")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topExpenses.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-medium text-xs md:text-sm whitespace-nowrap">{formatDate(tx.date, "shortDate")}</TableCell>
                        <TableCell className="text-xs md:text-sm hidden md:table-cell max-w-[150px] truncate">{tx.description || "-"}</TableCell>
                        <TableCell className="text-xs md:text-sm">
                          {tx.category?.name}
                          {tx.subcategory && ` / ${tx.subcategory.name}`}
                        </TableCell>
                        <TableCell className="text-xs md:text-sm hidden sm:table-cell">{tx.account?.name}</TableCell>
                        <TableCell className="text-right font-medium text-red-600 dark:text-red-400 text-xs md:text-sm">
                          {formatMoney(tx.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {topExpenses.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="p-0">
                          <div className="flex items-center justify-center py-8 w-full">
                            <div className="text-center text-muted-foreground">
                              {t("noExpensesFound")}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
          </div>
        </SimpleTabsContent>

        {/* Net Worth Tab */}
        <SimpleTabsContent value="net-worth">
          <div className="pb-8">
            <NetWorthSection netWorth={netWorth} />
          </div>
        </SimpleTabsContent>

        {/* Income & Expenses Tab */}
        <SimpleTabsContent value="income-expenses">
          {monthlyData.length > 0 && (
            <div className="pb-8">
              <IncomeExpensesChart data={monthlyData} />
            </div>
          )}
          {categoryExpensesData.length > 0 && (
            <div className="pb-8">
              <CategoryExpensesChart
                data={categoryExpensesData}
                totalIncome={currentIncome}
              />
            </div>
          )}
          <div className="pb-8">
            <SpendingPatternsSection transactions={historicalTransactions} />
          </div>
        </SimpleTabsContent>

        {/* Debts Tab */}
        <SimpleTabsContent value="debts">
          <div className="pb-8">
            <DebtAnalysisSection debts={debts} />
          </div>
        </SimpleTabsContent>

        {/* Goals Tab */}
        <SimpleTabsContent value="goals">
          <div className="pb-8">
            <GoalsProgressSection goals={goals} />
          </div>
        </SimpleTabsContent>

        {/* Accounts Tab */}
        <SimpleTabsContent value="accounts">
          <div className="pb-8">
            <AccountBalancesSection
              accounts={accounts}
              historicalTransactions={historicalTransactions}
              now={now}
            />
          </div>
        </SimpleTabsContent>

        {/* Insights Tab */}
      <SimpleTabsContent value="insights">
        <div className="pb-8">
          <FinancialHealthInsights financialHealth={financialHealth} />
        </div>
      </SimpleTabsContent>
    </>
  );
}

