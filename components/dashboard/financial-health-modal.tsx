"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FinancialHealthData } from "@/lib/api/financial-health";
import { formatMoney } from "@/components/common/money";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Info,
  Target,
  Lightbulb,
  LineChart,
  Shield,
  PiggyBank,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface FinancialHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: FinancialHealthData;
}

export function FinancialHealthModal({
  isOpen,
  onClose,
  data,
}: FinancialHealthModalProps) {
  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case "Excellent":
        return "text-green-600 dark:text-green-400";
      case "Good":
        return "text-blue-600 dark:text-blue-400";
      case "Fair":
        return "text-yellow-600 dark:text-yellow-400";
      case "Poor":
        return "text-orange-600 dark:text-orange-400";
      case "Critical":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-muted-foreground";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-blue-600 dark:text-blue-400";
    if (score >= 40) return "text-yellow-600 dark:text-yellow-400";
    if (score >= 20) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  const getFactorColor = (value: number) => {
    if (value >= 80) return "text-green-600 dark:text-green-400";
    if (value >= 60) return "text-blue-600 dark:text-blue-400";
    if (value >= 40) return "text-yellow-600 dark:text-yellow-400";
    if (value >= 20) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />;
      default:
        return <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "border-red-500 bg-red-50 dark:bg-red-900/10";
      case "medium":
        return "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10";
      default:
        return "border-blue-500 bg-blue-50 dark:bg-blue-900/10";
    }
  };

  const projectionData = data.futureProjection.months.map((month) => ({
    month: month.month,
    balance: month.projectedBalance,
    income: month.projectedIncome,
    expenses: month.projectedExpenses,
  }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Complete Financial Health Analysis</DialogTitle>
          <DialogDescription>
            Detailed view of your financial situation and personalized recommendations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Score Overview */}
          <div className="flex items-center justify-between p-6 rounded-lg border bg-card">
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline gap-2">
                <span className={cn("text-6xl font-bold", getScoreColor(data.score))}>
                  {data.score}
                </span>
                <span className="text-lg text-muted-foreground">/100</span>
              </div>
              <div className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full text-base font-semibold w-fit",
                getClassificationColor(data.classification)
              )}>
                {data.classification === "Excellent" && <CheckCircle2 className="h-5 w-5" />}
                {data.classification === "Critical" && <AlertTriangle className="h-5 w-5" />}
                {data.classification}
              </div>
            </div>
            <div className="text-right space-y-1">
              <p className="text-sm text-muted-foreground">Total Balance</p>
              <p className={cn(
                "text-2xl font-bold",
                data.totalBalance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              )}>
                {formatMoney(data.totalBalance)}
              </p>
            </div>
          </div>

          {/* Factors Breakdown */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <LineChart className="h-5 w-5" />
              Score Factors
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Liquidity</span>
                  </div>
                  <span className={cn("text-sm font-semibold", getFactorColor(data.factors.liquidity))}>
                    {data.factors.liquidity.toFixed(0)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {data.monthsOfReserve.toFixed(1)} months of reserve
                </p>
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all",
                      data.factors.liquidity >= 80 ? "bg-green-500" :
                      data.factors.liquidity >= 60 ? "bg-blue-500" :
                      data.factors.liquidity >= 40 ? "bg-yellow-500" :
                      data.factors.liquidity >= 20 ? "bg-orange-500" : "bg-red-500"
                    )}
                    style={{ width: `${data.factors.liquidity}%` }}
                  />
                </div>
              </div>

              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <PiggyBank className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Savings Rate</span>
                  </div>
                  <span className={cn("text-sm font-semibold", getFactorColor(data.factors.savingsRate))}>
                    {data.factors.savingsRate.toFixed(0)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {data.savingsRate.toFixed(1)}% of income
                </p>
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all",
                      data.factors.savingsRate >= 80 ? "bg-green-500" :
                      data.factors.savingsRate >= 60 ? "bg-blue-500" :
                      data.factors.savingsRate >= 40 ? "bg-yellow-500" :
                      data.factors.savingsRate >= 20 ? "bg-orange-500" : "bg-red-500"
                    )}
                    style={{ width: `${data.factors.savingsRate}%` }}
                  />
                </div>
              </div>

              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {data.spendingTrend < 0 ? (
                      <TrendingDown className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-red-600 dark:text-red-400" />
                    )}
                    <span className="text-sm font-medium">Trend</span>
                  </div>
                  <span className={cn("text-sm font-semibold", getFactorColor(data.factors.trend))}>
                    {data.factors.trend.toFixed(0)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {data.spendingTrend >= 0 ? "+" : ""}{data.spendingTrend.toFixed(1)}% in recent months
                </p>
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all",
                      data.factors.trend >= 80 ? "bg-green-500" :
                      data.factors.trend >= 60 ? "bg-blue-500" :
                      data.factors.trend >= 40 ? "bg-yellow-500" :
                      data.factors.trend >= 20 ? "bg-orange-500" : "bg-red-500"
                    )}
                    style={{ width: `${data.factors.trend}%` }}
                  />
                </div>
              </div>

              <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Future Risk</span>
                  </div>
                  <span className={cn("text-sm font-semibold", getFactorColor(data.factors.futureRisk))}>
                    {data.factors.futureRisk.toFixed(0)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {data.futureProjection.willGoNegative
                    ? `Negative in ${data.futureProjection.monthsUntilNegative} ${data.futureProjection.monthsUntilNegative === 1 ? "month" : "months"}`
                    : "Stable projection"}
                </p>
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all",
                      data.factors.futureRisk >= 80 ? "bg-green-500" :
                      data.factors.futureRisk >= 60 ? "bg-blue-500" :
                      data.factors.futureRisk >= 40 ? "bg-yellow-500" :
                      data.factors.futureRisk >= 20 ? "bg-orange-500" : "bg-red-500"
                    )}
                    style={{ width: `${data.factors.futureRisk}%` }}
                  />
                </div>
              </div>

            </div>
          </div>

          {/* Future Projection Chart */}
          {projectionData.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                Future Projection (Next 3 Months)
              </h3>
              <div className="p-4 rounded-lg border bg-card">
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsLineChart data={projectionData}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                      tickFormatter={(value) => {
                        if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
                        return `$${value}`;
                      }}
                    />
                    <Tooltip
                      formatter={(value: number) => formatMoney(value)}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="balance"
                      name="Projected Balance"
                      stroke={data.futureProjection.willGoNegative ? "#ef4444" : "#10b981"}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="income"
                      name="Income"
                      stroke="#34d399"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="expenses"
                      name="Expenses"
                      stroke="#f87171"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 4 }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Alerts */}
          {data.alerts.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Critical Points
              </h3>
              <div className="space-y-3">
                {data.alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={cn(
                      "p-4 rounded-lg border",
                      alert.severity === "critical"
                        ? "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800"
                        : alert.severity === "warning"
                        ? "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800"
                        : "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {getAlertIcon(alert.severity)}
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{alert.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {alert.description}
                        </p>
                        <div className="flex items-center gap-2 text-sm">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">Suggested action:</span>
                          <span className="text-muted-foreground">{alert.action}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {data.suggestions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                How to Improve
              </h3>
              <div className="space-y-3">
                {data.suggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className={cn(
                      "p-4 rounded-lg border",
                      getImpactColor(suggestion.impact)
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        "p-2 rounded-full",
                        suggestion.impact === "high" ? "bg-red-100 dark:bg-red-900/20" :
                        suggestion.impact === "medium" ? "bg-yellow-100 dark:bg-yellow-900/20" :
                        "bg-blue-100 dark:bg-blue-900/20"
                      )}>
                        {suggestion.impact === "high" ? (
                          <ArrowDownRight className="h-4 w-4 text-red-600 dark:text-red-400" />
                        ) : suggestion.impact === "medium" ? (
                          <ArrowUpRight className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                        ) : (
                          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{suggestion.title}</h4>
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded-full font-medium",
                            suggestion.impact === "high" ? "bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400" :
                            suggestion.impact === "medium" ? "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400" :
                            "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400"
                          )}>
                            {suggestion.impact === "high" ? "High Impact" :
                             suggestion.impact === "medium" ? "Medium Impact" : "Low Impact"}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {suggestion.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

