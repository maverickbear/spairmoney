"use client";

import { useEffect, useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { apiUrl } from "@/lib/utils/api-base-url";
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Lightbulb,
  ArrowRight,
  Shield,
  CreditCard,
  Wallet,
  Loader2,
  Sparkles,
} from "lucide-react";
import { formatMoney } from "@/components/common/money";
import { calculateTotalExpenses } from "../dashboard/utils/transaction-helpers";
import type { FinancialHealthData } from "@/src/application/shared/financial-health";
import type { DebtWithCalculations } from "@/src/domain/debts/debts.types";
import type { UserServiceSubscription } from "@/src/domain/subscriptions/subscriptions.types";
import type { BudgetWithRelations } from "@/src/domain/budgets/budgets.types";
import type { InsightItem, InsightCategory } from "@/src/domain/insights/types";
import type { TransactionWithRelations } from "@/src/domain/transactions/transactions.types";

interface InsightsApiResponse {
  panorama: string | null;
  insightItems: InsightItem[];
  fallback: boolean;
  context?: {
    income: number;
    expenses: number;
    netAmount: number;
    savingsRatePercent: number;
    emergencyFundMonths: number;
    spairScore: number;
    spendingDiscipline: string;
    debtExposure: string;
  };
}

interface SpairScoreInsightsPageProps {
  financialHealth: FinancialHealthData | null;
  currentIncome: number;
  currentExpenses: number;
  emergencyFundMonths: number;
  selectedMonthTransactions: TransactionWithRelations[];
  lastMonthTransactions: TransactionWithRelations[];
  debts?: DebtWithCalculations[];
  subscriptions?: UserServiceSubscription[];
  budgets?: BudgetWithRelations[];
}

