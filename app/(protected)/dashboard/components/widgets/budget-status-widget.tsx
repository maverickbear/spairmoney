"use client";

import { useMemo } from "react";
import { BudgetExecutionChart } from "@/components/charts/budget-execution-chart";
import { formatMoney } from "@/components/common/money";
import { calculateBudgetStatus } from "@/lib/utils/budget-utils";
import type { BudgetWithRelations } from "@/src/domain/budgets/budgets.types";
import Link from "next/link";

interface BudgetStatusWidgetProps {
  budgets: BudgetWithRelations[];
}

export function BudgetStatusWidget({
  budgets,
}: BudgetStatusWidgetProps) {
  // Calculate budget statuses
  const budgetsWithStatus = useMemo(() => {
    return budgets.map((budget) => {
      const actualSpend = budget.actualSpend || 0;
      const amount = budget.amount || 0;
      const { status } = calculateBudgetStatus(amount, actualSpend);
      const percentage = amount > 0 ? (actualSpend / amount) * 100 : 0;
      
      return {
        ...budget,
        status,
        percentage,
        remaining: Math.max(0, amount - actualSpend),
        overBudget: Math.max(0, actualSpend - amount),
      };
    });
  }, [budgets]);

  // Group by status
  const byStatus = useMemo(() => {
    const grouped = {
      over: budgetsWithStatus.filter((b) => b.status === "over"),
      warning: budgetsWithStatus.filter((b) => b.status === "warning"),
      onTrack: budgetsWithStatus.filter((b) => b.status === "ok"),
    };
    return grouped;
  }, [budgetsWithStatus]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalBudgeted = budgets.reduce((sum, b) => sum + (b.amount || 0), 0);
    const totalSpent = budgets.reduce((sum, b) => sum + (b.actualSpend || 0), 0);
    const totalRemaining = totalBudgeted - totalSpent;
    const overallPercentage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

    return {
      totalBudgeted,
      totalSpent,
      totalRemaining,
      overallPercentage,
    };
  }, [budgets]);

  // Prepare data for chart
  const chartData = useMemo(() => {
    return budgetsWithStatus.map((budget) => ({
      category: budget.displayName || budget.category?.name || "Unknown",
      percentage: budget.percentage,
    }));
  }, [budgetsWithStatus]);

  // Get budgets needing attention
  const needsAttention = useMemo(() => {
    return [...byStatus.over, ...byStatus.warning]
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5);
  }, [byStatus]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground mb-1">Total Budgeted</div>
          <div className="text-2xl font-bold text-foreground">{formatMoney(totals.totalBudgeted)}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {budgets.length} {budgets.length === 1 ? "budget" : "budgets"}
          </div>
        </div>
        <div className="border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground mb-1">Total Spent</div>
          <div className="text-2xl font-bold text-foreground">{formatMoney(totals.totalSpent)}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {totals.overallPercentage.toFixed(1)}% used
          </div>
        </div>
        <div className="border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground mb-1">Remaining</div>
          <div
            className={`text-2xl font-bold ${
              totals.totalRemaining >= 0 ? "text-sentiment-positive" : "text-sentiment-negative"
            }`}
          >
            {formatMoney(totals.totalRemaining)}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {totals.totalRemaining >= 0 ? "Available" : "Over budget"}
          </div>
        </div>
        <div className="border border-border rounded-lg p-4">
          <div className="text-xs text-muted-foreground mb-1">Status</div>
          <div className="text-2xl font-bold text-foreground">
            {byStatus.over.length + byStatus.warning.length === 0 ? (
              <span className="text-sentiment-positive">All Good</span>
            ) : (
              <span className="text-sentiment-warning">
                {byStatus.over.length + byStatus.warning.length} Issues
              </span>
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {byStatus.over.length} over, {byStatus.warning.length} warning
          </div>
        </div>
      </div>

      {/* Budget Execution Chart */}
      {chartData.length > 0 && (
        <BudgetExecutionChart data={chartData} />
      )}

      {/* Budgets Needing Attention */}
      {needsAttention.length > 0 && (
        <div className="border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Budgets Needing Attention</h3>
            <Link
              href="/budgets"
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Manage budgets
            </Link>
          </div>
          <div className="space-y-3">
            {needsAttention.map((budget) => {
              const displayName = budget.displayName || budget.category?.name || "Unknown";
              return (
                <div key={budget.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{displayName}</span>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          budget.status === "over"
                            ? "bg-sentiment-negative/20 text-sentiment-negative"
                            : "bg-sentiment-warning/20 text-sentiment-warning"
                        }`}
                      >
                        {budget.status === "over" ? "Over Budget" : "Warning"}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-foreground">
                      {budget.percentage.toFixed(1)}%
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {formatMoney(budget.actualSpend || 0)} of {formatMoney(budget.amount || 0)}
                      </span>
                      {budget.status === "over" ? (
                        <span className="text-sentiment-negative">
                          {formatMoney(budget.overBudget)} over
                        </span>
                      ) : (
                        <span className="text-sentiment-positive">
                          {formatMoney(budget.remaining)} remaining
                        </span>
                      )}
                    </div>
                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full transition-all ${
                          budget.status === "over"
                            ? "bg-sentiment-negative"
                            : budget.status === "warning"
                            ? "bg-sentiment-warning"
                            : "bg-sentiment-positive"
                        }`}
                        style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                      />
                      {budget.percentage > 100 && (
                        <div
                          className="absolute top-0 h-full rounded-full bg-sentiment-negative opacity-30"
                          style={{
                            width: `${((budget.percentage - 100) / budget.percentage) * 100}%`,
                            left: "100%",
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All Budgets List */}
      {budgetsWithStatus.length > 0 && (
        <div className="border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">All Budgets</h3>
            <Link
              href="/budgets"
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              View all
            </Link>
          </div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {budgetsWithStatus
              .sort((a, b) => b.percentage - a.percentage)
              .map((budget) => {
                const displayName = budget.displayName || budget.category?.name || "Unknown";
                return (
                  <div
                    key={budget.id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">
                        {displayName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatMoney(budget.actualSpend || 0)} / {formatMoney(budget.amount || 0)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          budget.status === "over"
                            ? "bg-sentiment-negative/20 text-sentiment-negative"
                            : budget.status === "warning"
                            ? "bg-sentiment-warning/20 text-sentiment-warning"
                            : "bg-sentiment-positive/20 text-sentiment-positive"
                        }`}
                      >
                        {budget.percentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {budgets.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">No budgets found.</p>
          <p className="text-xs mt-1">
            <Link href="/budgets" className="underline hover:text-foreground">
              Create budgets
            </Link>{" "}
            to track your spending.
          </p>
        </div>
      )}
    </div>
  );
}

