"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/components/common/money";
import { subMonths } from "date-fns";
import { useFormatDisplayDate } from "@/src/presentation/utils/format-date";
import { TrendingUp, TrendingDown, DollarSign, PiggyBank } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/src/domain/transactions/transactions.types";
import type { FinancialHealthData } from "@/src/application/shared/financial-health";

interface FinancialOverviewCardProps {
  currentMonthTransactions: Transaction[];
  lastMonthTransactions: Transaction[];
  financialHealth: FinancialHealthData | null;
  now: Date;
}

export function FinancialOverviewCard({
  currentMonthTransactions,
  lastMonthTransactions,
  financialHealth,
  now,
}: FinancialOverviewCardProps) {
  const t = useTranslations("reports");
  const formatDate = useFormatDisplayDate();
  // Calculate current month totals
  const currentIncome = currentMonthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const currentExpenses = currentMonthTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const currentNet = currentIncome - currentExpenses;

  // Calculate last month totals
  const lastIncome = lastMonthTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const lastExpenses = lastMonthTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const lastNet = lastIncome - lastExpenses;

  // Calculate changes
  const incomeChange = lastIncome > 0 ? ((currentIncome - lastIncome) / lastIncome) * 100 : 0;
  const expensesChange = lastExpenses > 0 ? ((currentExpenses - lastExpenses) / lastExpenses) * 100 : 0;
  const netChange = lastNet !== 0 ? ((currentNet - lastNet) / Math.abs(lastNet)) * 100 : 0;

  // Calculate savings rate
  const savingsRate = currentIncome > 0 ? (currentNet / currentIncome) * 100 : 0;

  const currentMonthName = formatDate(now, "monthYear");
  const lastMonthName = formatDate(subMonths(now, 1), "monthYear");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">{t("financialOverview")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Income */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{t("totalIncome")}</p>
              <DollarSign className="h-4 w-4 text-sentiment-positive" />
            </div>
            <p className="text-2xl font-bold">{formatMoney(currentIncome)}</p>
            {lastIncome > 0 && (
              <div className="flex items-center gap-1 text-xs">
                {incomeChange >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-sentiment-positive" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600 dark:text-red-400" />
                )}
                <span
                  className={cn(
                    incomeChange >= 0
                      ? "text-sentiment-positive"
                      : "text-red-600 dark:text-red-400"
                  )}
                >
                  {incomeChange >= 0 ? "+" : ""}
                  {incomeChange.toFixed(1)}% {t("vsLastMonth", { month: lastMonthName })}
                </span>
              </div>
            )}
          </div>

          {/* Total Expenses */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{t("totalExpenses")}</p>
              <DollarSign className="h-4 w-4 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-2xl font-bold">{formatMoney(currentExpenses)}</p>
            {lastExpenses > 0 && (
              <div className="flex items-center gap-1 text-xs">
                {expensesChange <= 0 ? (
                  <TrendingDown className="h-3 w-3 text-sentiment-positive" />
                ) : (
                  <TrendingUp className="h-3 w-3 text-red-600 dark:text-red-400" />
                )}
                <span
                  className={cn(
                    expensesChange <= 0
                      ? "text-sentiment-positive"
                      : "text-red-600 dark:text-red-400"
                  )}
                >
                  {expensesChange >= 0 ? "+" : ""}
                  {expensesChange.toFixed(1)}% {t("vsLastMonth", { month: lastMonthName })}
                </span>
              </div>
            )}
          </div>

          {/* Net Amount */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{t("netAmount")}</p>
              <DollarSign
                className={cn(
                  "h-4 w-4",
                  currentNet >= 0
                    ? "text-sentiment-positive"
                    : "text-red-600 dark:text-red-400"
                )}
              />
            </div>
            <p
              className={cn(
                "text-2xl font-bold",
                currentNet >= 0
                  ? "text-sentiment-positive"
                  : "text-red-600 dark:text-red-400"
              )}
            >
              {formatMoney(currentNet)}
            </p>
            {lastNet !== 0 && (
              <div className="flex items-center gap-1 text-xs">
                {netChange >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-sentiment-positive" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-600 dark:text-red-400" />
                )}
                <span
                  className={cn(
                    netChange >= 0
                      ? "text-sentiment-positive"
                      : "text-red-600 dark:text-red-400"
                  )}
                >
                  {netChange >= 0 ? "+" : ""}
                  {netChange.toFixed(1)}% {t("vsLastMonth", { month: lastMonthName })}
                </span>
              </div>
            )}
          </div>

          {/* Savings Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{t("savingsRate")}</p>
              <PiggyBank className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <p
              className={cn(
                "text-2xl font-bold",
                savingsRate >= 20
                  ? "text-sentiment-positive"
                  : savingsRate >= 10
                  ? "text-yellow-600 dark:text-yellow-400"
                  : "text-red-600 dark:text-red-400"
              )}
            >
              {savingsRate.toFixed(1)}%
            </p>
            {financialHealth && (
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "h-2 w-2 rounded-full",
                    financialHealth.classification === "Excellent" || financialHealth.classification === "Strong"
                      ? "bg-sentiment-positive"
                      : financialHealth.classification === "Fair"
                      ? "bg-sentiment-warning"
                      : financialHealth.classification === "Fragile"
                      ? "bg-sentiment-warning"
                      : "bg-sentiment-negative"
                  )}
                />
                <span className="text-xs text-muted-foreground">
                  {financialHealth.classification}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Spair Score */}
        {financialHealth && (
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{t("spairScore")}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {financialHealth.message}
                </p>
              </div>
              <div className="text-right">
                <p
                  className={cn(
                    "text-3xl font-bold",
                    financialHealth.score >= 80
                      ? "text-sentiment-positive"
                      : financialHealth.score >= 60
                      ? "text-yellow-600 dark:text-yellow-400"
                      : "text-red-600 dark:text-red-400"
                  )}
                >
                  {financialHealth.score}
                </p>
                <p className="text-xs text-muted-foreground">{t("outOf100")}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

