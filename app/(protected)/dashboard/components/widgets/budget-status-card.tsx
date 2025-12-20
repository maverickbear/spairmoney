"use client";

import { useMemo } from "react";
import { formatMoney } from "@/components/common/money";
import { calculateBudgetStatus } from "@/lib/utils/budget-utils";
import type { BudgetWithRelations } from "@/src/domain/budgets/budgets.types";
import { Button } from "@/components/ui/button";
import { Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface BudgetStatusCardProps {
  budgets: BudgetWithRelations[];
}

export function BudgetStatusCard({ budgets }: BudgetStatusCardProps) {
  // Calculate budget statuses and sort by percentage (highest first)
  const budgetsWithStatus = useMemo(() => {
    return budgets
      .map((budget) => {
        const actualSpend = budget.actualSpend || 0;
        const amount = budget.amount || 0;
        const { status, percentage } = calculateBudgetStatus(amount, actualSpend);

        return {
          ...budget,
          status,
          percentage,
          displayName: budget.displayName || budget.category?.name || "Unknown",
        };
      })
      .sort((a, b) => (b.percentage || 0) - (a.percentage || 0))
      .slice(0, 5); // Show top 5 budgets
  }, [budgets]);

  // Calculate weekly spending caps for over-budget categories
  const recommendation = useMemo(() => {
    // Filter budgets that are at or over 100% (regardless of status calculation)
    const overBudgetCategories = budgetsWithStatus.filter(
      (b) => (b.percentage || 0) >= 100
    );

    if (overBudgetCategories.length === 0) {
      return null;
    }

    // Calculate weekly cap: monthly budget / 4 (approximate weekly amount)
    const recommendations = overBudgetCategories.slice(0, 2).map((budget) => {
      const monthlyBudget = budget.amount || 0;
      const weeklyCap = Math.round(monthlyBudget / 4); // Approximate weekly cap
      return {
        name: budget.displayName,
        weeklyCap,
      };
    });

    if (recommendations.length === 0) {
      return null;
    }

    const recommendationText =
      recommendations.length === 1
        ? `Set weekly spending cap for ${recommendations[0].name} (${formatMoney(recommendations[0].weeklyCap)}) to stay on track.`
        : `Set weekly spending caps for ${recommendations[0].name} (${formatMoney(recommendations[0].weeklyCap)}) and ${recommendations[1].name} (${formatMoney(recommendations[1].weeklyCap)}) to stay on track.`;

    return {
      text: recommendationText,
      categories: recommendations,
    };
  }, [budgetsWithStatus]);

  if (budgets.length === 0) {
    return (
      <div className="border border-border rounded-lg p-4 bg-transparent">
        <div className="text-base font-semibold text-foreground mb-4">Budget status by category</div>
        <div className="text-center py-6 text-muted-foreground">
          <p className="text-sm">No budgets found.</p>
          <Link href="/budgets" className="text-xs underline hover:text-foreground mt-1 block">
            Create budgets to track your spending
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-border rounded-lg p-4 bg-transparent">
      {/* Title */}
      <div className="text-base font-semibold text-foreground mb-4">Budget status by category</div>

      {/* Budget List */}
      <div className="space-y-3.5 mb-4">
        {budgetsWithStatus.map((budget) => {
          const percentage = budget.percentage || 0;
          const isOverBudget = percentage >= 100;
          const displayPercentage = Math.round(percentage);

          return (
            <div key={budget.id} className="space-y-1.5">
              {/* Category Name and Percentage */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{budget.displayName}</span>
                <span
                  className={cn(
                    "text-sm font-medium",
                    isOverBudget ? "text-orange-600 dark:text-orange-500" : "text-muted-foreground"
                  )}
                >
                  {displayPercentage}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    isOverBudget
                      ? "bg-orange-600 dark:bg-orange-500"
                      : "bg-foreground"
                  )}
                  style={{
                    width: `${Math.min(percentage, 100)}%`,
                  }}
                />
                {percentage > 100 && (
                  <div
                    className="absolute top-0 h-full rounded-full bg-orange-600 dark:bg-orange-500 opacity-50"
                    style={{
                      width: `${((percentage - 100) / percentage) * 100}%`,
                      left: "100%",
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Recommendation Section - Always show if there are over-budget categories */}
      {recommendation ? (
        <div className="bg-muted/50 rounded-lg p-3.5 space-y-2.5">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-foreground" />
            <span className="text-sm font-semibold text-foreground">Recommendation</span>
          </div>
          <p className="text-sm text-foreground">{recommendation.text}</p>
          <Link href="/budgets">
            <Button
              variant="outline"
              size="small"
              className="w-full border-border bg-background hover:bg-muted text-sm"
            >
              Set caps
            </Button>
          </Link>
        </div>
      ) : budgetsWithStatus.some((b) => (b.percentage || 0) >= 100) ? (
        // Fallback: show recommendation even if calculation didn't work
        <div className="bg-muted/50 rounded-lg p-3.5 space-y-2.5">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-foreground" />
            <span className="text-sm font-semibold text-foreground">Recommendation</span>
          </div>
          <p className="text-sm text-foreground">
            Review your budgets to stay on track.
          </p>
          <Link href="/budgets">
            <Button
              variant="outline"
              size="small"
              className="w-full border-border bg-background hover:bg-muted text-sm"
            >
              Set caps
            </Button>
          </Link>
        </div>
      ) : null}
    </div>
  );
}