export function SpairScoreInsightsPage({
  financialHealth,
  currentIncome,
  currentExpenses,
  emergencyFundMonths,
  selectedMonthTransactions,
  lastMonthTransactions,
  debts = [],
  subscriptions = [],
}: SpairScoreInsightsPageProps) {
  const t = useTranslations("insights");
  const [apiData, setApiData] = useState<InsightsApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const monthStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    fetch(apiUrl(`/api/v2/insights?month=${monthStr}`))
      .then((res) => {
        if (!res.ok) throw new Error("Insights fetch failed");
        return res.json();
      })
      .then((data: InsightsApiResponse) => {
        if (!cancelled) {
          setApiData(data);
          setError(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setApiData(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [monthStr]);

  const parseTransactionDate = (dateStr: string | Date): Date => {
    if (dateStr instanceof Date) return dateStr;
    const normalized = String(dateStr).replace(" ", "T").split(".")[0];
    return new Date(normalized);
  };

  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  const pastSelectedMonthTransactions = useMemo(
    () =>
      selectedMonthTransactions.filter((t) => {
        if (!t?.date) return false;
        try {
          const txDate = parseTransactionDate(t.date);
          txDate.setHours(0, 0, 0, 0);
          return txDate <= today;
        } catch {
          return false;
        }
      }),
    [selectedMonthTransactions, today]
  );

  const pastLastMonthTransactions = useMemo(
    () =>
      lastMonthTransactions.filter((t) => {
        if (!t?.date) return false;
        try {
          const txDate = parseTransactionDate(t.date);
          txDate.setHours(0, 0, 0, 0);
          return txDate <= today;
        } catch {
          return false;
        }
      }),
    [lastMonthTransactions, today]
  );

  const fallbackAlerts = useMemo(() => {
    const alertsList: Array<{
      type: "success" | "warning" | "danger";
      badge: string;
      text: string;
      action?: string;
      icon: React.ReactNode;
      category: "spending" | "debt" | "security";
    }> = [];

    const savingsRate =
      currentIncome > 0
        ? ((currentIncome - currentExpenses) / currentIncome) * 100
        : 0;
    if (savingsRate >= 15 && savingsRate < 22) {
      const additionalSavings =
        currentIncome * 0.22 - (currentIncome - currentExpenses);
      alertsList.push({
        type: "success",
        badge: "Savings",
        text: `You're saving ${savingsRate.toFixed(0)}% of your income. Increasing this to 22% would help you reach your goals faster.`,
        action: `Save an additional ${formatMoney(additionalSavings)} per month to reach the 22% savings target.`,
        icon: <CheckCircle2 className="h-5 w-5" />,
        category: "spending",
      });
    }

    if (emergencyFundMonths < 6 && currentExpenses > 0) {
      const monthsNeeded = 6 - emergencyFundMonths;
      const monthlySavings = currentIncome - currentExpenses;
      const recommendedTransfer =
        monthlySavings > 0 ? Math.max(monthlySavings * 0.1, 250) : 250;
      const totalNeeded = monthsNeeded * currentExpenses;
      const monthsToReach =
        recommendedTransfer > 0
          ? Math.ceil(totalNeeded / recommendedTransfer)
          : null;
      let actionText: string;
      if (monthsToReach === null || monthsToReach === 0) {
        actionText = `You need to save ${formatMoney(totalNeeded)} to reach 6 months coverage. Consider increasing your savings rate or reducing expenses.`;
      } else if (monthsToReach > 120) {
        actionText = `You need to save ${formatMoney(totalNeeded)} to reach 6 months coverage. At ${formatMoney(recommendedTransfer)}/month, this would take over 10 years. Consider increasing your savings rate.`;
      } else {
        actionText = `Set up an automatic transfer of ${formatMoney(recommendedTransfer)}/month to reach 6 months coverage in approximately ${monthsToReach} ${monthsToReach === 1 ? "month" : "months"}.`;
      }
      alertsList.push({
        type: "warning",
        badge: "Emergency fund",
        text: `Your emergency fund covers ${emergencyFundMonths.toFixed(1)} months. Aim for at least 6 months of expenses for better financial security.`,
        action: actionText,
        icon: <AlertCircle className="h-5 w-5" />,
        category: "security",
      });
    }

    const currentMonthExpenses =
      calculateTotalExpenses(pastSelectedMonthTransactions);
    const lastMonthExpenses =
      calculateTotalExpenses(pastLastMonthTransactions);
    if (lastMonthExpenses > 0) {
      const expenseChange =
        ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100;
      if (expenseChange > 20) {
        const excessAmount = currentMonthExpenses - lastMonthExpenses;
        alertsList.push({
          type: "danger",
          badge: "Overspending",
          text: `Your spending is ${expenseChange.toFixed(0)}% higher than last month, which is ${formatMoney(excessAmount)} more than expected.`,
          action: `Review your budget categories and identify areas where you can reduce spending. Consider setting spending limits for discretionary categories.`,
          icon: <AlertTriangle className="h-5 w-5" />,
          category: "spending",
        });
      }
    }

    financialHealth?.alerts?.forEach((alert) => {
      let type: "success" | "warning" | "danger" = "warning";
      let icon = <AlertCircle className="h-5 w-5" />;
      let category: "spending" | "debt" | "security" = "spending";
      if (alert.severity === "critical") {
        type = "danger";
        icon = <AlertTriangle className="h-5 w-5" />;
      } else if (alert.severity === "info") {
        type = "success";
        icon = <CheckCircle2 className="h-5 w-5" />;
      }
      if (alert.id.includes("debt") || alert.id.includes("dti")) {
        category = "debt";
      } else if (
        alert.id.includes("emergency") ||
        alert.id.includes("security")
      ) {
        category = "security";
      }
      alertsList.push({
        type,
        badge: alert.title,
        text: alert.description,
        action: alert.action || undefined,
        icon,
        category,
      });
    });

    return alertsList;
  }, [
    currentIncome,
    currentExpenses,
    emergencyFundMonths,
    pastSelectedMonthTransactions,
    pastLastMonthTransactions,
    financialHealth,
  ]);

  const suggestions = financialHealth?.suggestions ?? [];
  const useFallbackInsights =
    loading ||
    error ||
    !apiData ||
    apiData.fallback ||
    (apiData.insightItems?.length === 0 && fallbackAlerts.length === 0 && suggestions.length === 0);

  const context = apiData?.context;
  const displayIncome = context?.income ?? currentIncome;
  const displayExpenses = context?.expenses ?? currentExpenses;
  const displaySavingsRate = context?.savingsRatePercent ?? (currentIncome > 0 ? ((currentIncome - currentExpenses) / currentIncome) * 100 : 0);
  const displayEmergencyMonths = context?.emergencyFundMonths ?? emergencyFundMonths;
  const totalDebtPayment = debts
    .filter((d) => !d.isPaidOff && d.currentBalance > 0)
    .reduce((sum, d) => sum + (d.monthlyPayment ?? 0), 0);
  const debtLoadPercent =
    displayIncome > 0 ? (totalDebtPayment / displayIncome) * 100 : 0;

  const insightItemsByCategory = useMemo(() => {
    const items = apiData?.insightItems ?? [];
    const order: InsightCategory[] = ["spending", "debt", "security", "habits"];
    const map = new Map<InsightCategory, InsightItem[]>();
    order.forEach((cat) => map.set(cat, []));
    items.forEach((item) => {
      const list = map.get(item.category);
      if (list) list.push(item);
      else map.set(item.category, [item]);
    });
    order.forEach((cat) => {
      const list = map.get(cat)!;
      list.sort(
        (a, b) =>
          ["high", "medium", "low"].indexOf(a.priority) -
          ["high", "medium", "low"].indexOf(b.priority)
      );
    });
    return order.map((cat) => ({ category: cat, items: map.get(cat) ?? [] })).filter((g) => g.items.length > 0);
  }, [apiData?.insightItems]);

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case "spending":
        return t("spendingActions");
      case "debt":
        return t("debtActions");
      case "security":
        return t("securityActions");
      case "habits":
        return t("habits");
      default:
        return category;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "spending":
        return <Wallet className="h-5 w-5" />;
      case "debt":
        return <CreditCard className="h-5 w-5" />;
      case "security":
        return <Shield className="h-5 w-5" />;
      default:
        return <Lightbulb className="h-5 w-5" />;
    }
  };

  const getCategoryIconColor = (category: string) => {
    switch (category) {
      case "spending":
        return "text-blue-600 dark:text-blue-400";
      case "debt":
        return "text-purple-600 dark:text-purple-400";
      case "security":
        return "text-emerald-600 dark:text-emerald-400";
      default:
        return "text-muted-foreground";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high":
        return t("highImpact");
      case "medium":
        return t("mediumImpact");
      case "low":
        return t("lowImpact");
      default:
        return priority;
    }
  };

  const hasAnyInsights =
    (apiData?.insightItems?.length ?? 0) > 0 ||
    fallbackAlerts.length > 0 ||
    suggestions.length > 0;

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">{t("description")}</p>

      {/* Hero / Panorama */}
      <div className="rounded-lg border border-border bg-card p-6">
        {loading ? (
          <div className="flex items-center gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin flex-shrink-0" />
            <span className="text-sm">{t("loading")}</span>
          </div>
        ) : error ? (
          <p className="text-sm text-muted-foreground">{t("errorLoading")}</p>
        ) : apiData?.panorama ? (
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm leading-relaxed text-foreground">
              {apiData.panorama}
            </p>
          </div>
        ) : (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {financialHealth?.message ?? t("panoramaFallback")}
          </p>
        )}
      </div>

      {/* Key numbers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            {t("income")}
          </p>
          <p className="text-lg font-semibold text-foreground">
            {formatMoney(displayIncome)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            {t("expenses")}
          </p>
          <p className="text-lg font-semibold text-foreground">
            {formatMoney(displayExpenses)}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            {t("savingsRate")}
          </p>
          <p className="text-lg font-semibold text-foreground">
            {displaySavingsRate.toFixed(1)}%
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            {t("debtLoad")}
          </p>
          <p className="text-lg font-semibold text-foreground">
            {displayIncome > 0 ? `${debtLoadPercent.toFixed(0)}%` : "—"}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 sm:col-span-2 sm:col-start-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
            {t("emergencyFund")}
          </p>
          <p className="text-lg font-semibold text-foreground">
            {displayEmergencyMonths.toFixed(1)} {t("monthsOfExpenses")}
          </p>
        </div>
      </div>

      {/* Spair Score */}
      {financialHealth && (
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-start justify-between gap-8 mb-6">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                {t("currentSpairScore")}
              </p>
              <div className="flex items-baseline gap-2 mb-1">
                <p className="text-5xl font-bold text-foreground">
                  {financialHealth.score}
                </p>
                <span className="text-base font-medium text-muted-foreground">
                  / 100
                </span>
              </div>
              <p className="text-base font-medium text-foreground">
                {financialHealth.classification}
              </p>
            </div>
            {financialHealth.message && (
              <div className="flex-1 max-w-md">
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {financialHealth.message}
                </p>
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-8 pt-6 border-t border-border">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                {t("spendingDiscipline")}
              </p>
              <p className="text-base font-semibold text-foreground">
                {financialHealth.spendingDiscipline}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                {t("debtExposure")}
              </p>
              <p className="text-base font-semibold text-foreground">
                {financialHealth.debtExposure}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                {t("emergencyFund")}
              </p>
              <p className="text-base font-semibold text-foreground">
                {emergencyFundMonths.toFixed(1)} months
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI insight blocks */}
      {!useFallbackInsights &&
        insightItemsByCategory.map(({ category, items }) => (
          <div key={category} className="space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-border">
              <div
                className={cn("flex-shrink-0", getCategoryIconColor(category))}
              >
                {getCategoryIcon(category)}
              </div>
              <h3 className="font-semibold text-lg text-foreground">
                {getCategoryTitle(category)}
              </h3>
              <span className="ml-auto text-xs text-muted-foreground">
                {t("items", { count: items.length })}
              </span>
            </div>
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-5 rounded-lg border border-border bg-card hover:border-border/80 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-0.5 text-primary">
                      <Lightbulb className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-3">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                          {getPriorityLabel(item.priority)}
                        </p>
                        <h4 className="font-semibold text-sm text-foreground">
                          {item.title}
                        </h4>
                        <p className="text-sm leading-relaxed text-muted-foreground mt-1">
                          {item.description}
                        </p>
                      </div>
                      {item.action && (
                        <div className="pt-3 border-t border-border">
                          <div className="flex items-start gap-2.5">
                            <ArrowRight className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                            <div className="flex-1">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                                {t("action")}
                              </p>
                              <p className="text-sm text-foreground leading-relaxed">
                                {item.action}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

      {/* Fallback: rule-based alerts by category */}
      {useFallbackInsights && fallbackAlerts.length > 0 && (
        <>
          {["spending", "debt", "security"].map((category) => {
            const alerts = fallbackAlerts.filter((a) => a.category === category);
            if (alerts.length === 0) return null;
            const getIconColor = (type: string) => {
              switch (type) {
                case "success":
                  return "text-sentiment-positive";
                case "warning":
                  return "text-amber-600 dark:text-amber-400";
                case "danger":
                  return "text-red-600 dark:text-red-400";
                default:
                  return "text-muted-foreground";
              }
            };
            return (
              <div key={category} className="space-y-5">
                <div className="flex items-center gap-3 pb-3 border-b border-border">
                  <div
                    className={cn(
                      "flex-shrink-0",
                      getCategoryIconColor(category)
                    )}
                  >
                    {getCategoryIcon(category)}
                  </div>
                  <h3 className="font-semibold text-lg text-foreground">
                    {getCategoryTitle(category)}
                  </h3>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {t("items", { count: alerts.length })}
                  </span>
                </div>
                <div className="space-y-4">
                  {alerts.map((alert, index) => (
                    <div
                      key={index}
                      className="p-5 rounded-lg border border-border bg-card hover:border-border/80 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            "flex-shrink-0 mt-0.5",
                            getIconColor(alert.type)
                          )}
                        >
                          {alert.icon}
                        </div>
                        <div className="flex-1 min-w-0 space-y-3">
                          <div>
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                              {alert.badge}
                            </p>
                            <p className="text-sm leading-relaxed text-foreground">
                              {alert.text}
                            </p>
                          </div>
                          {alert.action && (
                            <div className="pt-3 border-t border-border">
                              <div className="flex items-start gap-2.5">
                                <ArrowRight
                                  className={cn(
                                    "h-4 w-4 mt-0.5 flex-shrink-0",
                                    getIconColor(alert.type)
                                  )}
                                />
                                <div className="flex-1">
                                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                                    {t("action")}
                                  </p>
                                  <p className="text-sm text-foreground leading-relaxed">
                                    {alert.action}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </>
      )}

      {/* Fallback: suggestions */}
      {useFallbackInsights && suggestions.length > 0 && (
        <div className="space-y-5">
          <div className="flex items-center gap-3 pb-3 border-b border-border">
            <div className="flex-shrink-0 text-blue-600 dark:text-blue-400">
              <Lightbulb className="h-5 w-5" />
            </div>
            <h3 className="font-semibold text-lg text-foreground">
              {t("habits")}
            </h3>
            <span className="ml-auto text-xs text-muted-foreground">
              {t("items", { count: suggestions.length })}
            </span>
          </div>
          <div className="space-y-4">
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.id ?? index}
                className="p-5 rounded-lg border border-border bg-card hover:border-border/80 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-0.5 text-blue-600 dark:text-blue-400">
                    <Lightbulb className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                      {suggestion.impact === "high"
                        ? t("highImpact")
                        : suggestion.impact === "medium"
                          ? t("mediumImpact")
                          : t("lowImpact")}
                    </p>
                    <h4 className="font-semibold text-sm text-foreground">
                      {suggestion.title}
                    </h4>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {suggestion.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && !hasAnyInsights && (
        <div className="text-center py-12 px-4">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
            <CheckCircle2 className="h-8 w-8 text-sentiment-positive" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {t("greatJob")}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            {t("greatJobDescription")}
          </p>
        </div>
      )}
    </div>
  );
}
